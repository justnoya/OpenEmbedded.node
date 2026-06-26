import app from "./app";
import { logger } from "./lib/logger";
import { pool, ensureSchema } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    logger.info("Running schema migrations…");
    await ensureSchema(pool);
    logger.info("Schema ready");
  } catch (err) {
    logger.error({ err }, "Schema migration failed — aborting");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Failed to bind port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
