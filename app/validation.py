"""Turn untrusted form and JSON input into a clean document.

Client-side checks are only for immediate feedback. Every write goes
through these functions. Raise ValueError with a sentence the user can
read. Callers turn that into a flash message or a 400 response.

Account rules
- Login id is the email, stored lowercase. Email cannot be changed later.
- display_name is 1–40 characters.
- Password is Config.MIN_PASSWORD_LENGTH–MAX_PASSWORD_LENGTH characters.
- A failed login uses one message for a missing email and a wrong
  password: "Email or password is incorrect."

Assay document (what we store; results are not accepted from the client)

{
  "id": "32 hex",
  "title": "1–120 chars",
  "notes": "0–2000 chars",
  "unit": "1–20 chars, default pg/mL",
  "blank_od": 0.0,
  "created_at": "ISO-8601 UTC",
  "updated_at": "ISO-8601 UTC",
  "standards": [
    {"concentration": 10.0, "replicates": [0.30, 0.31]}
  ],
  "samples": [
    {"name": "Sample A", "dilution": 1.0, "replicates": [0.40, 0.42]}
  ]
}

Rules
- Exactly two replicates in the MVP. Decimal dot or a single comma.
- Completely empty rows are dropped. Partly filled rows are errors.
- At least Config.MIN_STANDARDS complete standards, at most MAX_STANDARDS,
  with at least two different concentrations.
- At most Config.MAX_SAMPLES samples. Zero samples is valid.
- OD values lie in Config.OD_MIN..OD_MAX inclusive.
- Concentrations are >= 0. Dilutions are > 0.
- Ignore any client-supplied slope, R^2, or sample concentration.
  Milestone 4 recomputes those with app.curve and stores them under
  "snapshot" on the server. The snapshot is overwritten on every save.
"""


def parse_registration(form: dict) -> dict:
    raise NotImplementedError


def parse_login(form: dict) -> dict:
    raise NotImplementedError


def parse_assay(payload: dict) -> dict:
    raise NotImplementedError
