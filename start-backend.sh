#!/bin/bash

# Start Backend Server
echo "🚀 Starting backend server..."
cd "$(dirname "$0")/backend"

if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Please run ./setup.sh first"
    exit 1
fi

if [ ! -f "db.sqlite" ] || [ ! -s "db.sqlite" ]; then
    echo "⚠️  Database not initialized. Running seed script..."
    npm run seed
fi

echo "✅ Backend server starting on http://localhost:4000"
npm start


