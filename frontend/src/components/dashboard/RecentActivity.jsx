import React from 'react';

export default function RecentActivity({ items }) {
  return (
    <div className="card bg-gray-900/60 border border-border">
      <div className="card-body">
        <div className="text-sm text-gray-400 mb-2">Recent Activity</div>
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-start justify-between">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-xs text-gray-400 capitalize">{it.type}</div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(it.ts).toLocaleString()}
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-gray-400">No recent activity.</li>
          )}
        </ul>
      </div>
    </div>
  );
}


