import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Database } from "../lib/db-types.js";
import { tenantContext } from "../middleware/tenant-context.js";

type ProjectRow = {
  id: string;
  name: string;
  status: "active" | "archived";
  created_at: string;
};

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export async function projectRoutes(
  app: FastifyInstance,
  db: Database
) {
  const requireTenant = tenantContext(db);

  app.get(
    "/api/projects",
    { preHandler: requireTenant },
    async (request) => {
      const tenant = request.tenant!;

      const result = await db.query<ProjectRow>(
        `
          SELECT id, name, status, created_at
          FROM projects
          WHERE tenant_id = $1
          ORDER BY created_at DESC
        `,
        [tenant.id]
      );

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        projects: result.rows,
      };
    }
  );

  app.post(
    "/api/projects",
    { preHandler: requireTenant },
    async (request, reply) => {
      const tenant = request.tenant!;
      const body = createProjectSchema.safeParse(request.body);

      if (!body.success) {
        return reply.code(400).send({
          error: "Invalid project",
          details: body.error.flatten().fieldErrors,
        });
      }

      const result = await db.query<ProjectRow>(
        `
          INSERT INTO projects (
            tenant_id,
            name,
            created_by
          )
          VALUES ($1, $2, $3)
          RETURNING id, name, status, created_at
        `,
        [tenant.id, body.data.name, tenant.userId]
      );

      return reply.code(201).send(result.rows[0]);
    }
  );
}
