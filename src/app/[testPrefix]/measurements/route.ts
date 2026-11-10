import { NextResponse } from "next/server";
import {
  e2eState,
  type E2EMeasurements,
} from "@/test-support/e2e-state";

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

function validMeasurements(value: unknown): value is E2EMeasurements {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request): Promise<Response> {
  const response = unavailable(request);
  if (response) {
    return response;
  }
  const input: unknown = await request.json();
  if (!validMeasurements(input)) {
    return NextResponse.json(
      { error: "invalid_request", message: "Measurements must be an object." },
      { status: 400 },
    );
  }
  e2eState.measurements = input;
  return new Response(null, { status: 204 });
}
