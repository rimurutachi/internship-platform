# 🚀 Intern-Galing - AI-Powered Decentralized Internship Management Platform

Modern platform bridging universities and companies through intelligent internship management and automated evaluation using Linear Law-based Transformation (LLT) + Sentiment Analysis.

## ✨ Features

- **AI-Powered Evaluations**: Automated grading using LLT + Sentiment Analysis
- **Multi-Stakeholder Platform**: Students, Advisors, Company Supervisors
- **Real-time Communication**: Live messaging and notifications
- **Decentralized Architecture**: Blockchain-verified evaluation records
- **Advanced Analytics**: Performance insights and career matching
- **Dynamic Document Management**: Comprehensive document management workflow

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: Tailwind CSS + Material-UI
- **Real-time**: Socket.io client
- **Document Editor**: Tiptap + Yjs (CRDT)
- **State Management**: Zustand + React Query

### Backend  
- **Runtime**: Node.js with Express
- **API**: RESTful + WebSocket
- **Authentication**: Supabase Auth + JWT
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis
- **Job Queue**: Bull

### Document Service
- **Framework**: Node.js + Express
- **WebSocket Server**: Socket.io
- **Document Processing**: Mammoth, PDFKit
- **Collaboration**: Yjs, Operational Transform
- **Storage**: Supabase Storage

### AI Service
- **Framework**: Python FastAPI
- **ML Libraries**: scikit-learn, NLTK, spaCy
- **Algorithms**: LLT, Sentiment Analysis
- **NLP**: TextBlob, VADER

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend), Railway (Backend)
- **Monitoring**: Sentry, LogRocket

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Redis
- Supabase account

### Installation

#### 1. Clone Repository
\`\`\`bash
git clone https://github.com/yourusername/internconnect-platform.git
cd internconnect-platform
\`\`\`

#### 2. Frontend Setup
\`\`\`bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
# Runs on http://localhost:3000
\`\`\`

#### 3. Backend Setup
\`\`\`bash
cd ../backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
# Runs on http://localhost:5000
\`\`\`

#### 4. Document Service Setup
\`\`\`bash
cd ../document-service
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
# Runs on http://localhost:6000 (HTTP)
# WebSocket on ws://localhost:6000
\`\`\`

#### 5. AI Service Setup
\`\`\`bash
cd ../ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
\`\`\`

#### 6. Redis Setup (Required for Document Collaboration)
\`\`\`bash
# macOS
brew install redis
redis-server

# Windows (use WSL or download from redis.io)
# Linux
sudo apt-get install redis-server
sudo service redis-server start
\`\`\`

## 📚 Documentation

### Development Guides
- [Setup Guide](docs/development/setup-guide.md) - Complete installation instructions
- [Development Workflow](docs/development/workflow.md) - Git workflow and best practices
- [Testing Guide](docs/development/testing.md) - Testing strategies and examples
- [Document Management Architecture](docs/development/document-management.md) - NEW

### API Documentation
- [REST API Endpoints](docs/api/rest-endpoints.md) - Complete API reference
- [WebSocket Events](docs/api/websocket-events.md) - Real-time event documentation
- [Document APIs](docs/api/document-apis.md) - NEW
- [Authentication](docs/api/authentication.md) - Auth flows and tokens

### User Guides
- [Student Guide](docs/user-guides/student-guide.md) - For student users
- [Advisor Guide](docs/user-guides/advisor-guide.md) - For university advisors
- [Supervisor Guide](docs/user-guides/supervisor-guide.md) - For company supervisors
- [Document Collaboration Guide](docs/user-guides/document-collaboration.md) - For document service

### Deployment
- [Deployment Guide](docs/deployment/deployment-guide.md) - Production deployment
- [Environment Variables](docs/deployment/environment-variables.md) - Configuration reference

## 🧪 Testing

\```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Coverage reports
npm run test:coverage
\```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project have no license yet. For thesis purposes.

## 📞 Support

- 📧 Email: support@intern-galing.edu or jimmaridioma20@gmail.com

---

**Made with ❤️ for revolutionizing internship management through AI and collaborative technology**

*Last Updated: [September 20, 2025]*
*Version: 1.1.0 (Enhanced with Document Management)*
\`\`\`

---
