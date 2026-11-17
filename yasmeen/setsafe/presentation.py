from typing import Any


def present_result(result: dict[str, Any]) -> dict[str, Any]:
    """FR-001–FR-006; presentation boundary. Returns a display-ready copy."""
    return dict(result)
