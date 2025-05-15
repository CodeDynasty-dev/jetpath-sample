import bcrypt from "bcryptjs";
import { newAuth } from "../main.jet.ts";
import { type JetFunc } from "jetpath";
import { User } from "../db/schema.ts";

const client_redirect = process.env.client_redirect;

export const POST_o_user_login: JetFunc<{
  body: { password: string; email: string };
}> = async function (ctx) {
  ctx.body!.email = ctx.body?.email.toLowerCase();
  const person = await User.findOne({ email: ctx.body.email });
  if (!person) {
    ctx.throw({ ok: false, message: "Incorrect email" });
  } else {
    if (!(await bcrypt.compare(ctx.body?.password, person.password!))) {
      ctx.throw({ ok: false, message: "Incorrect password" });
    }
    const token = await newAuth(person.id!);
    delete person.otp;
    delete person.tempTokenExpiredAt;
    delete person.password;
    ctx.send({ data: { user: person, token }, ok: true });
  }
};

POST_o_user_login.body = {
  email: {
    type: "string",
    required: true,
    RegExp: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    err: "invalid email, please recheck!",
    inputType: "email",
    inputDefaultValue: "fridaycandours@gmail.com",
  },
  password: {
    type: "string",
    required: true,
    inputType: "password",
    inputDefaultValue: "665899",
  },
};

export const GET_token_valid: JetFunc = function (ctx) {
  ctx.send({ message: "valid", ok: true });
};

const CLIENT_ID = process.env.client_id;
const CLIENT_SECRET = process.env.client_secret;
const REDIRECT_URI = process.env.host + "/o/google/auth/callback";
const gurl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;

// Initiates the Google Login flow
export const GET_o_google_auth: JetFunc = (ctx) => {
  ctx.redirect(gurl);
};

// Callback URL for handling the Google Login response
export const GET_o_google_auth_callback: JetFunc<{
  query: { code: string };
}> = async (ctx) => {
  const { code } = ctx.query;

  try {
    // Exchange authorization code for access token
    const auth_res = await fetch("https://oauth2.googleapis.com/token", {
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      method: "POST",
    });
    if (auth_res.ok) {
      const data = await auth_res.json();
      const { access_token } = data;
      // Use access_token or id_token to fetch user profile
      const access_res = await fetch(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      if (access_res.ok) {
        const profile = await access_res.json();

        const { email, name, given_name, picture } = profile;
        let user = await User.findOne({ email });
        if (!user) {
          ctx.throw(400, "User not found");
          return;
        }
        // ? register
        const token = await newAuth(user.id);
        //API RESPONSE
        ctx.redirect(client_redirect + "/login?ok=true&token=" + token);
      }
    } else {
      ctx.throw(400, "Invalid code");
    }
  } catch (error) {
    console.error("Error:", error);
    ctx.redirect(client_redirect + "/login?error=Invalid code");
  }
};
