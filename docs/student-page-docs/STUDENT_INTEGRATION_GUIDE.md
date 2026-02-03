# Student Frontend Integration Guide

Quick guide to integrate the student backend API with existing Next.js frontend.

## 🎯 Integration Checklist

### Step 1: Import API Client

```typescript
// In any component or page
import { studentAPI } from '@/lib/api/student';
import type { DashboardData, StudentInternship } from '@/types/student';
```

### Step 2: Update Dashboard Page

**File: `src/app/dashboard/student/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import type { DashboardData } from '@/types/student';

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getDashboard();
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="p-6">
      <h1>Welcome, {data.internship.company?.name}</h1>
      
      {/* Progress Bar */}
      <ProgressCard progress={data.progress} />
      
      {/* Recent Evaluations */}
      <EvaluationsSection evaluations={data.recent_evaluations} />
      
      {/* AI Insights */}
      {data.ai_insights && <AIInsightsCard insights={data.ai_insights} />}
      
      {/* Upcoming Tasks */}
      <TasksList tasks={data.upcoming_tasks} />
    </div>
  );
}
```

### Step 3: Current Internship Page

**File: `src/app/dashboard/student/internship/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import type { StudentInternship, ProgressMetrics } from '@/types/student';

export default function CurrentInternshipPage() {
  const [internship, setInternship] = useState<StudentInternship | null>(null);
  const [progress, setProgress] = useState<ProgressMetrics | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [internshipRes, progressRes] = await Promise.all([
      studentAPI.getCurrentInternship(),
      studentAPI.getProgress()
    ]);

    if (internshipRes.success) setInternship(internshipRes.data?.internship || null);
    if (progressRes.success) setProgress(progressRes.data || null);
  };

  return (
    <div>
      <h1>Current Internship</h1>
      
      {internship && (
        <>
          <InternshipCard internship={internship} />
          <MentorCards 
            advisor={internship.advisor} 
            supervisor={internship.supervisor} 
          />
        </>
      )}
      
      {progress && <ProgressMetrics progress={progress} />}
    </div>
  );
}
```

### Step 4: Evaluations Page

**File: `src/app/dashboard/student/evaluations/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import type { StudentEvaluation, SkillAssessment } from '@/types/student';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [skills, setSkills] = useState<SkillAssessment | null>(null);

  useEffect(() => {
    loadEvaluations();
    loadSkills();
  }, []);

  const loadEvaluations = async () => {
    const res = await studentAPI.getEvaluations(10, 0);
    if (res.success && res.data) {
      setEvaluations(res.data.evaluations);
    }
  };

  const loadSkills = async () => {
    const res = await studentAPI.getSkillsAssessment();
    if (res.success && res.data) {
      setSkills(res.data);
    }
  };

  return (
    <div>
      <h1>Evaluations</h1>
      
      {/* Skills Assessment */}
      {skills && <SkillsChart skills={skills.skills} />}
      
      {/* Evaluations List */}
      {evaluations.map(eval => (
        <EvaluationCard key={eval.id} evaluation={eval} />
      ))}
    </div>
  );
}
```

### Step 5: Messages Page with WebSocket

**File: `src/app/dashboard/student/messages/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import { useBackendSocket } from '@/hooks/use-backend-socket';
import type { StudentConversation, StudentMessage } from '@/types/student';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<StudentConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const { socket, isConnected } = useBackendSocket();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (socket && selectedConv) {
      // Join conversation room
      socket.emit('student:join-conversation', selectedConv);
      
      // Listen for new messages
      socket.on('message:new', handleNewMessage);
      
      return () => {
        socket.off('message:new', handleNewMessage);
      };
    }
  }, [socket, selectedConv]);

  const loadConversations = async () => {
    const res = await studentAPI.getConversations();
    if (res.success && res.data) {
      setConversations(res.data.conversations);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const res = await studentAPI.getConversationMessages(conversationId);
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  };

  const handleNewMessage = (data: any) => {
    if (data.conversationId === selectedConv) {
      setMessages(prev => [data.message, ...prev]);
    }
    // Update conversation list
    loadConversations();
  };

  const sendMessage = async (content: string) => {
    if (!selectedConv) return;
    
    const res = await studentAPI.sendMessage(selectedConv, content);
    if (res.success) {
      // Message will be added via WebSocket
    }
  };

  return (
    <div className="flex h-screen">
      {/* Conversations List */}
      <ConversationsList 
        conversations={conversations}
        onSelect={(id) => {
          setSelectedConv(id);
          loadMessages(id);
        }}
      />
      
      {/* Message Thread */}
      {selectedConv && (
        <MessageThread 
          messages={messages}
          onSend={sendMessage}
        />
      )}
    </div>
  );
}
```

### Step 6: Documents Page

