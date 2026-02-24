export type PrdUrlType = "github-md" | "google-drive-pdf" | "external";

export function detectPrdUrlType(url: string): PrdUrlType {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "github.com" &&
      parsed.pathname.endsWith(".md")
    ) {
      return "github-md";
    }
    if (
      parsed.hostname === "drive.google.com" &&
      parsed.pathname.startsWith("/file/d/")
    ) {
      return "google-drive-pdf";
    }
  } catch {
    // invalid URL
  }
  return "external";
}

/**
 * Converts a GitHub blob URL to the raw content URL.
 * e.g. github.com/user/repo/blob/main/docs/PRD.md
 *   -> raw.githubusercontent.com/user/repo/main/docs/PRD.md
 */
export function toGitHubRawUrl(url: string): string {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/");
  // parts: ['', user, repo, 'blob', branch, ...path]
  const blobIndex = parts.indexOf("blob");
  if (blobIndex === -1) return url;
  const before = parts.slice(1, blobIndex); // [user, repo]
  const after = parts.slice(blobIndex + 1); // [branch, ...path]
  return `https://raw.githubusercontent.com/${before.join("/")}/${after.join("/")}`;
}

/**
 * Converts a Google Drive share/view URL to an embeddable preview URL.
 * e.g. drive.google.com/file/d/{id}/view -> drive.google.com/file/d/{id}/preview
 */
export function toGoogleDriveEmbedUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (!match) return url;
  return `https://drive.google.com/file/d/${match[1]}/preview`;
}
