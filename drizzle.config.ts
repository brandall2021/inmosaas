import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

/**
 * When `DATABASE_URL` is present we target a real Postgres server. Otherwise we
 * fall back to the same embedded PGlite database the app uses in development,
 * honouring `PGLITE_DATA_DIR` when set (E2E points it at a throwaway dir).
 */
export default url
  ? defineConfig({
      dialect: "postgresql",
      schema: "./src/db/schema.ts",
      out: "./drizzle",
      dbCredentials: { url },
    })
  : defineConfig({
      dialect: "postgresql",
      schema: "./src/db/schema.ts",
      out: "./drizzle",
      driver: "pglite",
      dbCredentials: { url: process.env.PGLITE_DATA_DIR ?? "./.pgdata" },
    });
