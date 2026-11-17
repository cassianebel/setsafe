from copy import deepcopy
from typing import Any

# In-memory store (DQ-1): seeded with the demo data from the test plan's
# "Common fixtures". Records are grouped by record type, then by record ID.
_STORE: dict[str, dict[str, dict[str, Any]]] = {
    "project": {
        "proj-1": {
            "project_id": "proj-1",
            "members": ["manager-1", "producer-1", "cast-1", "actor-1", "dancer-1"],
        },
    },
    "script": {
        "script-1": {"script_id": "script-1", "project_id": "proj-1", "content": "Scene one"},
        "script-2": {"script_id": "script-2", "project_id": "proj-1", "content": "Restricted scene"},
    },
    # Permission records are keyed "<project_id>:<material_id>:<user_id>" and
    # list the actions that user may perform on that one material.
    "permission": {
        "proj-1:script-1:actor-1": {"actions": ["view"]},
    },
}


def get_record(record_type: str, record_id: str) -> dict[str, Any]:
    """BDD-001–BDD-006; database read boundary.

    Raises KeyError when the record does not exist.
    """
    return deepcopy(_STORE[record_type][record_id])


def put_record(record_type: str, record_id: str, value: dict[str, Any]) -> dict[str, Any]:
    """BDD-001–BDD-006; database write boundary."""
    raise NotImplementedError("database write not implemented")
