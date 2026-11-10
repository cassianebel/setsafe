# SetSafe Contracts

These are **proposed interfaces**, not behavior implemented yet. Python type hints are contract choices. Each public body raises `NotImplementedError`. No clock, queue, cache, external service, or new module is injected. User identity is represented by an explicit ID at the business boundary; the eventual transport authentication mechanism is unresolved by the spec. Responses and error codes below are **proposed conventions** because `spec.md` does not define them.

## Public module functions

| Module | Signature | Proposed success result | Proposed failure | Spec rule | Injected dependencies |
|---|---|---|---|---|---|
| Presentation | `present_result(result: dict[str, Any]) -> dict[str, Any]` | Display-ready result | `NotImplementedError`; future formatting errors unspecified | FR-001–FR-006 | Result supplied by caller; business modules (architectural) |
| Authentication | `identify_user(session_token: str) -> str` | Authenticated user ID | `NotImplementedError`; invalid session behavior unspecified | BDD-001–BDD-007 | Session token; Persistence |
| Permission Management | `authorize(user_id: str, project_id: str, material_id: str, action: str) -> bool` | `True` for authorized, `False` for denied | `NotImplementedError`; invalid IDs unspecified | FR-006, BDD-006–007 | User/project/material IDs; Authentication and Persistence |
| Permission Management | `assign_view_permission(manager_id: str, project_id: str, cast_member_id: str, material_id: str) -> dict` | `{"project_id":"proj-1","cast_member_id":"cast-1","material_id":"script-1","permission":"view"}` | `NotImplementedError`; proposed authorization denial 403 | FR-006, BDD-006 | IDs; Authentication and Persistence |
| Contract Management | `distribute_contract(manager_id: str, project_id: str, cast_member_id: str, contract_id: str) -> dict` | `{"contract_id":"contract-1","cast_member_id":"cast-1","assigned":true,"notification_created":true}` | `NotImplementedError`; proposed authorization denial 403 | FR-001, BDD-001 | IDs; Permission Management, Persistence, Notification Management |
| Contract Management | `sign_contract(cast_member_id: str, contract_id: str, signature: str) -> dict` | `{"contract_id":"contract-1","status":"signed","signature_recorded":true}` | `NotImplementedError`; unsigned/assignment failure semantics unspecified | FR-002, BDD-002 | ID and signature; Permission Management, Persistence |
| Production Material Management | `view_script(actor_id: str, project_id: str, script_id: str) -> dict` | `{"script_id":"script-1","content":"Scene one"}` | `NotImplementedError`; proposed unauthorized denial 403 with no content | FR-003, FR-006, BDD-003, BDD-007 | IDs; Permission Management, Persistence |
| Production Material Management | `view_choreography(dancer_id: str, project_id: str, video_id: str) -> dict` | `{"video_id":"video-1","playable":true,"video_reference":"video-1"}` | `NotImplementedError`; proposed authorization denial 403 | FR-004, BDD-004 | IDs; Permission Management, Persistence |
| Production Material Management | `update_script(producer_id: str, project_id: str, script_id: str, content: str) -> dict` | `{"script_id":"script-1","content":"Revised scene","notification_created":true}` | `NotImplementedError`; proposed authorization denial 403 | FR-005, BDD-005 | IDs/content; Permission Management, Persistence, Notification Management |
| Notification Management | `record_notification(recipient_id: str, project_id: str, kind: str, material_id: str) -> dict` | `{"recipient_id":"cast-1","kind":"contract_assigned","material_id":"contract-1"}` | `NotImplementedError`; storage failures unspecified | BDD-001, BDD-005 | IDs/kind; Persistence |
| Persistence | `read_record(record_type: str, record_id: str) -> dict[str, Any]` | Stored record | `NotImplementedError`; missing-record behavior unspecified | BDD-001–006 | Record identifiers; Database |
| Persistence | `write_record(record_type: str, record_id: str, value: dict[str, Any]) -> dict[str, Any]` | Stored record | `NotImplementedError`; write failures unspecified | BDD-001–006 | Record and value; Database |
| Database | `get_record(record_type: str, record_id: str) -> dict[str, Any]` | Stored record | `NotImplementedError`; missing-record behavior unspecified | BDD-001–006 | Record identifiers; none |
| Database | `put_record(record_type: str, record_id: str, value: dict[str, Any]) -> dict[str, Any]` | Stored record | `NotImplementedError`; write failures unspecified | BDD-001–006 | Record and value; none |

## REST API contracts

All routes currently return HTTP **501** with `{"error":"not_implemented","message":"<operation> is not implemented"}`. The **future** successful responses below are design proposals, not spec-defined wire formats. The request's `X-User-ID` header is a **test-contract convention only**, not secure authentication; it must not be treated as verified identity in a real implementation. Authentication transport remains a spec issue.

| Requirement | Method and route | Request fields | Maps to | Proposed success | Proposed denial |
|---|---|---|---|---|---|
| FR-001 | `POST /api/projects/<project_id>/contracts/<contract_id>/distributions` | `X-User-ID: manager-1`; JSON `cast_member_id` | `distribute_contract` | 200; `contract_id`, `cast_member_id`, `assigned`, `notification_created` | 403, `error: forbidden` |
| FR-002 | `POST /api/contracts/<contract_id>/signatures` | `X-User-ID: cast-1`; JSON `signature` | `sign_contract` | 200; `contract_id`, `status`, `signature_recorded` | 403 if not assigned (proposal) |
| FR-003 | `GET /api/projects/<project_id>/scripts/<script_id>` | `X-User-ID: actor-1` | `view_script` | 200; `script_id`, `content` | 403; no `content` |
| FR-004 | `GET /api/projects/<project_id>/videos/<video_id>` | `X-User-ID: dancer-1` | `view_choreography` | 200; `video_id`, `playable`, `video_reference` | 403; no video reference |
| FR-005 | `PUT /api/projects/<project_id>/scripts/<script_id>` | `X-User-ID: producer-1`; JSON `content` | `update_script` | 200; `script_id`, `content`, `notification_created` | 403 |
| FR-006 | `POST /api/projects/<project_id>/permissions` | `X-User-ID: manager-1`; JSON `cast_member_id`, `material_id` | `assign_view_permission` | 200; `project_id`, `cast_member_id`, `material_id`, `permission` | 403 |

**BDD-007** uses the FR-003 script route with a disallowed user, rather than introducing a seventh redundant API. No GET for contract status, notification listing, or data inspection is added: these are observable acceptance outcomes but have no explicit API contract in the source architecture. Their verification needs a future read-only test fixture or a contract extension, and is marked as a gap rather than invented.
