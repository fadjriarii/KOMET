# @komet/client

React SPA dashboard for university KPI analytics — built with React 19, Vite 8, and TailwindCSS 4.

## Overview

The client application is a single-page dashboard that visualizes key performance indicators for university management. It uses **context-based tab navigation** (no traditional routing via react-router) powered by `NavigationContext`.

**Tabs:**

| Tab                  | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| Overview             | Dashboard home with KPI stat cards                                   |
| Mahasiswa (Students) | Active count, intake trend, international students, decline analysis |
| Lulusan (Graduates)  | Total graduates, GPA trend, on-time graduation, study success        |
| MBKM                 | Program rate, activities, partners, eligible students                |

## Tech Stack

- **React 19** — UI framework with lazy loading for code-split modules
- **Vite 8** — Build tool and dev server
- **TailwindCSS 4** — Utility-first styling
- **TanStack Query 5** — Server state management (no Redux/Zustand)
- **Recharts 3** — Chart components
- **Lucide React** — Icon library
- **Zod 4** — Environment variable validation at startup

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── common/                 Reusable UI primitives
│   │   ├── cards/              ChartCard, StatCard, FilterContainerCard, MetricSummaryGrid
│   │   ├── charts/             DistributionBarChart, TrendBarChart, TrendChartTooltip
│   │   ├── feedback/           Skeleton, EmptyState, ErrorBoundary, LoadingSpinner
│   │   ├── filters/            FilterContainerShell, FilterField
│   │   ├── modals/             Modal, ModalSummaryBanner, ModalTabNav, ModalTabContent, DetailModalOrchestrator
│   │   ├── tables/             DataTable (paginated)
│   │   └── ui/                 Badge, Button, CheckboxSelect, Input, Select
│   └── layout/                 MainLayout, Sidebar, Navbar, Breadcrumbs
├── modules/                    Feature modules (self-contained)
│   ├── overview/               Dashboard overview with KPI stat cards
│   ├── students/               Student analytics
│   ├── graduates/              Graduate analytics
│   └── mbkm/                   MBKM program analytics
├── hooks/                      Shared hooks
├── services/                   API client and query param utilities
├── config/                     Zod-based env validation
├── context/                    NavigationContext (tab-based navigation state)
├── constants/                  NAV_ITEMS, debounce values
└── utils/                      uiHelpers.js, theme.js
```

### Module Pattern

Each feature module under `src/modules/` is self-contained with its own subdirectories:

```
modules/<feature>/
├── pages/          Page-level components
├── components/     Module-specific UI components
├── hooks/          Module-specific data hooks
├── services/       API service functions
└── utils/          Module-specific helpers
```

## State Management

- **Server state** — TanStack Query 5 handles all API data fetching, caching, and synchronization.
- **Navigation state** — React Context API via `NavigationContext` manages tab-based navigation.
- **Local state** — Standard React hooks (`useState`, `useReducer`) for component-level state.

No global state library (Redux, Zustand, etc.) is used.

## Shared Hooks

| Hook                  | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `useSummaryQuery`     | TanStack Query wrapper for dashboard summaries      |
| `usePaginatedList`    | Paginated data fetching with query params           |
| `useDashboardFilters` | Filter state management for dashboard views         |
| `useTabTransition`    | Tab switching animation state                       |
| `useModalOrigin`      | Modal origin rect tracking for open/close animation |
| `useDebouncedValue`   | Debounce search inputs                              |

## API Communication

The custom `apiClient.js` (`src/services/`) provides:

- Base fetch wrapper around the API at `VITE_API_BASE_URL`
- Automatic **HttpOnly session cookie** management
- Auto-retry on **401** responses (session expiry)

Query parameter serialization is handled by `queryParams.js`.

## Environment Variables

| Variable            | Required | Description          |
| ------------------- | -------- | -------------------- |
| `VITE_API_BASE_URL` | Yes      | Backend API base URL |

Variables are validated at startup using Zod (`src/config/envValidator.js`). The app will fail fast with a descriptive error if validation fails.

```bash
cp .env.example .env
# Edit .env with your API URL
```

## Scripts

```bash
pnpm dev        # Start Vite dev server
pnpm build      # Production build
pnpm preview    # Preview production build locally
pnpm lint       # Run linter
```
