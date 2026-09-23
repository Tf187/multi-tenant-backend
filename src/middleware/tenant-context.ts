import type {
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";
import { z } from "zod";
import type { Database } from "../lib/db-types.js";

const idSchema = z.string().uuid();

export type TenantRole = "owner" | "admin" | "member";

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  userId: string;
  role: TenantRole;
};

declare module "fastify" {
  interface FastifyRequest {
    tenant: TenantContext | null;
  }
}

type MembershipRow = {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  user_id: string;
  role: TenantRole;
};

export function tenantContext(db: Database): preHandlerHookHandler {
  return async function resolveTenant(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = request.headers["x-user-id"];
    const tenantId = request.headers["x-tenant-id"];

    const parsedUserId = idSchema.safeParse(userId);
    const parsedTenantId = idSchema.safeParse(tenantId);

    if (!parsedUserId.success || !parsedTenantId.success) {
      return reply.code(400).send({
        error: "x-user-id and x-tenant-id must be valid UUIDs",
      });
    }

    const result = await db.query<MembershipRow>(
      `
        SELECT
          tm.tenant_id,
          t.slug AS tenant_slug,
          t.name AS tenant_name,
          tm.user_id,
          tm.role
        FROM tenant_memberships tm
        INNER JOIN tenants t ON t.id = tm.tenant_id
        WHERE tm.user_id = $1
          AND tm.tenant_id = $2
        LIMIT 1
      `,
      [parsedUserId.data, parsedTenantId.data]
    );

    const membership = result.rows[0];

    if (!membership) {
      return reply.code(403).send({
        error: "You do not have access to this tenant",
      });
    }

    request.tenant = {
      id: membership.tenant_id,
      slug: membership.tenant_slug,
      name: membership.tenant_name,
      userId: membership.user_id,
      role: membership.role,
    };
  };
}
