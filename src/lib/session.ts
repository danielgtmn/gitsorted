import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";

export type CurrentUser = {
  name: string;
  email: string;
  image: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  };
}

/** GitHub access token of the signed-in user, read from the encrypted account cookie. */
export async function getGitHubToken(): Promise<string | null> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return null;
  try {
    const { accessToken } = await auth.api.getAccessToken({
      headers: h,
      body: { useAccountCookie: true },
    });
    return accessToken ?? null;
  } catch {
    return null;
  }
}
