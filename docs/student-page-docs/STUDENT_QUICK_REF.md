# 🎓 Student Backend - Quick Reference Card

## 📡 API Endpoints Summary

### Base URL
```
http://localhost:5000/api/student
```

### Authentication
```
Authorization: Bearer <supabase_jwt_token>
```

---

## 🔑 Core Endpoints

### Dashboard (Start Here!)
```http
GET /dashboard
→ Returns everything: internship, progress, evaluations, tasks, AI insights
```

### Profile
```http
GET /profile                    # Get profile
PATCH /profile                  # Update profile
GET /profile/settings           # Get settings
PATCH /profile/settings         # Update settings
```

### Internship
```http
GET /internship                 # Current internship + progress
GET /internship/timeline        # Milestones
GET /internship/progress        # Detailed metrics
```

### Evaluations
```http
GET /evaluations                # List all (paginated)
GET /evaluations/:id            # Single evaluation
GET /skills-assessment          # Aggregated skills
```

### Documents
```http
GET /documents                  # List (filter by type/status)
POST /documents                 # Upload new
GET /documents/:id              # Get details
PATCH /documents/:id            # Update
DELETE /documents/:id           # Archive
GET /documents/required         # Required docs checklist
```

### Messages
```http
GET /messages/conversations                      # List conversations
GET /messages/conversations/:id                  # Get messages
POST /messages/conversations/:id/messages        # Send message
POST /messages/conversations                     # Create conversation
POST /messages/conversations/:id/mark-read       # Mark as read
```

### Notifications
```http
GET /reminders                  # Upcoming reminders
GET /notifications              # List notifications
PATCH /notifications/:id/read   # Mark one as read
PATCH /notifications/read-all   # Mark all as read
```

### Mentors
```http
GET /mentors                    # Get advisor & supervisor
POST /mentors/:id/message       # Quick message
```

### Tasks
```http
GET /tasks                      # List tasks
PATCH /tasks/:id                # Update status
```

---

## 🔌 WebSocket Events

### Connect
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: yourToken }
});
```

### Join Rooms
```javascript
socket.emit('student:join', userId);
socket.emit('student:join-internship', internshipId);
socket.emit('student:join-conversation', conversationId);
```

### Listen for Updates
```javascript
socket.on('evaluation:new', data => { ... });
socket.on('document:status-changed', data => { ... });
socket.on('message:new', data => { ... });
socket.on('notification:new', data => { ... });
```

### Send Events
```javascript
socket.emit('student:typing', { conversationId, isTyping: true });
socket.emit('student:mark-read', { conversationId, messageIds: [...] });
```

---

## 💻 Frontend Usage

### Basic API Call
```typescript
import { studentAPI } from '@/lib/api/student';

const { data, error } = await studentAPI.getDashboard();
if (data) {
  console.log(data.internship);
}
```

### With State
```typescript
const [data, setData] = useState<DashboardData | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    const res = await studentAPI.getDashboard();
    if (res.success) setData(res.data || null);
    setLoading(false);
  };
  load();
}, []);
```

### WebSocket Hook
```typescript
import { useStudentSocket } from '@/hooks/use-student-socket';

const { socket, isConnected, notifications } = useStudentSocket(userId);

useEffect(() => {
  if (notifications.length > 0) {
    toast({ title: notifications[0].title });
  }
}, [notifications]);
```

---

## 🎯 Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🔒 Error Codes

- `401` - Unauthorized (no token / invalid token)
- `403` - Forbidden (not a student / no access)
- `404` - Not Found (no internship / resource doesn't exist)
- `400` - Bad Request (invalid input)
- `500` - Server Error (database / unexpected error)

---

## 📊 Data Models

### Internship
```typescript
{
  id: string,
  position: string,
  company: { name, industry, location },
  advisor: { name, email },
  supervisor: { name, email },
  start_date: string,
  end_date: string,
  progress_percentage: number
}
```

### Evaluation
```typescript
{
  id: string,
  feedback_text: string,
  rating_overall: number,
  rating_technical: number,
  rating_communication: number,
  sentiment_scores: { positive, neutral, negative },
  llt_features: string[],
  status: string
}
```

### Progress
```typescript
{
  overall_progress: number,
  completion_by_phase: {
    onboarding: number,
    development: number,
    evaluation: number
  },
  time_remaining_days: number,
  weeks_remaining: number
}
```

---

## 🧪 Testing Checklist

- [ ] Get dashboard data
- [ ] Get internship details
- [ ] Get evaluations list
- [ ] Get skills assessment
- [ ] Upload document
- [ ] Get conversations
- [ ] Send message
- [ ] WebSocket connection
- [ ] Real-time message delivery
- [ ] Get notifications
- [ ] Mark notification as read

---

## 🚨 Common Issues

### 401 Unauthorized
→ Check token exists in localStorage
→ Verify token format: `Bearer <token>`

### 404 No Internship
→ Student doesn't have active internship
→ Handle in UI with fallback message

### WebSocket Not Connecting
→ Verify token passed to socket
→ Check socket URL matches backend

### CORS Error
→ Check `FRONTEND_URL` in backend `.env`
→ Verify CORS origin in `server.ts`

---

## 📞 Quick Links

- **API Docs**: `backend/STUDENT_BACKEND_README.md`
- **Integration Guide**: `docs/STUDENT_INTEGRATION_GUIDE.md`
- **Test Script**: `backend/test-student-api.sh`
- **Types**: `frontend/src/types/student.ts`

---

## 🎯 Priority Integration Order

1. **Dashboard** → Most important, shows overview
2. **Current Internship** → Shows full details
3. **Evaluations** → Performance tracking
4. **Messages** → Real-time communication
5. **Documents** → File management
6. **Settings** → Profile management

---

**Status**: ✅ Backend Complete | 🔧 Ready for Frontend

**Start with**: `studentAPI.getDashboard()` 🚀
