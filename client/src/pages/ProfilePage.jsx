import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainFooter from '../components/layout/MainFooter';
import MainNavbar from '../components/layout/MainNavbar';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage, getInbox, getItems, updateProfile } from '../services/api';

const AVATAR_REMOVE_ENABLED = true;

const getSafeText = (value) => String(value || '').trim();

const getInitials = (fullName) => {
  const normalizedName = getSafeText(fullName);

  if (!normalizedName) {
    return 'U';
  }

  const nameParts = normalizedName.split(/\s+/).filter(Boolean);
  const initials = nameParts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
};

const getAvatarUrl = (profile) => profile?.avatar?.url || '';

const formatCount = (value) => String(Number.isFinite(value) ? value : 0).padStart(2, '0');

const createDraftFromProfile = (profile) => ({
  fullName: getSafeText(profile?.fullName),
  phoneNumber: getSafeText(profile?.phoneNumber),
  studentId: profile?.studentId ? String(profile.studentId) : '',
});

const validateField = (field, value) => {
  const trimmedValue = String(value || '').trim();

  if (field === 'fullName') {
    if (!trimmedValue) {
      return 'Full name is required';
    }

    if (trimmedValue.length < 2 || trimmedValue.length > 100) {
      return 'Full name must be between 2 and 100 characters';
    }

    return '';
  }

  if (field === 'phoneNumber') {
    if (value && !trimmedValue) {
      return 'Phone number cannot be empty';
    }

    return '';
  }

  if (field === 'studentId') {
    if (!trimmedValue) {
      return '';
    }

    if (!/^\d{8}$/.test(trimmedValue)) {
      return 'Student ID must be an 8-digit number';
    }

    return '';
  }

  return '';
};

const validateDraft = (draft) => {
  const fields = ['fullName', 'phoneNumber', 'studentId'];

  return fields.reduce((accumulator, field) => {
    const fieldError = validateField(field, draft[field]);
    if (fieldError) {
      accumulator[field] = fieldError;
    }
    return accumulator;
  }, {});
};

function ProfileRow({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60">{label}</p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{value || 'N/A'}</p>
    </div>
  );
}

function AvatarBadge({ profile, previewUrl }) {
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const avatarUrl = previewUrl || getAvatarUrl(profile);
  const showImage = Boolean(avatarUrl) && failedImageUrl !== avatarUrl;

  if (showImage) {
    return (
      <img
        src={avatarUrl}
        alt="Profile avatar"
        className="h-24 w-24 rounded-2xl border border-outline-variant/60 object-cover"
        onError={() => setFailedImageUrl(avatarUrl)}
      />
    );
  }

  return (
    <span className="inline-flex h-24 w-24 items-center justify-center rounded-2xl border border-outline-variant/60 bg-primary text-2xl font-bold text-on-primary">
      {getInitials(profile?.fullName)}
    </span>
  );
}

