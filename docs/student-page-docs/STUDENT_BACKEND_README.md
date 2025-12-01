# Student Backend Implementation

Complete backend API integration for the Student Dashboard module of the Intern-Galing platform.

## 📁 File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── student/
│   │       └── studentController.ts          # All student endpoint handlers
│   ├── services/
│   │   └── studentService.ts                 # Business logic & calculations
│   ├── routes/
│   │   └── student/
│   │       └── index.ts                      # Student route definitions
│   ├── socket/
│   │   └── handlers/
│   │       └── studentHandler.ts             # Real-time WebSocket events
│   └── types/
│       └── student.ts                        # TypeScript type definitions

frontend/
├── src/
│   ├── lib/
│   │   └── api/
│   │       └── student.ts                    # Frontend API client
│   └── types/
│       └── student.ts                        # Frontend type definitions
```

## 🚀 API Endpoints

### Profile Management
- `GET /api/student/profile` - Get student profile
- `PATCH /api/student/profile` - Update profile
- `GET /api/student/profile/settings` - Get settings
- `PATCH /api/student/profile/settings` - Update settings

### Internship
- `GET /api/student/internship` - Get current internship with progress
- `GET /api/student/internship/timeline` - Get milestones timeline
- `GET /api/student/internship/progress` - Get detailed progress metrics

### Evaluations
- `GET /api/student/evaluations` - List all evaluations (paginated)
- `GET /api/student/evaluations/:id` - Get single evaluation
- `GET /api/student/skills-assessment` - Get aggregated skill ratings

### Documents
- `GET /api/student/documents` - List documents (filterable by type/status)
- `POST /api/student/documents` - Upload new document
- `GET /api/student/documents/:id` - Get document details
- `PATCH /api/student/documents/:id` - Update document metadata
- `DELETE /api/student/documents/:id` - Archive document
- `GET /api/student/documents/required` - Get required documents checklist

### Messages & Communication
- `GET /api/student/messages/conversations` - List conversations
- `GET /api/student/messages/conversations/:id` - Get conversation messages
- `POST /api/student/messages/conversations/:id/messages` - Send message
- `POST /api/student/messages/conversations` - Create new conversation
- `POST /api/student/messages/conversations/:id/mark-read` - Mark as read

### Notifications & Reminders
- `GET /api/student/reminders` - Get upcoming reminders
- `GET /api/student/notifications` - List notifications
- `PATCH /api/student/notifications/:id/read` - Mark notification as read
- `PATCH /api/student/notifications/read-all` - Mark all as read

### Mentors
- `GET /api/student/mentors` - Get advisor & supervisor info
- `POST /api/student/mentors/:id/message` - Quick message to mentor

### Tasks
- `GET /api/student/tasks` - List tasks (using documents)
- `PATCH /api/student/tasks/:id` - Update task status

### Dashboard
- `GET /api/student/dashboard` - Get complete dashboard data (optimized single call)

## 🔐 Authentication & Authorization

All routes require:
1. **Authentication**: Valid Supabase JWT token in `Authorization: Bearer <token>` header
2. **Role Check**: User must have `role = 'student'`

Implemented via middleware:
```typescript
router.use(authenticateToken);        // Verify JWT token
router.use(requireRole(['student'])); // Enforce student role
```

## 📊 Key Features

### Progress Calculation
Automatically calculates internship progress based on start/end dates:
```typescript
// Overall progress
progress = (elapsed_days / total_days) * 100

// Phase completion
- Onboarding: First 14 days
- Development: Days 15-42
- Evaluation: Last 14 days
```

### AI Insights Aggregation
Combines data from all evaluations:
- Sentiment analysis (average positive/neutral/negative scores)
- Key strengths (top 5 LLT features)
- Performance trend (comparing recent vs older evaluations)
- Confidence score based on overall ratings

### Required Documents Tracking
Monitors submission status of:
- MOA (Memorandum of Agreement)
- Job Description
- Weekly Reports (recurring)
- Final Evaluation

### Real-Time Communication
WebSocket events for:
- New messages
- Evaluation submissions
- Document updates
- Typing indicators
- Read receipts

## 🔌 WebSocket Events

### Client → Server
- `student:join` - Join personal notification room
- `student:join-internship` - Subscribe to internship updates
- `student:join-conversation` - Join conversation for messaging
- `student:typing` - Broadcast typing indicator
- `student:mark-read` - Mark messages as read
- `student:subscribe-evaluations` - Subscribe to evaluation notifications
- `student:subscribe-documents` - Subscribe to document notifications

### Server → Client
- `evaluation:new` - New evaluation received
- `evaluation:updated` - Evaluation updated
- `document:status-changed` - Document status changed
- `message:new` - New message in conversation
- `message:notification` - Message push notification
- `notification:new` - General notification
- `internship:updated` - Internship details changed

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                          # Run all tests
npm run test:watch               # Watch mode
npm run test:coverage            # With coverage
```

