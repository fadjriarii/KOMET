# @komet/server

Express 5 REST API backend for **KOMET** — a university analytics platform. Serves aggregated statistical data (students, graduates, MBKM) to a React frontend. Data is sourced from the [SEVIMA SIS](https://api.sevima.com/) (Student Information System) API and synced into a local MySQL database via Prisma.

## Tech Stack

| Layer                 | Technology                           |
| --------------------- | ------------------------------------ |
| Runtime               | Node.js (CommonJS)                   |
| Framework             | Express 5                            |
| ORM                   | Prisma 6 (MySQL)                     |
| Cache / Rate Limiting | Redis (optional — graceful fallback) |
| Validation            | Zod 4 (request & environment)        |
| Logging               | Winston                              |
| Testing               | Vitest 5                             |
| Dev Server            | Nodemon                              |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm
- MySQL database
- Redis (optional)
- SEVIMA SIS API credentials

### Installation

```bash
# From the monorepo root
pnpm install

# Generate Prisma client
pnpm --filter @komet/server db:generate

# Apply database migrations
pnpm --filter @komet/server db:migrate
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable            | Required | Default       | Description                                            |
| ------------------- | -------- | ------------- | ------------------------------------------------------ |
| `DATABASE_URL`      | ✅       | —             | MySQL connection string                                |
| `SEVIMA_APP_KEY`    | ✅       | —             | SEVIMA SIS API app key                                 |
| `SEVIMA_SECRET_KEY` | ✅       | —             | SEVIMA SIS API secret key                              |
| `SYNC_API_KEY`      | ✅       | —             | API key for sync endpoint authentication               |
| `SESSION_SECRET`    | ✅       | —             | Secret for HttpOnly cookie sessions                    |
| `PORT`              | —        | `3000`        | Server port                                            |
| `NODE_ENV`          | —        | `development` | Environment (`development` / `production`)             |
| `SLOW_QUERY_MS`     | —        | `500`         | Prisma slow-query log threshold (ms)                   |
| `ALLOWED_ORIGINS`   | —        | —             | CORS allowed origins                                   |
| `TRUST_PROXY`       | —        | `false`       | Trust proxy headers                                    |
| `REDIS_URL`         | —        | —             | Redis connection URL (enables caching & rate limiting) |

> **Fail-fast validation** — All environment variables are validated at startup by Zod (`src/config/envValidator.js`). The server will **not** start if required variables are missing or malformed.

### Running

```bash
# Development (with hot reload)
pnpm dev

# Production
pnpm start
```

## Project Structure

```
src/
├── config/
│   ├── envValidator.js       # Zod-based env validation (fail-fast on startup)
│   ├── prisma.js             # Prisma client singleton with slow-query logging
│   ├── redis.js              # Redis client (optional, graceful fallback)
│   └── sevimaApi.js          # SEVIMA SIS API client (axios)
├── controllers/
│   ├── studentsController.js # Active students, intake, international, decline handlers
│   ├── graduatesController.js# Graduates, GPA, on-time, study success handlers
│   ├── mbkmController.js     # MBKM rate, activities, distribution handlers
│   ├── syncController.js     # Sync orchestrator
│   └── sync/                 # Individual sync modules (students, graduates, mbkm)
├── middlewares/
│   ├── auth.js               # API key authentication (sync endpoints)
│   ├── rateLimiter.js        # Rate limiting (Redis-backed when available)
│   ├── studentSession.js     # HttpOnly cookie session for dashboard access
│   ├── syncGuard.js          # Prevents concurrent sync operations
│   └── validator.js          # Request sanitization (XSS, injection protection)
├── routes/
│   ├── studentsRoutes.js     # /api/students/*
│   ├── graduatesRoutes.js    # /api/graduates/*
│   ├── mbkmRoutes.js         # /api/mbkm/*
│   └── syncRoutes.js         # /api/sync/*
├── services/
│   ├── students/             # filterBuilder, studentList, intakeTrend, internationalTrend,
│   │                         # declineTrend, activeStudents, filterOptions
│   ├── graduates/            # filterBuilder, graduateList, ipkTrend, keberhasilanStudi,
│   │                         # tepatWaktu, totalLulusan, graduateDistribution, filterOptions
│   ├── mbkm/                 # filterBuilder, mbkmList, mbkmRate, mbkmActivities,
│   │                         # mbkmEligible, mbkmMitra, filterOptions
│   └── shared/               # filterUtils (common filter helpers)
├── utils/
│   ├── logger.js             # Winston logger (dev console + prod JSON)
│   ├── errorHandler.js       # Centralized error response
│   ├── academicUtils.js      # Academic year calculations
│   ├── trendCalculation.js   # Percentage change, trend analysis
│   ├── paginationUtils.js    # Pagination param normalization
│   └── formatUtils.js        # Number formatting (id-ID locale)
└── server.js                 # Entry point (Express app setup, middleware chain)
```

## API Endpoints

### Session

| Method   | Endpoint               | Description                    |
| -------- | ---------------------- | ------------------------------ |
| `POST`   | `/api/session/student` | Issue dashboard session cookie |
| `DELETE` | `/api/session/student` | Revoke session                 |

### Students

| Method | Endpoint                             | Description                 |
| ------ | ------------------------------------ | --------------------------- |
| `GET`  | `/api/students/summary`              | Student KPI summary         |
| `GET`  | `/api/students/filter-options`       | Available filter values     |
| `GET`  | `/api/students/active-students`      | Active student details      |
| `GET`  | `/api/students/international-detail` | International student trend |
| `GET`  | `/api/students/intake-trend`         | Intake trend details        |
| `GET`  | `/api/students/decline-trend`        | Decline trend details       |
| `GET`  | `/api/students/students`             | Paginated student list      |

### Graduates

| Method | Endpoint                            | Description               |
| ------ | ----------------------------------- | ------------------------- |
| `GET`  | `/api/graduates/summary`            | Graduate KPI summary      |
| `GET`  | `/api/graduates/total-lulusan`      | Total graduates detail    |
| `GET`  | `/api/graduates/ipk-trend`          | GPA trend detail          |
| `GET`  | `/api/graduates/tepat-waktu`        | On-time graduation detail |
| `GET`  | `/api/graduates/keberhasilan-studi` | Study success detail      |
| `GET`  | `/api/graduates/distribution`       | Graduate distribution     |
| `GET`  | `/api/graduates/list`               | Paginated graduate list   |

### MBKM

| Method | Endpoint                                    | Description                |
| ------ | ------------------------------------------- | -------------------------- |
| `GET`  | `/api/mbkm/summary`                         | MBKM KPI summary           |
| `GET`  | `/api/mbkm/distribution`                    | MBKM distribution          |
| `GET`  | `/api/mbkm/list`                            | Paginated MBKM list        |
| `GET`  | `/api/mbkm/analytics/rate`                  | MBKM participation rate    |
| `GET`  | `/api/mbkm/analytics/activity-distribution` | Activity type distribution |
| `GET`  | `/api/mbkm/analytics/prodi-distribution`    | Program study distribution |
| `GET`  | `/api/mbkm/analytics/status-distribution`   | Status distribution        |
| `GET`  | `/api/mbkm/analytics/eligible-students`     | Eligible students          |
| `GET`  | `/api/mbkm/analytics/mitra-distribution`    | Partner distribution       |

### Sync (API key required)

| Method | Endpoint                     | Description                   |
| ------ | ---------------------------- | ----------------------------- |
| `POST` | `/api/sync/students`         | Sync student data from SEVIMA |
| `POST` | `/api/sync/graduates`        | Sync graduate data            |
| `POST` | `/api/sync/mbkm`             | Sync MBKM data                |
| `POST` | `/api/sync/all`              | Sync all data                 |
| `GET`  | `/api/sync/status`           | Current sync status           |
| `GET`  | `/api/sync/check-connection` | SEVIMA API connectivity check |

## Database Schema

Three Prisma models backed by MySQL:

### Student

| Column            | Type        | Description        |
| ----------------- | ----------- | ------------------ |
| `nim`             | String (PK) | Student ID number  |
| `nama`            | String      | Full name          |
| `jenjang`         | String      | Education level    |
| `periodeMasuk`    | String      | Enrollment period  |
| `periodeTerakhir` | String      | Last active period |
| `angkatan`        | String      | Cohort year        |
| `periode`         | String      | Period             |
| `programStudi`    | String      | Study program      |
| `fakultas`        | String      | Faculty            |
| `statusKeaktifan` | String      | Active status      |
| `semester`        | Int         | Current semester   |
| `kewarganegaraan` | String      | Nationality        |
| `nik`             | String      | National ID        |
| `tanggalLahir`    | DateTime    | Date of birth      |

### Graduate

| Column            | Type                  | Description                |
| ----------------- | --------------------- | -------------------------- |
| `id`              | Int (PK)              | Auto-increment ID          |
| `nim`             | String (FK → Student) | Student ID reference       |
| `jenjang`         | String                | Education level            |
| `statusKelulusan` | String                | Graduation status          |
| `tahunLulus`      | String                | Graduation year            |
| `periodeWisuda`   | String                | Graduation ceremony period |
| `ipk`             | Float                 | Cumulative GPA             |
| `sksLulus`        | Int                   | Total credits completed    |

### MbkmActivity

| Column            | Type                  | Description          |
| ----------------- | --------------------- | -------------------- |
| `id`              | Int (PK)              | Auto-increment ID    |
| `nim`             | String (FK → Student) | Student ID reference |
| `periode`         | String                | Period               |
| `programStudi`    | String                | Study program        |
| `fakultas`        | String                | Faculty              |
| `jenjang`         | String                | Education level      |
| `statusKeaktifan` | String                | Active status        |
| `jenisAktivitas`  | String                | Activity type        |
| `judulAktivitas`  | String                | Activity title       |
| `mitra`           | String                | Partner organization |
| `statusAktivitas` | String                | Activity status      |

## Scripts

```bash
pnpm dev          # Start dev server with Nodemon
pnpm start        # Start production server
pnpm build        # Build (Prisma generate)
pnpm test         # Run Vitest test suite
pnpm lint         # Lint with ESLint
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run Prisma migrations
pnpm db:push      # Push schema to database (no migration)
```

## Testing

Tests use **Vitest 5** with 13 test files and 84 unit tests covering controllers, services, middlewares, and utils.

```bash
pnpm test
```

## License

Part of the KOMET monorepo.
