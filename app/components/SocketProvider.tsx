import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the shape of our socket context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string;
}

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: '',
});

// Create a singleton socket instance to be reused across renders
let socketInstance: Socket | null = null;

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Create a singleton socket instance if it doesn't exist
    if (!socketInstance) {
      console.log('Creating new socket instance');

      // Set up socket connection based on environment
      const isProd = window.location.hostname === 'games.gabema.ga';
      const currentHost = window.location.hostname;

      // Configure socket URL based on environment
      const socketUrl = isProd
        ? `https://${window.location.host}` // Production with current host and protocol
        : currentHost === 'localhost' || /\d+\.\d+\.\d+\.\d+/.test(currentHost)
        ? `http://${currentHost}:3001` // Local development
        : `https://${window.location.host}`; // Default to current host

      console.log(`Using Socket.IO server URL: ${socketUrl}`);

      // Detect device type for specific configurations
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Log connection attempt for debugging
      console.log(
        `Attempting to connect to ${socketUrl} from ${
          isIOS ? 'iOS' : isMobile ? 'Mobile' : 'Desktop'
        }`
      );

      // Create Socket.IO instance with optimized configuration
      socketInstance = io(socketUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        path: '/socket.io/',
        withCredentials: false,

        // Set explicit polling configuration to fix XHR errors
        transportOptions: {
          polling: {
            extraHeaders: {
              'Cache-Control': 'no-cache, no-store',
              Pragma: 'no-cache',
              Expires: '0',
              'If-None-Match': 'no-match',
            },
          },
        },

        // Adjust connection parameters for different devices
        ...(isMobile && {
          pingInterval: 25000,
          pingTimeout: 60000,
        }),
        ...(isIOS && {
          extraHeaders: {
            'Cache-Control': 'no-cache',
          },
        }),
      });

      // Add error event listeners for debugging
      socketInstance.on('connect_error', (err) => {
        console.error('Socket.io connect error:', err.message);
        setError(`Connection error: ${err.message}. Attempting to reconnect...`);

        // Force reconnect with different transport on error
        if (socketInstance && socketInstance.io) {
          console.log('Forcing reconnect with polling transport');
          socketInstance.io.opts.transports = ['polling'];
          setTimeout(() => socketInstance?.connect(), 1000);
        }
      });

      socketInstance.on('connect_timeout', (timeout) => {
        console.error('Socket.io connect timeout:', timeout);
        setError('Connection timed out. Attempting to reconnect...');
      });

      socketInstance.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket.io reconnect attempt ${attemptNumber}`);
        setError(`Reconnection attempt ${attemptNumber}...`);

        // Alternate between transport methods on subsequent reconnect attempts
        if (socketInstance && socketInstance.io) {
          if (attemptNumber % 2 === 0) {
            console.log('Trying reconnect with websocket');
            socketInstance.io.opts.transports = ['websocket'];
          } else {
            console.log('Trying reconnect with polling');
            socketInstance.io.opts.transports = ['polling'];
          }
        }
      });

      socketInstance.on('reconnect_error', (err) => {
        console.error('Socket.io reconnect error:', err);
        setError(`Reconnection error: ${err.message}`);
      });

      socketInstance.on('reconnect_failed', () => {
        console.error('Socket.io reconnect failed');
        setError('Reconnection failed. Please refresh the page.');

        // Final attempt with long polling only after all reconnect attempts fail
        setTimeout(() => {
          console.log('Final attempt: Forcing long polling mode');
          if (socketInstance && socketInstance.io) {
            socketInstance.io.opts.transportOptions = {
              polling: {
                extraHeaders: {
                  'Cache-Control': 'no-cache',
                  Pragma: 'no-cache',
                },
              },
            };
            socketInstance.connect();
          }
        }, 2000);
      });

      socketInstance.on('error', (err) => {
        console.error('Socket.io general error:', err);
        setError(`Socket error: ${err.message || 'Unknown error'}`);
      });

      // Handle transport error for xhr polling
      interface SocketIOEngineTransportError {
        message?: string;
        description?: string;
        context?: any;
        type?: string;
      }

      interface EventEmitter {
        on(event: string, listener: (...args: any[]) => void): any;
        off(event: string, listener: (...args: any[]) => void): any;
        emit(event: string, ...args: any[]): boolean;
        removeAllListeners(event?: string): any;
      }

      interface SocketIOEngine extends EventEmitter {
        transport: {
          name: string;
        };
        close: () => void;
      }

      socketInstance.io.engine?.on('transport_error' as any, (err: SocketIOEngineTransportError) => {
        console.error('Transport error:', err);
        setError('Network transport error. Trying alternative connection method...');

        // Force a new connection with a different transport
        if (socketInstance && socketInstance.io) {
          const currentTransport: string = socketInstance.io.engine?.transport.name;
          console.log(`Current transport ${currentTransport} failed, switching...`);

          // Switch transport explicitly
          socketInstance.io.engine?.close();

          setTimeout(() => {
            if (socketInstance) {
              socketInstance.io.opts.transports = [
                currentTransport === 'polling' ? 'websocket' : 'polling',
              ];
              socketInstance.connect();
            }
          }, 1000);
        }
      });

      // Monitor the socket state
      socketInstance.io.on('reconnect', (attempt) => {
        console.log(`Socket.io reconnected after ${attempt} attempts`);
        setIsConnected(true);
        setError('');
      });
    }

    // Handle successful connection
    socketInstance.on('connect', () => {
      console.log('Connected to game server with ID:', socketInstance?.id);
      setIsConnected(true);
      setError('');
      
      // Log the transport being used
      console.log('Transport being used:', socketInstance?.io.engine?.transport.name);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from game server');
      setIsConnected(false);
      setError('Disconnected from server. Attempting to reconnect...');
    });

    // Connect if not already connected
    if (socketInstance && !socketInstance.connected) {
      console.log('Socket not connected, connecting now...');
      socketInstance.connect();
    }

    // Cleanup function - don't disconnect, just remove event listeners
    return () => {
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('connect_error');
        socketInstance.off('connect_timeout');
        socketInstance.off('reconnect_attempt');
        socketInstance.off('reconnect_error');
        socketInstance.off('reconnect_failed');
        socketInstance.off('error');

        // Add cleanup for engine-level listeners too
        socketInstance.io.engine?.removeAllListeners('transport_error' as any);
      }
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketInstance,
        isConnected,
        error
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);