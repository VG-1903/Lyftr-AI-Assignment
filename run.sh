# #!/bin/bash

# # ========================================
# #   MERN Scraper - Auto Port Launcher
# # ========================================

# echo "Starting MERN Scraper Application..."
# echo

# # Colors for output
# RED='\033[0;31m'
# GREEN='\033[0;32m'
# YELLOW='\033[1;33m'
# NC='\033[0m' # No Color

# # Function to check if port is in use
# is_port_in_use() {
#     local port=$1
#     if command -v lsof >/dev/null 2>&1; then
#         lsof -ti :$port >/dev/null 2>&1
#         return $?
#     elif command -v netstat >/dev/null 2>&1; then
#         netstat -tuln | grep ":$port " >/dev/null 2>&1
#         return $?
#     else
#         # If no tools available, assume port is free
#         return 1
#     fi
# }

# # Function to kill processes on port
# kill_port() {
#     local port=$1
#     if is_port_in_use $port; then
#         echo -e "${YELLOW}Killing processes on port $port...${NC}"
#         if command -v lsof >/dev/null 2>&1; then
#             lsof -ti :$port | xargs kill -9 2>/dev/null || true
#         else
#             fuser -k $port/tcp 2>/dev/null || true
#         fi
#         sleep 1
#     fi
# }

# # Kill processes on common dev ports
# echo -e "${YELLOW}Freeing development ports...${NC}"
# for port in {3000..3010} {5000..5010}; do
#     kill_port $port
# done

# echo

# # Function to find free port
# find_free_port() {
#     local start_port=$1
#     local max_attempts=10
#     local port=$start_port
    
#     for ((i=0; i<max_attempts; i++)); do
#         if ! is_port_in_use $port; then
#             echo $port
#             return 0
#         fi
#         port=$((port + 1))
#     done
    
#     echo -e "${RED}No free ports found between $start_port and $((start_port+max_attempts))${NC}"
#     exit 1
# }

# # Find free ports
# echo -e "${YELLOW}Finding free ports...${NC}"
# BACKEND_PORT=$(find_free_port 5000)
# FRONTEND_PORT=$(find_free_port 3000)

# echo -e "${GREEN}Using ports:${NC}"
# echo "Backend:  $BACKEND_PORT"
# echo "Frontend: $FRONTEND_PORT"
# echo

# # Save ports to config file
# echo "BACKEND_PORT=$BACKEND_PORT" > ports.cfg
# echo "FRONTEND_PORT=$FRONTEND_PORT" >> ports.cfg

# # Check if directories exist
# if [ ! -d "backend" ]; then
#     echo -e "${RED}Error: backend directory not found!${NC}"
#     exit 1
# fi

# if [ ! -d "frontend" ]; then
#     echo -e "${YELLOW}Warning: frontend directory not found${NC}"
#     echo "Running in API-only mode"
#     FRONTEND_AVAILABLE=false
# else
#     FRONTEND_AVAILABLE=true
# fi

# # Start backend
# echo -e "${GREEN}Starting backend server on port $BACKEND_PORT...${NC}"
# cd backend
# PORT=$BACKEND_PORT npm start &
# BACKEND_PID=$!
# cd ..

# # Wait for backend to initialize
# echo "Waiting for backend to start..."
# sleep 8

# # Test backend
# echo "Testing backend connection..."
# if command -v curl >/dev/null 2>&1; then
#     if curl -s "http://localhost:$BACKEND_PORT/healthz" >/dev/null 2>&1; then
#         echo -e "${GREEN}✅ Backend is running${NC}"
#     else
#         echo -e "${YELLOW}⚠️  Backend might be starting slowly...${NC}"
#     fi
# else
#     echo -e "${YELLOW}⚠️  curl not available, skipping backend test${NC}"
# fi

# # Start frontend if available
# if [ "$FRONTEND_AVAILABLE" = true ]; then
#     echo -e "${GREEN}Starting frontend server on port $FRONTEND_PORT...${NC}"
#     cd frontend
#     PORT=$FRONTEND_PORT npm start &
#     FRONTEND_PID=$!
#     cd ..
#     sleep 3
# fi

# # Cleanup function
# cleanup() {
#     echo
#     echo -e "${YELLOW}Shutting down services...${NC}"
#     kill $BACKEND_PID 2>/dev/null || true
#     if [ "$FRONTEND_AVAILABLE" = true ]; then
#         kill $FRONTEND_PID 2>/dev/null || true
#     fi
#     exit 0
# }

# # Trap Ctrl+C
# trap cleanup INT TERM

# echo
# echo "========================================"
# echo -e "${GREEN}🎉 APPLICATION STARTED SUCCESSFULLY!${NC}"
# echo "========================================"
# echo
# echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:$FRONTEND_PORT"
# echo -e "${GREEN}⚙️  Backend API:${NC} http://localhost:$BACKEND_PORT"
# echo -e "${GREEN}📊 Health Check:${NC} http://localhost:$BACKEND_PORT/healthz"
# echo
# echo -e "${YELLOW}📋 Important Notes:${NC}"
# echo "• If ports 3000/5000 were busy, different ports were used"
# echo "• Save these URLs - you'll need them!"
# echo "• Ports saved to: ports.cfg"
# echo
# echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all services${NC}"
# echo

# # Wait for user interrupt
# if [ "$FRONTEND_AVAILABLE" = true ]; then
#     wait $BACKEND_PID $FRONTEND_PID
# else
#     wait $BACKEND_PID
# fi











#!/bin/bash

echo "MERN Scraper Application"
echo ""

# Kill processes on busy ports first
echo "Cleaning ports..."
./kill-ports.sh

echo "Starting backend..."
cd backend
gnome-terminal -- bash -c "npm start; exec bash" &
# Alternative for different terminals:
# xterm -e "npm start" &
# konsole -e "npm start" &
# For macOS:
# osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'/backend\" && npm start"'

sleep 3

echo "Starting frontend..."
cd ../frontend
gnome-terminal -- bash -c "npm start; exec bash" &

echo ""
echo "✅ Application started!"
echo ""
echo "Open browser to:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""
echo "Close the windows to stop."
read -p "Press enter to continue..."