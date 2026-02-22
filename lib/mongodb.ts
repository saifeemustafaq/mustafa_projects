import mongoose from "mongoose";

function getMongoDbUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please set MONGODB_URI in .env.local. MongoDB is required to load projects."
    );
  }
  return uri;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongoose ?? { conn: null, promise: null };
if (process.env.NODE_ENV !== "production") {
  globalThis.mongoose = cached;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoDbUri());
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
