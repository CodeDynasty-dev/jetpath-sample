import mongoose, { Document } from "mongoose";

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

// --- Cart Schema ---
// Interface for embedded cart item sub-document
export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId; // If using variants
  quantity: number;
  price: number;
  addedAt: Date;
}

// Interface specifically for the Mongoose Cart Document
export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  appliedCouponCode?: string;
  discountAmount?: number;
  createdAt: Date; // Added from timestamps
  updatedAt: Date; // Added from timestamps
}

// --- Product (Product) Schema ---
// Interface specifically for the Mongoose Product Document
export interface IProduct extends Document {
  title: string;
  imageLinks: string[];
  description: string;
  details: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED";
  stars: number;
  price: number;
  userId: mongoose.Types.ObjectId;
  numberInStock: number; // Total stock if no variants
  shipping: {
    freeShipping: boolean;
    fastShipping: boolean;
    shipsToCountry: string;
  };
  brand: string;
  attributes: Record<string, string | number>;
  tags: string[];
  shopLocation: string[];
  isHotDeal: boolean;
  createdAt: Date; // Added from timestamps
  updatedAt: Date; // Added from timestamps
}
