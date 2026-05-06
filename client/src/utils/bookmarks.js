const STORAGE_KEY = 'campusstash_bookmarks';

const readBookmarks = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || '[]';
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
  } catch (err) {
    return [];
  }
};

const writeBookmarks = (items) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const getBookmarkedItemIds = () => readBookmarks();

export const isItemBookmarked = (itemId) => {
  if (!itemId) {
    return false;
  }
  return readBookmarks().includes(String(itemId));
};

export const addItemToBookmarks = (itemId) => {
  if (!itemId) {
    return;
  }

  const normalizedId = String(itemId);
  const current = readBookmarks();
  if (!current.includes(normalizedId)) {
    writeBookmarks([...current, normalizedId]);
  }
};

export const removeItemFromBookmarks = (itemId) => {
  if (!itemId) {
    return;
  }

  const normalizedId = String(itemId);
  const current = readBookmarks();
  const next = current.filter((id) => id !== normalizedId);
  writeBookmarks(next);
};

export const toggleItemBookmark = (itemId) => {
  if (!itemId) {
    return;
  }

  const normalizedId = String(itemId);
  const current = readBookmarks();

  if (current.includes(normalizedId)) {
    writeBookmarks(current.filter((id) => id !== normalizedId));
    return false;
  }

  writeBookmarks([...current, normalizedId]);
  return true;
};
