# Week 7 Person A — Backend regression results

| Suite | Scope | Result | Notes |
| --- | --- | --- | --- |
| `05-notification-audit.ps1` | Audit API RBAC, validation, detail, read-only routes | PASS | Verified against seeded local database on 2026-08-25. |
| `04-supervision-report-evaluation.ps1` | Evaluation Company/Lecturer CRUD, authorization, audit lookup | PASS | Uses `seed-placement-active`; created evaluation records are deleted by the script and their immutable audit logs remain. |
| Backend build | Nest compilation | PASS | `nest build` passed after all Week 7 backend changes. |
| Throttling error contract | Login rate limit | PASS | Sixth login returns `429 TOO_MANY_REQUESTS`. |

## Remaining manual checks

- Application accept remains atomic and creates both Placement and Conversation.
- Notification and Chat realtime events need a Socket.IO client or browser; `curl` only validates REST endpoints.
- Inspect Audit metadata for unexpected sensitive values after each new mutation path.