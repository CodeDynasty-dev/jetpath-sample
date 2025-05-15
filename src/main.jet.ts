import {
  type JetContext,
  type JetFunc,
  type JetMiddleware,
  Jetpath,
} from "jetpath";
import { SafeToken } from "safetoken";
import { User } from "./db/schema.ts";
import connectDB from "./db/index.ts";

const app = new Jetpath({
  apiDoc: {
    name: "Sample API",
    info: "Sample API documentation",
    color: "#198754",
    username: "admin",
    password: "1998",
    display: "UI",
  },
  source: ".",
  cors: true,
  strictMode: "ON",
});

app.listen();
// connectDB(); // uncomment this line if you want to connect to the database

// auth
const auth = new SafeToken({
  secret: process.env.auth_secret || "xxxx",
  timeWindows: { access: 2592000000 },
});

export const newAuth = (id: string) => {
  return auth.create({ id });
};
async function errorHandler(ctx: JetContext<any>, err: unknown) {
  if (err) {
    if (ctx.code < 400) ctx.code = 400;
    console.error(err);
    ctx.send({ ok: false, message: String(err) });
  }
}

export const MIDDLEWARE_: JetMiddleware = async function (ctx) {
  const { url, method } = ctx.request as { url: string; method: string };
  console.log(method, url);
  if (method !== "GET" && method !== "DELETE") {
    try {
      ctx.body = await ctx.parse({
        maxBodySize: 26 * 1024 * 1024,
      });
    } catch (error) {
      errorHandler(ctx as any, error);
      throw error;
    }
  }
  return errorHandler as any;
};

export const MIDDLEWARE_user: JetMiddleware = async function (
  ctx
): Promise<void> {
  const cred = ctx.get("x-app-token");
  try {
    if (!cred) {
      ctx.throw("Please login to continue!");
    }
    const accessInfo = await auth.verify(cred!);
    const person = await User.findById(accessInfo.id);
    if (!person) {
      ctx.throw("Please login to continue!");
    }
    ctx.state.user = person;
  } catch (error) {
    console.error(error);
    ctx.throw("Please login to continue!");
  }
};

export const GET_$0: JetFunc<{ params: { "*": string } }> = (ctx) => {
  ctx.sendStream("src/site/index.html");
};

export const MIDDLEWARE_products: JetMiddleware = MIDDLEWARE_user;
export const MIDDLEWARE_cart: JetMiddleware = MIDDLEWARE_user;
