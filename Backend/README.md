# InternHub Backend

NestJS + PostgreSQL + Prisma backend for the internship-management platform.

## Prerequisites

- Node.js 22+
- PostgreSQL 16+

## Start locally

1. Copy `.env.example` to `.env` and set a local PostgreSQL `DATABASE_URL` plus a strong `JWT_SECRET`.
2. Install packages: `npm install`.
3. Create the database schema: `npm exec prisma migrate dev -- --name init`.
4. Start the API: `npm run start:dev`.

### Development seed accounts

Run `npm exec prisma db seed` to create or update one active account for each role. The command is idempotent and uses `SEED_PASSWORD` when provided, otherwise `Seed@123456`.

| Role | Email |
| --- | --- |
| ADMIN | admin@internhub.local |
| STUDENT | student@internhub.local |
| LECTURER | lecturer@internhub.local |
| COMPANY | company@internhub.local |

These credentials are for local/development testing only. Do not use them in production.

`npm install` and `npm run build` both generate Prisma Client into `src/generated/prisma`. This directory is intentionally not committed. Migrations under `prisma/migrations` are source code and must be committed.

## Domain model

The central entity is `InternshipPlacement`: it represents one confirmed internship after a company accepts an application. Reports, supervision, and evaluations are tied to this entity, so data remains unambiguous across semesters and companies.

```text
Semester → Internship ← Application → Student
                           ↓ accepted
                     InternshipPlacement
                     ├── Supervision
                     ├── Report (one per week)
                     └── Evaluation (one company + one lecturer)
```

Key rules enforced by the schema:

- An application is unique per student and internship.
- A placement belongs to exactly one accepted application.
- A report is unique per placement and week.
- A placement has at most one lecturer supervision.
- Company and lecturer evaluations are separate and unique per placement.
- Files use a private `storageKey`; the application generates signed URLs instead of persisting public URLs.

Business rules that depend on current state must be enforced in services/transactions:

- Only an approved company can publish an internship.
- Only an open, non-expired internship can receive an application.
- Accepting an application must atomically create the placement, status history, conversation, and increment `filledSlots`.
- A student may have at most one active placement in a semester.
- The evaluation author must be the placement company account or its assigned lecturer.

## Module boundaries

Each feature currently has an intentionally empty Nest module, ready to receive its controller, DTOs, service, and tests:

```text
src/
├── auth                 # JWT, refresh tokens, authentication
├── users                # Admin user and role management
├── students             # Profiles, projects, CV, skills
├── lecturers            # Lecturer profiles
├── companies            # Company registration and verification
├── semesters            # Internship terms
├── skills               # Canonical skills and matching metadata
├── recommendations       # Deterministic internship ranking, cache and optional explanations
├── internships          # Internship posts
├── applications         # Application workflow
├── placements           # Confirmed internship lifecycle
├── supervisions         # Lecturer assignment
├── reports              # Weekly reports and reviews
├── evaluations          # Company/lecturer evaluations
├── files                # Storage metadata and access policy
├── chat                 # Application-scoped conversations
├── notifications        # In-app notifications
├── dashboard            # Read-only aggregate views
├── audit-logs           # Security and operational audit trail
├── common               # Guards, decorators, filters, interceptors
└── prisma               # Prisma service
```

## Verification

```bash
npm run build
npm test
```

## Internship recommendations

Student users can save job preferences and generate up to 10 eligible internship recommendations. Ranking is computed deterministically in the backend from profile signals, skills, projects and preferences. An optional external AI provider may only produce a Vietnamese explanation for the first three already-ranked results; it cannot change score or order.

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/v1/students/me/job-preferences` | Current student |
| `PUT` | `/api/v1/students/me/job-preferences` | Current student |
| `GET` | `/api/v1/recommendations/internships/me` | Current student |
| `POST` | `/api/v1/recommendations/internships/me/generate` | Current student |

The `GET` endpoint reads a valid cache only; it never calls the AI provider. `POST` generates or returns a matching cached result. A forced refresh is rate-limited and has a per-student 10-minute cooldown. If an AI call fails or the profile lacks enough signals, the deterministic result remains available.

Set these backend-only variables in `.env`:

```dotenv
AI_RECOMMENDATIONS_ENABLED=false
GEMINI_API_KEY=
AI_RECOMMENDATION_MODEL=gemini-3.5-flash-lite
AI_RECOMMENDATION_TIMEOUT_MS=8000
AI_RECOMMENDATION_CACHE_TTL_MINUTES=360
```

When enabled, `GEMINI_API_KEY` is required at startup. Do not expose it to the frontend or commit it. The provider receives only the minimum profile signals required for an explanation; it never receives email, phone, student code, CV or application history.

For a repeatable REST regression, see `../docs/testing/ai-recommendations/`.
