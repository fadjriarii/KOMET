# Komet Backend — API Documentation

> **Generated:** 2026-09-22T02:26:42.017Z | **Server:** `http://localhost:3000` | **Status:** ✅ Live-tested against running server & database

---

## 1. Project Overview & Workflow

**Komet** (Kemahasiswaan & Output Monitoring Terpadu) is a backend analytics dashboard API built for an Indonesian university. It serves a React frontend with aggregated statistical data about:

- **Students (Mahasiswa):** Active student counts, intake trends, international student rates, and fluctuation analysis.
- **Graduates (Lulusan):** Graduation totals, GPA trends, on-time graduation rates, and study success metrics.
- **MBKM (Merdeka Belajar Kampus Merdeka):** Participation rates, activity distribution, partner organizations, and eligible student tracking.
- **Sync:** ETL pipeline that pulls raw data from the **SEVIMA API** (an Indonesian academic information platform) and upserts it into a local MySQL database.

### How It Works (End-to-End Flow)

1. **Sync Process:** The `/api/sync/*` endpoints trigger background ETL jobs. The `syncController` fetches paginated data from the SEVIMA API, processes/normalizes it, and upserts it into the local MySQL database (`komet_db`) using Prisma ORM.
2. **Data Serving:** The analytics endpoints (`/api/students/*`, `/api/graduates/*`, `/api/mbkm/*`) accept query filters, use Prisma to aggregate and calculate KPIs, and return JSON responses tailored for frontend visualization charts.

## 2. Setup & Environment

### Environment Variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | **Yes** | MySQL connection string: `mysql://USER:PASS@HOST:PORT/DB` |
| `SEVIMA_APP_KEY` | **Yes** | SEVIMA platform `X-App-Key` header |
| `SEVIMA_SECRET_KEY` | **Yes** | SEVIMA platform `X-Secret-Key` header |
| `SYNC_API_KEY` | **Yes** | Shared secret used to authenticate all API requests |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

### Running the Server
```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## 3. Error Handling & Standard Responses

The API uses a centralized error handler. A standard error response looks like this:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": "Detailed error stack (only in development)"
}
```
- **401 Unauthorized:** Missing or invalid `x-api-key`.
- **400 Bad Request:** Query validation failed (Zod schema).
- **429 Too Many Requests:** Hit rate limiter (60/min for stats, 5/min for sync).
- **409 Conflict:** Attempted to start a sync while one is already running.

---

## 4. API Endpoints Reference

All endpoints (except `/api/health`) require authentication. Use the `x-api-key` header.

### `GET /api/health`
**Description:** Health check endpoint to verify server and database connectivity.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/health"
```

**Real Response (Status 200):**
```json
{
  "status": "OK",
  "uptime": 1734.780532743,
  "timestamp": "2026-09-22T02:26:42.354Z",
  "database": {
    "status": "ok",
    "latencyMs": 177
  }
}
```

---

### `GET /api/students/summary`
**Description:** Retrieves aggregated KPI summary for the Students dashboard (total active, international trend, intake trend, fluctuation).

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/summary" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "summary": {
    "totalActiveStudents": 779,
    "totalInternationalStudents": 18,
    "intakeTrend": {
      "latest": {
        "tahun": "2026/2027",
        "intakeCount": 170,
        "growth": "0.00%",
        "rawGrowth": 0
      },
      "trend": [
        {
          "tahun": "2026/2027",
          "intakeCount": 170,
          "growth": "0.00%",
          "rawGrowth": 0
        }
      ]
    },
    "newStudentDecline": {
      "selectedPeriod": "2026/2027",
      "declinePercentage": -100,
      "history": [
        {
          "label": "A",
          "academicYear": "2026/2027",
          "intakeCount": 170,
          "changeFromPrev": null
        },
        {
          "label": "B",
          "academicYear": "2025/2026",
          "intakeCount": 0,
          "changeFromPrev": null
        },
        {
          "label": "C",
          "academicYear": "2024/2025",
          "intakeCount": 0,
          "changeFromPrev": null
        },
        {
          "label": "D",
          "academicYear": "2023/2024",
          "intakeCount": 0,
          "changeFromPrev": null
        },
        {
          "label": "E",
          "academicYear": "2022/2023",
          "intakeCount": 0,
          "changeFromPrev": null
        }
      ],
      "formula": "avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)"
    },
    "internationalStudentsTrend": {
      "latest": {
        "academicYear": "2026/2027",
        "cohortLabel": "2026/2027",
        "year": "2026",
        "foreignActive": 8,
        "foreignCount": 8,
        "totalActive": 170,
        "totalCount": 170,
        "percentage": 4.71,
        "rate": 4.71
      },
      "trend": [
        {
          "academicYear": "2020/2021",
          "cohortLabel": "2020/2021",
          "year": "2020",
          "foreignActive": 0,
          "foreignCount": 0,
          "totalActive": 4,
          "totalCount": 4,
          "percentage": 0,
          "rate": 0
        },
        {
          "academicYear": "2021/2022",
          "cohortLabel": "2021/2022",
          "year": "2021",
          "foreignActive": 0,
          "foreignCount": 0,
          "totalActive": 7,
          "totalCount": 7,
          "percentage": 0,
          "rate": 0
        },
        {
          "academicYear": "2022/2023",
          "cohortLabel": "2022/2023",
          "year": "2022",
          "foreignActive": 1,
          "foreignCount": 1,
          "totalActive": 133,
          "totalCount": 133,
          "percentage": 0.75,
          "rate": 0.75
        },
        {
          "academicYear": "2023/2024",
          "cohortLabel": "2023/2024",
          "year": "2023",
          "foreignActive": 2,
          "foreignCount": 2,
          "totalActive": 131,
          "totalCount": 131,
          "percentage": 1.53,
          "rate": 1.53
        },
        {
          "academicYear": "2024/2025",
          "cohortLabel": "2024/2025",
          "year": "2024",
          "foreignActive": 2,
          "foreignCount": 2,
          "totalActive": 111,
          "totalCount": 111,
          "percentage": 1.8,
          "rate": 1.8
        },
        {
          "academicYear": "2025/2026",
          "cohortLabel": "2025/2026",
          "year": "2025",
          "foreignActive": 5,
          "foreignCount": 5,
          "totalActive": 223,
          "totalCount": 223,
          "percentage": 2.24,
          "rate": 2.24
        },
        {
          "academicYear": "2026/2027",
          "cohortLabel": "2026/2027",
          "year": "2026",
          "foreignActive": 8,
          "foreignCount": 8,
          "totalActive": 170,
          "totalCount": 170,
          "percentage": 4.71,
          "rate": 4.71
        }
      ],
      "total": 18,
      "byCountry": [
        {
          "kewarganegaraan": "WNA",
          "count": 18
        }
      ]
    }
  },
  "kpis": {
    "activeStudentsCount": 779,
    "foreignStudentsRate": "2.3%",
    "foreignStudentsCount": 18,
    "intakeCohortCount": 170,
    "intakeFluctuationAvg": "-100.0%",
    "isFluctuationPositive": false
  },
  "filterOptions": {
    "fakultas": [
      "Bisnis dan Manajemen",
      "Ilmu Kesehatan dan Biosains"
    ],
    "programStudi": [
      "Bio Informatika",
      "Bio Medis dan Rekayasa Hayati",
      "Bio Medis dan Rekayasa Hayati (Akun Lama)",
      "Bio Teknologi",
      "Bio Teknologi (Akun Lama)",
      "Biomanajemen (Akun Lama)",
      "Farmasi",
      "Farmasi (Akun Lama)",
      "Innovation & Entrepreneurship (Akun Lama)",
      "Innovation &amp; Entrepreneurship",
      "Magister Bio Manajemen",
      "Manajemen Bisnis Internasional",
      "Manajemen Bisnis Internasional (Akun Lama)",
      "Pangan dan Nutrisi",
      "Pangan dan Nutrisi (Akun Lama)",
      "Pendidikan Profesi Apoteker",
      "Teknologi Pangan",
      "Teknologi Pangan (Akun Lama)"
    ],
    "angkatan": [
      "2026 Genap",
      "2025 Genap",
      "2025 Ganjil",
      "2024 Genap",
      "2024 Ganjil",
      "2023 Genap",
      "2023 Ganjil",
      "2022 Genap",
      "2022 Ganjil",
      "2021 Genap",
      "2021 Ganjil",
      "2020 Genap",
      "2020 Ganjil",
      "2019 Genap",
      "2019 Ganjil",
      "2018 Genap",
      "2018 Ganjil",
      "2017 Genap",
      "2016 Genap",
      "2015 Genap",
      "2014 Genap"
    ],
    "semester": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14
    ],
    "periodeMasuk": [
      "20261",
      "20252",
      "20251",
      "20242",
      "20241",
      "20232",
      "20231",
      "20222",
      "20221",
      "20212",
      "20211",
      "20202",
      "20201",
      "20192",
      "20191",
      "20182",
      "20181",
      "20171",
      "20161",
      "20151",
      "20141"
    ],
    "kewarganegaraan": [
      "WNA",
      "WNI"
    ],
    "statusKeaktifan": [
      "Aktif",
      "Drop Out / Dikeluarkan",
      "Lainnya",
      "Lulus",
      "Mengundurkan Diri / Keluar",
      "Mutasi",
      "Selesai Pendidikan Non Gelar",
      "Transfer"
    ]
  }
}
```

---

