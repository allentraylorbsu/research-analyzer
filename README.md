# Physician Workforce Research Analyzer

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An AI-powered tool that automates research analysis — upload PDFs, extract
findings via LLM, and synthesize evidence across studies. Built to explore how
state health policies impact the physician workforce.

https://github.com/user-attachments/assets/ea05ec39-022d-4228-ab98-65ddf3477cdc

## Why I built this

After the Dobbs decision, I became curious about how state health policies were
affecting physician career decisions. Manually analyzing hundreds of research
papers would take months. So I built a tool to automate it — upload PDFs,
extract key findings using OpenAI's API, and connect research to real-world
policy outcomes.

The core idea: gather peer-reviewed research and state legislation, link them to
each other with an explicit strength and evidence rating, and turn those links —
plus real Medicaid reimbursement data — into a comparable 0–100 workforce impact
score and letter grade for each state. Every weight in that score is adjustable,
and every weight can be justified by citing the papers behind it.

Built for researchers, policymakers, and healthcare analysts studying physician
workforce issues.

## Features

**Research collection**

- **PDF analysis** — upload a paper, extract text with PDF.js, and get an
  AI-generated summary, key findings, health outcomes, study-quality estimate,
  and policy implications
- **PubMed search and import** — query NCBI E-utilities directly, with
  suggested workforce searches and PMID-based duplicate detection
- **20 research categories** across healthcare workforce domains

**Policy collection**

- **LegiScan import** — legislation from all 50 states by state and keyword
- **Policy Discovery** — a combined search across three more sources:
  - *Open States* for state legislation
  - *NewsAPI* for recent policy news
  - *GDELT* for up to five years of historical news, free and keyless
  - with source filtering for trusted outlets (KFF, Health Affairs, and others)

**Analysis**

- **Policy–research connections** with strength, evidence-quality, and
  workforce-relevance ratings, and a positive/negative/mixed/neutral direction
- **AI connection suggestions** — given a paper, rank the policies in your
  library that are most likely related, with reasoning and keyword overlap
- **State workforce rankings** — multi-factor 0–100 score with A+ to F grades,
  confidence levels, uncertainty ranges, and data-quality flags
- **Adjustable scoring weights** — live sliders for every factor, with the
  rankings recalculating locally as you move them
- **Research justifications** — link an uploaded paper to a specific scoring
  factor to document *why* a weight is set where it is

## Quick Start

```bash
git clone https://github.com/allentraylorbsu/research-analyzer.git
cd research-analyzer

npm install

cp .env.example .env
# Edit .env with your API keys — or skip this and enter them in the UI

npm run dev
```

The app runs with **no keys at all** — open the "State Workforce Rankings"
section and click **Load Demo Data** to see the ranking system against generated
data. Add keys to enable the live features.

## Environment Variables

Every key is optional at startup; each one unlocks specific features. Keys set
here prefill the in-app API Configuration form, which persists them to
`localStorage`.

