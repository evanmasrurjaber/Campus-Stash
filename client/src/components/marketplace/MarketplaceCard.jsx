import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSellerLabel, getInitials, formatPrice, getStatusLabel, getDetailLabel, getCtaLabel } from '../../utils/formatters';
import { isItemBookmarked, toggleItemBookmark } from '../../utils/bookmarks';

export default function MarketplaceCard({ item, variant = 'sale' }) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(isItemBookmarked(item?._id));
  const sellerName = getSellerLabel(item.reportedBy);
  const category = item.category || 'General';
  const imageUrl = item.images?.[0]?.url;
  const statusLabel = getStatusLabel(variant);
  const detailLabel = getDetailLabel(item, variant);
  const ctaLabel = getCtaLabel(variant);

  useEffect(() => {
    setIsSaved(isItemBookmarked(item?._id));
  }, [item?._id]);

  const handleNavigate = () => {
    if (!item?._id) {
      return;
    }

    navigate(`/items/${item._id}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate();
    }
  };

  const handleToggleBookmark = (event) => {
    event.stopPropagation();

    if (!item?._id) {
      return;
    }

    const nextState = toggleItemBookmark(item._id);
    setIsSaved(nextState);
  };

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="relative h-52 overflow-hidden bg-surface-container-low">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary-container/20 text-4xl font-black text-primary">
            {getInitials(item.title)}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary shadow-lg">
          {statusLabel}
        </span>
      </div>

      <div className="flex h-full flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 font-headline text-lg font-bold text-on-surface">{item.title}</h3>
            <p className="text-xs font-semibold uppercase tracking-widest text-outline">{category}</p>
          </div>
          <span className="shrink-0 text-lg font-black text-primary">{formatPrice(item.price)}</span>
        </div>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">{item.description}</p>

        <div className="mt-auto flex flex-col gap-3 border-t border-surface-container-low pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-outline">{detailLabel}</p>
            <p className="truncate text-sm font-medium text-on-surface-variant">{sellerName}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-transform active:scale-95 ${
                variant === 'lost'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-primary text-on-primary'
              }`}
            >
              {ctaLabel}
            </span>
            {variant === 'sale' ? (
              <button
                type="button"
                onClick={handleToggleBookmark}
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-base">{isSaved ? 'bookmark' : 'bookmark_add'}</span>
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}