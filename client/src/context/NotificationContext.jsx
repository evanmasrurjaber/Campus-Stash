import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getUnreadNotificationCount } from '../services/api';
import { connect as connectSocket } from '../utils/socket';

const NotificationContext = createContext();

export function NotificationProvider({ children, userId }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUnreadCount();

      const socket = connectSocket(userId);

      if (socket) {
        const handleNewNotification = (data) => {
          setUnreadCount((prev) => prev + 1);
        };

        socket.on('notification_received', handleNewNotification);

        return () => {
          socket.off('notification_received', handleNewNotification);
        };
      }
    }
  }, [userId, fetchUnreadCount]);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const incrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        isLoading,
        fetchUnreadCount,
        markAllAsRead,
        incrementUnreadCount,
        decrementUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
}
