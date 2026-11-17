from typing import Any

from setsafe import database


def read_record(record_type: str, record_id: str) -> dict[str, Any]:
    """BDD-001–BDD-006; read one stored record.

    Raises KeyError when the record does not exist.
    """
    return database.get_record(record_type, record_id)


def write_record(record_type: str, record_id: str, value: dict[str, Any]) -> dict[str, Any]:
    """BDD-001–BDD-006; store one record."""
    raise NotImplementedError("persistence write not implemented")
