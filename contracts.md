# SetSafe contracts

This is a runnable skeleton only. All listed module operations throw a
`NotImplementedError`; no authentication, persistence, authorization, file
handling, notification delivery, or workflow logic is implemented. No runtime
collaborators (including the clock) are currently injected. The injection
column identifies the dependencies the implementation is expected to receive,
not work performed by this skeleton.

## Module contracts

Signatures below use the module's exported TypeScript types. Every operation
fails with `NotImplementedError` until implemented. The API layer translates
that error to HTTP 501.

| Module | Function and signature | Success result | How it fails | Spec rule | Injected |
|---|---|---|---|---|---|
| Identity integration | `authenticateRequest(request: Request): Promise<AuthenticatedIdentity>` | Verified identity with email and MFA state | `NotImplementedError`; future identity-provider failures must be surfaced | NFR-001; architecture decision: Auth0 identity, verified email and MFA | Auth0 verifier |
| Identity integration | `resolveApplicationUser(identity: AuthenticatedIdentity): Promise<ApplicationUser>` | SetSafe user mapped by Auth0 subject | `NotImplementedError`; future missing mapping must be surfaced | Domain Model; NFR-001; architecture identity mapping decision | Application data adapter |
| Production authorization | `requireProductionRole(identity: AuthenticatedIdentity, productionId: string, allowedRoles: readonly ProductionRole[]): Promise<void>` | Resolves when membership and one allowed production role are current | `NotImplementedError`; future denial must reject the operation | FR-001, FR-005, FR-006; NFR-001 | Identity integration; application data adapter |
| Production authorization | `requireResourceAccess(request: ResourceAccessRequest): Promise<void>` | Resolves when current membership and direct/role assignment grant access | `NotImplementedError`; future unauthorized access must be denied | Domain Model; FR-001–006; NFR-001 | Identity integration; application data adapter |
| Production authorization | `authorizeResourceRequest(request: Request, productionId: string, resourceId: string): Promise<void>` | Resolves after request-time production and resource authorization | `NotImplementedError`; future unauthorized access must be denied | NFR-001, including prior versions and cross-production access | Identity integration; application data adapter |
| Application server | `assignContract(input: ContractAssignmentInput): Promise<void>` | Contract assignment is committed for requested production members | `NotImplementedError`; future invalid membership/role or persistence failures must reject | FR-001; Scenario-001; NFR-002–003 | Identity integration; production authorization; data transaction; notification delivery |
| Application server | `signLatestContractVersion(input: ContractSignatureInput): Promise<void>` | Signature is recorded for the authenticated signer and latest version | `NotImplementedError`; future access, version, or persistence failures must reject | FR-002; Scenario-005; NFR-002–003 | Identity integration; production authorization; data transaction; UTC clock |
| Application server | `getAssignedScript(input: AssignedResourceInput): Promise<Response>` | Authorized latest script version is streamed | `NotImplementedError`; future unauthorized or storage failures must reject | FR-003; Scenario-002; NFR-001, NFR-004 | Identity integration; production authorization; application data adapter; private file storage |
| Application server | `getAssignedChoreography(input: AssignedResourceInput): Promise<Response>` | Authorized latest choreography version is streamed for viewing | `NotImplementedError`; future unauthorized or storage failures must reject | FR-004; Scenario-003; NFR-001, NFR-004 | Identity integration; production authorization; application data adapter; private file storage |
| Application server | `publishScriptVersion(input: ScriptVersionInput): Promise<void>` | Immutable version and current-version pointer are committed; notification work is created | `NotImplementedError`; future authorization or transaction failures must reject | FR-005; Scenario-006; NFR-002–003, NFR-005 | Identity integration; production authorization; data transaction; private file storage; notification delivery; UTC clock |
| Application server | `changeResourceAssignment(input: ResourceAssignmentInput & { action: "assign" \| "revoke" }): Promise<void>` | Assignment is granted or revoked within the production | `NotImplementedError`; future role, membership, or persistence failures must reject | FR-006; Scenarios 004, 007; NFR-001 | Identity integration; production authorization; application data adapter |
| Application server | `listNotifications(request: Request): Promise<Response>` | Notifications for the authenticated user are returned | `NotImplementedError`; future identity or data failures must reject | FR-007; NFR-005 | Identity integration; application data adapter |
| Application server | `getAvailabilityStatus(request: Request): Promise<AvailabilityStatus>` | Availability status is returned | `NotImplementedError`; future status-check failures must reject | NFR-003 | Application data adapter; clock |
| Application server | `getPerformanceStatus(request: Request): Promise<PerformanceStatus>` | Responsiveness status is returned | `NotImplementedError`; future measurement failures must reject | NFR-004 | Request metrics; clock |
| Application server | `getCapacityStatus(request: Request): Promise<CapacityStatus>` | Capacity status is returned against the agreed peak | `NotImplementedError`; future measurement failures must reject | NFR-008 | Workload metrics; configured expected peak |
| Application data adapter | `withTransaction<T>(operation: () => Promise<T>): Promise<T>` | Callback result is returned after its transaction commits | `NotImplementedError`; future transaction failures reject and do not report success | FR-001–002, FR-005–006; NFR-002–003 | Neon PostgreSQL transaction provider |
| Application data adapter | `saveResourceAssignment(assignment: ResourceAssignmentRecord): Promise<void>` | Assignment record is persisted | `NotImplementedError`; future persistence failures reject | Domain Model; FR-001, FR-003–006; NFR-001 | Neon PostgreSQL |
| Application data adapter | `savePublishedVersion(version: PublishedVersionRecord): Promise<void>` | Immutable version metadata and current pointer are persisted | `NotImplementedError`; future persistence failures reject | FR-002, FR-005; NFR-002 | Neon PostgreSQL transaction |
| Application data adapter | `recordContractSignature(signature: ContractSignatureRecord): Promise<void>` | Signer/version/timestamp signature record is persisted | `NotImplementedError`; future persistence failures reject | FR-002; Scenario-005; NFR-002 | Neon PostgreSQL; UTC clock |
| Application data adapter | `recordAuditEvent(event: AuditRecord): Promise<void>` | Publication or signing audit event is persisted | `NotImplementedError`; future persistence failures reject | NFR-002 | Neon PostgreSQL transaction; UTC clock |
| Application data adapter | `saveDeliveryAttempt(attempt: DeliveryAttemptRecord): Promise<void>` | Notification attempt outcome is persisted | `NotImplementedError`; future persistence failures reject | FR-007; NFR-005 | Neon PostgreSQL; UTC clock |
| Application data adapter | `saveNotificationPreferences(preferences: { userId: string; channels: readonly string[] }): Promise<void>` | User's selected channels are persisted | `NotImplementedError`; future persistence failures reject | Architecture notification-preference decision; NFR-005 | Neon PostgreSQL |
| Application data adapter | `verifyPublishedVersionIntegrity(request: Request): Promise<PublishedVersionIntegrity>` | Integrity status and check time are returned | `NotImplementedError`; future verification failures reject | NFR-002 | Neon PostgreSQL; UTC clock |
| Application data adapter | `verifyRecoveryReadiness(request: Request): Promise<RecoveryReadiness>` | Backup readiness and RPO/RTO status are returned | `NotImplementedError`; future verification failures reject | NFR-006 | Neon PostgreSQL backup and S3 recovery status |
| Private file storage adapter | `storePublishedFile(file: PublishedFile): Promise<string>` | Private immutable file reference is returned | `NotImplementedError`; future storage failures reject | FR-001–005; NFR-001–002 | Private AWS S3 client |
| Private file storage adapter | `streamAuthorizedFile(productionId: string, resourceId: string, versionId: string): Promise<AuthorizedFileStream>` | Authorized file stream and content type are returned | `NotImplementedError`; future storage or authorization failures reject | FR-003–004; NFR-001, NFR-004 | Private AWS S3 client; production authorization |
| Notification delivery | `enqueueNotifications(productionId: string, resourceId: string, event: "contract_assigned" \| "version_published"): Promise<void>` | Notification work for recipients with current access is queued | `NotImplementedError`; future queue failures reject | FR-001, FR-005, FR-007; NFR-005 | Application data adapter; delivery queue |
| Notification delivery | `deliverPendingNotifications(): Promise<void>` | Pending work is attempted and outcomes recorded | `NotImplementedError`; future delivery failures are recorded/retried | FR-007; NFR-005 | Application data adapter; selected delivery providers; clock |
| Notification delivery | `getDeliveryStatus(request: Request): Promise<NotificationDeliveryStatus>` | Delivery counts and check time are returned | `NotImplementedError`; future status-query failures reject | NFR-005 | Application data adapter; clock |
| Notification delivery | `setNotificationPreferences(preferences: NotificationPreferences): Promise<void>` | User channel choices are saved | `NotImplementedError`; future persistence failures reject | Architecture notification-preference decision; NFR-005 | Application data adapter |
| Web interface | `ProductionDashboard(props: ProductionDashboardProps): ReactElement` | Production and assigned-resource interface renders | `NotImplementedError` | FR-001–007; NFR-007 | Identity integration; application server |
| Web interface | `ContractReview(props: ContractReviewProps): ReactElement` | Contract review and signing interface renders | `NotImplementedError` | FR-001–002; NFR-007 | Identity integration; application server |
| Web interface | `MaterialViewer(props: MaterialViewerProps): ReactElement` | Assigned script/choreography viewing interface renders | `NotImplementedError` | FR-003–004; NFR-007 | Application server |
| Web interface | `NotificationPreferencesPanel(props: NotificationPreferencesProps): ReactElement` | Notification preference interface renders | `NotImplementedError` | FR-007; NFR-007 | Application server; notification delivery |
| Web interface | `getAccessibilityStatus(request: Request): Promise<AccessibilityStatus>` | Accessibility conformance status is returned | `NotImplementedError`; future assessment failures reject | NFR-007 | Accessibility test results |

