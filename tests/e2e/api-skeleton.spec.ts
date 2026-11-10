import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test";

type JsonRecord = Record<string, unknown>;

interface Fixture {
  users: Array<{ id: string; rolesByProduction: Record<string, string[]> }>;
  productions: Array<{ id: string }>;
  resources: Array<{
    id: string;
    productionId: string;
    type: "contract" | "script" | "choreography";
    versions: Array<{
      id: string;
      content: string;
      contentType: string;
      publishedAt: string;
    }>;
    currentVersionId: string;
  }>;
  assignments: Array<{
    productionId: string;
    resourceId: string;
    memberId?: string;
    roleId?: string;
  }>;
  signatures: Array<{
    contractId: string;
    versionId: string;
    signerId: string;
    signedAt: string;
  }>;
  notifications?: Array<{
    id: string;
    recipientId: string;
    productionId: string;
    resourceId: string;
    link?: string;
  }>;
  auditEvents?: Array<{
    productionId: string;
    resourceId: string;
    action: string;
    actorId: string;
    versionId?: string;
    occurredAt: string;
  }>;
}

const now = "2026-01-15T12:00:00Z";
const scriptUrl = "/api/productions/prod-A/scripts/script-1";
const choreographyUrl = "/api/productions/prod-A/choreography/choreo-1";
const contractAssignmentUrl =
  "/api/productions/prod-A/contracts/contract-1/assignments";
const signatureUrl =
  "/api/productions/prod-A/contracts/contract-1/signature";
const publishUrl = "/api/productions/prod-A/scripts/script-1/versions";
const scriptAssignmentUrl =
  "/api/productions/prod-A/resources/script-1/assignments";

function v(id: string, content: string, contentType = "text/plain") {
  return {
    id,
    content,
    contentType,
    publishedAt: "2026-01-14T12:00:00Z",
  };
}

function fixture(
  assignments: Fixture["assignments"] = [],
  signatures: Fixture["signatures"] = [],
  notifications: NonNullable<Fixture["notifications"]> = [],
): Fixture {
  return {
    users: [
      { id: "user-manager-A", rolesByProduction: { "prod-A": ["manager"] } },
      { id: "user-producer-A", rolesByProduction: { "prod-A": ["producer"] } },
      {
        id: "user-actor-A",
        rolesByProduction: { "prod-A": ["actor", "role-actor-A"] },
      },
      {
        id: "user-actor-B",
        rolesByProduction: { "prod-A": ["actor", "role-actor-B"] },
      },
      {
        id: "user-dancer-A",
        rolesByProduction: { "prod-A": ["dancer", "role-dancer-A"] },
      },
      {
        id: "user-member-A",
        rolesByProduction: { "prod-A": ["actor", "role-actor-M"] },
      },
      {
        id: "user-actor-C",
        rolesByProduction: { "prod-B": ["actor", "role-actor-C"] },
      },
      {
        id: "user-actor-D",
        rolesByProduction: {
          "prod-A": ["actor", "role-actor-D"],
          "prod-B": ["actor", "role-actor-D"],
        },
      },
    ],
    productions: [{ id: "prod-A" }, { id: "prod-B" }],
    resources: [
      {
        id: "contract-1",
        productionId: "prod-A",
        type: "contract",
        versions: [
          v("contract-v1", "CONTRACT ONE"),
          v("contract-v2", "CONTRACT TWO"),
        ],
        currentVersionId: "contract-v2",
      },
      {
        id: "script-1",
        productionId: "prod-A",
        type: "script",
        versions: [v("script-v1", "SCRIPT ONE"), v("script-v2", "SCRIPT TWO")],
        currentVersionId: "script-v2",
      },
      {
        id: "choreo-1",
        productionId: "prod-A",
        type: "choreography",
        versions: [
          v("choreo-v1", "CHOREO ONE", "video/mp4"),
          v("choreo-v2", "CHOREO TWO", "video/mp4"),
        ],
        currentVersionId: "choreo-v2",
      },
      {
        id: "script-B1",
        productionId: "prod-B",
        type: "script",
        versions: [v("script-B1-v1", "PROD B SCRIPT")],
        currentVersionId: "script-B1-v1",
      },
    ],
    assignments,
    signatures,
    notifications,
  };
}

async function seed(
  api: APIRequestContext,
  value: Fixture = fixture(),
): Promise<void> {
  const response = await api.post("/__test/fixtures", { data: value });
  expect(response.status(), "test fixture API").toBe(201);
  expect(await response.json()).toEqual({ created: true });
}

async function clock(api: APIRequestContext, timestamp: string): Promise<void> {
  const response = await api.put("/__test/clock", {
    data: { now: timestamp },
  });
  expect(response.status(), "test clock API").toBe(204);
}

async function faults(
  api: APIRequestContext,
  databaseCommitFailures: number,
  notificationDeliveryFailures = 0,
): Promise<void> {
  const response = await api.post("/__test/faults", {
    data: { databaseCommitFailures, notificationDeliveryFailures },
  });
  expect(response.status(), "test fault API").toBe(204);
}

