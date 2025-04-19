#!/bin/bash

echo "Stopping Masquerade game servers..."

# Check if PID file exists
if [ ! -f ".masquerade_pids" ]; then
    echo "PID file not found. Services may not be running."
    
    # Try to find and kill processes by port as a fallback
    echo "Attempting to find and stop services by port..."
    
    # Find process using port 3000 (frontend)
    FRONTEND_PID=$(lsof -t -i:3000)
    if [ -n "$FRONTEND_PID" ]; then
        echo "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill -15 $FRONTEND_PID
    fi
    
    # Find process using port 3001 (backend)
    BACKEND_PID=$(lsof -t -i:3001)
    if [ -n "$BACKEND_PID" ]; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill -15 $BACKEND_PID
    fi
    
    # Find Caddy process
    CADDY_PID=$(ps aux | grep caddy | grep -v grep | awk '{print $2}')
    if [ -n "$CADDY_PID" ]; then
        echo "Stopping Caddy server (PID: $CADDY_PID)..."
        kill -15 $CADDY_PID
    fi
else
    # Read PIDs from file
    read -r BACKEND_PID FRONTEND_PID CADDY_PID < .masquerade_pids
    
    # Stop backend server
    if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill -15 $BACKEND_PID
    fi
    
    # Stop frontend server
    if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null; then
        echo "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill -15 $FRONTEND_PID
    fi
    
    # Stop Caddy server
    if [ -n "$CADDY_PID" ] && ps -p $CADDY_PID > /dev/null; then
        echo "Stopping Caddy server (PID: $CADDY_PID)..."
        kill -15 $CADDY_PID
    fi
    
    # Remove PID file
    rm .masquerade_pids
fi

echo "All services stopped."

chmod +x /Users/gdmagana/Developer/Github/Masquerade/stop.sh