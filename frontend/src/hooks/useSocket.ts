import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAppSelector } from './redux';

interface UseSocketReturn {
  socket: Socket | null;
  joinVehicleRoom: (vehicleId: string) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const resolveSocketBaseUrl = (): string => {
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || (import.meta.env.VITE_API_BASE_URL as string | undefined);
  const backend = import.meta.env.VITE_BACKEND_URL as string | undefined;

  // Prefer explicit socket URL, else backend URL, else API URL without /api suffix
  const candidate = explicit || backend || apiUrl || 'https://veridrive-x-hackthon.vercel.app';
  return candidate.replace(/\/$/, '').replace(/\/api$/, '');
};

const useSocket = (): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    const baseUrl = resolveSocketBaseUrl();
    socketRef.current = io(baseUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: false,
    });
    
    if (user?.id) {
      socketRef.current.emit('join_user', user.id);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.id]);
  
  const joinVehicleRoom = (vehicleId: string) => {
    if (socketRef.current && vehicleId) {
      socketRef.current.emit('join_vehicle', vehicleId);
    }
  };
  
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };
  
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };
  
  return { socket: socketRef.current, joinVehicleRoom, on, off };
};

export default useSocket;