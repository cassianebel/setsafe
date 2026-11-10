# SetSafe — Flask skeleton

Conceptual architecture adapted to Python + Flask + pytest. No business logic is implemented.

## Start

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

Windows PowerShell activation: `.venv\Scripts\Activate.ps1`.

The server starts at `http://127.0.0.1:5000`. Every declared API returns HTTP 501 until implemented.

## Tests

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