### `GET /api/students/active-students`
**Description:** Retrieves active student breakdown by program, faculty, and academic year.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/active-students" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "totalActiveStudents": 779,
  "byProdi": [
    {
      "name": "Bio Medis dan Rekayasa Hayati",
      "count": 183,
      "percentage": "23.5%"
    },
    {
      "name": "Bio Teknologi",
      "count": 182,
      "percentage": "23.4%"
    },
    {
      "name": "Pendidikan Profesi Apoteker",
      "count": 120,
      "percentage": "15.4%"
    },
    {
      "name": "Teknologi Pangan",
      "count": 98,
      "percentage": "12.6%"
    },
    {
      "name": "Pangan dan Nutrisi",
      "count": 68,
      "percentage": "8.7%"
    },
    {
      "name": "Farmasi",
      "count": 65,
      "percentage": "8.3%"
    },
    {
      "name": "Manajemen Bisnis Internasional",
      "count": 39,
      "percentage": "5.0%"
    },
    {
      "name": "Magister Bio Manajemen",
      "count": 14,
      "percentage": "1.8%"
    },
    {
      "name": "Innovation &amp; Entrepreneurship",
      "count": 6,
      "percentage": "0.8%"
    },
    {
      "name": "Biomanajemen (Akun Lama)",
      "count": 4,
      "percentage": "0.5%"
    }
  ],
  "byFaculty": [
    {
      "name": "Ilmu Kesehatan dan Biosains",
      "count": 716
    },
    {
      "name": "Bisnis dan Manajemen",
      "count": 63
    }
  ],
  "byJenjang": [
    {
      "name": "Sarjana (S1)",
      "count": 641
    },
    {
      "name": "Prof",
      "count": 120
    },
    {
      "name": "Magister (S2)",
      "count": 18
    }
  ],
  "byYear": [
    {
      "academicYear": "2020/2021",
      "activeCount": 4
    },
    {
      "academicYear": "2021/2022",
      "activeCount": 7
    },
    {
      "academicYear": "2022/2023",
      "activeCount": 133
    },
    {
      "academicYear": "2023/2024",
      "activeCount": 131
    },
    {
      "academicYear": "2024/2025",
      "activeCount": 111
    },
    {
      "academicYear": "2025/2026",
      "activeCount": 223
    },
    {
      "academicYear": "2026/2027",
      "activeCount": 170
    }
  ]
}
```

---

### `GET /api/students/international-trend`
**Description:** Retrieves international student trend data across academic years.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/international-trend" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "total": 18,
  "byCountry": [
    {
      "kewarganegaraan": "WNA",
      "count": 18
    }
  ],
  "trendData": [
    {
      "academicYear": "2020/2021",
      "cohortLabel": "2020/2021",
      "year": "2020",
      "foreignActive": 0,
      "foreignCount": 0,
      "totalActive": 4,
      "totalCount": 4,
      "percentage": 0,
      "rate": 0
    },
    {
      "academicYear": "2021/2022",
      "cohortLabel": "2021/2022",
      "year": "2021",
      "foreignActive": 0,
      "foreignCount": 0,
      "totalActive": 7,
      "totalCount": 7,
      "percentage": 0,
      "rate": 0
    },
    {
      "academicYear": "2022/2023",
      "cohortLabel": "2022/2023",
      "year": "2022",
      "foreignActive": 1,
      "foreignCount": 1,
      "totalActive": 133,
      "totalCount": 133,
      "percentage": 0.75,
      "rate": 0.75
    },
    {
      "academicYear": "2023/2024",
      "cohortLabel": "2023/2024",
      "year": "2023",
      "foreignActive": 2,
      "foreignCount": 2,
      "totalActive": 131,
      "totalCount": 131,
      "percentage": 1.53,
      "rate": 1.53
    },
    {
      "academicYear": "2024/2025",
      "cohortLabel": "2024/2025",
      "year": "2024",
      "foreignActive": 2,
      "foreignCount": 2,
      "totalActive": 111,
      "totalCount": 111,
      "percentage": 1.8,
      "rate": 1.8
    },
    {
      "academicYear": "2025/2026",
      "cohortLabel": "2025/2026",
      "year": "2025",
      "foreignActive": 5,
      "foreignCount": 5,
      "totalActive": 223,
      "totalCount": 223,
      "percentage": 2.24,
      "rate": 2.24
    },
    {
      "academicYear": "2026/2027",
      "cohortLabel": "2026/2027",
      "year": "2026",
      "foreignActive": 8,
      "foreignCount": 8,
      "totalActive": 170,
      "totalCount": 170,
      "percentage": 4.71,
      "rate": 4.71
    }
  ]
}
```

---

### `GET /api/students/intake-trend`
**Description:** Retrieves new student intake statistics over recent academic years.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/intake-trend" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "tahun": "2026/2027",
      "intakeCount": 170,
      "growth": "0.00%",
      "rawGrowth": 0
    }
  ],
  "intakeTrendData": [
    {
      "tahun": "2026/2027",
      "intakeCount": 170,
      "value": 0,
      "label": "0.0%",
      "growth": "0.0%",
      "ganjil": 0,
      "ganjilPct": 0,
      "genap": 170,
      "genapPct": 100
    }
  ]
}
```

---

### `GET /api/students/decline-trend`
**Description:** Calculates the fluctuation/decline trend of new student intake over a 5-year rolling period.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/decline-trend" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "selectedPeriod": "2026/2027",
    "declinePercentage": -100,
    "history": [
      {
        "label": "A",
        "academicYear": "2026/2027",
        "intakeCount": 170,
        "changeFromPrev": null
      },
      {
        "label": "B",
        "academicYear": "2025/2026",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "C",
        "academicYear": "2024/2025",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "D",
        "academicYear": "2023/2024",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "E",
        "academicYear": "2022/2023",
        "intakeCount": 0,
        "changeFromPrev": null
      }
    ],
    "formula": "avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)"
  },
  "declineTrend": {
    "selectedPeriod": "2026/2027",
    "declinePercentage": -100,
    "history": [
      {
        "label": "A",
        "academicYear": "2026/2027",
        "intakeCount": 170,
        "changeFromPrev": null
      },
      {
        "label": "B",
        "academicYear": "2025/2026",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "C",
        "academicYear": "2024/2025",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "D",
        "academicYear": "2023/2024",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "E",
        "academicYear": "2022/2023",
        "intakeCount": 0,
        "changeFromPrev": null
      }
    ],
    "formula": "avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)"
  },
  "isPositive": false,
  "finalAverage": "-100.0%",
  "trendBadge": "Penurunan",
  "chartData": [
    {
      "year": "2026/2027",
      "absolutCount": 170,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2025/2026",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2024/2025",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2023/2024",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2022/2023",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    }
  ],
  "fluctuationData": {
    "isPositive": false,
    "finalAverage": "-100.0%",
    "trendBadge": "Penurunan",
    "chartData": [
      {
        "year": "2026/2027",
        "absolutCount": 170,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2025/2026",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2024/2025",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2023/2024",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2022/2023",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      }
    ]
  }
}
```

---

