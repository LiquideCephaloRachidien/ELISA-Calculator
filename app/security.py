"""Session gate, CSRF, and password hashing.

Passwords go through Werkzeug's generate_password_hash (scrypt). Do not
replace this with hashlib — a bare SHA-256 has no salt and is not a
password hash.

Login and registration use these helpers.
"""

import secrets
from functools import wraps

from flask import abort, redirect, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    return check_password_hash(password_hash, password)


def csrf_token() -> str:
    token = session.get("_csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["_csrf_token"] = token
    return token


def validate_csrf() -> None:
    sent = request.form.get("_csrf_token", "")
    expected = session.get("_csrf_token", "")
    if not expected or not sent or not secrets.compare_digest(expected, sent):
        abort(400)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            return redirect(url_for("auth.login", next=request.path))
        return view(*args, **kwargs)

    return wrapped


def safe_next(target: str | None) -> str:
    """Only allow a same-site path back after login.

    Rejects scheme-relative URLs (`//evil.example`) and backslashes.
    """
    if (
        target
        and target.startswith("/")
        and not target.startswith("//")
        and "\\" not in target
    ):
        return target
    return url_for("dashboard.index")
