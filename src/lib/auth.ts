import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

/**
 * Stateless Better Auth: no `database` option, so the session lives in an
 * encrypted JWE cookie and the GitHub account (incl. access token) in the
 * encrypted account cookie (`account.storeAccountCookie` is on by default
 * without a database).
 */
export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      // `repo`: list private repos + archive; `delete_repo`: delete repos.
      scope: ["repo", "delete_repo"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
  plugins: [nextCookies()],
});