**File: `src/app/dashboard/student/documents/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import type { StudentDocument, RequiredDocument } from '@/types/student';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [required, setRequired] = useState<RequiredDocument[]>([]);

  useEffect(() => {
    loadDocuments();
    loadRequired();
  }, []);

  const loadDocuments = async () => {
    const res = await studentAPI.getDocuments();
    if (res.success && res.data) {
      setDocuments(res.data.documents);
    }
  };

  const loadRequired = async () => {
    const res = await studentAPI.getRequiredDocuments();
    if (res.success && res.data) {
      setRequired(res.data.required_documents);
    }
  };

  const handleUpload = async (title: string, type: string, fileUrl: string) => {
    const res = await studentAPI.uploadDocument({ title, type, file_url: fileUrl });
    if (res.success) {
      loadDocuments(); // Refresh list
    }
  };

  return (
    <div>
      <h1>Documents</h1>
      
      {/* Required Documents Checklist */}
      <RequiredDocumentsSection required={required} />
      
      {/* Upload Section */}
      <DocumentUpload onUpload={handleUpload} />
      
      {/* Documents List */}
      <DocumentsList documents={documents} />
    </div>
  );
}
```

## 🔌 WebSocket Integration

### Custom Hook for Student WebSocket

**File: `src/hooks/use-student-socket.ts`**

```typescript
import { useEffect, useState } from 'react';
import { useBackendSocket } from './use-backend-socket';

export function useStudentSocket(userId: string) {
  const { socket, isConnected } = useBackendSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (socket && userId) {
      // Join student room
      socket.emit('student:join', userId);

      // Listen for notifications
      socket.on('notification:new', (data) => {
        setNotifications(prev => [data.notification, ...prev]);
      });

      socket.on('evaluation:new', (data) => {
        // Show toast notification
        console.log('New evaluation:', data.evaluation);
      });

      socket.on('document:status-changed', (data) => {
        // Show toast notification
        console.log('Document status changed:', data.document);
      });

      return () => {
        socket.off('notification:new');
        socket.off('evaluation:new');
        socket.off('document:status-changed');
      };
    }
  }, [socket, userId]);

  return { socket, isConnected, notifications };
}
```

### Usage in Layout

**File: `src/app/dashboard/student/layout.tsx`**

```typescript
'use client';

import { useUser } from '@/hooks/use-user';
import { useStudentSocket } from '@/hooks/use-student-socket';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { notifications } = useStudentSocket(user?.id || '');

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      toast({
        title: latest.title,
        description: latest.message,
      });
    }
  }, [notifications]);

  return (
    <div>
      <StudentHeader />
      <StudentSidebar />
      <main>{children}</main>
    </div>
  );
}
```

## 🎨 Example Components

### Progress Card Component

```typescript
import { ProgressMetrics } from '@/types/student';

interface Props {
  progress: ProgressMetrics;
}

export function ProgressCard({ progress }: Props) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Progress</h3>
      <div className="mt-4">
        <div className="text-3xl font-bold">{progress.overall_progress}%</div>
        <div className="text-sm text-gray-600">
          {progress.time_remaining_days} days remaining
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <ProgressBar 
          label="Onboarding" 
          value={progress.completion_by_phase.onboarding} 
        />
        <ProgressBar 
          label="Development" 
          value={progress.completion_by_phase.development} 
        />
        <ProgressBar 
          label="Evaluation" 
          value={progress.completion_by_phase.evaluation} 
        />
      </div>
    </div>
  );
}
```

## 🐛 Common Integration Issues

### Issue 1: 401 Unauthorized

**Cause**: Missing or invalid token
**Fix**: Ensure token is stored and sent correctly

```typescript
// Check token exists
const token = localStorage.getItem('supabase_token');
if (!token) {
  router.push('/login');
}
```

### Issue 2: No Active Internship (404)

**Cause**: Student doesn't have active internship
**Fix**: Handle gracefully in UI

```typescript
const res = await studentAPI.getCurrentInternship();
if (!res.success && res.error?.includes('No active internship')) {
  return <NoInternshipMessage />;
}
```

### Issue 3: WebSocket Not Connecting

**Cause**: Token not passed to socket
**Fix**: Pass token in socket initialization

```typescript
const socket = io(API_URL, {
  auth: {
    token: localStorage.getItem('supabase_token')
  }
});
```

## 📊 Testing Frontend Integration

```typescript
// Test dashboard load
describe('Student Dashboard', () => {
  it('loads dashboard data', async () => {
    const { data, error } = await studentAPI.getDashboard();
    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(data?.internship).toBeDefined();
  });
});

// Test message sending
describe('Messages', () => {
  it('sends a message', async () => {
    const conversationId = 'test-conv-id';
    const res = await studentAPI.sendMessage(conversationId, 'Hello!');
    expect(res.success).toBe(true);
  });
});
```

## 🚀 Deployment Notes

1. **Environment Variables**: Update production URLs
2. **CORS**: Ensure backend allows frontend origin
3. **WebSocket**: Configure WebSocket URL for production
4. **Rate Limiting**: Backend has rate limiting enabled
5. **Error Tracking**: Add Sentry or similar for error monitoring

---

**Ready to integrate!** Start with the dashboard page and work through each feature systematically.
