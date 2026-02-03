# 🚀 Intern-Galing - AI-Powered Internship Management Platform

**Modern full-stack platform bridging universities and companies through intelligent internship management, real-time collaboration, and AI-powered trend analysis system.**

Built with a microservices architecture featuring **Historical Trend Analysis** on approved evaluations for data-driven placement decisions, manual **Rubric-Based Evaluation System** for fair grading, and real-time **Document Collaboration** for seamless teamwork.

---

## ✨ Key Features

### 🤖 **AI-Powered Analytics System** (v2.0.0)
- **Historical Trend Analysis**: Analyzes approved evaluations for decision support
- **Company Performance Ranking**: Identifies top-performing companies and placement patterns
- **University Comparison**: Cross-university performance analysis and best-match companies
- **Skill Demand Analysis**: Tracks skill trends, gaps, and training recommendations
- **Admin Dashboard Insights**: Quick insights for platform-wide decision making
- **Note**: Evaluations are created manually by supervisors using rubrics (no AI involvement in grading)

### 👥 **Multi-Role Platform (5-Level Module Architecture)**
1. **User Management Module**: Role-based access (Student, Advisor, Supervisor, Admin)
2. **Communication Hub**: Real-time messaging with file sharing across all roles
3. **Evaluation Module**: Weekly reports → Supervisor review → Advisor approval workflow
4. **Document Management**: Collaborative editing with real-time sync (WebSocket-based)
5. **Reports & Analytics**: Platform-wide insights and exportable university reports

### ⚡ **Real-Time Capabilities**
- **Live Messaging**: Socket.io-powered instant communication
- **Document Collaboration**: Yjs CRDT for simultaneous editing (Google Docs-style)
- **Push Notifications**: Real-time updates for evaluations, messages, and approvals
- **WebSocket Sync**: Dedicated document collaboration server (port 6001)

### 📊 **Advanced Analytics Dashboard**
- Performance metrics across all internships
- AI-generated insights from approved evaluations
- Skill trend analysis and recognition patterns
- Exportable reports (PDF/Excel) for university submissions

### 🔐 **Enterprise-Grade Security**
- Supabase Auth with JWT token validation
- Role-based access control (RBAC) with middleware protection
- Security audit logging (login attempts, system events, alerts)
- Redis session management for scalability

---

## 🛠️ Tech Stack

### **Frontend** (`port 3000`)
- **Framework**: Next.js 15 + Turbopack (React 18+)
- **Language**: TypeScript
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Real-time**: Socket.io client (Backend Socket + Document WebSocket)
- **Document Editor**: Tiptap + Yjs (CRDT-based collaboration)
- **State Management**: React Query + Zustand
- **Mobile-First**: Responsive design with dedicated mobile navigation

### **Backend** (`port 5000`)
- **Runtime**: Node.js 18+ with Express
- **Language**: TypeScript
- **API**: REST + Socket.io (real-time events)
- **Authentication**: Supabase Auth (JWT-based)
- **Database**: Supabase PostgreSQL (serverless)
- **Caching**: Redis (sessions + real-time data)
- **Testing**: Jest + ts-jest
- **Process Manager**: PM2

### **Document Service** (`HTTP: 6000, WebSocket: 6001`)
- **Framework**: Node.js + Express + Socket.io
- **Language**: TypeScript
- **Collaboration Engine**: Yjs + Operational Transform
- **Document Processing**: Mammoth (DOCX), PDFKit (PDF generation)
- **Storage**: Supabase Storage
- **Real-time Sync**: Dedicated WebSocket server for simultaneous editing

### **AI Service** (`port 8000`) - v2.0.0 Trend Analysis
- **Framework**: Python 3.9+ FastAPI
- **ML Libraries**: scikit-learn, NLTK, spaCy
- **Purpose**: Historical evaluation trend analysis for admin decision support
- **Components**: 
  - TrendAnalyzer: Main trend analysis orchestrator
  - PerformanceAnalyzer: Company and university performance statistics
  - SkillTrendAnalyzer: Skill demand analysis over time and by company
  - FeatureExtractor: Skill extraction from feedback text
  - EnhancedSentimentAnalyzer: Sentiment extraction from feedback
