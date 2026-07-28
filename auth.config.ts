import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config: no Prisma or bcryptjs imports here, since
 * middleware runs in the Edge runtime and neither is supported there. The
 * Credentials provider (which needs both) is added on top of this in
 * `auth.ts`, which only runs in the Node.js runtime (API routes, Server
 * Actions, Server Components).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
