from flask import Blueprint, render_template

from app.security import login_required

bp = Blueprint("dashboard", __name__)


@bp.get("/dashboard")
@login_required
def index():
    # Milestone 3: load the session user's file only, list record["runs"].
    # Never take a user id from the query string.
    return render_template("dashboard.html", runs=[])
