import { randomUUID } from "node:crypto";
import { e2eState } from "@/test-support/e2e-state";

export type NotificationChannel = "email" | "in_app";

export interface NotificationDeliveryStatus {
  queued: number;
  delivered: number;
  failed: number;
  checkedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: readonly NotificationChannel[];
}

function notImplemented(operation: string): never {
  const error = new Error(`${operation} is not implemented`);
  error.name = "NotImplementedError";
  throw error;
}

export function enqueueNotifications(
  productionId: string,
  resourceId: string,
  event: "contract_assigned" | "version_published",
): Promise<void> {
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("enqueueNotifications");
  }
  void event;

  const recipients = new Set<string>();
  const assignments = e2eState.assignments.filter(
    (assignment) =>
      assignment.productionId === productionId &&
      assignment.resourceId === resourceId,
  );
  for (const assignment of assignments) {
    if (assignment.memberId) {
      recipients.add(assignment.memberId);
      continue;
    }
    if (assignment.roleId) {
      for (const user of e2eState.users) {
        if (
          user.rolesByProduction[productionId]?.includes(assignment.roleId)
        ) {
          recipients.add(user.id);
        }
      }
    }
  }

  for (const recipientId of recipients) {
    const user = e2eState.users.find(
      (candidate) => candidate.id === recipientId,
    );
    if (
      !user ||
      !Object.prototype.hasOwnProperty.call(
        user.rolesByProduction,
        productionId,
      )
    ) {
      continue;
    }
    e2eState.notifications.push({
      id: randomUUID(),
      recipientId,
      productionId,
      resourceId,
      link: `/api/productions/${encodeURIComponent(productionId)}/resources/${encodeURIComponent(resourceId)}/access`,
    });
  }
  return Promise.resolve();
}

export function deliverPendingNotifications(): Promise<void> {
  return notImplemented("deliverPendingNotifications");
}

export function getDeliveryStatus(
  request: Request,
): Promise<NotificationDeliveryStatus> {
  void request;
  return notImplemented("getDeliveryStatus");
}

export function setNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  void preferences;
  return notImplemented("setNotificationPreferences");
}
