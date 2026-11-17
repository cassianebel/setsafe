def identify_user(session_token: str) -> str:
    """BDD-001–BDD-007; return authenticated user ID.

    The X-User-ID header value is the token (test-contract convention, not
    secure authentication). A missing or unknown user is returned as-is and
    simply has no permissions (DQ-4).
    """
    return (session_token or "").strip()