### `GET /api/students/intake-fluctuation`
**Description:** Alias for /api/students/decline-trend.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/intake-fluctuation" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "selectedPeriod": "2026/2027",
    "declinePercentage": -100,
    "history": [
      {
        "label": "A",
        "academicYear": "2026/2027",
        "intakeCount": 170,
        "changeFromPrev": null
      },
      {
        "label": "B",
        "academicYear": "2025/2026",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "C",
        "academicYear": "2024/2025",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "D",
        "academicYear": "2023/2024",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "E",
        "academicYear": "2022/2023",
        "intakeCount": 0,
        "changeFromPrev": null
      }
    ],
    "formula": "avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)"
  },
  "declineTrend": {
    "selectedPeriod": "2026/2027",
    "declinePercentage": -100,
    "history": [
      {
        "label": "A",
        "academicYear": "2026/2027",
        "intakeCount": 170,
        "changeFromPrev": null
      },
      {
        "label": "B",
        "academicYear": "2025/2026",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "C",
        "academicYear": "2024/2025",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "D",
        "academicYear": "2023/2024",
        "intakeCount": 0,
        "changeFromPrev": null
      },
      {
        "label": "E",
        "academicYear": "2022/2023",
        "intakeCount": 0,
        "changeFromPrev": null
      }
    ],
    "formula": "avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)"
  },
  "isPositive": false,
  "finalAverage": "-100.0%",
  "trendBadge": "Penurunan",
  "chartData": [
    {
      "year": "2026/2027",
      "absolutCount": 170,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2025/2026",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2024/2025",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2023/2024",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    },
    {
      "year": "2022/2023",
      "absolutCount": 0,
      "deltaFormatted": "0.0%",
      "deltaPercentage": 0
    }
  ],
  "fluctuationData": {
    "isPositive": false,
    "finalAverage": "-100.0%",
    "trendBadge": "Penurunan",
    "chartData": [
      {
        "year": "2026/2027",
        "absolutCount": 170,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2025/2026",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2024/2025",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2023/2024",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      },
      {
        "year": "2022/2023",
        "absolutCount": 0,
        "deltaFormatted": "0.0%",
        "deltaPercentage": 0
      }
    ]
  }
}
```

---

### `GET /api/students/students`
**Description:** Paginated list of students. Supports filtering by fakultas, programStudi, angkatan, semester, kewarganegaraan, status.

**Query Parameters Example:** `page=1&limit=5`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/students?page=1&limit=5" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "nim": "25030001",
      "nama": "AAN ANNISA",
      "angkatan": "2025 Genap",
      "periodeMasuk": "20251",
      "programStudi": "Pendidikan Profesi Apoteker",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "semester": 3,
      "kewarganegaraan": "WNI",
      "statusKeaktifan": "Aktif",
      "program_studi": "Pendidikan Profesi Apoteker",
      "status_keaktifan": "Aktif",
      "periode": "20251"
    },
    {
      "nim": "25010044",
      "nama": "AARON NATHANIEL SURJA SAPUTRA",
      "angkatan": "2025 Genap",
      "periodeMasuk": "20251",
      "programStudi": "Bio Medis dan Rekayasa Hayati",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "semester": 3,
      "kewarganegaraan": "WNI",
      "statusKeaktifan": "Aktif",
      "program_studi": "Bio Medis dan Rekayasa Hayati",
      "status_keaktifan": "Aktif",
      "periode": "20251"
    },
    {
      "nim": "25010012",
      "nama": "AARON TANUWIJAYA",
      "angkatan": "2025 Genap",
      "periodeMasuk": "20251",
      "programStudi": "Pangan dan Nutrisi",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "semester": 3,
      "kewarganegaraan": "WNI",
      "statusKeaktifan": "Aktif",
      "program_studi": "Pangan dan Nutrisi",
      "status_keaktifan": "Aktif",
      "periode": "20251"
    },
    {
      "nim": "22010016",
      "nama": "ABHIRAMA RADYA ASASTA",
      "angkatan": "2022 Genap",
      "periodeMasuk": "20221",
      "programStudi": "Teknologi Pangan",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "semester": 9,
      "kewarganegaraan": "WNI",
      "statusKeaktifan": "Aktif",
      "program_studi": "Teknologi Pangan",
      "status_keaktifan": "Aktif",
      "periode": "20221"
    },
    {
      "nim": "23010001",
      "nama": "ABIALEXIA WANA",
      "angkatan": "2023 Genap",
      "periodeMasuk": "20231",
      "programStudi": "Bio Teknologi",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "semester": 7,
      "kewarganegaraan": "WNI",
      "statusKeaktifan": "Aktif",
      "program_studi": "Bio Teknologi",
      "status_keaktifan": "Aktif",
      "periode": "20231"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 2052,
    "totalPages": 411
  }
}
```

---

### `GET /api/students/student-dashboard`
**Description:** Legacy alias for /api/students/summary.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/students/student-dashboard" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "summary": {
    "totalActiveStudents": 779,
    "totalInternationalStudents": 18,
    "intakeTrend": {
      "latest": {
        "tahun": "2026/2027",
        "intakeCount": 170,
        "growth": "0.00%",
        "rawGrowth": 0
      },
      "trend": [
        {
          "tahun": "2026/2027",
          "intakeCount": 170,
          "growth": "0.00%",
          "rawGrowth": 0
        }
      ]
    },
    "newStudentDecline": {
      "selectedPeriod": "2026/2027",
      "declinePercentage": -100,
      "history": [
        {
          "label": "A",
          "academicYear": "2026/2027",
          "intakeCount": 170,
          "changeFromPrev": null
        },
        {
          "label": "B",
          "academicYear": "2025/2026",
          "intakeCount": 0,
          "changeFromPrev": null
        },
        {
          "label": "C",
          "academicYear": "2024/2025",
          "intakeCount": 0,
          "changeFromPrev": null
        },
        {
          "label": "D",
          "academicYear": "2023/2024",
          "intakeCount": 0,
          "changeFromPrev": null
        },
        {
          "label": "E",
          "academicYear": "2022/2023",
          "intakeCount": 0,
          "changeFromPrev": null
        }
      ],
      "formula": "avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)"
    },
    "internationalStudentsTrend": {
      "latest": {
        "academicYear": "2026/2027",
        "cohortLabel": "2026/2027",
        "year": "2026",
        "foreignActive": 8,
        "foreignCount": 8,
        "totalActive": 170,
        "totalCount": 170,
        "percentage": 4.71,
        "rate": 4.71
      },
      "trend": [
        {
          "academicYear": "2020/2021",
          "cohortLabel": "2020/2021",
          "year": "2020",
          "foreignActive": 0,
          "foreignCount": 0,
          "totalActive": 4,
          "totalCount": 4,
          "percentage": 0,
          "rate": 0
        },
        {
          "academicYear": "2021/2022",
          "cohortLabel": "2021/2022",
          "year": "2021",
          "foreignActive": 0,
          "foreignCount": 0,
          "totalActive": 7,
          "totalCount": 7,
          "percentage": 0,
          "rate": 0
        },
        {
          "academicYear": "2022/2023",
          "cohortLabel": "2022/2023",
          "year": "2022",
          "foreignActive": 1,
          "foreignCount": 1,
          "totalActive": 133,
          "totalCount": 133,
          "percentage": 0.75,
          "rate": 0.75
        },
        {
          "academicYear": "2023/2024",
          "cohortLabel": "2023/2024",
          "year": "2023",
          "foreignActive": 2,
          "foreignCount": 2,
          "totalActive": 131,
          "totalCount": 131,
          "percentage": 1.53,
          "rate": 1.53
        },
        {
          "academicYear": "2024/2025",
          "cohortLabel": "2024/2025",
          "year": "2024",
          "foreignActive": 2,
          "foreignCount": 2,
          "totalActive": 111,
          "totalCount": 111,
          "percentage": 1.8,
          "rate": 1.8
        },
        {
          "academicYear": "2025/2026",
          "cohortLabel": "2025/2026",
          "year": "2025",
          "foreignActive": 5,
          "foreignCount": 5,
          "totalActive": 223,
          "totalCount": 223,
          "percentage": 2.24,
          "rate": 2.24
        },
        {
          "academicYear": "2026/2027",
          "cohortLabel": "2026/2027",
          "year": "2026",
          "foreignActive": 8,
          "foreignCount": 8,
          "totalActive": 170,
          "totalCount": 170,
          "percentage": 4.71,
          "rate": 4.71
        }
      ],
      "total": 18,
      "byCountry": [
        {
          "kewarganegaraan": "WNA",
          "count": 18
        }
      ]
    }
  },
  "kpis": {
    "activeStudentsCount": 779,
    "foreignStudentsRate": "2.3%",
    "foreignStudentsCount": 18,
    "intakeCohortCount": 170,
    "intakeFluctuationAvg": "-100.0%",
    "isFluctuationPositive": false
  },
  "filterOptions": {
    "fakultas": [
      "Bisnis dan Manajemen",
      "Ilmu Kesehatan dan Biosains"
    ],
    "programStudi": [
      "Bio Informatika",
      "Bio Medis dan Rekayasa Hayati",
      "Bio Medis dan Rekayasa Hayati (Akun Lama)",
      "Bio Teknologi",
      "Bio Teknologi (Akun Lama)",
      "Biomanajemen (Akun Lama)",
      "Farmasi",
      "Farmasi (Akun Lama)",
      "Innovation & Entrepreneurship (Akun Lama)",
      "Innovation &amp; Entrepreneurship",
      "Magister Bio Manajemen",
      "Manajemen Bisnis Internasional",
      "Manajemen Bisnis Internasional (Akun Lama)",
      "Pangan dan Nutrisi",
      "Pangan dan Nutrisi (Akun Lama)",
      "Pendidikan Profesi Apoteker",
      "Teknologi Pangan",
      "Teknologi Pangan (Akun Lama)"
    ],
    "angkatan": [
      "2026 Genap",
      "2025 Genap",
      "2025 Ganjil",
      "2024 Genap",
      "2024 Ganjil",
      "2023 Genap",
      "2023 Ganjil",
      "2022 Genap",
      "2022 Ganjil",
      "2021 Genap",
      "2021 Ganjil",
      "2020 Genap",
      "2020 Ganjil",
      "2019 Genap",
      "2019 Ganjil",
      "2018 Genap",
      "2018 Ganjil",
      "2017 Genap",
      "2016 Genap",
      "2015 Genap",
      "2014 Genap"
    ],
    "semester": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14
    ],
    "periodeMasuk": [
      "20261",
      "20252",
      "20251",
      "20242",
      "20241",
      "20232",
      "20231",
      "20222",
      "20221",
      "20212",
      "20211",
      "20202",
      "20201",
      "20192",
      "20191",
      "20182",
      "20181",
      "20171",
      "20161",
      "20151",
      "20141"
    ],
    "kewarganegaraan": [
      "WNA",
      "WNI"
    ],
    "statusKeaktifan": [
      "Aktif",
      "Drop Out / Dikeluarkan",
      "Lainnya",
      "Lulus",
      "Mengundurkan Diri / Keluar",
      "Mutasi",
      "Selesai Pendidikan Non Gelar",
      "Transfer"
    ]
  }
}
```

---

### `GET /api/graduates/summary`
**Description:** Retrieves aggregated KPI summary for the Graduates dashboard (total lulusan, avg IPK, on-time rate, study success rate).

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/summary" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "referenceYear": 2025,
  "yearRange": [
    "2021",
    "2022",
    "2023",
    "2024",
    "2025"
  ],
  "summary": {
    "totalLulusan": {
      "s1": 638,
      "s2": 33
    },
    "avgIpk": {
      "s1": {
        "average": 3.6,
        "count": 638
      },
      "s2": {
        "average": 3.62,
        "count": 33
      }
    },
    "tepatWaktu": {
      "s1": 83.33,
      "s2": 100,
      "referenceYear": 2025
    },
    "keberhasilanStudi": {
      "s1": 71.83,
      "s2": 87.5,
      "angkatanS1": "2018",
      "angkatanS2": "2021"
    }
  },
  "kpis": {
    "totalGraduates": 671,
    "onTimeGraduationRateS1": "83.33%",
    "onTimeGraduationRateS2": "100%",
    "studySuccessRateS1": "71.83%",
    "averageGpaS1": "3.6",
    "averageGpaS2": "3.62"
  },
  "filterOptions": {
    "programStudi": [
      "Bio Informatika",
      "Bio Medis dan Rekayasa Hayati",
      "Bio Medis dan Rekayasa Hayati (Akun Lama)",
      "Bio Teknologi",
      "Bio Teknologi (Akun Lama)",
      "Biomanajemen (Akun Lama)",
      "Farmasi (Akun Lama)",
      "Innovation & Entrepreneurship (Akun Lama)",
      "Magister Bio Manajemen",
      "Manajemen Bisnis Internasional",
      "Manajemen Bisnis Internasional (Akun Lama)",
      "Pangan dan Nutrisi (Akun Lama)",
      "Pendidikan Profesi Apoteker",
      "Teknologi Pangan (Akun Lama)"
    ],
    "tahunLulus": [
      "2025",
      "2024",
      "2023",
      "2022",
      "2021",
      "2020",
      "2019",
      "2018",
      "2017"
    ],
    "periodeWisuda": [
      "20252",
      "20251",
      "20242",
      "20241",
      "20232",
      "20231",
      "20222",
      "20221",
      "20212",
      "20211",
      "20202",
      "20201",
      "20192",
      "20191",
      "20182",
      "20181",
      "20172"
    ],
    "statusKelulusan": [
      "Cum Laude",
      "Lulus",
      "Memuaskan",
      "Sangat Memuaskan"
    ],
    "fakultas": [
      "Bisnis dan Manajemen",
      "Ilmu Kesehatan dan Biosains"
    ],
    "periodeMasuk": [
      "20252",
      "20241",
      "20232",
      "20231",
      "20222",
      "20221",
      "20212",
      "20211",
      "20202",
      "20201",
      "20191",
      "20182",
      "20181",
      "20171",
      "20161",
      "20151",
      "20141"
    ],
    "jenjang": [
      "S1",
      "S2"
    ]
  }
}
```

---

