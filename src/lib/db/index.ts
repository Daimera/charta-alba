import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzleHttp<typeof schema>>;
let _db: Db | undefined;

function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _db = drizzleHttp(neon(url), { schema });
  }
  return _db;
}

// HTTP driver — fast for edge/serverless regular queries.
// Proxy defers neon() until DATABASE_URL is available at runtime.
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

// WebSocket (Pool) driver — required by DrizzleAdapter in NextAuth.
// Lazily initialised; Pool keeps a persistent WS connection per instance.
let _authPool: Pool | undefined;
export function getAuthDb() {
  if (!_authPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _authPool = new Pool({ connectionString: url });
  }
  return drizzleWs(_authPool, { schema });
}
