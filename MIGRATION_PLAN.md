# Komet Monorepo Migration Plan

## Current State Analysis

### Structure
```
Komet/
  package.json          (root - npm workspaces ["client","server"], concurrently for dev)
  client/               (Vite + React 19, ESM, 101+ source files)
  server/               (Express 5, CommonJS, 60 source files, Prisma, 14 test files)
  graphify-out/         (graph analysis output - ignore)
  requirements/         (gitignored docs)
```

### Key Facts
- Root: npm workspaces + `concurrently` for parallel dev
- Client: Vite 8, React 19, TailwindCSS 4, TanStack Query, Recharts, ESM (`"type":"module"`)
- Server: Express 5, Prisma (MySQL), Redis, Zod, Winston, CommonJS (`"type":"commonjs"`)
- Server already has Zod (v4.6.5) as dependency
- Server already has envValidator.js (basic array-check, not Zod-based)
- Client ESLint: flat config (eslint.config.js), ESLint v10 with react-hooks/react-refresh
- Server ESLint: none
- Prettier: none anywhere
- Husky/lint-staged: none
- Node v26.7.0, npm 11.19.0, pnpm NOT installed
- Tests: vitest 5.0 (server only), no vitest.config file (uses defaults)
- .gitignore: exists at root + client + server, .env already gitignored at all levels

### What Moves Where
| From | To |
|------|-----|
| `client/` | `apps/frontend/` |
| `server/` | `apps/backend/` |
| (new) | `packages/shared/` |

### Shared Package Candidates
- `formatNumber()`, `formatPercentage()` - used by both frontend and backend for display
- Academic year utilities (`getAcademicYear`, `getRollingYears`) - shared concept
- Pagination params type/constants
- HTTP status codes / error message constants

However, since frontend is ESM and backend is CommonJS, the shared package must
use ESM with CJS compatibility (dual exports) OR use a build step.
Decision: Use ESM source with conditional exports in package.json.

### Dependencies to Install (root)
- pnpm (global)
- turbo
- eslint + prettier (root configs)
- husky + lint-staged

### Dependencies to Remove (root)
- concurrently
- package-lock.json (switching to pnpm)

### Import Paths
All imports within client/ and server/ are relative (../*, ./*). Moving them into
apps/frontend/ and apps/backend/ preserves all internal relative paths - no breakage.
The only paths that change are in root package.json scripts and any CI references.

## Execution Order
1. Install pnpm globally
2. Git commit current state (safety checkpoint)
3. Create apps/ and packages/ dirs, move client -> apps/frontend, server -> apps/backend
4. Create pnpm-workspace.yaml, update all package.json names
5. pnpm install from root
6. Setup turbo.json, update root scripts
7. Create packages/shared with common utilities
8. Setup root ESLint + Prettier configs
9. Setup Husky + lint-staged
10. Upgrade envValidator to Zod, add frontend env validation
11. Final build + dev verification
