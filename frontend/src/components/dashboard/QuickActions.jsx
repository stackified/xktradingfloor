import React from 'react';
import { Link } from 'react-router-dom';
import { User, Ticket, MessageSquare, ShoppingBag } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { to: '/profile', label: 'Edit Profile', icon: User },
    { to: '/academy', label: 'View Tickets', icon: Ticket },
    { to: '/reviews', label: 'Manage Reviews', icon: MessageSquare },
    { to: '/merch', label: 'Open Shop', icon: ShoppingBag }
  ];

  return (
    <div className="card bg-gray-900/60 border border-border" role="region" aria-label="Quick actions">
      <div className="card-body grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="btn btn-secondary flex items-center justify-center gap-2" aria-label={a.label}>
            <a.icon aria-hidden="true" />
            <span className="text-sm">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}


