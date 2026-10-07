# @komet/client

React SPA dashboard for university KPI analytics — built with React 19, Vite 8, and TailwindCSS 4.

## Overview

The client application is a single-page dashboard that visualizes key performance indicators for university management. It uses **react-router** (`BrowserRouter` + `Routes` generated from `NAV_ITEMS`), and the view state that matters — active filters and table page — lives in the URL, so any view is reloadable, shareable, and follows Back/Forward.

**Tabs:**

| Route        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| `/`          | Dashboard home with KPI stat cards                                   |
| `/students`  | Active count, intake trend, international students, decline analysis |
| `/graduates` | Total graduates, GPA trend, on-time graduation, study success        |
| `/mbkm`      | Program rate, activities, partners, eligible students                |

## Tech Stack

- **React 19** — UI framework with lazy loading for code-split modules
- **react-router 7** — routing; filters and page number are URL search params
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
│   │   ├── feedback/           Skeleton, EmptyState, ErrorBoundary, QueryErrorBanner
│   │   ├── filters/            FilterContainerShell, FilterField
│   │   ├── modals/             Modal, ModalSummaryBanner, ModalTabNav, ModalTabContent, DetailModalOrchestrator
│   │   ├── tables/             DataTable (paginated)
│   │   └── ui/                 Badge, Button, CheckboxSelect, Input, Select
│   └── layout/                 MainLayout, Sidebar, Navbar, Breadcrumbs
├── modules/                    Feature modules (self-contained)
│   ├── students/               Student analytics (`/` redirects here)
│   ├── graduates/              Graduate analytics
│   └── mbkm/                   MBKM program analytics
├── hooks/                      Shared hooks
├── services/                   API client and query param utilities
├── config/                     Zod-based env validation
├── constants/                  navigation.js (routes + menu + breadcrumb), debounce.js
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
- **View state** — the URL: `useDashboardFilters` encodes each module's filter schema as search params and `usePaginatedList` reads the current page from `?page=`. Changing a filter drops `?page=`, so a new filter set never leaves the table on a stale page.
- **Local state** — Standard React hooks (`useState`, `useReducer`) for component-level state that is not worth sharing (open dropdowns, modal origin rects, animations).

No global state library (Redux, Zustand, etc.) is used.

## Shared Hooks

| Hook                       | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `useSummaryQuery`          | TanStack Query wrapper for dashboard summaries                       |
| `usePaginatedList`         | Paginated fetching; current page lives in `?page=`                   |
| `useDashboardFilters`      | Filter schema ↔ URL query params (deep link, Back/Forward, reset)    |
| `useDebouncedSearchParams` | One request-params object for a page's summary + list + detail modal |
| `useTabTransition`         | Tab switching animation state                                        |
| `useModalOrigin`           | Modal origin rect tracking for open/close animation                  |
| `useDebouncedValue`        | Debounce search inputs                                               |

## API Communication

The custom `apiClient.js` (`src/services/`) provides:

- Base fetch wrapper around the API at `VITE_API_BASE_URL`, timing out at
  `CLIENT_REQUEST_TIMEOUT_MS` — derived from the server's own limit, always shorter
- Automatic **HttpOnly session cookie** management: one shared mint per expiry window,
  so a burst of 401s cannot amplify into a burst of session POSTs
- Auto-retry on **401** only; 4xx from server-side validation is never retried
- In dev, every payload is checked against `@komet/shared/contracts` before use

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
pnpm test       # Vitest (jsdom) — hooks that own URL state
```
