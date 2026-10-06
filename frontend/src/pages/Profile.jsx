import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShieldCheck,
  Users,
  Star,
  BarChart3,
  User,
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Youtube,
  Instagram,
  Send,
  Link2,
  AlertTriangle,
  X as XIcon,
  Sparkles,
  BadgeCheck,
  ExternalLink,
  LineChart,
} from 'lucide-react';
import Seo from '../components/shared/Seo.jsx';
import AvatarCropper from '../components/profile/AvatarCropper.jsx';
import { updateProfile } from '../redux/slices/authSlice.js';
import { getUserCookie } from '../utils/cookies.js';
import { countryOptions, flagEmoji, supportsFlags } from '../utils/countries.js';
import { trackEvent } from '../utils/analytics.js';
import {
  getMyProfile,
  updateMyProfile,
  applyForVerifiedTrader,
} from '../controllers/userProfileController.js';

// /profile: a member's own profile and their Verified Trader application, laid
// out from Sahil's design (3 Oct 2026). Sections 1, 3 and 4 save through
// PATCH /api/user/me; section 5 posts the proof documents to
// /api/user/verified-trader/apply. Profile type, years of experience, primary
// markets and the Telegram/TikTok links need backend fields (deliverables
// B26); they appear automatically once GET /api/user/me returns `profileType`.

const STATUS_LABELS = {
  none: 'Not applied',
  invited: 'Invited to apply',
  pending: 'Under review',
  scheduled: 'Call scheduled',
  approved: 'Verified trader',
  rejected: 'Not approved',
};

const BIO_MAX = 300;
const FILE_MAX_MB = 10;
const FILES_MAX = 5; // per document type, the backend's limit

// Proof documents. Excel/CSV were asked for by Sahil (5 Oct 2026); they stay
// off until the backend's upload filter accepts them (deliverable B26), since
// it rejects the whole application with "invalid mime type" otherwise. Switch
// on with the build flag VITE_PROOF_EXCEL=on.
const EXCEL_PROOFS = import.meta.env.VITE_PROOF_EXCEL === 'on';
const PROOF_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', ...(EXCEL_PROOFS ? ['xls', 'xlsx', 'csv'] : [])];
const PROOF_ACCEPT = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  ...(EXCEL_PROOFS
    ? [
        '.xls',
        '.xlsx',
        '.csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ]
    : []),
].join(',');
const PROOF_TYPES_LABEL = EXCEL_PROOFS ? 'PDF, Excel, CSV, JPG or PNG' : 'PDF, JPG or PNG';
const isProofTypeAllowed = (file) =>
  PROOF_EXTENSIONS.includes(String(file.name || '').split('.').pop().toLowerCase());
const AVATAR_MAX_MB = 20; // before cropping; the cropped file is ~50 KB

const YEARS = [
  { value: '', label: 'Select…' },
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-2', label: '1–2 years' },
  { value: '2-5', label: '2–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10+', label: '10+ years' },
];
const MARKETS = ['Forex', 'Gold & Metals', 'Indices', 'Crypto', 'Stocks', 'Commodities'];

const INPUT =
  'w-full rounded-lg border border-white/10 bg-[#0b1220] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 ' +
  'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid=true]:border-red-500/70';


const normaliseUrl = (v) => {
  const s = String(v || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};
const looksLikeUrl = (v) => !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v);
// A public Myfxbook account page: https://www.myfxbook.com/members/<user>/<system>/<accountId>
const isMyfxbookAccountUrl = (v) =>
  !v || /^https?:\/\/(?:www\.)?myfxbook\.com\/members\/[^/\s]+\/[^/\s]+\/\d+/i.test(v);
const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

