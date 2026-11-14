# SetSafe implementation plan

## Failing tests grouped by acceptance criterion / requirement ID

- Scenario-001: `test_TP-001 — manager assigns and sends a contract`, `test_TP-002 — unassigned member cannot access a sent contract`
- Scenario-002: `test_TP-003 — assigned actor reads the latest script`, `test_TP-004 — role-assigned actor reads the latest script`, `test_TP-005 — unassigned actor is denied and assigned actor control succeeds`, `test_TP-006 — production member without assignment cannot read a script`
- Scenario-003: `test_TP-007 — assigned dancer views the latest choreography`, `test_TP-008 — role-assigned dancer views the latest choreography`, `test_TP-009 — unassigned dancer is denied and assigned dancer control succeeds`
- Scenario-004: `test_TP-010 — manager assigns a resource to a cast member`, `test_TP-011 — member without assignment is denied after another member is assigned`, `test_TP-012 — assignment outside the production is rejected; same-production control succeeds`, `test_TP-013 — role assignment cannot cross productions; valid role control succeeds`
- Scenario-005: `test_TP-014 — assigned cast member signs the latest contract version`, `test_TP-015 — a signature is not attributed to another assignee`, `test_TP-016 — signing the latest version preserves an earlier version signature`, `test_TP-017 — unassigned member cannot sign; assigned control signs`, `test_TP-018 — stale-version signature is rejected; latest-version control succeeds`
- Scenario-006: `test_TP-019 — producer update inherits assignments and notifies assignees`, `test_TP-020 — manager without producer role cannot publish; producer control succeeds`, `test_TP-021 — published version mutation is rejected; fresh-version control succeeds`, `test_TP-066 — a fresh immutable version can be published`
- Scenario-007: `test_TP-023 — revoking a direct assignment removes subsequent access`, `test_TP-024 — revoking a direct assignment preserves role access`, `test_TP-025 — manager cannot revoke another production's assignment; own-production control succeeds`, `test_TP-031 — notification link is withheld after revocation and works while access remains`
- NFR-001 / Domain Model extras: `test_TP-026 — assignment in one production grants no access in another`, `test_TP-027 — unassigned actor and dancer are denied; assigned controls succeed`, `test_TP-028 — revoked access also denies a retained previous version`, `test_TP-033 — access is denied after the sixty-second revocation bound`, `test_TP-034 — access remains denied beyond the sixty-second limit`, `test_TP-061 — assignment without a target is rejected; valid target is the control`, `test_TP-062 — removing production membership denies a previously assigned member`, `test_TP-064 — authorized actor receives the latest published script`, `test_TP-065 — notification link cannot be used after membership removal`, `test_TP-068 — assignment with a target member is accepted`, `test_TP-069 — assigned member can read before membership removal`, `test_TP-071 — notification link works while current access remains`
- NFR-002: `test_TP-036 — signature binds signer, version, UTC timestamp, and audit event`, `test_TP-037 — failed persistence does not report or store a signature`, `test_TP-038 — failed version save does not report publication`, `test_TP-039 — new version and current pointer commit together`, `test_TP-058 — concurrent publications retain versions and one current pointer`, `test_TP-059 — concurrent signatures remain separate for each signer`
- NFR-003: `test_TP-040 — monthly availability passes at and fails outside the 99.9 percent boundary`, `test_TP-041 — announced maintenance is excluded from monthly downtime`
- NFR-004: `test_TP-042 — standard request p95 passes at 1.99 seconds`, `test_TP-043 — standard request p95 fails just outside two seconds`, `test_TP-044 — choreography playback starts at four seconds`, `test_TP-045 — choreography playback fails just outside four seconds`
- NFR-005: `test_TP-046 — notification queueing meets the 99 percent boundary`, `test_TP-047 — notification queueing fails below 99 percent`, `test_TP-049 — script publication notifies every assigned actor and no unassigned member`
- NFR-006: `test_TP-050 — recovery meets the 15 minute RPO boundary`, `test_TP-051 — recovery fails just outside the 15 minute RPO`, `test_TP-052 — recovery meets the four hour RTO boundary`, `test_TP-053 — recovery fails just outside the four hour RTO`