### `GET /api/graduates/total-lulusan`
**Description:** Retrieves graduation volumes by year for S1 and S2 levels.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/total-lulusan" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "s1": [
      {
        "tahun": "2021",
        "count": 153
      },
      {
        "tahun": "2022",
        "count": 157
      },
      {
        "tahun": "2023",
        "count": 176
      },
      {
        "tahun": "2024",
        "count": 146
      },
      {
        "tahun": "2025",
        "count": 6
      }
    ],
    "s2": [
      {
        "tahun": "2021",
        "count": 2
      },
      {
        "tahun": "2022",
        "count": 7
      },
      {
        "tahun": "2023",
        "count": 4
      },
      {
        "tahun": "2024",
        "count": 11
      },
      {
        "tahun": "2025",
        "count": 9
      }
    ]
  }
}
```

---

### `GET /api/graduates/ipk-trend`
**Description:** Retrieves GPA trends and distribution across study programs and academic years.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/ipk-trend" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "s1Gpa": {
      "average": 3.6,
      "count": 638
    },
    "s2Gpa": {
      "average": 3.62,
      "count": 33
    },
    "byYearS1": [
      {
        "tahun": "2021",
        "avgIpk": 3.45,
        "count": 153
      },
      {
        "tahun": "2022",
        "avgIpk": 3.66,
        "count": 157
      },
      {
        "tahun": "2023",
        "avgIpk": 3.7,
        "count": 176
      },
      {
        "tahun": "2024",
        "avgIpk": 3.57,
        "count": 146
      },
      {
        "tahun": "2025",
        "avgIpk": 3.11,
        "count": 6
      }
    ],
    "byYearS2": [
      {
        "tahun": "2021",
        "avgIpk": 3.4,
        "count": 2
      },
      {
        "tahun": "2022",
        "avgIpk": 3.58,
        "count": 7
      },
      {
        "tahun": "2023",
        "avgIpk": 3.77,
        "count": 4
      },
      {
        "tahun": "2024",
        "avgIpk": 3.59,
        "count": 11
      },
      {
        "tahun": "2025",
        "avgIpk": 3.67,
        "count": 9
      }
    ],
    "prodiGpaData": [
      {
        "name": "Pendidikan Profesi Apoteker",
        "gpaValue": 4,
        "count": 1
      },
      {
        "name": "Teknologi Pangan (Akun Lama)",
        "gpaValue": 3.68,
        "count": 143
      },
      {
        "name": "Magister Bio Manajemen",
        "gpaValue": 3.67,
        "count": 9
      },
      {
        "name": "Manajemen Bisnis Internasional",
        "gpaValue": 3.66,
        "count": 6
      },
      {
        "name": "Farmasi (Akun Lama)",
        "gpaValue": 3.64,
        "count": 59
      },
      {
        "name": "Pangan dan Nutrisi (Akun Lama)",
        "gpaValue": 3.63,
        "count": 82
      },
      {
        "name": "Biomanajemen (Akun Lama)",
        "gpaValue": 3.6,
        "count": 24
      },
      {
        "name": "Bio Medis dan Rekayasa Hayati (Akun Lama)",
        "gpaValue": 3.57,
        "count": 142
      },
      {
        "name": "Bio Informatika",
        "gpaValue": 3.56,
        "count": 33
      },
      {
        "name": "Bio Teknologi",
        "gpaValue": 3.55,
        "count": 26
      },
      {
        "name": "Bio Teknologi (Akun Lama)",
        "gpaValue": 3.54,
        "count": 101
      },
      {
        "name": "Manajemen Bisnis Internasional (Akun Lama)",
        "gpaValue": 3.54,
        "count": 1
      },
      {
        "name": "Bio Medis dan Rekayasa Hayati",
        "gpaValue": 3.49,
        "count": 27
      },
      {
        "name": "Innovation & Entrepreneurship (Akun Lama)",
        "gpaValue": 3.48,
        "count": 18
      }
    ],
    "facultyGpaData": [
      {
        "name": "Ilmu Kesehatan dan Biosains",
        "gpaValue": 3.6,
        "count": 614
      },
      {
        "name": "Bisnis dan Manajemen",
        "gpaValue": 3.58,
        "count": 58
      }
    ],
    "gpaBandsData": [
      {
        "range": "< 2.75",
        "count": 5
      },
      {
        "range": "2.75 - 3.00",
        "count": 18
      },
      {
        "range": "3.01 - 3.50",
        "count": 181
      },
      {
        "range": "3.51 - 3.75",
        "count": 233
      },
      {
        "range": "3.76 - 4.00",
        "count": 235
      }
    ]
  }
}
```

---

### `GET /api/graduates/tepat-waktu`
**Description:** Retrieves on-time graduation rates categorized by fast, on-time, and late completions per cohort.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/tepat-waktu" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "s1": [
      {
        "cohort": 2017,
        "cohortLabel": "Angkatan 2017",
        "tahunLulusTepat": 2021,
        "isIncomplete": false,
        "rateFormatted": "97.4%",
        "fastCount": 144,
        "onTimeCount": 5,
        "lateCount": 4,
        "intake": 168
      },
      {
        "cohort": 2018,
        "cohortLabel": "Angkatan 2018",
        "tahunLulusTepat": 2022,
        "isIncomplete": false,
        "rateFormatted": "97.5%",
        "fastCount": 147,
        "onTimeCount": 6,
        "lateCount": 4,
        "intake": 172
      },
      {
        "cohort": 2019,
        "cohortLabel": "Angkatan 2019",
        "tahunLulusTepat": 2023,
        "isIncomplete": false,
        "rateFormatted": "97.7%",
        "fastCount": 166,
        "onTimeCount": 6,
        "lateCount": 4,
        "intake": 191
      },
      {
        "cohort": 2020,
        "cohortLabel": "Angkatan 2020",
        "tahunLulusTepat": 2024,
        "isIncomplete": false,
        "rateFormatted": "95.9%",
        "fastCount": 125,
        "onTimeCount": 15,
        "lateCount": 6,
        "intake": 161
      },
      {
        "cohort": 2021,
        "cohortLabel": "Angkatan 2021",
        "tahunLulusTepat": 2025,
        "isIncomplete": false,
        "rateFormatted": "83.3%",
        "fastCount": 0,
        "onTimeCount": 5,
        "lateCount": 1,
        "intake": 21
      }
    ],
    "s2": [
      {
        "cohort": 2019,
        "cohortLabel": "Angkatan 2019",
        "tahunLulusTepat": 2021,
        "isIncomplete": false,
        "rateFormatted": "100.0%",
        "fastCount": 1,
        "onTimeCount": 1,
        "lateCount": 0,
        "intake": 17
      },
      {
        "cohort": 2020,
        "cohortLabel": "Angkatan 2020",
        "tahunLulusTepat": 2022,
        "isIncomplete": false,
        "rateFormatted": "85.7%",
        "fastCount": 5,
        "onTimeCount": 1,
        "lateCount": 1,
        "intake": 22
      },
      {
        "cohort": 2021,
        "cohortLabel": "Angkatan 2021",
        "tahunLulusTepat": 2023,
        "isIncomplete": false,
        "rateFormatted": "100.0%",
        "fastCount": 2,
        "onTimeCount": 2,
        "lateCount": 0,
        "intake": 19
      },
      {
        "cohort": 2022,
        "cohortLabel": "Angkatan 2022",
        "tahunLulusTepat": 2024,
        "isIncomplete": false,
        "rateFormatted": "90.9%",
        "fastCount": 6,
        "onTimeCount": 4,
        "lateCount": 1,
        "intake": 26
      },
      {
        "cohort": 2023,
        "cohortLabel": "Angkatan 2023",
        "tahunLulusTepat": 2025,
        "isIncomplete": false,
        "rateFormatted": "100.0%",
        "fastCount": 6,
        "onTimeCount": 3,
        "lateCount": 0,
        "intake": 24
      }
    ],
    "batasS1": 4,
    "batasS2": 2
  },
  "onTimeCohortData": [
    {
      "cohort": 2017,
      "cohortLabel": "Angkatan 2017",
      "tahunLulusTepat": 2021,
      "isIncomplete": false,
      "rateFormatted": "97.4%",
      "fastCount": 144,
      "onTimeCount": 5,
      "lateCount": 4,
      "intake": 168
    },
    {
      "cohort": 2018,
      "cohortLabel": "Angkatan 2018",
      "tahunLulusTepat": 2022,
      "isIncomplete": false,
      "rateFormatted": "97.5%",
      "fastCount": 147,
      "onTimeCount": 6,
      "lateCount": 4,
      "intake": 172
    },
    {
      "cohort": 2019,
      "cohortLabel": "Angkatan 2019",
      "tahunLulusTepat": 2023,
      "isIncomplete": false,
      "rateFormatted": "97.7%",
      "fastCount": 166,
      "onTimeCount": 6,
      "lateCount": 4,
      "intake": 191
    },
    {
      "cohort": 2020,
      "cohortLabel": "Angkatan 2020",
      "tahunLulusTepat": 2024,
      "isIncomplete": false,
      "rateFormatted": "95.9%",
      "fastCount": 125,
      "onTimeCount": 15,
      "lateCount": 6,
      "intake": 161
    },
    {
      "cohort": 2021,
      "cohortLabel": "Angkatan 2021",
      "tahunLulusTepat": 2025,
      "isIncomplete": false,
      "rateFormatted": "83.3%",
      "fastCount": 0,
      "onTimeCount": 5,
      "lateCount": 1,
      "intake": 21
    }
  ],
  "onTimeCohortDataS2": [
    {
      "cohort": 2019,
      "cohortLabel": "Angkatan 2019",
      "tahunLulusTepat": 2021,
      "isIncomplete": false,
      "rateFormatted": "100.0%",
      "fastCount": 1,
      "onTimeCount": 1,
      "lateCount": 0,
      "intake": 17
    },
    {
      "cohort": 2020,
      "cohortLabel": "Angkatan 2020",
      "tahunLulusTepat": 2022,
      "isIncomplete": false,
      "rateFormatted": "85.7%",
      "fastCount": 5,
      "onTimeCount": 1,
      "lateCount": 1,
      "intake": 22
    },
    {
      "cohort": 2021,
      "cohortLabel": "Angkatan 2021",
      "tahunLulusTepat": 2023,
      "isIncomplete": false,
      "rateFormatted": "100.0%",
      "fastCount": 2,
      "onTimeCount": 2,
      "lateCount": 0,
      "intake": 19
    },
    {
      "cohort": 2022,
      "cohortLabel": "Angkatan 2022",
      "tahunLulusTepat": 2024,
      "isIncomplete": false,
      "rateFormatted": "90.9%",
      "fastCount": 6,
      "onTimeCount": 4,
      "lateCount": 1,
      "intake": 26
    },
    {
      "cohort": 2023,
      "cohortLabel": "Angkatan 2023",
      "tahunLulusTepat": 2025,
      "isIncomplete": false,
      "rateFormatted": "100.0%",
      "fastCount": 6,
      "onTimeCount": 3,
      "lateCount": 0,
      "intake": 24
    }
  ]
}
```

---

### `GET /api/graduates/keberhasilan-studi`
**Description:** Retrieves study success rates (graduates vs intake ratio) per cohort.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/keberhasilan-studi" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "byCohort": [
      {
        "angkatan": "2014",
        "cohort": 2014,
        "cohortLabel": "Angkatan 2014",
        "isIncomplete": false,
        "rateFormatted": "88.0%",
        "successCount": 44,
        "lulus": 44,
        "total": 50,
        "intake": 50,
        "percentage": 88
      },
      {
        "angkatan": "2015",
        "cohort": 2015,
        "cohortLabel": "Angkatan 2015",
        "isIncomplete": false,
        "rateFormatted": "93.1%",
        "successCount": 81,
        "lulus": 81,
        "total": 87,
        "intake": 87,
        "percentage": 93.1
      },
      {
        "angkatan": "2016",
        "cohort": 2016,
        "cohortLabel": "Angkatan 2016",
        "isIncomplete": false,
        "rateFormatted": "89.9%",
        "successCount": 89,
        "lulus": 89,
        "total": 99,
        "intake": 99,
        "percentage": 89.9
      },
      {
        "angkatan": "2017",
        "cohort": 2017,
        "cohortLabel": "Angkatan 2017",
        "isIncomplete": false,
        "rateFormatted": "73.7%",
        "successCount": 70,
        "lulus": 70,
        "total": 95,
        "intake": 95,
        "percentage": 73.68
      },
      {
        "angkatan": "2018",
        "cohort": 2018,
        "cohortLabel": "Angkatan 2018",
        "isIncomplete": false,
        "rateFormatted": "71.8%",
        "successCount": 153,
        "lulus": 153,
        "total": 213,
        "intake": 213,
        "percentage": 71.83
      }
    ],
    "s1": [
      {
        "angkatan": "2014",
        "cohort": 2014,
        "cohortLabel": "Angkatan 2014",
        "isIncomplete": false,
        "rateFormatted": "88.0%",
        "successCount": 44,
        "lulus": 44,
        "total": 50,
        "intake": 50,
        "percentage": 88
      },
      {
        "angkatan": "2015",
        "cohort": 2015,
        "cohortLabel": "Angkatan 2015",
        "isIncomplete": false,
        "rateFormatted": "93.1%",
        "successCount": 81,
        "lulus": 81,
        "total": 87,
        "intake": 87,
        "percentage": 93.1
      },
      {
        "angkatan": "2016",
        "cohort": 2016,
        "cohortLabel": "Angkatan 2016",
        "isIncomplete": false,
        "rateFormatted": "89.9%",
        "successCount": 89,
        "lulus": 89,
        "total": 99,
        "intake": 99,
        "percentage": 89.9
      },
      {
        "angkatan": "2017",
        "cohort": 2017,
        "cohortLabel": "Angkatan 2017",
        "isIncomplete": false,
        "rateFormatted": "73.7%",
        "successCount": 70,
        "lulus": 70,
        "total": 95,
        "intake": 95,
        "percentage": 73.68
      },
      {
        "angkatan": "2018",
        "cohort": 2018,
        "cohortLabel": "Angkatan 2018",
        "isIncomplete": false,
        "rateFormatted": "71.8%",
        "successCount": 153,
        "lulus": 153,
        "total": 213,
        "intake": 213,
        "percentage": 71.83
      }
    ],
    "s2": [
      {
        "angkatan": "2017",
        "cohort": 2017,
        "cohortLabel": "Angkatan 2017",
        "isIncomplete": false,
        "rateFormatted": "80.0%",
        "successCount": 4,
        "lulus": 4,
        "total": 5,
        "intake": 5,
        "percentage": 80
      },
      {
        "angkatan": "2018",
        "cohort": 2018,
        "cohortLabel": "Angkatan 2018",
        "isIncomplete": false,
        "rateFormatted": "81.8%",
        "successCount": 9,
        "lulus": 9,
        "total": 11,
        "intake": 11,
        "percentage": 81.82
      },
      {
        "angkatan": "2019",
        "cohort": 2019,
        "cohortLabel": "Angkatan 2019",
        "isIncomplete": false,
        "rateFormatted": "66.7%",
        "successCount": 2,
        "lulus": 2,
        "total": 3,
        "intake": 3,
        "percentage": 66.67
      },
      {
        "angkatan": "2020",
        "cohort": 2020,
        "cohortLabel": "Angkatan 2020",
        "isIncomplete": false,
        "rateFormatted": "50.0%",
        "successCount": 2,
        "lulus": 2,
        "total": 4,
        "intake": 4,
        "percentage": 50
      },
      {
        "angkatan": "2021",
        "cohort": 2021,
        "cohortLabel": "Angkatan 2021",
        "isIncomplete": false,
        "rateFormatted": "87.5%",
        "successCount": 7,
        "lulus": 7,
        "total": 8,
        "intake": 8,
        "percentage": 87.5
      }
    ],
    "batasStudiS1": 7,
    "batasStudiS2": 4,
    "angkatanEvaluasiS1": "2018",
    "angkatanEvaluasiS2": "2021"
  },
  "successCohortData": [
    {
      "angkatan": "2014",
      "cohort": 2014,
      "cohortLabel": "Angkatan 2014",
      "isIncomplete": false,
      "rateFormatted": "88.0%",
      "successCount": 44,
      "lulus": 44,
      "total": 50,
      "intake": 50,
      "percentage": 88
    },
    {
      "angkatan": "2015",
      "cohort": 2015,
      "cohortLabel": "Angkatan 2015",
      "isIncomplete": false,
      "rateFormatted": "93.1%",
      "successCount": 81,
      "lulus": 81,
      "total": 87,
      "intake": 87,
      "percentage": 93.1
    },
    {
      "angkatan": "2016",
      "cohort": 2016,
      "cohortLabel": "Angkatan 2016",
      "isIncomplete": false,
      "rateFormatted": "89.9%",
      "successCount": 89,
      "lulus": 89,
      "total": 99,
      "intake": 99,
      "percentage": 89.9
    },
    {
      "angkatan": "2017",
      "cohort": 2017,
      "cohortLabel": "Angkatan 2017",
      "isIncomplete": false,
      "rateFormatted": "73.7%",
      "successCount": 70,
      "lulus": 70,
      "total": 95,
      "intake": 95,
      "percentage": 73.68
    },
    {
      "angkatan": "2018",
      "cohort": 2018,
      "cohortLabel": "Angkatan 2018",
      "isIncomplete": false,
      "rateFormatted": "71.8%",
      "successCount": 153,
      "lulus": 153,
      "total": 213,
      "intake": 213,
      "percentage": 71.83
    }
  ],
  "successCohortDataS2": [
    {
      "angkatan": "2017",
      "cohort": 2017,
      "cohortLabel": "Angkatan 2017",
      "isIncomplete": false,
      "rateFormatted": "80.0%",
      "successCount": 4,
      "lulus": 4,
      "total": 5,
      "intake": 5,
      "percentage": 80
    },
    {
      "angkatan": "2018",
      "cohort": 2018,
      "cohortLabel": "Angkatan 2018",
      "isIncomplete": false,
      "rateFormatted": "81.8%",
      "successCount": 9,
      "lulus": 9,
      "total": 11,
      "intake": 11,
      "percentage": 81.82
    },
    {
      "angkatan": "2019",
      "cohort": 2019,
      "cohortLabel": "Angkatan 2019",
      "isIncomplete": false,
      "rateFormatted": "66.7%",
      "successCount": 2,
      "lulus": 2,
      "total": 3,
      "intake": 3,
      "percentage": 66.67
    },
    {
      "angkatan": "2020",
      "cohort": 2020,
      "cohortLabel": "Angkatan 2020",
      "isIncomplete": false,
      "rateFormatted": "50.0%",
      "successCount": 2,
      "lulus": 2,
      "total": 4,
      "intake": 4,
      "percentage": 50
    },
    {
      "angkatan": "2021",
      "cohort": 2021,
      "cohortLabel": "Angkatan 2021",
      "isIncomplete": false,
      "rateFormatted": "87.5%",
      "successCount": 7,
      "lulus": 7,
      "total": 8,
      "intake": 8,
      "percentage": 87.5
    }
  ]
}
```

