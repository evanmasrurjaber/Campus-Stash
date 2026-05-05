import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainFooter from '../components/layout/MainFooter';
import MainNavbar from '../components/layout/MainNavbar';
import ChatThreadPanel from '../components/messages/ChatThreadPanel';
import { useAuth } from '../hooks/useAuth';
import {
  getApiErrorMessage,
  getInbox,
  getThreadWithUser,
  sendMessage,
} from '../services/api';
import { connect as connectSocket } from '../utils/socket';

const toIdString = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value._id || value.id || value);
};

const buildConversationFromMessage = (message, currentUserId) => {
  const senderId = toIdString(message?.sender);
  const recipientId = toIdString(message?.recipient);
  const isCurrentUserSender = senderId === toIdString(currentUserId);
  const otherUser = isCurrentUserSender ? message?.recipient : message?.sender;
  const otherUserId = isCurrentUserSender ? recipientId : senderId;
  const postId = toIdString(message?.postId);
  const postType = message?.postType || 'listing';
  const conversationKey = `${postType}:${postId}:${otherUserId}`;

  return {
    key: conversationKey,
    otherUser,
    otherUserId,
    postId,
    postType,
    latestMessage: message?.content || '',
    latestAt: message?.createdAt || '',
  };
};

const upsertConversationByMessage = (conversations, message, currentUserId) => {
  const nextConversation = buildConversationFromMessage(message, currentUserId);
  const nextConversations = conversations.filter((conversation) => conversation.key !== nextConversation.key);

  return [nextConversation, ...nextConversations].sort(
    (first, second) => new Date(second.latestAt) - new Date(first.latestAt),
  );
};

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

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatPostTypeLabel = (postType) => {
  if (postType === 'listing' || postType === 'saleItem') {
    return 'Marketplace Listing';
  }

  if (postType === 'lostItem') {
    return 'Lost Item Post';
  }

  if (postType === 'foundItem') {
    return 'Found Item Post';
  }

  return 'CampusStash Post';
};

