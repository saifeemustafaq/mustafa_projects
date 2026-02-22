"use server";

import { ensureAdminUser, verifyCredentials } from "@/lib/models/User";
import { createSession } from "@/lib/auth";

export type LoginResult = { success: true } | { success: false; error: string };

export async function login(
  _prev: unknown,
  formData: FormData
): Promise<LoginResult> {
  await ensureAdminUser();

  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, error: "Username and password are required." };
  }

  const ok = await verifyCredentials(username, password);
  if (!ok) {
    return { success: false, error: "Invalid username or password." };
  }

  await createSession(username);
  return { success: true };
}

export async function logout(): Promise<void> {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
}
