import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def data_dir() -> Path:
    raw = os.environ.get("DATA_DIR", "")
    path = Path(raw) if raw else ROOT / "data"
    if not path.is_absolute():
        path = ROOT / path
    return path


class Config:
    """Course constraints live here so routes do not hard-code them.

    The same cutoffs are duplicated in app/static/js/curve.js because the
    public calculator computes in the browser. Change both together.
    """

    SECRET_KEY = ""
    DATA_DIR = data_dir()
    MAX_CONTENT_LENGTH = 256 * 1024
    SESSION_COOKIE_NAME = "elisa_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
    FREE_RUN_LIMIT = 3
    CV_WARN_PERCENT = 15
    CV_BAD_PERCENT = 25
    OD_MIN = 0.0
    OD_MAX = 4.0
    SATURATION_OD = 2.5
    MIN_STANDARDS = 2
    MAX_STANDARDS = 8
    MAX_SAMPLES = 24
    MIN_PASSWORD_LENGTH = 10
    MAX_PASSWORD_LENGTH = 128