function XLogo(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />
    </svg>
  );
}
function TikTokLogo(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12V9.77a5.7 5.7 0 0 0-.78-.05 5.68 5.68 0 1 0 5.68 5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

// ---------- layout pieces ----------

function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1528] to-[#0a0f1d] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function StepHeader({ n, id, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.45)]"
      >
        {n}
      </span>
      <div>
        <h2 id={id} className="text-lg font-semibold text-white">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ id, label, required, optional, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-200">
        {label}
        {required && (
          <span className="ml-0.5 text-red-400" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="ml-1 font-normal text-gray-500">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function SideCard({ icon: Icon, title, children }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
          <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function ShieldArt() {
  return (
    <div className="relative mx-auto w-56 sm:w-64" aria-hidden="true">
      <svg viewBox="0 0 260 230" className="w-full">
        <defs>
          <radialGradient id="vt-glow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#1D4ED8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vt-hex" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="55%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id="vt-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#0B1736" />
          </linearGradient>
        </defs>
        <circle cx="130" cy="100" r="110" fill="url(#vt-glow)" />
        <ellipse cx="130" cy="170" rx="105" ry="22" fill="none" stroke="#3B82F6" strokeOpacity="0.45" strokeWidth="2" />
        <ellipse cx="130" cy="170" rx="78" ry="14" fill="none" stroke="#60A5FA" strokeOpacity="0.3" strokeWidth="1.5" />
        <path d="M130 18 L198 56 L198 128 L130 168 L62 128 L62 56 Z" fill="url(#vt-hex)" />
        <path d="M130 36 L182 65 L182 120 L130 150 L78 120 L78 65 Z" fill="url(#vt-inner)" stroke="#93C5FD" strokeOpacity="0.5" strokeWidth="2" />
        <path d="M104 94 L123 113 L158 76" fill="none" stroke="#DBEAFE" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="38" cy="60" r="3" fill="#60A5FA" />
        <circle cx="226" cy="44" r="4" fill="#93C5FD" />
        <circle cx="220" cy="140" r="2.5" fill="#60A5FA" />
      </svg>
      <div className="-mt-6 flex justify-center">
        <span className="rounded-lg border border-blue-400/40 bg-[#0b1736]/90 px-5 py-1.5 text-xs font-semibold tracking-[0.3em] text-blue-200">
          VERIFIED TRADER
        </span>
      </div>
    </div>
  );
}

function FilePicker({ id, icon: Icon, title, description, optional, files, onAdd, onRemove, error }) {
  return (
    <div
      className={`rounded-xl border bg-[#0b1220] p-4 ${error ? 'border-red-500/60' : 'border-white/10'}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p id={`${id}-label`} className="text-sm font-semibold text-white">
            {title}
            {optional && <span className="ml-1 font-normal text-gray-500">(optional)</span>}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{description}</p>
          <label
            className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 focus-within:ring-2 focus-within:ring-blue-500"
          >
            <input
              id={id}
              type="file"
              multiple
              accept={PROOF_ACCEPT}
              className="sr-only"
              aria-labelledby={`${id}-label`}
              aria-describedby={error ? `${id}-error` : `${id}-hint`}
              onChange={(e) => {
                onAdd(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
            Choose files
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-xs text-gray-200">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-white"
                    aria-label={`Remove ${f.name}`}
                  >
                    <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p id={`${id}-hint`} className="mt-2 text-[11px] text-gray-500">
            {PROOF_TYPES_LABEL} · max {FILE_MAX_MB} MB each · up to {FILES_MAX} files
          </p>
          {error && (
            <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- page ----------

const EMPTY_LINKS = { youtube: '', twitter: '', instagram: '', website: '', telegram: '', tiktok: '', myfxbook: '' };

function countryCode(value) {
  if (!value) return 'IN';
  const all = countryOptions();
  if (all.some((c) => c.code === value)) return value;
  const byName = all.find((c) => c.name.toLowerCase() === String(value).toLowerCase());
  return byName ? byName.code : 'IN';
}

function formFromProfile(data = {}) {
  return {
    fullName: data.fullName || '',
    country: countryCode(data.country),
    bio: data.bio || '',
    tradingStyles: (data.tradingStyles || []).join(', '),
    tradesWith: (data.tradesWith || []).join(', '),
    profileImage: data.profileImage || '',
    profileType: data.profileType || 'trader',
    yearsOfExperience: data.yearsOfExperience || '',
    primaryMarkets: data.primaryMarkets || [],
    socialLinks: { ...EMPTY_LINKS, ...(data.socialLinks || {}) },
  };
}

export default function Profile() {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie() || {};
  const countries = React.useMemo(() => countryOptions(), []);
  const showFlags = React.useMemo(() => supportsFlags(), []);

  const [form, setForm] = React.useState(() =>
    formFromProfile({ fullName: user.fullName || user.name, country: user.country, bio: user.bio, profileImage: user.profileImage || user.avatar }),
  );
  const [extrasLive, setExtrasLive] = React.useState(false);
  // The Myfxbook link (Sahil, 6 Oct 2026: traders connect their account; the
  // free first step is their public Myfxbook page) needs backend support
  // (deliverable B23). The field appears once GET /api/user/me returns a
  // `socialLinks.myfxbook` key, like the B26 fields.
  const [myfxbookLive, setMyfxbookLive] = React.useState(false);
  const [verification, setVerification] = React.useState(null);
  const [profileId, setProfileId] = React.useState(user.id || user._id || '');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(''); // '', 'save', 'apply'
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [brokerStatements, setBrokerStatements] = React.useState([]);
  const [payoutProofs, setPayoutProofs] = React.useState([]);
  const [cropSource, setCropSource] = React.useState(null); // original File being cropped
  const [avatarFile, setAvatarFile] = React.useState(null);
  const [avatarOriginal, setAvatarOriginal] = React.useState(null); // uncropped, for re-adjusting
  const [avatarPreview, setAvatarPreview] = React.useState('');
  const statusRef = React.useRef(null);

  React.useEffect(() => () => avatarPreview && URL.revokeObjectURL(avatarPreview), [avatarPreview]);

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyProfile();
        setForm(formFromProfile(data));
        setExtrasLive(Object.prototype.hasOwnProperty.call(data || {}, 'profileType'));
        setMyfxbookLive(Object.prototype.hasOwnProperty.call(data?.socialLinks || {}, 'myfxbook'));
        setVerification(data.verifiedTrader || null);
        if (data.id) setProfileId(data.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your profile from the server. Showing saved session details.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const status = verification?.status || 'none';
  const canApply = ['none', 'invited', 'rejected'].includes(status);
  const step = status === 'approved' ? 4 : ['pending', 'scheduled'].includes(status) ? 2 : 1;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setLink = (key) => (e) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }));
  const toggleMarket = (m) =>
    setForm((f) => ({
      ...f,
      primaryMarkets: f.primaryMarkets.includes(m) ? f.primaryMarkets.filter((x) => x !== m) : [...f.primaryMarkets, m],
    }));

  function onAvatarChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((x) => ({ ...x, avatar: 'Choose an image file (JPG or PNG).' }));
      return;
    }
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      setErrors((x) => ({ ...x, avatar: `That photo is over ${AVATAR_MAX_MB} MB. Choose a smaller one.` }));
      return;
    }
    setErrors((x) => ({ ...x, avatar: undefined }));
    setCropSource(file);
  }

  function addFiles(setter, current, key) {
    return (incoming) => {
      // The picker's `accept` is only a hint (drag-and-drop and "All files"
      // bypass it), and one unsupported file makes the backend reject the
      // whole application, so check the type here too.
      const wrongType = incoming.filter((f) => !isProofTypeAllowed(f));
      const typed = incoming.filter(isProofTypeAllowed);
      const tooBig = typed.filter((f) => f.size > FILE_MAX_MB * 1024 * 1024);
      const ok = typed.filter((f) => f.size <= FILE_MAX_MB * 1024 * 1024);
      const next = [...current, ...ok].slice(0, FILES_MAX);
      setter(next);
      let msg;
      if (wrongType.length) msg = `${wrongType.map((f) => f.name).join(', ')}: only ${PROOF_TYPES_LABEL} files are accepted.`;
      else if (tooBig.length) msg = `${tooBig.map((f) => f.name).join(', ')} ${tooBig.length > 1 ? 'are' : 'is'} over ${FILE_MAX_MB} MB.`;
      else if (current.length + ok.length > FILES_MAX) msg = `Up to ${FILES_MAX} files; the extra ones were left out.`;
      setErrors((x) => ({ ...x, [key]: msg }));
    };
  }

  function validate(forApplication) {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.';
    if (forApplication) {
      if (!form.country) next.country = 'Choose your country.';
      if (!list(form.tradingStyles).length) next.tradingStyles = 'Add at least one trading style, e.g. Scalper.';
      if (!list(form.tradesWith).length) next.tradesWith = 'Add at least one broker or prop firm you trade with.';
      if (!brokerStatements.length) next.brokerStatements = 'Upload at least one broker statement.';
    }
    Object.entries(form.socialLinks).forEach(([k, v]) => {
      if (!looksLikeUrl(normaliseUrl(v))) next[`link_${k}`] = 'Enter a full link, e.g. https://…';
    });
    if (myfxbookLive && !next.link_myfxbook && !isMyfxbookAccountUrl(normaliseUrl(form.socialLinks.myfxbook))) {
      next.link_myfxbook = 'Paste your public Myfxbook account link, e.g. https://www.myfxbook.com/members/name/system/1234567';
    }
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      const el = document.getElementById(first.startsWith('link_') ? `link-${first.slice(5)}` : `pf-${first}`);
      el?.focus();
    }
    return !first;
  }

  function payload() {
    const links = Object.fromEntries(
      Object.entries(form.socialLinks)
        .filter(([k]) => extrasLive || !['telegram', 'tiktok'].includes(k))
        .filter(([k]) => myfxbookLive || k !== 'myfxbook')
        .map(([k, v]) => [k, normaliseUrl(v)]),
    );
    const body = {
      fullName: form.fullName.trim(),
      country: form.country,
      bio: form.bio.slice(0, BIO_MAX),
      tradingStyles: form.tradingStyles,
      tradesWith: form.tradesWith,
      socialLinks: links,
    };
    if (extrasLive) {
      body.profileType = form.profileType;
      body.yearsOfExperience = form.yearsOfExperience;
      body.primaryMarkets = form.primaryMarkets;
    }
    return body;
  }

  async function saveProfile() {
    const { data } = await updateMyProfile(payload(), avatarFile);
    setForm(formFromProfile(data));
    setVerification(data.verifiedTrader || verification);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview('');
    setAvatarFile(null);
    setAvatarOriginal(null);
    dispatch(
      updateProfile({
        ...user,
        fullName: data.fullName,
        name: data.fullName,
        country: data.country,
        bio: data.bio,
        avatar: data.profileImage,
        profileImage: data.profileImage,
      }),
    );
    return data;
  }

  function announce(msg, isError = false) {
    if (isError) {
      setError(msg);
      setMessage('');
    } else {
      setMessage(msg);
      setError('');
    }
    requestAnimationFrame(() => statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  async function onSave(e) {
    e?.preventDefault();
    if (!validate(false)) return;
    setBusy('save');
    try {
      await saveProfile();
      announce('Profile saved.');
    } catch (err) {
      announce(err.response?.data?.message || 'Could not save your profile. Please try again.', true);
    } finally {
      setBusy('');
    }
  }

  async function onApply(e) {
    e.preventDefault();
    if (!validate(true)) return;
    setBusy('apply');
    let saved = false;
    try {
      await saveProfile();
      saved = true;
      const { data } = await applyForVerifiedTrader({ applicationNote: '', brokerStatements, payoutProofs });
      setVerification(data.verifiedTrader || null);
      trackEvent('verified_trader_apply', { profile_type: form.profileType });
      setBrokerStatements([]);
      setPayoutProofs([]);
      announce('Application submitted. Our team will review your documents and contact you to schedule a short call.');
    } catch (err) {
      const reason = err.response?.data?.message || 'Please try again.';
      announce(saved ? `Your profile was saved, but the application wasn't sent: ${reason}` : `Could not submit: ${reason}`, true);
    } finally {
      setBusy('');
    }
  }

  const invalid = (key) => (errors[key] ? { 'aria-invalid': true, 'aria-describedby': `pf-${key}-error` } : {});
  const avatarSrc = avatarPreview || form.profileImage;

  const heading =
    status === 'approved' ? (
      <>
        You&rsquo;re a <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">Verified</span> Trader
      </>
    ) : ['pending', 'scheduled'].includes(status) ? (
      <>
        Your application is <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">in review</span>
      </>
    ) : (
      <>
        Apply for <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">Verified</span>
        <br className="hidden sm:block" /> Trader Badge
      </>
    );

  return (
    <div className="bg-black text-white">
      <Seo title="Your Profile" description="Manage your XK Trading Floor profile and apply for the Verified Trader badge." path="/profile" noindex />

      {cropSource && (
        <AvatarCropper
          file={cropSource}
          onCancel={() => setCropSource(null)}
          onDone={(file) => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
            setAvatarFile(file);
            setAvatarOriginal(cropSource);
            setAvatarPreview(URL.createObjectURL(file));
            setCropSource(null);
          }}
        />
      )}

      {/* hero */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(37,99,235,0.18),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8 lg:py-14">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-blue-400">VERIFY YOUR TRADING JOURNEY</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{heading}</h1>
            <p className="mt-4 max-w-2xl text-base text-gray-300">
              {status === 'approved'
                ? 'Keep your profile up to date: it is what other traders see on your public Verified Trader profile.'
                : 'Get recognised as a genuine trader on XK Trading Floor. Share your trading profile, link your socials and showcase your trading journey with our community.'}
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-7">
              {[
                [ShieldCheck, 'Build Trust', 'Verified identity'],
                [Users, 'More Visibility', 'Stand out in the community'],
                [Star, 'Exclusive Access', 'Invites to XK events'],
                [BarChart3, 'Grow Your Network', 'Connect with traders'],
              ].map(([Icon, t, s]) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{t}</span>
                    <span className="block text-xs text-gray-400">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden lg:block">
            <ShieldArt />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div>
          <div ref={statusRef} aria-live="polite">
            {message && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {message}
              </div>
            )}
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}
          </div>

          {loading ? (
            <Card>
              <p className="text-sm text-gray-400">Loading your profile…</p>
            </Card>
          ) : (
            <form onSubmit={canApply ? onApply : onSave} noValidate className="space-y-6">
              {/* 1 */}
              <Card>
                <StepHeader n={1} id="sec-account" title="Account Information" subtitle="Basic details about you and your trading background." />
                <div className="mb-5 flex items-center gap-4">
                  <div className="relative">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Your profile photo" className="h-20 w-20 rounded-full border border-white/10 object-cover" />
                    ) : (
                      <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                        <User className="h-8 w-8 text-gray-500" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 focus-within:ring-2 focus-within:ring-blue-500">
                      <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChosen} aria-describedby="pf-avatar-hint" />
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      {avatarSrc ? 'Change photo' : 'Upload photo'}
                    </label>
                    {avatarOriginal && avatarFile && (
                      <button type="button" onClick={() => setCropSource(avatarOriginal)} className="ml-2 text-sm text-blue-400 hover:text-blue-300">
                        Adjust
                      </button>
                    )}
                    <p id="pf-avatar-hint" className={`mt-1.5 text-xs ${errors.avatar ? 'text-red-400' : 'text-gray-500'}`}>
                      {errors.avatar || (avatarFile ? 'New photo ready. It is saved with your profile.' : 'You can drag and zoom your photo to fit.')}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="pf-fullName" label="Full Name" required error={errors.fullName}>
                    <input id="pf-fullName" className={INPUT} autoComplete="name" value={form.fullName} onChange={set('fullName')} maxLength={120} {...invalid('fullName')} />
                  </Field>
                  <Field id="pf-country" label="Country" required error={errors.country}>
                    <select id="pf-country" className={INPUT} autoComplete="country" value={form.country} onChange={set('country')} {...invalid('country')}>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {showFlags ? `${flagEmoji(c.code)}  ` : ''}
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="pf-bio" label="Bio" optional className="sm:col-span-2">
                    <textarea
                      id="pf-bio"
                      className={`${INPUT} min-h-[96px] resize-y`}
                      rows={3}
                      maxLength={BIO_MAX}
                      value={form.bio}
                      onChange={set('bio')}
                      placeholder="Tell us about yourself, your trading journey, experience, and what you trade…"
                      aria-describedby="pf-bio-count"
                    />
                    <p id="pf-bio-count" className="mt-1 text-right text-xs text-gray-500">
                      {form.bio.length}/{BIO_MAX}
                    </p>
                  </Field>
                </div>
              </Card>

              {/* 2 */}
              {extrasLive && (
                <Card>
                  <fieldset>
                    <legend className="w-full">
                      <StepHeader n={2} id="sec-type" title="Profile Type" subtitle="Select the option that best describes you." />
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ['trader', BarChart3, 'Trader', "I am a trader who wants to verify my trading profile. I don't have social media or prefer not to share."],
                        ['trader_influencer', Users, 'Trader & Influencer', 'I am a trader and I also create content on social media (YouTube, Instagram, TikTok, etc.).'],
                      ].map(([value, Icon, title, text]) => {
                        const on = form.profileType === value;
                        return (
                          <label
                            key={value}
                            className={`relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${
                              on ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_24px_rgba(37,99,235,0.25)]' : 'border-white/10 bg-[#0b1220] hover:border-white/20'
                            }`}
                          >
                            <input type="radio" name="profileType" value={value} checked={on} onChange={set('profileType')} className="mt-1 h-4 w-4 accent-blue-500" />
                            <span>
                              <span className="flex items-center gap-2 font-semibold text-white">
                                <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                {title}
                              </span>
                              <span className="mt-1 block text-sm text-gray-400">{text}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </Card>
              )}

              {/* 3 */}
              <Card>
                <StepHeader n={extrasLive ? 3 : 2} id="sec-trading" title="Trading Details" subtitle="Tell us about your trading activity." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="pf-tradingStyles" label="Trading styles" required={canApply} error={errors.tradingStyles} hint="Separate with commas">
                    <input id="pf-tradingStyles" className={INPUT} value={form.tradingStyles} onChange={set('tradingStyles')} placeholder="Scalper, Intraday, Swing" {...invalid('tradingStyles')} />
                  </Field>
                  <Field id="pf-tradesWith" label="Trades with" required={canApply} error={errors.tradesWith} hint="Brokers or prop firms, separated with commas">
                    <input id="pf-tradesWith" className={INPUT} value={form.tradesWith} onChange={set('tradesWith')} placeholder="EC Market, FundingPips, FTMO" {...invalid('tradesWith')} />
                  </Field>
                  {extrasLive && (
                    <>
                      <Field id="pf-years" label="Years of trading experience">
                        <select id="pf-years" className={INPUT} value={form.yearsOfExperience} onChange={set('yearsOfExperience')}>
                          {YEARS.map((y) => (
                            <option key={y.value} value={y.value}>
                              {y.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <fieldset>
                        <legend className="mb-1.5 block text-sm font-medium text-gray-200">Primary markets</legend>
                        <div className="flex flex-wrap gap-2">
                          {MARKETS.map((m) => {
                            const on = form.primaryMarkets.includes(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggleMarket(m)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  on ? 'border-blue-500 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-[#0b1220] text-gray-300 hover:border-white/20'
                                }`}
                              >
                                {m}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    </>
                  )}
                </div>
              </Card>

              {/* 4 */}
              <Card>
                <StepHeader
                  n={extrasLive ? 4 : 3}
                  id="sec-social"
                  title="Social Media Links (Optional)"
                  subtitle="Add your social media profiles if you create trading content."
                />
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {[
                    ['youtube', 'YouTube', Youtube, 'bg-red-600', 'https://youtube.com/@yourchannel'],
                    ['twitter', 'X (Twitter)', XLogo, 'bg-white/10', 'https://x.com/yourusername'],
                    ['instagram', 'Instagram', Instagram, 'bg-gradient-to-br from-yellow-500 via-pink-600 to-purple-700', 'https://instagram.com/yourusername'],
                    ...(extrasLive
                      ? [
                          ['telegram', 'Telegram', Send, 'bg-sky-500', 'https://t.me/yourusername'],
                          ['tiktok', 'TikTok', TikTokLogo, 'bg-black border border-white/15', 'https://tiktok.com/@yourusername'],
                        ]
                      : []),
                    ['website', 'Other (e.g. Facebook, LinkedIn, website)', Link2, 'bg-white/10', 'https://'],
                    ...(myfxbookLive
                      ? [['myfxbook', 'Myfxbook (verified trading results)', LineChart, 'bg-emerald-600', 'https://www.myfxbook.com/members/…']]
                      : []),
                  ].map(([key, label, Icon, tint, ph]) => (
                    <div key={key} className="flex items-start gap-3">
                      <span className={`mt-6 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white ${tint}`} aria-hidden="true">
                        <Icon className="h-5 w-5" />
                      </span>
                      <Field id={`link-${key}`} label={label} error={errors[`link_${key}`]} className="min-w-0 flex-1">
                        <input
                          id={`link-${key}`}
                          type="url"
                          inputMode="url"
                          className={INPUT}
                          value={form.socialLinks[key] || ''}
                          onChange={setLink(key)}
                          placeholder={ph}
                          {...(errors[`link_${key}`] ? { 'aria-invalid': true, 'aria-describedby': `link-${key}-error` } : {})}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 5 */}
              <Card>
                <StepHeader
                  n={extrasLive ? 5 : 4}
                  id="sec-docs"
                  title="Verification Documents"
                  subtitle={canApply ? 'Upload your trading proof and supporting documents.' : 'Your Verified Trader application.'}
                />
                {canApply ? (
                  <>
                    {status === 'rejected' && verification?.rejectionReason && (
                      <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        Last time: {verification.rejectionReason}
                      </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FilePicker
                        id="pf-brokerStatements"
                        icon={FileText}
                        title="Broker Statements"
                        description="Statements that show your name and trading activity."
                        files={brokerStatements}
                        onAdd={addFiles(setBrokerStatements, brokerStatements, 'brokerStatements')}
                        onRemove={(i) => setBrokerStatements((f) => f.filter((_, j) => j !== i))}
                        error={errors.brokerStatements}
                      />
                      <FilePicker
                        id="pf-payoutProofs"
                        icon={ImageIcon}
                        title="Payout Proofs"
                        optional
                        description="Payout screenshots or withdrawal proofs."
                        files={payoutProofs}
                        onAdd={addFiles(setPayoutProofs, payoutProofs, 'payoutProofs')}
                        onRemove={(i) => setPayoutProofs((f) => f.filter((_, j) => j !== i))}
                        error={errors.payoutProofs}
                      />
                    </div>
                    <p className="mt-4 text-xs text-gray-500">Hide account numbers and other private details before uploading.</p>
                    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={onSave}
                        disabled={Boolean(busy)}
                        className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
                      >
                        {busy === 'save' ? 'Saving…' : 'Save profile only'}
                      </button>
                      <button
                        type="submit"
                        disabled={Boolean(busy)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(37,99,235,0.35)] hover:bg-blue-500 disabled:opacity-60"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {busy === 'apply' ? 'Submitting…' : 'Submit Application'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1220] p-4">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {status === 'approved' ? 'You are a Verified Trader' : status === 'scheduled' ? 'Verification call scheduled' : 'Application under review'}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-400">
                          {status === 'approved'
                            ? 'Your badge shows on your public profile.'
                            : status === 'scheduled' && verification?.scheduledCallAt
                              ? `Your call is on ${new Date(verification.scheduledCallAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.`
                              : 'Our team is checking your documents and will contact you to schedule a short call.'}
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="submit"
                        disabled={Boolean(busy)}
                        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                      >
                        {busy === 'save' ? 'Saving…' : 'Save Changes'}
                      </button>
                      {status === 'approved' && profileId && (
                        <Link to={`/users/${profileId}`} className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                          View your public profile <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </form>
          )}
        </div>

        {/* sidebar */}
        <aside className="space-y-6" aria-label="About the Verified Trader badge">
          <SideCard icon={BadgeCheck} title="Verification Benefits">
            <ul className="space-y-3">
              {[
                'Verified Trader badge on your profile',
                'Higher visibility in the community',
                'Invites to events XK organises',
                'Build trust with other traders',
                'Showcase your trading journey',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </SideCard>

          <SideCard icon={ShieldCheck} title="Application Process">
            <ol className="relative space-y-5">
              {[
                ['Submit Application', 'Fill in your details and upload documents.'],
                ['Review Process', 'Our team checks your documents and holds a short call with you.'],
                ['Get Verified', 'Receive your Verified Trader badge.'],
              ].map(([t, s], i) => {
                const n = i + 1;
                const done = step > n;
                const current = step === n;
                return (
                  <li key={t} className="flex gap-3" aria-current={current ? 'step' : undefined}>
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        done
                          ? 'border-green-500 bg-green-500/15 text-green-300'
                          : current
                            ? 'border-blue-500 bg-blue-500/15 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.4)]'
                            : 'border-white/15 text-gray-400'
                      }`}
                    >
                      {done ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Done:</span>
                        </>
                      ) : (
                        n
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-white">{t}</span>
                      <span className="block text-xs text-gray-400">{s}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </SideCard>

          <SideCard icon={Sparkles} title="Profile Examples">
            <div className="space-y-4">
              {[
                ['Regular Trader', 'Forex Trader · 3 years experience', 'Scalper, Swing · EC Market, FTMO', false],
                ['Trader & Influencer', 'Forex & Crypto · Content creator', '5 years experience · FundingPips', true],
              ].map(([title, l1, l2, socials]) => (
                <div key={title} className="flex gap-3 rounded-xl border border-white/10 bg-[#0b1220] p-3.5">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/20">
                    <User className="h-6 w-6 text-blue-200" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                      {title}
                      <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-amber-200">
                        Example
                      </span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-300">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified Trader
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{l1}</p>
                    <p className="text-xs text-gray-400">{l2}</p>
                    {socials && (
                      <div className="mt-2 flex gap-1.5" aria-label="Linked socials">
                        {[
                          [Youtube, 'bg-red-600'],
                          [Instagram, 'bg-gradient-to-br from-yellow-500 via-pink-600 to-purple-700'],
                          [XLogo, 'bg-white/10'],
                          [Send, 'bg-sky-500'],
                        ].map(([I, c], k) => (
                          <span key={k} className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${c}`} aria-hidden="true">
                            <I className="h-3.5 w-3.5" />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SideCard>

          <SideCard icon={AlertTriangle} title="Important Notes">
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-300 marker:text-gray-500">
              <li>Provide genuine and verifiable information.</li>
              <li>Broker statements should clearly show your name and trading activity.</li>
              <li>Payout proofs are optional but recommended.</li>
              <li>Social media links are optional.</li>
              <li>Our team may contact you for more information.</li>
              <li>False information may lead to rejection.</li>
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              How verification works:{' '}
              <Link to="/how-we-rate#verified-traders" className="text-blue-400 hover:text-blue-300">
                How we rate
              </Link>
              .
            </p>
          </SideCard>
        </aside>
      </div>
    </div>
  );
}
