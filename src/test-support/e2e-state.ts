export interface E2EUser {
  id: string;
  rolesByProduction: Record<string, string[]>;
}

export interface E2EProduction {
  id: string;
}

export interface E2EVersion {
  id: string;
  content: string;
  contentType: string;
  publishedAt: string;
}

export interface E2EResource {
  id: string;
  productionId: string;
  type: "contract" | "script" | "choreography";
  versions: E2EVersion[];
  currentVersionId: string;
}

export interface E2EAssignment {
  productionId: string;
  resourceId: string;
  memberId?: string;
  roleId?: string;
}

export interface E2ESignature {
  contractId: string;
  versionId: string;
  signerId: string;
  signedAt: string;
}

export interface E2ENotification {
  id: string;
  recipientId: string;
  productionId: string;
  resourceId: string;
  link?: string;
}

export interface E2EAuditEvent {
  productionId: string;
  resourceId: string;
  action: string;
  actorId: string;
  versionId?: string;
  occurredAt: string;
}

export interface E2EMeasurements {
  unavailableMinutes?: number;
  announcedMaintenanceMinutes?: number;
  standardRequestLatenciesMs?: number[];
  choreographyPlaybackStartMs?: number;
  eligibleNotifications?: number;
  queuedNotificationsWithin60Seconds?: number;
  notificationDeliveryFailures?: number;
  recoveryLostMinutes?: number;
  recoveryDurationSeconds?: number;
  expectedPeak?: {
    users: number;
    productions: number;
    materials: number;
    concurrentSessions: number;
  };
  actualPeak?: {
    users: number;
    productions: number;
    materials: number;
    concurrentSessions: number;
  };
}

export interface E2EState {
  users: E2EUser[];
  productions: E2EProduction[];
  resources: E2EResource[];
  assignments: E2EAssignment[];
  signatures: E2ESignature[];
  notifications: E2ENotification[];
  auditEvents: E2EAuditEvent[];
  now: string;
  databaseCommitFailures: number;
  notificationDeliveryFailures: number;
  measurements: E2EMeasurements;
}

const emptyMeasurements: E2EMeasurements = {};

function createEmptyState(): E2EState {
  return {
    users: [],
    productions: [],
    resources: [],
    assignments: [],
    signatures: [],
    notifications: [],
    auditEvents: [],
    now: "2026-01-15T12:00:00Z",
    databaseCommitFailures: 0,
    notificationDeliveryFailures: 0,
    measurements: { ...emptyMeasurements },
  };
}

type E2EGlobal = typeof globalThis & { __setsafeE2EState?: E2EState };
const testGlobal = globalThis as E2EGlobal;
export const e2eState = (testGlobal.__setsafeE2EState ??= createEmptyState());

export function resetE2EState(): void {
  Object.assign(e2eState, createEmptyState());
}

export function hasUniqueIds(
  records: Array<{ id: string }>,
): boolean {
  return new Set(records.map((record) => record.id)).size === records.length;
}
