import React from 'react';
import { Linkedin, Twitter } from 'lucide-react';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function BlogAuthorInfo({ author }) {
  if (!author || typeof author !== 'object') return null;
  // The blog API populates author as { fullName, email, profileImage }. Fall
  // back to the older { name, avatar, bio, socials } shape if present. The
  // email is never shown publicly.
  const name = author.fullName || author.name || 'XK Trading Floor';
  const avatar = author.profileImage || author.avatar || '';
  const bio = author.bio || 'Market insights, broker reviews and trading education from the XK Trading Floor team.';
  const socials = author.socials || {};
  return (
    <div className="mt-6 flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#0B1120] p-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1E293B] text-lg font-bold text-white">
        {avatar ? (
          <ImageWithFallback src={avatar} fallback="/assets/users/default-avatar.jpg" alt={name} className="h-full w-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">Written by</div>
        <div className="mt-0.5 font-semibold text-white">{name}</div>
        <p className="mt-1 text-sm leading-relaxed text-[#94A3B8]">{bio}</p>
      </div>
      {(socials.linkedin || socials.twitter) && (
        <div className="flex items-center gap-3">
          {socials.linkedin && <a className="text-[#94A3B8] hover:text-white" href={socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${name} on LinkedIn`}><Linkedin className="h-5 w-5" /></a>}
          {socials.twitter && <a className="text-[#94A3B8] hover:text-white" href={socials.twitter} target="_blank" rel="noopener noreferrer" aria-label={`${name} on X`}><Twitter className="h-5 w-5" /></a>}
        </div>
      )}
    </div>
  );
}

export default BlogAuthorInfo;
