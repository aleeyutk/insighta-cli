# Insighta Labs+ CLI

This directory contains the Command Line Interface (CLI) code for the Insighta Labs+ ecosystem.

## CLI Usage
To test the environment natively on your machine:

1. **Install Globals:**
```bash
npm install
npm link
```
2. **Commands Available:**
- `insighta login` — Spawns a local secure callback server mapping to Github OAuth, automatically resolving credentials natively without pasting secrets.
- `insighta logout` — Revokes session via backend servers.
- `insighta profiles list --sort-by age --order desc` — Fetches formatted tables natively integrating our Pagination specs (`links`, `total_pages`).
- `insighta profiles search "men over 20"` — NLP parsing proxy interface.
- `insighta profiles create --name "Harriet Tubman"` — Requires `admin` backend JWT permissions natively.
- `insighta profiles export --format csv --gender female` — Maps binaries directly natively to the present working directory securely.

**Token Intercept Mechanics**: Features Axios interceptors caching keys persistently inside `~/.insighta/credentials.json`, autonomously executing background token swapping to the `/auth/refresh` API transparently whenever an `Access Token` natively hits the 3-minute expiry frame.
##
