"""Contract-level acceptance tests: intentionally red until implementation exists.

Only documented REST routes are called. Side-effect verification is deferred because
no state inspection/fixture contract exists in architecture.md or contracts.md.
"""
import pytest

CASES = [
    ("BDD-001", "T001-P", "POST", "/api/projects/proj-1/contracts/contract-1/distributions", "manager-1", {"cast_member_id": "cast-1"}, 200, {"contract_id":"contract-1","cast_member_id":"cast-1","assigned":True,"notification_created":True}),
    ("BDD-001", "T001-N", "POST", "/api/projects/proj-1/contracts/contract-1/distributions", "manager-noaccess", {"cast_member_id": "cast-1"}, 403, {"error":"forbidden"}),
    ("BDD-002", "T002-P", "POST", "/api/contracts/contract-1/signatures", "cast-1", {"signature":"Cast One"}, 200, {"contract_id":"contract-1","status":"signed","signature_recorded":True}),
    ("BDD-002", "T002-N", "POST", "/api/contracts/contract-1/signatures", "cast-2", {"signature":"Cast One"}, 403, {"error":"forbidden"}),
    ("BDD-003", "T003-P", "GET", "/api/projects/proj-1/scripts/script-1", "actor-1", None, 200, {"script_id":"script-1","content":"Scene one"}),
    ("BDD-003", "T003-N", "GET", "/api/projects/proj-1/scripts/script-1", "actor-noaccess", None, 403, {"error":"forbidden"}),
    ("BDD-004", "T004-P", "GET", "/api/projects/proj-1/videos/video-1", "dancer-1", None, 200, {"video_id":"video-1","playable":True,"video_reference":"video-1"}),
    ("BDD-004", "T004-N", "GET", "/api/projects/proj-1/videos/video-1", "dancer-noaccess", None, 403, {"error":"forbidden"}),
    ("BDD-005", "T005-P", "PUT", "/api/projects/proj-1/scripts/script-1", "producer-1", {"content":"Revised scene"}, 200, {"script_id":"script-1","content":"Revised scene","notification_created":True}),
    ("BDD-005", "T005-N", "PUT", "/api/projects/proj-1/scripts/script-1", "producer-noaccess", {"content":"Revised scene"}, 403, {"error":"forbidden"}),
    ("BDD-006", "T006-P", "POST", "/api/projects/proj-1/permissions", "manager-1", {"cast_member_id":"cast-1","material_id":"script-1"}, 200, {"project_id":"proj-1","cast_member_id":"cast-1","material_id":"script-1","permission":"view"}),
    ("BDD-006", "T006-N", "POST", "/api/projects/proj-1/permissions", "manager-noaccess", {"cast_member_id":"cast-1","material_id":"script-1"}, 403, {"error":"forbidden"}),
    ("BDD-007", "T007-N", "GET", "/api/projects/proj-1/scripts/script-2", "actor-1", None, 403, {"error":"forbidden"}),
    # T007-P needs a fixture with script-2 permission granted; not available in contracts.
]

@pytest.mark.parametrize("criterion,case_id,method,path,user,payload,expected_status,expected_fields", CASES, ids=[f"{r[0]}-{r[1]}" for r in CASES])
def test_acceptance(client, criterion, case_id, method, path, user, payload, expected_status, expected_fields):
    response = client.open(path, method=method, json=payload, headers={"X-User-ID":user})
    assert response.status_code == expected_status, f"{criterion}/{case_id}: expected {expected_status}, got {response.status_code}"
    body = response.get_json()
    assert isinstance(body, dict)
    for key, value in expected_fields.items():
        assert body.get(key) == value, f"{criterion}/{case_id}: {key}"
    if expected_status == 403:
        assert "content" not in body
        assert "video_reference" not in body

# TODO (blocked by missing contracts): independently verify persistent side effects,
# negative-case no-creation, manager-visible contract status, notification records,
# and BDD-007 accepted control using permission-seeded fixture.
