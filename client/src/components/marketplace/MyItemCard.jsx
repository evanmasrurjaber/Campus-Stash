import { useNavigate } from 'react-router-dom';
import { getSellerLabel, getInitials, formatPrice, getStatusLabel, getDetailLabel } from '../../utils/formatters';

export default function MyItemCard({ item, variant = 'sale', onDelete, onEdit }) {
  const navigate = useNavigate();
  const category = item.category || 'General';
  const imageUrl = item.images?.[0]?.url;
  const statusLabel = getStatusLabel(variant);
  const detailLabel = getDetailLabel(item, variant);
  const sellerName = getSellerLabel(item.reportedBy);

  const handleViewItem = (event) => {
    event.stopPropagation();
    if (!item?._id) return;
    navigate(`/items/${item._id}`);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(item._id);
    } else if (item?._id) {
      navigate(`/items/${item._id}/edit`);
    }
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(item._id, item.title);
    }
  };

  return (
    <article className="group overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col h-full">
      {/* Image Container */}
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

      {/* Content Section */}
      <div className="flex flex-col flex-grow p-4">
        {/* Title and Price */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 font-headline text-lg font-bold text-on-surface">{item.title}</h3>
            <p className="text-xs font-semibold uppercase tracking-widest text-outline">{category}</p>
          </div>
          {variant === 'sale' && (
            <span className="shrink-0 text-lg font-black text-primary">{formatPrice(item.price)}</span>
          )}
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{item.description}</p>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-surface-container-low flex gap-2">
          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-primary font-semibold py-2 rounded-lg transition-colors text-sm"
            title="Edit this item"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span className="hidden sm:inline">Edit</span>
          </button>

          {/* View Item Button */}
          <button
            onClick={handleViewItem}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold py-2 rounded-lg transition-colors text-sm"
            title="View item details"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span className="hidden sm:inline">View</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-lg transition-colors flex items-center justify-center"
            title="Delete this item"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