## REST APIs

Each route below is implemented by the API catch-all route and maps to the
named public function. Each mapped function currently throws
`NotImplementedError`; the server responds with status **501** and a JSON body
of shape `{"error":"not_implemented","message":"..."}`. The request object and
path values are passed to the function; request bodies are intentionally not
parsed in this skeleton.

| Method | REST route | Requirement | Public function |
|---|---|---|---|
| `POST` | `/api/productions/{productionId}/contracts/{contractId}/assignments` | FR-001; Scenario-001 | `assignContract` |
| `POST` | `/api/productions/{productionId}/contracts/{contractId}/signature` | FR-002; Scenario-005 | `signLatestContractVersion` |
| `GET` | `/api/productions/{productionId}/scripts/{resourceId}` | FR-003; Scenario-002 | `getAssignedScript` |
| `GET` | `/api/productions/{productionId}/choreography/{resourceId}` | FR-004; Scenario-003 | `getAssignedChoreography` |
| `POST` | `/api/productions/{productionId}/scripts/{resourceId}/versions` | FR-005; Scenario-006 | `publishScriptVersion` |
| `PUT` | `/api/productions/{productionId}/resources/{resourceId}/assignments` | FR-006; Scenario-004 | `changeResourceAssignment` (`action: "assign"`) |
| `DELETE` | `/api/productions/{productionId}/resources/{resourceId}/assignments` | FR-006; Scenario-007 | `changeResourceAssignment` (`action: "revoke"`) |
| `GET` | `/api/notifications` | FR-007; NFR-005 | `listNotifications` |
| `GET` | `/api/productions/{productionId}/resources/{resourceId}/access` | NFR-001 | `authorizeResourceRequest` |
| `GET` | `/api/audit/integrity` | NFR-002 | `verifyPublishedVersionIntegrity` |
| `GET` | `/api/health` | NFR-003 | `getAvailabilityStatus` |
| `GET` | `/api/health/performance` | NFR-004 | `getPerformanceStatus` |
| `GET` | `/api/notifications/delivery-status` | NFR-005 | `getDeliveryStatus` |
| `GET` | `/api/operations/recovery-check` | NFR-006 | `verifyRecoveryReadiness` |
| `GET` | `/api/accessibility` | NFR-007 | `getAccessibilityStatus` |
| `GET` | `/api/operations/capacity` | NFR-008 | `getCapacityStatus` |

