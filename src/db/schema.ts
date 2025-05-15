import mongoose, { Schema } from "mongoose";
import type { ICart, ICartItem, IProduct, IUser } from "./interfaces.ts"; // Make sure all relevant interfaces are imported

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
      enum: ["USER", "ADMIN", "SELLER"], // Standardized, added SELLER
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
    credit: { type: Number, required: true, default: 0, min: 0 },
    language: { type: String },
    currencyCode: { type: String },
    countryCode: { type: String },
    cityName: { type: String },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId }, // Reference variant if applicable
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // Store price to handle potential price changes
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    appliedCouponCode: { type: String, ref: "Coupon" },
    discountAmount: { type: Number },
  },
  { timestamps: true }, // Tracks when the cart was last updated
);

export const Cart = mongoose.model<ICart>("Cart", cartSchema);

// --- Product (Product) Schema ---

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, index: true },
    imageLinks: { type: [String], required: true, default: [] }, // Ensure at least one image?
    description: { type: String, required: true },
    details: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE", "DRAFT", "OUT_OF_STOCK", "ARCHIVED"], // Enhanced statuses
      default: "DRAFT",
      index: true,
    },
    stars: {
      // Average rating
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    price: { type: Number, required: true, min: 0, index: true },

    tags: { type: [String], default: [], index: true },

    userId: {
      // Owner of the product (usually same as shop owner)
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    numberInStock: { type: Number, default: 1, min: 0 }, // Total stock if no variants

    shopLocation: { type: [String] },
    isHotDeal: { type: Boolean, default: false },
  },
  { timestamps: true }, // Use both createdAt and updatedAt
);

// Text index for full-text search
productSchema.index({ title: "text", description: "text", tags: "text" }); // Full-text search
// Compound index for common filtering/sorting combinations
// Compound indexes for common filter combinations
productSchema.index({ categoryId: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ "delivery.freeShipping": 1, price: 1 });
productSchema.index({ shopLocation: 1, categoryId: 1 });
productSchema.index({ shopId: 1, categoryId: 1, status: 1 });
productSchema.index({ status: 1, price: 1 });
productSchema.index({ shopId: 1, status: 1, createdAt: -1 }); // Shop's products by status/date

export const Product = mongoose.model<IProduct>("Product", productSchema);
