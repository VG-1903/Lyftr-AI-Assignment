#!/bin/bash

# ========================================
#   MERN Scraper - Auto Port Finder
# ========================================

set -e  # Exit on error

echo "========================================"
echo "   MERN Scraper - Auto Port Finder"
echo "========================================"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log() { echo -e "${BLUE}[i]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# Function to check if port is free
is_port_free() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :$port >/dev/null 2>&1
        return $?
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep ":$port " >/dev/null 2>&1
        return $?
    else
        # If no tool available, assume port is free
        return 1
    fi
}

# Function to find free port
find_free_port() {
    local start_port=$1
    local end_port=$2
    local port=$start_port
    
    while [ $port -le $end_port ]; do
        if ! is_port_free $port; then
            echo $port
            return 0
        fi
        warning "Port $port is busy..."
        port=$((port + 1))
    done
    
    error "No free ports between $start_port and $end_port!"
    exit 1
}

# Find free ports
log "Finding free ports..."

BACKEND_START=5000
BACKEND_END=5010
FRONTEND_START=3000
FRONTEND_END=3010

BACKEND_PORT=$(find_free_port $BACKEND_START $BACKEND_END)
FRONTEND_PORT=$(find_free_port $FRONTEND_START $FRONTEND_END)

success "Found free ports:"
echo "  Backend: $BACKEND_PORT (was trying $BACKEND_START)"
echo "  Frontend: $FRONTEND_PORT (was trying $FRONTEND_START)"
echo

# Save ports to config file
echo "BACKEND_PORT=$BACKEND_PORT" > ports.cfg
echo "FRONTEND_PORT=$FRONTEND_PORT" >> ports.cfg

# Check directories
log "Checking project structure..."
[ -d "backend" ] || { error "Backend folder missing!"; exit 1; }
[ -d "frontend" ] || { warning "Frontend folder missing, creating..."; mkdir -p frontend; }

# Install dependencies
log "Installing dependencies..."

# Backend
cd backend
if [ ! -d "node_modules" ]; then
    log "Installing backend dependencies..."
    npm install --silent
    success "Backend dependencies installed"
else
    success "Backend dependencies already exist"
fi
cd ..

# Frontend
cd frontend
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        log "Installing frontend dependencies..."
        npm install --silent
        success "Frontend dependencies installed"
    else
        success "Frontend dependencies already exist"
    fi
else
    warning "No frontend package.json found (API-only mode)"
fi
cd ..

echo
log "Starting servers with dynamic ports..."
echo

# Cleanup function
cleanup() {
    echo
    warning "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Start backend
log "Starting backend on port $BACKEND_PORT..."
cd backend
PORT=$BACKEND_PORT npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 8

# Test backend
log "Testing backend..."
if command -v curl >/dev/null 2>&1; then
    if curl -s "http://localhost:$BACKEND_PORT/healthz" >/dev/null; then
        success "Backend is running"
    else
        warning "Backend might be starting slowly..."
    fi
else
    warning "curl not available, skipping backend test"
fi

# Start frontend
cd frontend
if [ -f "package.json" ]; then
    log "Starting frontend on port $FRONTEND_PORT..."
    PORT=$FRONTEND_PORT npm start &
    FRONTEND_PID=$!
    sleep 3
    success "Frontend starting"
else
    warning "No frontend found (API-only mode)"
fi
cd ..

echo
echo "========================================"
echo "          🎉 APPLICATION READY!"
echo "========================================"
echo
echo -e "${GREEN}🌐 FRONTEND:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${GREEN}⚙️  BACKEND API:${NC} http://localhost:$BACKEND_PORT"
echo -e "${GREEN}📊 HEALTH CHECK:${NC} http://localhost:$BACKEND_PORT/healthz"
echo
echo -e "${YELLOW}📋 IMPORTANT NOTES:${NC}"
echo "• If ports 3000/5000 were busy, different ports were used"
echo "• Save these URLs - you'll need them!"
echo "• Ports saved to: ports.cfg"
echo
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all services${NC}"
echo

# Keep running
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true