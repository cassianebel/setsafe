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
  void input;
  return notImplemented("assignContract");
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
  void request;
  return notImplemented("listNotifications");
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
