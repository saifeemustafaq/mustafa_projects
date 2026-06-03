"use server";

import { getSession } from "@/lib/auth";
import {
  createProject as createProjectDb,
  deleteProject as deleteProjectDb,
  reorderProject as reorderProjectDb,
  reorderProjectsById as reorderProjectsByIdDb,
  updateProject as updateProjectDb,
  type CreateProjectInput,
} from "@/lib/models/Project";

export type CreateProjectResult =
  | { success: true }
  | { success: false; error: string };

export type UpdateProjectResult =
  | { success: true }
  | { success: false; error: string };

export type DeleteProjectResult =
  | { success: true }
  | { success: false; error: string };

export type ReorderProjectResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Read the gallery `imageUrls` JSON from formData, trimming and dropping empties.
 * Falls back to the legacy single `imageUrl` field if the JSON is missing/invalid.
 */
function parseImageUrls(formData: FormData): string[] {
  const raw = formData.get("imageUrls");
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((u) => (typeof u === "string" ? u.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      // fall through to legacy single-url handling
    }
  }
  const legacy = (formData.get("imageUrl") as string)?.trim();
  return legacy ? [legacy] : [];
}

export async function reorderProject(
  projectId: string,
  direction: "up" | "down"
): Promise<ReorderProjectResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to reorder projects." };
  }
  if (!projectId?.trim()) {
    return { success: false, error: "Project ID is required." };
  }
  try {
    const ok = await reorderProjectDb(projectId.trim(), direction);
    return ok ? { success: true } : { success: false, error: "Could not reorder (already first or last)." };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to reorder project." };
  }
}

export type ReorderProjectsResult =
  | { success: true }
  | { success: false; error: string };

export async function reorderProjects(
  orderedIds: string[]
): Promise<ReorderProjectsResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to reorder projects." };
  }
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { success: false, error: "Ordered IDs are required." };
  }
  try {
    const ok = await reorderProjectsByIdDb(orderedIds);
    return ok ? { success: true } : { success: false, error: "Failed to reorder projects." };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to reorder projects." };
  }
}

export async function createProject(
  _prev: unknown,
  formData: FormData
): Promise<CreateProjectResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to add projects." };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  if (!name || !description) {
    return { success: false, error: "Name and description are required." };
  }

  const imageUrls = parseImageUrls(formData);

  const input: CreateProjectInput = {
    name,
    description,
    imageUrls,
    imageUrl: imageUrls[0],
    prdUrl: (formData.get("prdUrl") as string)?.trim() || undefined,
    pptUrl: (formData.get("pptUrl") as string)?.trim() || undefined,
    githubUrl: (formData.get("githubUrl") as string)?.trim() || undefined,
    demoUrl: (formData.get("demoUrl") as string)?.trim() || undefined,
    prdEnabled: formData.get("prdEnabled") === "on",
    pptEnabled: formData.get("pptEnabled") === "on",
    githubEnabled: formData.get("githubEnabled") === "on",
    demoEnabled: formData.get("demoEnabled") === "on",
  };

  try {
    await createProjectDb(input);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to add project." };
  }
}

export async function updateProject(
  _prev: unknown,
  formData: FormData
): Promise<UpdateProjectResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to edit projects." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  if (!projectId) {
    return { success: false, error: "Project ID is required." };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  if (!name || !description) {
    return { success: false, error: "Name and description are required." };
  }

  const imageUrls = parseImageUrls(formData);

  const input: CreateProjectInput = {
    name,
    description,
    imageUrls,
    imageUrl: imageUrls[0] ?? "",
    prdUrl: (formData.get("prdUrl") as string)?.trim() || undefined,
    pptUrl: (formData.get("pptUrl") as string)?.trim() || undefined,
    githubUrl: (formData.get("githubUrl") as string)?.trim() || undefined,
    demoUrl: (formData.get("demoUrl") as string)?.trim() || undefined,
    prdEnabled: formData.get("prdEnabled") === "on",
    pptEnabled: formData.get("pptEnabled") === "on",
    githubEnabled: formData.get("githubEnabled") === "on",
    demoEnabled: formData.get("demoEnabled") === "on",
  };

  try {
    const updated = await updateProjectDb(projectId, input);
    return updated ? { success: true } : { success: false, error: "Project not found." };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update project." };
  }
}

export async function deleteProject(projectId: string): Promise<DeleteProjectResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to delete projects." };
  }

  if (!projectId?.trim()) {
    return { success: false, error: "Project ID is required." };
  }

  try {
    const deleted = await deleteProjectDb(projectId.trim());
    return deleted ? { success: true } : { success: false, error: "Project not found." };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to delete project." };
  }
}
