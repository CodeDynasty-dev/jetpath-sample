import { type JetContext } from "jetpath";

export const throwingPlugin = {
  name: "throwingPlugin",
  executor() {
    return {
      throw(this: any, code: any = 404, message: any = "") {
        const self = this as JetContext;
        if (typeof code !== "number") {
          message = code;
          code = 400;
        }
        self.send(message, code);
        throw new Error(message.message || message);
      },
    };
  },
};

export type throwingPluginType = ReturnType<typeof throwingPlugin.executor>;
