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
