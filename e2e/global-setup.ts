import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const DB_DIR = process.env.E2E_DB_DIR ?? "./.pgdata-e2e";
const UPLOAD_DIR = process.env.E2E_UPLOAD_DIR ?? "./.uploads-e2e";

/**
 * Runs once before the E2E suite: wipes the throwaway database and uploads dir,
 * then applies migrations to the fresh PGlite instance. The webServer below is
 * started with `PGLITE_DATA_DIR`/`UPLOAD_DIR` pointed at these same paths, so
 * tests never touch the developer's `./.pgdata` or `./.uploads`.
 */
export default function globalSetup() {
  rmSync(path.resolve(DB_DIR), { recursive: true, force: true });
  rmSync(path.resolve(UPLOAD_DIR), { recursive: true, force: true });

  execSync("npm run db:migrate", {
    stdio: "inherit",
    env: { ...process.env, PGLITE_DATA_DIR: DB_DIR },
  });
}
