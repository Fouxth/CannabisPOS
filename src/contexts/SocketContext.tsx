import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            const newSocket = io(SOCKET_URL, {
                reconnectionAttempts: 5,
                timeout: 10000,
                autoConnect: true,
                transports: ['websocket', 'polling'], // ลอง WebSocket ก่อน fallback เป็น polling
            });

            newSocket.on('connect', () => {
                console.log('🔌 Socket connected');
                setIsConnected(true);

                // Join tenant room
                const tenantId = user.storeId; // Based on useAuth.tsx User interface
                if (tenantId) {
                    newSocket.emit('join_room', { tenantId, userId: user.id });
                }
            });

            newSocket.on('connect_error', (error) => {
                console.warn('🔌 Socket connection error:', error.message);
                setIsConnected(false);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [isAuthenticated, user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
