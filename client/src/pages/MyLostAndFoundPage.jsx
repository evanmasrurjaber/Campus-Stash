import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainNavbar from '../components/layout/MainNavbar';
import MainFooter from '../components/layout/MainFooter';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MyItemCard from '../components/marketplace/MyItemCard';
import { getItems, deleteItem, getApiErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function MyLostAndFoundPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('lost');
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
        mode: activeTab,
      },
    });
  };

  const loadUserItems = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getItems({
        itemType: activeTab,
        reportedBy: user?._id,
      });
      setItems(response.data.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load your items'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserItems();
    }
  }, [user, activeTab]);

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
      setSuccessMessage('Report deleted successfully');
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Failed to delete report'));
    }
  };

  const handleEditItem = (itemId) => {
    navigate(`/items/${itemId}/edit`);
  };

  const lostCount = items.filter((item) => item.type === 'lost').length;
  const foundCount = items.filter((item) => item.type === 'found').length;
  const totalCount = lostCount + foundCount;

  const tabLabel = activeTab === 'lost' ? 'Lost Items' : 'Found Items';
  const currentCount = items.length;

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      <MainNavbar user={user} onLogout={onLogout} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-12">
        {/* Header & Stats Summary */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-container-low rounded-xl p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary leading-tight">
              My Lost & Found Reports
            </h1>
            <p className="text-on-surface-variant font-medium text-base md:text-lg">
              Manage your active lost and found items on campus.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Stat Cards */}
            <div className="flex gap-4 flex-grow sm:flex-grow-0">
              {/* Total Reports Stat */}
              <div className="bg-surface-container-lowest rounded-lg p-4 shadow-sm min-w-[140px]">
                <p className="text-label text-xs md:text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Total
                </p>
                <p className="headline-text text-2xl md:text-3xl font-bold text-primary">{totalCount}</p>
              </div>

              {/* Active Reports Stat */}
              <div className="bg-surface-container-lowest rounded-lg p-4 shadow-sm min-w-[140px] bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-surface-variant/50">
                <p className="text-label text-xs md:text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Active
                </p>
                <p className="headline-text text-2xl md:text-3xl font-bold text-tertiary-container">
                  {currentCount}
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
              <span className="font-bold font-headline text-sm">New Report</span>
            </button>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex gap-2 md:gap-4 border-b border-outline-variant/30 pb-4 overflow-x-auto">
          {[
            ['lost', 'Lost Items'],
            ['found', 'Found Items'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`px-4 py-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === value
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

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
              <p className="text-on-surface-variant">Loading {tabLabel.toLowerCase()}...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">
              {activeTab === 'lost' ? 'search_hands_free' : 'visibility'}
            </span>
            <h3 className="text-lg font-headline font-semibold text-on-surface mb-2">
              No {tabLabel.toLowerCase()} yet
            </h3>
            <p className="text-on-surface-variant text-center mb-6 max-w-sm">
              {activeTab === 'lost'
                ? "You haven't reported any lost items yet. Report a missing item to get help from the campus community."
                : "You haven't reported any found items yet. Help return items to their owners!"}
            </p>
            <button
              onClick={onAddPost}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-lg font-semibold hover:shadow-md transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              File New Report
            </button>
          </div>
        ) : (
          <>
            {/* Items Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {items.map((item) => (
                <MyItemCard
                  key={item._id}
                  item={item}
                  variant={activeTab}
                  onDelete={handleDeleteItem}
                  onEdit={handleEditItem}
                />
              ))}
            </section>

            {/* Mobile Add Button */}
            <button
              onClick={onAddPost}
              className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-all active:scale-95"
              title="Add new report"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete report?"
        message={`Delete ${pendingDelete?.itemTitle || 'this report'} permanently? This action cannot be undone.`}
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
