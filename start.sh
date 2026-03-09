#!/bin/bash

# Simple launcher script for the Threat Intel Graph application

echo "🔍 Starting Cyber Threat Intelligence Graph..."
echo ""
echo "Opening application in your default browser..."
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server on http://localhost:8000"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server on http://localhost:8000"
    python -m http.server 8000
else
    echo "❌ Python not found. Please install Python or open index.html directly in your browser."
    exit 1
fi
