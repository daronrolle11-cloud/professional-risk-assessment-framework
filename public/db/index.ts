import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Direct explicit fallback to your live cloud database connection string
const connectionString = 
  process.env.NEON_DATABASE_URL ?? 
  process.env.DATABASE_URL ?? 
  "postgresql://neondb_owner:npg_TWRiSmpy5tH4@ep-noisy-king-b84wnykj-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!connectionString) {
  throw new Error("A database URL connection string configuration variable is required.");
}

// Initialize the secure serverless Neon client driver link
const sql = neon(connectionString);
export const db = drizzle(sql);
