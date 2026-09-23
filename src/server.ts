import { createApp } from "./app.js";
import { config } from "./config.js";
import { db } from "./db.js";

const app = createApp(db);

async function start() {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: config.PORT,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

async function shutdown() {
  await app.close();
  await db.end();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
