#!/bin/bash

# Start Frontend Server
echo "🚀 Starting frontend server..."
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Please run ./setup.sh first"
    exit 1
fi

echo "✅ Frontend server starting..."
npm run dev


