import React from 'react';
import { Linkedin, Twitter } from 'lucide-react';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function BlogAuthorInfo({ author }) {
  if (!author) return null;
  return (
    <div className="card mt-8">
      <div className="card-body flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-muted overflow-hidden">
          {author.avatar && <ImageWithFallback src={author.avatar} fallback="/assets/users/default-avatar.jpg" alt={author.name} className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{author.name}</div>
          <div className="text-sm text-gray-400">{author.bio}</div>
        </div>
        <div className="flex items-center gap-3">
          {author.socials?.linkedin && <a className="text-gray-300 hover:text-white" href={author.socials.linkedin} target="_blank" rel="noreferrer"><Linkedin /></a>}
          {author.socials?.twitter && <a className="text-gray-300 hover:text-white" href={author.socials.twitter} target="_blank" rel="noreferrer"><Twitter /></a>}
        </div>
      </div>
    </div>
  );
}

export default BlogAuthorInfo;


