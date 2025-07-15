import { User } from "../db/index.ts";
import bcrypt from "bcryptjs";
import { auth } from "../main.jet.ts";
import { type JetMiddleware, type JetRoute, use } from "jetpath";

export const MIDDLEWARE_user: JetMiddleware = async function (
  ctx
): Promise<void> {
  const cred = ctx.get("authorization")?.split(" ")[1];
  try {
    if (!cred) {
      ctx.plugins.throw("Please login to continue!");
    }
    const accessInfo = await auth.verify(cred!);
    const person = await User.findById(accessInfo.id);
    if (!person) {
      ctx.plugins.throw("Please login to continue!");
    }
    ctx.state.user = person;
  } catch (error) {
    console.error(error);
    ctx.plugins.throw("Please login to continue!");
  }
};

export const POST_o_user_register: JetRoute<{
  body: {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    phone: string;
    countryCode: string;
    cityName: string;
    currencyCode: string;
    language: string;
  };
}> = async function (ctx) {
  const data = await ctx.parse();
  data.email = data.email.toLowerCase();
  data.password = await bcrypt.hash(data.password, 10);
  const wasThere = await User.findOne({ email: data.email });

  if (wasThere) {
    ctx.plugins.throw(400, { message: "this account exits, please login!" });
  }
  const user = await User.create({ ...data });
  //! you can use this to send an email to the user
  //? await saveOtpAndSendEmail(data.email, "Verify your account");
  if (user) {
    const token = await auth.create({ id: user.id! });
    const data = { user, token };
    delete (data as any).role;
    ctx.send({ data, ok: true });
  } else {
    ctx.plugins.throw(400, { message: "this account exits, please login!" });
  }
};

use(POST_o_user_register).body((t) => {
  return {
    firstName: t.string().required().default("John"),
    lastName: t.string().default("Doe"),
    email: t.string().email().required().default("example@example.com"),
    password: t.string().required().min(4).max(128).default("password"),
    phone: t
      .string()
      .regex(/^\+?\d{10,15}$/)
      .required()
      .default("+1234567890"),
    countryCode: t.string().default("US"),
    cityName: t.string().default("New York"),
    currencyCode: t.string().default("USD"),
    language: t.string().default("English"),
  };
});

export const GET_user: JetRoute = async function (ctx) {
  const user = ctx.state.user;
  user.password = undefined;
  user.otp = undefined;
  user.tempPass = undefined;
  ctx.send(user);
};

export const POST_user_update: JetRoute<{
  body: {
    email: any;
    password: any;
    otp: any;
    tempTokenExpiredAt: any;
    name: string;
    imageLink: string;
    phoneNumber: string;
    stateOfResidence: string;
    educationLevel: string;
    gender: string;
    age: string;
    howDidYouHearAboutUs: string;
  };
}> = async function (ctx) {
  const userData = await ctx.parse();
  if (userData) {
    delete userData.email;
    delete userData.password;
    delete userData.otp;
    delete userData.tempTokenExpiredAt;
    await User.updateOne({ _id: ctx.state.user._id }, userData);
    ctx.send({ data: userData, ok: true });
  } else {
    ctx.plugins.throw(400, "wrong details, please login for verification");
  }
};

use(POST_user_update).body((t) => {
  return {
    firstName: t.string().required(),
    lastName: t.string(),
    imageLink: t.string(),
    phoneNumber: t.string(),
    stateOfResidence: t.string(),
    educationLevel: t.string(),
    gender: t.string(),
  };
});

export const POST_user_update_pfp: JetRoute<{ body: { imageLink: string } }> =
  async function (ctx) {
    const user = await ctx.state.user;
    const { imageLink } = await ctx.parse();

    if (user && imageLink) {
      await User.updateOne({ _id: user._id }, { imageLink });
      ctx.send({ data: { imageLink }, ok: true });
    } else {
      ctx.plugins.throw(400, "Invalid user or image link");
    }
  };

use(POST_user_update_pfp).body((t) => {
  return {
    imageLink: t.string().required(),
  };
});
