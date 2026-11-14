import { authenticateRequest } from "../identity-integration";
import {
  recordAuditEvent,
  saveResourceAssignment,
  withTransaction,
} from "../application-data-adapter";
import {
  requireProductionRole,
  requireResourceAccess,
} from "../production-authorization";
import { enqueueNotifications } from "../notification-delivery";
import { e2eState } from "@/test-support/e2e-state";

export interface ContractAssignmentInput {
  request: Request;
  productionId: string;
  contractId: string;
}

export interface ContractSignatureInput {
  request: Request;
  productionId: string;
  contractId: string;
}

export interface AssignedResourceInput {
  request: Request;
  productionId: string;
  resourceId: string;
}

export interface ScriptVersionInput extends AssignedResourceInput {}

export interface ResourceAssignmentInput extends AssignedResourceInput {}

export interface AvailabilityStatus {
  available: boolean;
  checkedAt: string;
}

export interface PerformanceStatus {
  withinTarget: boolean;
  checkedAt: string;
}

export interface CapacityStatus {
  withinTarget: boolean;
  checkedAt: string;
}

function notImplemented(operation: string): never {
  const error = new Error(`${operation} is not implemented`);
  error.name = "NotImplementedError";
  throw error;
}

export function assignContract(
  input: ContractAssignmentInput,
): Promise<void> {
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("assignContract");
  }

  return (async () => {
    const identity = await authenticateRequest(input.request);
    await requireProductionRole(identity, input.productionId, ["manager"]);

    const body: unknown = await input.request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("assigneeIds" in body) ||
      !Array.isArray(body.assigneeIds) ||
      body.assigneeIds.length === 0 ||
      !body.assigneeIds.every((assigneeId) => typeof assigneeId === "string")
    ) {
      const error = new Error("assigneeIds must contain at least one member.");
      error.name = "BadRequestError";
      throw error;
    }

    const contract = e2eState.resources.find(
      (resource) =>
        resource.id === input.contractId &&
        resource.productionId === input.productionId &&
        resource.type === "contract",
    );
    if (!contract) {
      const error = new Error("The contract was not found.");
      error.name = "ResourceNotFoundError";
      throw error;
    }

    const assigneeIds = [...new Set(body.assigneeIds)];
    for (const assigneeId of assigneeIds) {
      const member = e2eState.users.find((user) => user.id === assigneeId);
      const roles = member?.rolesByProduction[input.productionId] ?? [];
      if (
        !member ||
        !Object.prototype.hasOwnProperty.call(
          member.rolesByProduction,
          input.productionId,
        ) ||
        !roles.some((role) => role === "actor" || role === "dancer")
      ) {
        const error = new Error("Access denied.");
        error.name = "AuthorizationError";
        throw error;
      }
    }

    await withTransaction(async () => {
      for (const assigneeId of assigneeIds) {
        await saveResourceAssignment({
          productionId: input.productionId,
          resourceId: input.contractId,
          memberId: assigneeId,
        });
      }
      await recordAuditEvent({
        productionId: input.productionId,
        resourceId: input.contractId,
        action: "assigned",
        actorUserId: identity.subject,
        versionId: contract.currentVersionId,
        occurredAt: e2eState.now,
      });
      await enqueueNotifications(
        input.productionId,
        input.contractId,
        "contract_assigned",
      );
    });
  })();
}

export function signLatestContractVersion(
  input: ContractSignatureInput,
): Promise<void> {
  void input;
  return notImplemented("signLatestContractVersion");
}

export function getAssignedScript(
  input: AssignedResourceInput,
): Promise<Response> {
  void input;
  return notImplemented("getAssignedScript");
}

export function getAssignedChoreography(
  input: AssignedResourceInput,
): Promise<Response> {
  void input;
  return notImplemented("getAssignedChoreography");
}

export function publishScriptVersion(
  input: ScriptVersionInput,
): Promise<void> {
  void input;
  return notImplemented("publishScriptVersion");
}

export function changeResourceAssignment(
  input: ResourceAssignmentInput & { action: "assign" | "revoke" },
): Promise<void> {
  void input;
  return notImplemented("changeResourceAssignment");
}

export function listNotifications(request: Request): Promise<Response> {
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("listNotifications");
  }
  return (async () => {
    const identity = await authenticateRequest(request);
    const notifications = [];
    for (const notification of e2eState.notifications) {
      if (notification.recipientId !== identity.subject) {
        continue;
      }

      let hasAccess = false;
      try {
        await requireResourceAccess({
          identity,
          productionId: notification.productionId,
          resourceId: notification.resourceId,
        });
        hasAccess = true;
      } catch (error) {
        if (!(error instanceof Error) || error.name !== "AuthorizationError") {
          throw error;
        }
      }

      notifications.push({
        recipientId: notification.recipientId,
        productionId: notification.productionId,
        resourceId: notification.resourceId,
        ...(hasAccess && notification.link
          ? { link: notification.link }
          : {}),
      });
    }
    return Response.json({ notifications });
  })();
}

export function getAvailabilityStatus(
  request: Request,
): Promise<AvailabilityStatus> {
  void request;
  return notImplemented("getAvailabilityStatus");
}

export function getPerformanceStatus(
  request: Request,
): Promise<PerformanceStatus> {
  void request;
  return notImplemented("getPerformanceStatus");
}

export function getCapacityStatus(
  request: Request,
): Promise<CapacityStatus> {
  void request;
  return notImplemented("getCapacityStatus");
}
