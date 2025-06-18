import { type JetRoute, use } from "jetpath";
import mongoose from "mongoose";
import { Product } from "../db/schema.ts";
import { type IProduct } from "../db/interfaces.ts";
import { MIDDLEWARE_user } from "./users.jet.ts";

export const MIDDLEWARE_product = MIDDLEWARE_user;

export const GET_products$id: JetRoute<{ params: { id: string } }> = async (
  ctx,
) => {
  if (typeof ctx.params?.id === "string") {
    const product = await Product.findOne({ id: ctx.params.id });
    ctx.send({ data: product, ok: true });
    return;
  } else {
    ctx.plugins.throw(404, "not found!");
  }
};

export const POST_products: JetRoute<{ body: IProduct }> = async (ctx) => {
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

export const PUT_products$id: JetRoute<{
  body: IProduct;
  params: { id: string };
}> = async (ctx) => {
  const data = ctx.body;
  const product = await Product.findOne({ id: ctx.params.id });
  if (!product) {
    ctx.plugins.throw(404, "Product not found!");
    return;
  }
  Object.assign(product, data);
  await product.save();
  ctx.send({ data: product, ok: true });
};

use(PUT_products$id).body((t) => {
  return {
    title: t.string(),
    description: t.string(),
    price: t.number(),
    images: t.array(t.string()),
    tags: t.array(t.string()),
    hotDeals: t.boolean(),
  };
});

export const DELETE_products$id: JetRoute<{ params: { id: string } }> = async (
  ctx,
) => {
  if (typeof ctx.params?.id === "string") {
    const product = await Product.findOne({ id: ctx.params.id });
    if (!product) {
      ctx.plugins.throw(404, "Product not found!");
      return;
    }
    await product.deleteOne();
    ctx.send({ ok: true });
    return;
  } else {
    ctx.plugins.throw(404, "not found!");
  }
};

interface ProductFilters {
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  brand: string;
  attributes: Record<string, string | number>;
  sort: "price_asc" | "price_desc" | "newest" | "popular" | "rating";
  time: "this week" | "this month" | "this year" | "all time";
  searchQuery: string;
  page: number;
}
//? Advanced search filter you can let the user use to search for products
export const GET_products_by_filters: JetRoute<{
  query: Partial<ProductFilters>;
}> = async (ctx) => {
  const filters = ctx.query;
  const query: any = {};
  const andConditions = [];

  // Category Filter
  if (filters.category) {
    query.categoryId = new mongoose.Types.ObjectId(filters.category);
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

use(GET_products_by_filters)
  .query((t) => {
    return {
      category: t.string(),
      priceRange: t.object({
        min: t.number(),
        max: t.number(),
      }),
      brand: t.string(),
      attributes: t.object({}).shape({}),
      sort: t.string(),
      time: t.string(),
      searchQuery: t.string(),
      page: t.number(),
    };
  })
  .title(
    `
  Filters

  category: string
  priceRange: { min: number; max: number }
  brand: string
  attributes: Record<string, string | number>
  sort: "price_asc" | "price_desc" | "newest" | "popular" | "rating"
  time: "this week" | "this month" | "this year" | "all time"
  searchQuery: string
  page: number
  searchQuery
  page
  `,
  );
