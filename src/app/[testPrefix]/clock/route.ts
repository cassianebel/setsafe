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

export async function PUT(request: Request): Promise<Response> {
  const response = unavailable(request);
  if (response) {
    return response;
  }
  const body: unknown = await request.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("now" in body) ||
    typeof body.now !== "string" ||
    Number.isNaN(Date.parse(body.now))
  ) {
    return NextResponse.json(
      { error: "invalid_request", message: "A valid UTC timestamp is required." },
      { status: 400 },
    );
  }
  e2eState.now = body.now;
  return new Response(null, { status: 204 });
}
