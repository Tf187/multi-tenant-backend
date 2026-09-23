import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import type { Database, QueryResult } from "../src/lib/db-types.js";

const aliceId = "11111111-1111-4111-8111-111111111111";
const northwindId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const acmeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("rejects access when the user has no membership in the tenant", async () => {
  const fakeDb: Database = {
    async query<Row = Record<string, unknown>>(): Promise<QueryResult<Row>> {
      return { rows: [] };
    },
  };

  const app = createApp(fakeDb);

  const response = await app.inject({
    method: "GET",
    url: "/api/projects",
    headers: {
      "x-user-id": aliceId,
      "x-tenant-id": acmeId,
    },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.json(), {
    error: "You do not have access to this tenant",
  });

  await app.close();
});

test("uses the resolved tenant id when projects are queried", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];

  const fakeDb: Database = {
    async query<Row = Record<string, unknown>>(
      sql: string,
      values: unknown[] = []
    ): Promise<QueryResult<Row>> {
      calls.push({ sql, values });

      if (sql.includes("FROM tenant_memberships")) {
        return {
          rows: [
            {
              tenant_id: northwindId,
              tenant_slug: "northwind-labs",
              tenant_name: "Northwind Labs",
              user_id: aliceId,
              role: "owner",
            } as Row,
          ],
        };
      }

      return {
        rows: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Reporting cleanup",
            status: "active",
            created_at: "2026-09-24T00:00:00.000Z",
          } as Row,
        ],
      };
    },
  };

  const app = createApp(fakeDb);

  const response = await app.inject({
    method: "GET",
    url: "/api/projects",
    headers: {
      "x-user-id": aliceId,
      "x-tenant-id": northwindId,
    },
  });

  assert.equal(response.statusCode, 200);

  const projectQuery = calls.find((call) =>
    call.sql.includes("FROM projects")
  );

  assert.ok(projectQuery);
  assert.deepEqual(projectQuery.values, [northwindId]);

  await app.close();
});
