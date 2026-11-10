export interface AuthenticatedIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  mfaAuthenticated: boolean;
}

export interface ApplicationUser {
  id: string;
  identitySubject: string;
}

function notImplemented(operation: string): never {
  const error = new Error(`${operation} is not implemented`);
  error.name = "NotImplementedError";
  throw error;
}

export function authenticateRequest(
  request: Request,
): Promise<AuthenticatedIdentity> {
  void request;
  return notImplemented("authenticateRequest");
}

export function resolveApplicationUser(
  identity: AuthenticatedIdentity,
): Promise<ApplicationUser> {
  void identity;
  return notImplemented("resolveApplicationUser");
}
