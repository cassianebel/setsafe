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
import { e2eState } from "@/test-support/e2e-state";

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
    operation: async (request, [productionId, contractId]) => {
      const body: unknown = await request.clone().json();
      await assignContract({ request, productionId, contractId });
      if (
        typeof body !== "object" ||
        body === null ||
        !("assigneeIds" in body) ||
        !Array.isArray(body.assigneeIds)
      ) {
        const error = new Error("assigneeIds must contain at least one member.");
        error.name = "BadRequestError";
        throw error;
      }
      return Response.json(
        {
          status: "assigned",
          productionId,
          contractId,
          assigneeIds: body.assigneeIds,
        },
        { status: 201 },
      );
    },
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
    operation: async (request, [productionId, resourceId]) => {
      await authorizeResourceRequest(request, productionId, resourceId);
      const resource = e2eState.resources.find(
        (candidate) =>
          candidate.productionId === productionId &&
          candidate.id === resourceId,
      );
      if (!resource) {
        const error = new Error("The resource was not found.");
        error.name = "ResourceNotFoundError";
        throw error;
      }
      return Response.json({
        authorized: true,
        productionId,
        resourceId,
        versionId: resource.currentVersionId,
      });
    },
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
    const result = await route.operation(request, parameters);
    if (result instanceof Response) {
      return result;
    }
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
    if (
      error instanceof Error &&
      (error.name === "AuthorizationError" ||
        error.name === "BadRequestError" ||
        error.name === "ResourceNotFoundError")
    ) {
      const status =
        error.name === "AuthorizationError"
          ? 403
          : error.name === "BadRequestError"
            ? 400
            : 404;
      const code =
        error.name === "AuthorizationError"
          ? "forbidden"
          : error.name === "BadRequestError"
            ? "invalid_request"
            : "not_found";
      return Response.json(
        { error: code, message: error.message },
        { status },
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
