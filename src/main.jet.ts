import {
  type JetContext,
  type JetFunc,
  type JetMiddleware,
  Jetpath,
} from "jetpath";
import { SafeToken } from "safetoken";
import connectDB from "./db/index.ts";

const app = new Jetpath({
  apiDoc: {
    name: "Sample API",
    info: "Sample API documentation",
    color: "#2563eb",
    username: "admin",
    password: "1998",
    display: "UI",
  },
  source: ".",
  cors: true,
  strictMode: "ON",
});

app.listen();
connectDB();

// auth
export const auth = new SafeToken({
  secret: process.env.auth_secret || "xxxx",
  timeWindows: { access: 2592000000 },
});

export const MIDDLEWARE_: JetMiddleware = async function (ctx) {
  const { url, method } = ctx.request as { url: string; method: string };
  console.log(method, url);
  if (method !== "GET" && method !== "DELETE") {
    try {
      await ctx.parse({
        maxBodySize: 26 * 1024 * 1024,
      });
    } catch (error: any) {
      ctx.throw(error.message);
    }
  }

  return (ctx, err) => {
    if (err) {
      if (ctx.code < 400) ctx.code = 400;
      console.error(err);
      ctx.send({ ok: false, message: String(err) });
    }
  };
};

export const GET_: JetFunc<{ params: { "*": string } }> = (ctx) => {
  ctx.sendStream("src/site/index.html");
};
