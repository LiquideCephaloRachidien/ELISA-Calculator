import os

from flask import Flask, render_template

from app.config import Config, data_dir
from app.security import csrf_token
from app.storage import ensure_data_dirs


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    secret = os.environ.get("SECRET_KEY", "")
    placeholder = "replace-with-a-long-random-string"
    if secret == placeholder or len(secret) < 32:
        raise RuntimeError(
            "Set SECRET_KEY in .env to a long random string (see .env.example). "
            'python3 -c "import secrets; print(secrets.token_hex(32))"'
        )
    app.config["SECRET_KEY"] = secret

    production = os.environ.get("APP_ENV") == "production"
    if production and os.environ.get("FLASK_DEBUG") == "1":
        raise RuntimeError("Refusing to start with FLASK_DEBUG=1 when APP_ENV=production.")
    if production:
        app.config["SESSION_COOKIE_SECURE"] = True
        app.config["DEBUG"] = False
    else:
        # Static CSS/JS would otherwise stick in the browser for hours.
        app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

    resolved_data = data_dir()
    Config.DATA_DIR = resolved_data
    app.config["DATA_DIR"] = resolved_data
    ensure_data_dirs()

    @app.context_processor
    def inject_csrf():
        return {"csrf_token": csrf_token}

    @app.errorhandler(400)
    def bad_request(_error):
        return (
            render_template(
                "error.html",
                title="Bad request",
                message="That submission was rejected. Reload the page and try again.",
            ),
            400,
        )

    @app.errorhandler(404)
    def not_found(_error):
        return (
            render_template(
                "error.html",
                title="Page not found",
                message="That page does not exist.",
            ),
            404,
        )

    @app.errorhandler(413)
    def too_large(_error):
        return (
            render_template(
                "error.html",
                title="Too large",
                message="That submission is too large.",
            ),
            413,
        )

    from app.blueprints.auth import bp as auth_bp
    from app.blueprints.dashboard import bp as dashboard_bp
    from app.blueprints.public import bp as public_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    return app
