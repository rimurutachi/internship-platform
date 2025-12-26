# Intern-Galing Platform - AI Agent Instructions

## Architecture & Services
- Four services: `backend` (Express, REST + Socket.io, port 5000), `document-service` (Express + Socket.io, HTTP 6000 / WS 6001), `ai-service` (FastAPI, port 8000), `frontend` (Next.js 15 + Turbopack, port 3000).
- Shared infra: Supabase Postgres + Supabase Auth, Redis for sessions/caching; no local DB migrations—see Supabase dashboard and `docs/DATABASE_SCHEMA.md` for security/audit tables.
- Backend exposes REST under `/api/*` plus Socket.io; document-service has REST `/api/documents` and WS for collaboration.

## Auth & Access Control
- Supabase-first JWT: backend `middleware/auth.ts` validates tokens, `requireRole` gates admin-only routes; test mode honors `TEST_USER_ROLE`.
- Frontend login + role selection: `src/lib/auth.ts`, `src/components/auth/ProtectedRoute.tsx`; use `createSupabaseClient`/`createSupabaseServer` for client/server contexts.
- Sessions persist via Supabase; `logout()` also pings backend `/auth/logout` then signs out client.

## Real-Time & Sockets
- Backend Socket.io rooms: `conversation:{id}`, `user:{userId}`, `evaluation:{id}`. Events emitted via `src/socket/emitters.ts`: `new_message`, `message_edited`, `message_deleted`, `new_notification`, `notification_count_updated`, `evaluation_updated`, `conversation_updated`.
- Frontend wrapper: `src/lib/backendSocket.ts` uses `NEXT_PUBLIC_BACKEND_SOCKET_URL`; ensures auth token from Supabase before connecting.
- Document collaboration WS: `document:join|leave|update` via `src/lib/documentSocket.ts`; connect to `NEXT_PUBLIC_WEBSOCKET_URL` (WS port 6001).

## Frontend Conventions
- Role-specific app routes at `src/app/dashboard/{student|advisor|supervisor|admin}/`; matching components in `src/components/{role}/`.
- Mobile-first: `useIsMobile()`; `components/mobile/BottomNavigation` (hidden on lg+), `components/mobile/MobileHeader`; desktop sidebars use shadcn with mobile sheet overlay.
- Shared types in `src/types/*` (api, dashboard, documents, internships-enhanced, etc.); API client lives in `src/lib/api/*`.

## AI Service (FastAPI)
- Real endpoints in `ai-service/main.py`: `/api/evaluate` (LLT + sentiment), `/api/evaluate-with-bias` (Phase 1 enhanced w/ bias detection), `/api/evaluate-post-approval` (insights on approved evals), `/api/batch-evaluate` (admin batch reports). Uses `services/ai_engine.py` and helpers (bias detector, enhanced sentiment, feature extractor).
- Health check verifies engine state (`/health`). Keep requests >=10 chars; validation raises 400/422 accordingly.

## Development Workflow
- Quick start (manual): `npm run dev` in frontend; `npm run dev` in backend; `npm run dev` in document-service; `uvicorn main:app --reload --port 8000` in ai-service (with venv).
- Batch start: `docs/updated-fixes/start-all-services.sh` uses PM2 for backend and background processes for others (logs in `logs/`).
- Tests: backend `npm test` (Jest + ts-jest, mocks Supabase in `tests/setup.ts`); frontend `npm test`; AI service has `test_phase1.py`/shell helpers in `docs/updated-fixes/test-ai-*.sh`.

