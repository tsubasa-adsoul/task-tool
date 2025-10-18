import { io } from 'socket.io-client';

// WebSocket接続を作成
const socket = io('https://asana-backend-7vdy.onrender.com', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// 接続イベント
socket.on('connect', () => {
  console.log('WebSocket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('WebSocket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});

export default socket;
