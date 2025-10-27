import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAppSelector } from './redux';

interface UseSocketReturn {
  socket: Socket | null;
  joinVehicleRoom: (vehicleId: string) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const useSocket = (): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socketRef.current = io(socketUrl);
    
    // Join user room
    if (user?.id) {
      socketRef.current.emit('join_user', user.id);
    }
    
    // Cleanup on unmount
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