import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainNavbar from '../components/layout/MainNavbar';
import MainFooter from '../components/layout/MainFooter';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters';
import { getItems, getApiErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const DEFAULT_FILTERS = {
  category: '',
  itemCondition: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent',
};

const MODE_TO_TYPE = {
  listings: 'sale',
  lost: 'lost',
  found: 'found',
};

const MODE_TO_CREATE_ENTRY_MODE = {
  listings: 'sale',
  lost: 'lost',
  found: 'found',
};

const SORT_OPTIONS = [
  ['recent', 'Most Recent'],
  ['oldest', 'Oldest'],
  ['price_asc', 'Price: Low to High'],
  ['price_desc', 'Price: High to Low'],
];

export default function MarketplacePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [state, setState] = useState('listings');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const onAddPost = () => {
    navigate('/create-entry', {
      state: {
        mode: MODE_TO_CREATE_ENTRY_MODE[state],
      },
    });
  };

  const setMarketplaceState = (nextState) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = '/marketplace';
    nextUrl.searchParams.set('state', nextState);

    const currentSearch = location.search;
    const nextSearch = nextUrl.search;

    setState(nextState);
    setPagination((prev) => ({ ...prev, page: 1 }));

    if (currentSearch !== nextSearch) {
      navigate(`${nextUrl.pathname}${nextUrl.search}`, { replace: true });
    }
  };

  useEffect(() => {
    const nextState = searchParams.get('state');
    if (nextState === 'sale') {
      setState('listings');
      return;
    }

    if (nextState && MODE_TO_TYPE[nextState]) {
      setState(nextState);
      return;
    }

    setState('listings');
  }, [searchParams]);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getItems({
          itemType: MODE_TO_TYPE[state],
          q: search,
          category: filters.category || undefined,
          itemCondition: state === 'listings' ? filters.itemCondition || undefined : undefined,
          minPrice: state === 'listings' && filters.minPrice !== '' ? filters.minPrice : undefined,
          maxPrice: state === 'listings' && filters.maxPrice !== '' ? filters.maxPrice : undefined,
          sort: filters.sort,
          page: pagination.page,
          limit: 12,
        });

        setItems(response.data.items);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
        }));
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load items'));
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [state, search, filters.category, filters.itemCondition, filters.minPrice, filters.maxPrice, filters.sort, pagination.page]);

  const onStateChange = (nextState) => {
    setMarketplaceState(nextState);
  };

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const onClear = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const activeLabel = state === 'listings' ? 'Items for Sale' : state === 'lost' ? 'Lost Items' : 'Found Items';

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <MainNavbar user={user} onLogout={onLogout} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        <section className="mb-8 rounded-[2rem] bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary-container/20 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">Campus Marketplace</p>
              <h1 className="font-headline text-3xl font-black tracking-tight text-primary md:text-5xl">
                Search campus items.
              </h1>
              <p className="text-sm leading-relaxed text-on-surface-variant md:text-base">
                Browse {activeLabel.toLowerCase()} with filters, sorting, and a focused search surface.
              </p>
            </div>

            <div className="w-full max-w-xl rounded-2xl bg-transparent p-0">
              <label className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
                <span className="material-symbols-outlined text-outline">search</span>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full border-none bg-transparent p-0 text-sm focus:ring-0"
                  placeholder={`Search ${activeLabel.toLowerCase()}...`}
                  type="search"
                />
              </label>
            </div>
          </div>
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-outline">Sort by</span>
            <select
              value={filters.sort}
              onChange={(event) => onFilterChange('sort', event.target.value)}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium"
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
            <button
            type="button"
            onClick={onAddPost}
            className="inline-flex items-center gap-2 rounded-full bg-tertiary-fixed px-4 py-2 text-sm font-semibold text-on-tertiary-fixed shadow-sm transition-colors hover:bg-tertiary-fixed-dim"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Post
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <MarketplaceFilters
            state={state}
            filters={filters}
            onStateChange={onStateChange}
            onFilterChange={onFilterChange}
            onClear={onClear}
          />

          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">{activeLabel}</h2>
                <p className="text-sm text-on-surface-variant">{pagination.totalItems} results found</p>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-sm text-error">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-96 animate-pulse rounded-2xl bg-surface-container-low" />
                ))}
              </div>
            ) : items.length ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <MarketplaceCard key={item._id} item={item} variant={state === 'listings' ? 'sale' : state} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-surface-container-lowest p-12 text-center shadow-sm">
                <h3 className="font-headline text-2xl font-bold text-on-surface">No matches found</h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Try clearing filters or changing the active state to find more results.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                className="rounded-xl bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 text-sm font-medium text-outline">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
                className="rounded-xl bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}