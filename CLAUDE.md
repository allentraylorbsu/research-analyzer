# CLAUDE.md — Physician Workforce Research Analyzer

Context for Claude Code working in this repo. Written 2026-09-02 after a full
audit of the working tree (build, typecheck, lint, tests, and a live browser
run all executed against this exact code).

## What this app is

A single-page React/TypeScript app for healthcare workforce policy research. The
user uploads or imports research papers, imports or discovers state legislation,
manually links papers to policies with a strength/evidence rating, and the app
computes a 0–100 "workforce impact score" and A+–F grade per state from those
links plus real Medicaid reimbursement data.

It is a **local research tool**, not a hosted product: all API keys are entered
in the browser, stored in `localStorage`, and called directly from the client.

## Verified status (2026-09-02)

Run against the working tree as it stands, in a clean `npm ci` environment:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | passes, 0 errors |
| `npm run build` | passes (149 modules, ~4.5s) |
| `npx vitest run` | 75/75 tests pass across 5 files |
| `npx eslint .` | 6 errors, **all** in generated `vite.config.js` (`__dirname` no-undef) — no source errors |
| `npm run dev` + browser | renders fully, zero console errors, "Load Demo Data" → rankings works end to end |

**The code is healthy.** Do not go looking for a build break; there isn't one.

## Critical: uncommitted work in the tree

`git log` ends at **Jan 21, 2026** — `Add Policy Discovery with Open States,
NewsAPI, and GDELT integration`.

Ten files were then modified on **Feb 5, 2026 and never committed**. They form
one complete, working feature — Medicaid reimbursement as a scoring input, plus
a research-justification system for the weights:

- `src/data/medicaidReimbursement.ts` *(new file)*
- `src/components/visualization/ScoringJustificationPanel.tsx` *(new file)*
- `src/components/visualization/StateRankings.tsx` (weight sliders added)
- `src/components/visualization/index.ts`
- `src/services/stateRankingCalculator.ts` (weights are now a parameter)
- `src/services/index.ts`
- `src/hooks/useStateRankings.ts` (recalculates on weight change)
- `src/types/state.types.ts` (`ScoringWeights`, `ScoringFactor`, `ScoringJustification`)
- `src/types/index.ts`
- `src/App.tsx` (wires in both new panels)

**Commit this before making any other change.** It is seven months of
unprotected work and it builds, typechecks, and passes tests.

## Stack

React 19 · TypeScript 5.4 (strict, `noUnusedLocals`, `isolatedModules`) ·
Vite 7 · Tailwind 3.4 · Supabase JS 2 · pdfjs-dist 4 · Vitest 2 + Testing
Library + MSW.

Path alias `@/*` → `src/*`, declared in **both** `tsconfig.json` and
`vite.config.ts`. If you add an alias, add it in both places.

## Layout

```
src/
├── App.tsx                    # 962-line monolith — see "Known rough edges"
├── components/
│   ├── common/                # Button, Modal, CollapsibleSection, StatusMessage,
│   │                          #   LoadingSpinner, ErrorBoundary
│   ├── research/              # PdfUploader, CategorySelector, ResearchPaperCard,
│   │                          #   PubMedImporter, DuplicateDetector
│   ├── policy/                # PolicyBrowser, LegiScanImporter,
│   │                          #   PolicyConnectionRating, PolicyDiscovery (38KB)
│   └── visualization/         # StateRankings, StateFilter, ScoringJustificationPanel
├── hooks/                     # useApiKeys, usePolicies, useResearchPapers,
│                              #   useConnections, useLegiScan, usePubMed,
│                              #   useStateFilter, useStateRankings
├── services/                  # supabase, openai, legiscan, pubmed, openstates,
│                              #   newsapi, gdelt, pdfProcessor,
│                              #   stateRankingCalculator
├── data/medicaidReimbursement.ts   # static KFF 2024 fee-index table
└── types/                     # api / research / policy / connection / state
```

Every folder has an `index.ts` barrel and everything re-exports through it.
**When you add a module, add it to the barrel** — that is the established
convention and imports assume it.

## The scoring algorithm

`src/services/stateRankingCalculator.ts` is the heart of the app. Current
weights (`DEFAULT_SCORING_WEIGHTS`), which sum to 1.00:

| Factor | Weight |
|---|---|
| Baseline workforce | 0.30 |
| Policy connections | 0.30 |
| Evidence quality | 0.15 |
| Medicaid reimbursement | 0.15 |
| Population impact | 0.10 |

Weights are user-adjustable at runtime via sliders in `StateRankings`;
`useStateRankings` caches the raw fetched data and recalculates locally when
they change (no refetch). The README's old 35/15/10/40 split is obsolete.

