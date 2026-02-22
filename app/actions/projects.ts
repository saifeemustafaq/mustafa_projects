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

  const input: CreateProjectInput = {
    name,
    description,
    imageUrl: (formData.get("imageUrl") as string)?.trim() || undefined,
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

  const input: CreateProjectInput = {
    name,
    description,
    imageUrl: (formData.get("imageUrl") as string)?.trim() || undefined,
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
