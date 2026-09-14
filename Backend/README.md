# InternHub Backend

NestJS + PostgreSQL + Prisma backend for the internship-management platform.

## Prerequisites

- Node.js 22+
- PostgreSQL 16+

## Start locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, a strong `JWT_SECRET`, and valid `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` values.
2. Install packages: `npm install`.
3. Apply local migrations: `npm exec prisma migrate dev`.
4. Start the API: `npm run start:dev`.

Use `npm exec prisma migrate deploy` for a shared or production database. `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are optional, but must be configured together when file storage is enabled.

### Development seed accounts

Run `npm exec prisma db seed` to create or update one active account for each role. The command is idempotent and uses `SEED_PASSWORD` when provided, otherwise `Seed@123456`.

| Role     | Email                    |
| -------- | ------------------------ |
| ADMIN    | admin@internhub.local    |
| STUDENT  | student@internhub.local  |
| LECTURER | lecturer@internhub.local |
| COMPANY  | company@internhub.local  |

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
- A student may have at most one `PENDING` or `ACTIVE` placement in a semester.
- Proposed internship dates must be both empty or both inside the semester monitoring window.
- Admin must set both placement monitoring dates before lecturer assignment; those dates become immutable when academic monitoring starts.
- Report weeks are counted from the placement start date and cannot be submitted before that week begins.
- The evaluation author must be the placement company account or its assigned lecturer.

## Module boundaries

The following implemented Nest modules own their controller, DTOs, service, and authorization rules:

```text
src/
├── auth                 # JWT, refresh tokens, authentication
├── users                # Admin user and role management
├── students             # Profiles, projects, CV, skills
├── lecturers            # Lecturer profiles
├── companies            # Company registration and verification
├── semesters            # Internship campaign lifecycle
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

## Authentication lifecycle

Only `STUDENT` and `COMPANY` can self-register. Student registration requires an `@ut.edu.vn` email address. A new user starts as `PENDING_VERIFICATION`; `POST /api/v1/auth/verify-email` activates the account. Tokens for email verification expire after 24 hours. Registration no longer returns an access token or verification token; `POST /api/v1/auth/resend-verification` resends the email without revealing whether an address exists.

`POST /api/v1/auth/forgot-password` always returns the same response, then sends a 30-minute, one-time reset token only when the email exists. `POST /api/v1/auth/reset-password` consumes that token, updates the password, and revokes every active refresh token for the account. Only users with status `ACTIVE` can log in, refresh a session, or access protected endpoints.

## Verification

```bash
npm run build
npm test
```

## Internship recommendations

Student users can save job preferences and generate up to 10 eligible internship recommendations. Ranking is computed deterministically in the backend from profile signals, skills, projects and preferences. An optional external AI provider may only produce a Vietnamese explanation for the first three already-ranked results; it cannot change score or order.

| Method | Endpoint                                          | Access          |
| ------ | ------------------------------------------------- | --------------- |
| `GET`  | `/api/v1/students/me/job-preferences`             | Current student |
| `PUT`  | `/api/v1/students/me/job-preferences`             | Current student |
| `GET`  | `/api/v1/recommendations/internships/me`          | Current student |
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

## Company verification

Company onboarding has two separate states:

1. The account must verify its email before it can use protected APIs.
2. The company profile starts as `DRAFT` and must be submitted for admin review.

The submitted profile must contain the legal company name, business registration number, registered address, contact person, contact phone, contact email, and a private PDF/JPG/PNG business-registration document (maximum 10 MB). Only `DRAFT` and `REJECTED` profiles can call `POST /api/v1/companies/me/submit-verification`; a successful submission resets prior review metadata and moves the profile to `PENDING`. A `PENDING` or `SUSPENDED` profile cannot be edited. Only an admin can approve or reject a `PENDING` profile; rejection and suspension require a reason of at least three characters. An approved company may later be `SUSPENDED` for a recorded reason.

Only `APPROVED` companies can create, edit, publish, or manage internships. After approval, legal identity fields (company name, registration number, address, contact person, phone, email, and registration document) are locked. Each submission/review/suspension creates an audit record and review decisions notify the company. Admin review endpoints are `GET /api/v1/companies`, `GET /api/v1/companies/:id`, `POST /api/v1/companies/:id/approve`, `POST /api/v1/companies/:id/reject`, and `POST /api/v1/companies/:id/suspend`.
