import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainFooter from '../components/layout/MainFooter';
import MainNavbar from '../components/layout/MainNavbar';
import { useAuth } from '../hooks/useAuth';
import {
  getApiErrorMessage,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api';
import { connect as connectSocket } from '../utils/socket';

const formatRelativeTime = (isoDateString) => {
  if (!isoDateString) {
    return '';
  }

  const date = new Date(isoDateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = Date.now();
  const diffMinutes = Math.floor((now - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
};

function NotificationItem({ notification, isRead, onMarkAsRead }) {
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const actorAvatarUrl = notification?.actor?.avatar?.url || '';

  const handleClick = async () => {
    if (!isRead) {
      try {
        await onMarkAsRead(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const actorInitials =
    (notification?.actor?.fullName || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full border-l-4 px-4 py-4 text-left transition-colors ${
        isRead
          ? 'border-transparent hover:bg-surface-container-high/60'
          : 'border-primary bg-surface-container-lowest'
      }`}
    >
      <div className="flex items-start gap-3">
        {actorAvatarUrl && failedImageUrl !== actorAvatarUrl ? (
          <img
            src={actorAvatarUrl}
            alt={notification?.actor?.fullName}
            className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
            onError={() => setFailedImageUrl(actorAvatarUrl)}
          />
        ) : (
          <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
            {actorInitials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-on-surface">
              {notification?.actor?.fullName || 'User'} sent you a message
            </p>
            <span className="text-[10px] font-semibold text-outline">
              {formatRelativeTime(notification?.createdAt)}
            </span>
          </div>

          <p className="mt-2 text-xs text-on-surface-variant line-clamp-2">{notification?.body}</p>

          {!isRead ? (
            <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              New
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const { user, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getNotifications(pageNum);

      setNotifications(response.data.notifications);
      setTotalPages(response.data.pagination.totalPages);
      setPage(pageNum);

      const hasUnread = response.data.notifications.some((notif) => !notif.isRead);
      setHasUnreadNotifications(hasUnread);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load notifications'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      try {
        await markNotificationAsRead(notificationId);

        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif,
          ),
        );

        const hasUnread = notifications.some((notif) => notif._id !== notificationId && !notif.isRead);
        setHasUnreadNotifications(hasUnread);
      } catch (err) {
        console.error('Error marking notification as read:', getApiErrorMessage(err));
      }
    },
    [notifications],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) => ({ ...notif, isRead: true })),
      );
      setHasUnreadNotifications(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to mark all as read'));
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  useEffect(() => {
    const socket = connectSocket(user?._id);

    if (socket) {
      const handleNewNotification = (data) => {
        const { notification } = data;
        setNotifications((prev) => {
          const newNotifications = [
            {
              ...notification,
              actor: data.actor || notification.actor,
            },
            ...prev,
          ];
          setHasUnreadNotifications(true);
          return newNotifications;
        });
      };

      socket.on('notification_received', handleNewNotification);

      return () => {
        socket.off('notification_received', handleNewNotification);
      };
    }
  }, [user?._id]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MainNavbar user={user} onLogout={logout} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 px-4 py-6 md:px-6">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-on-surface">Notifications</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {notifications.length === 0
                ? 'No notifications yet'
                : `You have ${notifications.filter((n) => !n.isRead).length} unread notification${notifications.filter((n) => !n.isRead).length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {hasUnreadNotifications && notifications.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="mb-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:bg-primary/90"
            >
              Mark all as read
            </button>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 inline-block rounded-full border-4 border-outline border-r-primary animate-spin p-3" />
                <p className="text-sm text-on-surface-variant">Loading notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest py-12 text-center">
              <span className="material-symbols-outlined mb-3 block text-5xl text-outline">notifications_none</span>
              <p className="font-semibold text-on-surface">No notifications yet</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                You'll receive notifications when other users send you messages
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest overflow-hidden">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  isRead={notification.isRead}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => fetchNotifications(page - 1)}
                disabled={page === 1}
                className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition-all disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-sm text-on-surface-variant">
                Page {page} of {totalPages}
              </p>
              <button
                type="button"
                onClick={() => fetchNotifications(page + 1)}
                disabled={page === totalPages}
                className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition-all disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
