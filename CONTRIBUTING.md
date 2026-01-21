# Contributing to Physician Workforce Research Analyzer

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/research-analyzer.git
   cd research-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your API keys (optional for development).

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## Code Style

### TypeScript

- Use TypeScript for all new code
- No `any` types in public APIs
- Export types from `src/types/` directory
- Use interfaces for object shapes, types for unions/primitives

### React Components

- Use functional components with hooks
- Props interfaces should be exported
- Place components in appropriate subdirectory:
  - `common/` - Reusable UI components
  - `research/` - Research paper related
  - `policy/` - Policy related
  - `visualization/` - Charts, rankings, maps

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (e.g., `useApiKeys.ts`)
- Services: `camelCase.ts` (e.g., `supabase.ts`)
- Types: `kebab-case.types.ts`
- Tests: `ComponentName.test.tsx` or `serviceName.test.ts`

### Imports

```typescript
// 1. External libraries
import { useState, useEffect } from 'react'

// 2. Internal types
import type { Policy, ResearchPaper } from '@/types'

// 3. Internal modules
import { useApiKeys } from '@/hooks'
import { Button } from '@/components/common'

// 4. Styles (if any)
import './styles.css'
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write tests for new functionality
   - Update documentation if needed
   - Follow the code style guidelines

3. **Run checks before committing**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

4. **Commit with a descriptive message**
   ```bash
   git commit -m "feat: add state ranking comparison view"
   ```

   Commit message prefixes:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `refactor:` - Code refactoring
   - `test:` - Tests
   - `chore:` - Maintenance

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**
   - Descriptive title and description
   - All tests passing
   - No TypeScript errors
   - No lint errors
   - Updated documentation (if applicable)

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in `tests/` directory mirroring `src/` structure
- Use descriptive test names
- Test both success and error cases
- Mock external APIs

Example:
```typescript
describe('stateRankingCalculator', () => {
  describe('getWorkforceImpactGrade', () => {
    it('should return A+ for scores >= 90', () => {
      expect(getWorkforceImpactGrade(95).letter).toBe('A+')
    })
  })
})
```

### Coverage Goals

- Services: 80%+
- Hooks: 70%+
- Components: 60%+

## Project Structure

```
research-analyzer/
├── src/
│   ├── components/
│   │   ├── common/          # Button, Modal, LoadingSpinner
│   │   ├── research/        # PdfUploader, CategorySelector
│   │   ├── policy/          # PolicyBrowser, LegiScanImporter
│   │   └── visualization/   # StateRankings, StateFilter
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API and business logic
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Utility functions
├── tests/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── mocks/
└── .github/
    └── ISSUE_TEMPLATE/
```

## Questions?

Feel free to open an issue for questions or discussions about the project.
