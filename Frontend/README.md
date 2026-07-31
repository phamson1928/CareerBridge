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

The current dashboard features still use mock domain data. Week 1 authentication and routing use the real NestJS backend.

## Optional AI features

The existing AI CV helper requires:

```dotenv
GEMINI_API_KEY=...
```

Authentication does not depend on the Gemini key.