## Proposed Playwright test contracts (pending approval)

The following are proposed wire contracts to make TP-001–TP-071 executable.
They are not implemented behavior and do not change the module signatures
above. Please review these request, response, identity, and test-fixture
conventions before tests are written. The existing runnable skeleton remains
501-only until separately implemented.

### Test identity and fixture APIs

These APIs are available only in an isolated E2E test deployment. They must be
disabled outside that deployment. Workflow requests use
`X-SetSafe-Test-User: <userId>` to select a seeded authenticated identity;
unknown users are unauthenticated. This header is a test substitute for
Auth0, not a production authentication method.

| Method | Route | Request / response | Purpose |
|---|---|---|---|
| `POST` | `/__test/reset` | Request: `{}`. Success: `204`, empty body. | Clear all scenario state and restore the test clock to `2026-01-15T12:00:00Z`. |
| `POST` | `/__test/fixtures` | Request: `{"users":[{"id":"user-actor-A","rolesByProduction":{"prod-A":["actor"]}}],"productions":[{"id":"prod-A"}],"resources":[{"id":"script-1","productionId":"prod-A","type":"script","versions":[{"id":"script-v1","content":"SCRIPT ONE","contentType":"text/plain","publishedAt":"2026-01-14T12:00:00Z"}],"currentVersionId":"script-v1"}],"assignments":[{"productionId":"prod-A","resourceId":"script-1","memberId":"user-actor-A"}],"signatures":[{"contractId":"contract-1","versionId":"contract-v1","signerId":"user-actor-A","signedAt":"2026-01-14T12:00:00Z"}]}`. Success: `201`, `{"created":true}`. Any omitted collections default to empty. | Seed users, roles/membership, resources, immutable versions, assignments, and signatures. |
| `GET` | `/__test/state?productionId={id}` | Success: `200`, `{"assignments":[],"versions":[],"signatures":[],"notifications":[],"auditEvents":[]}` with full records for that production. | Assert state, including that rejected writes created nothing. State inspection itself creates no records. |
| `PUT` | `/__test/clock` | Request: `{"now":"2026-01-15T12:00:00Z"}`. Success: `204`, empty body. | Set deterministic UTC time for time-boundary tests. |
| `POST` | `/__test/faults` | Request: `{"databaseCommitFailures":1,"notificationDeliveryFailures":0}`. Success: `204`, empty body. | Inject one-shot storage/notification failures for NFR-003 and NFR-005 tests. |
| `POST` | `/__test/measurements` | Request fields: `{"unavailableMinutes":0,"announcedMaintenanceMinutes":0,"standardRequestLatenciesMs":[],"choreographyPlaybackStartMs":4000,"eligibleNotifications":100,"queuedNotificationsWithin60Seconds":99,"notificationDeliveryFailures":0,"recoveryLostMinutes":0,"recoveryDurationSeconds":0,"expectedPeak":{"users":0,"productions":0,"materials":0,"concurrentSessions":0},"actualPeak":{"users":0,"productions":0,"materials":0,"concurrentSessions":0}}`. Success: `204`, empty body. | Supply deterministic measurements to the NFR status operations. Zero/default fields are omitted where not relevant. |

