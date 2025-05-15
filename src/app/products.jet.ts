import { type JetFunc, use } from "jetpath";
import mongoose from "mongoose";
import { Product } from "../db/schema.ts";
import { type IProduct } from "../db/interfaces.ts";

export const GET_products: JetFunc<{ params: { id: string } }> = async (
  ctx
) => {
  if (typeof ctx.params?.id === "string") {
    const product = await Product.findOne({ id: ctx.params.id });
    ctx.send({ data: product, ok: true });
    return;
  } else {
    ctx.throw(404, "not found!");
  }
};

export const POST_products: JetFunc<{ body: IProduct }> = async (ctx) => {
  const data = ctx.body;
  data.userId = ctx.state.user._id as mongoose.Types.ObjectId;
  const product = await Product.create(data);
  ctx.send({ data: product, ok: true });
};

use(POST_products).body((t) => {
  return {
    title: t.string(),
    description: t.string(),
    price: t.number(),
    images: t.array(t.string()),
    tags: t.array(t.string()),
    hotDeals: t.boolean(),
  };
});

export const PUT_products: JetFunc<{
  body: IProduct;
  params: { id: string };
}> = async (ctx) => {
  const data = ctx.body;
  const product = await Product.findOne({ id: ctx.params.id });
  if (!product) {
    ctx.throw(404, "Product not found!");
    return;
  }
  Object.assign(product, data);
  await product.save();
  ctx.send({ data: product, ok: true });
};

use(PUT_products).body((t) => {
  return {
    title: t.string(),
    description: t.string(),
    price: t.number(),
    images: t.array(t.string()),
    tags: t.array(t.string()),
    hotDeals: t.boolean(),
  };
});

export const DELETE_products: JetFunc<{ params: { id: string } }> = async (
  ctx
) => {
  if (typeof ctx.params?.id === "string") {
    const product = await Product.findOne({ id: ctx.params.id });
    if (!product) {
      ctx.throw(404, "Product not found!");
      return;
    }
    await product.deleteOne();
    ctx.send({ ok: true });
    return;
  } else {
    ctx.throw(404, "not found!");
  }
};

