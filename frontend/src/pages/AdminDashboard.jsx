import React from 'react';

function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">Admin Panel</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card"><div className="card-body"><div className="font-semibold mb-1">Site Settings</div><div className="text-sm text-gray-400">Logo, hero content, meta</div></div></div>
        <div className="card"><div className="card-body"><div className="font-semibold mb-1">Academy</div><div className="text-sm text-gray-400">Create/update events</div></div></div>
        <div className="card"><div className="card-body"><div className="font-semibold mb-1">Reviews</div><div className="text-sm text-gray-400">Moderate companies & reviews</div></div></div>
        <div className="card"><div className="card-body"><div className="font-semibold mb-1">Blog</div><div className="text-sm text-gray-400">Manage posts</div></div></div>
        <div className="card"><div className="card-body"><div className="font-semibold mb-1">Merch</div><div className="text-sm text-gray-400">Products & orders</div></div></div>
        <div className="card"><div className="card-body"><div className="font-semibold mb-1">Users</div><div className="text-sm text-gray-400">Admins, Operators, Members</div></div></div>
      </div>
      <div className="text-xs text-gray-500 mt-4">Note: This is a placeholder UI; wire to backend CMS later.</div>
    </div>
  );
}

export default AdminDashboard;


