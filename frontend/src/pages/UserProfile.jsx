import React from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  BadgeCheck,
  ShieldCheck,
  Globe,
  Clock,
  Layers,
  ExternalLink,
  Youtube,
  Twitter,
  Instagram,
  Send,
  Music2,
  LineChart,
  FileText,
  Image as ImageIcon,
  Info,
  Settings2,
} from "lucide-react";
import Seo from "../components/shared/Seo.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import ImageWithFallback from "../components/shared/ImageWithFallback.jsx";
import { getPublicUserProfile } from "../controllers/userProfileController.js";
import { countryOptions, flagEmoji, supportsFlags } from "../utils/countries.js";

// Public trader profile, laid out from Sahil's design (6 Oct 2026): header with
// bio, tags and socials, a Verified Trader card, headline numbers, verified
// performance, quick info, trading setup and verified documents.
//
// Every section renders only from real data. Fields the backend doesn't send
// yet simply don't appear, and switch on by themselves once they do:
//   socialLinks.myfxbook, socialFollowers, platforms, tradingSetup,
//   verifiedTrader.stats, verifiedTrader.proofCounts   (backend B23 / B26)
// Headline money figures show only when they're set (> 0), so an unset value
// never reads as "$0".

// Profiles store ISO codes ("IN"); show the country name.
const countryName = (value) => countryOptions().find((c) => c.code === value)?.name || value;

// Flag emoji for ISO codes, where the system can draw it (not on Windows).
function countryFlag(code) {
  if (!/^[A-Za-z]{2}$/.test(code || "") || !supportsFlags()) return "";
  return flagEmoji(code);
}

const YEARS_LABEL = { "0-1": "Under 1 year", "1-2": "1–2 years", "2-5": "2–5 years", "5-10": "5–10 years", "10+": "10+ years" };

const hasValue = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;

function formatMoney(n) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

