import type { FastifyInstance } from "fastify";
import type { Database } from "../lib/db-types.js";
import { tenantContext, type TenantRole } from "../middleware/tenant-context.js";

type MemberRow = {
  id: string;
  email: string;
  role: TenantRole;
  joined_at: string;
};

export async function memberRoutes(
  app: FastifyInstance,
  db: Database
) {
  app.get(
    "/api/members",
    { preHandler: tenantContext(db) },
    async (request) => {
      const result = await db.query<MemberRow>(
        `
          SELECT
            u.id,
            u.email,
            tm.role,
            tm.created_at AS joined_at
          FROM tenant_memberships tm
          INNER JOIN users u ON u.id = tm.user_id
          WHERE tm.tenant_id = $1
          ORDER BY tm.created_at ASC
        `,
        [request.tenant!.id]
      );

      return {
        members: result.rows,
      };
    }
  );
}
