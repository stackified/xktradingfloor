import React from 'react';
import { Mail, TrendingUp, Tag } from 'lucide-react';

function BlogSidebar({ latest = [], tags = [] }) {
  const [email, setEmail] = React.useState('');
  return (
    <aside className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-blue-300" /><h3 className="font-semibold">Latest Posts</h3></div>
          <ul className="space-y-2 text-sm">
            {latest.slice(0,5).map(p => (
              <li key={p.id} className="text-gray-300 hover:text-white"><a href={`/blog/${p.id}`}>{p.title}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-3"><Tag className="h-4 w-4 text-blue-300" /><h3 className="font-semibold">Popular Tags</h3></div>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-gray-300">#{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-3"><Mail className="h-4 w-4 text-blue-300" /><h3 className="font-semibold">Newsletter</h3></div>
          <div className="text-sm text-gray-400 mb-3">Get weekly insights in your inbox.</div>
          <div className="flex gap-2">
            <input className="input" placeholder="Email address" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <button className="btn btn-primary" onClick={()=>console.log('subscribe', email)}>Subscribe</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default BlogSidebar;


