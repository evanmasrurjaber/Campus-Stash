// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, getMe } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function DataRow({ label, value }) {
  return (
    <div className="p-4 rounded-lg bg-surface-container-low">
      <p className="text-xs uppercase tracking-widest text-primary/60 font-bold">{label}</p>
      <p className="text-sm font-semibold text-on-surface mt-1">{value || 'N/A'}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoadingProfile(true);
    setError('');

    try {
      const data = await getMe();
      setProfile(data.user);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load profile'));
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface page-enter">
      <nav className="sticky top-0 glass-header px-6 py-4 flex items-center justify-between z-50">
        <h1 className="text-xl font-headline font-extrabold tracking-tight text-primary">CampusStash</h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold"
        >
          Log Out
        </button>
      </nav>

      <main className="px-4 py-10">
        <section className="max-w-4xl mx-auto bg-surface-container-lowest rounded-xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/60 font-bold">Authenticated Session</p>
              <h2 className="text-3xl font-headline font-bold text-primary mt-2">
                Welcome, {profile?.fullName || 'Student'}
              </h2>
              <p className="text-sm text-on-surface-variant mt-2">
                This data is loaded from your backend /api/auth/me endpoint.
              </p>
            </div>

            <button
              onClick={fetchProfile}
              disabled={loadingProfile}
              className="px-4 py-3 rounded-lg border border-outline-variant text-sm font-semibold hover:bg-surface-container-low disabled:opacity-60"
            >
              {loadingProfile ? 'Refreshing...' : 'Refresh Profile'}
            </button>
          </div>

          {error ? <p className="text-sm font-semibold text-error mb-6">{error}</p> : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataRow label="Full Name" value={profile?.fullName} />
            <DataRow label="Email" value={profile?.email} />
            <DataRow label="Student ID" value={profile?.studentId ? String(profile.studentId) : ''} />
            <DataRow label="Phone Number" value={profile?.phoneNumber} />
            <DataRow label="Verified" value={profile?.isVerified ? 'Yes' : 'No'} />
            <DataRow
              label="User ID"
              value={profile?.id}
            />
          </div>
        </section>
      </main>
    </div>
  );
}