import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainNavbar from '../components/layout/MainNavbar';
import MainFooter from '../components/layout/MainFooter';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MyItemCard from '../components/marketplace/MyItemCard';
import { getItems, deleteItem, getApiErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function MyListingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?.id || user?._id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const onAddPost = () => {
    navigate('/create-entry', {
      state: {
        mode: 'sale',
      },
    });
  };

  const loadUserListings = async () => {
    setLoading(true);
    setError('');

    try {
      if (!currentUserId) {
        setItems([]);
        return;
      }

      const response = await getItems({
        itemType: 'sale',
        reportedBy: currentUserId,
      });
      setItems(response.data.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load your listings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      loadUserListings();
    }
  }, [currentUserId]);
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDeleteItem = (itemId, itemTitle) => {
    setPendingDelete({ itemId, itemTitle });
  };

  const closeDeleteDialog = () => {
    setPendingDelete(null);
  };

  const confirmDeleteItem = async () => {
    if (!pendingDelete?.itemId) {
      return;
    }

    try {
      setDeleteError('');
      await deleteItem(pendingDelete.itemId);
      setItems((prev) => prev.filter((item) => item._id !== pendingDelete.itemId));
      setSuccessMessage('Listing deleted successfully');
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Failed to delete listing'));
    }
  };

  const handleEditItem = (itemId) => {
    navigate(`/items/${itemId}/edit`);
  };

  const activeCount = items.length;
  const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      <MainNavbar user={user} onLogout={onLogout} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-12">
        {/* Header & Stats Summary */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-container-low rounded-xl p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary leading-tight">
              My Listings
            </h1>
            <p className="text-on-surface-variant font-medium text-base md:text-lg">
              Manage your active marketplace listings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Stat Cards */}
            <div className="flex gap-4 flex-grow sm:flex-grow-0">
              {/* Active Listings Stat */}
              <div className="bg-surface-container-lowest rounded-lg p-4 shadow-sm min-w-[140px]">
                <p className="text-label text-xs md:text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Active
                </p>
                <p className="headline-text text-2xl md:text-3xl font-bold text-primary">{activeCount}</p>
              </div>

              {/* Total Value Stat */}
              <div className="bg-surface-container-lowest rounded-lg p-4 shadow-sm min-w-[140px] bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-surface-variant/50">
                <p className="text-label text-xs md:text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Total Value
                </p>
                <p className="headline-text text-2xl md:text-3xl font-bold text-tertiary-container">
                  ${totalValue}
                </p>
              </div>
            </div>

            {/* Add New Button */}
            <button
              onClick={onAddPost}
              className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg p-4 shadow-sm hover:shadow-md transition-all min-w-[140px] group"
            >
              <span className="material-symbols-outlined text-3xl mb-1 group-hover:scale-110 transition-transform">
                add_circle
              </span>
              <span className="font-bold font-headline text-sm">New Listing</span>
            </button>
          </div>
        </section>

        {/* Error Messages */}
        {error && (
          <div className="bg-error-container/20 border border-error/50 text-error p-4 rounded-lg flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5">error_outline</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {deleteError && (
          <div className="bg-error-container/20 border border-error/50 text-error p-4 rounded-lg flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5">error_outline</span>
            <p className="text-sm font-medium">{deleteError}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-tertiary-fixed-dim/30 border border-tertiary-fixed/50 text-on-tertiary-fixed p-4 rounded-lg flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5">check_circle</span>
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block">
                <div className="animate-spin h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full"></div>
              </div>
              <p className="text-on-surface-variant">Loading your listings...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">
              inventory_2
            </span>
            <h3 className="text-lg font-headline font-semibold text-on-surface mb-2">No listings yet</h3>
            <p className="text-on-surface-variant text-center mb-6 max-w-sm">
              You haven't created any marketplace listings yet. Start selling items on campus!
            </p>
            <button
              onClick={onAddPost}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-lg font-semibold hover:shadow-md transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Create Your First Listing
            </button>
          </div>
        ) : (
          <>
            {/* Listings Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {items.map((item) => (
                <MyItemCard
                  key={item._id}
                  item={item}
                  variant="sale"
                  onDelete={handleDeleteItem}
                  onEdit={handleEditItem}
                />
              ))}
            </section>

            {/* Mobile Add Button */}
            <button
              onClick={onAddPost}
              className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-all active:scale-95"
              title="Add new listing"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete listing?"
        message={`Delete ${pendingDelete?.itemTitle || 'this listing'} permanently? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDeleteItem}
        onCancel={closeDeleteDialog}
      />

      <MainFooter />
    </div>
  );
}