function ConversationRow({ conversation, active, onClick }) {
  const avatarUrl = conversation?.otherUser?.avatar?.url || '';
  const name = conversation?.otherUser?.fullName || 'CampusStash User';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-l-4 px-4 py-4 text-left transition-colors ${
        active
          ? 'border-primary bg-surface-container-lowest'
          : 'border-transparent hover:bg-surface-container-high/60'
      }`}
    >
      <div className="flex items-start gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
            {initials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-on-surface">{name}</p>
            <span className="text-[10px] font-semibold text-outline">{formatRelativeTime(conversation.latestAt)}</span>
          </div>

          <p className="mt-1 truncate text-xs font-semibold text-primary/80">
            {formatPostTypeLabel(conversation.postType)}
          </p>

          <p className="mt-1 truncate text-xs text-on-surface-variant">{conversation.latestMessage || 'No messages yet'}</p>
        </div>
      </div>
    </button>
  );
}

export default function InboxPage() {
  const { user, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState('');
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationKey, setSelectedConversationKey] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.key === selectedConversationKey) || null,
    [conversations, selectedConversationKey],
  );

  const fetchThread = useCallback(async (conversation) => {
    if (!conversation) {
      setThreadMessages([]);
      setThreadError('');
      return;
    }

    setThreadLoading(true);
    setThreadError('');

    try {
      const threadData = await getThreadWithUser(
        conversation.otherUserId,
        conversation.postId,
        conversation.postType,
      );

      setThreadMessages(threadData?.data?.messages || []);
    } catch (requestError) {
      setThreadError(getApiErrorMessage(requestError, 'Could not load this conversation'));
      setThreadMessages([]);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const fetchInboxData = useCallback(async (preservedSelectionKey = '') => {
    setInboxLoading(true);
    setInboxError('');

    try {
      const [profileResponse, inboxResponse] = await Promise.all([
        refreshCurrentUser(),
        getInbox(),
      ]);

      setProfile(profileResponse);

      const messages = inboxResponse?.data?.messages || [];
      const mappedConversations = messages.map((message) => buildConversationFromMessage(message, profileResponse?.id));

      setConversations(mappedConversations);

      const hasPreservedSelection = mappedConversations.some((item) => item.key === preservedSelectionKey);
      const nextSelectedKey = hasPreservedSelection
        ? preservedSelectionKey
        : mappedConversations[0]?.key || '';

      setSelectedConversationKey(nextSelectedKey);

      const nextConversation = mappedConversations.find((item) => item.key === nextSelectedKey) || null;
      await fetchThread(nextConversation);
    } catch (requestError) {
      setInboxError(getApiErrorMessage(requestError, 'Could not load your inbox'));
      setConversations([]);
      setSelectedConversationKey('');
      setThreadMessages([]);
    } finally {
      setInboxLoading(false);
    }
  }, [fetchThread, refreshCurrentUser]);

  useEffect(() => {
    if (!profile?.id) {
      return undefined;
    }

    const socket = connectSocket(profile.id);

    if (!socket) {
      return undefined;
    }

    const handleMessageReceived = (payload) => {
      const message = payload?.message;

      if (!message) {
        return;
      }

      const otherUserId =
        toIdString(message.sender) === toIdString(profile.id)
          ? toIdString(message.recipient)
          : toIdString(message.sender);
      const incomingConversationKey = `${message.postType || 'listing'}:${toIdString(message.postId)}:${otherUserId}`;

      setConversations((currentConversations) =>
        upsertConversationByMessage(currentConversations, message, profile.id),
      );

      if (selectedConversationKey === incomingConversationKey) {
        setThreadMessages((currentMessages) => {
          const incomingMessageId = toIdString(message._id);

          if (incomingMessageId && currentMessages.some((existingMessage) => toIdString(existingMessage?._id) === incomingMessageId)) {
            return currentMessages;
          }

          return [...currentMessages, message];
        });
      }
    };

    socket.off('message_received', handleMessageReceived);
    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.off('message_received', handleMessageReceived);
    };
  }, [profile?.id, selectedConversationKey]);

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen';

    fetchInboxData();

    return () => {
      document.body.className = previousBodyClass;
    };
  }, [fetchInboxData]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversationKey(conversation.key);
    await fetchThread(conversation);
  };

  const handleSendMessage = async (content) => {
    if (!selectedConversation) {
      return;
    }

    setSendingMessage(true);
    setThreadError('');

    try {
      await sendMessage({
        recipientId: selectedConversation.otherUserId,
        postId: selectedConversation.postId,
        postType: selectedConversation.postType,
        content,
      });

      await fetchInboxData(selectedConversation.key);
    } catch (requestError) {
      setThreadError(getApiErrorMessage(requestError, 'Could not send message'));
    } finally {
      setSendingMessage(false);
    }
  };

  const showChatPanelOnMobile = Boolean(selectedConversation);

  return (
    <div className="min-h-screen bg-surface page-enter">
      <MainNavbar user={profile} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-7 flex flex-col gap-2">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Messaging Hub</h1>
          <p className="text-sm text-on-surface-variant">
            Manage your student deals and stash recoveries in one place.
          </p>
        </div>

        <section className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low lg:grid-cols-12">
          <aside
            className={`flex flex-col border-outline-variant/30 bg-surface-container-low lg:col-span-4 lg:border-r ${
              showChatPanelOnMobile ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="border-b border-outline-variant/20 p-4">
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">
                  search
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border-none bg-surface-container-lowest py-2 pl-10 pr-3 text-sm ring-0"
                  placeholder="Search chats..."
                  disabled
                  aria-label="Search chats"
                />
              </div>
            </div>

            {inboxError ? <p className="px-4 py-3 text-sm font-semibold text-error">{inboxError}</p> : null}

            <div className="custom-scrollbar flex-1 overflow-y-auto">
              {inboxLoading ? (
                <div className="px-4 py-6 text-sm font-semibold text-on-surface-variant">Loading inbox...</div>
              ) : null}

              {!inboxLoading && conversations.length === 0 ? (
                <div className="px-4 py-8 text-sm text-on-surface-variant">
                  No conversations yet. Messages from listings and lost/found posts will appear here.
                </div>
              ) : null}

              {!inboxLoading
                ? conversations.map((conversation) => (
                    <ConversationRow
                      key={conversation.key}
                      conversation={conversation}
                      active={conversation.key === selectedConversationKey}
                      onClick={() => handleSelectConversation(conversation)}
                    />
                  ))
                : null}
            </div>
          </aside>

          <div
            className={`bg-surface-container-lowest lg:col-span-8 ${
              showChatPanelOnMobile ? 'block' : 'hidden lg:block'
            }`}
          >
            <ChatThreadPanel
              currentUserId={profile?.id}
              conversation={selectedConversation}
              messages={threadMessages}
              loading={threadLoading}
              sendPending={sendingMessage}
              error={threadError}
              onSendMessage={handleSendMessage}
              onBack={showChatPanelOnMobile ? () => setSelectedConversationKey('') : undefined}
            />
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}

export { default as ReusableChatThreadPanel } from '../components/messages/ChatThreadPanel';
