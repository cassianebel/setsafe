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
  action: "published" | "signed";
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
  void operation;
  return notImplemented("withTransaction");
}

export function saveResourceAssignment(
  assignment: ResourceAssignmentRecord,
): Promise<void> {
  void assignment;
  return notImplemented("saveResourceAssignment");
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
  void event;
  return notImplemented("recordAuditEvent");
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
