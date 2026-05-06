import { useNavigate } from 'react-router-dom';
import { getSellerLabel, getInitials, formatPrice, getStatusLabel, getDetailLabel, getCtaLabel } from '../../utils/formatters';

export default function MarketplaceCard({ item, variant = 'sale' }) {
  const navigate = useNavigate();
  const sellerName = getSellerLabel(item.reportedBy);
  const category = item.category || 'General';
  const imageUrl = item.images?.[0]?.url;
  const statusLabel = getStatusLabel(variant);
  const detailLabel = getDetailLabel(item, variant);
  const ctaLabel = getCtaLabel(variant);

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

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-surface-container-low pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-outline">{detailLabel}</p>
            <p className="truncate text-sm font-medium text-on-surface-variant">{sellerName}</p>
          </div>
          <span
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-transform active:scale-95 ${
              variant === 'lost'
                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                : 'bg-primary text-on-primary'
            }`}
          >
            {ctaLabel}
          </span>
        </div>
      </div>
    </article>
  );
}