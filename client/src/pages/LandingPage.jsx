import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainNavbar from '../components/layout/MainNavbar';
import MainFooter from '../components/layout/MainFooter';
import { getApiErrorMessage, getItems } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const HERO_IMAGE_URL =
  'https://www.bracu.ac.bd/sites/default/files/pillars.jpg';
const MARKETPLACE_CARD_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB4KV2ZjRZh0kCwDlKu62QYSKbhDUQ1CEc_ofv1Ss3gymqHWkPG1ntU6wdnO-RPhoogylSKs7uRIkEcLq-AV370wMLvrTunYZU4gCtc1woOtzYWAcTSWPHxUr-tvPUac_0xvQIvj9RzuodOV7XmsVB0enRhlLDlR_nemi7kIfnHcfWzEbd4GwnMe7AufzJ-YpIH8X5ls9xAatoAf1_MtUYnceKeBzOZ9AIhJI20dWZfMQinCEp_fAUNWTa0noiz-6aPmvvdiIpY6Vc';
const LOST_FOUND_CARD_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuASTtEaXo7wM9F4Mapi0GhGr3mac57vJL0QOvJDWBu6PO0x8f2cgmVguzoK0-9H4n6BPySybfe-KN3g7GCgoaKn96tkceqmejQPmSgLgT2sGJQVtzpJMKbPuKB-IYM4iRmzehPB_tj2tIoER80KxUCHksqViCJoAoKwkQtqxt0oK3kWiXaPrIiEGv2wG08u41jaC1JOIDT8r0hT9jSb51cn15MH6c_7n3N9UpcffZ9lcYr16kHFTl9iA3jw2cj6bkYAjHpj0ChPB2Q';

const FALLBACK_FEATURED_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAbcQ0E9XRfVo-AFTozyXSwJGpmPNyasfR9ADzAcPTK4RpyKJugQdHd3cNZQD0ht6FAUpCUWkwrec_7AGRnPuVPUqb-ocKZhqtiyaVb5dEelFb53uJexaW12GK_5tz6PPhSHB-V58dLheAN5tp0_0Fz5DoYG_D632-8YbyGhFTQ64WNe50-5eLNgxKi4tksejp7Qd8Qm6coMt4WK_ft84xWheDeRAmajIWoI3v8fbvPJwSF636ZcvlxJBbFXVP5Tqeg04ZR52qOScg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBD5y2q6tUsoS38K_Y6rcdDxpaip3AS6cwbOaxTESHChYv_szqsXleoEaK3DdNFUcjpwjaaslqkqqdNKwkE6aYUFr_HTbanMz4q1D5N3GNQZvMd_ogrUv02UFVQ7gq_JplsIE-rI0tNpC1WOvzolcBEdi9b715Yn03kCPRCI5w6zv6Ue9Lkn-zt8vZaxMB27kDJdgoHDB0Rvn40rp6DF6NhHNLeFh4Oykrt9DpJ8xfbakyjDcsl6FRgV21KDqBfIbAO70n7Bvv5Y1s',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCXuQvJSfEv9gNKzaXJQLH7Ny1S_yjQoCijfpZT1JiJ7R7akdUzstn1BEyefd_IdUUEYVBgkEgbB_lXcLU3IhBFuikodADxacyg6jvD4YC8Lq1wWcvTZn11WvS0xAJONaRlRP7fj6gxWjbSGA3mSI_AMEApiZkHrQLtH3OvEcW44mr7xzUknYydtXG1Vr6901RZ0ND5WO502egaEwUXyJMJIq9_vD6qHtkU3pD99XEibnRmRNThi11e0Ld1Q54gaQCES5zl_i6l5Xw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB6YMTnATvjnHNlJcydXibOVrw74X2FReFkkVfDB-JMof5G9JJFXmZQ07N08_pX_9SJZJO2JPdQSHt8FvdX3Y13Rs9fn0ztNsv0htwrOcwFnKpbWXNjy4elM8PLH32ETfV_as1wF4ky72k295vFBfYDahHvre2XaRU5ijSnqj2Ye8wivhZnUwbS9bwGyomS9GC_kzf_M2pAWE78IvIH5OT7HPatzgjBolFnTwfAMwfj6-AGjQbMAZgCXcPzIbOi_jxSPL2LA8MZrcM',
];

