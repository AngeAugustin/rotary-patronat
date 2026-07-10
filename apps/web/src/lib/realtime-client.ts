import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api-client';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
const WS_URL = API_URL.replace(/\/api\/v1$/, '');

let socket: Socket | null = null;

export function getRealtimeSocket() {
  if (!socket) {
    socket = io(`${WS_URL}/realtime`, {
      autoConnect: false,
      auth: { token: getAccessToken() },
    });
  }
  return socket;
}

export function connectRealtime() {
  const s = getRealtimeSocket();
  s.auth = { token: getAccessToken() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectRealtime() {
  socket?.disconnect();
}
