#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting ReachInbox Development Environment...${NC}"

# Check if Python backend dependencies are installed
if [ ! -d "python-backend/venv" ]; then
    echo -e "${BLUE}Installing Python dependencies...${NC}"
    cd python-backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start Python backend in background
echo -e "${GREEN}Starting Python backend on port 8000...${NC}"
cd python-backend
source venv/bin/activate
python main.py &
PYTHON_PID=$!
cd ..

# Wait for Python backend to start
sleep 3

# Start Node.js dev server
echo -e "${GREEN}Starting Node.js dev server...${NC}"
npm run dev &
NODE_PID=$!

# Handle cleanup on exit
trap "kill $PYTHON_PID $NODE_PID" EXIT

echo -e "${GREEN}✓ Both servers are running!${NC}"
echo -e "${BLUE}Python Backend: http://localhost:8000${NC}"
echo -e "${BLUE}Node.js Server: http://localhost:5173${NC}"
echo -e "${BLUE}App Preview: http://localhost:8080${NC}"

# Wait for both processes
wait
