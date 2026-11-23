import os

from dotenv import load_dotenv

# Must run before the app import so SECRET_KEY is visible to create_app.
load_dotenv()

from app import create_app

app = create_app()

if __name__ == "__main__":
    production = os.environ.get("APP_ENV") == "production"
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    if production and debug:
        raise SystemExit("Refusing to start with FLASK_DEBUG=1 when APP_ENV=production.")
    app.run(
        host=os.environ.get("FLASK_RUN_HOST", "127.0.0.1"),
        port=int(os.environ.get("FLASK_RUN_PORT", "5001")),
        debug=debug,
    )