---

### `GET /api/graduates/study-success`
**Description:** Alias for /api/graduates/keberhasilan-studi.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/study-success" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "byCohort": [
      {
        "angkatan": "2014",
        "cohort": 2014,
        "cohortLabel": "Angkatan 2014",
        "isIncomplete": false,
        "rateFormatted": "88.0%",
        "successCount": 44,
        "lulus": 44,
        "total": 50,
        "intake": 50,
        "percentage": 88
      },
      {
        "angkatan": "2015",
        "cohort": 2015,
        "cohortLabel": "Angkatan 2015",
        "isIncomplete": false,
        "rateFormatted": "93.1%",
        "successCount": 81,
        "lulus": 81,
        "total": 87,
        "intake": 87,
        "percentage": 93.1
      },
      {
        "angkatan": "2016",
        "cohort": 2016,
        "cohortLabel": "Angkatan 2016",
        "isIncomplete": false,
        "rateFormatted": "89.9%",
        "successCount": 89,
        "lulus": 89,
        "total": 99,
        "intake": 99,
        "percentage": 89.9
      },
      {
        "angkatan": "2017",
        "cohort": 2017,
        "cohortLabel": "Angkatan 2017",
        "isIncomplete": false,
        "rateFormatted": "73.7%",
        "successCount": 70,
        "lulus": 70,
        "total": 95,
        "intake": 95,
        "percentage": 73.68
      },
      {
        "angkatan": "2018",
        "cohort": 2018,
        "cohortLabel": "Angkatan 2018",
        "isIncomplete": false,
        "rateFormatted": "71.8%",
        "successCount": 153,
        "lulus": 153,
        "total": 213,
        "intake": 213,
        "percentage": 71.83
      }
    ],
    "s1": [
      {
        "angkatan": "2014",
        "cohort": 2014,
        "cohortLabel": "Angkatan 2014",
        "isIncomplete": false,
        "rateFormatted": "88.0%",
        "successCount": 44,
        "lulus": 44,
        "total": 50,
        "intake": 50,
        "percentage": 88
      },
      {
        "angkatan": "2015",
        "cohort": 2015,
        "cohortLabel": "Angkatan 2015",
        "isIncomplete": false,
        "rateFormatted": "93.1%",
        "successCount": 81,
        "lulus": 81,
        "total": 87,
        "intake": 87,
        "percentage": 93.1
      },
      {
        "angkatan": "2016",
        "cohort": 2016,
        "cohortLabel": "Angkatan 2016",
        "isIncomplete": false,
        "rateFormatted": "89.9%",
        "successCount": 89,
        "lulus": 89,
        "total": 99,
        "intake": 99,
        "percentage": 89.9
      },
      {
        "angkatan": "2017",
        "cohort": 2017,
        "cohortLabel": "Angkatan 2017",
        "isIncomplete": false,
        "rateFormatted": "73.7%",
        "successCount": 70,
        "lulus": 70,
        "total": 95,
        "intake": 95,
        "percentage": 73.68
      },
      {
        "angkatan": "2018",
        "cohort": 2018,
        "cohortLabel": "Angkatan 2018",
        "isIncomplete": false,
        "rateFormatted": "71.8%",
        "successCount": 153,
        "lulus": 153,
        "total": 213,
        "intake": 213,
        "percentage": 71.83
      }
    ],
    "s2": [
      {
        "angkatan": "2017",
        "cohort": 2017,
        "cohortLabel": "Angkatan 2017",
        "isIncomplete": false,
        "rateFormatted": "80.0%",
        "successCount": 4,
        "lulus": 4,
        "total": 5,
        "intake": 5,
        "percentage": 80
      },
      {
        "angkatan": "2018",
        "cohort": 2018,
        "cohortLabel": "Angkatan 2018",
        "isIncomplete": false,
        "rateFormatted": "81.8%",
        "successCount": 9,
        "lulus": 9,
        "total": 11,
        "intake": 11,
        "percentage": 81.82
      },
      {
        "angkatan": "2019",
        "cohort": 2019,
        "cohortLabel": "Angkatan 2019",
        "isIncomplete": false,
        "rateFormatted": "66.7%",
        "successCount": 2,
        "lulus": 2,
        "total": 3,
        "intake": 3,
        "percentage": 66.67
      },
      {
        "angkatan": "2020",
        "cohort": 2020,
        "cohortLabel": "Angkatan 2020",
        "isIncomplete": false,
        "rateFormatted": "50.0%",
        "successCount": 2,
        "lulus": 2,
        "total": 4,
        "intake": 4,
        "percentage": 50
      },
      {
        "angkatan": "2021",
        "cohort": 2021,
        "cohortLabel": "Angkatan 2021",
        "isIncomplete": false,
        "rateFormatted": "87.5%",
        "successCount": 7,
        "lulus": 7,
        "total": 8,
        "intake": 8,
        "percentage": 87.5
      }
    ],
    "batasStudiS1": 7,
    "batasStudiS2": 4,
    "angkatanEvaluasiS1": "2018",
    "angkatanEvaluasiS2": "2021"
  },
  "successCohortData": [
    {
      "angkatan": "2014",
      "cohort": 2014,
      "cohortLabel": "Angkatan 2014",
      "isIncomplete": false,
      "rateFormatted": "88.0%",
      "successCount": 44,
      "lulus": 44,
      "total": 50,
      "intake": 50,
      "percentage": 88
    },
    {
      "angkatan": "2015",
      "cohort": 2015,
      "cohortLabel": "Angkatan 2015",
      "isIncomplete": false,
      "rateFormatted": "93.1%",
      "successCount": 81,
      "lulus": 81,
      "total": 87,
      "intake": 87,
      "percentage": 93.1
    },
    {
      "angkatan": "2016",
      "cohort": 2016,
      "cohortLabel": "Angkatan 2016",
      "isIncomplete": false,
      "rateFormatted": "89.9%",
      "successCount": 89,
      "lulus": 89,
      "total": 99,
      "intake": 99,
      "percentage": 89.9
    },
    {
      "angkatan": "2017",
      "cohort": 2017,
      "cohortLabel": "Angkatan 2017",
      "isIncomplete": false,
      "rateFormatted": "73.7%",
      "successCount": 70,
      "lulus": 70,
      "total": 95,
      "intake": 95,
      "percentage": 73.68
    },
    {
      "angkatan": "2018",
      "cohort": 2018,
      "cohortLabel": "Angkatan 2018",
      "isIncomplete": false,
      "rateFormatted": "71.8%",
      "successCount": 153,
      "lulus": 153,
      "total": 213,
      "intake": 213,
      "percentage": 71.83
    }
  ],
  "successCohortDataS2": [
    {
      "angkatan": "2017",
      "cohort": 2017,
      "cohortLabel": "Angkatan 2017",
      "isIncomplete": false,
      "rateFormatted": "80.0%",
      "successCount": 4,
      "lulus": 4,
      "total": 5,
      "intake": 5,
      "percentage": 80
    },
    {
      "angkatan": "2018",
      "cohort": 2018,
      "cohortLabel": "Angkatan 2018",
      "isIncomplete": false,
      "rateFormatted": "81.8%",
      "successCount": 9,
      "lulus": 9,
      "total": 11,
      "intake": 11,
      "percentage": 81.82
    },
    {
      "angkatan": "2019",
      "cohort": 2019,
      "cohortLabel": "Angkatan 2019",
      "isIncomplete": false,
      "rateFormatted": "66.7%",
      "successCount": 2,
      "lulus": 2,
      "total": 3,
      "intake": 3,
      "percentage": 66.67
    },
    {
      "angkatan": "2020",
      "cohort": 2020,
      "cohortLabel": "Angkatan 2020",
      "isIncomplete": false,
      "rateFormatted": "50.0%",
      "successCount": 2,
      "lulus": 2,
      "total": 4,
      "intake": 4,
      "percentage": 50
    },
    {
      "angkatan": "2021",
      "cohort": 2021,
      "cohortLabel": "Angkatan 2021",
      "isIncomplete": false,
      "rateFormatted": "87.5%",
      "successCount": 7,
      "lulus": 7,
      "total": 8,
      "intake": 8,
      "percentage": 87.5
    }
  ]
}
```

---

### `GET /api/graduates/distribution`
**Description:** Retrieves graduate distributions by honor classification (predikat) and graduation year.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/distribution" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "total": 672,
    "byYear": [
      {
        "year": "2021",
        "tahun": "2021",
        "count": 155
      },
      {
        "year": "2022",
        "tahun": "2022",
        "count": 164
      },
      {
        "year": "2023",
        "tahun": "2023",
        "count": 180
      },
      {
        "year": "2024",
        "tahun": "2024",
        "count": 157
      },
      {
        "year": "2025",
        "tahun": "2025",
        "count": 16
      }
    ],
    "byPredikat": [
      {
        "name": "Dengan Pujian (Cum Laude)",
        "count": 0,
        "percentage": "0.0%"
      },
      {
        "name": "Sangat Memuaskan",
        "count": 181,
        "percentage": "26.9%"
      },
      {
        "name": "Memuaskan",
        "count": 23,
        "percentage": "3.4%"
      },
      {
        "name": "Cum Laude",
        "count": 468,
        "percentage": "69.6%"
      }
    ]
  },
  "total": 672,
  "byYear": [
    {
      "year": "2021",
      "tahun": "2021",
      "count": 155
    },
    {
      "year": "2022",
      "tahun": "2022",
      "count": 164
    },
    {
      "year": "2023",
      "tahun": "2023",
      "count": 180
    },
    {
      "year": "2024",
      "tahun": "2024",
      "count": 157
    },
    {
      "year": "2025",
      "tahun": "2025",
      "count": 16
    }
  ],
  "byPredikat": [
    {
      "name": "Dengan Pujian (Cum Laude)",
      "count": 0,
      "percentage": "0.0%"
    },
    {
      "name": "Sangat Memuaskan",
      "count": 181,
      "percentage": "26.9%"
    },
    {
      "name": "Memuaskan",
      "count": 23,
      "percentage": "3.4%"
    },
    {
      "name": "Cum Laude",
      "count": 468,
      "percentage": "69.6%"
    }
  ]
}
```

