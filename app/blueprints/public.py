from flask import Blueprint, render_template

bp = Blueprint("public", __name__)


@bp.get("/")
def home():
    return render_template("calculator.html")


@bp.get("/dilutions")
def dilutions():
    return render_template("dilutions.html")


@bp.get("/health")
def health():
    return "ok", 200, {"Content-Type": "text/plain; charset=utf-8"}