## Environment Variables (see each `.env.example`)
- Backend: `PORT`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `AI_SERVICE_URL`.
- Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BACKEND_SOCKET_URL`, `NEXT_PUBLIC_WEBSOCKET_URL` (use WS 6001), `NEXT_PUBLIC_APP_URL`.
- Document-service: `PORT`, `WEBSOCKET_PORT`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, `REDIS_URL`.
- AI-service: `PORT`, optional `DATABASE_URL`; ensure venv + `requirements.txt` installed.

## Database Notes
- Schemas live in Supabase; security/audit tables documented in `docs/DATABASE_SCHEMA.md` (security_settings, login_attempts, security_alerts, system_events, etc.). Check RLS in Supabase dashboard; SQL helpers in `backend/sql/`.

## Patterns & Conventions
- Controllers thin; business logic in `backend/src/services/**` (evaluation, conversation, reports, settings, etc.). Use emitters for any socket messages.
- Validation: `middleware/validation.ts` and `communciationValidators.ts` before controllers; multer used for message attachments in `routes/communications.ts`.
- Response helpers: `backend/src/utils/responseUtils.ts` for consistent API shapes.

## Logging & Error Tracking (Critical for Debugging Fixes)

**Backend Logging** (`Node.js/Express`):
- Use `console.log()`, `console.warn()`, `console.error()` for synchronous logging (printed to stdout/stderr)
- Request tracking via `middleware/requestTracker.ts` logs API calls to `api_request_logs` table with response time + status code
- Socket events logged in `socket/socketHandler.ts`: connection/disconnection/errors per user
- Service errors logged in `services/**` before throwing (include context: user_id, object_id, operation type)
- Example: `console.error("Failed to create evaluation for student:", studentId, error);`

**Frontend Logging** (`Next.js/TypeScript`):
- Use `console.log()`, `console.error()` for development; wrap sensitive data in debug conditions
- Log auth state changes in `lib/auth.ts` and `lib/supabase.ts` (login/logout flows)
- Log socket connection status in `lib/backendSocket.ts` and `lib/documentSocket.ts` (connect/reconnect/error events)
- API calls logged in `lib/api/*` with request/response details

**AI Service Logging** (`Python/FastAPI`):
- Configured with `logging.basicConfig(level=logging.INFO)` in `main.py`
- Use `logger.info()`, `logger.error()`, `logger.warning()` with context (evaluation_id, request type)
- Input validation errors logged before raising HTTPException (show invalid text length, missing fields)
- Example: `logger.error(f"Batch evaluation failed for {len(requests)} items: {e}", exc_info=True)`

**Document Service Logging** (`Node.js`):
- Log collaboration events: `document:join`, `document:leave`, `document:update` (document_id, user_id, operation_type)
- Version control errors logged with document change diffs

**Log Output & Viewing**:
- Backend: PM2 logs → `logs/backend.log` (via `ecosystem.config.js`), real-time via `pm2 logs`
- Frontend: `logs/frontend.log` (from startup script), console via browser DevTools
- Document-service: `logs/document-service.log` (startup script), also stdout in terminal
- AI-service: `logs/ai-service.log` (startup script), also stdout in terminal
- Database logs: Check `api_request_logs`, `system_events`, `security_alerts` tables in Supabase

**Startup Script with Logs**:
- Use `docs/updated-fixes/start-all-services.sh` which redirects all output to `../logs/*.log` files
- View live logs: `tail -f logs/backend.log`, `tail -f logs/frontend.log`, etc.
- Check service health via `/health` endpoints after startup (backend, doc-service, ai-service)

**Best Practices for Fixes/Changes**:
1. **Before making a change**: Add logging at entry point (function/route) with input parameters
2. **During processing**: Log major steps (query results, transformations, validations passed/failed)
3. **On error**: Log full error message + stack trace + context (user/object affected)
4. **After change**: Check logs immediately to confirm expected behavior, catch errors early
5. **Include request ID**: Add `req.id` or trace ID to all logs for request tracing across services
6. **Log socket events**: Every Socket.io emit/on should log room name + user_id + event_type
7. **Avoid logging sensitive data**: Never log passwords, tokens, or raw personal data; log IDs instead

**Example Logging Pattern for a New Feature**:
```typescript
// In a service method (backend)
async createEvaluation(data: CreateEvaluationDTO) {
  console.log("🔵 Creating evaluation for student:", data.student_id, "supervisor:", data.supervisor_id);
  
  try {
    const result = await supabase.from("evaluations").insert(data).select().single();
    console.log("✅ Evaluation created:", result.id);
    
    emitEvaluationUpdate(result.id, { event: "evaluation_created", evaluation: result });
    console.log("📢 Socket event emitted for evaluation:", result.id);
    
    return result;
  } catch (error) {
    console.error("❌ Failed to create evaluation:", error.message, "Data:", data);
    throw error;
  }
}
```

## Common Gotchas
- Document-service WS runs on 6001 (HTTP 6000); set `NEXT_PUBLIC_WEBSOCKET_URL` accordingly.
- Backend sockets require auth token; ensure Supabase session is available before connecting.
- No Prisma migrations in-repo; DB changes are managed in Supabase—consult docs/SQL snippets before assuming schema.
- AI service now implemented (not a stub); handle 400/422 errors for short/invalid text.
- Frontend uses Turbopack (`next dev/build --turbopack`).

## Data Flow & User Workflows (5-Level Module Architecture)

### Level 1: User Management Module
**Roles & Capabilities**:
- **Student, Advisor, Supervisor**: Login-only (no self-registration; admin creates accounts)
- **Admin**: Full user lifecycle—create accounts for all roles, archive users post-internship

**Key Flows**:
- Admin creates user account → Supabase Auth user created → User assigned to dashboard
- User login → JWT token issued → Role checked from `users.role` field → Route to role-specific dashboard
- Admin archives user → `users.status` set to archived, soft-deleted from most queries

**Relevant Files**: `backend/src/routes/admin.ts`, `backend/src/middleware/auth.ts`, `frontend/src/components/auth/LoginForm.tsx`

---

### Level 2: Communication Hub Module
**Roles & Capabilities** (all equal):
- **Student, Advisor, Supervisor, Admin**: Send messages, share files to any other role
- File sharing is **direct messaging only**—does NOT appear in Document Management (Level 4)

**Key Flows**:
- User initiates message/file → `POST /api/communication/messages` (with multer for files) → stored in `conversations` & `messages` tables
- Message sent → Socket.io emits `new_message` to `conversation:{conversationId}` room
- Recipient receives real-time notification via `notification:new` event in `user:{userId}` room
- File attachments stored as message metadata (separate from document management)

**Relevant Files**: `backend/src/routes/communications.ts`, `backend/src/controllers/communicationController.ts`, `backend/src/socket/emitters.ts`

---

### Level 3: Evaluation Module
**Core Workflow**:
1. **Student** submits weekly report → visible to supervisor
2. **Supervisor** reviews, approves weekly report, submits final evaluation → visible to advisor
3. **Advisor** approves final evaluation, assigns final grade → marks evaluation complete
4. **Admin** manages evaluations, runs AI analysis on historical data for platform insights

**Role-Specific Capabilities**:

| Role | Permissions |
|------|-----------|
| **Student** | View own final evaluation (scheduled reveal date); submit weekly reports |
| **Advisor** | Approve final evaluations from supervisor; assign final grade; review approved weekly reports |
| **Supervisor** | Submit final evaluations for intern students; review and approve weekly reports from students |
| **Admin** | View all evaluations/weekly reports; run AI analysis (`/api/evaluate-post-approval`); archive evaluations; export reports |

**Key Data Fields**:
- `evaluations`: `feedback_text`, `rating_overall`, `rating_technical`, `rating_communication`, `rating_work_ethic`, `final_grade`, `status` (draft/submitted/approved/completed)
- `weekly_reports`: `student_id`, `supervisor_id`, `report_text`, `week_number`, `is_approved`, `submitted_at`
- `ai_analysis`: sentiment scores, skill extraction, bias detection (stored as JSONB in evaluations table or separate table)

**Key Flows**:
- Student submits weekly → `POST /api/evaluations/weekly-reports` → stored, visible to supervisor
- Supervisor approves & submits final eval → `POST /api/evaluations` + `emitEvaluationUpdate()` → advisor notified via socket
- Advisor approves → `PATCH /api/evaluations/{id}` (status=approved, final_grade set) → archived flag set after internship ends
- Admin AI analysis → `POST /api/ai-service/evaluate-post-approval` → returns insights (sentiment trends, top skills, grade distribution)

**Relevant Files**: `backend/src/routes/evaluations.ts`, `backend/src/services/evaluationService.ts`, `backend/src/services/advisorEvaluationService.ts`, `ai-service/main.py` (/api/evaluate-post-approval)

---

### Level 4: Document Management Module
**Roles & Capabilities**:
- **Student, Advisor, Supervisor**: Upload documents, share with other roles (NOT with admin)
- **Admin**: Manage/view document metadata (uploader, upload date), optional archival

**Important Note**: File sharing in Communication Hub (Level 2) is **different** from Document Management—messages don't appear here and documents don't appear in messages.

**Key Flows**:
- User uploads document → `POST /api/documents` (document-service) → stored in Supabase Storage + metadata in `documents` table
- User shares with role → `documents.shared_with_roles` updated or separate `document_access` table created
- Document collaboration (Yjs/OT) → WebSocket events on port 6001: `document:join`, `document:leave`, `document:update`
- Admin views → can see `documents.created_by`, `documents.created_at`, can optionally set `documents.archived_at`

**Key Data Fields**:
- `documents`: `id`, `name`, `file_url` (Supabase Storage), `created_by`, `created_at`, `shared_with_roles` (JSONB array), `archived_at` (nullable)
- Collaboration tracking: `collaboration_sessions` (active editors), `document_changes` (operation history for OT)

**Relevant Files**: `document-service/src/routes/documents.ts`, `document-service/src/services/collaborationService.ts`, `backend/src/services/documentService.ts`

---

### Level 5: Reports & Analytics Module
**Admin-Only Access**:
- **Admin**: View platform-wide analytics, export reports, send to university

**Metrics Dashboard**:
- **User Counts**: Total students, advisors, supervisors, admins (filtered by status=active)
- **Evaluation Stats**: Total submitted, total approved, completion percentage, average grades
- **Internship Stats**: Total active internships, completed internships, in-progress count
- **Weekly Report Stats**: Total submitted, total approved, approval rate
- **Export Capability**: Generate PDF/Excel report with above metrics for university reporting

**AI Insights** (on approved evaluations):
- Sentiment trends across all evaluations (positive/neutral/negative distribution)
- Most recognized student skills (technical + soft skills frequency)
- Performance overview (grade distribution, high performer ratio)
- Historical patterns (e.g., "CVSU students excel in technical skills")

**Key Flows**:
- Admin navigates to `/admin/analytics` → `GET /api/admin/analytics` → aggregates counts from all tables
- Admin triggers AI insights → `POST /ai-service/evaluate-post-approval` with all approved evaluations → returns top 3 insights
- Admin exports report → `GET /api/admin/reports/export?format=pdf|xlsx` → generates and downloads file

**Relevant Files**: `backend/src/routes/admin.ts`, `backend/src/controllers/admin/dashboardController.ts`, `backend/src/services/adminDashboardService.ts`, `backend/src/services/reportsService.ts`, `ai-service/main.py` (/api/evaluate-post-approval)

---

## Permission Matrix (Quick Reference)
| Module | Student | Advisor | Supervisor | Admin |
|--------|---------|---------|-----------|-------|
| **User Mgmt** | View own | View all | View all | Full control |
| **Communication** | Send/receive | Send/receive | Send/receive | Send/receive |
| **Evaluations** | Submit weekly; view final | Approve final; assign grade | Submit final; approve weekly | Manage all; AI analysis |
| **Documents** | Upload/share (not to admin) | Upload/share (not to admin) | Upload/share (not to admin) | View all; optional archive |
| **Analytics** | ❌ | ❌ | ❌ | Full access; export |

---

## Key References
- Root overview: `README.md`, `docker-compose.yml` (ports/env wiring)
- Auth: `backend/src/middleware/auth.ts`, `frontend/src/lib/auth.ts`, `docs/AUTH_INTEGRATION_SUMMARY.md`
- Sockets: `backend/src/socket/emitters.ts`, `frontend/src/lib/backendSocket.ts`, `frontend/src/lib/documentSocket.ts`
- Docs: `docs/api/*` (REST, WebSocket, document APIs), `docs/development/*`, `docs/updated-fixes/*`
- User workflows: `docs/user-guides/*` (student-guide, advisor-guide, supervisor-guide, document-collaboration)
