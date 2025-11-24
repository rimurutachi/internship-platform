# Notifications System Documentation

## Overview

The `NotificationsDropdown` component is a fully-featured, reusable notifications system that can be used across all roles (admin, student, advisor, supervisor) in the internship platform.

## Features

✅ **Real-time Updates** - Ready for WebSocket integration  
✅ **Role-agnostic** - Works with any user role  
✅ **Mock Data Support** - Built-in mock notifications for development  
✅ **Backend Ready** - Callbacks for all CRUD operations  
✅ **Type Safety** - Full TypeScript support  
✅ **Accessible** - ARIA labels and keyboard navigation  
✅ **Responsive** - Mobile-friendly design  
✅ **Theme Support** - Works with light/dark themes  

## Component Location

```
frontend/src/components/ui/NotificationsDropdown.tsx
```

## Quick Start

### Basic Usage (Mock Data)

```tsx
import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';

export function Header() {
  return (
    <header>
      <NotificationsDropdown />
    </header>
  );
}
```

The component will automatically display 5 mock notifications for development.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `notifications` | `Notification[]` | Optional custom notifications array |
| `onNotificationClick` | `(notification: Notification) => void` | Callback when notification is clicked |
| `onMarkAsRead` | `(notificationId: string) => void` | Callback when notification is marked as read |
| `onDelete` | `(notificationId: string) => void` | Callback when notification is deleted |
| `onMarkAllAsRead` | `() => void` | Callback when all notifications are marked as read |
| `onClearAll` | `() => void` | Callback when all notifications are cleared |

## Notification Interface

```typescript
interface Notification {
  id: string;                                      // Unique identifier
  type: 'info' | 'success' | 'warning' | 'error'; // Notification type
  title: string;                                   // Notification title
  message: string;                                 // Notification message
  timestamp: string;                               // Time ago string (e.g., "5 min ago")
  read: boolean;                                   // Read status
  link?: string;                                   // Optional link to navigate
}
```

## Notification Types & Colors

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `info` | Info | Blue | General information, updates |
| `success` | CheckCircle | Green | Successful actions, completions |
| `warning` | AlertTriangle | Yellow | Warnings, reminders, scheduled events |
| `error` | AlertCircle | Red | Errors, security alerts, failed actions |

## Backend Integration

### API Endpoints (To Be Implemented)

```
GET    /api/notifications              - Get all notifications
GET    /api/notifications/:role        - Get role-specific notifications
PATCH  /api/notifications/:id/read     - Mark notification as read
DELETE /api/notifications/:id          - Delete a notification
PATCH  /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/clear-all    - Clear all notifications
```

### WebSocket Events (To Be Implemented)

```
notification:new        - New notification received
notification:update     - Notification updated
notification:delete     - Notification deleted
```

## Integration Examples

### 1. Admin Header (Current Implementation)

```tsx
// components/admin/AdminHeader.tsx
import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';

export const AdminHeader = () => {
  return (
    <header>
      <NotificationsDropdown />
    </header>
  );
};
```

### 2. With Backend API

```tsx
import { useState, useEffect } from 'react';
import { NotificationsDropdown, Notification } from '@/components/ui/NotificationsDropdown';

export function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data));
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  };

  const handleDelete = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <NotificationsDropdown
      notifications={notifications}
      onMarkAsRead={handleMarkAsRead}
      onDelete={handleDelete}
    />
  );
}
```

### 3. With WebSocket Real-time

```tsx
import { useEffect } from 'react';
import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';
import { useBackendSocket } from '@/hooks/use-backend-socket';

export function Header() {
  const [notifications, setNotifications] = useState([]);
  const socket = useBackendSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.off('notification:new');
    };
  }, [socket]);

  return <NotificationsDropdown notifications={notifications} />;
}
```

### 4. Role-Specific Notifications

```tsx
import { useUserContext } from '@/components/providers/UserProvider';

export function RoleBasedHeader() {
  const { user } = useUserContext();

  const handleNotificationClick = (notification) => {
    const roleBaseUrl = `/dashboard/${user?.role}`;
    if (notification.link) {
      window.location.href = `${roleBaseUrl}${notification.link}`;
    }
  };

  return (
    <NotificationsDropdown onNotificationClick={handleNotificationClick} />
  );
}
```

## UI Features

### Dropdown Features
- **Badge Count** - Shows unread notification count (displays "9+" for 10+ notifications)
- **Empty State** - Displays friendly message when no notifications exist
- **Scrollable List** - Handles large number of notifications with scroll area (max height: 400px)
- **Color-coded Borders** - Left border indicates notification type
- **Read/Unread States** - Visual distinction with background color and font weight
- **Interactive Actions** - Mark as read and delete buttons on hover

### User Actions
- **Click Notification** - Auto-marks as read and navigates if link exists
- **Mark as Read** - Individual notification mark as read button
- **Delete** - Remove individual notification
- **Mark All as Read** - Bulk action to mark all notifications as read
- **Clear All** - Remove all notifications at once
- **View All** - Link to dedicated notifications page (footer button)

## Styling

The component uses:
- Tailwind CSS for styling
- Theme-aware colors via CSS variables
- Lucide React icons
- Shadcn/ui components (DropdownMenu, Button, Badge, ScrollArea)

## Accessibility

- **ARIA labels** on buttons
- **Keyboard navigation** support
- **Focus management** in dropdown
- **Screen reader friendly** notifications

## Migration Guide

### For Other Roles

To add notifications to other role headers:

1. **Import the component:**
   ```tsx
   import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';
   ```

2. **Replace existing notification button:**
   ```tsx
   // Old
   <Button variant="ghost" size="sm" className="relative">
     <Bell className="w-5 h-5" />
     <Badge>5</Badge>
   </Button>

   // New
   <NotificationsDropdown />
   ```

3. **Add backend integration when ready:**
   ```tsx
   <NotificationsDropdown
     notifications={backendNotifications}
     onMarkAsRead={handleMarkAsRead}
     onDelete={handleDelete}
   />
   ```

## Future Enhancements

- [ ] Push notifications support
- [ ] Notification preferences/filters
- [ ] Sound notifications
- [ ] Desktop notifications API
- [ ] Notification categories/grouping
- [ ] Pagination for large notification lists
- [ ] Search/filter notifications
- [ ] Export notification history

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';

test('displays notification count badge', () => {
  render(<NotificationsDropdown />);
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('marks notification as read', () => {
  const handleMarkAsRead = jest.fn();
  render(<NotificationsDropdown onMarkAsRead={handleMarkAsRead} />);
  
  // Open dropdown and mark first notification as read
  fireEvent.click(screen.getByLabelText('Notifications'));
  fireEvent.click(screen.getAllByTitle('Mark as read')[0]);
  
  expect(handleMarkAsRead).toHaveBeenCalledWith('1');
});
```

## Notes

- Mock data is automatically used when no `notifications` prop is provided
- Component is fully controlled when `notifications` prop is provided
- All callbacks are optional - component works standalone
- Icons and colors are theme-aware and will adapt to light/dark mode
- Component handles empty states, loading states can be added as needed

## Support

For questions or issues, contact the development team or create an issue in the repository.
