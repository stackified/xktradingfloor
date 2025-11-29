import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  5: '#10b981', // green
  4: '#3b82f6', // blue
  3: '#f59e0b', // amber
  2: '#f97316', // orange
  1: '#ef4444', // red
};

export default function RatingBreakdownChart({ reviews = [] }) {
  // Calculate rating distribution
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  reviews.forEach((review) => {
    const rating = Math.floor(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating]++;
    }
  });

  const total = reviews.length;
  const data = [
    { rating: '5 ⭐', count: ratingCounts[5], percentage: total > 0 ? ((ratingCounts[5] / total) * 100).toFixed(0) : 0 },
    { rating: '4 ⭐', count: ratingCounts[4], percentage: total > 0 ? ((ratingCounts[4] / total) * 100).toFixed(0) : 0 },
    { rating: '3 ⭐', count: ratingCounts[3], percentage: total > 0 ? ((ratingCounts[3] / total) * 100).toFixed(0) : 0 },
    { rating: '2 ⭐', count: ratingCounts[2], percentage: total > 0 ? ((ratingCounts[2] / total) * 100).toFixed(0) : 0 },
    { rating: '1 ⭐', count: ratingCounts[1], percentage: total > 0 ? ((ratingCounts[1] / total) * 100).toFixed(0) : 0 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{payload[0].payload.rating}</p>
          <p className="text-gray-300 text-sm">
            Count: <span className="text-white">{payload[0].value}</span>
          </p>
          <p className="text-gray-300 text-sm">
            Percentage: <span className="text-white">{payload[0].payload.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No reviews yet to display rating breakdown</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-white">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis dataKey="rating" type="category" width={60} tick={{ fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => {
              const rating = parseInt(entry.rating);
              return <Cell key={`cell-${index}`} fill={COLORS[rating] || '#6b7280'} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs text-gray-400">
        {data.map((item) => (
          <div key={item.rating}>
            <div className="font-semibold text-white">{item.count}</div>
            <div>{item.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

