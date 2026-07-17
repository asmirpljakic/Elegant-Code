import { io, Socket } from 'socket.io-client';

// U razvoju koristimo lokalni server, u produkciji relativni URL
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : (import.meta.env.DEV ? 'http://localhost:5001' : '/');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Povezan na WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('Prekinuta WebSocket veza');
    });
  }
  return socket;
};
