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
            socket = io('http://localhost:3001');
            
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

    const spinWheel = () => {
        setIsSpinning(true);
        socket.emit('spin', { action: 'spin' });
    };

    return (
        <div className="wheel-container">
            {error && <div className="error-message">{error}</div>}
            
            <div className="wheel" style={{ opacity: isSpinning ? 0.7 : 1 }}>
                {/* Visual representation of wheel could be added here */}
                <div className="wheel-center">
                    {isSpinning ? (
                        <div className="spinning-text">Spinning...</div>
                    ) : result ? (
                        <div className="result">{result}</div>
                    ) : (
                        <div className="instruction">Press Spin</div>
                    )}
                </div>
            </div>

            <button 
                onClick={spinWheel} 
                disabled={isSpinning}
                className="spin-button"
            >
                {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
            </button>
            
            <style jsx>{`
                .wheel-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 20px 0;
                }
                
                .wheel {
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    background: conic-gradient(
                        #FF5733, #33FF57, #3357FF, #F333FF,
                        #FF5733, #33FF57, #3357FF, #F333FF
                    );
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    margin-bottom: 20px;
                    transition: transform 3s ease-out;
                }
                
                .wheel-center {
                    width: 80px;
                    height: 80px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2;
                    font-weight: bold;
                }
                
                .spin-button {
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.3s;
                }
                
                .spin-button:hover:not(:disabled) {
                    background-color: #3e8e41;
                }
                
                .spin-button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
                
                .error-message {
                    color: #ff0000;
                    margin-bottom: 10px;
                }
                
                .result {
                    font-size: 24px;
                }
                
                .spinning-text {
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
};

export default Wheel;