## Ordered implementation slices

### Slice 1 — Contract smoke path
- Name: Contract smoke path
- Goal: Allow a manager to assign a contract to one member and confirm the assigned member receives a valid contract read path with the correct access denial for others.
- Spec sources: `spec.md` FR-001; `spec.md` Scenario-001; `architecture.md` Request flow Scenario-001; `contracts.md` `assignContract`, `requireProductionRole`, `requireResourceAccess`, `withTransaction`, `saveResourceAssignment`, `recordAuditEvent`, `saveDeliveryAttempt`
- Criteria: `Scenario-001`
- Tests that should turn green:
  - `test_TP-001 — manager assigns and sends a contract`
  - `test_TP-002 — unassigned member cannot access a sent contract`
- Skeleton to fill in:
  - `src/app/api/[...path]/route.ts`: `POST /api/productions/:productionId/contracts/:contractId/assignments`
  - `src/modules/application-server/index.ts`: `assignContract`
  - `src/modules/production-authorization/index.ts`: `requireProductionRole`, `requireResourceAccess`
  - `src/modules/application-data-adapter/index.ts`: `withTransaction`, `saveResourceAssignment`, `recordAuditEvent`
  - `src/modules/notification-delivery/index.ts`: `enqueueNotifications`
- Depends on: None
- Done when: both listed tests pass and no previously passing test fails.
- Status: not started.

### Slice 2 — Production read authorization
- Name: Production read authorization
- Goal: Enforce production-scoped direct and role-based access for scripts and choreography and reject access when the recipient lacks assignment or is outside the production.
- Spec sources: `spec.md` FR-003, FR-004, FR-006; `spec.md` Scenario-002, Scenario-003; `architecture.md` Production authorization; `contracts.md` `getAssignedScript`, `getAssignedChoreography`, `authorizeResourceRequest`, `requireResourceAccess`
- Criteria: `Scenario-002`, `Scenario-003`
- Tests that should turn green:
  - `test_TP-003 — assigned actor reads the latest script`
  - `test_TP-004 — role-assigned actor reads the latest script`
  - `test_TP-005 — unassigned actor is denied and assigned actor control succeeds`
  - `test_TP-006 — production member without assignment cannot read a script`
  - `test_TP-007 — assigned dancer views the latest choreography`
  - `test_TP-008 — role-assigned dancer views the latest choreography`
  - `test_TP-009 — unassigned dancer is denied and assigned dancer control succeeds`
- Skeleton to fill in:
  - `src/app/api/[...path]/route.ts`: `GET /api/productions/:productionId/scripts/:resourceId`, `GET /api/productions/:productionId/choreography/:resourceId`, `GET /api/productions/:productionId/resources/:resourceId/access`
  - `src/modules/application-server/index.ts`: `getAssignedScript`, `getAssignedChoreography`
  - `src/modules/production-authorization/index.ts`: `requireResourceAccess`, `authorizeResourceRequest`
  - `src/modules/private-file-storage-adapter/index.ts`: `streamAuthorizedFile`
  - `src/modules/application-data-adapter/index.ts`: `verifyPublishedVersionIntegrity`
- Depends on: Slice 1
- Done when: all script and choreography read tests pass and no previously passing test fails.
- Status: not started.

### Slice 3 — Resource assignment management
- Name: Resource assignment management
- Goal: Add grant and revoke assignment flows that operate only within the correct production, including role assignments and target validation.
- Spec sources: `spec.md` FR-006; `spec.md` Scenario-004; `spec.md` Scenario-007; `architecture.md` Production authorization and request flow; `contracts.md` `changeResourceAssignment`, `requireProductionRole`, `saveResourceAssignment`
- Criteria: `Scenario-004`, `Scenario-007`
- Tests that should turn green:
  - `test_TP-010 — manager assigns a resource to a cast member`
  - `test_TP-011 — member without assignment is denied after another member is assigned`
  - `test_TP-012 — assignment outside the production is rejected; same-production control succeeds`
  - `test_TP-013 — role assignment cannot cross productions; valid role control succeeds`
  - `test_TP-023 — revoking a direct assignment removes subsequent access`
  - `test_TP-024 — revoking a direct assignment preserves role access`
  - `test_TP-025 — manager cannot revoke another production's assignment; own-production control succeeds`
  - `test_TP-061 — assignment without a target is rejected; valid target is the control`
  - `test_TP-068 — assignment with a target member is accepted`