---

### `GET /api/graduates/list`
**Description:** Paginated list of graduates. Supports filtering by jenjang, tahunLulus, programStudi, etc.

**Query Parameters Example:** `page=1&limit=5`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/graduates/list?page=1&limit=5" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "nim": "21010047",
      "nama": "Bernard Sandy Prasetyo",
      "angkatan": "2021 Genap",
      "programStudi": "Bio Medis dan Rekayasa Hayati",
      "program_studi": "Bio Medis dan Rekayasa Hayati",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "tahunLulus": 2025,
      "tahun_lulus": 2025,
      "ipk": 3.35,
      "sksLulus": 144,
      "sks_lulus": 144,
      "predikatLulus": "Sangat Memuaskan",
      "predikat_lulus": "Sangat Memuaskan",
      "statusKelulusan": "Sangat Memuaskan",
      "statusKeaktifan": "Lulus",
      "status_keaktifan": "Lulus"
    },
    {
      "nim": "21010054",
      "nama": "Christabel Queentha Salam",
      "angkatan": "2021 Genap",
      "programStudi": "Bio Teknologi",
      "program_studi": "Bio Teknologi",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "tahunLulus": 2025,
      "tahun_lulus": 2025,
      "ipk": 3.41,
      "sksLulus": 150,
      "sks_lulus": 150,
      "predikatLulus": "Sangat Memuaskan",
      "predikat_lulus": "Sangat Memuaskan",
      "statusKelulusan": "Sangat Memuaskan",
      "statusKeaktifan": "Lulus",
      "status_keaktifan": "Lulus"
    },
    {
      "nim": "20010086",
      "nama": "Claudia Christy Gunawan",
      "angkatan": "2020 Genap",
      "programStudi": "Bio Medis dan Rekayasa Hayati",
      "program_studi": "Bio Medis dan Rekayasa Hayati",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "tahunLulus": 2025,
      "tahun_lulus": 2025,
      "ipk": 2.69,
      "sksLulus": 144,
      "sks_lulus": 144,
      "predikatLulus": "Memuaskan",
      "predikat_lulus": "Memuaskan",
      "statusKelulusan": "Memuaskan",
      "statusKeaktifan": "Lulus",
      "status_keaktifan": "Lulus"
    },
    {
      "nim": "25030047",
      "nama": "FARHAN FIRMANSYAH",
      "angkatan": "2025 Ganjil",
      "programStudi": "Pendidikan Profesi Apoteker",
      "program_studi": "Pendidikan Profesi Apoteker",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "Prof",
      "tahunLulus": 2025,
      "tahun_lulus": 2025,
      "ipk": 4,
      "sksLulus": 21,
      "sks_lulus": 21,
      "predikatLulus": "Dengan Pujian (Cum Laude)",
      "predikat_lulus": "Dengan Pujian (Cum Laude)",
      "statusKelulusan": "Aktif",
      "statusKeaktifan": "Lulus",
      "status_keaktifan": "Lulus"
    },
    {
      "nim": "24020005",
      "nama": "Gde Andika Mahardika Rai",
      "angkatan": "2024 Genap",
      "programStudi": "Magister Bio Manajemen",
      "program_studi": "Magister Bio Manajemen",
      "fakultas": "Bisnis dan Manajemen",
      "jenjang": "S2",
      "tahunLulus": 2025,
      "tahun_lulus": 2025,
      "ipk": 3.85,
      "sksLulus": 39,
      "sks_lulus": 39,
      "predikatLulus": "Dengan Pujian (Cum Laude)",
      "predikat_lulus": "Dengan Pujian (Cum Laude)",
      "statusKelulusan": "Cum Laude",
      "statusKeaktifan": "Lulus",
      "status_keaktifan": "Lulus"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 969,
    "totalPages": 194
  }
}
```

---

### `GET /api/mbkm/summary`
**Description:** Retrieves aggregated KPI summary for MBKM dashboard, including participation rates.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/summary" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "selectedPeriode": "20261",
  "previousPeriode": "20252",
  "summary": {
    "persentaseMbkm": {
      "mbkmCount": 130,
      "eligibleCount": 133,
      "percentage": 97.74
    },
    "totalMbkmAktif": 130,
    "totalEligible": 133,
    "totalMitra": 11
  },
  "kpis": {
    "totalParticipants": 130,
    "selesaiCount": 0,
    "evaluasiCount": 0,
    "berjalanCount": 130,
    "participationRate": "97.7%",
    "eligibleCount": 133
  },
  "filterOptions": {
    "periode": [
      "20261",
      "20252",
      "20251",
      "20242",
      "20241",
      "20231",
      "20222",
      "20221",
      "20212",
      "20211"
    ],
    "fakultas": [
      "Bisnis dan Manajemen",
      "Ilmu Kesehatan dan Biosains"
    ],
    "programStudi": [
      "Bio Informatika",
      "Bio Medis dan Rekayasa Hayati",
      "Bio Medis dan Rekayasa Hayati (Akun Lama)",
      "Bio Teknologi",
      "Bio Teknologi (Akun Lama)",
      "Farmasi",
      "Innovation & Entrepreneurship (Akun Lama)",
      "Manajemen Bisnis Internasional",
      "Manajemen Bisnis Internasional (Akun Lama)",
      "Pangan dan Nutrisi",
      "Pangan dan Nutrisi (Akun Lama)",
      "Teknologi Pangan",
      "Teknologi Pangan (Akun Lama)"
    ],
    "angkatan": [
      "2025 Ganjil",
      "2024 Genap",
      "2023 Genap",
      "2022 Genap",
      "2021 Genap",
      "2020 Genap",
      "2019 Genap",
      "2018 Genap"
    ],
    "statusAktivitas": [
      "Diajukan",
      "Dibatalkan",
      "Disetujui",
      "Ditolak",
      "Selesai"
    ],
    "jenjang": [
      "S1"
    ]
  }
}
```

