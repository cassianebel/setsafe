import { e2eState } from "@/test-support/e2e-state";

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
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("authenticateRequest");
  }

  const userId = request.headers.get("X-SetSafe-Test-User");
  const user = e2eState.users.find((candidate) => candidate.id === userId);
  if (!user) {
    const error = new Error("Access denied.");
    error.name = "AuthorizationError";
    throw error;
  }

  return Promise.resolve({
    subject: user.id,
    email: `${user.id}@example.invalid`,
    emailVerified: true,
    mfaAuthenticated: true,
  });
}

export function resolveApplicationUser(
  identity: AuthenticatedIdentity,
): Promise<ApplicationUser> {
  void identity;
  return notImplemented("resolveApplicationUser");
}