export default function ProfilePage() {
  const { user, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [profile, setProfile] = useState(user);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => createDraftFromProfile(user));
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityStats, setActivityStats] = useState({ listings: 0, lostFound: 0, inbox: 0 });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  const isSaveDisabled = isSubmitting || loadingProfile;

  const latestAvatarUrl = useMemo(() => getAvatarUrl(profile), [profile]);

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
        const currentUser = await refreshCurrentUser();
        setProfile(currentUser);
        setDraft(createDraftFromProfile(currentUser));
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Could not load profile details'));
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (user && !isEditing) {
      setProfile(user);
      setDraft(createDraftFromProfile(user));
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (!profile?.id) {
      return undefined;
    }

    let active = true;

    const fetchActivityStats = async () => {
      setActivityLoading(true);
      setActivityError('');

      try {
        const [saleResponse, lostResponse, foundResponse, inboxResponse] = await Promise.all([
          getItems({ itemType: 'sale', reportedBy: profile.id, page: 1, limit: 1 }),
          getItems({ itemType: 'lost', reportedBy: profile.id, page: 1, limit: 1 }),
          getItems({ itemType: 'found', reportedBy: profile.id, page: 1, limit: 1 }),
          getInbox(1),
        ]);

        const listings = saleResponse?.data?.pagination?.totalItems || 0;
        const lostCount = lostResponse?.data?.pagination?.totalItems || 0;
        const foundCount = foundResponse?.data?.pagination?.totalItems || 0;
        const inboxCount = inboxResponse?.data?.pagination?.totalCount || 0;

        if (active) {
          setActivityStats({
            listings,
            lostFound: lostCount + foundCount,
            inbox: inboxCount,
          });
        }
      } catch (requestError) {
        if (active) {
          setActivityError(getApiErrorMessage(requestError, 'Could not load activity stats'));
        }
      } finally {
        if (active) {
          setActivityLoading(false);
        }
      }
    };

    fetchActivityStats();

    return () => {
      active = false;
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!avatarFile) {
      return undefined;
    }

    const temporaryPreviewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(temporaryPreviewUrl);

    return () => {
      URL.revokeObjectURL(temporaryPreviewUrl);
    };
  }, [avatarFile]);

  useEffect(() => {
    if (avatarFile) {
      return;
    }

    setAvatarPreviewUrl('');
  }, [avatarFile]);

  useEffect(() => {
    if (!saveSuccess) {
      return undefined;
    }

    const successTimer = setTimeout(() => {
      setSaveSuccess('');
    }, 3000);

    return () => {
      clearTimeout(successTimer);
    };
  }, [saveSuccess]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleGoListings = () => {
    navigate('/my-listings');
  };

  const handleGoLostAndFound = () => {
    navigate('/my-lost-and-found');
  };

  const updateDraftField = (field, value) => {
    setDraft((previousDraft) => ({ ...previousDraft, [field]: value }));
  };

  const validateAndSetFieldError = (field, value) => {
    const validationMessage = validateField(field, value);

    setFieldErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };

      if (validationMessage) {
        nextErrors[field] = validationMessage;
      } else {
        delete nextErrors[field];
      }

      return nextErrors;
    });
  };

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.value;
    updateDraftField(field, nextValue);
    validateAndSetFieldError(field, nextValue);
    setSaveError('');
  };

  const handleFieldBlur = (field) => (event) => {
    validateAndSetFieldError(field, event.target.value);
  };

  const resetDraftToProfile = (sourceProfile) => {
    setDraft(createDraftFromProfile(sourceProfile));
    setFieldErrors({});
    setAvatarFile(null);
    setAvatarPreviewUrl('');
    setRemoveAvatar(false);
    setSaveError('');
  };

  const handleEnterEditMode = () => {
    resetDraftToProfile(profile);
    setSaveSuccess('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    resetDraftToProfile(profile);
    setIsEditing(false);
  };

  const handleAvatarSelectClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setAvatarFile(selectedFile);
    setRemoveAvatar(false);
    setSaveError('');
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
    setRemoveAvatar(true);
    setSaveError('');
  };

  const buildProfileUpdateFormData = () => {
    const formData = new FormData();
    let hasUpdates = false;

    const normalizedFullName = getSafeText(draft.fullName);
    const normalizedPhoneNumber = getSafeText(draft.phoneNumber);
    const normalizedStudentId = getSafeText(draft.studentId);
    const currentFullName = getSafeText(profile?.fullName);
    const currentPhoneNumber = getSafeText(profile?.phoneNumber);
    const currentStudentId = profile?.studentId ? String(profile.studentId) : '';

    if (normalizedFullName && normalizedFullName !== currentFullName) {
      formData.append('fullName', normalizedFullName);
      hasUpdates = true;
    }

    if (normalizedPhoneNumber && normalizedPhoneNumber !== currentPhoneNumber) {
      formData.append('phoneNumber', normalizedPhoneNumber);
      hasUpdates = true;
    }

    if (normalizedStudentId && normalizedStudentId !== currentStudentId) {
      formData.append('studentId', normalizedStudentId);
      hasUpdates = true;
    }

    if (avatarFile) {
      formData.append('avatar', avatarFile);
      hasUpdates = true;
    }

    if (removeAvatar && latestAvatarUrl) {
      formData.append('removeAvatar', 'true');
      hasUpdates = true;
    }

    return { formData, hasUpdates };
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    const validationErrors = validateDraft(draft);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const { formData, hasUpdates } = buildProfileUpdateFormData();

    if (!hasUpdates) {
      setSaveError('No profile changes to save');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile(formData);
      const latestUser = await refreshCurrentUser();
      setProfile(latestUser);
      resetDraftToProfile(latestUser);
      setIsEditing(false);
      setSaveSuccess('Profile updated successfully');
    } catch (requestError) {
      setSaveError(getApiErrorMessage(requestError, 'Could not update your profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface page-enter">
      <MainNavbar user={profile} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 md:p-8">
            <div className="absolute right-[-50px] top-[-50px] h-32 w-32 rounded-full bg-primary/10 blur-2xl"></div>

            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60">User Profile</p>
            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <AvatarBadge profile={profile} previewUrl={avatarPreviewUrl} />
                </div>
                <div className="flex-1">
                  <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
                    {profile?.fullName || 'CampusStash Student'}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                    Manage your personal details and track your listing identity across marketplace and lost &amp; found activities.
                  </p>
                </div>
              </div>
            </div>

            {saveSuccess ? (
              <div className="mt-5 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{saveSuccess}</div>
            ) : null}

            {error ? <p className="mt-5 text-sm font-semibold text-error">{error}</p> : null}

            {!isEditing ? (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileRow label="Full Name" value={profile?.fullName} />
                <ProfileRow label="Email" value={profile?.email} />
                <ProfileRow label="Student ID" value={profile?.studentId ? String(profile.studentId) : ''} />
                <ProfileRow label="Phone Number" value={profile?.phoneNumber} />
                <ProfileRow label="Verification" value={profile?.isVerified ? 'Verified' : 'Pending'} />
                <ProfileRow label="User ID" value={profile?.id} />
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="mt-8 space-y-4">
                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60">Avatar</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                      onClick={handleAvatarSelectClick}
                    >
                      Replace Avatar
                    </button>

                    {AVATAR_REMOVE_ENABLED ? (
                      <button
                        type="button"
                        className="rounded-lg border border-error/60 px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/10"
                        onClick={handleAvatarRemove}
                        disabled={!latestAvatarUrl && !avatarFile}
                      >
                        Remove Avatar
                      </button>
                    ) : null}

                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>

                  <p className="mt-3 text-xs text-on-surface-variant">
                    {avatarFile
                      ? `Selected file: ${avatarFile.name}`
                      : removeAvatar
                        ? 'Avatar will be removed when you save changes.'
                        : 'JPG, PNG, WEBP, HEIC up to 2MB.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="rounded-xl bg-surface-container-low p-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60">Full Name</span>
                    <input
                      type="text"
                      value={draft.fullName}
                      onChange={handleFieldChange('fullName')}
                      onBlur={handleFieldBlur('fullName')}
                      className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                    />
                    {fieldErrors.fullName ? <p className="mt-2 text-xs font-semibold text-error">{fieldErrors.fullName}</p> : null}
                  </label>

                  <label className="rounded-xl bg-surface-container-low p-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60">Email</span>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-sm text-on-surface-variant"
                    />
                  </label>

                  <label className="rounded-xl bg-surface-container-low p-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60">Phone Number</span>
                    <input
                      type="text"
                      value={draft.phoneNumber}
                      onChange={handleFieldChange('phoneNumber')}
                      onBlur={handleFieldBlur('phoneNumber')}
                      className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                    />
                    {fieldErrors.phoneNumber ? <p className="mt-2 text-xs font-semibold text-error">{fieldErrors.phoneNumber}</p> : null}
                  </label>

                  <label className="rounded-xl bg-surface-container-low p-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60">Student ID</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={draft.studentId}
                      onChange={handleFieldChange('studentId')}
                      onBlur={handleFieldBlur('studentId')}
                      className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                    />
                    {fieldErrors.studentId ? <p className="mt-2 text-xs font-semibold text-error">{fieldErrors.studentId}</p> : null}
                  </label>
                </div>

                {saveError ? (
                  <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm font-semibold text-error">{saveError}</div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSaveDisabled}
                  >
                    {isSubmitting ? 'Saving profile...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
              <h2 className="font-headline text-xl font-bold text-primary">My Activity</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {activityLoading
                  ? 'Refreshing your activity snapshots...'
                  : 'Live counts from your listings, posts, and inbox.'}
              </p>

              {activityError ? <p className="mt-3 text-sm font-semibold text-error">{activityError}</p> : null}

              <div className="mt-5 grid gap-3">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Marketplace Listings</p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {activityLoading ? '--' : formatCount(activityStats.listings)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Lost &amp; Found Posts</p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {activityLoading ? '--' : formatCount(activityStats.lostFound)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Inbox Messages</p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {activityLoading ? '--' : formatCount(activityStats.inbox)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
              <h3 className="font-headline text-lg font-bold text-primary">Quick Actions</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                  onClick={isEditing ? handleCancelEdit : handleEnterEditMode}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface"
                  onClick={handleGoListings}
                >
                  My Listings
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface"
                  onClick={handleGoLostAndFound}
                >
                  My Lost &amp; Found
                </button>
              </div>

              <p className="mt-4 text-xs text-on-surface-variant">
                {loadingProfile
                  ? 'Refreshing profile details...'
                  : isSubmitting
                    ? 'Saving your profile changes...'
                    : 'Profile is synced with your authenticated account.'}
              </p>
            </div>
          </aside>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
