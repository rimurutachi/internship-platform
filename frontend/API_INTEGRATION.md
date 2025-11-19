# Frontend API Integration Guide

This guide explains how to use the API services and React hooks to integrate with the backend.

## Table of Contents

- [Overview](#overview)
- [API Client](#api-client)
- [Services](#services)
- [React Hooks](#react-hooks)
- [Real-time Communication](#real-time-communication)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)

## Overview

The frontend uses a clean, type-safe API layer that:
- Automatically handles authentication with JWT tokens
- Provides consistent error handling
- Integrates with React Query for data caching and synchronization
- Supports real-time updates via Socket.io

## API Client

### Configuration

The API client is automatically configured using environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
```

### Authentication

All API requests automatically include the JWT token from Supabase:

```typescript
import { apiClient } from '@/lib/api';

// Token is automatically attached to all requests
const response = await apiClient.get('/internships');
```

### Error Handling

The client automatically handles common errors:

- **401 Unauthorized**: Logs out user and redirects to login
- **Network errors**: Returns user-friendly message
- **Other errors**: Wraps in `ApiError` class

```typescript
import { ApiError } from '@/lib/api';

try {
  const data = await internshipService.list();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.statusCode, error.message);
  }
}
```

## Services

### Internship Service

```typescript
import { internshipService } from '@/lib/api';

// List all internships with pagination
const result = await internshipService.list({ page: 1, limit: 10 });

// Get specific internship
const internship = await internshipService.getById('id');

// Get current user's active internship
const current = await internshipService.getCurrent();

// Create new internship
const newInternship = await internshipService.create({
  student_id: 'uuid',
  advisor_id: 'uuid',
  supervisor_id: 'uuid',
  company_id: 'uuid',
  position_title: 'Software Engineer Intern',
  start_date: '2024-01-01',
  end_date: '2024-06-01',
});

// Update internship
const updated = await internshipService.update('id', {
  status: 'active',
});

// Get statistics
const stats = await internshipService.getStats();
```

### Evaluation Service

```typescript
import { evaluationService } from '@/lib/api';

// List evaluations
const evaluations = await evaluationService.list();

// Get by internship
const internshipEvals = await evaluationService.getByInternship('internship-id');

// Create evaluation
const evaluation = await evaluationService.create({
  internship_id: 'uuid',
  evaluator_type: 'advisor',
  evaluation_type: 'midterm',
  scores: { communication: 8, technical: 9 },
  comments: 'Great progress!',
});

// Submit evaluation
await evaluationService.submit('eval-id');

// Get AI sentiment analysis
const sentiment = await evaluationService.getAISentiment('eval-id');
```

### Communication Service

```typescript
import { communicationService } from '@/lib/api';

// List conversations
const conversations = await communicationService.listConversations();

// Create conversation
const conversation = await communicationService.createConversation({
  title: 'Project Discussion',
  type: 'group',
  participant_ids: ['user-1', 'user-2'],
});

// Get messages
const messages = await communicationService.listMessages('conversation-id');

// Send message
const message = await communicationService.sendMessage({
  conversation_id: 'uuid',
  content: 'Hello!',
  message_type: 'text',
});

// Mark as read
await communicationService.markAsRead('message-id');

// Get unread count
const { count } = await communicationService.getUnreadCount();
```

### Document Service

```typescript
import { documentService } from '@/lib/api';

// List documents
const documents = await documentService.list();

// Create document
const document = await documentService.create({
  title: 'Internship Report',
  document_type: 'report',
  internship_id: 'uuid',
  is_collaborative: true,
});

// Update document
await documentService.update('doc-id', {
  content: 'Updated content...',
});

// Share document
await documentService.share('doc-id', ['user-1', 'user-2']);

// Get collaboration sessions
const sessions = await documentService.getSessions('doc-id');
```

### Notification Service

```typescript
import { notificationService } from '@/lib/api';

// List notifications
const notifications = await notificationService.list();

// Get unread count
const { count } = await notificationService.getUnreadCount();

// Mark as read
await notificationService.markAsRead('notif-id');

// Mark all as read
await notificationService.markAllAsRead();
```

## React Hooks

### React Query Hooks

Use these hooks in React components for automatic caching, refetching, and state management:

```typescript
'use client';

import {
  useInternships,
  useInternship,
  useCurrentInternship,
  useCreateInternship,
  useUpdateInternship,
  useEvaluations,
  useConversations,
  useMessages,
  useSendMessage,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/use-api';

function MyComponent() {
  // Fetch data with automatic caching
  const { data: internships, isLoading, error } = useInternships();
  
  // Fetch single item
  const { data: internship } = useInternship('id');
  
  // Current internship
  const { data: current } = useCurrentInternship();
  
  // Mutations
  const createMutation = useCreateInternship({
    onSuccess: () => {
      console.log('Internship created!');
    },
  });
  
  const updateMutation = useUpdateInternship();
  
  // Use mutations
  const handleCreate = () => {
    createMutation.mutate({
      student_id: 'uuid',
      advisor_id: 'uuid',
      supervisor_id: 'uuid',
      company_id: 'uuid',
      position_title: 'Developer',
      start_date: '2024-01-01',
      end_date: '2024-06-01',
    });
  };
  
  const handleUpdate = () => {
    updateMutation.mutate({
      id: 'internship-id',
      data: { status: 'active' },
    });
  };
  
  // Messages
  const { data: messages } = useMessages('conversation-id');
  const sendMessage = useSendMessage();
  
  const handleSend = () => {
    sendMessage.mutate({
      conversation_id: 'uuid',
      content: 'Hello!',
    });
  };
  
  // Notifications
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();
  
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {internships?.data.map(i => <div key={i.id}>{i.position_title}</div>)}
    </div>
  );
}
```

## Real-time Communication

### Backend Socket Connection

```typescript
'use client';

import {
  useBackendSocket,
  useSocketEvent,
  useConversation,
  useEvaluationWatch,
  useTypingIndicator,
} from '@/hooks/use-backend-socket';

function ChatComponent({ conversationId }: { conversationId: string }) {
  // Connect to backend socket
  const { socket, isConnected } = useBackendSocket();
  
  // Join conversation room (auto joins/leaves on mount/unmount)
  useConversation(conversationId);
  
  // Typing indicator
  const setTyping = useTypingIndicator(conversationId);
  
  // Listen to new messages
  useSocketEvent('message:sent', (message) => {
    console.log('New message:', message);
    // Update UI or refetch messages
  });
  
  // Listen to notifications
  useSocketEvent('notification:new', (notification) => {
    console.log('New notification:', notification);
  });
  
  const handleInputChange = (e) => {
    setTyping(true);
    // Handle input...
  };
  
  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      <input onChange={handleInputChange} />
    </div>
  );
}

function EvaluationComponent({ evaluationId }: { evaluationId: string }) {
  // Watch evaluation for real-time updates
  useEvaluationWatch(evaluationId);
  
  // Listen to evaluation updates
  useSocketEvent('evaluation:updated', (evaluation) => {
    console.log('Evaluation updated:', evaluation);
  });
  
  return <div>Evaluation viewer...</div>;
}
```

### Direct Socket Usage

```typescript
import {
  connectBackendSocket,
  joinConversation,
  sendTypingIndicator,
} from '@/lib/backendSocket';

async function example() {
  // Connect to socket
  const socket = await connectBackendSocket();
  
  // Join conversation
  await joinConversation('conversation-id');
  
  // Send typing indicator
  sendTypingIndicator('conversation-id', true);
  
  // Listen to events
  socket.on('message:sent', (message) => {
    console.log(message);
  });
}
```

### Document Collaboration

```typescript
import {
  connectDocumentService,
  disconnectDocumentService,
  getDocumentSocket,
} from '@/lib/documentSocket';

function CollaborativeEditor({ documentId, userId }: Props) {
  useEffect(() => {
    const socket = connectDocumentService(documentId, userId);
    
    socket.on('document:update', (data) => {
      // Handle document updates
    });
    
    return () => {
      disconnectDocumentService(documentId, userId);
    };
  }, [documentId, userId]);
  
  return <div>Editor...</div>;
}
```

## Usage Examples

### Complete Internship Management

```typescript
'use client';

import { useInternships, useCreateInternship, useUpdateInternship } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';

export function InternshipList() {
  const { data, isLoading, error } = useInternships({ page: 1, limit: 10 });
  const createMutation = useCreateInternship();
  const updateMutation = useUpdateInternship();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <Button
        onClick={() => {
          createMutation.mutate({
            student_id: 'uuid',
            advisor_id: 'uuid',
            supervisor_id: 'uuid',
            company_id: 'uuid',
            position_title: 'Software Engineer',
            start_date: '2024-01-01',
            end_date: '2024-06-01',
          });
        }}
      >
        Create Internship
      </Button>
      
      {data?.data.map((internship) => (
        <div key={internship.id}>
          <h3>{internship.position_title}</h3>
          <p>Status: {internship.status}</p>
          <Button
            onClick={() => {
              updateMutation.mutate({
                id: internship.id,
                data: { status: 'active' },
              });
            }}
          >
            Activate
          </Button>
        </div>
      ))}
    </div>
  );
}
```

### Real-time Chat

```typescript
'use client';

import { useMessages, useSendMessage } from '@/hooks/use-api';
import { useConversation, useSocketEvent, useTypingIndicator } from '@/hooks/use-backend-socket';
import { useState } from 'react';

export function ChatRoom({ conversationId }: { conversationId: string }) {
  const [message, setMessage] = useState('');
  const { data: messages, refetch } = useMessages(conversationId);
  const sendMutation = useSendMessage();
  const setTyping = useTypingIndicator(conversationId);
  
  // Join conversation room
  useConversation(conversationId);
  
  // Listen for new messages
  useSocketEvent('message:sent', () => {
    refetch(); // Refetch messages when new one arrives
  });
  
  const handleSend = () => {
    sendMutation.mutate({
      conversation_id: conversationId,
      content: message,
    });
    setMessage('');
  };
  
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setTyping(true);
  };
  
  return (
    <div>
      <div>
        {messages?.data.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender?.first_name}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input value={message} onChange={handleTyping} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## Error Handling

### Global Error Handling

Errors are automatically handled by the API client and React Query:

```typescript
import { ApiError } from '@/lib/api';

const mutation = useCreateInternship({
  onError: (error: ApiError) => {
    if (error.statusCode === 400) {
      // Handle validation error
      console.error('Validation error:', error.message);
    } else if (error.statusCode === 403) {
      // Handle permission error
      console.error('Permission denied');
    } else {
      // Handle generic error
      console.error('An error occurred:', error.message);
    }
  },
});
```

### Component-level Error Boundaries

```typescript
'use client';

import { useInternships } from '@/hooks/use-api';

export function InternshipList() {
  const { data, isLoading, error, isError } = useInternships();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (isError) {
    return (
      <ErrorMessage>
        Failed to load internships: {error.message}
      </ErrorMessage>
    );
  }
  
  return <div>{/* Render data */}</div>;
}
```

## Best Practices

1. **Use React Query hooks** instead of direct service calls in components
2. **Enable/disable queries** based on dependencies:
   ```typescript
   const { data } = useInternship(id, { enabled: !!id });
   ```

3. **Handle loading and error states** in components
4. **Use optimistic updates** for better UX:
   ```typescript
   const mutation = useUpdateInternship({
     onMutate: async (variables) => {
       // Optimistically update cache
     },
   });
   ```

5. **Invalidate queries** after mutations to refetch fresh data
6. **Use Socket.io hooks** for real-time features instead of polling
7. **Cleanup socket connections** in useEffect return functions
8. **Type everything** - leverage TypeScript for type safety

## Additional Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Socket.io Client Docs](https://socket.io/docs/v4/client-api/)
- [Axios Docs](https://axios-http.com/docs/intro)
