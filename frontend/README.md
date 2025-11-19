# Intern-Galing Frontend

Next.js 15 frontend application for the Intern-Galing internship management platform.

## 🚀 Features

- **Role-based Dashboards**: Separate interfaces for students, advisors, supervisors, and admins
- **Real-time Communication**: Socket.io integration for messaging and notifications
- **Document Collaboration**: Real-time collaborative document editing
- **Responsive Design**: Mobile-first UI with desktop optimizations
- **Type-safe API**: Full TypeScript integration with backend services
- **Modern UI**: shadcn/ui components with Tailwind CSS
- **Authentication**: Supabase Auth with JWT tokens
- **State Management**: TanStack React Query for server state

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Running backend services (backend, document-service)
- Supabase account

## 🛠️ Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the values:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Backend API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
   
   # Document Service WebSocket URLs
   NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:6000
   
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── dashboard/           # Role-based dashboard pages
│   │   ├── student/         # Student dashboard
│   │   ├── advisor/         # Advisor dashboard
│   │   ├── supervisor/      # Supervisor dashboard
│   │   └── admin/           # Admin dashboard
│   ├── login/               # Login page
│   ├── forgot-password/     # Password reset pages
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── student/             # Student-specific components
│   ├── advisor/             # Advisor-specific components
│   ├── supervisor/          # Supervisor-specific components
│   ├── admin/               # Admin-specific components
│   ├── analytics/           # Analytics components
│   ├── mobile/              # Mobile-specific components
│   ├── auth/                # Authentication components
│   ├── theme/               # Theme provider and toggle
│   ├── ui/                  # shadcn/ui components
│   └── providers/           # React providers
├── hooks/                   # Custom React hooks
│   ├── use-api.ts          # React Query hooks for API
│   ├── use-backend-socket.ts # Socket.io hooks
│   ├── use-mobile.tsx      # Mobile detection hook
│   └── use-toast.ts        # Toast notifications
├── lib/                     # Utilities and services
│   ├── api/                # API services
│   │   ├── client.ts       # Axios client with auth
│   │   └── services/       # Service layer
│   ├── supabase.ts         # Supabase client
│   ├── backendSocket.ts    # Backend Socket.io client
│   ├── documentSocket.ts   # Document Socket.io client
│   └── utils.ts            # Utility functions
├── types/                   # TypeScript type definitions
│   ├── index.ts            # Main types
│   └── api.ts              # API response types
└── utils/                   # Utility functions

```

## 🔌 Backend Integration

### API Services

The frontend uses a clean service layer for backend integration:

```typescript
import { internshipService, evaluationService } from '@/lib/api';

// Fetch internships
const internships = await internshipService.list();

// Create evaluation
const evaluation = await evaluationService.create({
  internship_id: 'uuid',
  evaluator_type: 'advisor',
  evaluation_type: 'midterm',
  scores: { communication: 8 },
});
```

### React Query Hooks

Use React Query hooks for automatic caching and state management:

```typescript
import { useInternships, useCreateInternship } from '@/hooks/use-api';

function MyComponent() {
  const { data, isLoading } = useInternships();
  const createMutation = useCreateInternship();
  
  const handleCreate = () => {
    createMutation.mutate({
      // internship data
    });
  };
}
```

### Real-time Updates

Connect to Socket.io for real-time features:

```typescript
import { useBackendSocket, useSocketEvent } from '@/hooks/use-backend-socket';

function ChatComponent() {
  useBackendSocket(); // Connect to backend
  
  useSocketEvent('message:sent', (message) => {
    console.log('New message:', message);
  });
}
```

See [API_INTEGRATION.md](./API_INTEGRATION.md) for complete documentation.

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components with Tailwind CSS.

### Adding New Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### Custom Components

Role-specific components are in their respective directories:
- `components/student/` - Student UI components
- `components/advisor/` - Advisor UI components
- `components/supervisor/` - Supervisor UI components
- `components/admin/` - Admin UI components

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🎯 Key Features

### Authentication
- Supabase Auth with JWT tokens
- Automatic token refresh
- Role-based access control
- Protected routes

### Dashboards
- **Student**: Internship progress, evaluations, documents
- **Advisor**: Student management, evaluations, analytics
- **Supervisor**: Intern management, evaluations, company info
- **Admin**: System management, users, reports, security

### Real-time Features
- Instant messaging with typing indicators
- Live notifications
- Real-time evaluation updates
- Collaborative document editing

### Responsive Design
- Mobile-first approach
- Adaptive layouts for tablet and desktop
- Touch-optimized interactions
- Bottom navigation for mobile

## 📚 Documentation

- [API Integration Guide](./API_INTEGRATION.md) - Complete API usage guide
- [Component Documentation](./src/components/README.md) - Component usage
- [Backend API Docs](../docs/api/) - Backend API reference

## 🔧 Configuration

### TypeScript
Configuration in `tsconfig.json`. Path aliases configured:
- `@/` maps to `src/`

### Tailwind CSS
Configuration in `tailwind.config.ts`. Custom theme variables in `globals.css`.

### ESLint
Configuration in `eslint.config.mjs`. Extends Next.js and TypeScript rules.

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

### Docker
```bash
# Build image
docker build -t intern-galing-frontend .

# Run container
docker run -p 3000:3000 intern-galing-frontend
```

### Manual
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linting and tests
5. Submit a pull request

## 📝 Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Type Errors
```bash
# Regenerate TypeScript types
npm run build
```

## 📄 License

This project is part of the Intern-Galing platform.

## 👥 Team

Intern-Galing Development Team

---

For more information, see the [main project README](../README.md).
