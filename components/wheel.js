'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Create a socket instance outside the component to avoid reconnections on re-renders
let socket;

const Wheel = () => {
    const [result, setResult] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Initialize socket connection if it doesn't exist
        if (!socket) {
            const socketUrl = process.env.NODE_ENV === 'production' 
                ? 'https://games.gabema.ga' 
                : 'http://localhost:3001';
                
            socket = io(socketUrl, {
                transports: ['websocket', 'polling'], // Use WebSockets with polling fallback
                reconnection: true,
                reconnectionAttempts: 5,
                timeout: 20000
            });
            
            socket.on('connect', () => {
                console.log('Connected to Socket.IO server');
            });
            
            socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setError('Failed to connect to game server');
            });
        }
        
        // Set up event listeners
        socket.on('spinResult', (data) => {
            setResult(data.result);
            setIsSpinning(false);
        });
        
        // Clean up on component unmount
        return () => {
            socket.off('spinResult');
        };
    }, []);

    const handleSpin = () => {
        if (!socket.connected) {
            setError('Not connected to server');
            return;
        }
        
        setIsSpinning(true);
        socket.emit('spin', { timestamp: Date.now() });
    };

    return (
        <div className="wheel-container p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-center">
            <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">The Lucky Wheel</h2>
            
            <div className="wheel-display mb-6 relative">
                <div className={`wheel h-40 w-40 rounded-full mx-auto border-8 border-amber-500 ${isSpinning ? 'animate-spin' : ''}`}
                    style={{backgroundImage: 'conic-gradient(from 0deg, red, orange, yellow, green, blue, indigo, violet, red)'}}>
                </div>
                
                {result !== null && !isSpinning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white dark:bg-slate-900 rounded-full h-20 w-20 flex items-center justify-center shadow-lg border-4 border-amber-500">
                            <span className="text-3xl font-bold text-amber-600">{result}</span>
                        </div>
                    </div>
                )}
            </div>
            
            {error && (
                <div className="error-message mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
                    {error}
                </div>
            )}
            
            <button
                onClick={handleSpin}
                disabled={isSpinning}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isSpinning
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg'
                }`}
            >
                {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
            </button>
        </div>
    );
};

export default Wheel;