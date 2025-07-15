import { type JetRoute, use } from "jetpath";
import bcrypt from "bcryptjs";
import { User } from "../db/schema.ts";
import { auth } from "../main.jet.ts";

const client_redirect = process.env.client_redirect;

export const POST_auth_user_login: JetRoute<{
  body: { password: string; email: string };
}> = async function (ctx) {
  const { email, password } = await ctx.parse();
  const person = await User.findOne({ email: email.toLowerCase() });
  if (!person) {
    ctx.plugins.throw({ ok: false, message: "Incorrect email" });
  } else {
    if (!(await bcrypt.compare(password, person.password!))) {
      ctx.plugins.throw({ ok: false, message: "Incorrect password" });
    }
    const token = await auth.create({ id: person.id! });
    delete person.otp;
    delete person.tempTokenExpiredAt;
    delete person.password;
    ctx.send({ data: { user: person, token }, ok: true });
  }
};

use(POST_auth_user_login).body((t) => ({
  email: t
    .string({
      err: "invalid email, please recheck!",
    })
    .email()
    .required()
    .default("example@example.com"),
  password: t
    .string({
      err: "invalid password, please recheck!",
    })
    .required()
    .default("password"),
}));

const CLIENT_ID = process.env.client_id;
const CLIENT_SECRET = process.env.client_secret;
const REDIRECT_URI = process.env.host + "/auth/google/auth/callback";
const gurl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;

// Initiates the Google Login flow
export const GET_auth_google_auth: JetRoute = (ctx) => {
  ctx.redirect(gurl);
};

// Callback URL for handling the Google Login response
export const GET_auth_google_auth_callback: JetRoute<{
  query: { code: string };
}> = async (ctx) => {
  const { code } = await ctx.parseQuery();

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
          ctx.plugins.throw(400, "User not found");
          return;
        }
        // ? register
        const token = await auth.create({ id: user.id! });
        //API RESPONSE
        ctx.redirect(client_redirect + "/login?ok=true&token=" + token);
      }
    } else {
      ctx.plugins.throw(400, "Invalid code");
    }
  } catch (error) {
    console.error("Error:", error);
    ctx.redirect(client_redirect + "/login?error=Invalid code");
  }
};
