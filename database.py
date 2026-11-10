from typing import Any

def get_record(record_type: str, record_id: str) -> dict[str, Any]:
    """BDD-001–BDD-006; database read boundary."""
    raise NotImplementedError("database read not implemented")

def put_record(record_type: str, record_id: str, value: dict[str, Any]) -> dict[str, Any]:
    """BDD-001–BDD-006; database write boundary."""
    raise NotImplementedError("database write not implemented")
