import { e2eState } from "@/test-support/e2e-state";

export interface ContractSignatureRecord {
  contractId: string;
  contractVersionId: string;
  signerUserId: string;
  signedAt: string;
}

export interface PublishedVersionIntegrity {
  valid: boolean;
  checkedAt: string;
}

export interface RecoveryReadiness {
  ready: boolean;
  recoveryPointObjectiveMinutes: number;
  recoveryTimeObjectiveHours: number;
}

export interface ResourceAssignmentRecord {
  productionId: string;
  resourceId: string;
  memberId?: string;
  roleId?: string;
}

export interface PublishedVersionRecord {
  productionId: string;
  resourceId: string;
  versionId: string;
  fileReference: string;
  publishedAt: string;
}

export interface AuditRecord {
  productionId: string;
  resourceId: string;
  action: "assigned" | "published" | "signed";
  actorUserId: string;
  versionId: string;
  occurredAt: string;
}

export interface DeliveryAttemptRecord {
  notificationId: string;
  attemptedAt: string;
  outcome: "delivered" | "failed";
}

function notImplemented(operation: string): never {
  const error = new Error(`${operation} is not implemented`);
  error.name = "NotImplementedError";
  throw error;
}

export function withTransaction<T>(operation: () => Promise<T>): Promise<T> {
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("withTransaction");
  }

  const before = {
    assignments: [...e2eState.assignments],
    notifications: [...e2eState.notifications],
    auditEvents: [...e2eState.auditEvents],
  };
  return operation()
    .then((result) => {
      if (e2eState.databaseCommitFailures > 0) {
        e2eState.databaseCommitFailures -= 1;
        throw new Error("The database transaction could not be committed.");
      }
      return result;
    })
    .catch((error: unknown) => {
      e2eState.assignments = before.assignments;
      e2eState.notifications = before.notifications;
      e2eState.auditEvents = before.auditEvents;
      throw error;
    });
}

export function saveResourceAssignment(
  assignment: ResourceAssignmentRecord,
): Promise<void> {
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("saveResourceAssignment");
  }
  const exists = e2eState.assignments.some(
    (current) =>
      current.productionId === assignment.productionId &&
      current.resourceId === assignment.resourceId &&
      current.memberId === assignment.memberId &&
      current.roleId === assignment.roleId,
  );
  if (!exists) {
    e2eState.assignments.push(assignment);
  }
  return Promise.resolve();
}

export function savePublishedVersion(
  version: PublishedVersionRecord,
): Promise<void> {
  void version;
  return notImplemented("savePublishedVersion");
}

export function recordContractSignature(
  signature: ContractSignatureRecord,
): Promise<void> {
  void signature;
  return notImplemented("recordContractSignature");
}

export function recordAuditEvent(event: AuditRecord): Promise<void> {
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("recordAuditEvent");
  }
  e2eState.auditEvents.push({
    productionId: event.productionId,
    resourceId: event.resourceId,
    action: event.action,
    actorId: event.actorUserId,
    versionId: event.versionId,
    occurredAt: event.occurredAt,
  });
  return Promise.resolve();
}

export function saveDeliveryAttempt(
  attempt: DeliveryAttemptRecord,
): Promise<void> {
  void attempt;
  return notImplemented("saveDeliveryAttempt");
}

export function saveNotificationPreferences(
  preferences: { userId: string; channels: readonly string[] },
): Promise<void> {
  void preferences;
  return notImplemented("saveNotificationPreferences");
}

export function verifyPublishedVersionIntegrity(
  request: Request,
): Promise<PublishedVersionIntegrity> {
  void request;
  return notImplemented("verifyPublishedVersionIntegrity");
}

export function verifyRecoveryReadiness(
  request: Request,
): Promise<RecoveryReadiness> {
  void request;
  return notImplemented("verifyRecoveryReadiness");
}
