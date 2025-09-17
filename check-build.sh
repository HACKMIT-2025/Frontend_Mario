#!/bin/bash
# Script to manually run build check

echo "🔨 Running build check..."
echo "================================"

# Save current directory
ORIGINAL_DIR=$(pwd)

# Change to the mario-game directory
cd mario-game

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Install dependencies if node_modules doesn't exist or package-lock is newer
if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
    echo "📦 Installing/updating dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
fi

# Run the build command
echo "🏗️ Building project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "================================"
    echo "❌ Build failed!"
    echo "Please fix the errors above before committing."
    cd "$ORIGINAL_DIR"
    exit 1
fi

echo "================================"
echo "✅ Build successful!"
echo "Your code is ready to be pushed."

# Return to original directory
cd "$ORIGINAL_DIR"
exit 0