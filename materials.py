def view_script(actor_id: str, project_id: str, script_id: str) -> dict:
    """FR-003 and FR-006; BDD-003 and BDD-007."""
    raise NotImplementedError("script access not implemented")

def view_choreography(dancer_id: str, project_id: str, video_id: str) -> dict:
    """FR-004; BDD-004."""
    raise NotImplementedError("video access not implemented")

def update_script(producer_id: str, project_id: str, script_id: str, content: str) -> dict:
    """FR-005; BDD-005."""
    raise NotImplementedError("script editing not implemented")
