import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainFooter from '../components/layout/MainFooter';
import MainNavbar from '../components/layout/MainNavbar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BookmarkItemCard from '../components/marketplace/BookmarkItemCard';
import { useAuth } from '../hooks/useAuth';
import { getBookmarkedItemIds, removeItemFromBookmarks } from '../utils/bookmarks';
import { getItemById, getApiErrorMessage } from '../services/api';

export default function BookmarkPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const loadItems = async () => {
    setLoading(true);
    setError('');

    try {
      const ids = getBookmarkedItemIds();
      if (!ids.length) {
        setItems([]);
        return;
      }

      const results = await Promise.all(
        ids.map(async (itemId) => {
          try {
            const response = await getItemById(itemId);
            return response.data.item || null;
          } catch {
            return null;
          }
        }),
      );

      setItems(results.filter(Boolean));
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load saved items'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleRemoveClick = (item) => {
    setSelectedItem(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (selectedItem) {
      removeItemFromBookmarks(selectedItem._id);
      setItems((prev) => prev.filter((item) => item._id !== selectedItem._id));
    }
    setDeleteConfirmOpen(false);
    setSelectedItem(null);
  };

  const handleCancelRemove = () => {
    setDeleteConfirmOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <MainNavbar user={user} onLogout={onLogout} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        <div className="mb-8 rounded-[2rem] bg-gradient-to-br from-secondary-container/10 via-surface-container-lowest to-primary/10 p-6 shadow-sm md:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">Saved Listings</p>
            <h1 className="mt-3 font-headline text-3xl font-black tracking-tight text-primary md:text-5xl">
              Your bookmarks
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
              Items you saved for later are stored here so you can return quickly and review them when ready.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-96 animate-pulse rounded-2xl bg-surface-container-low" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-error/20 bg-error/5 p-6 text-sm text-error">
            {error}
          </div>
        ) : items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <BookmarkItemCard key={item._id} item={item} onRemove={handleRemoveClick} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-surface-container-lowest p-12 text-center shadow-sm">
            <h3 className="font-headline text-2xl font-bold text-on-surface">No saved items yet.</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Save items from the marketplace to see them here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
            >
              Browse Marketplace
            </button>
          </div>
        )}
      </main>

      <MainFooter />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Remove saved item"
        message={`Are you sure you want to remove "${selectedItem?.title || 'this item'}" from your bookmarks?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </div>
  );
}
