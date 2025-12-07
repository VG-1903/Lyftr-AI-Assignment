#!/bin/bash

echo "🛠️  Port Cleaner Tool"
echo "This frees common dev ports"
echo

echo "Killing processes on ports 3000-3010..."
for port in {3000..3010}; do
    if lsof -ti :$port >/dev/null 2>&1; then
        echo "Killing processes on port $port..."
        lsof -ti :$port | xargs kill -9 2>/dev/null
    fi
done

echo "Killing processes on ports 5000-5010..."
for port in {5000..5010}; do
    if lsof -ti :$port >/dev/null 2>&1; then
        echo "Killing processes on port $port..."
        lsof -ti :$port | xargs kill -9 2>/dev/null
    fi
done

echo
echo "✅ Ports 3000-3010 and 5000-5010 are now free!"