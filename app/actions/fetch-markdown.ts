"use server";

import { detectPrdUrlType, toGitHubRawUrl } from "@/lib/prd-utils";

export async function fetchMarkdownContent(
  url: string
): Promise<{ success: true; content: string } | { success: false; error: string }> {
  if (detectPrdUrlType(url) !== "github-md") {
    return { success: false, error: "URL is not a supported GitHub markdown file" };
  }

  const rawUrl = toGitHubRawUrl(url);

  try {
    const res = await fetch(rawUrl, { next: { revalidate: 300 } });
    if (!res.ok) {
      return { success: false, error: `Failed to fetch markdown (${res.status})` };
    }
    const content = await res.text();
    return { success: true, content };
  } catch {
    return { success: false, error: "Network error while fetching markdown" };
  }
}
