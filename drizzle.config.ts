import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Support both Neon (production/Netlify) and local PostgreSQL
const url = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Set NEON_DATABASE_URL (production) or DATABASE_URL (local) before running drizzle-kit."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});
