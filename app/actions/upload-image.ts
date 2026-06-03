"use server";

import { getSession } from "@/lib/auth";

export type UploadImagesResult =
  | { success: true; urls: string[] }
  | { success: false; error: string };

// Per-file and per-batch limits. The batch total is kept under 5.9 MB so the
// whole upload fits in ONE Server Action request: these run as AWS Lambda
// functions on Netlify, which cap a synchronous request body at 6 MB (a hard
// platform limit, not a plan tier). The ~0.1 MB headroom absorbs multipart
// boundary overhead. Keep MAX_TOTAL_UPLOAD_SIZE < serverActions.bodySizeLimit
// in next.config.ts, and MAX_IMAGES in sync with the client uploader.
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image
const MAX_TOTAL_UPLOAD_SIZE = 5.9 * 1024 * 1024; // 5.9 MB per upload batch
const MAX_IMAGES = 5; // max images per project gallery / upload batch
const SAFE_NAME_RE = /^[a-zA-Z0-9_-]+$/;

function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) return null;
  return { token, owner, repo };
}

async function ghFetch(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

function sanitizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extForType(type: string): string {
  return `.${type.split("/")[1]?.replace("jpeg", "jpg") ?? "png"}`;
}

/**
 * Upload up to MAX_IMAGES images to the repo's `public/<folder>/` in a SINGLE
 * push. Reads `files` (multiple) and `folderName` from formData, validates the
 * batch (count ≤ 5, total < 5.9 MB, each ≤ 5 MB, all images), derives a safe
 * unique filename per file, then commits everything in one commit via the
 * GitHub Git Data API (blobs → tree → commit → branch → PR → squash-merge).
 * Returns one raw URL per file, in the order provided.
 */
export async function uploadImagesToGitHub(
  formData: FormData,
): Promise<UploadImagesResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to upload images." };
  }

  const config = getGitHubConfig();
  if (!config) {
    return {
      success: false,
      error: "GitHub integration is not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in your environment.",
    };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const folderName = (formData.get("folderName") as string)?.trim();

  if (files.length === 0) {
    return { success: false, error: "No files selected." };
  }
  if (files.length > MAX_IMAGES) {
    return { success: false, error: `You can upload at most ${MAX_IMAGES} images at a time.` };
  }
  if (!folderName || !SAFE_NAME_RE.test(folderName)) {
    return { success: false, error: "Folder name must be alphanumeric (hyphens and underscores allowed)." };
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
    return {
      success: false,
      error: "Total image size must be under 5.9 MB. Upload fewer or smaller images.",
    };
  }

  // Validate each file and derive a safe, unique filename per file.
  const usedNames = new Set<string>();
  const prepared: Array<{ path: string; content: string }> = [];
  for (const file of files) {
    if (file.size === 0) {
      return { success: false, error: "One of the selected files is empty." };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: `"${file.name}" must be under 5 MB.` };
    }
    if (!file.type.startsWith("image/")) {
      return { success: false, error: `"${file.name}" is not an image file.` };
    }

    const baseName = sanitizeName(file.name.replace(/\.[^.]+$/, "")) || "image";
    let candidate = baseName;
    let suffix = 1;
    while (usedNames.has(candidate)) {
      suffix += 1;
      candidate = `${baseName}-${suffix}`;
    }
    usedNames.add(candidate);

    const fileName = `${candidate}${extForType(file.type)}`;
    const arrayBuffer = await file.arrayBuffer();
    prepared.push({
      path: `public/${folderName}/${fileName}`,
      content: Buffer.from(arrayBuffer).toString("base64"),
    });
  }

  const { token, owner, repo } = config;
  const branchName = `image-upload-${Date.now()}`;

  try {
    // 1. SHA of the main branch
    const refRes = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/main`, token);
    if (!refRes.ok) {
      return { success: false, error: "Failed to read main branch from GitHub." };
    }
    const mainSha: string = (await refRes.json()).object.sha;

    // 2. Base tree SHA from the main commit
    const commitRes = await ghFetch(`/repos/${owner}/${repo}/git/commits/${mainSha}`, token);
    if (!commitRes.ok) {
      return { success: false, error: "Failed to read base commit from GitHub." };
    }
    const baseTreeSha: string = (await commitRes.json()).tree.sha;

    // 3. Create a blob for each file
    const treeItems: Array<{ path: string; mode: "100644"; type: "blob"; sha: string }> = [];
    for (const { path, content } of prepared) {
      const blobRes = await ghFetch(`/repos/${owner}/${repo}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "base64" }),
      });
      if (!blobRes.ok) {
        return { success: false, error: "Failed to upload image data to GitHub." };
      }
      treeItems.push({ path, mode: "100644", type: "blob", sha: (await blobRes.json()).sha });
    }

    // 4. One tree with all blobs on top of the base tree
    const treeRes = await ghFetch(`/repos/${owner}/${repo}/git/trees`, token, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    if (!treeRes.ok) {
      return { success: false, error: "Failed to create file tree on GitHub." };
    }
    const newTreeSha: string = (await treeRes.json()).sha;

    // 5. One commit pointing at the new tree
    const message =
      treeItems.length === 1
        ? `Add image ${treeItems[0].path}`
        : `Add ${treeItems.length} images to public/${folderName}`;
    const newCommitRes = await ghFetch(`/repos/${owner}/${repo}/git/commits`, token, {
      method: "POST",
      body: JSON.stringify({ message, tree: newTreeSha, parents: [mainSha] }),
    });
    if (!newCommitRes.ok) {
      return { success: false, error: "Failed to create commit on GitHub." };
    }
    const newCommitSha: string = (await newCommitRes.json()).sha;

    // 6. Branch at the new commit → PR → squash-merge
    const createBranchRes = await ghFetch(`/repos/${owner}/${repo}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: newCommitSha }),
    });
    if (!createBranchRes.ok) {
      return { success: false, error: "Failed to create branch on GitHub." };
    }

    try {
      const prRes = await ghFetch(`/repos/${owner}/${repo}/pulls`, token, {
        method: "POST",
        body: JSON.stringify({
          title: `Add ${treeItems.length} image(s): ${folderName}`,
          head: branchName,
          base: "main",
          body: `Automated PR to add project image(s) to \`public/${folderName}\`.`,
        }),
      });
      if (!prRes.ok) {
        return { success: false, error: "Failed to create pull request on GitHub." };
      }
      const prNumber: number = (await prRes.json()).number;

      const mergeRes = await ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/merge`, token, {
        method: "PUT",
        body: JSON.stringify({ merge_method: "squash" }),
      });
      if (!mergeRes.ok) {
        return {
          success: false,
          error: `PR #${prNumber} was created but could not be merged automatically. Merge it manually: https://github.com/${owner}/${repo}/pull/${prNumber}`,
        };
      }
    } finally {
      // Clean up the branch (best effort)
      await ghFetch(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, token, {
        method: "DELETE",
      }).catch(() => {});
    }

    const urls = treeItems.map(
      ({ path }) => `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${path}`,
    );
    return { success: true, urls };
  } catch (err) {
    console.error("GitHub image upload failed:", err);
    return { success: false, error: "An unexpected error occurred during upload." };
  }
}
