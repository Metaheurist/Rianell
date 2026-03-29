# Python desktop server (HTTP latency)

Optional benchmark slot from the multi-platform plan. The Rianell **Python + Tk** server (`server/main.py`) is not exercised in the default CI benchmark lane because it requires a running process, GUI/toolkit availability, and port binding that differ per host.

To add latency checks later: run the server on a fixed port and measure `GET /` and `GET /api/supabase-status` with a small client (e.g. Node `http.request` or Python `urllib`) over multiple iterations, then write results here or extend `benchmarks/scripts/`.
