import {
  assignContract,
  changeResourceAssignment,
  getAssignedChoreography,
  getAssignedScript,
  getAvailabilityStatus,
  getCapacityStatus,
  getPerformanceStatus,
  listNotifications,
  publishScriptVersion,
  signLatestContractVersion,
} from "@/modules/application-server";
import { verifyRecoveryReadiness, verifyPublishedVersionIntegrity } from "@/modules/application-data-adapter";
import { authorizeResourceRequest } from "@/modules/production-authorization";
import { getDeliveryStatus } from "@/modules/notification-delivery";
import { getAccessibilityStatus } from "@/modules/web-interface";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type PathParameters = string[];
type RouteOperation = (request: Request, parameters: PathParameters) => unknown;

interface ApiRoute {
  method: HttpMethod;
  pattern: RegExp;
  operation: RouteOperation;
}

const routes: readonly ApiRoute[] = [
  {
    method: "POST",
    pattern: /^\/api\/productions\/([^/]+)\/contracts\/([^/]+)\/assignments$/,
    operation: (request, [productionId, contractId]) =>
      assignContract({ request, productionId, contractId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/productions\/([^/]+)\/contracts\/([^/]+)\/signature$/,
    operation: (request, [productionId, contractId]) =>
      signLatestContractVersion({ request, productionId, contractId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/productions\/([^/]+)\/scripts\/([^/]+)$/,
    operation: (request, [productionId, resourceId]) =>
      getAssignedScript({ request, productionId, resourceId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/productions\/([^/]+)\/choreography\/([^/]+)$/,
    operation: (request, [productionId, resourceId]) =>
      getAssignedChoreography({ request, productionId, resourceId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/productions\/([^/]+)\/scripts\/([^/]+)\/versions$/,
    operation: (request, [productionId, resourceId]) =>
      publishScriptVersion({ request, productionId, resourceId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/productions\/([^/]+)\/resources\/([^/]+)\/assignments$/,
    operation: (request, [productionId, resourceId]) =>
      changeResourceAssignment({
        request,
        productionId,
        resourceId,
        action: "assign",
      }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/productions\/([^/]+)\/resources\/([^/]+)\/assignments$/,
    operation: (request, [productionId, resourceId]) =>
      changeResourceAssignment({
        request,
        productionId,
        resourceId,
        action: "revoke",
      }),
  },
  {
    method: "GET",
    pattern: /^\/api\/notifications$/,
    operation: (request) => listNotifications(request),
  },
  {
    method: "GET",
    pattern: /^\/api\/productions\/([^/]+)\/resources\/([^/]+)\/access$/,
    operation: (request, [productionId, resourceId]) =>
      authorizeResourceRequest(request, productionId, resourceId),
  },
  {
    method: "GET",
    pattern: /^\/api\/audit\/integrity$/,
    operation: (request) => verifyPublishedVersionIntegrity(request),
  },
  {
    method: "GET",
    pattern: /^\/api\/health$/,
    operation: (request) => getAvailabilityStatus(request),
  },
  {
    method: "GET",
    pattern: /^\/api\/health\/performance$/,
    operation: (request) => getPerformanceStatus(request),
  },
  {
    method: "GET",
    pattern: /^\/api\/notifications\/delivery-status$/,
    operation: (request) => getDeliveryStatus(request),
  },
  {
    method: "GET",
    pattern: /^\/api\/operations\/recovery-check$/,
    operation: (request) => verifyRecoveryReadiness(request),
  },
  {
    method: "GET",
    pattern: /^\/api\/accessibility$/,
    operation: (request) => getAccessibilityStatus(request),
  },
  {
    method: "GET",
    pattern: /^\/api\/operations\/capacity$/,
    operation: (request) => getCapacityStatus(request),
  },
];

async function handle(request: Request, method: HttpMethod): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const route = routes.find(
    (candidate) =>
      candidate.method === method && candidate.pattern.test(pathname),
  );

  if (!route) {
    return Response.json(
      { error: "not_found", message: "No API route matches this request." },
      { status: 404 },
    );
  }

  const match = route.pattern.exec(pathname);
  const parameters = (match?.slice(1) ?? []).map(decodeURIComponent);

  try {
    await route.operation(request, parameters);
    return Response.json(
      {
        error: "not_implemented",
        message: "This endpoint is not implemented.",
      },
      { status: 501 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "NotImplementedError") {
      return Response.json(
        { error: "not_implemented", message: error.message },
        { status: 501 },
      );
    }

    throw error;
  }
}

export function GET(request: Request): Promise<Response> {
  return handle(request, "GET");
}

export function POST(request: Request): Promise<Response> {
  return handle(request, "POST");
}

export function PUT(request: Request): Promise<Response> {
  return handle(request, "PUT");
}

export function DELETE(request: Request): Promise<Response> {
  return handle(request, "DELETE");
}