- **NLP**: TextBlob, VADER, Custom Feature Extractors
- **Endpoints**: 
  - `/api/analyze-trends` - Comprehensive trend analysis
  - `/api/dashboard-insights` - Quick admin dashboard insights
  - `/api/company-performance` - Company performance ranking
  - `/api/university-performance` - University comparison
  - `/api/university-company-matrix` - Cross-tabulation analysis
  - `/api/skill-analysis` - Skill demand trends
  - `/api/evaluate-post-approval` - Legacy endpoint (backward compatibility)

### **Infrastructure & Services**
- **Primary Database**: Supabase (PostgreSQL 15+)
- **File Storage**: Supabase Storage (S3-compatible)
- **Session Store**: Redis 7+
- **Real-time**: Socket.io (rooms-based pub/sub)
- **Deployment Ready**: Docker Compose included
- **Logging**: Structured logging (PM2, file-based, database audit logs)

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Python 3.9+ with pip
- Redis 7+ (for sessions & document collaboration)
- Supabase account (free tier works)
- Git

---

### **Option 1: Quick Start All Services (Recommended)**

Use the automated startup script to launch all services with proper logging:

```bash
# 1. Clone the repository
git clone https://github.com/rimurutachi/internship-platform.git
cd internship-platform

# 2. Set up environment files (copy .env.example to .env in each service)
# Edit the .env files with your Supabase credentials

# 3. Install dependencies for all services
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd document-service && npm install && cd ..
cd ai-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..

# 4. Start Redis (required)
redis-server  # or: brew services start redis (macOS)

# 5. Run the startup script
cd docs/updated-fixes
./start-all-services.sh

# Services will start with logs in logs/ directory:
# - Backend: logs/backend.log
# - Frontend: logs/frontend.log
# - Document Service: logs/document-service.log
# - AI Service: logs/ai-service.log

# 6. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Document Service: http://localhost:6000 (WS: 6001)
# AI Service: http://localhost:8000
```

---

### **Option 2: Manual Service Startup**

#### **1. Clone Repository**
```bash
git clone https://github.com/rimurutachi/internship-platform.git
cd internship-platform
```

#### **2. Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env.local

# Edit .env.local with:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# NEXT_PUBLIC_API_URL=http://localhost:5000
# NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
# NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:6001
# NEXT_PUBLIC_APP_URL=http://localhost:3000

npm run dev
# ✅ Runs on http://localhost:3000
```

#### **3. Backend Setup**
```bash
cd ../backend
npm install
cp .env.example .env

# Edit .env with:
# PORT=5000
# FRONTEND_URL=http://localhost:3000
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_KEY=your_service_key
# DATABASE_URL=your_postgres_url
# JWT_SECRET=your_jwt_secret
# REDIS_URL=redis://localhost:6379
# AI_SERVICE_URL=http://localhost:8000

npm run dev
# ✅ Runs on http://localhost:5000
```

#### **4. Document Service Setup**
```bash
cd ../document-service
npm install
cp .env.example .env

# Edit .env with:
# PORT=6000
# WEBSOCKET_PORT=6001
# FRONTEND_URL=http://localhost:3000
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_KEY=your_service_key
# DATABASE_URL=your_postgres_url
# REDIS_URL=redis://localhost:6379

npm run dev
# ✅ HTTP on http://localhost:6000
# ✅ WebSocket on ws://localhost:6001
```

#### **5. AI Service Setup**
```bash
cd ../ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: Create .env if needed
# PORT=8000

uvicorn main:app --reload --port 8000
# ✅ Runs on http://localhost:8000
# ✅ Docs at http://localhost:8000/docs
```

#### **6. Redis Setup** (Required)
```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server
sudo service redis-server start

# Windows (WSL recommended)
# Download from https://redis.io/download
```

---

### **Health Checks**
After starting all services, verify they're running:

```bash
# Backend
curl http://localhost:5000/health

