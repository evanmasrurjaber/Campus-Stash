import { useMemo, useState } from 'react';

const toIdString = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value._id || value.id || value);
};

const getInitials = (fullName) => {
  const normalized = String(fullName || '').trim();

  if (!normalized) {
    return 'U';
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

const formatMessageTime = (isoDateString) => {
  if (!isoDateString) {
    return '';
  }

  const date = new Date(isoDateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatPostTypeLabel = (postType) => {
  if (postType === 'listing') {
    return 'Marketplace Listing';
  }

  if (postType === 'lostItem') {
    return 'Lost and Found Post';
  }

  return 'CampusStash Post';
};

function UserAvatar({ user, sizeClass = 'h-8 w-8' }) {
  const avatarUrl = user?.avatar?.url || '';

  if (avatarUrl) {
    return <img src={avatarUrl} alt={user?.fullName || 'User avatar'} className={`${sizeClass} rounded-full object-cover`} />;
  }

  return (
    <span
      className={`${sizeClass} inline-flex items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container`}
      aria-label={user?.fullName || 'User'}
    >
      {getInitials(user?.fullName)}
    </span>
  );
}

export default function ChatThreadPanel({
  currentUserId,
  conversation,
  messages,
  loading,
  sendPending,
  error,
  onSendMessage,
  onBack,
}) {
  const [draftMessage, setDraftMessage] = useState('');

  const sortedMessages = useMemo(() => {
    const clonedMessages = Array.isArray(messages) ? [...messages] : [];
    return clonedMessages.sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
  }, [messages]);

  const canSend = Boolean(draftMessage.trim()) && !sendPending && !loading && Boolean(conversation);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = draftMessage.trim();

    if (!trimmed || !canSend) {
      return;
    }

    onSendMessage(trimmed);
    setDraftMessage('');
  };

  if (!conversation) {
    return (
      <section className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-primary/70">chat_bubble</span>
        <h2 className="mt-4 font-headline text-2xl font-extrabold text-primary">Select a Conversation</h2>
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">
          Pick a chat from your inbox to view the full thread and continue coordinating pickup or recovery.
        </p>
      </section>
    );
  }

  const otherUserName = conversation.otherUser?.fullName || 'CampusStash User';
  const postTypeLabel = formatPostTypeLabel(conversation.postType);

  return (
    <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest">
      <header className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
              aria-label="Back to conversations"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : null}

          <UserAvatar user={conversation.otherUser} sizeClass="h-10 w-10" />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-on-surface">{otherUserName}</p>
            <p className="truncate text-xs font-semibold text-primary/80">{postTypeLabel}</p>
          </div>
        </div>

        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          {conversation.postType === 'listing' ? 'Sale' : 'Recovery'}
        </span>
      </header>

      <div className="border-b border-outline-variant/10 bg-tertiary-fixed/10 px-4 py-3 md:px-5">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
          <p className="text-xs text-tertiary-container/90">
            Safety tip: Use visible campus locations for handoffs and avoid sharing sensitive account or payment details in chat.
          </p>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-surface-container-low/60 via-transparent to-transparent p-4 md:p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center py-10">
            <span className="text-sm font-semibold text-on-surface-variant">Loading conversation...</span>
          </div>
        ) : null}

        {!loading && sortedMessages.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-sm text-on-surface-variant">
            No messages yet. Start the conversation.
          </div>
        ) : null}

        {!loading
          ? sortedMessages.map((message) => {
              const isMine = toIdString(message?.sender) === toIdString(currentUserId);

              if (isMine) {
                return (
                  <div key={message._id || `${message.createdAt}-${message.content}`} className="ml-auto flex max-w-[88%] flex-col items-end gap-1 sm:max-w-[80%]">
                    <div className="rounded-2xl rounded-br-none bg-primary px-4 py-2.5 text-sm text-on-primary shadow-sm">
                      {message.content}
                    </div>
                    <span className="text-[10px] text-outline">{formatMessageTime(message.createdAt)}</span>
                  </div>
                );
              }

              return (
                <div key={message._id || `${message.createdAt}-${message.content}`} className="flex max-w-[88%] items-end gap-2.5 sm:max-w-[80%]">
                  <UserAvatar user={message?.sender} sizeClass="h-8 w-8" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="rounded-2xl rounded-bl-none bg-surface-container-high px-4 py-2.5 text-sm text-on-surface">
                      {message.content}
                    </div>
                    <span className="text-[10px] text-outline">{formatMessageTime(message.createdAt)}</span>
                  </div>
                </div>
              );
            })
          : null}
      </div>

      <footer className="border-t border-outline-variant/20 bg-surface-container-low px-4 py-3 md:px-5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-2 shadow-sm">
          <input
            type="text"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            className="w-full border-none bg-transparent px-2 py-2 text-sm text-on-surface outline-none ring-0"
            placeholder="Type a message..."
            maxLength={5000}
          />

          <button
            type="submit"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSend}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              send
            </span>
          </button>
        </form>

        {error ? <p className="mt-2 text-xs font-semibold text-error">{error}</p> : null}
      </footer>
    </section>
  );
}
