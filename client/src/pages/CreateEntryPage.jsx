import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiErrorMessage, createItem } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MainNavbar from '../components/layout/MainNavbar';
import MainFooter from '../components/layout/MainFooter';

const MAX_IMAGES = 5;

const CATEGORIES = [
  'Textbooks & Academics',
  'Electronics',
  'Dorm Essentials',
  'Personal Items (Keys, ID)',
  'Apparel',
  'Sports Equipment',
  'Other',
];

const FOUND_STATUS_OPTIONS = ['With me', 'Turned in to Lost & Found'];

const ITEM_CONDITIONS = ['Like New', 'Good', 'Fair', 'Poor'];

const createInitialForm = () => ({
  itemType: '',
  title: '',
  description: '',
  category: '',
  // Lost fields
  lostLocation: '',
  lostTime: '',
  // Found fields
  foundLocation: '',
  foundTime: '',
  foundItemStatus: '',
  // Sale fields
  price: '',
  deliveryLocation: '',
  itemCondition: '',
});

export default function CreateEntryPage() {
  const [form, setForm] = useState(createInitialForm());
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const imagePreviews = useMemo(
    () =>
      images.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, [imagePreviews]);

  // Initialize mode from state or query param
  useEffect(() => {
    let initialMode = location.state?.mode || new URLSearchParams(location.search).get('mode') || '';

    if (initialMode && ['lost', 'found', 'sale'].includes(initialMode)) {
      setForm((prev) => ({ ...prev, itemType: initialMode }));
    }
  }, [location]);

  const onInputChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const onModeChange = (newMode) => {
    setForm((prev) => ({
      ...prev,
      itemType: newMode,
    }));
  };

  const onTagInputChange = (event) => {
    setTagInput(event.target.value);
  };

  const onAddTag = () => {
    const normalizedTag = tagInput.trim().toLowerCase();

    if (!normalizedTag) {
      return;
    }

    setTags((prev) => {
      if (prev.includes(normalizedTag)) {
        return prev;
      }

      return [...prev, normalizedTag];
    });

    setTagInput('');
  };

  const onTagKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onAddTag();
    }
  };

  const onRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const onImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }

    if (images.length + selectedFiles.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images only.`);
      event.target.value = '';
      return;
    }

    setImages((previousImages) => {
      const nextFiles = [...previousImages, ...selectedFiles];
      const uniqueFiles = [];
      const seen = new Set();

      for (const file of nextFiles) {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

        if (seen.has(fileKey)) {
          continue;
        }

        seen.add(fileKey);
        uniqueFiles.push(file);

        if (uniqueFiles.length >= MAX_IMAGES) {
          break;
        }
      }

      return uniqueFiles;
    });

    event.target.value = '';
  };

  const onRemoveImage = (imageToRemove) => {
    setImages((previousImages) =>
      previousImages.filter(
        (file) => `${file.name}-${file.size}-${file.lastModified}` !== `${imageToRemove.name}-${imageToRemove.size}-${imageToRemove.lastModified}`
      )
    );
  };

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const validateForm = () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const itemType = form.itemType.trim();

    if (!itemType) {
      setError('Please select a listing type.');
      return false;
    }

    if (!title || !description) {
      setError('Title and description are required.');
      return false;
    }

    if (images.length === 0) {
      setError('Please upload at least one image.');
      return false;
    }

    if (itemType === 'lost') {
      const lostLocation = form.lostLocation.trim();
      const lostTime = form.lostTime;

      if (!lostLocation) {
        setError('Lost location is required.');
        return false;
      }

      if (!lostTime) {
        setError('Lost time is required.');
        return false;
      }
    }

    if (itemType === 'found') {
      const foundLocation = form.foundLocation.trim();
      const foundTime = form.foundTime;
      const foundItemStatus = form.foundItemStatus.trim();

      if (!foundLocation) {
        setError('Found location is required.');
        return false;
      }

      if (!foundTime) {
        setError('Found time is required.');
        return false;
      }

      if (!foundItemStatus) {
        setError('Found item status is required.');
        return false;
      }
    }

    if (itemType === 'sale') {
      const price = form.price.trim();
      const deliveryLocation = form.deliveryLocation.trim();
      const itemCondition = form.itemCondition.trim();

      if (!price || parseFloat(price) < 0) {
        setError('Please enter a valid price (≥ 0).');
        return false;
      }

      if (!deliveryLocation) {
        setError('Delivery location is required.');
        return false;
      }

      if (!itemCondition) {
        setError('Item condition is required.');
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('itemType', form.itemType.trim());
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());

      if (form.category) {
        formData.append('category', form.category.trim());
      }

      if (form.itemType === 'lost') {
        formData.append('lostLocation', form.lostLocation.trim());
        formData.append('lostTime', form.lostTime);
      }

      if (form.itemType === 'found') {
        formData.append('foundLocation', form.foundLocation.trim());
        formData.append('foundTime', form.foundTime);
        formData.append('foundItemStatus', form.foundItemStatus.trim());
      }

      if (form.itemType === 'sale') {
        formData.append('price', parseFloat(form.price));
        formData.append('deliveryLocation', form.deliveryLocation.trim());
        formData.append('itemCondition', form.itemCondition.trim());
      }

      tags.forEach((tag) => {
        formData.append('tags', tag);
      });

      images.forEach((file) => {
        formData.append('images', file);
      });

      await createItem(formData);

      setForm(createInitialForm());
      setTagInput('');
      setTags([]);
      setImages([]);
      setSuccessMessage('Your item has been posted successfully!');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not create your listing'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemType = form.itemType.trim();
  const modeTitle =
    itemType === 'lost'
      ? 'Report a Lost Item'
      : itemType === 'found'
        ? 'Report a Found Item'
        : itemType === 'sale'
          ? 'Post a Listing'
          : 'Create New Entry';

  return (
    <div className="min-h-screen bg-background text-on-background font-body page-enter flex flex-col">
      <MainNavbar user={user} onLogout={onLogout} />

      <main className="flex-grow flex flex-col items-center py-12 px-4 sm:px-6">

        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(27,27,33,0.06)]">
              <header className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60 font-bold">Create Entry</p>
                <h2 className="text-3xl font-headline font-bold text-primary mt-2">{modeTitle}</h2>
                <p className="text-sm text-on-surface-variant mt-2">
                  {itemType === 'lost'
                    ? 'Provide clear details so other students can help you recover your item faster.'
                    : itemType === 'found'
                      ? 'Share details about the item you found. Help reunite it with its owner.'
                      : 'List your item for sale. Include photos and accurate condition information.'}
                </p>
              </header>

              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-4">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Step 1: Choose Listing Type</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['lost', 'found', 'sale'].map((mode) => (
                      <label key={mode} className="relative group cursor-pointer">
                        <input
                          type="radio"
                          name="itemType"
                          value={mode}
                          checked={itemType === mode}
                          onChange={() => onModeChange(mode)}
                          className="peer sr-only"
                        />
                        <div className="p-5 rounded-lg bg-surface-container-low border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex flex-col items-center text-center gap-3">
                          <span className="material-symbols-outlined text-3xl text-primary">
                            {mode === 'lost' && 'search'}
                            {mode === 'found' && 'check_circle'}
                            {mode === 'sale' && 'shopping_bag'}
                          </span>
                          <span className="font-bold text-on-surface">
                            {mode === 'lost' && 'Lost Item'}
                            {mode === 'found' && 'Found Item'}
                            {mode === 'sale' && 'For Sale'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {itemType && (
                  <>
                    <div className="space-y-6 border-t border-outline-variant/30 pt-6">
                      <h3 className="text-lg font-headline font-bold text-on-surface">Step 2: Item Details</h3>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="title">
                          Title
                        </label>
                        <input
                          id="title"
                          type="text"
                          value={form.title}
                          onChange={onInputChange}
                          placeholder="e.g., Black JBL Headphones, Organic Chemistry Textbook"
                          className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="category">
                          Category
                        </label>
                        <select
                          id="category"
                          value={form.category}
                          onChange={onInputChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                        >
                          <option value="">Select a category</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="description">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows="5"
                          value={form.description}
                          onChange={onInputChange}
                          placeholder={
                            itemType === 'lost'
                              ? 'Include identifying marks, color, and where you last saw it'
                              : itemType === 'found'
                                ? 'Describe the item condition and where you found it'
                                : 'Describe the item, condition, and any special features'
                          }
                          className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                        />
                      </div>

                      {itemType === 'lost' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="lostLocation">
                              Where Did You Lose It?
                            </label>
                            <input
                              id="lostLocation"
                              type="text"
                              value={form.lostLocation}
                              onChange={onInputChange}
                              placeholder="e.g., Library Level 2, Main Quad"
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="lostTime">
                              When Did You Lose It?
                            </label>
                            <input
                              id="lostTime"
                              type="datetime-local"
                              value={form.lostTime}
                              onChange={onInputChange}
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            />
                          </div>
                        </>
                      )}

                      {itemType === 'found' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="foundLocation">
                              Where Did You Find It?
                            </label>
                            <input
                              id="foundLocation"
                              type="text"
                              value={form.foundLocation}
                              onChange={onInputChange}
                              placeholder="e.g., Near Student Union, Science Hall Entrance"
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="foundTime">
                              When Did You Find It?
                            </label>
                            <input
                              id="foundTime"
                              type="datetime-local"
                              value={form.foundTime}
                              onChange={onInputChange}
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="foundItemStatus">
                              Where is the Item Currently?
                            </label>
                            <select
                              id="foundItemStatus"
                              value={form.foundItemStatus}
                              onChange={onInputChange}
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            >
                              <option value="">Select status</option>
                              {FOUND_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {itemType === 'sale' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="price">
                              Price ($)
                            </label>
                            <input
                              id="price"
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              value={form.price}
                              onChange={onInputChange}
                              placeholder="0.00"
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="deliveryLocation">
                              Pickup Location (Campus)
                            </label>
                            <input
                              id="deliveryLocation"
                              type="text"
                              value={form.deliveryLocation}
                              onChange={onInputChange}
                              placeholder="e.g., Library Lobby, Main Quad"
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="itemCondition">
                              Item Condition
                            </label>
                            <select
                              id="itemCondition"
                              value={form.itemCondition}
                              onChange={onInputChange}
                              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                            >
                              <option value="">Select condition</option>
                              {ITEM_CONDITIONS.map((condition) => (
                                <option key={condition} value={condition}>
                                  {condition}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-6 border-t border-outline-variant/30 pt-6">
                      <h3 className="text-lg font-headline font-bold text-on-surface">Step 3: Tags & Media</h3>

                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="tag-input">
                          Category Tags
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            id="tag-input"
                            type="text"
                            value={tagInput}
                            onChange={onTagInputChange}
                            onKeyDown={onTagKeyDown}
                            placeholder="e.g., electronics, urgent"
                            className="flex-1 px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                          />
                          <button
                            type="button"
                            onClick={onAddTag}
                            className="px-4 py-3 rounded-lg border border-outline-variant font-semibold hover:bg-surface-container-low"
                          >
                            Add Tag
                          </button>
                        </div>
                        {tags.length ? (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => onRemoveTag(tag)}
                                className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold"
                              >
                                {tag} x
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant">No tags added yet.</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="images">
                          Images (Required, up to {MAX_IMAGES})
                        </label>
                        <label className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-on-surface">Drag and drop or click to upload</p>
                            <p className="text-xs text-on-surface-variant">PNG, JPG or WEBP up to {MAX_IMAGES} images</p>
                          </div>
                          <input id="images" type="file" accept="image/*" multiple onChange={onImageChange} className="hidden" />
                        </label>

                        {imagePreviews.length ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {imagePreviews.map(({ file, previewUrl }) => (
                              <div key={`${file.name}-${file.size}-${file.lastModified}`} className="group overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm relative">
                                <div className="aspect-square bg-surface-container-high overflow-hidden">
                                  <img src={previewUrl} alt={file.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                </div>
                                <div className="px-3 py-2 text-[11px] text-on-surface-variant truncate pr-9">{file.name}</div>
                                <button
                                  type="button"
                                  onClick={() => onRemoveImage(file)}
                                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant text-center">
                            No images selected yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {error ? <p className="text-sm font-semibold text-error bg-error-container/20 rounded-lg px-4 py-3">{error}</p> : null}
                {successMessage ? (
                  <p className="text-sm font-semibold text-secondary bg-secondary-fixed/40 rounded-lg px-4 py-3">{successMessage}</p>
                ) : null}

                {itemType && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full academic-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-container/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {isSubmitting
                      ? 'Posting...'
                      : itemType === 'lost'
                        ? 'Post Lost Item'
                        : itemType === 'found'
                          ? 'Post Found Item'
                          : 'Post Listing'}
                  </button>
                )}
              </form>
            </section>
          </div>

          <aside className="lg:col-span-5 flex flex-col gap-6">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-surface-container-high">
                <div className="aspect-video bg-surface-container-low relative">
                  {images[0] ? (
                    <img src={URL.createObjectURL(images[0])} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1544822688-c67547b5d6df?auto=format&fit=crop&q=80&w=600"
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-secondary-container text-white text-[10px] font-bold uppercase rounded-full shadow-md">
                      {itemType === 'lost' ? 'Lost Item' : itemType === 'found' ? 'Found Item' : 'For Sale'}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-headline font-bold text-xl text-primary leading-tight truncate">{form.title || 'Item Title'}</h3>
                    <span className="font-headline font-bold text-xl text-on-surface">{itemType === 'sale' ? `$${form.price || '0'}` : '$0'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>
                      {itemType === 'lost'
                        ? form.lostLocation || 'Location'
                        : itemType === 'found'
                          ? form.foundLocation || 'Location'
                          : form.deliveryLocation || 'Pickup location'}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm line-clamp-2">{form.description || 'Short description preview...'}</p>
                  <div className="pt-4 mt-4 border-t border-surface-container-low flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed-dim" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">{user?.fullName || 'CampusStash User'}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold">Just now</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-tertiary-fixed/10 p-6 rounded-xl border border-tertiary-fixed/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-on-tertiary-container">verified_user</span>
                  <h4 className="font-headline font-bold text-on-tertiary-container">Campus Safety Tip</h4>
                </div>
                <p className="text-sm text-on-tertiary-fixed-variant leading-relaxed">
                  For transactions or handovers, always meet in well-lit, public campus zones like the Library lobby or the Student Union during daylight hours.
                </p>
              </div>

              <div className="bg-surface-container-low p-1 rounded-xl overflow-hidden grayscale contrast-125 opacity-70">
                <img src="https://www.bracu.ac.bd/sites/default/files/uploads/2025/11/09/1_2.jpg" alt="campus map" className="w-full h-32 object-cover rounded-lg" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
