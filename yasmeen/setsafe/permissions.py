from setsafe import persistence


def _permission_id(project_id: str, material_id: str, user_id: str) -> str:
    return f"{project_id}:{material_id}:{user_id}"


def authorize(user_id: str, project_id: str, material_id: str, action: str) -> bool:
    """FR-006; BDD-006–BDD-007. Includes project assignment and material scope.

    True only if the user is assigned to the project AND holds `action` on this
    specific material. Project membership alone grants nothing.
    """
    if not user_id:
        return False
    try:
        project = persistence.read_record("project", project_id)
        if user_id not in project.get("members", []):
            return False
        grant = persistence.read_record("permission", _permission_id(project_id, material_id, user_id))
    except KeyError:
        return False
    return action in grant.get("actions", [])


def assign_view_permission(manager_id: str, project_id: str, cast_member_id: str, material_id: str) -> dict:
    """FR-006; BDD-006."""
    raise NotImplementedError("permission assignment not implemented")
