import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { randomUUID } from "node:crypto";
import { upsertUser, userByEmail } from "./lib/db";

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub);
}

/**
 * Passwordless "dev login" for local work and demo environments.
 * Never enable in production: anyone can sign in as any email.
 */
export const DEV_LOGIN_ENABLED = process.env.AUTH_DEV_LOGIN === "true";
if (DEV_LOGIN_ENABLED) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev login (no password)",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
        const name = String(creds?.name ?? "").trim() || email.split("@")[0];
        return { id: email, email, name };
      },
    }),
  );
}

export const PROVIDER_IDS = providers.map((p) =>
  typeof p === "function" ? p({}).id : p.id,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        // First sign-in of this session: make sure a users row exists and pin its id.
        let existing = await userByEmail(user.email);
        if (!existing) {
          await upsertUser({
            id: randomUUID(),
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          });
          existing = await userByEmail(user.email);
        } else {
          await upsertUser({
            ...existing,
            name: user.name ?? existing.name,
            image: user.image ?? existing.image,
          });
        }
        token.uid = existing!.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
});

/** Returns the signed-in user's stable id or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
