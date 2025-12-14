import React from 'react';
import { registerForEvent } from '../../controllers/eventsController.js';

function RegisterModal({ isOpen, onClose, selectedEvent }) {
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const eventId = selectedEvent?.id || '';

  React.useEffect(() => {
    if (!isOpen) setForm({ name: '', email: '', phone: '' });
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      alert('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await registerForEvent({ ...form, eventId });
      if (res?.success || res?.data?.success) {
        alert(res?.message || 'Registration successful! We will contact you with details.');
        onClose();
      }
    } catch (error) {
      alert(error?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-300">Register for</div>
            <div className="font-semibold">{selectedEvent?.title || 'Selected Event'}</div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="input" placeholder="Full Name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} required />
          <button className="btn btn-primary rounded-full w-full" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
        </form>
        <div className="text-xs text-gray-400 mt-3">This is a demo. Backend integration will use secure endpoints and email confirmations.</div>
      </div>
    </div>
  );
}

export default RegisterModal;


