import Fastify from "fastify";
import type { Database } from "./lib/db-types.js";
import { memberRoutes } from "./routes/members.js";
import { projectRoutes } from "./routes/projects.js";

export function createApp(db: Database) {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  app.decorateRequest("tenant", null);

  app.get("/health", async () => ({
    status: "ok",
  }));

  app.register(async (api) => {
    await projectRoutes(api, db);
    await memberRoutes(api, db);
  });

  return app;
}
