import { User } from "../db/index.ts";
import bcrypt from "bcryptjs";
import { newAuth } from "../main.jet.ts";
import { type JetFunc, use } from "jetpath";

export const POST_o_user_register: JetFunc<{
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
  const data = ctx.body;
  data.email = data.email.toLowerCase();
  data.password = await bcrypt.hash(data.password, 10);
  const wasThere = await User.findOne({ email: data.email });

  if (wasThere) {
    ctx.throw(400, { message: "this account exits, please login!" });
  }
  const user = await User.create({ ...data });
  //? you can use this to send an email to the user
  //? await saveOtpAndSendEmail(data.email, "Verify your account");
  if (user) {
    const token = await newAuth(user.id!);
    const data = { user, token };
    delete (data as any).role;
    ctx.send({ data, ok: true });
  } else {
    ctx.throw(400, { message: "this account exits, please login!" });
  }
};

use(POST_o_user_register).body((t) => {
  return {
    firstName: t.string().required(),
    lastName: t.string(),
    email: t.string().email().required(),
    password: t.string().required().min(4).max(128),
    phone: t
      .string()
      .regex(/^\+?\d{10,15}$/)
      .required(),
    countryCode: t.string().default("NG"),
    cityName: t.string().default("Abuja"),
    currencyCode: t.string().default("NGN"),
    language: t.string().default("English"),
  };
});

export const GET_user: JetFunc = async function (ctx) {
  const user = ctx.state.user;
  user.password = undefined;
  user.otp = undefined;
  user.tempPass = undefined;
  ctx.send(user);
};

export const POST_user_update: JetFunc<{
  body: {
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
  const userData = {
    ...ctx.state.user,
    ...ctx.body,
  };
  if (userData) {
    delete userData.email;
    delete userData.password;
    delete userData.otp;
    delete userData.tempTokenExpiredAt;
    await User.updateOne(userData);
    ctx.send({ data: userData, ok: true });
  } else {
    ctx.throw(400, "wrong details, please login for verification");
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

export const POST_user_update_pfp: JetFunc<{ body: { imageLink: string } }> =
  async function (ctx) {
    const user = ctx.state.user;
    const { imageLink } = ctx.body;

    if (user && imageLink) {
      await User.updateOne({ _id: user._id }, { imageLink });
      ctx.send({ data: { imageLink }, ok: true });
    } else {
      ctx.throw(400, "Invalid user or image link");
    }
  };

use(POST_user_update_pfp).body((t) => {
  return {
    imageLink: t.string().required(),
  };
});
