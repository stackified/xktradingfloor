import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const COLORS = ['#2B6EF2', '#5B8DF5', '#1E4FB3', '#38BDF8'];

export default function PieChartWidget({ data, title = 'Category Split' }) {
  return (
    <div className="card bg-gray-900/60 border border-border" role="region" aria-label={title}>
      <div className="card-body">
        <div className="text-sm text-gray-400 mb-2">{title}</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0E1422', border: '1px solid #1C2333' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


