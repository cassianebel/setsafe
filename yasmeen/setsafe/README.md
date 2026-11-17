# SetSafe — Flask skeleton

Yasmeen's SetSafe implementation (Python + Flask + pytest), kept in `yasmeen/setsafe/` so it sits alongside the team's Next.js project at the repo root. Specs: `yasmeen-spec.md`, `yasmeen-architecture.md`, `yasmeen-contracts.md`, `yasmeen-test_plan.md`; slices: `plan.md`. Slices 1–2 (BDD-003, BDD-007) are implemented; other routes still return 501.

## Start

From this folder (`yasmeen/setsafe/`):

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cd ..
python -m flask --app setsafe.app run
```

The app imports itself as the `setsafe` package, so the server is started from the parent folder (`yasmeen/`). Try:

```bash
curl -H "X-User-ID: actor-1" http://127.0.0.1:5000/api/projects/proj-1/scripts/script-1
```

Windows PowerShell activation: `.venv\Scripts\Activate.ps1`.

The server starts at `http://127.0.0.1:5000`. Routes not yet implemented return HTTP 501.

## Tests

From this folder (`yasmeen/setsafe/`); use `python -m pytest`, not bare `pytest`:

```bash
python -m pytest -q
```

`test_skeleton.py` should pass; acceptance tests should fail on status assertions (501 vs proposed 200/403). The missing persistence-observation contract blocks full side-effect assertions. See `test_plan.md` and `contracts.md`.


## Test Execution Results

The automated tests were executed using Python and pytest.

- Total Tests: 20
- Passed: 7
- Failed: 13
- Execution Time: 0.17 seconds

All 13 failed tests returned HTTP 501 (Not Implemented)
instead of the expected HTTP 200 or 403 responses.

These failures are expected because SetSafe currently
contains an implementation skeleton without business logic.

The tests executed without reported syntax or import errors.


## Source notes

`architecture.md` is the supplied architecture file. `spec_reference.md` is a clearly labeled reconstruction of the supplied `spec.md` content in the conversation, **not** a byte-for-byte original. No unapproved non-goals or NFRs were added.