# Document Service
curl http://localhost:6000/health

# AI Service
curl http://localhost:8000/health

# Frontend (open in browser)
http://localhost:3000
```

---

## 📐 System Architecture

### **Microservices Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                   │
│                         Port 3000                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Student    │  │   Advisor    │  │  Supervisor  │         │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│             │              │              │                     │
│             └──────────────┴──────────────┘                     │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  BACKEND API    │  │ DOCUMENT SERVICE│  │  AI SERVICE     │
│  (Express)      │  │ (Express+Socket)│  │  (FastAPI)      │
│  Port 5000      │  │ HTTP: 6000      │  │  Port 8000      │
│                 │  │ WS: 6001        │  │                 │
│  • REST API     │  │ • Doc CRUD      │  │ • LLT Engine    │
│  • Socket.io    │  │ • Yjs Collab    │  │ • Sentiment AI  │
│  • Auth         │  │ • Real-time     │  │ • Bias Detect   │
│  • Evaluations  │  │   Editing       │  │ • Skill Extract │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │         SHARED INFRASTRUCTURE          │
         │                                        │
         │  ┌──────────────┐  ┌──────────────┐  │
         │  │  Supabase    │  │    Redis     │  │
         │  │  PostgreSQL  │  │   Cache +    │  │
         │  │  + Auth      │  │   Sessions   │  │
         │  │  + Storage   │  │              │  │
         │  └──────────────┘  └──────────────┘  │
         └────────────────────────────────────────┘
```

### **5-Level Module Architecture**

#### **Level 1: User Management Module**
- **Admin-Controlled**: Admin creates accounts for Students, Advisors, Supervisors
- No self-registration; role-based dashboard routing
- User archival workflow for post-internship cleanup

#### **Level 2: Communication Hub Module**
- **All Roles Equal**: Direct messaging between any roles
- File sharing in messages (separate from Document Management)
- Real-time notifications via Socket.io

#### **Level 3: Evaluation Module** (Core Workflow)
```
Student → Weekly Report → Supervisor Reviews
                              ↓
                        Supervisor Submits Final Eval (Manual Rubric-Based)
                              ↓
                        Advisor Approves + Grades
                              ↓
                        Admin: Historical Trend Analysis + Export
```
- **Manual Evaluation**: Supervisors create evaluations using active rubric criteria (NO AI involvement)
- **Rubric-Based Grading**: Total score calculated from criterion scores, converted to grade equivalent
- Scheduled reveal dates for student final evaluations
- **Admin Analytics**: AI analyzes approved evaluations for historical trends and insights (post-completion only)

#### **Level 4: Document Management Module**
- **Collaborative Editing**: Google Docs-style real-time sync
- Role-based sharing (Student/Advisor/Supervisor only; not to Admin)
- Separate from Communication Hub file attachments
- WebSocket-based Yjs CRDT synchronization

#### **Level 5: Reports & Analytics Module** (Admin Only)
- Platform-wide metrics dashboard
- AI-generated insights from historical data
- PDF/Excel export for university reporting
- Performance trends and skill analysis

---

## 📚 Documentation

### **Core Documentation**
- [📖 Copilot Instructions](.github/copilot-instructions.md) - **START HERE**: Complete system reference
- [🔐 Auth Integration](docs/AUTH_INTEGRATION_SUMMARY.md) - Supabase Auth + JWT flow
- [📄 Database Schema](docs/DATABASE_SCHEMA.md) - Security & audit tables reference

### **Development Guides**
- [🚀 Service Startup Guide](docs/SERVICE_STARTUP_GUIDE.md) - Quick service launch reference
- [🐛 My Students Debug Guide](docs/MY_STUDENTS_DEBUG_GUIDE.md) - Troubleshooting common issues
- [✅ Document Service Validation](docs/DOCUMENT_SERVICE_VALIDATION.md) - Collaboration testing

