# SetSafe Implementation Plan

Sources: `yasmeen-spec.md` (BDD-001–BDD-007, FR-001–FR-006), `yasmeen-architecture.md`, `yasmeen-contracts.md`, `yasmeen-test_plan.md`, `test_acceptance.py`, `test_skeleton.py`, and the Flask skeleton (`app.py`, `authentication.py`, `permissions.py`, `contracts.py`, `materials.py`, `notifications.py`, `persistence.py`, `database.py`, `presentation.py`).

Section references:
- **Spec:** Functional Requirements (FR-xxx), Acceptance Criteria (BDD-xxx).
- **Architecture:** Modules, Request Flow (Primary, Signing, Script update, Access-denial), Design Decisions.
- **Contracts:** Public module functions, REST API contracts.
- **Test plan:** Common fixtures, Acceptance-criterion cases (T00x).

## Baseline test run

Command: `python -m pytest -v` (Python 3.13, Flask 3, pytest 9)

```
test_acceptance.py::test_acceptance[BDD-001-T001-P] FAILED               [  5%]
test_acceptance.py::test_acceptance[BDD-001-T001-N] FAILED               [ 10%]
test_acceptance.py::test_acceptance[BDD-002-T002-P] FAILED               [ 15%]
test_acceptance.py::test_acceptance[BDD-002-T002-N] FAILED               [ 20%]
test_acceptance.py::test_acceptance[BDD-003-T003-P] FAILED               [ 25%]
test_acceptance.py::test_acceptance[BDD-003-T003-N] FAILED               [ 30%]
test_acceptance.py::test_acceptance[BDD-004-T004-P] FAILED               [ 35%]
test_acceptance.py::test_acceptance[BDD-004-T004-N] FAILED               [ 40%]
test_acceptance.py::test_acceptance[BDD-005-T005-P] FAILED               [ 45%]
test_acceptance.py::test_acceptance[BDD-005-T005-N] FAILED               [ 50%]
test_acceptance.py::test_acceptance[BDD-006-T006-P] FAILED               [ 55%]
test_acceptance.py::test_acceptance[BDD-006-T006-N] FAILED               [ 60%]
test_acceptance.py::test_acceptance[BDD-007-T007-N] FAILED               [ 65%]
test_skeleton.py::test_routes_return_501[POST-/api/projects/p/contracts/c/distributions-payload0] PASSED [ 70%]
test_skeleton.py::test_routes_return_501[POST-/api/contracts/c/signatures-payload1] PASSED [ 75%]
test_skeleton.py::test_routes_return_501[GET-/api/projects/p/scripts/s-None] PASSED [ 80%]
test_skeleton.py::test_routes_return_501[GET-/api/projects/p/videos/v-None] PASSED [ 85%]
test_skeleton.py::test_routes_return_501[PUT-/api/projects/p/scripts/s-payload4] PASSED [ 90%]
test_skeleton.py::test_routes_return_501[POST-/api/projects/p/permissions-payload5] PASSED [ 95%]
test_skeleton.py::test_six_routes_map_to_public_functions PASSED         [100%]
========================= 13 failed, 7 passed in 0.15s =========================
```

Every failure is the same assertion: `expected 200|403, got 501`.

### Failing tests grouped by acceptance criterion

| Criterion | Failing tests |
|---|---|
| BDD-001 | `test_acceptance[BDD-001-T001-P]`, `test_acceptance[BDD-001-T001-N]` |
| BDD-002 | `test_acceptance[BDD-002-T002-P]`, `test_acceptance[BDD-002-T002-N]` |
| BDD-003 | `test_acceptance[BDD-003-T003-P]`, `test_acceptance[BDD-003-T003-N]` |
| BDD-004 | `test_acceptance[BDD-004-T004-P]`, `test_acceptance[BDD-004-T004-N]` |
| BDD-005 | `test_acceptance[BDD-005-T005-P]`, `test_acceptance[BDD-005-T005-N]` |
| BDD-006 | `test_acceptance[BDD-006-T006-P]`, `test_acceptance[BDD-006-T006-N]` |
| BDD-007 | `test_acceptance[BDD-007-T007-N]` |

## Slices

Ordering: the read-only access path first (one route, all layers), then the permission rules that guard it, then writes (permission assignment), then writes with notifications (script update, contract distribution), then contract signing. Rules that interact are adjacent: material-level authorization (slices 1–3) is followed by the slice that writes permissions (4), then the slice whose "affected actors" are read from those permissions (5). Contract distribution and signing (6–7) sit together.

---

### Slice 1 — View an assigned script (end-to-end thin path)

