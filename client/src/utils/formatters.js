/**
 * Shared utility functions for formatting and text manipulation
 */

export const getSellerLabel = (user) => {
  const name = String(user?.fullName || '').trim();
  return name || 'Campus User';
};

export const getInitials = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

export const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

    return `৳${Number(value).toFixed(Number.isInteger(Number(value)) ? 0 : 2)}`;
};

export const getStatusLabel = (variant) => {
  switch (variant) {
    case 'sale':
      return 'For Sale';
    case 'lost':
      return 'Lost Item';
    case 'found':
      return 'Found Item';
    default:
      return 'Item';
  }
};

export const getDetailLabel = (item, variant) => {
  switch (variant) {
    case 'sale':
      return item.itemCondition || 'Condition unknown';
    case 'lost':
      return item.lostLocation || 'Location unknown';
    case 'found':
      return item.foundLocation || 'Location unknown';
    default:
      return 'N/A';
  }
};

export const getCtaLabel = (variant) => {
  switch (variant) {
    case 'sale':
      return 'View Item';
    case 'lost':
      return 'Help Find';
    case 'found':
      return 'Claim Item';
    default:
      return 'View';
  }
};