Test fixture IDs and scenario state are seeded separately for each test. A
fixture request with unknown fields, invalid references, or duplicate IDs is
proposed to return `400` with
`{"error":"invalid_fixture","message":"..."}` and make no partial changes.
The test deployment may use fixtures that represent simultaneous requests
and controlled provider/database failures.

### Proposed workflow request and response conventions

All workflow APIs require a seeded test identity header. Successful JSON
responses use `application/json`; resource responses return the JSON fields
below for deterministic content assertions. Unauthorized requests return
`403` with `{"error":"forbidden","message":"Access denied."}` and no
protected content. Invalid request fields return `400` with
`{"error":"invalid_request","message":"..."}`. A persistence failure returns
`503` with `{"error":"persistence_failed","message":"The change was not saved."}`.
The corresponding state snapshot must show no partial writes.

| Method / route | Proposed request body/query | Proposed success status and JSON body |
|---|---|---|
| `POST /api/productions/{productionId}/contracts/{contractId}/assignments` | `{"assigneeIds":["user-actor-A"]}` | `201`, `{"status":"assigned","productionId":"prod-A","contractId":"contract-1","assigneeIds":["user-actor-A"]}` |
| `POST /api/productions/{productionId}/contracts/{contractId}/signature` | `{}` signs latest; `{"versionId":"contract-v1"}` explicitly names a version for the stale-version rejection case. | `200`, `{"status":"signed","productionId":"prod-A","contractId":"contract-1","versionId":"contract-v2","signerId":"user-actor-A","signedAt":"2026-01-15T12:00:00Z"}` |
| `GET /api/productions/{productionId}/scripts/{resourceId}` | No body. | `200`, `{"productionId":"prod-A","resourceId":"script-1","versionId":"script-v2","content":"SCRIPT TWO","contentType":"text/plain"}` |
| `GET /api/productions/{productionId}/choreography/{resourceId}` | No body. | `200`, `{"productionId":"prod-A","resourceId":"choreo-1","versionId":"choreo-v2","content":"CHOREO TWO","contentType":"video/mp4"}` |
| `POST /api/productions/{productionId}/scripts/{resourceId}/versions` | `{"versionId":"script-v3","content":"SCRIPT THREE","contentType":"text/plain"}`. A request using an already-published version ID attempts mutation and is rejected. | `201`, `{"status":"published","productionId":"prod-A","resourceId":"script-1","versionId":"script-v3","current":true}` |
| `PUT /api/productions/{productionId}/resources/{resourceId}/assignments` | Exactly one of `{"memberId":"user-actor-A"}` or `{"roleId":"role-actor-A"}`. | `201`, `{"status":"assigned","productionId":"prod-A","resourceId":"script-1","memberId":"user-actor-A"}` or the corresponding `roleId` field. |
| `DELETE /api/productions/{productionId}/resources/{resourceId}/assignments` | Exactly one of `{"memberId":"user-actor-A"}` or `{"roleId":"role-actor-A"}`. | `200`, `{"status":"revoked","productionId":"prod-A","resourceId":"script-1","memberId":"user-actor-A"}` or the corresponding `roleId` field. |
| `GET /api/notifications` | No body. | `200`, `{"notifications":[{"recipientId":"user-actor-A","productionId":"prod-A","resourceId":"script-1","link":"/api/productions/prod-A/scripts/script-1"}]}` |
| `GET /api/productions/{productionId}/resources/{resourceId}/access` | `?versionId=script-v1` optionally identifies a retained version; omitting it checks the current version. | `200`, `{"authorized":true,"productionId":"prod-A","resourceId":"script-1","versionId":"script-v2"}` |
| `GET /api/audit/integrity` | No body. | `200`, `{"valid":true,"checkedAt":"2026-01-15T12:00:00Z"}` |
| `GET /api/health` | No body. | `200`, `{"available":true,"unavailableMinutes":0,"announcedMaintenanceMinutes":0}` |
| `GET /api/health/performance` | No body. | `200`, `{"withinTarget":true,"standardRequestP95Ms":1990,"choreographyPlaybackStartMs":4000}` |
| `GET /api/notifications/delivery-status` | No body. | `200`, `{"queued":99,"delivered":99,"failed":1,"checkedAt":"2026-01-15T12:00:00Z"}` |
| `GET /api/operations/recovery-check` | No body. | `200`, `{"ready":true,"recoveryPointObjectiveMinutes":15,"recoveryTimeObjectiveHours":4}` |
| `GET /api/accessibility` | No body. | `200`, `{"conformsToWcag22AA":true}` |
| `GET /api/operations/capacity` | No body. | `200`, `{"withinTarget":true,"expectedPeak":{"users":0,"productions":0,"materials":0,"concurrentSessions":0},"actualPeak":{"users":0,"productions":0,"materials":0,"concurrentSessions":0}}` |

