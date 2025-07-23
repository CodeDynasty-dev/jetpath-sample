import mongoose, { Schema } from "mongoose";
import type { IUser } from "./interfaces.ts";

// --- User Schema ---

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true, // Added trim
      index: true,
    },
    phone: { type: String, index: true, sparse: true }, // Added sparse index for optional unique phone
    password: { type: String, required: true }, // Hide password by default
    otp: { type: String },
    tempTokenExpiredAt: { type: Date },
    stateOfResidence: { type: String },
    educationLevel: { type: String },
    birthDate: { type: Date },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
    }, // Expanded enum
    imageLink: { type: String },
    role: {
      type: String,
      required: true,
      enum: ["USER", "ADMIN"], // Standardized, added SELLER
      default: "USER",
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"], // Enhanced statuses
      default: "PENDING_VERIFICATION",
      index: true,
    },
    language: { type: String },
    currencyCode: { type: String },
    countryCode: { type: String },
    cityName: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
