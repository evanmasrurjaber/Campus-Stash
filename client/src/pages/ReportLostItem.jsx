import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, reportLostItem } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const MAX_IMAGES = 5;

const createInitialForm = () => ({
  title: '',
  description: '',
  lastKnownLocation: '',
});

export default function ReportLostItem() {
  const [form, setForm] = useState(createInitialForm);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { logout } = useAuth();
  const navigate = useNavigate();

  const selectedImageNames = useMemo(() => images.map((file) => file.name), [images]);

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

  const onImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setImages(selectedFiles.slice(0, MAX_IMAGES));
  };

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const lastKnownLocation = form.lastKnownLocation.trim();

    if (!title || !description || !lastKnownLocation) {
      setError('Title, description, and location are required.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('lastKnownLocation', lastKnownLocation);

      tags.forEach((tag) => {
        formData.append('tags', tag);
      });

      images.forEach((file) => {
        formData.append('images', file);
      });

      await reportLostItem(formData);

      setForm(createInitialForm());
      setTagInput('');
      setTags([]);
      setImages([]);
      setSuccessMessage('Your lost item report has been submitted.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not submit your report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface page-enter">
      <nav className="sticky top-0 glass-header px-6 py-4 flex items-center justify-between z-50">
        <h1 className="text-xl font-headline font-extrabold tracking-tight text-primary">CampusStash</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold hover:bg-surface-container-low"
          >
            Back to Dashboard
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold"
          >
            Log Out
          </button>
        </div>
      </nav>

      <main className="px-4 py-10">
        <section className="max-w-4xl mx-auto bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(27,27,33,0.06)]">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/60 font-bold">Lost and Found</p>
            <h2 className="text-3xl font-headline font-bold text-primary mt-2">Report a Lost Item</h2>
            <p className="text-sm text-on-surface-variant mt-2">
              Provide clear details so other students can help you recover your item faster.
            </p>
          </header>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={onInputChange}
                placeholder="e.g., Black JBL Headphones"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-widest text-primary/70"
                htmlFor="lastKnownLocation"
              >
                Last Known Location
              </label>
              <input
                id="lastKnownLocation"
                type="text"
                value={form.lastKnownLocation}
                onChange={onInputChange}
                placeholder="e.g., Library Level 2"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
              />
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
                placeholder="Include identifying marks, color, and where you last saw it"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20"
              />
            </div>

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
                  placeholder="e.g., electronics"
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

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="images">
                Images (Optional, up to {MAX_IMAGES})
              </label>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={onImageChange}
                className="w-full bg-surface-container-low rounded-lg px-4 py-3"
              />
              {selectedImageNames.length ? (
                <ul className="text-xs text-on-surface-variant space-y-1">
                  {selectedImageNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-on-surface-variant">No images selected.</p>
              )}
            </div>

            {error ? (
              <p className="text-sm font-semibold text-error bg-error-container/20 rounded-lg px-4 py-3">{error}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm font-semibold text-secondary bg-secondary-fixed/40 rounded-lg px-4 py-3">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full academic-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-container/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Lost Item Report'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
