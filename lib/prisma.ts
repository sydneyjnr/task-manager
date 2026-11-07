// Creates ONE Prisma Client that the whole app shares.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// The adapter is the driver that talks to MySQL.
// It reads the connection URL from .env (Next.js loads .env for us).
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

// In development, Next.js reloads files when you save them.
// Without this check, every reload would create a new client and open
// new database connections. So we store the client on "globalThis"
// (which survives reloads) and reuse it.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
