#!/bin/bash

# Define log file
LOG_FILE="masquerade.log"
BACKEND_LOG="backend.log"

echo "Starting Masquerade game servers..."
echo "$(date) - Starting servers" > $LOG_FILE

# Check for required dependencies
if ! command -v npm &> /dev/null; then
    echo "Error: npm not found. Please install Node.js and npm before running this script."
    echo "You can install Node.js and npm by following the instructions at https://nodejs.org/"
    echo "$(date) - Error: npm not found" >> $LOG_FILE
    exit 1
fi

if ! command -v caddy &> /dev/null; then
    echo "Error: caddy not found. Please install Caddy before running this script."
    echo "You can install Caddy by following the instructions at https://caddyserver.com/docs/install"
    echo "$(date) - Error: caddy not found" >> $LOG_FILE
    exit 1
fi

# Function to check if a process is running on a port
is_port_used() {
    if command -v netstat &> /dev/null; then
        netstat -tuln | grep -q ":$1 "
        return $?
    elif command -v lsof &> /dev/null; then
        lsof -i ":$1" &> /dev/null
        return $?
    else
        echo "Warning: Neither netstat nor lsof found. Port checking disabled."
        return 1
    fi
}

# Start the backend server in the background
echo "Starting backend server on port 3001..."
cd backend
if [ -f "package.json" ]; then
    if is_port_used 3001; then
        echo "Port 3001 is already in use. Please check if another instance is running."
        exit 1
    fi
    
    # Check if node_modules exists, if not, install dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install >> ../$LOG_FILE 2>&1
        if [ $? -ne 0 ]; then
            echo "Error: Failed to install backend dependencies."
            exit 1
        fi
    fi
    
    nohup npm start >> ../$BACKEND_LOG 2>&1 &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
else
    echo "Backend package.json not found. Please check directory structure."
    exit 1
fi
cd ..

# Wait a bit for the backend to initialize
sleep 2

# Start the frontend server in the background
echo "Starting frontend server on port 3000..."
cd frontend
if [ -f "package.json" ]; then
    if is_port_used 3000; then
        echo "Port 3000 is already in use. Please check if another instance is running."
        exit 1
    fi
    
    # Check if node_modules exists, if not, install dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install >> ../$LOG_FILE 2>&1
        if [ $? -ne 0 ]; then
            echo "Error: Failed to install frontend dependencies."
            exit 1
        fi
    fi
    
    # Build first, then start
    echo "Building frontend..."
    npm run build >> ../$LOG_FILE 2>&1
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build frontend."
        exit 1
    fi
    
    nohup npm run start >> ../$LOG_FILE 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
else
    echo "Frontend package.json not found. Please check directory structure."
    exit 1
fi
cd ..

# Start Caddy server
echo "Starting Caddy server..."
cd caddy
if [ -f "Caddyfile" ]; then
    nohup caddy run >> ../$LOG_FILE 2>&1 &
    CADDY_PID=$!
    echo "Caddy started with PID: $CADDY_PID"
else
    echo "Caddyfile not found. Please check directory structure."
    exit 1
fi
cd ..

echo "All services started!"
echo "To check status, use: tail -f $LOG_FILE"
echo "Your game should be available at https://games.gabema.ga"

# Save PIDs to a file for later stopping
echo "$BACKEND_PID $FRONTEND_PID $CADDY_PID" > .masquerade_pids

chmod +x /Users/gdmagana/Developer/Github/Masquerade/start.sh
