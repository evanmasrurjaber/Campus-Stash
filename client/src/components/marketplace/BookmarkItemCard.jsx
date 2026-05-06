import { useNavigate } from 'react-router-dom';
import { getSellerLabel, getInitials, formatPrice, getStatusLabel, getDetailLabel } from '../../utils/formatters';

export default function BookmarkItemCard({ item, onRemove }) {
  const navigate = useNavigate();
  const category = item.category || 'General';
  const imageUrl = item.images?.[0]?.url;
  const statusLabel = getStatusLabel(item.itemType === 'sale' ? 'sale' : item.itemType);
  const detailLabel = getDetailLabel(item, item.itemType === 'sale' ? 'sale' : item.itemType);
  const sellerName = getSellerLabel(item.reportedBy);

  const handleViewItem = () => {
    if (!item?._id) {
      return;
    }
    navigate(`/items/${item._id}`);
  };

  const handleRemove = (event) => {
    event.stopPropagation();
    if (onRemove) {
      onRemove(item);
    }
  };

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
      onClick={handleViewItem}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleViewItem();
        }
      }}
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
        <button
          type="button"
          onClick={handleRemove}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
          aria-label="Remove saved item"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <div className="flex h-full flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 font-headline text-lg font-bold text-on-surface">{item.title}</h3>
            <p className="text-xs font-semibold uppercase tracking-widest text-outline">{category}</p>
          </div>
          {item.itemType === 'sale' ? (
            <span className="shrink-0 text-lg font-black text-primary">{formatPrice(item.price)}</span>
          ) : null}
        </div>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">{item.description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-surface-container-low pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-outline">{detailLabel}</p>
            <p className="truncate text-sm font-medium text-on-surface-variant">{sellerName}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-xl bg-error/10 px-4 py-2 text-sm font-bold text-error transition-colors hover:bg-error/20"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
