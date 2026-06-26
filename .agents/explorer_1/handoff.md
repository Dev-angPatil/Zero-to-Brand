# Handoff Report - Environment & Test Runner Diagnostics

## 1. Observation
We observed the following parameters from the workspace and host system:
1. **System environment tool outputs:**
   - `node -v` returned: `v20.20.2`
   - `npm -v` returned: `10.8.2`
   - `pnpm -v`, `yarn -v`, and `bun -v` all returned command not found.
   - `python3 --version` returned: `Python 3.14.5`
   - `pip3 --version` returned: command not found.
   - `uv --version` returned: `uv 0.11.21 (5aa65dd7a 2026-06-11 x86_64-unknown-linux-gnu)`
   - `which google-chrome chromium firefox flatpak` returned:
     ```
     which: no google-chrome in ...
     which: no chromium in ...
     /usr/bin/firefox
     /usr/bin/flatpak
     ```
2. **Dynamic python sandbox execution:**
   - Running `uv run --with pytest --with httpx python3 -c "import pytest, httpx; ..."` returned:
     ```
     Installed 12 packages in 32ms
     Success! pytest version: 9.1.0 and httpx version: 0.28.1
     ```
3. **npm package resolution capability:**
   - Running `npm install --dry-run vitest @playwright/test` returned:
     ```
     added 118 packages in 2m
     ```
4. **Project structure configuration:**
   - `package.json` contains no test script or test runner dependencies. It relies on Next.js `16.2.9` and React `19.2.4`.
   - `src/data/dbClient.ts` operates on `src/data/db.json` using synchronous file I/O operations (`fs.readFileSync`, `fs.writeFileSync`).
   - `src/lib/gemini.ts` evaluates `process.env.GEMINI_API_KEY` to decide whether to make live API calls or run in simulation mode (`isSimulated`).
   - `src/app/page.tsx` and `src/app/brand/page.tsx` contain visualizer animations and Web Audio API pluck synthesizers.

---

## 2. Logic Chain
1. **Node and npm availability:** Based on Observation 1.1, Node.js (`v20.20.2`) and npm (`10.8.2`) are installed and available. This means any Node-based runner can be run natively.
2. **Missing package managers & pip:** Observation 1.1 shows that `pnpm`, `yarn`, `bun`, and `pip` are not installed. Therefore, Node-based installations must use npm. Python-based testing cannot rely on global pip/pip3.
3. **Dynamic execution via uv:** Observation 1.2 shows that `uv` is available and can execute Python scripts along with arbitrary dependencies (`pytest`, `httpx`) dynamically in a cached environment in under a second (32ms overhead). Therefore, a python-based API/DB state test runner using `pytest` is highly feasible and has zero npm dependency weight.
4. **npm dry-run success:** Observation 1.3 shows that npm registry requests resolve successfully in the workspace environment, meaning we can install `@playwright/test` or `vitest` without network blocks.
5. **Host Browser availability:** Observation 1.1 shows that `firefox` is the only web browser installed on the host system path. Thus, E2E browser automation (like Playwright) must be configured to run against the host's `/usr/bin/firefox` binary or download a dedicated headless Chromium runner.
6. **Codebase requirements:** Observations 1.4 show that the client-side relies on the Web Audio API and file upload flows, while the backend relies on synchronous local JSON database file mutations.
   - To test backend endpoints and database mutations quickly, an API client test runner (Option B: Python/pytest + httpx) is ideal.
   - To test frontend onboarding configurations, sliders, and audio plucks (Option A: Playwright), a browser-based automation tool is required.

---

## 3. Caveats
- We did not perform a live install of Playwright browser binaries, which could require additional library dependencies on the host system.
- We did not write or execute actual E2E test cases, as this is scoped for subsequent implementation milestones.
- The `GEMINI_API_KEY` present in `.env.local` was not validated against live Google servers; tests should support a fallback to Simulation Mode (`isSimulated = true`) by passing an empty or invalid key in test environments.

---

## 4. Conclusion
We recommend setting up a **Dual-Runner Test Infrastructure**:
1. **Pytest (via `uv run`)** for lightweight, instant verification of backend APIs (POST/PUT/DELETE) and database state consistency (`db.json` mutations).
2. **Playwright** for complete user-flow verification (mock-login gateway, onboarding survey, dials configuration, chatbot conversation, and canvas poster rendering).

---

## 5. Verification Method
To verify that the workspace environment is ready to support both runners, run the following commands:
1. **Verify Python testing via uv:**
   ```bash
   uv run --with pytest --with httpx pytest --version
   ```
   *Expected output:* `pytest 9.x.x`
2. **Verify npm dry-run resolution:**
   ```bash
   npm install --dry-run vitest @playwright/test
   ```
   *Expected output:* Successfully finishes resolving packages with `added 118 packages` or similar message.