### **API Documentation**
- [🌐 REST API Endpoints](docs/api/rest-endpoints.md) - Complete API reference
- [⚡ WebSocket Events](docs/api/websocket-events.md) - Real-time event specs
- [📄 Document APIs](docs/api/document-apis.md) - Document collaboration endpoints
- [🔑 Authentication](docs/api/authentication.md) - Auth flows and token management
- [🤖 AI Service Integration](docs/api/ai-service-integration.md) - AI endpoints usage

### **AI Service Integration Docs**
- [📘 AI Integration Quick Ref](docs/ai-service-integration-docs/AI_INTEGRATION_QUICK_REF.md)
- [🚀 Phase 1 Implementation](docs/ai-service-integration-docs/PHASE1_IMPLEMENTATION.md)
- [🎯 Phase 1 Frontend Integration](docs/ai-service-integration-docs/PHASE1_FRONTEND_INTEGRATION.md)
- [🗺️ Schema Mapping Reference](docs/ai-service-integration-docs/SCHEMA_MAPPING_REFERENCE.md)

### **User Guides** (Role-Specific)
- [👨‍🎓 Student Guide](docs/user-guides/student-guide.md) - For interns
- [👨‍🏫 Advisor Guide](docs/user-guides/advisor-guide.md) - For university advisors
- [👨‍💼 Supervisor Guide](docs/user-guides/supervisor-guide.md) - For company supervisors
- [📝 Document Collaboration Guide](docs/user-guides/document-collaboration.md) - Real-time editing

### **Admin Documentation**
- [📊 Evaluations Page](docs/admin-docs/evaluations-page/)
- [📄 Documents Management](docs/admin-docs/documents-page/)
- [💼 Internships Management](docs/admin-docs/internships-page/)
- [🔔 Notifications System](docs/admin-docs/notifications-page/)
- [🔒 Security Dashboard](docs/admin-docs/security-page/)
- [⚙️ System Settings](docs/admin-docs/systems-page/)

### **Deployment & Fixes**
- [🛠️ Updated Fixes](docs/updated-fixes/) - Latest patches and improvements
- [🐛 Fixes Documentation](docs/admin-docs/fixes-docs/) - Known issues and solutions

---

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
npm test                # Run all tests
npm run test:coverage   # With coverage report
npm run test:watch      # Watch mode
```

**Test Structure:**
- `tests/unit/` - Unit tests for services/utilities
- `tests/integration/` - API endpoint integration tests
- `tests/communication.test.ts` - Communication module tests
- `tests/internships.test.ts` - Internship workflow tests

### **Frontend Tests**
```bash
cd frontend
npm test                # Run all tests
npm run test:coverage   # With coverage report
npm run test:watch      # Watch mode
```

### **AI Service Tests**
```bash
cd ai-service
source venv/bin/activate
python -m pytest tests/ -v

# Or use test scripts
cd ../docs/updated-fixes
./test-ai-evaluate.sh       # Test basic evaluation
./test-ai-bias.sh           # Test bias detection
./test-ai-batch.sh          # Test batch processing
```

---

## 🔧 Development Workflow

### **Branch Strategy**
- `main` - Production-ready code
- `develop` - Active development (current branch)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### **Commit Convention**
```
feat: Add bias detection to AI evaluation
fix: Resolve document sync race condition
docs: Update API documentation for WebSocket events
refactor: Optimize evaluation service query performance
test: Add integration tests for weekly reports
```

### **Pull Request Checklist**
- [ ] Tests pass (`npm test` / `pytest`)
- [ ] No console errors in browser/terminal
- [ ] Updated relevant documentation
- [ ] Code follows project conventions
- [ ] Environment variables documented (if new)

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Services won't start**
```bash
# Check if ports are in use
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :6000  # Document HTTP
lsof -i :6001  # Document WS
lsof -i :8000  # AI Service

# Kill process if needed
kill -9 <PID>
```

#### **Redis connection errors**
```bash
# Check if Redis is running
redis-cli ping  # Should return "PONG"

# Start Redis
redis-server
# or
brew services start redis  # macOS
```

#### **Supabase authentication fails**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env` files
- Check Supabase project is not paused (free tier auto-pauses)
- Ensure JWT secret matches in backend `.env`