- **Goal:** An actor with view permission can read a script through `GET /api/projects/<project_id>/scripts/<script_id>`; an actor without permission gets 403 with no content.
- **Spec sources:** FR-003; BDD-003; Architecture: Modules (all four layers), Design Decisions ("Identify users before protected operations", "Enforce permissions in the business layer"); Contracts: `view_script`, FR-003 route; Test plan: Common fixtures, BDD-003 row.
- **Criteria:** BDD-003
- **Tests that should turn green:**
  - `test_acceptance[BDD-003-T003-P]`
  - `test_acceptance[BDD-003-T003-N]`
- **Skeleton to fill in:**
  - `database.get_record`
  - `persistence.read_record`
  - `authentication.identify_user`
  - `permissions.authorize` (the `"view"` action only)
  - `materials.view_script`
  - `presentation.present_result`
  - Route `GET /api/projects/<project_id>/scripts/<script_id>` (`script` in `app.py`), currently 501
- **Depends on:** none
- **Done when:** the listed tests pass and no previously passing test fails, except the known skeleton conflict for `test_routes_return_501[GET-/api/projects/p/scripts/s-None]` (see Test issues TI-1).
- **Status:** done — T003-P/T003-N green; expected TI-1 skeleton failure `test_routes_return_501[GET-/api/projects/p/scripts/s-None]`

---

### Slice 2 — Material-scoped access denial

- **Goal:** Permission is checked for the specific material, not just the project, so an actor allowed `script-1` is still refused `script-2` without any content being read or returned.
- **Spec sources:** FR-006; BDD-007; Architecture: Request Flow (Access-denial scenario), Design Decisions ("Check project assignment and material-specific authorization"); Contracts: `authorize`, `view_script`; Test plan: BDD-007 row.
- **Criteria:** BDD-007
- **Tests that should turn green:**
  - `test_acceptance[BDD-007-T007-N]`
- **Skeleton to fill in:** none new; tightens `permissions.authorize` and `materials.view_script` from Slice 1 (deny before reading the script record).
- **Depends on:** Slice 1
- **Done when:** the listed test passes and no previously passing test fails. This test may already pass after Slice 1. The slice stays separate because project-level vs material-level authorization is the easiest rule to get subtly wrong. It also confirms that denial happens *before* `read_record` on the script.
- **Status:** done — T007-N green with no extra code; verified (scratch probe) that denial reads no script record and that project membership alone, wrong project, wrong action, and empty user are all denied

---

### Slice 3 — View a choreography video

- **Goal:** A dancer with view permission on a video gets a playable reference; a dancer without it gets 403 and no `video_reference`.
- **Spec sources:** FR-004; BDD-004; Contracts: `view_choreography`, FR-004 route; Test plan: BDD-004 row.
- **Criteria:** BDD-004
- **Tests that should turn green:**
  - `test_acceptance[BDD-004-T004-P]`
  - `test_acceptance[BDD-004-T004-N]`
- **Skeleton to fill in:**
  - `materials.view_choreography`
  - Route `GET /api/projects/<project_id>/videos/<video_id>` (`video` in `app.py`), currently 501
- **Depends on:** Slices 1–2
- **Done when:** the listed tests pass and no previously passing test fails, except the known skeleton conflict for `test_routes_return_501[GET-/api/projects/p/videos/v-None]` (TI-1).
- **Status:** not started

---

### Slice 4 — Manager assigns view permission

- **Goal:** A manager with access-management authority saves a view permission for a cast member on one material; a manager without that authority gets 403 and nothing is saved.
- **Spec sources:** FR-006; BDD-006; Architecture: Modules (Permission Management); Contracts: `assign_view_permission`, FR-006 route; Test plan: BDD-006 row.
- **Criteria:** BDD-006
- **Tests that should turn green:**
  - `test_acceptance[BDD-006-T006-P]`
  - `test_acceptance[BDD-006-T006-N]`
- **Skeleton to fill in:**
  - `database.put_record`
  - `persistence.write_record`
  - `permissions.assign_view_permission`
  - `permissions.authorize` (add the access-management action)
  - Route `POST /api/projects/<project_id>/permissions` (`grant_permission` in `app.py`), currently 501
- **Depends on:** Slices 1–2 (the permission it writes must be the one `authorize` reads)
- **Done when:** the listed tests pass and no previously passing test fails, except the known skeleton conflict for `test_routes_return_501[POST-/api/projects/p/permissions-payload5]` (TI-1).
- **Status:** not started

---

### Slice 5 — Producer updates a script and actors are notified

