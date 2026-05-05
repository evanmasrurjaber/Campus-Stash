import { io as clientIo } from 'socket.io-client';

let socket = null;
let currentUserId = null;

export function connect(userId, serverUrl) {
  const resolvedUrl =
    serverUrl ||
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') ||
    import.meta.env.VITE_SERVER_URL ||
    window.location.origin;

  if (!socket) {
    try {
      socket = clientIo(resolvedUrl, {
        autoConnect: true,
        reconnection: true,
        withCredentials: true,
      });

      socket.on('connect', () => {
        if (currentUserId) {
          socket.emit('identify', currentUserId);
        }
      });

      socket.on('reconnect', () => {
        if (currentUserId) {
          socket.emit('identify', currentUserId);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    } catch (err) {
      console.error('Socket initialization error:', err);
    }
  }

  currentUserId = userId || currentUserId;

  if (socket && socket.connected && currentUserId) {
    socket.emit('identify', currentUserId);
  }

  return socket;
}

export function disconnect() {
  if (socket) {
    try {
      socket.disconnect();
      socket = null;
    } catch (err) {
      console.error('Error disconnecting socket:', err);
      socket = null;
    }
  }
  currentUserId = null;
}

export function getSocket() {
  return socket;
}