const FALLBACK_LOST_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBdkBmLLZtuRp94glNF-n6cDuAccETDuR6BZGJH4WqXn9Ib8L5k_pr14eQd9sCZjEKGaGNv6714Ndvfg3whNGllwv4lF8xLT3hfiGB6LxsYGOll7EuEnIGOHGS7qXZEKmDw3KY5ZSaKh26pG-2mKZyOES1fz3fSnisNgFNHW8eCdtkJSIE9EjTknGGK5-LDMUjkjnifI3wxJkaHa5yrpM7kF0dqgBZmTsuwUo56huoR-yp6tbRWDMYnk1tU_7YpD-sCIpBHgqQBqCw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDLyZUi_pWEBMnr9PFs3gG5h3kssKNrU6p7qoAuMux0yu_q3e5yL6CvjwxoCzMnGo6nOSZK4ELefgefuwQc_YTz-pxQD-ia_6c8pKEEps6ZCI9yRABxpk8KAEBf1pwpb6XEjmigxFWK8oroQpJeE-88Ou0HTnd6Sb8Twb450zSnVH2juVNQXkqWY0Cvwmu1i-bmH9uAxwNO9DPoiJVTijbFmK4zk1RwcNT7URZ9Su_O3Lav0AMMzp0KAZ5a7jVOOAK3JmD6Ap2AWP4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAyPCIKnhFy7Ebze_9ukM6g2HrMe7eqCaseUjzkZQudAVfErjYvM1IKuvxzQPftvctArzhpBV-HvZB649WmvJPcPDwIuIhI4-3OX0MndYgL3mlXeCczvPe26hcgbxpl76ICiLr_XGGdJ3PAkrSEiuyt1i5fcbKLqp7nIk8O5r9nQm-K6k1nj7zQMMOPfAOIMj_2JkdwVK9tTl1-5R10sDtlNrqB2hZY8iBsv398T11G2tD_AyEKkuLlVoiSXsCQzPWCooFeqvDIOX4',
];

const HIGHLIGHTS = [
  ['Verify your Student Email', 'Join a safe, exclusive ecosystem only for your university peers.'],
  ['Snap & Stash', 'Take a photo of items to sell or report lost belongings in seconds.'],
  ['Meet On-Campus', 'Complete transactions at designated safe zones across campus.'],
];

function formatPrice(item) {
  if (item.itemType !== 'sale' || item.price === null || item.price === undefined || item.price === '') {
    return 'Campus item';
  }

  return `$${Number(item.price).toFixed(Number.isInteger(Number(item.price)) ? 0 : 2)}`;
}

function getListingMeta(item) {
  if (item.itemType === 'lost') {
    return item.lostLocation || 'Location unknown';
  }

  if (item.itemType === 'found') {
    return item.foundLocation || 'Location unknown';
  }

  return item.deliveryLocation || item.category || 'Campus pickup';
}

function getConditionLabel(item) {
  if (item.itemType !== 'sale') {
    return item.itemType === 'lost' ? 'Lost Item' : 'Found Item';
  }

  const condition = String(item.itemCondition || '').trim();
  if (!condition) {
    return 'Campus Pick';
  }

  return condition.replace(/\b\w/g, (char) => char.toUpperCase());
}

