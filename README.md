# ELISA Studio

source .venv/bin/activate
flask run

Web calculator for ELISA standard curves. Individual SOEN 287 project, Fall 2026.

Visitors enter optical densities and get a linear standard curve in the browser, without an account. Signed-in users will save runs to their own JSON file. The curve math and account creation are specified and not implemented yet. See `app/curve.py`.

## Stack

- HTML5, CSS, and browser JavaScript. No npm and no front-end framework.
- Flask, Jinja2 templates, session cookies.
- One JSON file per user under `data/users/`. No SQL database.
- Passwords hashed with Werkzeug (scrypt).

## Run locally

Python 3.13. From this directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Paste that token into `.env` as `SECRET_KEY`, then:

```bash
flask run
```

Open http://127.0.0.1:5001 . The port is 5001 because macOS AirPlay uses 5000.

`flask run` reads `.flaskenv` (committed) and `.env` (gitignored). `.flaskenv` turns the debugger on for local work. That debugger must not be reachable from another machine. The app refuses to boot if `APP_ENV=production` and `FLASK_DEBUG=1`.

Cursor should pick `.venv` up from `.vscode/settings.json`. If imports look missing, select the interpreter at `.venv/bin/python`.

## Where code goes

| Concern | File |
| --- | --- |
| Pages and routes | `app/blueprints/` |
| HTML | `app/templates/` |
| Layout | `app/static/css/main.css` |
| Curve math (browser) | `app/static/js/curve.js` |
| Curve math (server) | `app/curve.py` |
| Plot | `app/static/js/plot.js` |
| Live plate UI | `app/static/js/calculator.js` |
| Input rules | `app/validation.py` |
| Accounts, CSRF, sessions | `app/security.py` |
| JSON files | `app/storage.py` |
| Limits and cutoffs | `app/config.py` |

Scripts are plain files loaded in order (`curve.js`, then `plot.js`, then `calculator.js`). They are not ES modules, so there is no bundler. Flask debug mode sends static files with no cache; a normal refresh picks up CSS and JS edits.

## Data

User files are created when registration exists. Do not commit them. `.gitignore` already excludes `data/index.json` and `data/users/*.json`.

A saved run stores inputs only (standards, samples, blank, notes). The server recomputes slope, R², and concentrations into a `snapshot` when a run is saved. The client is not allowed to supply those results.

## Deploy later

Use one Flask process on Render with gunicorn, `APP_ENV=production`, `FLASK_DEBUG=0`, and a fresh `SECRET_KEY`. Do not use `flask run` on the public host. Vercel is a poor fit for this Flask app.
