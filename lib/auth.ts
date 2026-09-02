import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import db from "./db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Adapter } from "next-auth/adapters";
import { accounts, sessions, users, verificationTokens } from "./schema";
import { eq } from "drizzle-orm";
import { getSupabaseClaims } from "./supabase/server";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          gh_username: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  pages: {
    signIn: `/login`,
    verifyRequest: `/login`,
    error: "/login",
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  } as any) as Adapter,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: VERCEL_DEPLOYMENT
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.user = user;
      return token;
    },
    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        // @ts-expect-error NextAuth's user type does not include custom id.
        id: token.sub,
        // @ts-expect-error NextAuth's user type does not include custom username.
        username: token?.user?.username || token?.user?.gh_username,
      };
      return session;
    },
  },
};

export type AppSession = {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    image: string;
  };
};

function normalizeUser(user: {
  id: string;
  name?: string | null;
  username?: string | null;
  gh_username?: string | null;
  email?: string | null;
  image?: string | null;
}): AppSession {
  return {
    user: {
      id: user.id,
      name: user.name ?? user.username ?? user.gh_username ?? "User",
      username: user.username ?? user.gh_username ?? "user",
      email: user.email ?? "",
      image: user.image ?? "",
    },
  };
}

export async function getSession(): Promise<AppSession | null> {
  const nextAuthSession = await getServerSession(authOptions);
  const nextAuthUser = nextAuthSession?.user;
  const nextAuthUserId = (nextAuthUser as typeof nextAuthUser & { id?: string })?.id;
  if (nextAuthUserId) {
    const nextAuthUsername = (nextAuthUser as typeof nextAuthUser & { username?: string | null })?.username;
    return normalizeUser({
      id: nextAuthUserId,
      name: nextAuthUser?.name,
      email: nextAuthUser?.email,
      image: nextAuthUser?.image,
      username: nextAuthUsername,
    });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  const claims = await getSupabaseClaims();
  const authUserId = typeof claims?.sub === "string" ? claims.sub : null;
  if (!authUserId) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      gh_username: users.gh_username,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  const user = rows[0];
  return user ? normalizeUser(user) : null;
}

export function withSiteAuth(action: any) {
  return async (
    formData: FormData | null,
    siteId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session) {
      return { error: "Not authenticated" };
    }

    const site = await db.query.sites.findFirst({
      where: (sites, { eq }) => eq(sites.id, siteId),
    });

    if (!site || site.userId !== session.user.id) {
      return { error: "Not authorized" };
    }

    return action(formData, site, key);
  };
}

export function withPostAuth(action: any) {
  return async (
    formData: FormData | null,
    postId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session?.user.id) {
      return { error: "Not authenticated" };
    }

    const post = await db.query.posts.findFirst({
      where: (posts, { eq }) => eq(posts.id, postId),
      with: {
        site: true,
      },
    });

    if (!post || post.userId !== session.user.id) {
      return { error: "Post not found" };
    }

    return action(formData, post, key);
  };
}
