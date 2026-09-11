# InternConnect Frontend

React + Vite frontend for InternHub/InternConnect.

## Prerequisites

- Node.js 22+
- Backend running at `http://localhost:3000`

## Environment

Copy `.env.example` to `.env` when custom values are needed.

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
PORT=5173
```

`VITE_API_URL` defaults to `http://localhost:3000/api/v1`, so the Auth flow works locally even when the variable is omitted.

## Start locally

```bash
npm install
npm run dev
```

The frontend listens on `http://localhost:5173`. The backend uses port `3000`.

For a production-style check:

```bash
npm run build
npm run start
```

## Authentication flow

Public routes:

- `/login`
- `/register`

Protected role routes:

- `/student`
- `/company`
- `/lecturer`
- `/admin`

Public registration only supports `STUDENT` and `COMPANY`. Admin and lecturer accounts must be created by seed/admin tooling.

The client follows these session rules:

- The access token is kept in memory and attached to API requests as a Bearer token.
- The refresh token is stored only in the backend-issued HttpOnly cookie.
- Axios sends credentials for Auth requests.
- When a protected API returns `401`, Axios calls `/auth/refresh` once and retries the original request.
- A page reload restores the session using the refresh cookie, then calls `/auth/me`.
- Users attempting to open another role's route are redirected to their own dashboard.
- Logout revokes the refresh session, clears the cookie and returns to `/login`.

## Verification

```bash
npm run lint
npm run build
```

The application uses the NestJS backend for authentication, profiles, internships, applications, placements, reports, evaluations, notifications and chat. The frontend includes email verification, forgot/reset password, student project management and role-specific workflows. Run the backend and configure the API environment before using protected features.

## Internship recommendations

The Student Internship tab contains a “Dành cho bạn” section. It reads cached recommendations from the NestJS API, displays profile readiness, lets students save role/location/work-type preferences, and lets them explicitly create or refresh recommendations.

- Scores and ranking come from the backend; normal internship cards do not invent a match percentage.
- Only cards whose response contains a valid detailed explanation display that explanation.
- Recommendation cards reuse the existing detail and application flow.
- The browser never receives an AI API key, prompt, model name or full student profile for recommendation generation.

To use the feature locally, run the backend with the recommendation environment variables described in `Backend/.env.example`, then sign in as a student with a completed profile.