- Skeleton to fill in:
  - `src/app/api/[...path]/route.ts`: `PUT /api/productions/:productionId/resources/:resourceId/assignments`, `DELETE /api/productions/:productionId/resources/:resourceId/assignments`
  - `src/modules/application-server/index.ts`: `changeResourceAssignment`
  - `src/modules/production-authorization/index.ts`: `requireProductionRole`
  - `src/modules/application-data-adapter/index.ts`: `saveResourceAssignment`, `recordAuditEvent`
- Depends on: Slice 2
- Done when: assignment grant/revoke tests pass and no previously passing test fails.
- Status: not started.

### Slice 4 — Contract signing and version integrity
- Name: Contract signing and version integrity
- Goal: Record signer-specific signatures against the current contract version, reject stale-version signing, and ensure version and audit data remain immutable.
- Spec sources: `spec.md` FR-002; `spec.md` Scenario-005; `spec.md` NFR-002; `architecture.md` design decisions for signed versions and audit records; `contracts.md` `signLatestContractVersion`, `recordContractSignature`, `recordAuditEvent`, `savePublishedVersion`, `verifyPublishedVersionIntegrity`
- Criteria: `Scenario-005`, `NFR-002`
- Tests that should turn green:
  - `test_TP-014 — assigned cast member signs the latest contract version`
  - `test_TP-015 — a signature is not attributed to another assignee`
  - `test_TP-016 — signing the latest version preserves an earlier version signature`
  - `test_TP-017 — unassigned member cannot sign; assigned control signs`
  - `test_TP-018 — stale-version signature is rejected; latest-version control succeeds`
  - `test_TP-036 — signature binds signer, version, UTC timestamp, and audit event`
  - `test_TP-037 — failed persistence does not report or store a signature`
  - `test_TP-058 — concurrent publications retain versions and one current pointer`
  - `test_TP-059 — concurrent signatures remain separate for each signer`
- Skeleton to fill in:
  - `src/app/api/[...path]/route.ts`: `POST /api/productions/:productionId/contracts/:contractId/signature`
  - `src/modules/application-server/index.ts`: `signLatestContractVersion`
  - `src/modules/application-data-adapter/index.ts`: `recordContractSignature`, `recordAuditEvent`, `withTransaction`, `savePublishedVersion`
  - `src/modules/production-authorization/index.ts`: `requireResourceAccess`
- Depends on: Slice 3
- Done when: all contract signature and integrity checks pass and no previously passing test fails.
- Status: not started.

### Slice 5 — Script publication and notification flow
- Name: Script publication and notification flow
- Goal: Publish valid new script versions while preserving assignments and current-version state, and notify only the still-authorized recipients.
- Spec sources: `spec.md` FR-005, FR-007; `spec.md` Scenario-006; `architecture.md` request flow for publishing and notifications; `contracts.md` `publishScriptVersion`, `listNotifications`, `saveDeliveryAttempt`, `enqueueNotifications`
- Criteria: `Scenario-006`, `NFR-005`
- Tests that should turn green:
  - `test_TP-019 — producer update inherits assignments and notifies assignees`
  - `test_TP-020 — manager without producer role cannot publish; producer control succeeds`
  - `test_TP-021 — published version mutation is rejected; fresh-version control succeeds`
  - `test_TP-066 — a fresh immutable version can be published`
  - `test_TP-031 — notification link is withheld after revocation and works while access remains`
  - `test_TP-049 — script publication notifies every assigned actor and no unassigned member`
  - `test_TP-071 — notification link works while current access remains`
- Skeleton to fill in:
  - `src/app/api/[...path]/route.ts`: `POST /api/productions/:productionId/scripts/:resourceId/versions`, `GET /api/notifications`
  - `src/modules/application-server/index.ts`: `publishScriptVersion`, `listNotifications`
  - `src/modules/notification-delivery/index.ts`: `enqueueNotifications`, `deliverPendingNotifications`, `getDeliveryStatus`
  - `src/modules/application-data-adapter/index.ts`: `savePublishedVersion`, `saveDeliveryAttempt`, `saveNotificationPreferences`
