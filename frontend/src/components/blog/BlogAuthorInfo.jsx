import React from 'react';
import { Linkedin, Twitter } from 'lucide-react';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function BlogAuthorInfo({ author }) {
  if (!author) return null;
  // The blog API populates author as { fullName, email, profileImage }. Fall
  // back to the older { name, avatar, bio, socials } shape if present.
  const name = author.fullName || author.name || author.email || "Author";
  const avatar = author.profileImage || author.avatar || "";
  const bio = author.bio || "";
  const socials = author.socials || {};
  return (
    <div className="card mt-8">
      <div className="card-body flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-muted overflow-hidden">
          {avatar && <ImageWithFallback src={avatar} fallback="/assets/users/default-avatar.jpg" alt={name} className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          {bio && <div className="text-sm text-gray-400">{bio}</div>}
        </div>
        <div className="flex items-center gap-3">
          {socials.linkedin && <a className="text-gray-300 hover:text-white" href={socials.linkedin} target="_blank" rel="noreferrer"><Linkedin /></a>}
          {socials.twitter && <a className="text-gray-300 hover:text-white" href={socials.twitter} target="_blank" rel="noreferrer"><Twitter /></a>}
        </div>
      </div>
    </div>
  );
}

export default BlogAuthorInfo;


