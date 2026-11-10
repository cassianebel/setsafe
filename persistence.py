from typing import Any

def read_record(record_type: str, record_id: str) -> dict[str, Any]:
    """BDD-001–BDD-006; read one stored record."""
    raise NotImplementedError("persistence read not implemented")

def write_record(record_type: str, record_id: str, value: dict[str, Any]) -> dict[str, Any]:
    """BDD-001–BDD-006; store one record."""
    raise NotImplementedError("persistence write not implemented")