async function measurements(
  api: APIRequestContext,
  data: JsonRecord,
): Promise<void> {
  const response = await api.post("/__test/measurements", { data });
  expect(response.status(), "test measurement API").toBe(204);
}

async function call(
  api: APIRequestContext,
  userId: string,
  method: string,
  url: string,
  data?: unknown,
): Promise<APIResponse> {
  return api.fetch(url, {
    method,
    headers: { "X-SetSafe-Test-User": userId },
    ...(data === undefined ? {} : { data }),
  });
}

async function json(response: APIResponse): Promise<JsonRecord> {
  return (await response.json()) as JsonRecord;
}

async function success(
  response: APIResponse,
  status: number,
  fields: JsonRecord,
): Promise<JsonRecord> {
  expect.soft(response.status()).toBe(status);
  const result = await json(response);
  for (const [key, value] of Object.entries(fields)) {
    expect.soft(result[key], `response field ${key}`).toEqual(value);
  }
  return result;
}

async function rejection(
  response: APIResponse,
  status: number,
  code: string,
  message?: string,
): Promise<void> {
  const result = await success(response, status, {
    error: code,
    ...(message === undefined ? {} : { message }),
  });
  if (message === undefined) {
    expect.soft(result.message).toEqual(expect.any(String));
    expect.soft((result.message as string).length).toBeGreaterThan(0);
  }
}

async function snapshot(
  api: APIRequestContext,
  productionId = "prod-A",
): Promise<JsonRecord> {
  const response = await api.get(
    `/__test/state?productionId=${encodeURIComponent(productionId)}`,
  );
  expect(response.status(), "test state API").toBe(200);
  return json(response);
}

async function assertNoWrites(
  api: APIRequestContext,
  before: JsonRecord,
  productionId = "prod-A",
): Promise<void> {
  const after = await snapshot(api, productionId);
  for (const key of [
    "assignments",
    "versions",
    "signatures",
    "notifications",
    "auditEvents",
  ]) {
    expect.soft(after[key], `rejected request did not change ${key}`).toEqual(
      before[key],
    );
  }
}

function direct(resourceId: string, memberId: string, productionId = "prod-A") {
  return { productionId, resourceId, memberId };
}

function byRole(resourceId: string, roleId: string, productionId = "prod-A") {
  return { productionId, resourceId, roleId };
}

function resourceBody(
  productionId: string,
  resourceId: string,
  versionId: string,
  content: string,
  contentType = "text/plain",
): JsonRecord {
  return { productionId, resourceId, versionId, content, contentType };
}

