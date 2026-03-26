#!/bin/bash

# Move to the folder where this script is located
cd "$(dirname "$0")"

echo "========================================="
echo "  Setting up Capstone Dashboard..."
echo "========================================="

echo "Installing server dependencies..."
cd backend && npm install
cd ..

echo "Installing client dependencies..."
cd frontend && npm install
cd ..

echo "========================================="
echo "  Starting Server and Client..."
echo "  Browser will open in 7 seconds!"
echo "========================================="

# Run backend, frontend, and a delayed browser launch simultaneously
npx concurrently "cd backend && npm start" "cd frontend && npm start" "sleep 10 && open http://localhost:5173"