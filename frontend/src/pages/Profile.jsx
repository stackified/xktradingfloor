import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice.js';
import { getUserCookie } from '../utils/cookies.js';
import CustomSelect from "../components/shared/CustomSelect.jsx";

export default function Profile() {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie() || { name: '', email: '', country: '', bio: '', avatar: '' };
  const [form, setForm] = React.useState({
    name: user.name || '',
    email: user.email || '',
    country: user.country || 'IN',
    bio: user.bio || '',
    avatar: user.avatar || ''
  });
  const [message, setMessage] = React.useState('');

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
  }

  function onSubmit(e) {
    e.preventDefault();
    const next = { ...user, ...form };
    dispatch(updateProfile(next));
    setMessage('Profile updated.');
    setTimeout(() => setMessage(''), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Profile | XK Trading Floor</title>
        <meta name="description" content="Manage your XK Trading Floor profile settings and personal information." />
      </Helmet>
      <h1 className="text-2xl font-semibold mb-6">Your Profile</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="card bg-gray-900/60 border border-border">
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-300">Full Name</span>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Full Name" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-300">Email</span>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
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
                  { value: "SG", label: "Singapore" }
                ]}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm text-gray-300">Bio</span>
              <textarea className="input" rows="4" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} aria-label="Bio" />
            </label>
            <div className="sm:col-span-2 flex items-center gap-4">
              {form.avatar && <img src={form.avatar} alt="Avatar preview" className="h-16 w-16 rounded-full object-cover" />}
              <label className="btn btn-secondary cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                Upload Avatar
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary">Save Changes</button>
          {message && <div className="text-sm text-green-400" role="status">{message}</div>}
        </div>
      </form>
    </div>
  );
}