- **Goal:** A producer with edit permission saves new script content, the updated version is what authorized users read next, and a notification is recorded for each affected actor; a producer without edit permission gets 403 and nothing changes.
- **Spec sources:** FR-005; BDD-005; Goal 4; Architecture: Request Flow (Producer updates a script), Modules (Notification Management); Contracts: `update_script`, `record_notification`, FR-005 route; Test plan: BDD-005 row.
- **Criteria:** BDD-005
- **Tests that should turn green:**
  - `test_acceptance[BDD-005-T005-P]`
  - `test_acceptance[BDD-005-T005-N]`
- **Skeleton to fill in:**
  - `notifications.record_notification`
  - `materials.update_script`
  - `permissions.authorize` (add the edit action)
  - Route `PUT /api/projects/<project_id>/scripts/<script_id>` (`edit_script` in `app.py`), currently 501
- **Depends on:** Slices 1, 4 (affected actors are read from stored view permissions; uses `write_record`)
- **Done when:** the listed tests pass and no previously passing test fails, except the known skeleton conflict for `test_routes_return_501[PUT-/api/projects/p/scripts/s-payload4]` (TI-1).
- **Status:** not started

---

### Slice 6 — Manager distributes a contract

- **Goal:** A manager with contract-management authority assigns a contract to a cast member on the project and a "requires review and signature" notification is recorded; an unauthorized manager gets 403, and no assignment or notification is made.
- **Spec sources:** FR-001; BDD-001; Architecture: Request Flow (Primary scenario); Contracts: `distribute_contract`, FR-001 route; Test plan: BDD-001 row.
- **Criteria:** BDD-001
- **Tests that should turn green:**
  - `test_acceptance[BDD-001-T001-P]`
  - `test_acceptance[BDD-001-T001-N]`
- **Skeleton to fill in:**
  - `contracts.distribute_contract`
  - `permissions.authorize` (add the contract-management action, plus a cast-member project-assignment check)
  - Route `POST /api/projects/<project_id>/contracts/<contract_id>/distributions` (`distribute` in `app.py`), currently 501
- **Depends on:** Slices 1, 4 (writes), 5 (`record_notification`)
- **Done when:** the listed tests pass and no previously passing test fails, except the known skeleton conflict for `test_routes_return_501[POST-/api/projects/p/contracts/c/distributions-payload0]` (TI-1).
- **Status:** not started

---

### Slice 7 — Cast member signs a contract

- **Goal:** The cast member a contract is assigned to can submit a signature, which is recorded together with the status change to `signed`; any other cast member gets 403 and nothing changes.
- **Spec sources:** FR-002; BDD-002; Architecture: Request Flow (Cast member signs a contract), Design Decisions ("Persist signatures together with contract status changes"); Contracts: `sign_contract`, FR-002 route; Test plan: BDD-002 row.
- **Criteria:** BDD-002
- **Tests that should turn green:**
  - `test_acceptance[BDD-002-T002-P]`
  - `test_acceptance[BDD-002-T002-N]`