### API Testing with cURL
```bash
# Get dashboard data
curl -H "Authorization: Bearer <token>" \
     http://localhost:5000/api/student/dashboard

# Upload document
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"title":"Weekly Report 1","type":"Weekly Report"}' \
     http://localhost:5000/api/student/documents

# Send message
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"content":"Hello, I have a question."}' \
     http://localhost:5000/api/student/messages/conversations/<conversation_id>/messages
```

## 📦 Frontend Integration

### Basic Usage
```typescript
import { studentAPI } from '@/lib/api/student';

// Get dashboard data
const { data, error } = await studentAPI.getDashboard();
if (data) {
  console.log(data.internship);
  console.log(data.progress);
  console.log(data.recent_evaluations);
}

// Send message
const result = await studentAPI.sendMessage(conversationId, 'Hello!');

// Upload document
const upload = await studentAPI.uploadDocument({
  title: 'Weekly Report Week 1',
  type: 'Weekly Report',
  file_url: 'https://...'
});
```

### WebSocket Connection
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('supabase_token') }
});

// Join student room
socket.emit('student:join', userId);

// Listen for evaluations
socket.on('evaluation:new', (data) => {
  console.log('New evaluation:', data.evaluation);
  // Update UI
});

// Listen for messages
socket.on('message:new', (data) => {
  console.log('New message:', data.message);
  // Update chat UI
});
```

## 🎯 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Dashboard Response Example
```json
{
  "success": true,
  "data": {
    "internship": {
      "id": "uuid",
      "position": "Software Engineer Intern",
      "company": { "name": "Tech Corp" },
      "advisor": { "name": "Dr. Jane Smith", "email": "..." },
      "supervisor": { "name": "John Doe", "email": "..." },
      "progress_percentage": 65
    },
    "progress": {
      "overall_progress": 65,
      "completion_by_phase": {
        "onboarding": 100,
        "development": 75,
        "evaluation": 30
      },
      "time_remaining_days": 47,
      "weeks_remaining": 7
    },
    "recent_evaluations": [...],
    "upcoming_tasks": [...],
    "ai_insights": {
      "performance_trend": "up",
      "key_strengths": ["Leadership", "Problem-solving"],
      "confidence_score": 92
    },
    "notifications_count": 3
  }
}
```

## 🐛 Error Handling

All endpoints handle common errors:
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions (not a student)
- `404 Not Found` - Resource doesn't exist or no active internship
- `400 Bad Request` - Invalid input data
- `500 Internal Server Error` - Server/database errors

## 🔧 Environment Variables

Required in `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Required in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📈 Performance Optimizations

1. **Dashboard Endpoint**: Single optimized query instead of multiple API calls
2. **Pagination**: All list endpoints support limit/offset
3. **Selective Queries**: Only fetch needed fields with Supabase `.select()`
4. **Caching**: Consider adding Redis caching for frequently accessed data
5. **Connection Pooling**: Supabase client handles connection pooling automatically

## 🚧 Known Limitations

1. **AI Service**: Currently returns mock responses (Phase 2 implementation)
2. **File Uploads**: File storage URLs passed as strings (integrate with Supabase Storage)
3. **Task Management**: Using documents as tasks (could be enhanced with dedicated task table)
4. **Trend Calculations**: Simplified algorithm (could use more sophisticated analysis)

## 📝 Next Steps

1. **Frontend Integration**: Connect existing UI components to API
2. **Error Fixes**: Address any frontend-backend integration issues
3. **Testing**: Comprehensive endpoint and integration testing
4. **Documentation**: API documentation with Swagger/OpenAPI
5. **Monitoring**: Add logging and error tracking
6. **Optimization**: Profile and optimize slow queries

## 🤝 Contributing

When adding new endpoints:
1. Add route in `routes/student/index.ts`
2. Implement handler in `controllers/student/studentController.ts`
3. Add business logic in `services/studentService.ts` if complex
4. Update TypeScript types in `types/student.ts`
5. Add frontend API method in `frontend/lib/api/student.ts`
6. Write tests in `tests/student.test.ts`
7. Update this README

---

**Status**: ✅ Backend Implementation Complete
**Next**: Frontend Integration & Error Fixing