Proposed rejection status mappings are: `403` for missing production role,
membership, or assignment; `409` with
`{"error":"stale_version","message":"Only the latest contract version can be signed."}`
when signing a non-current version; `409` with
`{"error":"immutable_version","message":"Published versions cannot be changed."}`
when attempting to replace a published version; and `400` for invalid
input types or missing assignment targets. Every rejected write is verified
against `/__test/state` and must leave assignments, signatures, versions,
notifications, and audit events unchanged.

### Cases that remain blocked pending decisions

- **TP-056 and TP-057:** the expected peak workload values are not in the
  specification or test plan. Provide the agreed four-dimensional peak before
  these cases can assert pass/fail.
- **TP-060 and TP-067:** `productionId` is a URL path segment and cannot be
  transmitted as a JSON number; no documented request body contains a
  `productionId` field. These cases are skipped rather than changing the
  planned invalid input.
- **TP-055:** Playwright can exercise keyboard interaction and browser
  accessibility semantics, but this contract does not define a screen-reader
  product/runtime or a complete WCAG 2.2 AA oracle. A specific screen-reader
  test environment and acceptance method are still needed.
- **TP-032, TP-035, TP-048, TP-054, and TP-063:** no callable, inspectable
  contracts are defined for triggering notification delivery, inspecting
  storage encryption, specifying queue delays, restoring a backup, or listing
  assigned resources. These cases are skipped pending those contracts.
- **TP-029:** no public contract operation publishes a new contract version.
  The contract-signing route can act only on a version that is already
  current.
- **TP-030:** whether multiple assignments to the same user produce one or
  multiple notifications is unresolved in the test plan.
- **TP-057:** the requirement promises capacity at twice peak but does not
  require failure just beyond twice peak. It can only record measurements,
  not assert rejection.

No test code should be written or run until these proposed contracts and
remaining blocked cases are reviewed.
