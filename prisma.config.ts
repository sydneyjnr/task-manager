// Settings for the Prisma CLI (used by commands like "prisma migrate dev").
import { defineConfig } from "prisma/config";

// Load the variables from .env into process.env.
// This is built into Node.js, so we don't need the "dotenv" package.
process.loadEnvFile();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
