'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const host = window.location.hostname;
    const isNgrok = host.includes('ngrok-free.app') || host.includes('ngrok.app') || host.includes('ngrok.io');
    const socketUrl = isNgrok ? '' : (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000');
    
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Connecté au serveur WebSocket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Déconnecté du serveur WebSocket');
      setIsConnected(false);
    });

    socketInstance.on('userStatus', ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      setOnlineUsers((prev) => {
        if (status === 'online' && !prev.includes(userId)) return [...prev, userId];
        if (status === 'offline') return prev.filter((id) => id !== userId);
        return prev;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]); // Reconnecter quand l'utilisateur change (connexion/déconnexion)

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
