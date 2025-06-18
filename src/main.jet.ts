import { type JetMiddleware, Jetpath, type JetRoute } from "jetpath";
import { SafeToken } from "safetoken";
import connectDB from "./db/index.ts";
import { throwingPlugin } from "../plugins.ts";

const app = new Jetpath({
  apiDoc: {
    name: "Sample API",
    info: "Sample API documentation",
    color: "#2563eb",
    // username: "admin",
    // password: "1998",
    display: "UI",
  },
  source: ".",
  cors: true,
  strictMode: "ON",
  port: Number(process.env.PORT) || 3000,
});
app.derivePlugins(throwingPlugin);
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
      ctx.plugins.throw(error.message);
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

export const GET_: JetRoute<{ params: { "*": string } }> = (ctx) => {
  ctx.sendStream("src/site/index.html");
};
