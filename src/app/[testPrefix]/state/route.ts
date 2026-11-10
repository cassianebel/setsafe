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

export async function GET(request: Request): Promise<Response> {
  const response = unavailable(request);
  if (response) {
    return response;
  }
  const productionId = new URL(request.url).searchParams.get("productionId");
  if (!productionId) {
    return NextResponse.json(
      { error: "invalid_request", message: "productionId is required." },
      { status: 400 },
    );
  }

  const resources = e2eState.resources.filter(
    (resource) => resource.productionId === productionId,
  );
  const resourceIds = new Set(resources.map((resource) => resource.id));
  return NextResponse.json({
    assignments: e2eState.assignments.filter(
      (assignment) => assignment.productionId === productionId,
    ),
    versions: resources.flatMap((resource) =>
      resource.versions.map((version) => ({
        ...version,
        resourceId: resource.id,
        productionId,
        current: version.id === resource.currentVersionId,
      })),
    ),
    signatures: e2eState.signatures.filter((signature) =>
      resources.some((resource) => resource.id === signature.contractId),
    ),
    notifications: e2eState.notifications.filter(
      (notification) => notification.productionId === productionId,
    ),
    auditEvents: e2eState.auditEvents.filter(
      (event) => event.productionId === productionId,
    ),
    resourceIds: [...resourceIds],
  });
}
