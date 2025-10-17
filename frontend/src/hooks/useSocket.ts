import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from './redux';

interface SocketEvents {
  install_request_created: (data: { vehicleId: string; ownerId: string; timestamp: Date }) => void;
  device_activated: (data: { deviceId: string; vehicleId: string; timestamp: Date }) => void;
  telemetry_batch_ingested: (data: { vehicleId: string; batchId: string; timestamp: Date }) => void;
  trustscore_changed: (data: { vehicleId: string; oldScore: number; newScore: number; reason: string }) => void;
  notification_received: (data: { userId: string; title: string; message: string; type: string }) => void;
}

export const useSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        userId: user.id,
        userRole: user.role
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    // Join user-specific rooms
    newSocket.emit('join_user_room', { userId: user.id });
    newSocket.emit('join_role_room', { role: user.role });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  return socket;
};

// Hook for listening to specific socket events
export const useSocketEvent = <K extends keyof SocketEvents>(
  event: K,
  handler: SocketEvents[K]
) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler as any);

    return () => {
      socket.off(event, handler as any);
    };
  }, [socket, event, handler]);
};

// Hook for emitting socket events
export const useSocketEmit = () => {
  const socket = useSocket();

  const emit = <K extends keyof SocketEvents>(
    event: K,
    data: Parameters<SocketEvents[K]>[0]
  ) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  return { emit };
};

export default useSocket;