| Variable | Unlocks | Get one |
|----------|---------|---------|
| `VITE_OPENAI_API_KEY` | Paper analysis, AI connection suggestions | [platform.openai.com](https://platform.openai.com/api-keys) |
| `VITE_SUPABASE_URL` | Persistent storage | [supabase.com](https://supabase.com/dashboard) |
| `VITE_SUPABASE_ANON_KEY` | Persistent storage | same project |
| `VITE_LEGISCAN_API_KEY` | LegiScan legislation import | [legiscan.com](https://legiscan.com/legiscan) |
| `VITE_OPENSTATES_API_KEY` | Open States policy discovery | [openstates.org](https://openstates.org/accounts/login/) (free) |
| `VITE_NEWSAPI_KEY` | Recent policy news | [newsapi.org](https://newsapi.org/register) (free tier: 100 req/day) |

PubMed and GDELT need no key.

> **Note:** this is a client-side research tool. Keys are stored in the browser's
> `localStorage` and API calls are made directly from the browser. Don't deploy
> it publicly with production keys — that would need a server-side proxy.

## Project Structure

```
src/
├── App.tsx                    # Main application shell
├── components/
│   ├── common/                # Button, Modal, CollapsibleSection, StatusMessage,
│   │                          #   LoadingSpinner, ErrorBoundary
│   ├── research/              # PdfUploader, CategorySelector, ResearchPaperCard,
│   │                          #   PubMedImporter, DuplicateDetector
│   ├── policy/                # PolicyBrowser, LegiScanImporter,
│   │                          #   PolicyConnectionRating, PolicyDiscovery
│   └── visualization/         # StateRankings, StateFilter, ScoringJustificationPanel
├── hooks/                     # useApiKeys, usePolicies, useResearchPapers,
│                              #   useConnections, useLegiScan, usePubMed,
│                              #   useStateFilter, useStateRankings
├── services/                  # supabase, openai, legiscan, pubmed, openstates,
│                              #   newsapi, gdelt, pdfProcessor,
│                              #   stateRankingCalculator
├── data/                      # Static reference data (Medicaid fee index)
└── types/                     # TypeScript interfaces
```

## Available Scripts

```bash
npm run dev            # Start development server
npm run build          # Type-check and build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm run typecheck      # Run TypeScript compiler check
npm test               # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Run tests with coverage
```

## State Ranking Algorithm

Each state gets a 0–100 workforce impact score from five weighted factors.
These are the defaults; all five are adjustable at runtime.

| Factor | Default weight | Source |
|--------|---------------:|--------|
| Baseline workforce | 30% | HRSA/KFF physician density and workforce metrics |
| Policy connections | 30% | Strength and direction of your policy–research links |
| Evidence quality | 15% | Research methodology and evidence strength |
| Medicaid reimbursement | 15% | KFF Medicaid-to-Medicare fee index (2024) |
| Population impact | 10% | Estimated population affected by policies |

Grades run from A+ (90+) down to F (below 40), color-coded, with a full scale
legend in the UI.

The score also carries **confidence metadata**: a confidence percentage based on
how many data points a state has, an uncertainty range that widens when data is
thin, and a data-quality flag (`INSUFFICIENT_DATA` / `LIMITED_DATA` /
`RELIABLE_DATA`). States with fewer than three data points are flagged rather
than silently ranked.

### Medicaid reimbursement scoring

`src/data/medicaidReimbursement.ts` holds the KFF 2024 Medicaid-to-Medicare fee
index for all 50 states plus DC — the ratio of what a state's Medicaid pays a
physician versus what Medicare pays in that state. The national average is 0.75;
a ratio of 1.0 is parity.

Ratios map to a 0–100 score anchored on the CMS target of 80% of Medicare:

| Ratio | Score |
|-------|-------|
| ≥ 1.00 (parity or better) | 80–100 |
| 0.80–0.99 (at CMS target) | 60–79 |
| 0.65–0.79 | 40–59 |
| 0.50–0.64 | 20–39 |
| < 0.50 | 0–19 |

Tennessee does not publish comparable data and scores a neutral 50.

Source: [KFF State Health Facts, Medicaid-to-Medicare Fee Index](https://www.kff.org/medicaid/state-indicator/medicaid-to-medicare-fee-index/)

## Database Schema

Supabase is optional — the app runs and demos without it, but nothing persists.
Schema in [`supabase-schema.sql`](supabase-schema.sql).

| Table | Holds |
|-------|-------|
| `policies` | Legislation and policy documents |
| `research_papers` | Imported and uploaded papers with metadata |
| `policy_research_connections` | Rated links between papers and policies |
| `state_baseline_workforce` | Baseline workforce data by state |

## API Integrations

| Service | Key required | Used for |
|---------|:------------:|----------|
| **OpenAI** | yes | Paper analysis, outcome extraction, connection suggestions |
| **PubMed** (NCBI E-utilities) | no | Searching and importing peer-reviewed research |
| **LegiScan** | yes | Legislation search and bill metadata, all 50 states |
| **Open States** | yes | State legislation discovery |
| **NewsAPI** | yes | Recent policy news |
| **GDELT** | no | Historical policy news, up to 5 years |
| **Supabase** | optional | Persistent storage |

## Testing

```bash
npm run test:run                                       # all tests, once
npm test                                               # watch mode
npm run test:coverage                                  # with coverage
npx vitest run tests/services/stateRankingCalculator.test.ts   # one file
```

Tests use Vitest with Testing Library and MSW for HTTP mocking. Current
coverage centers on the ranking calculator, the LegiScan service, and two
components; the newer discovery services are not yet covered.

## Research Categories

Healthcare Workforce · Rural Health · Primary Care · Specialty Care ·
Mental Health · Public Health · Health Policy · Medical Education ·
Telemedicine · Healthcare Access · Healthcare Quality · Healthcare Economics ·
Physician Burnout · Healthcare Delivery · Population Health ·
Health Disparities · Preventive Care · Chronic Disease Management ·
Emergency Medicine · Pediatric Healthcare

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.
[CLAUDE.md](CLAUDE.md) documents the architecture, conventions, and known rough
edges for anyone — human or AI — picking up the codebase.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- PDF processing with [PDF.js](https://mozilla.github.io/pdf.js/)
- Database powered by [Supabase](https://supabase.com/)
- Legislation data from [LegiScan](https://legiscan.com/) and [Open States](https://openstates.org/)
- Research from [PubMed](https://pubmed.ncbi.nlm.nih.gov/)
- News data from [NewsAPI](https://newsapi.org/) and [GDELT](https://www.gdeltproject.org/)
- Reimbursement data from [KFF State Health Facts](https://www.kff.org/)
