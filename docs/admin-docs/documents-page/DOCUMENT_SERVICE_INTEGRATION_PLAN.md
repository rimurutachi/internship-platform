# Document Service Integration Plan

## Current Status
- ❌ Admin documents page uses backend API with 10s polling
- ✅ Document-service ready with WebSocket + Yjs
- ✅ Frontend has documentSocket.ts helper
- ❌ Not connected yet

## Integration Steps

### 1. Update CollaboratorsTab.tsx
Replace polling with WebSocket connection:

```typescript
import { useEffect, useState } from 'react';
import { connectDocumentService } from '@/lib/documentSocket';
import { useUserContext } from '@/components/providers/UserProvider';

export function CollaboratorsTab({ documentId }: CollaboratorsTabProps) {
  const { user } = useUserContext();
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    // Connect to document-service WebSocket
    const socket = connectDocumentService(documentId, user.id);

    // Listen for active users updates
    socket.on('active:users', (users) => {
      setActiveUsers(users);
    });

    // Listen for user joined
    socket.on('user:joined', (newUser) => {
      setActiveUsers(prev => [...prev, newUser]);
    });

    // Listen for user left
    socket.on('user:left', (userId) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== userId));
    });

    // Cleanup
    return () => {
      socket.emit('document:leave', { documentId, userId: user.id });
      socket.off('active:users');
      socket.off('user:joined');
      socket.off('user:left');
    };
  }, [documentId, user?.id]);

  // ... rest of component
}
```

### 2. Add Real-Time Document Editing (Optional)
If you want live editing in DocumentDetailDialog:

```typescript
import { useEffect, useRef } from 'react';
import * as Y from 'yjs';

export function DocumentEditor({ documentId, userId }: Props) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const ydocRef = useRef<Y.Doc>();

  useEffect(() => {
    const socket = connectDocumentService(documentId, userId);
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const ytext = ydoc.getText('content');

    // Listen for remote updates
    socket.on('document:update', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    // Send local updates
    ydoc.on('update', (update: Uint8Array) => {
      socket.emit('document:update', {
        documentId,
        userId,
        update: Array.from(update),
        operationType: 'edit',
        position: editorRef.current?.selectionStart || 0,
        content: ytext.toString()
      });
    });

    // Sync with textarea
    ytext.observe(() => {
      if (editorRef.current) {
        editorRef.current.value = ytext.toString();
      }
    });

    return () => {
      socket.emit('document:leave', { documentId, userId });
      ydoc.destroy();
    };
  }, [documentId, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!ydocRef.current) return;
    const ytext = ydocRef.current.getText('content');
    ytext.delete(0, ytext.length);
    ytext.insert(0, e.target.value);
  };

  return (
    <textarea
      ref={editorRef}
      onChange={handleChange}
      className="w-full h-96 p-4 border rounded"
      placeholder="Start typing..."
    />
  );
}
```

### 3. Update Environment Variables

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:6001
```

**Document-service `.env`:**
```env
PORT=6000
WEBSOCKET_PORT=6001
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### 4. Start Document Service

```bash
cd document-service
npm install
npm run dev
```

The service will run on:
- HTTP API: http://localhost:6000
- WebSocket: ws://localhost:6001

### 5. Update docker-compose.yml

Add document-service:

```yaml
services:
  document-service:
    build: ./document-service
    ports:
      - "6000:6000"
      - "6001:6001"
    environment:
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - FRONTEND_URL=http://frontend:3000
    depends_on:
      - redis
```

## Testing Integration

### 1. Start Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Document Service
cd document-service && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### 2. Test Collaboration
1. Open admin documents page
2. Click on a document
3. Open in another browser/incognito
4. Should see real-time collaborator updates

### 3. Verify WebSocket Connection
Open browser console:
```javascript
// Should see:
Socket connected: {socketId}
User {userId} joined document {documentId}
```

## Benefits After Integration

✅ **Real-time collaboration** - See who's editing instantly
✅ **Live cursor tracking** - See where others are typing
✅ **Conflict resolution** - Yjs CRDT handles simultaneous edits
✅ **Better UX** - No 10s delay for updates
✅ **Scalable** - Redis for distributed state
✅ **Production-ready** - Built for multiple users

## Migration Path

### Phase 1: Keep Current (Recommended for now)
- ✅ Admin can view collaborators with 10s polling
- ✅ Focus on integrating other roles first
- ✅ Less complexity during development

### Phase 2: Add WebSocket for Collaborators
- Update CollaboratorsTab to use WebSocket
- Keep document viewing as-is
- Test with multiple users

### Phase 3: Full Real-Time Editing
- Add Yjs-based document editor
- Implement cursor tracking
- Add conflict resolution UI

## Recommendation

**START WITH PHASE 1** - Your current implementation is good enough for MVP.

**INTEGRATE LATER** when:
- All roles (student, advisor, supervisor) are complete
- You need true real-time collaboration
- You're ready for production deployment

The document-service is **ready and waiting** for when you need it! 🚀
