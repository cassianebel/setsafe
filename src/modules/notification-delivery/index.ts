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
  void productionId;
  void resourceId;
  void event;
  return notImplemented("enqueueNotifications");
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
