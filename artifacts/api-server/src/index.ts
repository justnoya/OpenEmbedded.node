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
    logger.info("Applying database schema…");
    await ensureSchema(pool);
    logger.info("Database schema ready");
  } catch (err) {
    logger.error({ err }, "Failed to apply database schema — aborting startup");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
