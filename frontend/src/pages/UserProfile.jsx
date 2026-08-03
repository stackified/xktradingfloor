import React from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Globe,
  Clock,
  Layers,
  ExternalLink,
} from "lucide-react";
import Seo from "../components/shared/Seo.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import ImageWithFallback from "../components/shared/ImageWithFallback.jsx";
import { getPublicUserProfile } from "../controllers/userProfileController.js";

function formatMoney(n) {
  if (n == null) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  if (url.includes("embed/")) return url;
  const match = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function UserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getPublicUserProfile(userId);
        setProfile(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <CardLoader count={1} />
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-xl font-semibold mb-2">Profile not found</h1>
        <Link to="/reviews/traders" className="btn btn-primary mt-4">
          Back to traders
        </Link>
      </div>
    );
  }

  const verified = profile.verifiedTrader;
  const primaryStyle = profile.tradingStyles?.[0] || "—";
  const youtubeEmbed = getYoutubeEmbedUrl(verified?.youtubeEmbedUrl);

  return (
    <div className="bg-black text-white min-h-screen">
      <Seo
        title={profile.fullName}
        description={profile.bio || `${profile.fullName} on XK Trading Floor`}
        path={`/users/${userId}`}
        image={profile.profileImage}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="card overflow-hidden">
          <div className="card-body space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-blue-500/20 border-2 border-blue-500/50 overflow-hidden flex items-center justify-center">
                {profile.profileImage ? (
                  <ImageWithFallback
                    src={profile.profileImage}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">{profile.fullName?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">{profile.fullName}</h1>
                  {profile.isVerifiedTrader && (
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {profile.country}
                  {profile.memberSince && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Member since {profile.memberSince}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.isVerifiedTrader && (
                <>
                  <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                    <div className="text-xs text-gray-500 uppercase mb-1">PNL</div>
                    <div className="text-green-400 font-bold">{formatMoney(verified?.pnl)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                    <div className="text-xs text-gray-500 uppercase mb-1">Payouts</div>
                    <div className="text-white font-semibold">
                      {formatMoney(verified?.totalWithdrawals)}
                    </div>
                  </div>
                </>
              )}
              <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                <div className="text-xs text-gray-500 uppercase mb-1">Style</div>
                <div className="text-white font-semibold">{primaryStyle}</div>
              </div>
            </div>

            {profile.tradesWith?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  Trades with
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.tradesWith.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.socialLinks?.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center gap-2 w-fit"
              >
                Visit website
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {youtubeEmbed && (
          <div className="card overflow-hidden">
            <div className="card-body">
              <h2 className="font-semibold mb-4">Trading channel</h2>
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
                <iframe
                  src={youtubeEmbed}
                  title={`${profile.fullName} YouTube`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
