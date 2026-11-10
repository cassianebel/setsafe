import { NextResponse } from "next/server";
import {
  e2eState,
  hasUniqueIds,
  type E2EAssignment,
  type E2EAuditEvent,
  type E2ENotification,
  type E2EProduction,
  type E2EResource,
  type E2ESignature,
  type E2EUser,
} from "@/test-support/e2e-state";

interface FixtureInput {
  users: E2EUser[];
  productions: E2EProduction[];
  resources: E2EResource[];
  assignments: E2EAssignment[];
  signatures: E2ESignature[];
  notifications?: E2ENotification[];
  auditEvents?: E2EAuditEvent[];
}

function unavailable(request: Request): NextResponse | undefined {
  if (
    process.env.SETSAFE_E2E_TEST_MODE === "1" &&
    new URL(request.url).pathname.startsWith("/__test/")
  ) {
    return undefined;
  }
  return NextResponse.json(
    { error: "not_found", message: "No API route matches this request." },
    { status: 404 },
  );
}

function validFixture(value: unknown): value is FixtureInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const fixture = value as Partial<FixtureInput>;
  return (
    Array.isArray(fixture.users) &&
    Array.isArray(fixture.productions) &&
    Array.isArray(fixture.resources) &&
    Array.isArray(fixture.assignments) &&
    Array.isArray(fixture.signatures) &&
    (fixture.notifications === undefined ||
      Array.isArray(fixture.notifications)) &&
    (fixture.auditEvents === undefined || Array.isArray(fixture.auditEvents))
  );
}

export async function POST(request: Request): Promise<Response> {
  const response = unavailable(request);
  if (response) {
    return response;
  }

  const input: unknown = await request.json();
  if (!validFixture(input)) {
    return NextResponse.json(
      { error: "invalid_fixture", message: "Fixture collections are invalid." },
      { status: 400 },
    );
  }

  if (
    !hasUniqueIds(input.users) ||
    !hasUniqueIds(input.productions) ||
    !hasUniqueIds(input.resources)
  ) {
    return NextResponse.json(
      { error: "invalid_fixture", message: "Fixture IDs must be unique." },
      { status: 400 },
    );
  }

  e2eState.users = input.users;
  e2eState.productions = input.productions;
  e2eState.resources = input.resources;
  e2eState.assignments = input.assignments;
  e2eState.signatures = input.signatures;
  e2eState.notifications = input.notifications ?? [];
  e2eState.auditEvents = input.auditEvents ?? [];

  return NextResponse.json({ created: true }, { status: 201 });
}
