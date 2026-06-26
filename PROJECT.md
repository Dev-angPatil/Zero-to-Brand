# Project: Zero-to-Brand

## Architecture
- **Frontend**: Next.js 16 App Router (Tailwind CSS v4).
- **Backend**: API Routes (Next.js serverless functions) calling Gemini 2.5 Flash and Imagen 3.0 via `@google/genai`.
- **Database**: Local JSON file-based database (`src/data/db.json`) managed by a custom client (`src/data/dbClient.ts`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite Setup | Build E2E test infra and test cases (Tiers 1-4) in a test runner | None | PLANNED |
| 2 | Brand Onboarding Survey Expansion (R1) | Expand survey (brand owner, target audience, preferred design styles) and persist preferences in JSON database | None | PLANNED |
| 3 | Image Questionnaire & Modular Agents Backend (R2) | Add follow-up questionnaire on upload and implement the three modular under-the-hood agents (Preferences, Prompt Engineering, Designer) | M2 | PLANNED |
| 4 | Dashboard UI & Canvas Poster Compositor (R3) | Build workspace showing craft, studio, and composite poster. Implement frontend canvas poster composition, saving, and downloading | M3 | PLANNED |
| 5 | Integrated E2E Verification & Review | Pass 100% of the E2E test suite and run adversarial coverage hardening (Tier 5) | M1, M4 | PLANNED |

## Interface Contracts
### Brands API (`/api/brands`)
- **GET**: Retrieves a specific brand or list of all brands.
- **POST**: Creates a draft brand from a craft image.
- **PUT**: Updates brand variables, chat history, or onboarding config (owner, audience, dials, design styles).
- **DELETE**: Removes a brand.

### Products API (`/api/products`)
- **GET**: Retrieves all products associated with a brand.
- **POST**: Takes brandId, rawImage, and image-specific questionnaire answers (desired scene, marketing style, keywords). Returns created product.
- **PUT**: Updates product details, aspect ratio, style preset, or regenerates banner using feedback.
- **DELETE**: Removes a product.

### Chat API (`/api/gemini/chat`)
- **POST**: Handles chat conversation between user and Brand Co-pilot.

### Ingest API (`/api/gemini/ingest`)
- **POST**: Performs initial Gemini analysis of a brand's craft photo.

### Finalize API (`/api/gemini/finalize`)
- **POST**: Runs Imagen 3 to generate brand logo and initial banner, completes brand onboarding.

## Code Layout
- `src/app/` - Next.js page components and API routes
- `src/lib/` - Shared services, Gemini utility, and modular agent implementations
- `src/data/` - Database client and JSON database
- `tests/` - E2E and unit test suite