test.describe("SetSafe Playwright REST acceptance tests", () => {
  test.beforeEach(async ({ request }) => {
    const response = await request.post("/__test/reset");
    expect(response.status(), "test reset API").toBe(204);
    expect(await response.text()).toBe("");
  });

  test("test_TP-001 — manager assigns and sends a contract", async ({
    request,
  }) => {
    await seed(request);
    const assigned = await call(
      request,
      "user-manager-A",
      "POST",
      contractAssignmentUrl,
      { assigneeIds: ["user-actor-A"] },
    );
    await success(assigned, 201, {
      status: "assigned",
      productionId: "prod-A",
      contractId: "contract-1",
      assigneeIds: ["user-actor-A"],
    });

    const access = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/productions/prod-A/resources/contract-1/access",
    );
    await success(access, 200, {
      authorized: true,
      productionId: "prod-A",
      resourceId: "contract-1",
      versionId: "contract-v2",
    });
    const listed = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/notifications",
    );
    const result = await success(listed, 200, {});
    expect.soft(result.notifications).toEqual([
      {
        recipientId: "user-actor-A",
        productionId: "prod-A",
        resourceId: "contract-1",
        link: "/api/productions/prod-A/resources/contract-1/access",
      },
    ]);
    expect.soft((await snapshot(request)).assignments).toContainEqual(
      direct("contract-1", "user-actor-A"),
    );
  });

  test("test_TP-002 — unassigned member cannot access a sent contract", async ({
    request,
  }) => {
    await seed(
      request,
      fixture([direct("contract-1", "user-actor-A")]),
    );
    const before = await snapshot(request);
    const response = await call(
      request,
      "user-member-A",
      "GET",
      "/api/productions/prod-A/resources/contract-1/access",
    );
    await rejection(response, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test("test_TP-003 — assigned actor reads the latest script", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const response = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      response,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test("test_TP-004 — role-assigned actor reads the latest script", async ({
    request,
  }) => {
    await seed(request, fixture([byRole("script-1", "role-actor-A")]));
    const response = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      response,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test("test_TP-005 — unassigned actor is denied and assigned actor control succeeds", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const denied = await call(request, "user-actor-A", "GET", scriptUrl);
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);

    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const control = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      control,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test("test_TP-006 — production member without assignment cannot read a script", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const response = await call(request, "user-member-A", "GET", scriptUrl);
    await rejection(response, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test("test_TP-007 — assigned dancer views the latest choreography", async ({
    request,
  }) => {
    await seed(request, fixture([direct("choreo-1", "user-dancer-A")]));
    const response = await call(
      request,
      "user-dancer-A",
      "GET",
      choreographyUrl,
    );
    await success(
      response,
      200,
      resourceBody(
        "prod-A",
        "choreo-1",
        "choreo-v2",
        "CHOREO TWO",
        "video/mp4",
      ),
    );
  });

  test("test_TP-008 — role-assigned dancer views the latest choreography", async ({
    request,
  }) => {
    await seed(request, fixture([byRole("choreo-1", "role-dancer-A")]));
    const response = await call(
      request,
      "user-dancer-A",
      "GET",
      choreographyUrl,
    );
    await success(
      response,
      200,
      resourceBody(
        "prod-A",
        "choreo-1",
        "choreo-v2",
        "CHOREO TWO",
        "video/mp4",
      ),
    );
  });

  test("test_TP-009 — unassigned dancer is denied and assigned dancer control succeeds", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-dancer-A",
      "GET",
      choreographyUrl,
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);

    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(request, fixture([direct("choreo-1", "user-dancer-A")]));
    const control = await call(
      request,
      "user-dancer-A",
      "GET",
      choreographyUrl,
    );
    await success(
      control,
      200,
      resourceBody(
        "prod-A",
        "choreo-1",
        "choreo-v2",
        "CHOREO TWO",
        "video/mp4",
      ),
    );
  });

  test("test_TP-010 — manager assigns a resource to a cast member", async ({
    request,
  }) => {
    await seed(request);
    const assigned = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(assigned, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
    const access = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      access,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test("test_TP-011 — member without assignment is denied after another member is assigned", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const before = await snapshot(request);
    const response = await call(request, "user-member-A", "GET", scriptUrl);
    await rejection(response, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test("test_TP-012 — assignment outside the production is rejected; same-production control succeeds", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { memberId: "user-actor-C" },
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);

    const control = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(control, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
  });

  test("test_TP-013 — role assignment cannot cross productions; valid role control succeeds", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { roleId: "role-actor-C" },
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);

    const control = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { roleId: "role-actor-A" },
    );
    await success(control, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "script-1",
      roleId: "role-actor-A",
    });
  });

  test("test_TP-014 — assigned cast member signs the latest contract version", async ({
    request,
  }) => {
    await seed(request, fixture([direct("contract-1", "user-actor-A")]));
    const response = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      {},
    );
    await success(response, 200, {
      status: "signed",
      productionId: "prod-A",
      contractId: "contract-1",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });
    const data = await snapshot(request);
    expect.soft(data.signatures).toContainEqual({
      contractId: "contract-1",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });
    expect.soft(data.auditEvents).toContainEqual(
      expect.objectContaining({
        resourceId: "contract-1",
        action: "signed",
        actorId: "user-actor-A",
        versionId: "contract-v2",
        occurredAt: now,
      }),
    );
  });

  test("test_TP-017 — unassigned member cannot sign; assigned control signs", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-member-A",
      "POST",
      signatureUrl,
      {},
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);

    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(request, fixture([direct("contract-1", "user-actor-A")]));
    const control = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      {},
    );
    await success(control, 200, {
      status: "signed",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });
  });

  test("test_TP-018 — stale-version signature is rejected; latest-version control succeeds", async ({
    request,
  }) => {
    await seed(request, fixture([direct("contract-1", "user-actor-A")]));
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      { versionId: "contract-v1" },
    );
    await rejection(
      denied,
      409,
      "stale_version",
      "Only the latest contract version can be signed.",
    );
    await assertNoWrites(request, before);

    const control = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      { versionId: "contract-v2" },
    );
    await success(control, 200, {
      status: "signed",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });
  });

  test("test_TP-015 — a signature is not attributed to another assignee", async ({
    request,
  }) => {
    await seed(
      request,
      fixture([
        direct("contract-1", "user-actor-A"),
        direct("contract-1", "user-actor-B"),
      ]),
    );
    const response = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      {},
    );
    await success(response, 200, {
      status: "signed",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });
    const signatures = (await snapshot(request)).signatures as Array<{
      signerId: string;
      versionId: string;
    }>;
    expect.soft(signatures).toContainEqual(
      expect.objectContaining({
        signerId: "user-actor-A",
        versionId: "contract-v2",
      }),
    );
    expect
      .soft(
        signatures.some(
          (item) =>
            item.signerId === "user-actor-B" &&
            item.versionId === "contract-v2",
        ),
      )
      .toBe(false);
  });

  test("test_TP-016 — signing the latest version preserves an earlier version signature", async ({
    request,
  }) => {
    await seed(
      request,
      fixture(
        [direct("contract-1", "user-actor-A")],
        [
          {
            contractId: "contract-1",
            versionId: "contract-v1",
            signerId: "user-actor-A",
            signedAt: "2026-01-14T11:00:00Z",
          },
        ],
      ),
    );
    const response = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      {},
    );
    await success(response, 200, {
      status: "signed",
      versionId: "contract-v2",
      signerId: "user-actor-A",
    });
    const signatures = (await snapshot(request)).signatures as Array<JsonRecord>;
    expect.soft(signatures).toContainEqual({
      contractId: "contract-1",
      versionId: "contract-v1",
      signerId: "user-actor-A",
      signedAt: "2026-01-14T11:00:00Z",
    });
    expect.soft(signatures).toContainEqual(
      expect.objectContaining({
        contractId: "contract-1",
        versionId: "contract-v2",
        signerId: "user-actor-A",
      }),
    );
  });

  test("test_TP-019 — producer update inherits assignments and notifies assignees", async ({
    request,
  }) => {
    const assignments = [
      direct("script-1", "user-actor-A"),
      byRole("script-1", "role-actor-B"),
    ];
    await seed(request, fixture(assignments));
    const before = await snapshot(request);
    const published = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await success(published, 201, {
      status: "published",
      productionId: "prod-A",
      resourceId: "script-1",
      versionId: "script-v3",
      current: true,
    });
    const data = await snapshot(request);
    expect.soft(data.assignments).toEqual(before.assignments);
    expect.soft(data.versions).toContainEqual(
      expect.objectContaining({
        id: "script-v3",
        resourceId: "script-1",
        content: "SCRIPT THREE",
        current: true,
      }),
    );

    for (const userId of ["user-actor-A", "user-actor-B"]) {
      const read = await call(request, userId, "GET", scriptUrl);
      await success(
        read,
        200,
        resourceBody("prod-A", "script-1", "script-v3", "SCRIPT THREE"),
      );
      const response = await call(request, userId, "GET", "/api/notifications");
      const result = await success(response, 200, {});
      expect.soft(result.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            recipientId: userId,
            productionId: "prod-A",
            resourceId: "script-1",
            link: scriptUrl,
          }),
        ]),
      );
    }

    const denied = await call(
      request,
      "user-member-A",
      "GET",
      scriptUrl,
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, data);
  });

  test("test_TP-020 — manager without producer role cannot publish; producer control succeeds", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-manager-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);

    const control = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await success(control, 201, {
      status: "published",
      productionId: "prod-A",
      resourceId: "script-1",
      versionId: "script-v3",
      current: true,
    });
  });

  test("test_TP-021 — published version mutation is rejected; fresh-version control succeeds", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v2",
        content: "ALTERED SCRIPT",
        contentType: "text/plain",
      },
    );
    await rejection(
      denied,
      409,
      "immutable_version",
      "Published versions cannot be changed.",
    );
    await assertNoWrites(request, before);

    const control = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT FOUR",
        contentType: "text/plain",
      },
    );
    await success(control, 201, {
      status: "published",
      productionId: "prod-A",
      resourceId: "script-1",
      versionId: "script-v3",
      current: true,
    });
  });

  test("test_TP-066 — a fresh immutable version can be published", async ({
    request,
  }) => {
    await seed(request);
    const response = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT FOUR",
        contentType: "text/plain",
      },
    );
    await success(response, 201, {
      status: "published",
      productionId: "prod-A",
      resourceId: "script-1",
      versionId: "script-v3",
      current: true,
    });
  });

  test("test_TP-023 — revoking a direct assignment removes subsequent access", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const revoked = await call(
      request,
      "user-manager-A",
      "DELETE",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(revoked, 200, {
      status: "revoked",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
    const data = await snapshot(request);
    expect.soft(data.assignments).not.toContainEqual(
      direct("script-1", "user-actor-A"),
    );
    const denied = await call(request, "user-actor-A", "GET", scriptUrl);
    await rejection(denied, 403, "forbidden", "Access denied.");
  });

  test("test_TP-024 — revoking a direct assignment preserves role access", async ({
    request,
  }) => {
    await seed(
      request,
      fixture([
        direct("script-1", "user-actor-A"),
        byRole("script-1", "role-actor-A"),
      ]),
    );
    const revoked = await call(
      request,
      "user-manager-A",
      "DELETE",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(revoked, 200, {
      status: "revoked",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
    const data = await snapshot(request);
    expect.soft(data.assignments).not.toContainEqual(
      direct("script-1", "user-actor-A"),
    );
    expect.soft(data.assignments).toContainEqual(
      byRole("script-1", "role-actor-A"),
    );
    const read = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      read,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test("test_TP-025 — manager cannot revoke another production's assignment; own-production control succeeds", async ({
    request,
  }) => {
    await seed(
      request,
      fixture([direct("script-B1", "user-actor-C", "prod-B")]),
    );
    const before = await snapshot(request, "prod-B");
    const denied = await call(
      request,
      "user-manager-A",
      "DELETE",
      "/api/productions/prod-B/resources/script-B1/assignments",
      { memberId: "user-actor-C" },
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before, "prod-B");

    const control = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(control, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
  });

  test("test_TP-026 — assignment in one production grants no access in another", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-D")]));
    const before = await snapshot(request, "prod-B");
    const denied = await call(
      request,
      "user-actor-D",
      "GET",
      "/api/productions/prod-B/resources/script-B1/access",
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before, "prod-B");

    const control = await call(request, "user-actor-D", "GET", scriptUrl);
    await success(
      control,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test("test_TP-027 — unassigned actor and dancer are denied; assigned controls succeed", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const actorDenied = await call(
      request,
      "user-actor-A",
      "GET",
      choreographyUrl,
    );
    await rejection(actorDenied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
    const dancerDenied = await call(
      request,
      "user-dancer-A",
      "GET",
      scriptUrl,
    );
    await rejection(dancerDenied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);

    const actorGrant = await call(
      request,
      "user-manager-A",
      "PUT",
      "/api/productions/prod-A/resources/choreo-1/assignments",
      { memberId: "user-actor-A" },
    );
    await success(actorGrant, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "choreo-1",
      memberId: "user-actor-A",
    });
    const actorControl = await call(
      request,
      "user-actor-A",
      "GET",
      choreographyUrl,
    );
    await success(
      actorControl,
      200,
      resourceBody(
        "prod-A",
        "choreo-1",
        "choreo-v2",
        "CHOREO TWO",
        "video/mp4",
      ),
    );

    const dancerGrant = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { memberId: "user-dancer-A" },
    );
    await success(dancerGrant, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-dancer-A",
    });
    const dancerControl = await call(
      request,
      "user-dancer-A",
      "GET",
      scriptUrl,
    );
    await success(
      dancerControl,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test("test_TP-028 — revoked access also denies a retained previous version", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const revoked = await call(
      request,
      "user-manager-A",
      "DELETE",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(revoked, 200, {
      status: "revoked",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
    const before = await snapshot(request);
    const denied = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/productions/prod-A/resources/script-1/access?versionId=script-v1",
    );
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test.skip("test_TP-029 — no public route publishes a contract version", async () => {});

  test.skip("test_TP-030 — duplicate notification semantics are unresolved", async () => {});

  test("test_TP-031 — notification link is withheld after revocation and works while access remains", async ({
    request,
  }) => {
    const notifications = [
      {
        id: "notification-1",
        recipientId: "user-actor-A",
        productionId: "prod-A",
        resourceId: "script-1",
        link: scriptUrl,
      },
    ];
    await seed(
      request,
      fixture([direct("script-1", "user-actor-A")], [], notifications),
    );
    const revoked = await call(
      request,
      "user-manager-A",
      "DELETE",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(revoked, 200, {
      status: "revoked",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
    const response = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/notifications",
    );
    const result = await success(response, 200, {});
    const messages = Array.isArray(result.notifications)
      ? (result.notifications as JsonRecord[])
      : [];
    expect.soft(Array.isArray(result.notifications)).toBe(true);
    expect.soft(messages).toHaveLength(1);
    if (messages.length > 0) {
      expect.soft(messages[0].link).toBeFalsy();
    }

    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(
      request,
      fixture([direct("script-1", "user-actor-A")], [], notifications),
    );
    const control = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/notifications",
    );
    const controlResult = await success(control, 200, {});
    expect.soft(controlResult.notifications).toEqual([
      {
        recipientId: "user-actor-A",
        productionId: "prod-A",
        resourceId: "script-1",
        link: scriptUrl,
      },
    ]);
    const linked = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      linked,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });
});

  test.skip("test_TP-032 — notification delivery trigger and retry route are undefined", async () => {});

  test("test_TP-033 — access is denied after the sixty-second revocation bound", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const control = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      control,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
    const revoked = await call(
      request,
      "user-manager-A",
      "DELETE",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(revoked, 200, {
      status: "revoked",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
    await clock(request, "2026-01-15T12:01:00Z");
    const before = await snapshot(request);
    const expired = await call(request, "user-actor-A", "GET", scriptUrl);
    await rejection(expired, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test("test_TP-034 — access remains denied beyond the sixty-second limit", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const control = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      control,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
    const revoked = await call(
      request,
      "user-manager-A",
      "DELETE",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(revoked, 200, {
      status: "revoked",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
    await clock(request, "2026-01-15T12:01:00.001Z");
    const before = await snapshot(request);
    const response = await call(request, "user-actor-A", "GET", scriptUrl);
    await rejection(response, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test.skip("test_TP-035 — storage encryption evidence is not exposed by the contract", async () => {});

  test("test_TP-036 — signature binds signer, version, UTC timestamp, and audit event", async ({
    request,
  }) => {
    await seed(request, fixture([direct("contract-1", "user-actor-A")]));
    const response = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      {},
    );
    await success(response, 200, {
      status: "signed",
      productionId: "prod-A",
      contractId: "contract-1",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });
    const data = await snapshot(request);
    expect.soft(data.signatures).toEqual([
      {
        contractId: "contract-1",
        versionId: "contract-v2",
        signerId: "user-actor-A",
        signedAt: now,
      },
    ]);
    expect.soft(data.auditEvents).toEqual([
      {
        productionId: "prod-A",
        resourceId: "contract-1",
        action: "signed",
        actorId: "user-actor-A",
        versionId: "contract-v2",
        occurredAt: now,
      },
    ]);
  });

  test("test_TP-037 — failed persistence does not report or store a signature", async ({
    request,
  }) => {
    const setup = fixture([direct("contract-1", "user-actor-A")]);
    await seed(request, setup);
    const control = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      {},
    );
    await success(control, 200, {
      status: "signed",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });

    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(request, setup);
    await faults(request, 1);
    const before = await snapshot(request);
    const failed = await call(
      request,
      "user-actor-A",
      "POST",
      signatureUrl,
      {},
    );
    await rejection(
      failed,
      503,
      "persistence_failed",
      "The change was not saved.",
    );
    await assertNoWrites(request, before);
  });

  test("test_TP-038 — failed version save does not report publication", async ({
    request,
  }) => {
    const setup = fixture();
    await seed(request, setup);
    const control = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await success(control, 201, {
      status: "published",
      productionId: "prod-A",
      resourceId: "script-1",
      versionId: "script-v3",
      current: true,
    });

    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(request, setup);
    await faults(request, 1);
    const before = await snapshot(request);
    const failed = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await rejection(
      failed,
      503,
      "persistence_failed",
      "The change was not saved.",
    );
    await assertNoWrites(request, before);
  });

  test("test_TP-039 — new version and current pointer commit together", async ({
    request,
  }) => {
    const setup = fixture();
    await seed(request, setup);
    const published = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await success(published, 201, {
      status: "published",
      productionId: "prod-A",
      resourceId: "script-1",
      versionId: "script-v3",
      current: true,
    });
    const committed = await snapshot(request);
    expect.soft(committed.versions).toContainEqual(
      expect.objectContaining({
        id: "script-v3",
        content: "SCRIPT THREE",
        current: true,
      }),
    );

    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(request, setup);
    await faults(request, 1);
    const beforeFailure = await snapshot(request);
    const failed = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await rejection(
      failed,
      503,
      "persistence_failed",
      "The change was not saved.",
    );
    await assertNoWrites(request, beforeFailure);
  });

  test("test_TP-040 — monthly availability passes at and fails outside the 99.9 percent boundary", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, { unavailableMinutes: 43.2 });
    const boundary = await call(request, "user-manager-A", "GET", "/api/health");
    await success(boundary, 200, {
      available: true,
      unavailableMinutes: 43.2,
      announcedMaintenanceMinutes: 0,
    });

    await measurements(request, { unavailableMinutes: 43.21 });
    const outside = await call(request, "user-manager-A", "GET", "/api/health");
    await success(outside, 200, {
      available: false,
      unavailableMinutes: 43.21,
      announcedMaintenanceMinutes: 0,
    });
  });

  test("test_TP-041 — announced maintenance is excluded from monthly downtime", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      unavailableMinutes: 0.21,
      announcedMaintenanceMinutes: 43,
    });
    const response = await call(request, "user-manager-A", "GET", "/api/health");
    await success(response, 200, {
      available: true,
      unavailableMinutes: 0.21,
      announcedMaintenanceMinutes: 43,
    });
  });

  test("test_TP-042 — standard request p95 passes at 1.99 seconds", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      standardRequestLatenciesMs: [
        ...Array<number>(94).fill(1500),
        1990,
        ...Array<number>(5).fill(2010),
      ],
      choreographyPlaybackStartMs: 3000,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/health/performance",
    );
    await success(response, 200, {
      withinTarget: true,
      standardRequestP95Ms: 1990,
      choreographyPlaybackStartMs: 3000,
    });
  });

  test("test_TP-043 — standard request p95 fails just outside two seconds", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      standardRequestLatenciesMs: [
        ...Array<number>(94).fill(1500),
        2010,
        ...Array<number>(5).fill(2100),
      ],
      choreographyPlaybackStartMs: 3000,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/health/performance",
    );
    await success(response, 200, {
      withinTarget: false,
      standardRequestP95Ms: 2010,
      choreographyPlaybackStartMs: 3000,
    });
  });

  test("test_TP-044 — choreography playback starts at four seconds", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      standardRequestLatenciesMs: [1000],
      choreographyPlaybackStartMs: 4000,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/health/performance",
    );
    await success(response, 200, {
      withinTarget: true,
      standardRequestP95Ms: 1000,
      choreographyPlaybackStartMs: 4000,
    });
  });

  test("test_TP-045 — choreography playback fails just outside four seconds", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      standardRequestLatenciesMs: [1000],
      choreographyPlaybackStartMs: 4001,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/health/performance",
    );
    await success(response, 200, {
      withinTarget: false,
      standardRequestP95Ms: 1000,
      choreographyPlaybackStartMs: 4001,
    });
  });

  test("test_TP-046 — notification queueing meets the 99 percent boundary", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      eligibleNotifications: 100,
      queuedNotificationsWithin60Seconds: 99,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/notifications/delivery-status",
    );
    await success(response, 200, {
      queued: 99,
      delivered: 99,
      failed: 1,
      checkedAt: now,
    });
  });

  test("test_TP-047 — notification queueing fails below 99 percent", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      eligibleNotifications: 100,
      queuedNotificationsWithin60Seconds: 98,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/notifications/delivery-status",
    );
    await success(response, 200, {
      queued: 98,
      delivered: 98,
      failed: 2,
      checkedAt: now,
    });
  });

  test.skip("test_TP-048 — the measurement contract cannot represent queue delays", async () => {});

  test("test_TP-049 — script publication notifies every assigned actor and no unassigned member", async ({
    request,
  }) => {
    await seed(
      request,
      fixture([
        direct("script-1", "user-actor-A"),
        direct("script-1", "user-actor-B"),
      ]),
    );
    const publication = await call(
      request,
      "user-producer-A",
      "POST",
      publishUrl,
      {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      },
    );
    await success(publication, 201, {
      status: "published",
      productionId: "prod-A",
      resourceId: "script-1",
      versionId: "script-v3",
      current: true,
    });
    for (const userId of ["user-actor-A", "user-actor-B"]) {
      const response = await call(
        request,
        userId,
        "GET",
        "/api/notifications",
      );
      const result = await success(response, 200, {});
      expect.soft(result.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            recipientId: userId,
            productionId: "prod-A",
            resourceId: "script-1",
            link: scriptUrl,
          }),
        ]),
      );
    }
    const unassigned = await call(
      request,
      "user-member-A",
      "GET",
      "/api/notifications",
    );
    const result = await success(unassigned, 200, {});
    expect.soft(result.notifications).toEqual([]);
  });

  test("test_TP-050 — recovery meets the 15 minute RPO boundary", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      recoveryLostMinutes: 15,
      recoveryDurationSeconds: 4 * 60 * 60,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/operations/recovery-check",
    );
    await success(response, 200, {
      ready: true,
      recoveryPointObjectiveMinutes: 15,
      recoveryTimeObjectiveHours: 4,
    });
  });

  test("test_TP-051 — recovery fails just outside the 15 minute RPO", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      recoveryLostMinutes: 15 + 1 / 60,
      recoveryDurationSeconds: 4 * 60 * 60,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/operations/recovery-check",
    );
    await success(response, 200, {
      ready: false,
      recoveryPointObjectiveMinutes: 15,
      recoveryTimeObjectiveHours: 4,
    });
  });

  test("test_TP-052 — recovery meets the four hour RTO boundary", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      recoveryLostMinutes: 15,
      recoveryDurationSeconds: 4 * 60 * 60,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/operations/recovery-check",
    );
    await success(response, 200, {
      ready: true,
      recoveryPointObjectiveMinutes: 15,
      recoveryTimeObjectiveHours: 4,
    });
  });

  test("test_TP-053 — recovery fails just outside the four hour RTO", async ({
    request,
  }) => {
    await seed(request);
    await measurements(request, {
      recoveryLostMinutes: 15,
      recoveryDurationSeconds: 4 * 60 * 60 + 1,
    });
    const response = await call(
      request,
      "user-manager-A",
      "GET",
      "/api/operations/recovery-check",
    );
    await success(response, 200, {
      ready: false,
      recoveryPointObjectiveMinutes: 15,
      recoveryTimeObjectiveHours: 4,
    });
  });

  test.skip("test_TP-054 — no callable backup restore operation or restored-state contract", async () => {});

  test.skip("test_TP-055 — screen-reader runtime and UI route are not specified", async () => {});
  test.skip("test_TP-056 — agreed expected peak workload is not supplied", async () => {});
  test.skip("test_TP-057 — agreed expected peak workload is not supplied", async () => {});

  test("test_TP-058 — concurrent publications retain versions and one current pointer", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const [first, second] = await Promise.all([
      call(request, "user-producer-A", "POST", publishUrl, {
        versionId: "script-v3",
        content: "SCRIPT THREE",
        contentType: "text/plain",
      }),
      call(request, "user-producer-A", "POST", publishUrl, {
        versionId: "script-v4",
        content: "SCRIPT FOUR",
        contentType: "text/plain",
      }),
    ]);
    await success(first, 201, { status: "published" });
    await success(second, 201, { status: "published" });
    const data = await snapshot(request);
    const versions = data.versions as JsonRecord[];
    expect.soft(versions).toContainEqual(
      expect.objectContaining({ id: "script-v3", content: "SCRIPT THREE" }),
    );
    expect.soft(versions).toContainEqual(
      expect.objectContaining({ id: "script-v4", content: "SCRIPT FOUR" }),
    );
    expect
      .soft(
        versions.filter(
          (versionRecord) =>
            versionRecord.resourceId === "script-1" &&
            versionRecord.current === true,
        ),
      )
      .toHaveLength(1);
    expect.soft(data.assignments).toEqual([
      direct("script-1", "user-actor-A"),
    ]);
  });

  test("test_TP-059 — concurrent signatures remain separate for each signer", async ({
    request,
  }) => {
    await seed(
      request,
      fixture([
        direct("contract-1", "user-actor-A"),
        direct("contract-1", "user-actor-B"),
      ]),
    );
    const [actorA, actorB] = await Promise.all([
      call(request, "user-actor-A", "POST", signatureUrl, {}),
      call(request, "user-actor-B", "POST", signatureUrl, {}),
    ]);
    await success(actorA, 200, {
      status: "signed",
      versionId: "contract-v2",
      signerId: "user-actor-A",
      signedAt: now,
    });
    await success(actorB, 200, {
      status: "signed",
      versionId: "contract-v2",
      signerId: "user-actor-B",
      signedAt: now,
    });
    const data = await snapshot(request);
    expect.soft(data.signatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contractId: "contract-1",
          versionId: "contract-v2",
          signerId: "user-actor-A",
          signedAt: now,
        }),
        expect.objectContaining({
          contractId: "contract-1",
          versionId: "contract-v2",
          signerId: "user-actor-B",
          signedAt: now,
        }),
      ]),
    );
  });

  test.skip("test_TP-060 — productionId is a text path parameter, not a JSON number", async () => {});

  test("test_TP-061 — assignment without a target is rejected; valid target is the control", async ({
    request,
  }) => {
    await seed(request);
    const before = await snapshot(request);
    const rejected = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      {},
    );
    await rejection(rejected, 400, "invalid_request");
    await assertNoWrites(request, before);

    const control = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(control, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
  });

  test.skip("test_TP-063 — no resource-list route is defined", async () => {});

  test("test_TP-062 — removing production membership denies a previously assigned member", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const control = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      control,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );

    const removed = fixture([direct("script-1", "user-actor-A")]);
    removed.users = removed.users.map((user) =>
      user.id === "user-actor-A"
        ? { id: user.id, rolesByProduction: {} }
        : user,
    );
    const reset = await request.post("/__test/reset");
    expect(reset.status()).toBe(204);
    await seed(request, removed);
    const before = await snapshot(request);
    const denied = await call(request, "user-actor-A", "GET", scriptUrl);
    await rejection(denied, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test("test_TP-064 — authorized actor receives the latest published script", async ({
    request,
  }) => {
    const latest = fixture([direct("script-1", "user-actor-A")]);
    latest.resources[1].versions.push(v("script-v3", "SCRIPT THREE"));
    latest.resources[1].currentVersionId = "script-v3";
    await seed(request, latest);
    const response = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      response,
      200,
      resourceBody("prod-A", "script-1", "script-v3", "SCRIPT THREE"),
    );
  });

  test("test_TP-065 — notification link cannot be used after membership removal", async ({
    request,
  }) => {
    const removed = fixture(
      [],
      [],
      [
        {
          id: "notification-1",
          recipientId: "user-actor-A",
          productionId: "prod-A",
          resourceId: "script-1",
          link: scriptUrl,
        },
      ],
    );
    removed.users = removed.users.map((user) =>
      user.id === "user-actor-A"
        ? { id: user.id, rolesByProduction: {} }
        : user,
    );
    await seed(request, removed);
    const notifications = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/notifications",
    );
    const result = await success(notifications, 200, {});
    const items = Array.isArray(result.notifications)
      ? (result.notifications as JsonRecord[])
      : [];
    expect.soft(Array.isArray(result.notifications)).toBe(true);
    expect.soft(items).toHaveLength(1);
    if (items.length > 0) {
      expect.soft(items[0].link).toBeFalsy();
    }
    const before = await snapshot(request);
    const followed = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/productions/prod-A/resources/script-1/access",
    );
    await rejection(followed, 403, "forbidden", "Access denied.");
    await assertNoWrites(request, before);
  });

  test.skip("test_TP-067 — control for unrepresentable TP-060 is blocked", async () => {});

  test("test_TP-068 — assignment with a target member is accepted", async ({
    request,
  }) => {
    await seed(request);
    const response = await call(
      request,
      "user-manager-A",
      "PUT",
      scriptAssignmentUrl,
      { memberId: "user-actor-A" },
    );
    await success(response, 201, {
      status: "assigned",
      productionId: "prod-A",
      resourceId: "script-1",
      memberId: "user-actor-A",
    });
  });

  test("test_TP-069 — assigned member can read before membership removal", async ({
    request,
  }) => {
    await seed(request, fixture([direct("script-1", "user-actor-A")]));
    const response = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      response,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });

  test.skip("test_TP-070 — control for blocked resource listing has no route", async () => {});

  test("test_TP-071 — notification link works while current access remains", async ({
    request,
  }) => {
    await seed(
      request,
      fixture(
        [direct("script-1", "user-actor-A")],
        [],
        [
          {
            id: "notification-1",
            recipientId: "user-actor-A",
            productionId: "prod-A",
            resourceId: "script-1",
            link: scriptUrl,
          },
        ],
      ),
    );
    const response = await call(
      request,
      "user-actor-A",
      "GET",
      "/api/notifications",
    );
    const result = await success(response, 200, {});
    expect.soft(result.notifications).toEqual([
      {
        recipientId: "user-actor-A",
        productionId: "prod-A",
        resourceId: "script-1",
        link: scriptUrl,
      },
    ]);
    const linked = await call(request, "user-actor-A", "GET", scriptUrl);
    await success(
      linked,
      200,
      resourceBody("prod-A", "script-1", "script-v2", "SCRIPT TWO"),
    );
  });