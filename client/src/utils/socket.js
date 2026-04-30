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
  }

  currentUserId = userId || currentUserId;

  if (socket.connected && currentUserId) {
    socket.emit('identify', currentUserId);
  }

  return socket;
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentUserId = null;
}

export function getSocket() {
  return socket;
}
