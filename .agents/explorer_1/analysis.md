# Analysis Report: Environment Diagnostics & E2E Test Runner Recommendation

## 1. Environment Diagnostics Summary

The following software versions and execution environments were successfully verified on the host system:

| Environment Property | Verified State / Version | Note |
|----------------------|--------------------------|------|
| **Node.js**          | `v20.20.2`               | Built-in support for native `fetch` and native test runner (`node --test`) |
| **npm**              | `10.8.2`                 | Standard package manager, full resolution and download capabilities |
| **Package Managers** | `pnpm`: NOT found<br>`yarn`: NOT found<br>`bun`: NOT found | `npm` is the sole Node.js package manager available |
| **Python**           | `3.14.5`                 | Modern Python runtime environment |
| **pip / pip3**       | NOT found                | Standard `pip` installation is missing from the global environment |
| **uv**               | `0.11.21`                | **Available and fully functional.** Can dynamically provision and run python packages (e.g., `pytest`, `httpx`) with zero-install overhead |
| **Web Browsers**     | `firefox`: `/usr/bin/firefox`<br>`chrome`/`chromium`: NOT found | System is running Linux (Hyprland Wayland environment) with native Firefox available |

*Verification Command Run:*
- `npm install --dry-run vitest @playwright/test` verified that npm registry resolution works and dependencies can be installed.
- `uv run --with pytest --with httpx python3 -c "import pytest, httpx; ..."` verified that `uv` can install and run python testing packages dynamically in 32ms.

---

## 2. Test Runner Evaluation

We evaluated five potential test runner options for their fit with the Zero-to-Brand project:

### Option A: Playwright (`@playwright/test`)
- **Category**: Browser-based E2E Test Runner
- **Ease of Setup**: Moderate (requires `playwright.config.ts` and `@playwright/test` in devDependencies).
- **Execution**: Runs the Next.js server in the background and controls a headless browser. Can be configured to run against the host's `/usr/bin/firefox` to save disk space and setup time, or download a dedicated headless Chromium binary (~150MB).
- **Pros**:
  - Can fully test the frontend user flow: Mock-login screen file upload, dragging aesthetic dials (R1), chatbot responses (R2), and canvas rendering/download (R3).
  - Can assert on visual layouts, local storage session persistence, and file download hooks.
- **Cons**:
  - Heavy installation footprint compared to other options.

### Option B: Python / pytest + httpx (via `uv`)
- **Category**: API Integration & State Test Runner
- **Ease of Setup**: Extremely high. No changes needed in `package.json`.
- **Execution**: Run via `uv run --with pytest --with httpx pytest tests/`.
- **Pros**:
  - Zero overhead in `package.json`. No extra devDependencies added to node modules.
  - Extremely fast execution (milliseconds).
  - Perfect for testing API endpoints (GET/POST/PUT/DELETE `/api/brands` and `/api/products`), verifying Gemini request/response logic, and directly checking changes in the local database file (`src/data/db.json`).
- **Cons**:
  - Cannot test frontend React DOM interactions, file drag-and-drop, sliders, or the Web Audio API synthesis loop.

### Option C: Vitest
- **Category**: In-Memory Unit / Integration Test Runner
- **Ease of Setup**: Easy (requires Vite/Vitest configurations).
- **Execution**: Runs tests in Node using JSDOM or Happy DOM.
- **Pros**:
  - Fast execution, out-of-the-box ESM/TypeScript support.
- **Cons**:
  - Mocking browser-side details like Web Audio API synthesizers (used in the workspace page and brand page) or Canvas file generation is complex and brittle in JSDOM.

### Option D: Native Node.js Test Runner (`node --test`)
- **Category**: Minimalist JS/TS Test Runner
- **Ease of Setup**: High (no external packages, native support).
- **Pros**:
  - Zero package dependencies.
- **Cons**:
  - Lacks user-friendly assertion tooling, browser automation, and requires compilation wrappers to run TypeScript tests.

---

## 3. Recommended Testing Strategy

We recommend a **Dual-Runner Test Architecture** that aligns with the dual-track project pattern (Implementation Track + E2E Testing Track):

```
                       ┌───────────────────────────────────────────┐
                       │           Zero-to-Brand Project           │
                       └─────────────────────┬─────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │          E2E & Integration Tests          │
                       └─────────────────────┬─────────────────────┘
                                             │
             ┌───────────────────────────────┴───────────────────────────────┐
             ▼                                                               ▼
┌───────────────────────────────┐                               ┌───────────────────────────────┐
│     API & DB Integration      │                               │    Frontend User Interface    │
│    (Pytest via `uv run`)      │                               │   (Playwright / Firefox)      │
├───────────────────────────────┤                               ├───────────────────────────────┤
│ - Tests API route logic       │                               │ - Tests user onboarding forms │
│ - Verifies db.json state      │                               │ - Tests aesthetic dials       │
│ - Zero npm install overhead   │                               │ - Tests canvas downloads      │
│ - Extremely fast execution    │                               │ - Verifies session storage    │
└───────────────────────────────┘                               └───────────────────────────────┘
```

### 1. API & Database State Testing (Tier 1-4 Integration)
- **Tool**: Python + `pytest` + `httpx` run dynamically via `uv`.
- **Purpose**: Fast backend verification of endpoints:
  - **Tier 1 (Sanity)**: Verify that hitting `/api/brands` and `/api/products` returns correct JSON structures and status codes.
  - **Tier 2 (Core Flow)**: Send mock craft photos to `/api/brands` and `/api/gemini/ingest` and verify the generated brand configurations.
  - **Tier 3 (Edge Cases & Validations)**: Ensure that missing parameters (like posting without brand ID) result in proper 400/404 errors.
  - **Tier 4 (State & DB Consistency)**: Read `src/data/db.json` before and after API calls to verify that data is written/deleted correctly, and verify cascade deletions.
- **Why**: Since `uv` is installed, these tests run with zero environment overhead and avoid adding unnecessary libraries to the JS build bundle.

### 2. Full-User Flow Interface Testing (Tier 1-5 E2E)
- **Tool**: Playwright configured to run against the host's Firefox binary (`/usr/bin/firefox`) or headless Chromium.
- **Purpose**: Verify frontend accessibility, UI logic, and client-side systems:
  - **Tier 1**: Gateway page rendering and navigation.
  - **Tier 2**: Dragging file input, interacting with dials, sending messages in copilot chat, and checking canvas updates.
  - **Tier 5 (Adversarial)**: Verify that when the Gemini API is offline (or `GEMINI_API_KEY` is not present), the frontend degrades gracefully by entering Simulation Mode and utilizing static mock fallbacks without crashing.
- **Why**: Real browser automation is required to interact with the file input reader, the Web Audio API synthesizer, and the canvas compositor.