---

### `GET /api/mbkm/list`
**Description:** Paginated list of MBKM activities.

**Query Parameters Example:** `page=1&limit=5`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/list?page=1&limit=5" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "no": 1,
      "nim": "23010001",
      "nama": "ABIALEXIA WANA",
      "periode": "20261",
      "angkatan": "2023 Genap",
      "programStudi": "Bio Teknologi",
      "program_studi": "Bio Teknologi",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "statusKeaktifan": "Program Penelitian Riset TEEP di National Ilan University, Taiwan",
      "status_keaktifan": "Program Penelitian Riset TEEP di National Ilan University, Taiwan",
      "jenisAktivitas": "Penelitian/Riset (Kampus Merdeka)",
      "jenis_kegiatan": "Penelitian/Riset (Kampus Merdeka)",
      "aktivitas": "Penelitian/Riset (Kampus Merdeka)",
      "bentuk_kegiatan": "Penelitian/Riset (Kampus Merdeka)",
      "judulAktivitas": "Program Penelitian Riset TEEP di National Ilan University, Taiwan",
      "mitra": "National Ilan University",
      "instansi": "National Ilan University",
      "statusAktivitas": "Disetujui",
      "status_aktivitas": "Disetujui",
      "status_kegiatan": "Disetujui",
      "tahun": "2026",
      "tahun_kegiatan": "2026"
    },
    {
      "no": 2,
      "nim": "23010002",
      "nama": "AGNES ANGELIKA TANESHA",
      "periode": "20261",
      "angkatan": "2023 Genap",
      "programStudi": "Pangan dan Nutrisi",
      "program_studi": "Pangan dan Nutrisi",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "statusKeaktifan": "Industrial Internship: Research and Innovation Intern at Orang Tua Group, division Coffee and Drinks",
      "status_keaktifan": "Industrial Internship: Research and Innovation Intern at Orang Tua Group, division Coffee and Drinks",
      "jenisAktivitas": "Magang/Praktik Kerja (Kampus Merdeka)",
      "jenis_kegiatan": "Magang/Praktik Kerja (Kampus Merdeka)",
      "aktivitas": "Magang/Praktik Kerja (Kampus Merdeka)",
      "bentuk_kegiatan": "Magang/Praktik Kerja (Kampus Merdeka)",
      "judulAktivitas": "Industrial Internship: Research and Innovation Intern at Orang Tua Group, division Coffee and Drinks",
      "mitra": "PT Pepper Tree Investama (OT Group)",
      "instansi": "PT Pepper Tree Investama (OT Group)",
      "statusAktivitas": "Disetujui",
      "status_aktivitas": "Disetujui",
      "status_kegiatan": "Disetujui",
      "tahun": "2026",
      "tahun_kegiatan": "2026"
    },
    {
      "no": 3,
      "nim": "23010003",
      "nama": "ALIA SAFIRA MANSJOER",
      "periode": "20261",
      "angkatan": "2023 Genap",
      "programStudi": "Bio Teknologi",
      "program_studi": "Bio Teknologi",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "statusKeaktifan": "Evaluasi Metode Kromatografi Cair-Spektrometri Massa Tandem Berbasis Aminasi Reduktif yang Dioptimalkan untuk Deteksi Metabolit Asam Amino dalam Plasma",
      "status_keaktifan": "Evaluasi Metode Kromatografi Cair-Spektrometri Massa Tandem Berbasis Aminasi Reduktif yang Dioptimalkan untuk Deteksi Metabolit Asam Amino dalam Plasma",
      "jenisAktivitas": "Penelitian/Riset (Kampus Merdeka)",
      "jenis_kegiatan": "Penelitian/Riset (Kampus Merdeka)",
      "aktivitas": "Penelitian/Riset (Kampus Merdeka)",
      "bentuk_kegiatan": "Penelitian/Riset (Kampus Merdeka)",
      "judulAktivitas": "Evaluasi Metode Kromatografi Cair-Spektrometri Massa Tandem Berbasis Aminasi Reduktif yang Dioptimalkan untuk Deteksi Metabolit Asam Amino dalam Plasma",
      "mitra": "Kaohsiung Medical University",
      "instansi": "Kaohsiung Medical University",
      "statusAktivitas": "Disetujui",
      "status_aktivitas": "Disetujui",
      "status_kegiatan": "Disetujui",
      "tahun": "2026",
      "tahun_kegiatan": "2026"
    },
    {
      "no": 4,
      "nim": "22010020",
      "nama": "ALLAN KRISHNA HANT AL ASAD",
      "periode": "20261",
      "angkatan": "2022 Genap",
      "programStudi": "Teknologi Pangan",
      "program_studi": "Teknologi Pangan",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "statusKeaktifan": "The Development of Albumin Enriched Channa Striata Powder",
      "status_keaktifan": "The Development of Albumin Enriched Channa Striata Powder",
      "jenisAktivitas": "Magang/Praktik Kerja (Kampus Merdeka)",
      "jenis_kegiatan": "Magang/Praktik Kerja (Kampus Merdeka)",
      "aktivitas": "Magang/Praktik Kerja (Kampus Merdeka)",
      "bentuk_kegiatan": "Magang/Praktik Kerja (Kampus Merdeka)",
      "judulAktivitas": "The Development of Albumin Enriched Channa Striata Powder",
      "mitra": "-",
      "instansi": "-",
      "statusAktivitas": "Disetujui",
      "status_aktivitas": "Disetujui",
      "status_kegiatan": "Disetujui",
      "tahun": "2026",
      "tahun_kegiatan": "2026"
    },
    {
      "no": 5,
      "nim": "23010004",
      "nama": "ANASTASIA SELINA NATA",
      "periode": "20261",
      "angkatan": "2023 Genap",
      "programStudi": "Bio Teknologi",
      "program_studi": "Bio Teknologi",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "jenjang": "S1",
      "statusKeaktifan": "Regulatory Affairs and Research & Development (R&D) Intern",
      "status_keaktifan": "Regulatory Affairs and Research & Development (R&D) Intern",
      "jenisAktivitas": "Magang/Praktik Kerja (Kampus Merdeka)",
      "jenis_kegiatan": "Magang/Praktik Kerja (Kampus Merdeka)",
      "aktivitas": "Magang/Praktik Kerja (Kampus Merdeka)",
      "bentuk_kegiatan": "Magang/Praktik Kerja (Kampus Merdeka)",
      "judulAktivitas": "Regulatory Affairs and Research & Development (R&D) Intern",
      "mitra": "PT Mersifarma Tirmaku Mercusana",
      "instansi": "PT Mersifarma Tirmaku Mercusana",
      "statusAktivitas": "Disetujui",
      "status_aktivitas": "Disetujui",
      "status_kegiatan": "Disetujui",
      "tahun": "2026",
      "tahun_kegiatan": "2026"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 549,
    "totalPages": 110
  }
}
```

---

### `GET /api/mbkm/distribution`
**Description:** Aggregated MBKM distributions by activity type, program, status, and partner.

**Query Parameters Example:** `periode=20261`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/distribution?periode=20261" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "selectedPeriode": "20261",
  "byActivityType": [
    {
      "name": "Magang/Praktik Kerja (Kampus Merdeka)",
      "count": 67,
      "percentage": "51.5%"
    },
    {
      "name": "Penelitian/Riset (Kampus Merdeka)",
      "count": 55,
      "percentage": "42.3%"
    },
    {
      "name": "Pertukaran Pelajar (Kampus Merdeka)",
      "count": 6,
      "percentage": "4.6%"
    },
    {
      "name": "Kegiatan Wirausaha (Kampus Merdeka)",
      "count": 2,
      "percentage": "1.5%"
    }
  ],
  "byProdi": [
    {
      "name": "Bio Teknologi",
      "count": 41,
      "percentage": "31.5%"
    },
    {
      "name": "Bio Medis dan Rekayasa Hayati",
      "count": 33,
      "percentage": "25.4%"
    },
    {
      "name": "Teknologi Pangan",
      "count": 23,
      "percentage": "17.7%"
    },
    {
      "name": "Manajemen Bisnis Internasional",
      "count": 13,
      "percentage": "10.0%"
    },
    {
      "name": "Pangan dan Nutrisi",
      "count": 11,
      "percentage": "8.5%"
    },
    {
      "name": "Farmasi",
      "count": 9,
      "percentage": "6.9%"
    }
  ],
  "byFaculty": [],
  "byMitra": [
    {
      "name": "Indonesia International Institute for Life-Sciences (i3L)",
      "count": 4,
      "percentage": "22.2%"
    },
    {
      "name": "I3L",
      "count": 3,
      "percentage": "16.7%"
    },
    {
      "name": "Indonesia International Institute for Life-Science",
      "count": 2,
      "percentage": "11.1%"
    },
    {
      "name": "Taipei Medical University",
      "count": 2,
      "percentage": "11.1%"
    },
    {
      "name": "FT41931 - Industrial Internship",
      "count": 1,
      "percentage": "5.6%"
    },
    {
      "name": "Hudson Institute of Medical Research",
      "count": 1,
      "percentage": "5.6%"
    },
    {
      "name": "Mahidol University",
      "count": 1,
      "percentage": "5.6%"
    },
    {
      "name": "PT Eralink Tour Travel Planner",
      "count": 1,
      "percentage": "5.6%"
    },
    {
      "name": "PT Herba Utama",
      "count": 1,
      "percentage": "5.6%"
    },
    {
      "name": "PT Rivareno Monochrome Nusantara",
      "count": 1,
      "percentage": "5.6%"
    }
  ],
  "byStatus": [
    {
      "name": "Disetujui",
      "count": 130,
      "percentage": "94.9%"
    },
    {
      "name": "Dibatalkan",
      "count": 4,
      "percentage": "2.9%"
    },
    {
      "name": "Ditolak",
      "count": 2,
      "percentage": "1.5%"
    },
    {
      "name": "Diajukan",
      "count": 1,
      "percentage": "0.7%"
    }
  ],
  "data": {
    "byActivityType": [
      {
        "name": "Magang/Praktik Kerja (Kampus Merdeka)",
        "count": 67,
        "percentage": "51.5%"
      },
      {
        "name": "Penelitian/Riset (Kampus Merdeka)",
        "count": 55,
        "percentage": "42.3%"
      },
      {
        "name": "Pertukaran Pelajar (Kampus Merdeka)",
        "count": 6,
        "percentage": "4.6%"
      },
      {
        "name": "Kegiatan Wirausaha (Kampus Merdeka)",
        "count": 2,
        "percentage": "1.5%"
      }
    ],
    "byProdi": [
      {
        "name": "Bio Teknologi",
        "count": 41,
        "percentage": "31.5%"
      },
      {
        "name": "Bio Medis dan Rekayasa Hayati",
        "count": 33,
        "percentage": "25.4%"
      },
      {
        "name": "Teknologi Pangan",
        "count": 23,
        "percentage": "17.7%"
      },
      {
        "name": "Manajemen Bisnis Internasional",
        "count": 13,
        "percentage": "10.0%"
      },
      {
        "name": "Pangan dan Nutrisi",
        "count": 11,
        "percentage": "8.5%"
      },
      {
        "name": "Farmasi",
        "count": 9,
        "percentage": "6.9%"
      }
    ],
    "byFaculty": [],
    "byMitra": [
      {
        "name": "Indonesia International Institute for Life-Sciences (i3L)",
        "count": 4,
        "percentage": "22.2%"
      },
      {
        "name": "I3L",
        "count": 3,
        "percentage": "16.7%"
      },
      {
        "name": "Indonesia International Institute for Life-Science",
        "count": 2,
        "percentage": "11.1%"
      },
      {
        "name": "Taipei Medical University",
        "count": 2,
        "percentage": "11.1%"
      },
      {
        "name": "FT41931 - Industrial Internship",
        "count": 1,
        "percentage": "5.6%"
      },
      {
        "name": "Hudson Institute of Medical Research",
        "count": 1,
        "percentage": "5.6%"
      },
      {
        "name": "Mahidol University",
        "count": 1,
        "percentage": "5.6%"
      },
      {
        "name": "PT Eralink Tour Travel Planner",
        "count": 1,
        "percentage": "5.6%"
      },
      {
        "name": "PT Herba Utama",
        "count": 1,
        "percentage": "5.6%"
      },
      {
        "name": "PT Rivareno Monochrome Nusantara",
        "count": 1,
        "percentage": "5.6%"
      }
    ],
    "byStatus": [
      {
        "name": "Disetujui",
        "count": 130,
        "percentage": "94.9%"
      },
      {
        "name": "Dibatalkan",
        "count": 4,
        "percentage": "2.9%"
      },
      {
        "name": "Ditolak",
        "count": 2,
        "percentage": "1.5%"
      },
      {
        "name": "Diajukan",
        "count": 1,
        "percentage": "0.7%"
      }
    ]
  }
}
```

