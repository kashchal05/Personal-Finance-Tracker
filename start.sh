#!/bin/bash
# Start both backend and frontend

BASE="$(cd "$(dirname "$0")" && pwd)"

echo "Starting FastAPI backend on http://localhost:8000 ..."
cd "$BASE/backend"
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting Vite frontend on http://localhost:5173 ..."
cd "$BASE/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "App running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
