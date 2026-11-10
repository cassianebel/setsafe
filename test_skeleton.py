"""Transport skeleton contract checks; these should pass before behavior exists."""
import pytest
from app import ROUTE_CONTRACTS

@pytest.mark.parametrize("method,path,payload", [
    ("POST", "/api/projects/p/contracts/c/distributions", {"cast_member_id":"x"}),
    ("POST", "/api/contracts/c/signatures", {"signature":"x"}),
    ("GET", "/api/projects/p/scripts/s", None),
    ("GET", "/api/projects/p/videos/v", None),
    ("PUT", "/api/projects/p/scripts/s", {"content":"x"}),
    ("POST", "/api/projects/p/permissions", {"cast_member_id":"x","material_id":"s"}),
])
def test_routes_return_501(client, method, path, payload):
    response = client.open(path, method=method, json=payload)
    assert response.status_code == 501
    assert response.get_json()["error"] == "not_implemented"
    assert isinstance(response.get_json()["message"], str)

def test_six_routes_map_to_public_functions():
    assert len(ROUTE_CONTRACTS) == 6
    assert all(callable(fn) for fn in ROUTE_CONTRACTS.values())