---

### `GET /api/mbkm/analytics/rate`
**Description:** Participation rate analytics comparing participants to eligible students.

**Query Parameters Example:** `periode=20261`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/analytics/rate?periode=20261" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "message": "Berhasil memuat analisis partisipasi MBKM vs Mahasiswa Eligible",
  "selectedPeriode": "20261",
  "data": {
    "participantStats": {
      "count": 130,
      "disetujuiCount": 130,
      "selesaiCount": 0
    },
    "eligibleCount": 133,
    "eligibleRate": {
      "percentage": "97.7%",
      "numPercentage": 97.74,
      "meetsTarget": true,
      "targetIku2": 20,
      "badge": "Target IKU-2 Tercapai"
    },
    "facultyData": [
      {
        "name": "Ilmu Kesehatan dan Biosains",
        "count": 117,
        "percentage": "90.0%"
      },
      {
        "name": "Bisnis dan Manajemen",
        "count": 13,
        "percentage": "10.0%"
      }
    ]
  }
}
```

---

### `GET /api/mbkm/analytics/activity-distribution`
**Description:** Distribution of MBKM activities by activity category.

**Query Parameters Example:** `periode=20261`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/analytics/activity-distribution?periode=20261" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "message": "Berhasil memuat distribusi jenis aktivitas MBKM",
  "selectedPeriode": "20261",
  "data": {
    "total": 130,
    "items": [
      {
        "name": "Magang/Praktik Kerja (Kampus Merdeka)",
        "count": 67,
        "percentage": "51.5%"
      },
      {
        "name": "Penelitian/Riset (Kampus Merdeka)",
        "count": 55,
        "percentage": "42.3%"
      },
      {
        "name": "Pertukaran Pelajar (Kampus Merdeka)",
        "count": 6,
        "percentage": "4.6%"
      },
      {
        "name": "Kegiatan Wirausaha (Kampus Merdeka)",
        "count": 2,
        "percentage": "1.5%"
      }
    ]
  }
}
```

---

### `GET /api/mbkm/analytics/prodi-distribution`
**Description:** Distribution of MBKM activities by study program.

**Query Parameters Example:** `periode=20261`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/analytics/prodi-distribution?periode=20261" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "message": "Berhasil memuat sebaran program studi MBKM",
  "selectedPeriode": "20261",
  "data": {
    "total": 130,
    "items": [
      {
        "name": "Bio Teknologi",
        "count": 41,
        "percentage": "31.5%"
      },
      {
        "name": "Bio Medis dan Rekayasa Hayati",
        "count": 33,
        "percentage": "25.4%"
      },
      {
        "name": "Teknologi Pangan",
        "count": 23,
        "percentage": "17.7%"
      },
      {
        "name": "Manajemen Bisnis Internasional",
        "count": 13,
        "percentage": "10.0%"
      },
      {
        "name": "Pangan dan Nutrisi",
        "count": 11,
        "percentage": "8.5%"
      },
      {
        "name": "Farmasi",
        "count": 9,
        "percentage": "6.9%"
      }
    ]
  }
}
```

---

### `GET /api/mbkm/analytics/status-distribution`
**Description:** Distribution of MBKM activities by verification/approval status.

**Query Parameters Example:** `periode=20261`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/analytics/status-distribution?periode=20261" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "message": "Berhasil memuat status verifikasi dan evaluasi MBKM",
  "selectedPeriode": "20261",
  "data": {
    "total": 137,
    "items": [
      {
        "name": "Disetujui",
        "count": 130,
        "percentage": "94.9%"
      },
      {
        "name": "Dibatalkan",
        "count": 4,
        "percentage": "2.9%"
      },
      {
        "name": "Ditolak",
        "count": 2,
        "percentage": "1.5%"
      },
      {
        "name": "Diajukan",
        "count": 1,
        "percentage": "0.7%"
      }
    ]
  }
}
```

---

### `GET /api/mbkm/analytics/eligible-students`
**Description:** Retrieves total number of students eligible for MBKM (semester 7 equivalent).

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/analytics/eligible-students" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "message": "Berhasil memuat data mahasiswa eligible semester 7",
  "data": {
    "eligibleCount": 133,
    "prodiData": [
      {
        "name": "Bio Teknologi",
        "count": 38,
        "percentage": "28.6%"
      },
      {
        "name": "Bio Medis dan Rekayasa Hayati",
        "count": 33,
        "percentage": "24.8%"
      },
      {
        "name": "Teknologi Pangan",
        "count": 24,
        "percentage": "18.0%"
      },
      {
        "name": "Manajemen Bisnis Internasional",
        "count": 13,
        "percentage": "9.8%"
      },
      {
        "name": "Pangan dan Nutrisi",
        "count": 13,
        "percentage": "9.8%"
      },
      {
        "name": "Farmasi",
        "count": 9,
        "percentage": "6.8%"
      },
      {
        "name": "Biomanajemen (Akun Lama)",
        "count": 2,
        "percentage": "1.5%"
      },
      {
        "name": "Magister Bio Manajemen",
        "count": 1,
        "percentage": "0.8%"
      }
    ]
  }
}
```

---

### `GET /api/mbkm/analytics/mitra-distribution`
**Description:** Distribution of MBKM partners (mitra).

**Query Parameters Example:** `periode=20252`

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/mbkm/analytics/mitra-distribution?periode=20252" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 500):**
```json
{
  "success": false,
  "message": "Gagal mengambil data mitra.",
  "error": "prisma is not defined"
}
```

---

### `GET /api/sync/status`
**Description:** Retrieves the current background sync job tracker status.

**cURL Command:**
```bash
curl -X GET "http://localhost:3000/api/sync/status" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "status": "failed",
    "currentModule": "students",
    "progress": {
      "students": {
        "status": "running",
        "current_page": 1,
        "total_pages": 25,
        "total_synced": 2488,
        "skipped": 0
      },
      "graduates": {
        "status": "completed",
        "current_page": 10,
        "total_pages": 10,
        "total_synced": 969,
        "skipped": 0
      },
      "mbkm": {
        "status": "completed",
        "current_page": 7,
        "total_pages": 7,
        "total_synced": 603,
        "skipped": 0
      }
    },
    "startedAt": "2026-09-21T04:59:19.609Z",
    "finishedAt": "2026-09-21T04:59:19.885Z",
    "lastError": {
      "errors": {
        "code": 403,
        "detail": "IP tidak terdaftar di whitelist pada API key anda. Pastikan IP public anda terdaftar di whitelist."
      }
    }
  }
}
```

---

### `POST /api/sync/students`
**Description:** Triggers background ETL synchronization for Student data from SEVIMA API.

**Query Parameters Example:** `async=true`

**cURL Command:**
```bash
curl -X POST "http://localhost:3000/api/sync/students?async=true" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 202):**
```json
{
  "success": true,
  "message": "Sinkronisasi mahasiswa dimulai di background (Asynchronous Job).",
  "statusUrl": "/api/sync/status"
}
```

---

### `POST /api/sync/graduates`
**Description:** Triggers background ETL synchronization for Graduates data from SEVIMA API.

**Query Parameters Example:** `async=true`

**cURL Command:**
```bash
curl -X POST "http://localhost:3000/api/sync/graduates?async=true" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 409):**
```json
{
  "success": false,
  "message": "Proses sinkronisasi lain sedang berjalan. Tunggu hingga selesai.",
  "statusUrl": "/api/sync/status"
}
```

---

### `POST /api/sync/mbkm`
**Description:** Triggers background ETL synchronization for MBKM data from SEVIMA API.

**Query Parameters Example:** `async=true`

**cURL Command:**
```bash
curl -X POST "http://localhost:3000/api/sync/mbkm?async=true" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 409):**
```json
{
  "success": false,
  "message": "Proses sinkronisasi lain sedang berjalan. Tunggu hingga selesai.",
  "statusUrl": "/api/sync/status"
}
```

---

### `POST /api/sync/all`
**Description:** Triggers background ETL synchronization for all data sequentially.

**Query Parameters Example:** `async=true`

**cURL Command:**
```bash
curl -X POST "http://localhost:3000/api/sync/all?async=true" -H "x-api-key: komet-secret-sync-key-2026"
```

**Real Response (Status 409):**
```json
{
  "success": false,
  "message": "Proses sinkronisasi lain sedang berjalan. Tunggu hingga selesai.",
  "statusUrl": "/api/sync/status"
}
```

---
