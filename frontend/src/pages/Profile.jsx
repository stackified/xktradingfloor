import React from 'react';
import Seo from '../components/shared/Seo.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice.js';
import { getUserCookie } from '../utils/cookies.js';
import CustomSelect from "../components/shared/CustomSelect.jsx";
import {
  getMyProfile,
  updateMyProfile,
  applyForVerifiedTrader,
} from '../controllers/userProfileController.js';

async function compressAvatarFile(file, { maxWidth = 512, quality = 0.85 } = {}) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Failed to compress image'))),
      'image/jpeg',
      quality,
    );
  });
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

const STATUS_LABELS = {
  none: 'Not applied',
  invited: 'Invited to apply',
  pending: 'Application under review',
  scheduled: 'Call scheduled',
  approved: 'Verified trader',
  rejected: 'Application rejected',
};

export default function Profile() {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie() || {};
  const [form, setForm] = React.useState({
    fullName: user.fullName || user.name || '',
    country: user.country || 'IN',
    bio: user.bio || '',
    tradingStyles: '',
    tradesWith: '',
    profileImage: user.profileImage || user.avatar || '',
  });
  const [verification, setVerification] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [applicationNote, setApplicationNote] = React.useState('');
  const [brokerStatements, setBrokerStatements] = React.useState([]);
  const [payoutProofs, setPayoutProofs] = React.useState([]);
  const [avatarFile, setAvatarFile] = React.useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState('');

  React.useEffect(() => () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await getMyProfile();
        setForm({
          fullName: data.fullName || '',
          country: data.country || 'IN',
          bio: data.bio || '',
          tradingStyles: (data.tradingStyles || []).join(', '),
          tradesWith: (data.tradesWith || []).join(', '),
          profileImage: data.profileImage || '',
        });
        setVerification(data.verifiedTrader || null);
      } catch (err) {
        // Keep page usable with cached session data if API is temporarily unavailable
        setForm({
          fullName: user.fullName || user.name || '',
          country: user.country || 'IN',
          bio: user.bio || '',
          tradingStyles: '',
          tradesWith: '',
          profileImage: user.profileImage || user.avatar || '',
        });
        setError(err.response?.data?.message || 'Could not sync profile from server. Showing cached data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const compressed = await compressAvatarFile(file);
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarFile(compressed);
      setAvatarPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setError('Could not process that image. Try a JPEG or PNG under 5 MB.');
    } finally {
      e.target.value = '';
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await updateMyProfile({
        fullName: form.fullName,
        country: form.country,
        bio: form.bio,
        tradingStyles: form.tradingStyles,
        tradesWith: form.tradesWith,
      }, avatarFile);
      setVerification(data.verifiedTrader || null);
      setForm((f) => ({ ...f, profileImage: data.profileImage || '' }));
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl('');
      setAvatarFile(null);
      dispatch(updateProfile({
        ...user,
        fullName: data.fullName,
        name: data.fullName,
        country: data.country,
        bio: data.bio,
        avatar: data.profileImage,
        profileImage: data.profileImage,
      }));
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function onApply(e) {
    e.preventDefault();
    setApplying(true);
    setError('');
    setMessage('');
    try {
      const { data } = await applyForVerifiedTrader({
        applicationNote,
        brokerStatements,
        payoutProofs,
      });
      setVerification(data.verifiedTrader || null);
      setApplicationNote('');
      setBrokerStatements([]);
      setPayoutProofs([]);
      setMessage('Verified trader application submitted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  }

  const canApply = ['none', 'invited', 'rejected'].includes(verification?.status || 'none');

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-gray-400">Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo
        title="Profile"
        description="Manage your XK Trading Floor profile settings and personal information."
        path="/profile"
        noindex
      />
      <h1 className="text-2xl font-semibold mb-6">Your Profile</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="card bg-gray-900/60 border border-border">
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm text-gray-300">Full Name</span>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-300">Country</span>
              <CustomSelect
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                options={[
                  { value: "IN", label: "India" },
                  { value: "US", label: "United States" },
                  { value: "GB", label: "United Kingdom" },
                  { value: "DE", label: "Germany" },
                  { value: "SG", label: "Singapore" },
                ]}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm text-gray-300">Bio</span>
              <textarea className="input" rows="4" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm text-gray-300">Trading styles (comma-separated)</span>
              <input className="input" value={form.tradingStyles} onChange={(e) => setForm({ ...form, tradingStyles: e.target.value })} placeholder="Scalper, Day Trader" />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm text-gray-300">Trades with (comma-separated)</span>
              <input className="input" value={form.tradesWith} onChange={(e) => setForm({ ...form, tradesWith: e.target.value })} placeholder="FTMO, IC Markets" />
            </label>
            <div className="sm:col-span-2 flex items-center gap-4">
              {(avatarPreviewUrl || form.profileImage) && (
                <img
                  src={avatarPreviewUrl || form.profileImage}
                  alt="Avatar preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <label className="btn btn-secondary cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
                Upload Avatar
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="card bg-gray-900/60 border border-border mt-8">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold">Verified Trader Badge</h2>
            <span className="text-sm px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
              {STATUS_LABELS[verification?.status || 'none']}
            </span>
          </div>

          {verification?.status === 'scheduled' && verification.scheduledCallAt && (
            <p className="text-sm text-gray-300">
              Your verification call is scheduled for {new Date(verification.scheduledCallAt).toLocaleString()}.
            </p>
          )}

          {verification?.status === 'rejected' && verification.rejectionReason && (
            <p className="text-sm text-red-300">{verification.rejectionReason}</p>
          )}

          {canApply ? (
            <form onSubmit={onApply} className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Application note</span>
                <textarea
                  className="input"
                  rows="3"
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                  placeholder="Briefly describe your trading experience"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Broker statements (PDF/images)</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => setBrokerStatements(Array.from(e.target.files || []))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Payout proofs (PDF/images)</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => setPayoutProofs(Array.from(e.target.files || []))}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={applying}>
                {applying ? 'Submitting...' : 'Apply for verified badge'}
              </button>
            </form>
          ) : verification?.status === 'approved' ? (
            <p className="text-sm text-green-300">You are a verified trader. Your public profile is live.</p>
          ) : (
            <p className="text-sm text-gray-400">Your application is being processed by the XKTF team.</p>
          )}
        </div>
      </div>

      {message && <div className="text-sm text-green-400 mt-4" role="status">{message}</div>}
      {error && <div className="text-sm text-red-400 mt-4" role="alert">{error}</div>}
    </div>
  );
}
