import React from 'react';
import StarRating from './StarRating.jsx';

function ReviewForm() {
  const [form, setForm] = React.useState({ name: '', role: '', rating: 5, text: '' });
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.role || !form.text) {
      alert('Please fill all fields.');
      return;
    }
    setSubmitting(true);
    try {
      // TODO: Integrate with backend API later
      await new Promise(r => setTimeout(r, 600));
      alert('Thanks for your feedback!');
      setForm({ name: '', role: '', rating: 5, text: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Share Your Experience</h3>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <input className="input" placeholder="Full Name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
        <input className="input" placeholder="Role (e.g., Trader)" value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})} />
        <div className="sm:col-span-2">
          <div className="text-sm text-gray-400 mb-1">Rating</div>
          <StarRating value={form.rating} onChange={(v)=>setForm({...form, rating:v})} />
        </div>
        <textarea className="input sm:col-span-2 h-32" placeholder="Your feedback" value={form.text} onChange={(e)=>setForm({...form, text:e.target.value})} />
        <button className="btn btn-primary rounded-full sm:col-span-2" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</button>
      </form>
    </div>
  );
}

export default ReviewForm;


