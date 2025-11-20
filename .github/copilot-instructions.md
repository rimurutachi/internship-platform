# Intern-Galing Platform - AI Agent Instructions

## Architecture Overview

**Microservices Structure**: Four independent services communicating via REST APIs and WebSockets
- `backend/` - Node.js/Express API (port 5000) - main business logic, auth, internships, evaluations
- `document-service/` - Node.js/Express + Socket.io (port 6000 HTTP, 6001 WS) - real-time document collaboration with Yjs
- `ai-service/` - Python FastAPI (port 8000) - LLT + sentiment analysis for evaluations (Phase 2 placeholder)
- `frontend/` - Next.js 15 with Turbopack (port 3000) - role-based dashboards

**Critical Integration Points**:
- Backend and document-service share Supabase PostgreSQL database and Redis for sessions
- Frontend connects to backend via REST + Socket.io for messaging/notifications
- Frontend connects to document-service via separate WebSocket (`lib/documentSocket.ts`)
- All services use Supabase Auth with JWT tokens

## Authentication Pattern

**Supabase-first authentication**: All services validate JWT tokens from Supabase Auth
- Backend: `middleware/auth.ts` extracts role from JWT `app_metadata.role` or `user_metadata.role`, fallback to DB query
- Roles: `student`, `advisor`, `supervisor`, `admin` - stored in users table and JWT metadata
- Test mode: `NODE_ENV=test` bypasses Supabase, uses mock user from `process.env.TEST_USER_ROLE`
- Frontend: Use `createSupabaseClient()` for client components, `createSupabaseServer()` for server components (see `lib/supabase.ts`)

## Real-Time Communication

**Dual Socket.io Setup**:
1. Backend Socket.io: Messages, notifications, evaluations
   - Room naming: `conversation:{id}`, `user:{userId}`, `evaluation:{id}`
   - Emitters in `socket/emitters.ts` - use these instead of direct `io.emit()`
   - Handlers in `socket/handlers/` - `messageHandler.ts`, `notificationHandler.ts`, `evaluationHandler.ts`

2. Document-service Socket.io: Collaborative editing
   - Events: `document:join`, `document:leave`, `document:update`
   - Frontend helper: `connectDocumentService(documentId, userId)` in `lib/documentSocket.ts`
   - Operational Transform for conflict resolution (`services/collaborationService.ts`)

## Role-Based Frontend Architecture

**Directory per role**: `frontend/src/app/dashboard/{student|advisor|supervisor|admin}/`
- Each has dedicated components in `components/{role}/` (e.g., `StudentHeader`, `AdvisorSidebar`)
- Shared UI components in `components/ui/` using shadcn/ui + Tailwind CSS
- Analytics components in `components/analytics/` with role-specific exports
- Mobile-first layouts in `components/mobile/` with bottom navigation

**Mobile-first responsive design**:
- Uses `useIsMobile()` hook from `hooks/use-mobile.tsx` for responsive behavior
- `components/mobile/BottomNavigation.tsx` - role-specific bottom nav (hidden on lg+)
- `components/mobile/MobileHeader.tsx` - compact header with menu/notifications
- Desktop sidebars in `components/{role}/` use shadcn sidebar component with mobile sheet overlay
- Mobile nav shows max 6 items with horizontal scroll, desktop uses full sidebar

**Critical convention**: User role determines route access. Check `role` field from Supabase auth before rendering dashboards.

## Development Workflow

**Start all services** (use Docker Compose or individual commands):
```bash
# Individual services
cd frontend && npm run dev          # Next.js with Turbopack
cd backend && npm run dev           # Nodemon auto-restart
cd document-service && npm run dev
cd ai-service && python -m venv venv && source venv/bin/activate && uvicorn main:app --reload
```

**Testing**:
- Backend: `npm test` - Jest with ts-jest, mocked Supabase client in `tests/setup.ts`
- Key: Set `NODE_ENV=test` and `TEST_USER_ROLE` to bypass auth
- Frontend: `npm test` - Jest with React Testing Library

**Environment variables**: Check `.env.example` files in each service directory for required configuration:
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
- Document Service: `document-service/.env.example`
- AI Service: `ai-service/.env.example`

## Key Patterns & Conventions

**Service layer pattern**: Controllers are thin, business logic in `services/` (e.g., `evaluationService.ts`, `conversationService.ts`)
- Services handle Supabase queries + real-time emits
- Example: `EvaluationService.create()` inserts to DB then calls `emitEvaluationUpdate()`

**Response utilities**: Use `responseUtils.ts` for consistent API responses (likely contains success/error helpers)

**Validation**: `express-validator` in `middleware/validation.ts` and `middleware/communciationValidators.ts` [typo in original]

**TypeScript everywhere**: Shared type definitions in `types/` dirs per service
- Frontend: `types/index.ts` has `User`, `UserProfileData`, `ContactInfo` interfaces
- Backend: `types/auth.ts`, models in `models/` dir

**Document collaboration**: Uses Yjs CRDT concepts but implemented with custom Operational Transform
- Changes tracked in `document_changes` table with `operation_type`, `position`, `content`
- Active sessions in `collaboration_sessions` table with user presence (cursor, color, last_seen)

## Common Gotchas

1. **Socket.io initialization**: Backend creates HTTP server explicitly for Socket.io attachment (`server.ts` lines 23-26)
2. **Document service dual ports**: HTTP API on one port (6000), WebSocket on another (6001) - see `docker-compose.yml`
3. **Auth middleware test mode**: Always check `NODE_ENV` before assuming real Supabase validation
4. **AI service placeholder**: `/api/evaluate` endpoint returns mock response - LLT algorithm not yet implemented (Phase 2)
5. **Frontend Turbopack**: Always use `--turbopack` flag in dev/build scripts (see `package.json`)
6. **Database schema**: All schema definitions are in Supabase dashboard, not in local migration files

## Files to Reference

- Architecture decisions: `README.md`, `docker-compose.yml`
- Auth flow: `backend/src/middleware/auth.ts`, `frontend/src/lib/supabase.ts`
- Socket patterns: `backend/src/socket/emitters.ts`, `backend/src/socket/handlers/`
- Role-based UI: `frontend/src/app/dashboard/{role}/`, `frontend/src/components/{role}/`
- Testing setup: `backend/tests/setup.ts`, `backend/jest.config.js`
- API documentation: `backend/src/routes/README.md`, `docs/api/`