interface ProductFilters {
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  shipping: {
    freeShipping: boolean;
    fastShipping: boolean;
    shipsToCountry: string;
  };
  sellerLocation: string;
  sellerRating: {
    topRated: boolean;
    verifiedSeller: boolean;
    positiveFeedback: number;
  };
  deliveryTime: {
    ships7Days: boolean;
    ships30Days: boolean;
    estimatedDelivery: number;
    specificDeliveryTime: string;
  };
  brand: string;
  attributes: Record<string, string | number>;
  newArrivals: boolean;
  hotDeals: boolean;
  discounted: boolean;
  coupons: boolean;
  buyerProtection: {
    secureTransactions: boolean;
    buyerProtectionPrograms: boolean;
  };
  customerReviews: {
    starRating: number;
    verifiedReviews: boolean;
  };
  subCategory: string;
  sort: string;
  time: "this week" | "this month" | "this year" | "all time";
  shopId: string;
  deliveryType: string;
  discountType: string;
  discountValue: number;
  coupon: string;
  verifiedSeller: boolean;
  freeShipping: boolean;
  shippingTo: string;
  tags: string[];
  searchQuery: string;
  page: number;
  promoted: boolean;
}
//? Advanced search filter you can let the user use to search for products
export const GET_products_by_filters: JetFunc<{
  query: Partial<ProductFilters>;
}> = async (ctx) => {
  const filters = ctx.query;
  const query: any = {};
  const andConditions = [];

  // Category Filter
  if (filters.category) {
    query.categoryId = new mongoose.Types.ObjectId(filters.category);
  }

  // Shop Filter
  if (filters.shopId) {
    query.shopId = new mongoose.Types.ObjectId(filters.shopId);
  }

  // Price Range
  if (filters.priceRange) {
    const priceRange: any = {};
    if (filters.priceRange.min !== undefined) {
      priceRange.$gte = filters.priceRange.min;
    }
    if (filters.priceRange.max !== undefined) {
      priceRange.$lte = filters.priceRange.max;
    }
    if (Object.keys(priceRange).length) query.price = priceRange;
  }

  // Shipping Filters
  if (filters.shipping?.freeShipping) {
    query["delivery.freeShipping"] = true;
  }
  if (filters.shipping?.fastShipping) {
    andConditions.push({ "delivery.estimatedDeliveryTime": { $lte: 3 } });
  }
  if (filters.shipping?.shipsToCountry) {
    query["delivery.locations"] = filters.shipping.shipsToCountry;
  }

  // Seller Location
  const sellerLocations = [];
  if (filters.sellerLocation?.length) {
    sellerLocations.push(filters.sellerLocation);
  }
  // Promoted Filter
  if (filters.promoted) {
    query.promoted = true;
  }
  if (filters.newArrivals) {
    query.newArrivals = true;
  }
  if (filters.hotDeals) {
    query.hotDeals = true;
  }
  // deals
  if (filters.discounted && filters.discountType === "PERCENTAGE") {
    query["discount.type"] = "PERCENTAGE";
  }
  if (filters.discounted && filters.discountType === "FLAT") {
    query["discount.type"] = "FLAT";
  }
  if (filters.coupons) {
    query["discount.coupon"] = { $exists: true };
  }
  if (sellerLocations.length) {
    query.shopLocation = { $in: sellerLocations };
  }

  // Ratings and Reviews
  if (filters.sellerRating?.topRated) {
    andConditions.push({ stars: { $gte: 4.5 } });
  }
  if (filters.customerReviews?.starRating) {
    andConditions.push({ stars: { $gte: filters.customerReviews.starRating } });
  }
  if (filters.sellerRating?.positiveFeedback) {
    andConditions.push({
      reviewCount: { $gte: filters.sellerRating.positiveFeedback },
    });
  }

  // Delivery Time
  if (filters.deliveryTime?.ships7Days) {
    andConditions.push({ "delivery.estimatedDeliveryTime": { $lte: 7 } });
  }
  if (filters.deliveryTime?.ships30Days) {
    andConditions.push({ "delivery.estimatedDeliveryTime": { $lte: 30 } });
  }

  // Brand and Attributes
  if (filters.brand) {
    andConditions.push({ tags: filters.brand });
  }
  if (filters.attributes) {
    Object.entries(filters.attributes).forEach(([key, value]) => {
      andConditions.push({ [`variants.attributes.${key}`]: value });
    });
  }

  // Time-based Filtering
  if (filters.time) {
    const now = new Date();
    let startDate: Date;
    switch (filters.time) {
      case "this week":
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case "this month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "this year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    andConditions.push({ createdAt: { $gte: startDate } });
  }

  // Search Query (uses MongoDB text search)
  if (filters.searchQuery) {
    query.$text = { $search: filters.searchQuery };
  }

  // Combine all AND conditions
  if (andConditions.length) {
    query.$and = andConditions;
  }

  // Sorting
  const sortOptions: any = {};
  if (filters.sort) {
    switch (filters.sort) {
      case "price_asc":
        sortOptions.price = 1;
        break;
      case "price_desc":
        sortOptions.price = -1;
        break;
      case "newest":
        sortOptions.createdAt = -1;
        break;
      case "popular":
        sortOptions.views = -1;
        break;
      case "rating":
        sortOptions.stars = -1;
        break;
    }
  }

  // Execute query with pagination (example: 50 items per page)
  const page = parseInt(ctx.query.page as any) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOptions).skip(skip).limit(limit).lean().exec(),
    Product.countDocuments(query),
  ]);

  ctx.send({
    data: {
      results: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
    ok: true,
  });
};

use(GET_products_by_filters).query((t) => {
  return {
    category: t.string(),
    priceRange: t.object({
      min: t.number(),
      max: t.number(),
    }),
    shipping: t.object({
      freeShipping: t.boolean(),
      fastShipping: t.boolean(),
      shipsToCountry: t.string(),
    }),
    sellerLocation: t.object({
      china: t.boolean(),
      usa: t.boolean(),
      europe: t.boolean(),
      other: t.boolean(),
      specificLocation: t.string(),
    }),
    sellerRating: t.object({
      topRated: t.boolean(),
      positiveFeedback: t.number(),
    }),
    deliveryTime: t.object({
      ships7Days: t.boolean(),
      ships30Days: t.boolean(),
      estimatedDelivery: t.number(),
      specificDeliveryTime: t.string(),
    }),
    brand: t.string(),
    attributes: t.object({}).shape({}),
    newArrivals: t.boolean(),
    deals: t.object({
      discounted: t.boolean(),
      coupons: t.boolean(),
    }),
    buyerProtection: t.object({
      secureTransactions: t.boolean(),
      buyerProtectionPrograms: t.boolean(),
    }),
    customerReviews: t.object({
      starRating: t.number(),
      verifiedReviews: t.boolean(),
    }),
    subCategory: t.string(),
    sort: t.string(),
    time: t.string(),
    shopId: t.string(),
    deliveryType: t.string(),
    discountType: t.string(),
    discountValue: t.number(),
    coupon: t.string(),
    verifiedSeller: t.boolean(),
    freeShipping: t.boolean(),
    shippingTo: t.string(),
    tags: t.array(t.string()),
    searchQuery: t.string(),
    page: t.number(),
  };
});
