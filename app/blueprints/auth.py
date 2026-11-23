from flask import Blueprint, flash, redirect, render_template, request, session, url_for

from app.security import validate_csrf

bp = Blueprint("auth", __name__)


@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        validate_csrf()
        # Milestone 3:
        # - parse_login; one error message for unknown email and bad password
        # - session.clear() before session["user_id"] = ... (session fixation)
        # - redirect to safe_next(request.form.get("next"))
        flash("Sign-in is not built yet.", "info")
        return redirect(url_for("auth.login"))
    return render_template("login.html", next_url=request.args.get("next", ""))


@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        validate_csrf()
        # Milestone 3: parse_registration, hash_password, reject duplicate email,
        # write the user file and the index, then start a session as in login.
        flash("Registration is not built yet.", "info")
        return redirect(url_for("auth.register"))
    return render_template("register.html")


@bp.post("/logout")
def logout():
    validate_csrf()
    was_in = bool(session.get("user_id"))
    session.clear()
    if was_in:
        flash("You have been logged out.", "info")
    return redirect(url_for("public.home"))
