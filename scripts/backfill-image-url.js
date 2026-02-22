/**
 * Backfill imageUrl on all project documents in MongoDB.
 * Sets imageUrl to "" for any document that doesn't have the field.
 * Safe to run multiple times. Requires MONGODB_URI in .env.local.
 *
 * Usage (from project root):
 *   node scripts/backfill-image-url.js
 */

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Add it to .env.local");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const collection = db.collection("projects");

  const result = await collection.updateMany(
    { $or: [{ imageUrl: { $exists: false } }, { imageUrl: null }] },
    { $set: { imageUrl: "" } }
  );

  console.log(
    `Backfill complete: ${result.modifiedCount} document(s) updated with imageUrl.`
  );
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
