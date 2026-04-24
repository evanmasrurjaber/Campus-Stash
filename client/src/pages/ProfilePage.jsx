import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainFooter from '../components/layout/MainFooter';
import MainNavbar from '../components/layout/MainNavbar';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage, getMe } from '../services/api';

function ProfileRow({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60">{label}</p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{value || 'N/A'}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen';

    return () => {
      document.body.className = previousBodyClass;
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setError('');

      try {
        const data = await getMe();
        setProfile(data.user);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Could not load profile details'));
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface page-enter">
      <MainNavbar user={profile} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 md:p-8">
            <div className="absolute right-[-50px] top-[-50px] h-32 w-32 rounded-full bg-primary/10 blur-2xl"></div>

            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60">User Profile</p>
            <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
              {profile?.fullName || 'CampusStash Student'}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
              Manage your personal details and track your listing identity across marketplace and lost &amp; found activities.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileRow label="Full Name" value={profile?.fullName} />
              <ProfileRow label="Email" value={profile?.email} />
              <ProfileRow label="Student ID" value={profile?.studentId ? String(profile.studentId) : ''} />
              <ProfileRow label="Phone Number" value={profile?.phoneNumber} />
              <ProfileRow label="Verification" value={profile?.isVerified ? 'Verified' : 'Pending'} />
              <ProfileRow label="User ID" value={profile?.id} />
            </div>

            {error ? <p className="mt-5 text-sm font-semibold text-error">{error}</p> : null}
          </article>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
              <h2 className="font-headline text-xl font-bold text-primary">My Activity</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Static preview cards for now.</p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Marketplace Listings</p>
                  <p className="mt-1 text-2xl font-bold text-primary">07</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Lost &amp; Found Posts</p>
                  <p className="mt-1 text-2xl font-bold text-primary">03</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Inbox Messages</p>
                  <p className="mt-1 text-2xl font-bold text-primary">12</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
              <h3 className="font-headline text-lg font-bold text-primary">Quick Actions</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
                  Edit Profile
                </button>
                <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface">
                  My Listings
                </button>
                <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface">
                  My Lost &amp; Found
                </button>
              </div>

              <p className="mt-4 text-xs text-on-surface-variant">
                {loadingProfile ? 'Refreshing profile details...' : 'Profile is synced with your authenticated account.'}
              </p>
            </div>
          </aside>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
