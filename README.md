# Physician Workforce Research Analyzer

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript React application for analyzing healthcare workforce research and connecting findings to policy outcomes. Built for researchers, policymakers, and healthcare analysts studying physician workforce issues.

## Features

- **PDF Research Paper Analysis** - Upload PDFs and extract text with AI-powered analysis
- **LegiScan Integration** - Import real legislation from all 50 US states
- **Policy-Research Connections** - Create evidence-based links with strength ratings
- **State Workforce Rankings** - Multi-dimensional scoring algorithm with A+ to F grades
- **20 Research Categories** - Categorize papers across healthcare workforce domains

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/research-analyzer.git
cd research-analyzer

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_OPENAI_API_KEY` | Yes | OpenAI API key for AI analysis |
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `VITE_LEGISCAN_API_KEY` | No | LegiScan API for legislation data |

## Project Structure

```
src/
├── components/
│   ├── common/         # Button, Modal, LoadingSpinner, etc.
│   ├── research/       # PdfUploader, CategorySelector, ResearchPaperCard
│   ├── policy/         # PolicyBrowser, LegiScanImporter, ConnectionRating
│   └── visualization/  # StateRankings, StateFilter
├── hooks/              # useApiKeys, usePolicies, useLegiScan, etc.
├── services/           # supabase, openai, legiscan, pdfProcessor
├── types/              # TypeScript interfaces
└── utils/              # Utility functions
```

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript compiler check
npm test           # Run tests
npm run test:coverage  # Run tests with coverage
```

## State Ranking Algorithm

The state workforce ranking system uses a multi-dimensional scoring algorithm:

- **Policy Impact Score** (35% weight) - Based on connection type and strength
- **Evidence Quality** (15% weight) - Strong/moderate/weak evidence breakdown
- **Population Impact** (10% weight) - Estimated population affected
- **Baseline Workforce** (40% weight) - Historical workforce data

Grades range from A+ (90+) to F (<40) with color-coded display.

## Database Schema

### Tables

- `policies` - Legislation and policy documents
- `research_papers` - Uploaded research papers with metadata
- `policy_research_connections` - Links between papers and policies
- `state_baseline_workforce` - Baseline workforce data by state

## API Integrations

### OpenAI

Used for:
- Research paper analysis and outcome extraction
- Policy-research connection suggestions

### LegiScan

Used for:
- Searching legislation by state and keywords
- Importing bill metadata and status

### Supabase

Used for:
- Persistent data storage
- Real-time updates

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/services/stateRankingCalculator.test.ts
```

## Research Categories

The application supports 20 physician workforce research categories:

1. Healthcare Workforce
2. Rural Health
3. Primary Care
4. Specialty Care
5. Mental Health
6. Public Health
7. Health Policy
8. Medical Education
9. Telemedicine
10. Healthcare Access
11. Healthcare Quality
12. Healthcare Economics
13. Physician Burnout
14. Healthcare Delivery
15. Population Health
16. Health Disparities
17. Preventive Care
18. Chronic Disease Management
19. Emergency Medicine
20. Pediatric Healthcare

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- PDF processing with [PDF.js](https://mozilla.github.io/pdf.js/)
- Database powered by [Supabase](https://supabase.com/)
- Legislation data from [LegiScan](https://legiscan.com/)