#### **Document collaboration not working**
- Confirm Redis is running
- Check `NEXT_PUBLIC_WEBSOCKET_URL` uses `ws://localhost:6001`
- Verify document-service WebSocket server started on port 6001

#### **AI Service returns errors**
- Ensure Python venv is activated
- Verify all dependencies installed: `pip install -r requirements.txt`
- Check input text is at least 10 characters
- Review logs at `logs/ai-service.log`

---

## 📊 Environment Variables Reference

### **Required Variables per Service**

#### **Frontend** (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:6001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### **Backend** (`.env`)
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_jwt_secret_min_32_chars
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
```

#### **Document Service** (`.env`)
```env
PORT=6000
WEBSOCKET_PORT=6001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379
```

#### **AI Service** (`.env` - optional)
```env
PORT=8000
DATABASE_URL=postgresql://user:pass@host:5432/db  # Optional
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **1. Fork & Clone**
```bash
git clone https://github.com/YOUR_USERNAME/internship-platform.git
cd internship-platform
git checkout develop
```

### **2. Create Feature Branch**
```bash
git checkout -b feature/your-amazing-feature
```

### **3. Make Changes**
- Write clean, documented code
- Add tests for new features
- Update documentation as needed
- Follow existing code style

### **4. Test Your Changes**
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# AI Service
cd ai-service && pytest
```

### **5. Commit & Push**
```bash
git add .
git commit -m "feat: Add your amazing feature"
git push origin feature/your-amazing-feature
```

### **6. Open Pull Request**
- Target the `develop` branch
- Provide clear description of changes
- Reference related issues (if any)
- Ensure CI/CD checks pass

---

## 📄 License

This project is currently **unlicensed** and is being developed for **thesis/academic purposes**.

---

## 👥 Team & Support

### **Development Team**
- **Lead Developer**: Jimmar Idioma
- **Project Type**: Thesis Project
- **Institution**: Cavite State University

### **Contact & Support**
- 📧 **Email**: jimmaridioma20@gmail.com
- 📧 **Support**: support@intern-galing.edu
- 🐛 **Issues**: [GitHub Issues](https://github.com/rimurutachi/internship-platform/issues)
- 📖 **Documentation**: [Project Wiki](https://github.com/rimurutachi/internship-platform/wiki)

---

## 🎯 Project Status & Roadmap

### **Current Version: 2.0.0 - Trend Analysis Focus**
- ✅ AI Service v2.0.0 (Historical Trend Analysis for Admin Decision Support)
- ✅ Manual Rubric-Based Evaluation System
- ✅ Real-time Document Collaboration
- ✅ 5-Level Module Architecture Complete
- ✅ Admin Analytics Dashboard with AI Insights
- ✅ Mobile-Responsive Design
- ✅ Company Performance Ranking
- ✅ University Comparison Analysis
- ✅ Skill Demand Tracking

### **Known Limitations & Future Enhancements**
- 🔄 Rubric management interface (currently admin-only via direct DB updates)
- 🔄 Advanced document templates and workflow automation
- 🔄 Email notification system integration
- 🔄 Bulk user import/export functionality
- 🔄 Enhanced AI: Predictive analytics for student placement success
- 🔄 Mobile app development (React Native)
- 🔄 Integration with university LMS (e.g., Canvas, Moodle)

---

## 🙏 Acknowledgments

- **Cavite State University** - For academic support and guidance
- **Supabase** - For providing excellent backend infrastructure
- **Vercel** - For Next.js framework and hosting platform
- **FastAPI Community** - For Python web framework
- **Open Source Community** - For the amazing tools and libraries

---

<div align="center">

**Made with ❤️ for revolutionizing internship management through AI and collaborative technology**

⭐ **Star this repo if you find it helpful!** ⭐

*Last Updated: January 13, 2026*  
*Version: 2.0.0 (Trend Analysis + Manual Rubric-Based Evaluation)*

</div>
