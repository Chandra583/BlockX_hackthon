import { Server } from 'socket.io';
import { logger } from './logger';

let io: Server | null = null;

/**
 * Initialize socket.io server
 */
export const initializeSocketIO = (server: any) => {
  try {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    io.on('connection', (socket) => {
      logger.info(`Socket client connected: ${socket.id}`);
      
      // Handle join_user event from frontend
      socket.on('join_user', (userId) => {
        socket.join(userId.toString());
        logger.info(`User ${userId} joined their room`);
      });
      
      socket.on('disconnect', () => {
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    });
    
    logger.info('Socket.IO initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Socket.IO:', error);
  }
};

/**
 * Emit event to all connected clients
 */
export const emitEvent = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
    logger.info(`Emitted socket event: ${event}`);
  } else {
    logger.warn(`Socket.IO not initialized, could not emit event: ${event}`);
  }
};

/**
 * Emit event to specific room
 */
export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
    logger.info(`Emitted socket event to room ${room}: ${event}`);
  } else {
    logger.warn(`Socket.IO not initialized, could not emit event to room ${room}: ${event}`);
  }
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
    logger.info(`Emitted socket event to user ${userId}: ${event}`);
  } else {
    logger.warn(`Socket.IO not initialized, could not emit event to user ${userId}: ${event}`);
  }
};

export { io };