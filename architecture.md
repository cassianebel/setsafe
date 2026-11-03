# 1. Overview

SetSafe is a TypeScript Next.js application for production-scoped contract and material workflows, with a React and Tailwind interface. It uses Auth0 for identity, Neon PostgreSQL for application records, and private AWS S3 storage for file contents; authorization and workflow logic stay in the Next.js server, which also mediates access to files and notifications.

# 2. Modules

| Module | Responsibility | May depend on |
|---|---|---|
| Web interface (Next.js, React, Tailwind) | Present production, assignment, material viewing, contract review/signing, and notification-preference workflows. [FR-001–007; NFR-007] | Identity integration; application server |
| Identity integration | Authenticate users and establish their verified identity, including email verification and MFA. [NFR-001; implementation decisions] | Auth0 identity provider |
| Production authorization | Evaluate each operation against the user's current production membership, production role, and direct or role-based resource assignments. [Domain Model; FR-001–006; NFR-001] | Identity integration; application data adapter |
| Application server (Next.js) | Execute production, assignment, publishing, contract-signing, and resource-access workflows. [FR-001–006; Scenarios 001–007] | Identity integration; production authorization; application data adapter; private file storage adapter; notification delivery |
| Application data adapter | Persist production membership and roles, assignments, resource/version metadata, signature status, audit records, and notification preferences and delivery state. [Domain Model; FR-002; NFR-002; NFR-005] | Neon PostgreSQL |
| Private file storage adapter | Store the bytes for contracts, scripts, and choreography materials without exposing public object access. [FR-001–005; NFR-001] | AWS S3 |
| Notification delivery | Record and deliver notifications through recipients' selected channels, retrying failures and recording delivery outcomes. [FR-007; NFR-005] | Application data adapter; delivery providers for selected channels |

# 3. Request flow

**Scenario-001 — Manager sends a contract**

1. The manager signs in through Auth0. The sign-in flow requires verified email and MFA; the application receives the authenticated identity.
2. The manager opens a production. The application server resolves the Auth0 identity to the SetSafe user and asks Production authorization to verify the user's current manager role in that production.
3. The web interface displays contracts available to assign and members of that production. The manager selects a contract, selects one or more cast members, and chooses to send it.
4. The application server rechecks the manager's authority and each recipient's membership in the same production. It rejects the operation if any check fails.
5. In one Neon PostgreSQL transaction, the application records the per-member contract assignments, makes the contract available to those assignees, records the relevant audit event, and creates notification work for them. The application reports success only after the transaction commits. [FR-001; NFR-002; NFR-003]
6. Notification delivery processes the committed notification work using each recipient's selected channels. It records attempts and retries failures. Before sending a link, it checks that the recipient still has access. [FR-007; NFR-005]
7. When an assignee follows a link, the application authenticates the user and rechecks current membership and assignment. It streams the material through the application from private S3 rather than exposing an S3 object URL. [FR-001; NFR-001]

# 4. Design decisions

| Decision | Reason |
|---|---|
| **Preference — Require email verification and MFA through Auth0.** | The specification requires confidentiality and per-request authorization [NFR-001], but does not specifically require either sign-in control. This is the user's stated design decision, not a mandated mechanism. |
| **Use production-scoped membership records that support multiple roles per user.** | The Domain Model scopes roles and permissions to each production, and FR-003–004 allow access through a user's role or roles. Supporting multiple roles also follows the user's stated decision. |
| **Preference — Do not offer material downloads; serve authorized previews/streams through the application.** | FR-003–004 require reading scripts and viewing choreography, and NFR-001 requires access checks including for direct file links. The spec does not prohibit downloads; the no-download policy is the user's stated decision. |
| **Preference — Let users select notification channels and persist those preferences.** | FR-007 and NFR-005 require notifications and delivery tracking, but do not name channels. Channel selection is the user's stated decision; the concrete channels and providers remain to be chosen. |
| **Use a Next.js modular monolith rather than separate application services.** | FR-001–007 describe one cohesive set of workflows, and the implementation constraints specify Next.js. The spec does not require distributed services; keeping modules in one application is a simplicity preference. |
| **Use server-side authorization for every data and file operation; keep S3 private and stream bytes through an authorized application route. Recheck access for each stream request and terminate or reauthorize an active stream within 60 seconds.** | NFR-001 requires current membership and assignment checks, denies direct file access, and sets a revocation bound. Scenarios 001, 004, 006, and 007 depend on access being enforced independently of the UI. |
| **Store file bytes in S3 and resource metadata, assignments, versions, and signature records in PostgreSQL. Give each published version an immutable file reference and update the current-version pointer transactionally.** | FR-002–005 require version-specific signatures and latest-version access; NFR-002 requires immutable published versions and an audit record. |
| **Record a signature against the authenticated user, contract version, and server-generated UTC timestamp in the same database transaction as its audit event.** | FR-002 requires per-assignee, per-version status; Scenario-005 requires one user's signature not to satisfy another's; NFR-002 requires signer/version association and a timestamp. |
| **Serialize publication of a resource's new version in PostgreSQL and commit its version record and current-version pointer atomically.** | FR-005 and Scenario-006 require the published version to become current without changing assignments; NFR-002 requires published versions to remain unchanged. The database transaction is where concurrent publication is ordered. |
| **Persist notification work with the triggering database change, then retry and record delivery attempts.** | FR-007 requires notifications for publication/assignment events, and NFR-005 sets queuing, timeliness, and retry expectations. Persisting the work with the state change avoids a committed assignment or publication with no corresponding notification record. |
| **Use Vitest, React Testing Library, and Playwright for unit/component and end-to-end verification.** | These are implementation constraints supplied by the user. Scenario-001–007 provide acceptance flows for end-to-end coverage; the particular test tools are not required by the specification. |

