/**
 * Set or reset the admin user's password in MongoDB.
 * Creates the admin user if it doesn't exist.
 *
 * Safe to commit: the script cannot change any password without the correct
 * MONGODB_URI. That value lives in .env.local (or your env), which is not
 * in the repo. Only you (with access to your MongoDB) can run this successfully.
 *
 * Usage (from project root):
 *   node scripts/reset-password.js <new-password>
 *   NEW_PASSWORD=xxx node scripts/reset-password.js
 */

const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

const newPassword = process.env.NEW_PASSWORD || process.argv[2];
if (!newPassword) {
  console.error("Usage: node scripts/reset-password.js <new-password>");
  console.error("   or: NEW_PASSWORD=xxx node scripts/reset-password.js");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error(
    "MONGODB_URI is not set. Add it to .env.local (this file is not committed). " +
      "Without it, this script cannot access your database."
  );
  process.exit(1);
}

async function main() {
  const mongoose = require("mongoose");
  const bcrypt = require("bcryptjs");

  await mongoose.connect(process.env.MONGODB_URI);
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const db = mongoose.connection.db;
  const users = db.collection("users");
  const result = await users.updateOne(
    { username: "admin" },
    {
      $set: { passwordHash, updatedAt: new Date() },
      $setOnInsert: { username: "admin", createdAt: new Date() },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log("Admin user created with the given password.");
  } else {
    console.log("Password for user 'admin' has been reset.");
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
