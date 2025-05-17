import mongoose from "mongoose";
export * from "./schema.ts";
export * from "./interfaces.ts";

export default function connectDB() {
  if (!process.env.MONGO_URL && !process.env.MONGO_URL_LOCAL) {
    console.error("Please provide MONGO_URL and MONGO_URL_LOCAL");
    return;
  }
  if (mongoose.connection.readyState === 1) {
    console.log("Already connected to MongoDB");
    return Promise.resolve();
  }
  if (process.env?.production === "true") {
    console.log("Connecting to MongoDB");
    return mongoose.connect(process.env.MONGO_URL!);
  } else {
    console.log("Connecting to MongoDB Local");
    return mongoose.connect(process.env.MONGO_URL_LOCAL!);
  }
}

export const db = mongoose.connection;
