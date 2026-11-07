// Auth.js (NextAuth v5) setup. This is the one place where sign-in is configured.
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// NextAuth() gives us four things we use around the app:
// - handlers: the routes Google sends the user back to (see app/api/auth)
// - auth:     tells us who is signed in (or null)
// - signIn / signOut: start or end a sign-in
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Save users, accounts and sessions in our MySQL database with Prisma.
  // With an adapter, Auth.js uses "database sessions": the cookie holds a
  // random token, and the session itself is a row in the Session table.
  adapter: PrismaAdapter(prisma),

  // Only Google. It reads AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from .env.
  // (AUTH_SECRET from .env is used to sign and protect the cookies.)
  providers: [Google],

  callbacks: {
    // By default the session only has the user's name, email and image.
    // We also need the user's id, so we can find their tasks.
    // "user" here is the row from our User table.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
