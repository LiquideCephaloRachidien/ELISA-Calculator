"""JSON persistence. One file per account. No SQL (course requirement).

Layout, created at runtime and gitignored:
  data/index.json           {"users": [{"id", "email"}]}
  data/users/<id>.json      account record plus that account's runs

<id> is a 32-character hex string from new_id(). The id is checked before
it touches the filesystem so a request cannot escape data/users.

write_* replaces the file atomically. A crash cannot leave a half-written
document. A read followed by a later write is not locked against other
processes: run one server process against this directory.
"""

import json
import os
import re
import tempfile
import uuid
from pathlib import Path

from app.config import Config

USER_ID_RE = re.compile(r"^[a-f0-9]{32}$")


def new_id() -> str:
    return uuid.uuid4().hex


def ensure_data_dirs() -> None:
    (Config.DATA_DIR / "users").mkdir(parents=True, exist_ok=True)


def user_path(user_id: str) -> Path:
    if not USER_ID_RE.fullmatch(user_id or ""):
        raise ValueError("Invalid user id")
    return Config.DATA_DIR / "users" / f"{user_id}.json"


def read_user(user_id: str) -> dict | None:
    return _read_json(user_path(user_id))


def write_user(user_id: str, record: dict) -> None:
    if record.get("id") != user_id:
        raise ValueError("User record id does not match the file")
    _write_json(user_path(user_id), record)


def read_index() -> dict:
    data = _read_json(Config.DATA_DIR / "index.json")
    if data is None:
        return {"users": []}
    if not isinstance(data.get("users"), list):
        raise ValueError("Corrupt index")
    return data


def write_index(index: dict) -> None:
    users = index.get("users")
    if not isinstance(users, list):
        raise ValueError("Index must contain a users list")
    for entry in users:
        if not isinstance(entry, dict) or set(entry) != {"id", "email"}:
            raise ValueError("Index entry must be id and email only")
        if not USER_ID_RE.fullmatch(entry["id"]):
            raise ValueError("Invalid user id in index")
        email = entry["email"]
        if not isinstance(email, str) or email != email.strip().lower() or "@" not in email:
            raise ValueError("Index email must be stored lowercase")
    _write_json(Config.DATA_DIR / "index.json", {"users": users})


def find_user_id(email: str) -> str | None:
    key = email.strip().lower()
    for entry in read_index()["users"]:
        if entry.get("email") == key:
            user_id = entry.get("id")
            if isinstance(user_id, str):
                return user_id
    return None


def _read_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Corrupt data file: {path.name}")
    return data


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise
