"use server";

import { getSession } from "@/lib/auth";

export type UploadImageResult =
  | { success: true; url: string }
  | { success: false; error: string };

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
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

export async function uploadImageToGitHub(
  formData: FormData,
): Promise<UploadImageResult> {
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

  const file = formData.get("file") as File | null;
  const folderName = (formData.get("folderName") as string)?.trim();
  const fileName = (formData.get("fileName") as string)?.trim();

  if (!file || file.size === 0) {
    return { success: false, error: "No file selected." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File must be under 5 MB." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only image files are allowed." };
  }
  if (!folderName || !SAFE_NAME_RE.test(folderName)) {
    return { success: false, error: "Folder name must be alphanumeric (hyphens and underscores allowed)." };
  }
  if (!fileName) {
    return { success: false, error: "File name is required." };
  }

  const ext = fileName.includes(".") ? "" : `.${file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png"}`;
  const finalFileName = `${fileName}${ext}`;

  if (!SAFE_NAME_RE.test(finalFileName.replace(/\.[^.]+$/, ""))) {
    return { success: false, error: "File name must be alphanumeric (hyphens and underscores allowed)." };
  }

  const { token, owner, repo } = config;
  const filePath = `public/${folderName}/${finalFileName}`;
  const branchName = `image-upload-${Date.now()}`;

  const arrayBuffer = await file.arrayBuffer();
  const base64Content = Buffer.from(arrayBuffer).toString("base64");

  try {
    // 1. Get the SHA of main branch
    const refRes = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/main`, token);
    if (!refRes.ok) {
      return { success: false, error: "Failed to read main branch from GitHub." };
    }
    const refData = await refRes.json();
    const mainSha: string = refData.object.sha;

    // 2. Create a new branch
    const createBranchRes = await ghFetch(`/repos/${owner}/${repo}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
    });
    if (!createBranchRes.ok) {
      return { success: false, error: "Failed to create branch on GitHub." };
    }

    try {
      // 3. Upload the file to the new branch
      const uploadRes = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `Add image ${filePath}`,
          content: base64Content,
          branch: branchName,
        }),
      });
      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => null);
        if (uploadRes.status === 422) {
          return { success: false, error: `A file already exists at ${filePath}. Choose a different folder or file name.` };
        }
        return { success: false, error: uploadErr?.message ?? "Failed to upload file to GitHub." };
      }

      // 4. Create a pull request
      const prRes = await ghFetch(`/repos/${owner}/${repo}/pulls`, token, {
        method: "POST",
        body: JSON.stringify({
          title: `Add image: ${folderName}/${finalFileName}`,
          head: branchName,
          base: "main",
          body: `Automated PR to add project image \`${filePath}\`.`,
        }),
      });
      if (!prRes.ok) {
        return { success: false, error: "Failed to create pull request on GitHub." };
      }
      const prData = await prRes.json();
      const prNumber: number = prData.number;

      // 5. Merge the pull request
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
      // 6. Clean up the branch (best effort)
      await ghFetch(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, token, {
        method: "DELETE",
      }).catch(() => {});
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${filePath}`;
    return { success: true, url: rawUrl };
  } catch (err) {
    console.error("GitHub image upload failed:", err);
    return { success: false, error: "An unexpected error occurred during upload." };
  }
}
