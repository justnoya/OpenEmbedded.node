import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: InstanceType<typeof Pool> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function init() {
  if (_db) return;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  _db = drizzle(_pool, { schema });
}

export const pool: InstanceType<typeof Pool> = new Proxy(
  {} as InstanceType<typeof Pool>,
  {
    get(_target, prop) {
      init();
      return (_pool as InstanceType<typeof Pool>)[prop as keyof InstanceType<typeof Pool>];
    },
  },
);

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop) {
      init();
      return (_db as ReturnType<typeof drizzle<typeof schema>>)[
        prop as keyof ReturnType<typeof drizzle<typeof schema>>
      ];
    },
  },
);

export * from "./schema";
export { eq, and, or, sql, asc, desc, ne, gt, gte, lt, lte } from "drizzle-orm";
