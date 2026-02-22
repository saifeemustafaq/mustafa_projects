import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User ?? mongoose.model("User", userSchema);

const DEFAULT_ADMIN_USERNAME = "admin";

/**
 * Creates the admin user if it doesn't exist. Only runs when
 * INITIAL_ADMIN_PASSWORD is set in the environment (e.g. .env.local).
 * That file is not committed, so no password is stored in the repo.
 */
export async function ensureAdminUser(): Promise<void> {
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (!initialPassword?.trim()) return;

  await connectDb();
  const existing = await UserModel.findOne({ username: DEFAULT_ADMIN_USERNAME });
  if (existing) return;

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(initialPassword.trim(), 10);
  await UserModel.create({
    username: DEFAULT_ADMIN_USERNAME,
    passwordHash,
  });
}

export async function verifyCredentials(
  username: string,
  plainPassword: string
): Promise<boolean> {
  await connectDb();
  const user = await UserModel.findOne({ username }).lean();
  if (!user?.passwordHash) return false;

  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(plainPassword, user.passwordHash);
}

export async function setPassword(username: string, newPlainPassword: string): Promise<boolean> {
  await connectDb();
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPlainPassword, 10);
  const result = await UserModel.updateOne(
    { username },
    { $set: { passwordHash } }
  );
  return result.modifiedCount === 1;
}
