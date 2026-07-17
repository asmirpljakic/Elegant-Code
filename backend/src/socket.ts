import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Nova WebSocket konekcija: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`WebSocket klijent se isključio: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io nije inicijalizovan!");
  }
  return io;
};