- Depends on: Slice 4
- Done when: publication, notification, and link-eligibility tests pass and no previously passing test fails.
- Status: not started.

### Slice 6 — Revocation, membership, and access expiry
- Name: Revocation, membership, and access expiry
- Goal: Remove access promptly when assignments or membership change and enforce the 60-second revocation bound across both direct reads and notifications.
- Spec sources: `spec.md` FR-006, FR-007; `spec.md` Scenario-007; `spec.md` NFR-001; `architecture.md` authorization and revocation bound; `contracts.md` `changeResourceAssignment`, `requireResourceAccess`, `authorizeResourceRequest`, `saveResourceAssignment`
- Criteria: `NFR-001`, `Scenario-007`
- Tests that should turn green:
  - `test_TP-023 — revoking a direct assignment removes subsequent access`
  - `test_TP-024 — revoking a direct assignment preserves role access`
  - `test_TP-025 — manager cannot revoke another production's assignment; own-production control succeeds`
  - `test_TP-026 — assignment in one production grants no access in another`
  - `test_TP-027 — unassigned actor and dancer are denied; assigned controls succeed`
  - `test_TP-028 — revoked access also denies a retained previous version`
  - `test_TP-033 — access is denied after the sixty-second revocation bound`
  - `test_TP-034 — access remains denied beyond the sixty-second limit`
  - `test_TP-062 — removing production membership denies a previously assigned member`
  - `test_TP-064 — authorized actor receives the latest published script`
  - `test_TP-065 — notification link cannot be used after membership removal`
  - `test_TP-068 — assignment with a target member is accepted`
  - `test_TP-069 — assigned member can read before membership removal`
- Skeleton to fill in:
  - `src/app/api/[...path]/route.ts`: `GET /api/productions/:productionId/resources/:resourceId/access`, `PUT/DELETE /api/productions/:productionId/resources/:resourceId/assignments`
  - `src/modules/production-authorization/index.ts`: `requireResourceAccess`, `authorizeResourceRequest`, `requireProductionRole`
  - `src/modules/application-data-adapter/index.ts`: `saveResourceAssignment`, `recordAuditEvent`
  - `src/modules/application-server/index.ts`: `changeResourceAssignment`
- Depends on: Slice 5
- Done when: all access-denial, membership-removal, and revocation-bound tests pass and no previously passing test fails.
- Status: not started.

### Slice 7 — Nonfunctional performance, recovery, and availability gates
- Name: Nonfunctional performance, recovery, and availability gates
- Goal: Implement the measurement, availability, and recovery endpoints so they reflect the production's current health, response times, and backup readiness without violating the tested thresholds.
- Spec sources: `spec.md` NFR-003, NFR-004, NFR-006; `spec.md` NFR-001; `architecture.md` Application server and application data adapter status endpoints; `contracts.md` `getAvailabilityStatus`, `getPerformanceStatus`, `getCapacityStatus`, `verifyRecoveryReadiness`, `verifyPublishedVersionIntegrity`
- Criteria: `NFR-003`, `NFR-004`, `NFR-006`
- Tests that should turn green:
  - `test_TP-038 — failed version save does not report publication`
  - `test_TP-039 — new version and current pointer commit together`
  - `test_TP-040 — monthly availability passes at and fails outside the 99.9 percent boundary`
  - `test_TP-041 — announced maintenance is excluded from monthly downtime`
  - `test_TP-042 — standard request p95 passes at 1.99 seconds`
  - `test_TP-043 — standard request p95 fails just outside two seconds`
  - `test_TP-044 — choreography playback starts at four seconds`
  - `test_TP-045 — choreography playback fails just outside four seconds`
  - `test_TP-046 — notification queueing meets the 99 percent boundary`
  - `test_TP-047 — notification queueing fails below 99 percent`
  - `test_TP-050 — recovery meets the 15 minute RPO boundary`
  - `test_TP-051 — recovery fails just outside the 15 minute RPO`
  - `test_TP-052 — recovery meets the four hour RTO boundary`
  - `test_TP-053 — recovery fails just outside the four hour RTO`
