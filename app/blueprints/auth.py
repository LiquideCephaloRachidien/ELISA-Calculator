from flask import Blueprint, flash, redirect, render_template, request, session, url_for

from app.security import hash_password, safe_next, validate_csrf, verify_password
from app.storage import find_user_id, new_id, read_index, read_user, write_index, write_user
from app.validation import parse_login, parse_registration

bp = Blueprint("auth", __name__)


@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        validate_csrf()
        next_url = request.form.get("next", "")
        try:
            credentials = parse_login(request.form)
        except ValueError as error:
            flash(str(error), "error")
            return render_template(
                "login.html",
                next_url=next_url,
                email=request.form.get("email", ""),
            )
        user_id = find_user_id(credentials["email"])
        record = read_user(user_id) if user_id else None
        password_hash = record.get("password_hash", "") if isinstance(record, dict) else ""
        if not isinstance(password_hash, str) or not verify_password(credentials["password"], password_hash):
            flash("Email or password is incorrect.", "error")
            return render_template(
                "login.html",
                next_url=next_url,
                email=credentials["email"],
            )
        session.clear()
        session["user_id"] = user_id
        flash("You are logged in.", "info")
        return redirect(safe_next(next_url))
    return render_template("login.html", next_url=request.args.get("next", ""))


@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        validate_csrf()
        try:
            account = parse_registration(request.form)
        except ValueError as error:
            flash(str(error), "error")
            return render_template(
                "register.html",
                email=request.form.get("email", ""),
                display_name=request.form.get("display_name", ""),
            )
        email = account["email"]
        if find_user_id(email):
            flash("An account with that email already exists.", "error")
            return render_template(
                "register.html",
                email=email,
                display_name=account["display_name"],
            )
        user_id = new_id()
        write_user(
            user_id,
            {
                "id": user_id,
                "email": email,
                "display_name": account["display_name"],
                "password_hash": hash_password(account["password"]),
                "runs": [],
            },
        )
        index = read_index()
        index["users"].append({"id": user_id, "email": email})
        write_index(index)
        session.clear()
        session["user_id"] = user_id
        flash("Account created.", "info")
        return redirect(url_for("dashboard.index"))
    return render_template("register.html")


@bp.post("/logout")
def logout():
    validate_csrf()
    was_in = bool(session.get("user_id"))
    session.clear()
    if was_in:
        flash("You have been logged out.", "info")
    return redirect(url_for("public.home"))