// 125000 → "125K"
function formatCount(n) {
  if (!hasValue(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  if (url.includes("embed/")) return url;
  const match = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

// A public Myfxbook account page: https://www.myfxbook.com/members/<user>/<system>/<accountId>
function parseMyfxbook(url) {
  if (typeof url !== "string") return null;
  const m = url.trim().match(/^https?:\/\/(?:www\.)?myfxbook\.com\/members\/[^/]+\/[^/]+\/(\d+)/i);
  return m ? { url: url.trim(), accountId: m[1] } : null;
}

const SOCIALS = [
  { key: "youtube", label: "YouTube", Icon: Youtube, tint: "text-red-400", hover: "hover:border-red-500/40" },
  { key: "instagram", label: "Instagram", Icon: Instagram, tint: "text-pink-400", hover: "hover:border-pink-500/40" },
  { key: "twitter", label: "X", Icon: Twitter, tint: "text-sky-400", hover: "hover:border-sky-500/40" },
  { key: "telegram", label: "Telegram", Icon: Send, tint: "text-sky-400", hover: "hover:border-sky-500/40" },
  { key: "tiktok", label: "TikTok", Icon: Music2, tint: "text-gray-200", hover: "hover:border-white/30" },
  { key: "website", label: "Website", Icon: Globe, tint: "text-blue-300", hover: "hover:border-blue-500/40" },
];

function Section({ title, icon: Icon, children, aside }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          {Icon && <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, tone = "text-white", note }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-gray-500">{note}</div>}
    </div>
  );
}

function InfoRow({ label, children }) {
  if (children == null || children === "" || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-white">{children}</dd>
    </div>
  );
}

// Myfxbook's own chart widget for the account. If the image doesn't load
// (private account, wrong link), it's left out and only the link remains.
function MyfxbookWidget({ accountId, name }) {
  const [ok, setOk] = React.useState(true);
  if (!ok) return null;
  return (
    <img
      src={`https://widgets.myfxbook.com/widgets/${accountId}/large.jpg`}
      alt={`${name}'s verified trading results on Myfxbook`}
      loading="lazy"
      onError={() => setOk(false)}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth < 50) setOk(false);
      }}
      className="mt-4 w-full max-w-md rounded-lg border border-white/10 bg-white"
    />
  );
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
      <div className="max-w-6xl mx-auto px-4 py-10">
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

  const verified = profile.verifiedTrader || {};
  const isVerified = Boolean(profile.isVerifiedTrader);
  const stats = verified.stats || {};
  const links = profile.socialLinks || {};
  const followers = profile.socialFollowers || {};
  const setup = profile.tradingSetup || {};
  const proofCounts = verified.proofCounts || {};
  const myfxbook = parseMyfxbook(links.myfxbook);
  const youtubeEmbed = getYoutubeEmbedUrl(verified.youtubeEmbedUrl);
  const tags = [
    ...(profile.tradingStyles || []),
    ...(profile.primaryMarkets || []),
    ...(profile.tradesWith || []),
  ].filter((t, i, all) => t && all.indexOf(t) === i);

  // The numbers row appears once there is at least one real figure; style and
  // experience then sit beside them (they're always in Quick info anyway).
  const figures = [
    isVerified && hasValue(verified.pnl) && { label: "Total PNL (verified)", value: formatMoney(verified.pnl), tone: "text-green-400" },
    isVerified && hasValue(verified.totalWithdrawals) && { label: "Total payouts (verified)", value: formatMoney(verified.totalWithdrawals) },
    hasValue(stats.winRate) && { label: "Win rate", value: `${Math.round(stats.winRate)}%` },
    hasValue(stats.totalTrades) && { label: "Total trades", value: stats.totalTrades.toLocaleString("en-US") },
  ].filter(Boolean);
  const headline = figures.length
    ? [
        ...figures,
        profile.tradingStyles?.[0] && { label: "Trading style", value: profile.tradingStyles[0] },
      ].filter(Boolean)
    : [];

  const metrics = [
    hasValue(stats.profitFactor) && { label: "Profit factor", value: stats.profitFactor.toFixed(1) },
    hasValue(stats.avgWin) && { label: "Average win", value: formatMoney(stats.avgWin), tone: "text-green-400" },
    hasValue(stats.avgLoss) && { label: "Average loss", value: formatMoney(stats.avgLoss), tone: "text-red-400" },
    hasValue(stats.maxDrawdownPct) && { label: "Max drawdown", value: `${stats.maxDrawdownPct}%` },
  ].filter(Boolean);

  const setupRows = [
    ["Risk per trade", setup.riskPerTrade],
    ["Average holding time", setup.holdingTime],
    ["Preferred sessions", (setup.sessions || []).join(", ")],
    ["Trading instruments", (setup.instruments || []).join(", ")],
  ].filter(([, v]) => v);

  const proofs = [
    hasValue(proofCounts.brokerStatements) && { label: "Broker statements", count: proofCounts.brokerStatements, Icon: FileText },
    hasValue(proofCounts.payoutProofs) && { label: "Payout proofs", count: proofCounts.payoutProofs, Icon: ImageIcon },
  ].filter(Boolean);

  const socials = SOCIALS.filter((s) => links[s.key]);
  // Without a performance column, the info cards use the full width instead
  // of leaving an empty column beside them.
  const hasMain = Boolean(myfxbook || metrics.length || youtubeEmbed);

  return (
    <div className="bg-black text-white min-h-screen">
      <Seo
        title={isVerified ? `${profile.fullName}: Verified Trader` : profile.fullName}
        description={profile.bio || `${profile.fullName} on XK Trading Floor`}
        path={`/users/${userId}`}
        image={profile.profileImage}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1736] via-[#0b1220] to-[#070b14] p-5 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-full border-2 border-blue-500/60 bg-blue-500/20 flex items-center justify-center">
                {profile.profileImage ? (
                  <ImageWithFallback
                    src={profile.profileImage}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                    priority
                  />
                ) : (
                  <span className="text-3xl font-bold">{profile.fullName?.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">{profile.fullName}</h1>
                  {isVerified && <BadgeCheck className="h-6 w-6 text-blue-400" aria-label="Verified trader" />}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
                  {profile.country && (
                    <span className="inline-flex items-center gap-1.5">
                      {countryFlag(profile.country) && <span aria-hidden="true">{countryFlag(profile.country)}</span>}
                      {countryName(profile.country)}
                    </span>
                  )}
                  {profile.memberSince && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Member since {profile.memberSince}
                    </span>
                  )}
                </p>
                {profile.bio && <p className="mt-3 max-w-2xl leading-relaxed text-gray-300">{profile.bio}</p>}
                {tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Trading style, markets and brokers">
                    {tags.map((t) => (
                      <li key={t} className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-200">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                {socials.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {socials.map(({ key, label, Icon, tint, hover }) => (
                      <a
                        key={key}
                        href={links[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:text-white ${hover}`}
                      >
                        <Icon className={`h-4 w-4 ${tint}`} aria-hidden="true" />
                        {formatCount(followers[key]) || label}
                        {formatCount(followers[key]) && <span className="sr-only"> {label} followers</span>}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isVerified && (
              <div className="flex max-w-sm items-start gap-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 lg:mt-2">
                <ShieldCheck className="h-10 w-10 flex-shrink-0 text-blue-400" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-white">Verified Trader</div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-300">
                    This trader's identity and trading proofs have been reviewed and verified by the XK Trading Floor
                    team.
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Headline numbers */}
        {headline.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {headline.map((s) => (
              <Stat key={s.label} {...s} />
            ))}
          </div>
        )}

        <div className={hasMain ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" : ""}>
          {hasMain && (
          <div className="space-y-6 min-w-0">
            {/* Verified performance (Myfxbook today; a synced account later) */}
            {myfxbook && (
              <Section title="Verified performance" icon={LineChart}>
                <p className="text-sm text-gray-300">
                  {profile.fullName}'s trading results are tracked live on Myfxbook, an independent service that
                  reads the account directly.
                </p>
                <MyfxbookWidget accountId={myfxbook.accountId} name={profile.fullName} />
                <a
                  href={myfxbook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-4 inline-flex items-center gap-2"
                >
                  View verified stats on Myfxbook
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </Section>
            )}

            {metrics.length > 0 && (
              <Section title="Key metrics" icon={LineChart}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {metrics.map((m) => (
                    <Stat key={m.label} {...m} />
                  ))}
                </div>
              </Section>
            )}

            {youtubeEmbed && (
              <Section title="Trading channel" icon={Youtube}>
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
                  <iframe
                    src={youtubeEmbed}
                    title={`${profile.fullName} YouTube`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Section>
            )}
          </div>
          )}

          <aside className={hasMain ? "space-y-6" : "grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start"}>
            <Section title="Quick info" icon={Info}>
              <dl>
                <InfoRow label="Country">
                  {profile.country ? `${countryFlag(profile.country)} ${countryName(profile.country)}`.trim() : null}
                </InfoRow>
                <InfoRow label="Member since">{profile.memberSince}</InfoRow>
                <InfoRow label="Trading style">{(profile.tradingStyles || []).join(", ")}</InfoRow>
                <InfoRow label="Trades with">{(profile.tradesWith || []).join(", ")}</InfoRow>
                <InfoRow label="Primary markets">{(profile.primaryMarkets || []).join(", ")}</InfoRow>
                <InfoRow label="Platforms">{(profile.platforms || []).join(", ")}</InfoRow>
                <InfoRow label="Experience">{YEARS_LABEL[profile.yearsOfExperience]}</InfoRow>
                <InfoRow label="Verification status">
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs text-green-300">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
                    </span>
                  ) : null}
                </InfoRow>
                <InfoRow label="Last updated">
                  {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null}
                </InfoRow>
              </dl>
            </Section>

            {setupRows.length > 0 && (
              <Section title="Trading setup" icon={Settings2}>
                <dl>
                  {setupRows.map(([label, value]) => (
                    <InfoRow key={label} label={label}>
                      {value}
                    </InfoRow>
                  ))}
                </dl>
              </Section>
            )}

            {isVerified && proofs.length > 0 && (
              <Section title="Verified documents" icon={Layers}>
                <ul className="space-y-3">
                  {proofs.map(({ label, count, Icon }) => (
                    <li key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                        <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-xs text-gray-400">
                          {count} {count === 1 ? "file" : "files"} · <span className="text-green-400">Verified</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-gray-500">Documents are checked by the XK team and kept private.</p>
              </Section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
