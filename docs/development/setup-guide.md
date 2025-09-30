# Intern-Galing Development Setup Guide

## Prerequisites

### Software Requirements
- Node.js 18+ 
- Python 3.9+
- Git
- VS Code (recommended)

### Accounts Required  
- GitHub account
- Supabase account (free tier)

## Installation Steps

### 1. Clone Repository
\```bash
git clone https://github.com/rimurutachi/internship-platform.git
cd internship-platform
\```

### 2. Frontend Setup
\```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
\```

### 3. Backend Setup
\```bash
cd ../backend
npm install  
cp .env.example .env
# Edit .env with your credentials
npm run dev
\```

### 4. AI Service Setup
\```bash
cd ../ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
\```

## Development Workflow

### Daily Development
1. Pull latest changes: `git pull origin main`
2. Start services: `npm run dev` in each folder
3. Make changes and test
4. Commit changes: `git add . && git commit -m "description"`
5. Push changes: `git push origin main`

### Testing
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`
- AI Service: `cd ai-service && pytest`

## Common Issues

### Port Conflicts
- Frontend: http://localhost:3000
- Backend: http://localhost:5000  
- AI Service: http://localhost:8000

If ports are busy, kill processes or change ports in config.

### Environment Variables
Make sure all .env files have correct values:
- Supabase URL and keys
- Database connection strings
- JWT secrets

## Getting Help
- Check docs/ folder for specific guides
- Create GitHub issue for bugs
- Contact: jimmaridioma20@gmail.com