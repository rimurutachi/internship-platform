#!/bin/bash

# Comprehensive Service Startup Script for Testing
# Run this script to start all services before E2E testing

echo "=========================================="
echo "Starting All Services"
echo "=========================================="
echo ""

# Get the project root directory
PROJECT_ROOT="/c/Users/jimma/OneDrive/Desktop/internship-platform"

# 1. Start Backend with PM2
echo "1️⃣  Starting Backend Service..."
cd "$PROJECT_ROOT/backend"
pm2 start ecosystem.config.js
echo "✅ Backend started on http://localhost:5000"
echo ""

# 2. Start Frontend (in background)
echo "2️⃣  Starting Frontend Service..."
cd "$PROJECT_ROOT/frontend"
# Kill existing frontend process if any
pkill -f "next dev" 2>/dev/null || true
# Start frontend in background
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend starting on http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""

# 3. Start Document Service (in background)
echo "3️⃣  Starting Document Service..."
cd "$PROJECT_ROOT/document-service"
# Kill existing document service if any
pkill -f "ts-node.*document-service" 2>/dev/null || true
# Start document service in background
nohup npm run dev > ../logs/document-service.log 2>&1 &
DOC_SERVICE_PID=$!
echo "✅ Document Service starting on http://localhost:6000 (PID: $DOC_SERVICE_PID)"
echo ""

# 4. Start AI Service (requires Python venv)
echo "4️⃣  Starting AI Service..."
cd "$PROJECT_ROOT/ai-service"
# Kill existing AI service if any
pkill -f "uvicorn main:app" 2>/dev/null || true

# Check if venv exists
if [ ! -d "venv" ]; then
  echo "⚠️  Python virtual environment not found. Creating..."
  python -m venv venv
  source venv/Scripts/activate
  pip install -r requirements.txt
else
  source venv/Scripts/activate
fi

# Start AI service in background
nohup uvicorn main:app --reload --port 8000 > ../logs/ai-service.log 2>&1 &
AI_SERVICE_PID=$!
echo "✅ AI Service starting on http://localhost:8000 (PID: $AI_SERVICE_PID)"
echo ""

# Wait for services to start
echo "⏳ Waiting for services to initialize (10 seconds)..."
sleep 10
echo ""

# Verify services are running
echo "=========================================="
echo "Service Health Check"
echo "=========================================="
echo ""

# Check Backend
echo "🔍 Backend:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "   ✅ Running (HTTP 200)"
else
  echo "   ❌ Not responding (HTTP $BACKEND_STATUS)"
fi

# Check Frontend
echo "🔍 Frontend:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   ✅ Running (HTTP 200)"
else
  echo "   ⏳ Still starting... (HTTP $FRONTEND_STATUS)"
fi

# Check Document Service
echo "🔍 Document Service:"
DOC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6000/health 2>/dev/null || echo "000")
if [ "$DOC_STATUS" = "200" ]; then
  echo "   ✅ Running (HTTP 200)"
else
  echo "   ⏳ Still starting... (HTTP $DOC_STATUS)"
fi

# Check AI Service
echo "🔍 AI Service:"
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$AI_STATUS" = "200" ]; then
  echo "   ✅ Running (HTTP 200)"
else
  echo "   ⏳ Still starting... (HTTP $AI_STATUS)"
fi

echo ""
echo "=========================================="
echo "Process IDs (for manual shutdown):"
echo "=========================================="
echo "Backend: PM2 managed (use 'pm2 stop internship-backend')"
echo "Frontend: PID $FRONTEND_PID (use 'kill $FRONTEND_PID')"
echo "Document Service: PID $DOC_SERVICE_PID (use 'kill $DOC_SERVICE_PID')"
echo "AI Service: PID $AI_SERVICE_PID (use 'kill $AI_SERVICE_PID')"
echo ""

# Save PIDs for later shutdown
echo "$FRONTEND_PID" > "$PROJECT_ROOT/logs/frontend.pid"
echo "$DOC_SERVICE_PID" > "$PROJECT_ROOT/logs/document-service.pid"
echo "$AI_SERVICE_PID" > "$PROJECT_ROOT/logs/ai-service.pid"

echo "=========================================="
echo "All services started!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "1. Open TESTING_CHECKLIST.md"
echo "2. Follow the testing flows"
echo "3. Run './test-ai-analytics.sh' to test AI service"
echo ""
echo "🛑 To stop all services, run: ./stop-all-services.sh"
echo ""
