#!/bin/bash

echo "Installing MERN Scraper Dependencies..."
echo

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed!"
    echo "Please install from: https://nodejs.org/"
    exit 1
fi

echo "1. Installing Backend Dependencies..."
cd backend
npm install
cd ..

echo "2. Installing Frontend Dependencies..."
cd frontend
npm install
cd ..

echo
echo "✅ All dependencies installed!"
echo
echo "To start the application:"
echo "• Run: ./run.sh"
echo "• Or: chmod +x run.sh && ./run.sh"
echo