function timeAgo(isoDate) {
  if (!isoDate) {
    return 'Last seen recently';
  }

  const createdAt = new Date(isoDate);
  const diffMs = Date.now() - createdAt.getTime();

  if (Number.isNaN(diffMs)) {
    return 'Last seen recently';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    return 'Last seen just now';
  }

  if (diffHours < 24) {
    return `Last seen ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `Last seen ${diffDays}d ago`;
  }

  return `Last seen ${createdAt.toLocaleDateString()}`;
}

export default function LandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [featuredListings, setFeaturedListings] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [lostReports, setLostReports] = useState([]);
  const [loadingLost, setLoadingLost] = useState(true);
  const [lostError, setLostError] = useState('');

  const featuredFallbackImages = useMemo(() => FALLBACK_FEATURED_IMAGES, []);
  const lostFallbackImages = useMemo(() => FALLBACK_LOST_IMAGES, []);

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-background font-body text-on-background min-h-screen';

    return () => {
      document.body.className = previousBodyClass;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadFeaturedListings = async () => {
      setLoadingFeatured(true);
      setFeaturedError('');

      try {
        const response = await getItems({ itemType: 'sale', sort: 'recent', limit: 4 });

        if (!active) {
          return;
        }

        setFeaturedListings(response.data.items || []);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setFeaturedError(getApiErrorMessage(requestError, 'Unable to load featured listings'));
      } finally {
        if (active) {
          setLoadingFeatured(false);
        }
      }
    };

    loadFeaturedListings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadLostReports = async () => {
      setLoadingLost(true);
      setLostError('');

      try {
        const response = await getItems({ itemType: 'lost', sort: 'recent', limit: 3 });

        if (!active) {
          return;
        }

        setLostReports(response.data.items || []);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setLostError(getApiErrorMessage(requestError, 'Unable to load lost reports'));
      } finally {
        if (active) {
          setLoadingLost(false);
        }
      }
    };

    loadLostReports();

    return () => {
      active = false;
    };
  }, []);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background page-enter">
      <MainNavbar user={user} onLogout={onLogout} />

      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-on-primary-fixed-variant">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '\'FILL\' 1' }}>
                  school
                </span>
                Exclusive to University Life
              </div>
              <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-on-surface md:text-6xl lg:text-7xl">
                Buy, Sell, and Find{' '}
                <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                  Everything
                </span>{' '}
                for Campus.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant md:text-xl">
                The curated marketplace built for students. From textbook swaps to recovering your lost keys, CampusStash
                is your academic lifecycle partner.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/marketplace')}
                  className="hero-gradient whisper-shadow inline-flex items-center gap-2 rounded-md px-8 py-4 text-lg font-bold text-on-primary transition-transform active:scale-95"
                >
                  Start Browsing
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/create-entry', { state: { mode: 'sale' } })}
                  className="rounded-md bg-surface-container-high px-8 py-4 text-lg font-bold text-primary transition-colors hover:bg-surface-container-highest"
                >
                  List an Item
                </button>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="whisper-shadow aspect-square rotate-3 rounded-3xl bg-surface-container-low p-4">
                <img alt="Students collaborating" className="h-full w-full rounded-2xl object-cover" src={HERO_IMAGE_URL} />
              </div>
              <div className="absolute -bottom-6 -left-6 flex max-w-xs items-center gap-4 rounded-2xl bg-white p-4 animate-bounce whisper-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed">
                  <span
                    className="material-symbols-outlined text-on-tertiary-fixed"
                    style={{ fontVariationSettings: '\'FILL\' 1' }}
                  >
                    verified
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Verified Students Only</p>
                  <p className="text-xs text-on-surface-variant">Secure campus network</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2">
            <div className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-xl bg-primary-container p-8">
              <img
                alt="Textbooks and gadgets"
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-110"
                src={MARKETPLACE_CARD_IMAGE}
              />
              <div className="relative z-10">
                <h2 className="mb-2 text-3xl font-bold text-white">Marketplace</h2>
                <p className="mb-6 max-w-xs text-on-primary-container">
                  Deals on gear, books, and dorm essentials from peers you can trust.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/marketplace')}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-bold text-primary"
                >
                  Explore Shop
                  <span className="material-symbols-outlined text-sm">shopping_bag</span>
                </button>
              </div>
            </div>

            <div className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-xl bg-secondary-container p-8">
              <img
                alt="Lost keys on a park bench"
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-110"
                src={LOST_FOUND_CARD_IMAGE}
              />
              <div className="relative z-10">
                <h2 className="mb-2 text-3xl font-bold text-white">Lost &amp; Found</h2>
                <p className="mb-6 max-w-xs text-on-secondary-container">
                  Reuniting students with their essentials. Search reports or file a new one.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/create-entry', { state: { mode: 'lost' } })}
                  className="inline-flex items-center gap-2 rounded-md bg-tertiary-fixed px-6 py-3 text-sm font-bold text-on-tertiary-fixed"
                >
                  Found Something?
                  <span className="material-symbols-outlined text-sm">search_check</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Fresh Picks</span>
                <h2 className="text-4xl font-extrabold text-on-surface">Featured Listings</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="flex items-center gap-2 font-bold text-primary hover:underline"
              >
                View all items
                <span className="material-symbols-outlined">arrow_right_alt</span>
              </button>
            </div>

            {featuredError ? (
              <div className="mb-6 rounded-2xl border border-error/20 bg-error/5 p-5 text-sm font-medium text-error">
                {featuredError}
              </div>
            ) : null}

            {loadingFeatured ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-lg bg-surface-container-high" />
                ))}
              </div>
            ) : featuredListings.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredListings.map((item, index) => {
                  const imageUrl = item.images?.[0]?.url || featuredFallbackImages[index % featuredFallbackImages.length];

                  return (
                    <article key={item._id} className="group overflow-hidden rounded-lg bg-surface-container-lowest whisper-shadow">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={imageUrl}
                        />
                        <span className="absolute right-3 top-3 rounded bg-surface-container-lowest/90 px-2 py-1 text-[10px] font-bold uppercase text-on-surface">
                          {getConditionLabel(item)}
                        </span>
                      </div>
                      <div className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-on-surface">{item.title}</h3>
                          <span className="font-bold text-primary">{formatPrice(item)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {getListingMeta(item)}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/marketplace')}
                          className="w-full rounded bg-surface-container-high py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                        >
                          Contact Seller
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl bg-surface-container-lowest p-12 text-center shadow-sm">
                <h3 className="text-2xl font-bold text-on-surface">No featured listings yet</h3>
                <p className="mt-2 text-sm text-on-surface-variant">Check back soon or post the first listing.</p>
              </div>
            )}
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Help Reunite</span>
                <h2 className="text-4xl font-extrabold text-on-surface">Recent Lost Reports</h2>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/marketplace?state=lost')}
                  className="rounded-full border border-outline-variant px-6 py-2 text-sm font-semibold hover:bg-surface-container-low"
                >
                  All Reports
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/create-entry', { state: { mode: 'lost' } })}
                  className="rounded-full bg-secondary px-6 py-2 text-sm font-semibold text-white whisper-shadow"
                >
                  I Lost Something
                </button>
              </div>
            </div>

            {lostError ? (
              <div className="mb-6 rounded-2xl border border-error/20 bg-error/5 p-5 text-sm font-medium text-error">
                {lostError}
              </div>
            ) : null}

            {loadingLost ? (
              <div className="grid gap-8 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl bg-surface-container-low" />
                ))}
              </div>
            ) : lostReports.length ? (
              <div className="grid gap-8 lg:grid-cols-3">
                {lostReports.map((item, index) => {
                  const imageUrl = item.images?.[0]?.url || lostFallbackImages[index % lostFallbackImages.length];

                  return (
                    <div
                      key={item._id}
                      className="flex gap-4 rounded-xl border border-outline-variant/20 bg-surface p-4 transition-colors hover:border-secondary"
                    >
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                        <img alt={item.title} className="h-full w-full object-cover" src={imageUrl} />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-secondary-container">
                            Lost Item
                          </span>
                          <h3 className="mt-1 text-lg font-bold text-on-surface">{item.title}</h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                        <p className="flex items-center gap-1 text-sm font-semibold text-secondary">
                          <span className="material-symbols-outlined text-sm">place</span>
                          {item.lostLocation || 'Location unknown'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl bg-surface-container-lowest p-12 text-center shadow-sm">
                <h3 className="text-2xl font-bold text-on-surface">No recent lost reports</h3>
                <p className="mt-2 text-sm text-on-surface-variant">If you lost something, submit a report.</p>
              </div>
            )}
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary py-24 text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
            <div className="relative z-10 space-y-8">
              <h2 className="text-5xl font-extrabold leading-tight">Specifically Curated for Campus Living.</h2>
              <div className="space-y-6">
                {HIGHLIGHTS.map(([title, copy], index) => (
                  <div key={title} className="flex gap-6">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-tertiary-fixed font-bold text-tertiary-fixed">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="mb-1 text-xl font-bold">{title}</h3>
                      <p className="text-primary-fixed-dim">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rotate-2 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl whisper-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="h-10 w-10 rounded-full bg-tertiary-fixed" />
                    <div>
                      <p className="font-bold">Chat with Sarah</p>
                      <p className="text-xs text-white/60">Chemistry Student</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="max-w-[80%] rounded-lg rounded-tl-none bg-white/5 p-3">
                      <p className="text-sm italic">"Is the Calculus book still available?"</p>
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-tertiary-fixed/20 p-3">
                      <p className="text-sm font-semibold">"Yes! Want to meet at the Student Union at 3 PM?"</p>
                    </div>
                    <div className="max-w-[80%] rounded-lg rounded-tl-none bg-white/5 p-3">
                      <p className="text-sm italic">"Perfect. See you there!"</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 text-xs text-white/40">
                    <span>Safe Exchange Zone: Student Union</span>
                    <span className="material-symbols-outlined text-sm">lock</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-tertiary-fixed opacity-10 blur-3xl" />
            </div>
          </div>
        </section>
      </main>

      <MainFooter />

      <button
        type="button"
        onClick={() => navigate('/create-entry')}
        className="group fixed bottom-8 right-8 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed whisper-shadow transition-transform hover:scale-110 active:scale-95"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: '\'FILL\' 1' }}>
          add
        </span>
        <span className="pointer-events-none absolute right-20 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
          New Listing / Report
        </span>
      </button>
    </div>
  );
}