- Skeleton to fill in:
  - `src/app/api/[...path]/route.ts`: `GET /api/health`, `GET /api/health/performance`, `GET /api/operations/recovery-check`, `GET /api/operations/capacity`
  - `src/modules/application-server/index.ts`: `getAvailabilityStatus`, `getPerformanceStatus`, `getCapacityStatus`
  - `src/modules/application-data-adapter/index.ts`: `verifyRecoveryReadiness`, `verifyPublishedVersionIntegrity`
  - `src/modules/application-data-adapter/index.ts`: bounded status-check helpers and measurement retrieval logic
- Depends on: Slice 6
- Done when: all availability, response-time, and recovery tests pass and no previously passing test fails.
- Status: not started.

## Design questions
- None at the moment; the current red suite can be implemented without introducing new modules or routes beyond those already specified in `architecture.md` and `contracts.md`.

## Test issues
- `test_TP-029 — no public route publishes a contract version`: this is a skipped test and the contract never defines a public contract publication route; it is not actionable in the current skeleton.
- `test_TP-030 — duplicate notification semantics are unresolved`: this is skipped because the current specification does not settle the duplicate-delivery policy.
- `test_TP-032 — notification delivery trigger and retry route are undefined`: skipped because no route is specified in the current contract.
- `test_TP-048 — the measurement contract cannot represent queue delays`: skipped because `contracts.md` does not define a queue-delay measurement contract.
- `test_TP-054 — no callable backup restore operation or restored-state contract`: skipped because no restore contract is in scope.
- `test_TP-055 — screen-reader runtime and UI route are not specified`: skipped because the UI and runtime accessibility contract is not defined.
- `test_TP-056 — agreed expected peak workload is not supplied`: skipped because `NFR-008` is deliberately under-specified in the current product contract.
- `test_TP-057 — agreed expected peak workload is not supplied`: duplicated version of the same unsupplied-contract issue.
- `test_TP-060 — productionId is a text path parameter, not a JSON number`: skipped because the route contract uses a path string in `src/app/api/[...path]/route.ts`.
- `test_TP-063 — no resource-list route is defined`: skipped because no list-route is part of the documented contract.
- `test_TP-067 — control for unrepresentable TP-060 is blocked`: skipped because the required value is not part of the current contract.
- `test_TP-070 — control for blocked resource listing has no route`: skipped because the route is intentionally undefined.

## Unassigned criteria / tests / functions

### Criteria or tests that fit no slice
- `test_TP-029 — no public route publishes a contract version`
- `test_TP-030 — duplicate notification semantics are unresolved`
- `test_TP-032 — notification delivery trigger and retry route are undefined`
- `test_TP-048 — the measurement contract cannot represent queue delays`
- `test_TP-054 — no callable backup restore operation or restored-state contract`
- `test_TP-055 — screen-reader runtime and UI route are not specified`
- `test_TP-056 — agreed expected peak workload is not supplied`
- `test_TP-057 — agreed expected peak workload is not supplied`
- `test_TP-060 — productionId is a text path parameter, not a JSON number`
- `test_TP-063 — no resource-list route is defined`
- `test_TP-067 — control for unrepresentable TP-060 is blocked`
- `test_TP-070 — control for blocked resource listing has no route`

### Functions or routes with no slice
- `src/modules/identity-integration/index.ts`: `authenticateRequest`, `resolveApplicationUser`
- `src/modules/notification-delivery/index.ts`: `getDeliveryStatus`, `setNotificationPreferences`, `deliverPendingNotifications`
- `src/modules/private-file-storage-adapter/index.ts`: `storePublishedFile`
- `src/modules/web-interface/index.tsx`: `ProductionDashboard`, `ContractReview`, `MaterialViewer`, `NotificationPreferencesPanel`, `getAccessibilityStatus`
- `src/app/api/[...path]/route.ts`: `GET /api/notifications/delivery-status`, `GET /api/accessibility`, `GET /api/operations/capacity`, `GET /api/operations/recovery-check`

Next action: Slice 1 — Contract smoke path; first test: `test_TP-001 — manager assigns and sends a contract`.
