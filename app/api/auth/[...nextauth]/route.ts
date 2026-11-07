// Auth.js needs a few URLs of its own, like /api/auth/callback/google
// (where Google sends the user back after they sign in).
// "[...nextauth]" catches every URL under /api/auth and passes it to Auth.js.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
