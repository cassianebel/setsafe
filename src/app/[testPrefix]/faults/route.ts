import { NextResponse } from "next/server";
import { e2eState } from "@/test-support/e2e-state";

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

export async function POST(request: Request): Promise<Response> {
  const response = unavailable(request);
  if (response) {
    return response;
  }
  const body: unknown = await request.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("databaseCommitFailures" in body) ||
    !("notificationDeliveryFailures" in body) ||
    typeof body.databaseCommitFailures !== "number" ||
    typeof body.notificationDeliveryFailures !== "number" ||
    body.databaseCommitFailures < 0 ||
    body.notificationDeliveryFailures < 0
  ) {
    return NextResponse.json(
      { error: "invalid_request", message: "Failure counts must be non-negative numbers." },
      { status: 400 },
    );
  }
  e2eState.databaseCommitFailures = body.databaseCommitFailures;
  e2eState.notificationDeliveryFailures =
    body.notificationDeliveryFailures;
  return new Response(null, { status: 204 });
}
