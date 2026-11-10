def authorize(user_id: str, project_id: str, material_id: str, action: str) -> bool:
    """FR-006; BDD-006–BDD-007. Includes project assignment and material scope."""
    raise NotImplementedError("permission checks not implemented")

def assign_view_permission(manager_id: str, project_id: str, cast_member_id: str, material_id: str) -> dict:
    """FR-006; BDD-006."""
    raise NotImplementedError("permission assignment not implemented")
