import { type JetFunc, use } from "jetpath";
import { Cart } from "../db/schema.ts";

export const GET_cart: JetFunc = async (ctx) => {
  const cart = await Cart.findOne({ userId: ctx.state.user._id });
  ctx.send({ data: cart, ok: true });
};

export const POST_cart: JetFunc = async (ctx) => {
  const data = ctx.body;
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

export const PUT_cart: JetFunc = async (ctx) => {
  const data = ctx.body;
  const cart = await Cart.findOne({ userId: ctx.state.user._id });
  if (!cart) {
    ctx.throw(404, "Cart not found!");
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

export const DELETE_cart: JetFunc = async (ctx) => {
  const cart = await Cart.findOne({ userId: ctx.state.user._id });
  if (!cart) {
    ctx.throw(404, "Cart not found!");
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
