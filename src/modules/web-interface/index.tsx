import type { ReactElement } from "react";

export interface ProductionDashboardProps {
  productionId: string;
}

export interface ContractReviewProps {
  productionId: string;
  contractId: string;
}

export interface MaterialViewerProps {
  productionId: string;
  resourceId: string;
}

export interface NotificationPreferencesProps {
  userId: string;
}

export interface AccessibilityStatus {
  conformsToWcag22AA: boolean;
}

function notImplemented(operation: string): never {
  const error = new Error(`${operation} is not implemented`);
  error.name = "NotImplementedError";
  throw error;
}

export function ProductionDashboard(
  props: ProductionDashboardProps,
): ReactElement {
  void props;
  return notImplemented("ProductionDashboard");
}

export function ContractReview(props: ContractReviewProps): ReactElement {
  void props;
  return notImplemented("ContractReview");
}

export function MaterialViewer(props: MaterialViewerProps): ReactElement {
  void props;
  return notImplemented("MaterialViewer");
}

export function NotificationPreferencesPanel(
  props: NotificationPreferencesProps,
): ReactElement {
  void props;
  return notImplemented("NotificationPreferencesPanel");
}

export function getAccessibilityStatus(
  request: Request,
): Promise<AccessibilityStatus> {
  void request;
  return notImplemented("getAccessibilityStatus");
}
