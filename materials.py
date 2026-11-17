from setsafe import permissions, persistence


def view_script(actor_id: str, project_id: str, script_id: str) -> dict:
    """FR-003 and FR-006; BDD-003 and BDD-007.

    Raises PermissionError when the actor may not view this script. The check
    runs before the script record is read, so denied content is never loaded.
    """
    if not permissions.authorize(actor_id, project_id, script_id, "view"):
        raise PermissionError("forbidden")
    script = persistence.read_record("script", script_id)
    return {"script_id": script["script_id"], "content": script["content"]}

def view_choreography(dancer_id: str, project_id: str, video_id: str) -> dict:
    """FR-004; BDD-004."""
    raise NotImplementedError("video access not implemented")

def update_script(producer_id: str, project_id: str, script_id: str, content: str) -> dict:
    """FR-005; BDD-005."""
    raise NotImplementedError("script editing not implemented")
