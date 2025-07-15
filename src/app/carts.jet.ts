import { type JetRoute, use } from "jetpath";
import { Cart } from "../db/schema.ts";
import { MIDDLEWARE_user } from "./users.jet.ts";

export const MIDDLEWARE_cart = MIDDLEWARE_user;

export const GET_cart: JetRoute = async (ctx) => {
  const cart = await Cart.findOne({ userId: ctx.state.user._id });
  ctx.send({ data: cart, ok: true });
};

export const POST_cart: JetRoute = async (ctx) => {
  const data = await ctx.parse();
  const cart = await Cart.findOne({ userId: ctx.state.user._id });
  if (cart) {
    ctx.send({ data: cart, ok: true });
    return;
  }
  const newCart = await Cart.create(data);
  ctx.send({ data: newCart, ok: true });
};

use(POST_cart).body((t) => {
  return {
    productId: t.string(),
    quantity: t.number(),
    price: t.number(),
    addedAt: t.date(),
  };
});

export const PUT_cart: JetRoute = async (ctx) => {
  const data = await ctx.parse();
  const cart = await Cart.findOne({ userId: ctx.state.user._id });
  if (!cart) {
    ctx.plugins.throw(404, "Cart not found!");
    return;
  }
  Object.assign(cart, data);
  await cart.save();
  ctx.send({ data: cart, ok: true });
};

use(PUT_cart).body((t) => {
  return {
    productId: t.string(),
    quantity: t.number(),
    price: t.number(),
    addedAt: t.date(),
  };
});

export const DELETE_cart: JetRoute = async (ctx) => {
  const cart = await Cart.findOne({ userId: ctx.state.user._id });
  if (!cart) {
    ctx.plugins.throw(404, "Cart not found!");
    return;
  }
  await cart.deleteOne();
  ctx.send({ ok: true });
};

use(DELETE_cart).body((t) => {
  return {
    productId: t.string(),
    quantity: t.number(),
    price: t.number(),
    addedAt: t.date(),
  };
});
