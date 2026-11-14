import type { AuthenticatedIdentity } from "../identity-integration";
import { authenticateRequest } from "../identity-integration";
import { e2eState } from "@/test-support/e2e-state";

export type ProductionRole = "producer" | "manager" | "actor" | "dancer";

export interface ResourceAccessRequest {
  identity: AuthenticatedIdentity;
  productionId: string;
  resourceId: string;
}

function notImplemented(operation: string): never {
  const error = new Error(`${operation} is not implemented`);
  error.name = "NotImplementedError";
  throw error;
}

function denied(): never {
  const error = new Error("Access denied.");
  error.name = "AuthorizationError";
  throw error;
}

function isTestMode(): boolean {
  return process.env.SETSAFE_E2E_TEST_MODE === "1";
}

function hasProductionMembership(
  userId: string,
  productionId: string,
): boolean {
  const user = e2eState.users.find((candidate) => candidate.id === userId);
  return (
    user !== undefined &&
    Object.prototype.hasOwnProperty.call(
      user.rolesByProduction,
      productionId,
    ) &&
    e2eState.productions.some((production) => production.id === productionId)
  );
}

function userHasResourceAccess(
  userId: string,
  productionId: string,
  resourceId: string,
): boolean {
  const user = e2eState.users.find((candidate) => candidate.id === userId);
  if (
    !user ||
    !hasProductionMembership(userId, productionId) ||
    !e2eState.resources.some(
      (resource) =>
        resource.id === resourceId &&
        resource.productionId === productionId,
    )
  ) {
    return false;
  }

  const roles = user.rolesByProduction[productionId] ?? [];
  return e2eState.assignments.some(
    (assignment) =>
      assignment.productionId === productionId &&
      assignment.resourceId === resourceId &&
      (assignment.memberId === userId ||
        (assignment.roleId !== undefined && roles.includes(assignment.roleId))),
  );
}

export function requireProductionRole(
  identity: AuthenticatedIdentity,
  productionId: string,
  allowedRoles: readonly ProductionRole[],
): Promise<void> {
  if (!isTestMode()) {
    return notImplemented("requireProductionRole");
  }
  const user = e2eState.users.find(
    (candidate) => candidate.id === identity.subject,
  );
  const roles = user?.rolesByProduction[productionId] ?? [];
  if (
    !hasProductionMembership(identity.subject, productionId) ||
    !allowedRoles.some((role) => roles.includes(role))
  ) {
    denied();
  }
  return Promise.resolve();
}

export function requireResourceAccess(
  request: ResourceAccessRequest,
): Promise<void> {
  if (!isTestMode()) {
    return notImplemented("requireResourceAccess");
  }
  if (
    !userHasResourceAccess(
      request.identity.subject,
      request.productionId,
      request.resourceId,
    )
  ) {
    denied();
  }
  return Promise.resolve();
}

export function authorizeResourceRequest(
  request: Request,
  productionId: string,
  resourceId: string,
): Promise<void> {
  if (!isTestMode()) {
    return notImplemented("authorizeResourceRequest");
  }
  return authenticateRequest(request).then((identity) =>
    requireResourceAccess({ identity, productionId, resourceId }),
  );
}
