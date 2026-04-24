import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const getInitials = (fullName) => {
  const normalizedName = String(fullName || '').trim();

  if (!normalizedName) {
    return 'U';
  }

  const initials = normalizedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
};

const getFirstName = (fullName) => {
  const normalizedName = String(fullName || '').trim();

  if (!normalizedName) {
    return 'Student';
  }

  return normalizedName.split(/\s+/)[0] || 'Student';
};

function AvatarPill({ user }) {
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const avatarUrl = user?.avatar?.url || '';

  if (avatarUrl && failedImageUrl !== avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Profile avatar"
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setFailedImageUrl(avatarUrl)}
      />
    );
  }

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
      {getInitials(user?.fullName)}
    </span>
  );
}

export default function MainNavbar({ user, onLogout }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleProfileClick = () => {
    setIsProfileMenuOpen(false);
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    onLogout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/40 bg-surface/95 backdrop-blur-lg">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary">
          <img src="/CampusStash_logo.png" alt="CampusStash logo" className="h-9 w-auto" />
          <span className="font-headline text-xl font-extrabold tracking-tight">CampusStash</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#" className="text-sm font-semibold tracking-wide text-on-surface-variant transition-colors hover:text-primary">
            Market Place
          </a>
          <a href="#" className="text-sm font-semibold tracking-wide text-on-surface-variant transition-colors hover:text-primary">
            Lost &amp; Found
          </a>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Cart"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Inbox"
          >
            <span className="material-symbols-outlined">mail</span>
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-low px-2 py-1 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
            >
              <AvatarPill user={user} />
              <span className="hidden max-w-28 truncate md:inline">{getFirstName(user?.fullName)}</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-1 shadow-lg" role="menu">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                  onClick={handleProfileClick}
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Profile
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                  My Listings
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-base">search_hands_free</span>
                  My Lost &amp; Found
                </button>

                <div className="my-1 h-px bg-outline-variant/40"></div>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-error transition-colors hover:bg-error/10"
                  onClick={handleLogoutClick}
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 pb-3 md:hidden md:px-6">
        <a href="#" className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary">
          Market Place
        </a>
        <a href="#" className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary">
          Lost &amp; Found
        </a>
      </div>
    </header>
  );
}
