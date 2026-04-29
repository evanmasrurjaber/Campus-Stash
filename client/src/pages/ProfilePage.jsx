import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainFooter from '../components/layout/MainFooter';
import MainNavbar from '../components/layout/MainNavbar';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage, updateProfile } from '../services/api';

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
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                  onClick={isEditing ? handleCancelEdit : handleEnterEditMode}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface">
                  My Listings
                </button>
                <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface">
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