- **Skeleton to fill in:**
  - `contracts.sign_contract`
  - `permissions.authorize` (add the sign action: the user must be the contract's assignee)
  - Route `POST /api/contracts/<contract_id>/signatures` (`sign` in `app.py`), currently 501
- **Depends on:** Slice 6 (contract assignment record shape)
- **Done when:** the listed tests pass and no previously passing test fails, except the known skeleton conflict for `test_routes_return_501[POST-/api/contracts/c/signatures-payload1]` (TI-1).
- **Status:** not started

---

## Coverage check

| Criterion | Slice |
|---|---|
| BDD-001 | 6 |
| BDD-002 | 7 |
| BDD-003 | 1 |
| BDD-004 | 3 |
| BDD-005 | 5 |
| BDD-006 | 4 |
| BDD-007 | 2 |

- **Every failing test is in exactly one slice:** yes, 13 of 13.
- **Every skeleton function is filled by a slice:** yes. `get_record`, `read_record`, `identify_user`, `authorize`, `view_script` and `present_result` are in Slice 1; `view_choreography` in 3; `put_record`, `write_record` and `assign_view_permission` in 4; `record_notification` and `update_script` in 5; `distribute_contract` in 6; `sign_contract` in 7. `authorize` is extended in slices 2 and 4–7.
- **Every 501 route is filled by a slice:** yes, all 6.
- **No slice depends on a later slice:** confirmed.
- **Criteria or tests that fit no slice:** none. Not covered by any automated test, though:
  - The BDD-007 accepted control T007-P (no permission-seeding fixture exists).
  - All side-effect assertions (stored assignment, signature, status visible to the manager, notification records, "no change" on denial).
  - EXTRA-01 to EXTRA-11.
- **Functions or routes no slice fills:** none.

## Design questions

**Decided (owner, before Slice 1):** DQ-1 → (a) in-memory seed in `database.py`, extended per slice; DQ-3 → (a) built-in `PermissionError` mapped to `403 {"error":"forbidden"}`; DQ-4 → `X-User-ID` is the token, missing/unknown users have no permissions (403); TI-1 → accepted as expected skeleton failures, test file untouched. DQ-5 implemented as per-material permission records `"<project>:<material>:<user>" → {"actions": [...]}` plus a project `members` check.

These need a decision before or during the named slice. Nothing new has been added to the code.

- **DQ-1 (Slice 1): seed data.** Tests assume `proj-1`, `manager-1`, `actor-1`, `script-1` = "Scene one", and so on (test plan, "Common fixtures"), but no contract or module loads them. **Options:**
  - (a) `database.py` holds an in-memory store initialized with the test plan's Common fixtures as demo data.
  - (b) Add a seeding function to `contracts.md`.

  (a) uses only existing modules but puts fixture data in production code. (b) is cleaner but adds a contract.
- **DQ-2 (Slice 1): state between tests.** `conftest.client` builds a new app per test, but module-level storage would persist across tests, so T005-P (rewrites `script-1`) and T001-P/T002-P (change `contract-1`) leave state behind. Should `create_app()` reset the store, which needs a reset entry point not in the contracts, or is order-dependent shared state acceptable for now?
- **DQ-3 (Slice 1): how the business layer reports denial.** Contracts say "proposed 403" but give no mechanism. **Options:**
  - (a) Business functions raise the built-in `PermissionError` and routes map it to `403 {"error":"forbidden"}`.
  - (b) Business functions return `{"error":"forbidden"}` and routes inspect the result.

  (a) keeps HTTP out of the business layer.
- **DQ-4 (Slice 1): identity.** Contracts define `identify_user(session_token)`, but routes receive `X-User-ID`. Proposal: pass the header value as the token. It's still open what to do with a missing header or an unknown user (401, or treat as having no permissions → 403). The spec is silent.
- **DQ-5 (Slices 1–7): `authorize` action names and the role/permission data model.** The spec names roles (manager, producer, actor, dancer) but doesn't say whether authority comes from role or from per-material grants. A per-material, per-action permission record (view, edit, manage_access, manage_contracts, sign) fits BDD-006/007 best.
- **DQ-6 (Slice 5): "affected actors".** Who gets the script-update notification: every user with view permission on that script, or every actor assigned to the project? The spec doesn't say.
- **DQ-7 (Slices 6–7): the `sign_contract` signature has no `project_id`,** but `authorize` requires one. Proposal: read it from the contract record.
- **DQ-8 (all): import and package layout.** `app.py` imports `from setsafe import ...`, while `conftest.py` imports `from app import ...`. The suite only runs as `python -m pytest` from the repo root; bare `pytest` and `python app.py` (as the README instructs) fail with `ModuleNotFoundError`. Business modules must all use one import style (`from setsafe import database`), or the in-memory store gets loaded twice.

## Test issues

No test has been changed.

- **TI-1: `test_skeleton.py::test_routes_return_501[...]` (6 cases)** require every route to return 501 with no `X-User-ID` header. Implementing any route makes its case fail, so "no previously passing test fails" can't hold for slices 1, 3, 4, 5, 6 and 7. These tests describe the skeleton stage and conflict with every slice. The owner must decide whether to retire them. Until then each slice lists its expected skeleton failure.
- **TI-2: T001-P and T002-P share `contract-1`.** The test plan says distribution tests "begin with a separate unassigned contract", but T001-P distributes `contract-1`, which the fixtures already show as assigned to `cast-1` and unsigned for T002-P. The test contradicts the test plan, and the passing result depends on test order (see DQ-2).
- **TI-3: T003-P expects `content == "Scene one"`, but T005-P changes `script-1` to "Revised scene".** This only passes because T003 runs before T005 (order dependence; see DQ-2).
- **TI-4: BDD-007 has only the negative case.** T007-P is commented out for lack of a permission-seeding fixture, so the paired control the test plan requires is missing.
- **TI-5: no test verifies side effects.** BDD-001 (notification received), BDD-002 (manager can view status), BDD-005 (actors notified, updated version available) and BDD-006 (other materials stay inaccessible) are only partly checked through response flags. The test file records this as a TODO.
- **TI-6: unauthenticated case not tested.** The 403 tests use users like `actor-noaccess` that must either exist with no permissions or be unknown; which one matters is unspecified (DQ-4).

## Next action

Start **Slice 3 — View a choreography video** by making `test_acceptance[BDD-004-T004-P]` pass.
