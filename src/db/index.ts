import mongoose from "mongoose";
export * from "./schema.ts";
export * from "./interfaces.ts";

export default function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }
  if (process.env?.production === "true") {
    return mongoose.connect(process.env.MONGO_URL!);
  } else {
    return mongoose.connect(process.env.MONGO_URL_LOCAL!);
  }
}

export const db = mongoose.connection;
