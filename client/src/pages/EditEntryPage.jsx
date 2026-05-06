import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage, updateItem, getItemById, deleteItem } from '../services/api';
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

const toIdString = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value._id || value.id || value);
};

const createInitialForm = () => ({
  title: '',
  description: '',
  category: '',
  lostLocation: '',
  lostTime: '',
  foundLocation: '',
  foundTime: '',
  foundItemStatus: '',
  price: '',
  deliveryLocation: '',
  itemCondition: '',
});

export default function EditEntryPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const userId = toIdString(user?.id || user?._id);

  const [form, setForm] = useState(createInitialForm());
  const [itemType, setItemType] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  
  // Image management
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isNotOwner, setIsNotOwner] = useState(false);
  const [itemMetadata, setItemMetadata] = useState({ views: 0, inquiries: 0, postedDate: new Date() });

  // Generate preview URLs for new images
  const newImagePreviews = useMemo(
    () =>
      newImages.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    [newImages]
  );

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, [newImagePreviews]);

  // Load item data on mount
  useEffect(() => {
    const loadItem = async () => {
      try {
        setIsLoading(true);
        const response = await getItemById(itemId);
        const item = response?.data?.item;

        if (!item) {
          setError('Item not found');
          return;
        }

        // Check ownership
        if (toIdString(item.reportedBy) !== userId) {
          setIsNotOwner(true);
          return;
        }

        // Set item type
        setItemType(item.itemType || '');

        // Populate form fields
        setForm({
          title: item.title || '',
          description: item.description || '',
          category: item.category || '',
          lostLocation: item.lostLocation || '',
          lostTime: item.lostTime ? item.lostTime.substring(0, 16) : '',
          foundLocation: item.foundLocation || '',
          foundTime: item.foundTime ? item.foundTime.substring(0, 16) : '',
          foundItemStatus: item.foundItemStatus || '',
          price: item.price || '',
          deliveryLocation: item.deliveryLocation || '',
          itemCondition: item.itemCondition || '',
        });

        // Set tags
        setTags(item.tags || []);

        // Set existing images
        setExistingImages(item.images || []);

        // Set metadata
        setItemMetadata({
          views: item.views || 0,
          inquiries: item.inquiries || 0,
          postedDate: item.createdAt || new Date(),
        });
      } catch (err) {
        console.error('Error loading item:', err);
        setError('Failed to load item. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (itemId && userId) {
      loadItem();
    }
  }, [itemId, userId]);

  const onInputChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
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

  const onNewImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }

    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + selectedFiles.length;
    if (totalImages > MAX_IMAGES) {
      setError(`You can have up to ${MAX_IMAGES} images total.`);
      event.target.value = '';
      return;
    }

    setNewImages((previousImages) => {
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

        if (uniqueFiles.length + existingImages.length - imagesToDelete.length >= MAX_IMAGES) {
          break;
        }
      }

      return uniqueFiles;
    });

    event.target.value = '';
  };

  const onRemoveNewImage = (imageToRemove) => {
    setNewImages((previousImages) =>
      previousImages.filter(
        (file) => `${file.name}-${file.size}-${file.lastModified}` !== `${imageToRemove.name}-${imageToRemove.size}-${imageToRemove.lastModified}`
      )
    );
  };

  const onRemoveExistingImage = (publicId) => {
    setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId));
    setImagesToDelete((prev) => [...prev, publicId]);
  };

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const validateForm = () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length;

    if (!title || !description) {
      setError('Title and description are required.');
      return false;
    }

    if (totalImages === 0) {
      setError('Please keep at least one image.');
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

      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());

      if (form.category) {
        formData.append('category', form.category.trim());
      }

      if (itemType === 'lost') {
        formData.append('lostLocation', form.lostLocation.trim());
        formData.append('lostTime', form.lostTime);
      }

      if (itemType === 'found') {
        formData.append('foundLocation', form.foundLocation.trim());
        formData.append('foundTime', form.foundTime);
        formData.append('foundItemStatus', form.foundItemStatus.trim());
      }

      if (itemType === 'sale') {
        formData.append('price', parseFloat(form.price));
        formData.append('deliveryLocation', form.deliveryLocation.trim());
        formData.append('itemCondition', form.itemCondition.trim());
      }

      tags.forEach((tag) => {
        formData.append('tags', tag);
      });

      // Add new images
      newImages.forEach((file) => {
        formData.append('images', file);
      });

      // Add images to delete
      if (imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      const response = await updateItem(itemId, formData);

      setSuccessMessage('Your item has been updated successfully!');

      setTimeout(() => {
        navigate(`/items/${itemId}`);
      }, 1200);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Could not update your listing');
      
      if (requestError?.response?.status === 403) {
        setError('You do not have permission to edit this item.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
        await deleteItem(itemId);
        setSuccessMessage('Post deleted successfully. Redirecting...');
        setTimeout(() => {
          navigate('/marketplace', { replace: true });
        }, 1500);
    } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Could not delete your post'));
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body page-enter flex flex-col">
        <MainNavbar user={user} onLogout={onLogout} />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block">
              <span className="material-symbols-outlined text-5xl text-primary animate-spin">
                autorenew
              </span>
            </div>
            <p className="mt-4 text-on-surface-variant">Loading item...</p>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  if (isNotOwner) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body page-enter flex flex-col">
        <MainNavbar user={user} onLogout={onLogout} />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-6xl text-error mx-auto block mb-4">
              lock
            </span>
            <h2 className="text-2xl font-bold text-primary mb-2">Access Denied</h2>
            <p className="text-on-surface-variant mb-6">You do not have permission to edit this item.</p>
            <button
              onClick={() => navigate(`/items/${itemId}`)}
              className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-colors"
            >
              View Item
            </button>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  const modeTitle =
    itemType === 'lost'
      ? 'Edit Lost Item'
      : itemType === 'found'
        ? 'Edit Found Item'
        : itemType === 'sale'
          ? 'Edit Listing'
          : 'Edit Entry';

  const formattedDate = new Date(itemMetadata.postedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background text-on-background font-body page-enter flex flex-col">
      <MainNavbar user={user} onLogout={onLogout} />

      <main className="flex-grow flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex text-sm text-on-surface-variant font-label mb-2">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center hover:text-primary transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                    <span className="text-primary font-medium">Edit Listing</span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Header with Status Badge */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-4xl font-bold text-primary tracking-tight">{modeTitle}</h1>
              </div>
              <span className="bg-secondary-container text-on-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Active
              </span>
            </div>

            {/* Form */}
            <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(27,27,33,0.06)]">
              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-6">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Basic Information</h3>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="title">
                      Item Title
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="location">
                        Campus Location
                      </label>
                      <input
                        id="location"
                        type="text"
                        disabled
                        value={
                          itemType === 'lost'
                            ? form.lostLocation
                            : itemType === 'found'
                              ? form.foundLocation
                              : form.deliveryLocation
                        }
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20 opacity-70 cursor-not-allowed"
                      />
                    </div>
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
                </div>

                {/* Type-Specific Section */}
                {itemType === 'sale' && (
                  <div className="space-y-4 p-6 bg-surface-container-low rounded-lg border border-outline-variant/10">
                    <h3 className="font-headline text-lg font-medium text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-surface-tint">payments</span>
                      Sale Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="itemCondition">
                          Condition
                        </label>
                        <select
                          id="itemCondition"
                          value={form.itemCondition}
                          onChange={onInputChange}
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                        >
                          <option value="">Select condition</option>
                          {ITEM_CONDITIONS.map((condition) => (
                            <option key={condition} value={condition}>
                              {condition}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {itemType === 'lost' && (
                  <div className="space-y-4 p-6 bg-surface-container-low rounded-lg border border-outline-variant/10">
                    <h3 className="font-headline text-lg font-medium text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-surface-tint">search</span>
                      Lost Item Details
                    </h3>
                    <div className="space-y-4">
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
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-surface-tint/20"
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
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {itemType === 'found' && (
                  <div className="space-y-4 p-6 bg-surface-container-low rounded-lg border border-outline-variant/10">
                    <h3 className="font-headline text-lg font-medium text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-surface-tint">check_circle</span>
                      Found Item Details
                    </h3>
                    <div className="space-y-4">
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
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-surface-tint/20"
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
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-surface-tint/20"
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
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-surface-tint/20"
                        >
                          <option value="">Select status</option>
                          {FOUND_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-on-surface-variant mt-1">
                          The system will allow you to update the status if the item is handed over to university lost and found.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags & Images Section */}
                <div className="space-y-6 border-t border-outline-variant/30 pt-6">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Tags & Images</h3>

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
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Images (Keep at least 1, up to {MAX_IMAGES} total)
                    </label>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-on-surface-variant">Current Images</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {existingImages.map((image) => (
                            <div key={image.public_id} className="group overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm relative">
                              <div className="aspect-square bg-surface-container-high overflow-hidden">
                                <img src={image.url} alt="existing" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              </div>
                              <button
                                type="button"
                                onClick={() => onRemoveExistingImage(image.public_id)}
                                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload New Images */}
                    {existingImages.length - imagesToDelete.length + newImages.length < MAX_IMAGES && (
                      <label className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-on-surface">Drag and drop or click to upload</p>
                          <p className="text-xs text-on-surface-variant">
                            PNG, JPG or WEBP (max {MAX_IMAGES - existingImages.length + imagesToDelete.length - newImages.length} more)
                          </p>
                        </div>
                        <input
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={onNewImageChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* New Image Previews */}
                    {newImagePreviews.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-on-surface-variant">New Images</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {newImagePreviews.map(({ file, previewUrl }) => (
                            <div key={`${file.name}-${file.size}-${file.lastModified}`} className="group overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm relative">
                              <div className="aspect-square bg-surface-container-high overflow-hidden">
                                <img src={previewUrl} alt={file.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              </div>
                              <div className="px-3 py-2 text-[11px] text-on-surface-variant truncate pr-9">{file.name}</div>
                              <button
                                type="button"
                                onClick={() => onRemoveNewImage(file)}
                                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                aria-label={`Remove ${file.name}`}
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {existingImages.length + newImages.length === 0 && (
                      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant text-center">
                        No images yet. Please upload at least one.
                      </div>
                    )}
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error ? <p className="text-sm font-semibold text-error bg-error-container/20 rounded-lg px-4 py-3">{error}</p> : null}
                {successMessage ? (
                  <p className="text-sm font-semibold text-secondary bg-secondary-fixed/40 rounded-lg px-4 py-3">{successMessage}</p>
                ) : null}
              </form>

              {/* Action Buttons */}
              <div className="bg-surface-container-high px-0 py-5 border-t border-outline-variant/10 mt-8 flex justify-between items-center">
                <button
                  onClick={onDeletePost}
                  disabled={isSubmitting}
                  className="text-error hover:bg-error-container hover:text-on-error-container px-4 py-2 rounded-md font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  Delete Post
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate(`/items/${itemId}`)}
                    className="text-primary hover:bg-surface-container-highest px-6 py-2 rounded-md font-medium transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-2 rounded-md font-medium shadow-sm hover:shadow-md transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-5 flex flex-col gap-6">
            <div className="sticky top-24 flex flex-col gap-6">
              {/* Tips Card */}
              <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed/20 rounded-bl-full -mr-4 -mt-4"></div>
                <h3 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2 relative z-10">
                  <span className="material-symbols-outlined text-primary-container">lightbulb</span>
                  Curator Tips
                </h3>
                <ul className="space-y-4 relative z-10">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <p className="font-body text-sm text-on-surface-variant">Update your condition accurately. Honesty ensures smoother transactions on campus.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <p className="font-body text-sm text-on-surface-variant">Mention specific meeting spots like 'Student Union North Entrance' to build trust.</p>
                  </li>
                </ul>
              </div>

              {/* Meta Card */}
              <div className="bg-surface-container-highest rounded-xl p-6">
                <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest mb-3 opacity-70">Listing Meta</h3>
                <div className="space-y-2">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-on-surface-variant">Posted:</span>
                    <span className="text-on-surface font-medium">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-on-surface-variant">Views:</span>
                    <span className="text-on-surface font-medium">{itemMetadata.views}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-on-surface-variant">Inquiries:</span>
                    <span className="text-on-surface font-medium">{itemMetadata.inquiries}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