Medicaid scoring lives in `src/data/medicaidReimbursement.ts`: a state's
Medicaid-to-Medicare fee ratio (KFF 2024, national avg 0.75) is mapped to 0–100
by `ratioToScore`, anchored on the CMS 80%-of-Medicare target. Tennessee has no
published data and defaults to 50. State lookups compare case-insensitively, so
`'CALIFORNIA'` and `'California'` both resolve — keep that if you refactor,
because connection records use uppercase state names while the fee table uses
title case.

## Data model (Supabase)

Four tables: `policies`, `research_papers`, `policy_research_connections`,
`state_baseline_workforce`. Schema is in `supabase-schema.sql`.

Supabase is **optional**. Without it the app still renders and the rankings
demo path works (`useStateRankings().useMockData()`), but nothing persists and
"Calculate from Data" sets the error `Database not configured`.

## External APIs

| Service | Env var | Required | Notes |
|---|---|---|---|
| OpenAI | `VITE_OPENAI_API_KEY` | for AI features | hardcoded `gpt-4-turbo-preview` in 3 places in `services/openai.ts` — **stale, see below** |
| Supabase | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | optional | persistence |
| LegiScan | `VITE_LEGISCAN_API_KEY` | optional | legislation import |
| Open States | `VITE_OPENSTATES_API_KEY` | optional | policy discovery |
| NewsAPI | `VITE_NEWSAPI_KEY` | optional | recent news discovery |
| GDELT | none | — | free, no key, historical news |
| PubMed | none | — | free NCBI E-utilities |

Env vars only *prefill* the key fields; `useApiKeys` persists whatever is in the
form to `localStorage` under `research-analyzer-api-keys`.

`services/legiscan.ts` falls back through three public CORS proxies when the
direct call is blocked. Those proxies are third-party and unreliable — if
LegiScan import fails, suspect them first.

## Known rough edges

These are real and worth fixing; none of them break the build.

1. **`App.tsx` is a 962-line monolith** holding 25 `useState` calls and every
   handler. This is the main refactor target: split into section components and
   lift the paper/policy/connection flow into a context or a reducer.
2. **`PolicyDiscovery.tsx` is 38KB** in one file, wrapping three separate APIs
   (Open States, NewsAPI, GDELT). Should be one component per source.
3. **`handleSaveApiKeys` silently drops two keys.** It builds `ApiKeys` with
   only openai/supabase/legiscan, so Open States and NewsAPI keys never reach
   `useApiKeys` or `localStorage` — they live in `App.tsx` local state and are
   passed straight to `PolicyDiscovery` as props. They therefore do not survive
   a page reload unless set via `.env`. `ApiKeys` in `types/api.types.ts` needs
   the two extra fields.
4. **`gpt-4-turbo-preview` is a stale model id.** Hardcoded three times. Move it
   to one constant and move to a current model.
5. **API keys sit in `localStorage` in plaintext** and all API calls go direct
   from the browser. Fine for a local research tool; not acceptable if this ever
   gets hosted or handed to someone who'll put a real key in it. A server-side
   proxy is the fix.
6. **`generateMockStateRankings` produces a dull demo.** Random policy score is
   40–79, so blended results top out around B+ and cluster in C/D. Widen the
   range if the demo should show the full A+–F scale.
7. **ESLint lints generated output.** `vite.config.js`/`vite.config.d.ts` are
   emitted by `tsc -b`; add them to the ESLint ignore list and `.gitignore`.
8. **Baseline-only rankings skip the new fields.** `createBaselineOnlyRanking`
   omits the Medicaid and confidence metrics that
   `calculateStateRankingFromScore` sets, so states with baseline data but no
   connections render a thinner detail card.
9. **Test coverage is thin** — 5 files. `stateRankingCalculator` is well covered;
   the newer services (pubmed, openstates, newsapi, gdelt) have no tests at all.
10. **There is no `LICENSE` file.** The README carries an MIT badge and links to
    `LICENSE`, but the file doesn't exist — the link is dead and the license is
    unstated. Add the MIT text before anyone else uses the repo.

## Commands

```bash
npm install
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm test             # vitest (watch)
npm run test:run     # vitest run (CI)
npm run test:coverage
```

## Conventions

- Functional components with named exports, plus a `default` export at the file
  foot; props interface exported as `<Name>Props`.
- Hooks return one object with an explicit `Use<Name>Return` interface.
- Services are plain async functions, not classes; they throw, and the calling
  hook catches and sets an `error` string.
- Types are `import type { … } from '@/types'` — always from the barrel, never
  from a leaf type file.
- Tailwind utility classes inline; no CSS modules. `App.css` and `index.css`
  hold only the gradient/base layers.
- 2-space indent, single quotes, no semicolons in `src/services` and `src/hooks`;
  `src/types` uses semicolons. Match the file you're in.
