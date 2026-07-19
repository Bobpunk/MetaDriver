import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Força o dotenv a ler o arquivo correto do Next.js
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});