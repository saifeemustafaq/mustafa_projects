"use server";

import { getSession } from "@/lib/auth";
import {
  updateAboutInfo as updateAboutInfoDb,
  addExperience as addExperienceDb,
  updateExperience as updateExperienceDb,
  deleteExperience as deleteExperienceDb,
  reorderExperiencesById,
} from "@/lib/models/AboutInfo";

type Result = { success: true } | { success: false; error: string };

export async function updateAboutInfo(
  photoUrl: string,
  description: string
): Promise<Result> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authorized." };
  try {
    await updateAboutInfoDb(photoUrl, description);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update about info." };
  }
}

export async function addExperience(
  company: string,
  content: string
): Promise<Result> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authorized." };
  try {
    await addExperienceDb(company, content);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to add experience." };
  }
}

export async function updateExperience(
  id: string,
  company: string,
  content: string
): Promise<Result> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authorized." };
  try {
    await updateExperienceDb(id, company, content);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update experience." };
  }
}

export async function deleteExperience(id: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authorized." };
  try {
    await deleteExperienceDb(id);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete experience." };
  }
}

export async function reorderExperiences(orderedIds: string[]): Promise<Result> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authorized." };
  try {
    const ok = await reorderExperiencesById(orderedIds);
    return ok ? { success: true } : { success: false, error: "Failed to reorder experiences." };
  } catch {
    return { success: false, error: "Failed to reorder experiences." };
  }
}
