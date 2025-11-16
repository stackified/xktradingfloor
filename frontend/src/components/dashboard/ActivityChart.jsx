import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ActivityChart({ data }) {
  return (
    <div className="card bg-gray-900/60 border border-border" role="region" aria-label="Weekly activity chart">
      <div className="card-body">
        <div className="text-sm text-gray-400 mb-2">Weekly Activity</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2333" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0E1422', border: '1px solid #1C2333' }} />
              <Line type="monotone" dataKey="value" stroke="#2B6EF2" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


