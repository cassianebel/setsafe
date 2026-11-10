import type { AuthenticatedIdentity } from "../identity-integration";

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

export function requireProductionRole(
  identity: AuthenticatedIdentity,
  productionId: string,
  allowedRoles: readonly ProductionRole[],
): Promise<void> {
  void identity;
  void productionId;
  void allowedRoles;
  return notImplemented("requireProductionRole");
}

export function requireResourceAccess(
  request: ResourceAccessRequest,
): Promise<void> {
  void request;
  return notImplemented("requireResourceAccess");
}

export function authorizeResourceRequest(
  request: Request,
  productionId: string,
  resourceId: string,
): Promise<void> {
  void request;
  void productionId;
  void resourceId;
  return notImplemented("authorizeResourceRequest");
}