# 5. Constraints and known limits

- **Implementation constraints:** TypeScript, Next.js, and React; Tailwind CSS; PostgreSQL on Neon; AWS S3; Vitest, React Testing Library, and Playwright; Auth0 authorization/identity integration.
- The architecture keeps application logic in the Next.js deployment. NFR-003's 99.9% availability and NFR-004/NFR-008's performance and capacity targets depend on the hosting plan and workload, neither of which is specified. The chosen hosting environment must support the Next.js runtime, authenticated streaming, and reliable notification processing.
- The design avoids public S3 URLs and application-provided download actions. It cannot prevent a person from capturing content after it is displayed, for example with screenshots or external recording. Bytes already delivered also cannot be recalled; NFR-001's 60-second revocation target can govern future requests and active streams only if streaming is interrupted or reauthorized within that interval.
- NFR-004 requires video playback and page latency targets; streaming through the application adds bandwidth and processing load. Validate the target with representative video sizes, devices, and networks. If it cannot be met, the delivery design would need an authorized streaming/CDN mechanism that preserves access checks and the no-download policy.
- NFR-006 requires the combined Neon and S3 backup/recovery arrangement to meet a 15-minute RPO and 4-hour RTO, including recovery of versions and signatures. Confirm that selected service plans and configurations meet those targets and exercise restoration; otherwise the database/storage plan or recovery design must change.
- Notifications require channel-specific delivery integrations and a way to process persisted work and retries. The selected providers, hosting scheduler/worker mechanism, and delivery guarantees are not specified; NFR-005 cannot be verified until they are chosen.
- The constraints specify Auth0, but not how Auth0 identities map to application users. The application should use the Auth0 subject as the external identity key and keep production memberships and roles in PostgreSQL; identity is not itself a production permission.
- The test stack is specified, but test environments, representative peak-load data, and performance-test tooling are not. NFR-008 requires agreement on expected peak load before capacity can be accepted.

# 6. Out of scope

Copied from the Description and Goals in [spec.md](./spec.md):

- “SetSafe ... does not create contracts.”
- “Contract creation and legal validation are outside this specification.”

# Spec issues

- The specification has no section explicitly titled “Non-goals”; the out-of-scope statements above are the exclusions stated in Description and Goals.
- The spec does not say who assigns roles or permissions, whether a producer may also be a manager, or who may publish contract and choreography versions. FR-005 names producers for scripts, while FR-006 names managers for script and choreography assignments.
- Earlier material versions must be retained, and NFR-001 protects them from unauthorized access, but the spec does not say whether an authorized user may view earlier versions.
- FR-007 and NFR-005 do not define notification channels or preference behavior. The user has chosen channel preferences, but the available channels, providers, and what counts as delivery remain unspecified.
- “Users may not download materials” is a design decision, not a requirement in spec.md. The application can omit download actions and protect file endpoints, but cannot prevent capture of content that a user can view.
- The spec calls for digital signatures but excludes legal validation and does not define signature evidence, acceptance/decline behavior, or whether an external e-signature provider is required.
- The spec does not define behavior when two users publish versions concurrently or when membership/assignment is revoked during an active stream. This design serializes version publication in PostgreSQL and blocks subsequent unauthorized reads; the precise conflict and active-stream policy should be agreed.
- The earlier onboarding decision was that self-registration is allowed and managers invite/remove production members, while a platform administrator creates productions and assigns the first manager. Those decisions are not in spec.md; the architecture assumes self-registered accounts receive no production access until membership is granted.
