#!/bin/bash

# Stop All Services Script

echo "=========================================="
echo "Stopping All Services"
echo "=========================================="
echo ""

PROJECT_ROOT="/c/Users/jimma/OneDrive/Desktop/internship-platform"

# Stop Backend (PM2)
echo "1️⃣  Stopping Backend..."
pm2 stop internship-backend
echo ""

# Stop Frontend
echo "2️⃣  Stopping Frontend..."
if [ -f "$PROJECT_ROOT/logs/frontend.pid" ]; then
  FRONTEND_PID=$(cat "$PROJECT_ROOT/logs/frontend.pid")
  kill $FRONTEND_PID 2>/dev/null || echo "Frontend already stopped"
  rm "$PROJECT_ROOT/logs/frontend.pid"
else
  pkill -f "next dev" 2>/dev/null || echo "Frontend not running"
fi
echo ""

# Stop Document Service
echo "3️⃣  Stopping Document Service..."
if [ -f "$PROJECT_ROOT/logs/document-service.pid" ]; then
  DOC_PID=$(cat "$PROJECT_ROOT/logs/document-service.pid")
  kill $DOC_PID 2>/dev/null || echo "Document Service already stopped"
  rm "$PROJECT_ROOT/logs/document-service.pid"
else
  pkill -f "ts-node.*document-service" 2>/dev/null || echo "Document Service not running"
fi
echo ""

# Stop AI Service
echo "4️⃣  Stopping AI Service..."
if [ -f "$PROJECT_ROOT/logs/ai-service.pid" ]; then
  AI_PID=$(cat "$PROJECT_ROOT/logs/ai-service.pid")
  kill $AI_PID 2>/dev/null || echo "AI Service already stopped"
  rm "$PROJECT_ROOT/logs/ai-service.pid"
else
  pkill -f "uvicorn main:app" 2>/dev/null || echo "AI Service not running"
fi
echo ""

echo "=========================================="
echo "All services stopped!"
echo "=========================================="
