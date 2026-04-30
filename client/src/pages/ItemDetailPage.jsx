import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MainFooter from '../components/layout/MainFooter';
import MainNavbar from '../components/layout/MainNavbar';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';
import ChatThreadPanel from '../components/messages/ChatThreadPanel';
import { useAuth } from '../hooks/useAuth';
import {
  getApiErrorMessage,
  getItemById,
  getItems,
  getThreadWithUser,
  sendMessage,
} from '../services/api';

const toIdString = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value._id || value.id || value);
};

const isValidObjectId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

const getInitials = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Free';
  }

  return `$${Number(value).toFixed(Number.isInteger(Number(value)) ? 0 : 2)}`;
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not specified';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const mapItemTypeToPostType = (itemType) => {
  if (itemType === 'sale') {
    return 'saleItem';
  }

  if (itemType === 'found') {
    return 'foundItem';
  }

  if (itemType === 'lost') {
    return 'lostItem';
  }

  return 'listing';
};

const getTypeLabel = (itemType) => {
  if (itemType === 'sale') {
    return 'For Sale';
  }

  if (itemType === 'found') {
    return 'Found Item';
  }

  return 'Lost Item';
};

const getContactLabel = (itemType) => (itemType === 'sale' ? 'Contact Seller' : 'Contact Reporter');

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const chatRef = useRef(null);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [relatedItems, setRelatedItems] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState('');

  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const isOwner = useMemo(
    () => toIdString(item?.reportedBy) === toIdString(user?.id || user?._id),
    [item, user],
  );

  const conversation = useMemo(() => {
    if (!item || isOwner) {
      return null;
    }

    const otherUserId = toIdString(item.reportedBy);
    const postType = mapItemTypeToPostType(item.itemType);
    const postId = toIdString(item._id);

    if (!isValidObjectId(otherUserId) || !isValidObjectId(postId)) {
      return null;
    }

    return {
      key: `${postType}:${item._id}:${otherUserId}`,
      otherUser: item.reportedBy,
      otherUserId,
      postId,
      postType,
    };
  }, [item, isOwner]);

  const activeImageUrl = item?.images?.[activeImageIndex]?.url || '';
  const additionalImages = item?.images?.slice(0, 4) || [];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleContactClick = () => {
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getItemById(itemId);
        const fetchedItem = response?.data?.item || null;
        setItem(fetchedItem);
        setActiveImageIndex(0);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load item details'));
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!item) {
        return;
      }

      setRelatedLoading(true);
      setRelatedError('');

      try {
        const response = await getItems({
          itemType: item.itemType,
          category: item.category || undefined,
          limit: 6,
          sort: 'recent',
        });

        const results = response?.data?.items || [];
        const filtered = results.filter((candidate) => toIdString(candidate._id) !== toIdString(item._id)).slice(0, 3);
        setRelatedItems(filtered);
      } catch (requestError) {
        setRelatedError(getApiErrorMessage(requestError, 'Could not load similar listings'));
      } finally {
        setRelatedLoading(false);
      }
    };

    loadRelated();
  }, [item]);

  useEffect(() => {
    const loadThread = async () => {
      if (!conversation) {
        setThreadMessages([]);
        setThreadError('');
        return;
      }

      setThreadLoading(true);
      setThreadError('');

      try {
        const response = await getThreadWithUser(conversation.otherUserId, conversation.postId, conversation.postType);
        setThreadMessages(response?.data?.messages || []);
      } catch (requestError) {
        setThreadError(getApiErrorMessage(requestError, 'Could not load messages'));
        setThreadMessages([]);
      } finally {
        setThreadLoading(false);
      }
    };

    loadThread();
  }, [conversation]);

  const handleSendMessage = async (content) => {
    if (!conversation) {
      return;
    }

    setSendingMessage(true);
    setThreadError('');

    try {
      await sendMessage({
        recipientId: conversation.otherUserId,
        postId: conversation.postId,
        postType: conversation.postType,
        content,
      });

      const response = await getThreadWithUser(conversation.otherUserId, conversation.postId, conversation.postType);
      setThreadMessages(response?.data?.messages || []);
    } catch (requestError) {
      setThreadError(getApiErrorMessage(requestError, 'Could not send message'));
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar user={user} onLogout={handleLogout} />
        <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
          <div className="h-96 animate-pulse rounded-3xl bg-surface-container-low" />
        </main>
        <MainFooter />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar user={user} onLogout={handleLogout} />
        <main className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
          <div className="rounded-3xl border border-error/20 bg-error/5 p-8 text-center">
            <h2 className="font-headline text-2xl font-bold text-error">Unable to load item</h2>
            <p className="mt-2 text-sm text-on-surface-variant">{error || 'This item is not available.'}</p>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
            >
              Back to Marketplace
            </button>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  const typeLabel = getTypeLabel(item.itemType);
  const contactLabel = getContactLabel(item.itemType);
  const reportedByName = item.reportedBy?.fullName || 'CampusStash User';
  const reportedByInitials = getInitials(reportedByName);
  const categoryLabel = item.category || 'General';

  return (
    <div className="min-h-screen bg-background text-on-background">
      <MainNavbar user={user} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
          <Link className="hover:text-primary" to={`/marketplace?state=${item.itemType === 'sale' ? 'listings' : item.itemType}`}>
            Marketplace
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-semibold">{categoryLabel}</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-semibold text-on-surface">{item.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <section className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-low">
              {activeImageUrl ? (
                <img src={activeImageUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl font-black text-primary">
                  {reportedByInitials}
                </div>
              )}
            </div>

            {additionalImages.length ? (
              <div className="grid grid-cols-3 gap-4">
                {additionalImages.map((image, index) => (
                  <button
                    key={image.public_id || image.url || index}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`aspect-square overflow-hidden rounded-xl bg-surface-container-low ${
                      index === activeImageIndex ? 'ring-2 ring-primary' : 'ring-1 ring-outline-variant/40'
                    }`}
                  >
                    <img src={image.url} alt={`${item.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-tertiary-fixed-dim px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-tertiary-fixed">
                  {typeLabel}
                </span>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  {categoryLabel}
                </span>
              </div>

              <h1 className="mb-2 text-3xl font-black text-primary">{item.title}</h1>
              <p className="text-on-surface-variant">Posted by {reportedByName}</p>

              {item.itemType === 'sale' ? (
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-primary">{formatPrice(item.price)}</span>
                  {item.itemCondition ? (
                    <span className="text-sm font-semibold text-on-surface-variant">{item.itemCondition} condition</span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 space-y-3 text-sm text-on-surface-variant">
                {item.itemType === 'lost' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      <span>Last seen near {item.lostLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">schedule</span>
                      <span>Time lost: {formatDateTime(item.lostTime)}</span>
                    </div>
                  </>
                ) : null}

                {item.itemType === 'found' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      <span>Found at {item.foundLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">schedule</span>
                      <span>Found time: {formatDateTime(item.foundTime)}</span>
                    </div>
                    {item.foundItemStatus ? (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <span>Status: {item.foundItemStatus}</span>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {item.itemType === 'sale' ? (
                  <>
                    {item.deliveryLocation ? (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <span>Pickup at {item.deliveryLocation}</span>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleContactClick}
                  disabled={isOwner}
                  className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isOwner ? 'This is your listing' : contactLabel}
                </button>
                {item.itemType === 'sale' ? (
                  <button
                    type="button"
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-5 py-3 text-sm font-bold text-primary"
                  >
                    Save for later
                  </button>
                ) : null}
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/items/${item._id}/edit`)}
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-5 py-3 text-sm font-bold text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Listing
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed">
                  <span className="text-xl font-bold text-primary">{reportedByInitials}</span>
                </div>
                <div>
                  <p className="font-bold text-primary">{reportedByName}</p>
                  <p className="text-sm text-on-surface-variant">CampusStash verified member</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-6">
              <div className="mb-3 flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">security</span>
                <h3>Student Safety Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">-</span>
                  Meet at the Student Union or well-lit safe zones.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">-</span>
                  Inspect items before transferring funds.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">-</span>
                  Use CampusStash messaging for coordination.
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div className="mb-10">
              <h2 className="mb-4 text-2xl font-bold text-primary">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                {item.description}
              </p>

              {item.tags?.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div ref={chatRef} className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
              <div className="bg-primary px-6 py-4 text-on-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-tertiary-fixed" />
                    <span className="font-bold">Chat with {reportedByName}</span>
                  </div>
                  <span className="text-xs uppercase tracking-widest opacity-80">Typical response: 10 mins</span>
                </div>
              </div>

              <div className="p-6">
                {isOwner ? (
                  <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-6 text-sm text-on-surface-variant">
                    Messaging is disabled because this is your own listing.
                  </div>
                ) : (
                  <ChatThreadPanel
                    currentUserId={user?.id || user?._id}
                    conversation={conversation}
                    messages={threadMessages}
                    loading={threadLoading}
                    sendPending={sendingMessage}
                    error={threadError}
                    onSendMessage={handleSendMessage}
                  />
                )}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-8">
            <div>
              <h3 className="mb-4 text-xl font-bold text-primary">Similar Listings</h3>
              {relatedError ? (
                <p className="text-sm text-error">{relatedError}</p>
              ) : null}

              {relatedLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="h-32 rounded-2xl bg-surface-container-low animate-pulse" />
                  ))}
                </div>
              ) : relatedItems.length ? (
                <div className="space-y-4">
                  {relatedItems.map((related) => (
                    <MarketplaceCard key={related._id} item={related} variant={related.itemType === 'sale' ? 'sale' : related.itemType} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No similar listings yet.</p>
              )}
            </div>

            <div className="rounded-3xl bg-surface-container-high p-6">
              <h3 className="mb-3 font-bold text-primary">Location</h3>
              <div className="mb-4 h-40 overflow-hidden rounded-xl bg-surface-container-low">
                <img
                  src="https://www.bracu.ac.bd/sites/default/files/uploads/2025/11/09/1_2.jpg"
                  alt="BRAC University campus map preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <p className="text-sm font-bold">{item.itemType === 'sale' ? item.deliveryLocation || 'On campus' : item.lostLocation || item.foundLocation || 'On campus'}</p>
                  <p className="text-xs text-on-surface-variant">Available for meetup: 9AM - 5PM</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
