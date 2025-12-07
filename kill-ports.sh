#!/bin/bash

# ========================================
#   Port Cleaner for Development Ports
# ========================================

echo "🛠️  Port Cleaner Tool"
echo "This frees common development ports"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Killing processes on ports 3000-3010...${NC}"
for port in {3000..3010}; do
    if command -v lsof >/dev/null 2>&1; then
        if lsof -ti :$port >/dev/null 2>&1; then
            echo "Killing processes on port $port..."
            lsof -ti :$port | xargs kill -9 2>/dev/null || true
        fi
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k $port/tcp 2>/dev/null || true
    fi
done

echo -e "${YELLOW}Killing processes on ports 5000-5010...${NC}"
for port in {5000..5010}; do
    if command -v lsof >/dev/null 2>&1; then
        if lsof -ti :$port >/dev/null 2>&1; then
            echo "Killing processes on port $port..."
            lsof -ti :$port | xargs kill -9 2>/dev/null || true
        fi
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k $port/tcp 2>/dev/null || true
    fi
done

echo
echo -e "${GREEN}✅ Ports 3000-3010 and 5000-5010 are now free!${NC}"