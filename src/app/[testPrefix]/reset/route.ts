import { NextResponse } from "next/server";
import { resetE2EState } from "@/test-support/e2e-state";

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
  resetE2EState();
  return new Response(null, { status: 204 });
}
