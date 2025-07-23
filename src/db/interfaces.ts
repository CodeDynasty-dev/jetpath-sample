import { Document } from "mongoose";

// --- User Schema ---
// Interface specifically for the Mongoose User Document
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  otp?: string;
  tempTokenExpiredAt?: Date;
  stateOfResidence?: string;
  educationLevel?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  birthDate?: Date;
  howDidYouHearAboutUs?: string;
  emailVerified: boolean;
  imageLink?: string;
  role: "USER" | "ADMIN" | "SELLER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  credit: number;
  language?: string;
  currencyCode?: string;
  countryCode?: string;
  cityName?: string;
  createdAt: Date; // Added from timestamps
  updatedAt: Date; // Added from timestamps
}
