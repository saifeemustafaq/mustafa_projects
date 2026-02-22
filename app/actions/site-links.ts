"use server";

import { getSession } from "@/lib/auth";
import { updateSiteLinks as updateSiteLinksDb } from "@/lib/models/SiteLinks";

export type UpdateSiteLinksResult =
  | { success: true }
  | { success: false; error: string };

export async function updateSiteLinks(
  linkedinUrl: string,
  githubUrl: string
): Promise<UpdateSiteLinksResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to edit site links." };
  }

  try {
    await updateSiteLinksDb({
      linkedinUrl: linkedinUrl.trim(),
      githubUrl: githubUrl.trim(),
    });
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update links." };
  }
}
