# SetSafe Test Plan

This plan is derived from `spec.md` and `architecture.md` **without using implementation code**. The sample IDs, text, response JSON keys, and HTTP status codes are **proposed contract examples**, not exact values mandated by the specification. The spec provides no numeric thresholds, dates, or precedence rules. Each rejection varies **one condition only** from its adjacent valid control. “No side effects” means no assignment/signature/permission/update/notification was created or changed; direct verification requires a read-only fixture or storage-observation contract that has not been defined.

## Common fixtures (conceptual, not implementation)

- Project `proj-1`; manager `manager-1` is authorized for it; producer `producer-1` can edit its scripts.
- `cast-1` is assigned to `proj-1`; `actor-1` can view `script-1`; `dancer-1` can view `video-1`.
- `contract-1` is unsigned and assigned to `cast-1` for signing tests; distribution tests begin with a separate unassigned contract.
- `script-1` has content `Scene one`; `script-2` is restricted from `actor-1`; `video-1` is playable.
- `manager-noaccess` has no contract-management or permission-management authority; `producer-noaccess` cannot edit; `cast-2` is not assigned to `proj-1`.
- All other conditions are identical between each negative case and its corresponding control.

## Acceptance-criterion cases

| ID | Requirement | Cases (request; expected status/body; side effects) | Inside/outside | Control |
|---|---|---|---|---|
| BDD-001 | FR-001 | **T001-P:** POST `/api/projects/proj-1/contracts/contract-1/distributions` as `manager-1`, `{"cast_member_id":"cast-1"}` → **200**, `contract_id=contract-1`, `cast_member_id=cast-1`, `assigned=true`, `notification_created=true`; assignment + notification created. **T001-N:** same request as `manager-noaccess` → proposed **403**, `error=forbidden`; **no assignment, no notification**. | Authorized manager (inside) / manager without contract permission (outside). Additional project membership rejection is unspecified. | T001-P is same-shape accepted control for T001-N. |
| BDD-002 | FR-002 | **T002-P:** POST `/api/contracts/contract-1/signatures` as `cast-1`, `{"signature":"Cast One"}` → **200**, `contract_id=contract-1`, `status=signed`, `signature_recorded=true`; signature saved, status updated, manager-visible. **T002-N:** identical request as `cast-2`, with only assignment changed → proposed **403**, `error=forbidden`; **no signature, no status change**. | Assigned unsigned contract (inside) / unassigned cast member (outside). Signed-contract re-signing is unspecified. | T002-P controls T002-N. |
| BDD-003 | FR-003 | **T003-P:** GET `/api/projects/proj-1/scripts/script-1` as `actor-1` → **200**, `script_id=script-1`, `content=Scene one`; no writes. **T003-N:** same request as an actor with no permission, all else equal → proposed **403**, `error=forbidden`, **no content**; no writes. | Authorized script (inside) / no script permission (outside). | T003-P controls T003-N. |
| BDD-004 | FR-004 | **T004-P:** GET `/api/projects/proj-1/videos/video-1` as `dancer-1` → **200**, `video_id=video-1`, `playable=true`, `video_reference=video-1`; no writes. **T004-N:** same request as a dancer without video permission → proposed **403**, `error=forbidden`, no `video_reference`; no writes. | Permitted video (inside) / unpermitted video (outside). | T004-P controls T004-N. |
| BDD-005 | FR-005 | **T005-P:** PUT `/api/projects/proj-1/scripts/script-1` as `producer-1`, `{"content":"Revised scene"}` → **200**, `script_id=script-1`, `content=Revised scene`, `notification_created=true`; script updated + affected actors notified. **T005-N:** same request as `producer-noaccess` → proposed **403**, `error=forbidden`; **no update, no notification**. | Producer with edit permission (inside) / without permission (outside). | T005-P controls T005-N. |
| BDD-006 | FR-006 | **T006-P:** POST `/api/projects/proj-1/permissions` as `manager-1`, `{"cast_member_id":"cast-1","material_id":"script-1"}` → **200**, `project_id=proj-1`, `cast_member_id=cast-1`, `material_id=script-1`, `permission=view`; one permission saved, access to script-1 granted, script-2 still restricted. **T006-N:** same request as `manager-noaccess` → proposed **403**, `error=forbidden`; **no permission created**. | Manager authorized to assign (inside) / unauthorized manager (outside). | T006-P controls T006-N. |
| BDD-007 | FR-006 | **T007-N:** GET `/api/projects/proj-1/scripts/script-2` as `actor-1` → proposed **403**, `error=forbidden`, no `content`; **no writes**. **T007-P:** same request with permission for `script-2` granted in a separate fixture → **200**, `script_id=script-2`, `content=Restricted scene`; no writes. | Permission absent (outside) / present (inside). | T007-P is same-shape accepted control for T007-N. |

## Extra gap-checklist cases (not additional source acceptance criteria)

| ID | Requirement probed | Category | Case and expected result |
|---|---|---|---|
| EXTRA-01 | FR-001, FR-006 | Identity | Attempt a distribution with a missing or forged identity; **expected status not specified**. No assignment/notification should be created if rejected; authentication contract required. |
| EXTRA-02 | FR-002 | State | Submit a second signature for a contract already signed; **expected status and replacement behavior unspecified**. If rejected, assert no signature/status mutation; use an unsigned-contract control. |
| EXTRA-03 | FR-005 | Concurrency | Two producers update the same script simultaneously; **conflict policy and final content unspecified**. Cannot compute expected result. |
| EXTRA-04 | FR-001–FR-006 | Input types | Submit a non-string ID or missing required field; **validation/status unspecified**. Pair with a valid same-shape control and assert no changes if rejected. |
| EXTRA-05 | FR-001, FR-005 | Errors and precedence | A storage failure during a contract assignment or script update; **rollback and notification behavior unspecified**. |
| EXTRA-06 | FR-001, FR-005 | Time | When must notifications appear? **No timing limit specified**. Cannot create an inside/outside numeric boundary. |
| EXTRA-07 | FR-003, FR-004 | Boundaries | Maximum script/video size and access latency **not specified**; no numeric inside/outside cases can be derived. |
| EXTRA-08 | FR-002 | Listing | Manager can view signed status, but no status-read API is specified; **entry point missing**. |
| EXTRA-09 | FR-003, FR-004 | What is returned | Script content is required, video must be playable; exact representation and media delivery **not specified**. |
| EXTRA-10 | FR-006 | Permission precedence | A user has a role but no material permission, or a material permission but no project assignment; **priority and denial details unspecified** beyond BDD-007. |
| EXTRA-11 | FR-001 | Project boundary | Target cast member not assigned to the project; **rejection status unspecified**; pair with assigned cast member and assert no assignment/notification if rejected. |

## Spec gaps

- **Requirements without acceptance criteria:** None among FR-001–FR-006 (FR-006 has BDD-006 and BDD-007).
- **Acceptance criteria without requirements:** None among BDD-001–BDD-007.
- **Unspecified but necessary to automate full assertions:** authentication transport, read-only verification of stored side effects, contract-status visibility, notification retrieval, status codes, response schemas, failure precedence, error handling, state transition rules, concurrency, input validation, timing, and numeric limits.
- **Nonfunctional requirements and non-goals:** Not explicitly included in the supplied source `spec.md`; proposed additions from earlier discussion are not silently treated as adopted.
- **Implementation-stage limitation:** Until a state-observation contract is approved, tests can assert HTTP status/body and express side-effect expectations as documented, but cannot independently verify database changes or absence of changes without inventing an API or fixture.

