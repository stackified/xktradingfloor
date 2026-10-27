import React from "react";
import { ShieldCheck, Wallet, Trophy, ThumbsUp, ThumbsDown, Globe, ExternalLink } from "lucide-react";

// The structured data the XK team keeps per company: broker licences,
// account types and payments (B22), prop-firm challenges (B21), pros and
// cons, and when it was last checked. Each block shows only when it has data.

const TIER_LABELS = {
  strong: "Top-tier",
  established: "Established",
  offshore: "Offshore",
  limited_or_unverified: "Limited",
  unverified: "Unverified",
};

const DRAWDOWN_LABELS = { static: "Static", trailing: "Trailing", "eod-trailing": "End-of-day trailing" };

const shortDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
};
// Only http(s) links are rendered (the backend checks this too).
const safeUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch (_) {
    return null;
  }
};
const pct = (value) => (value === undefined || value === null ? "–" : `${value}%`);
const money = (amount, currency = "USD") => {
  if (amount === undefined || amount === null) return "–";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  } catch (_) {
    return `${amount} ${currency}`;
  }
};

function Block({ icon: Icon, title, children }) {
  return (
    <section className="card">
      <div className="card-body space-y-3">
        <h2 className="font-display font-bold text-lg sm:text-xl flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Table({ caption, head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-200">
          {rows.map((cells, i) => (
            <tr key={i} className="border-t border-white/10">
              {cells.map((cell, j) => (
                <td key={j} className="py-2 pr-4 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Chips({ label, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-200 border border-white/10">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompanyFacts({ company }) {
  const licences = company.licences || [];
  const accountTypes = company.accountTypes || [];
  const challenges = company.challenges || [];
  const pros = company.pros || [];
  const cons = company.cons || [];
  const restricted = company.restrictedCountries || [];
  const hasPayments = company.maxLeverage || company.depositMethods?.length || company.withdrawalMethods?.length;
  const hasChallengeExtras = company.payoutMethods?.length || company.scalingPlan;
  const checked = shortDate(company.dataCheckedAt);

  const anything =
    licences.length || accountTypes.length || challenges.length || pros.length || cons.length ||
    restricted.length || hasPayments || hasChallengeExtras;
  if (!anything) return null;

  return (
    <div className="space-y-6">
      {licences.length > 0 && (
        <Block icon={ShieldCheck} title="Regulation and licences">
          <Table
            caption={`${company.name} licences`}
            head={["Regulator", "Country", "Level", "Entity", "Licence"]}
            rows={licences.map((l) => [
              <span className="font-medium text-white">{l.regulator}</span>,
              l.country || "–",
              TIER_LABELS[l.tier] || "–",
              l.entity || "–",
              safeUrl(l.registerUrl) ? (
                <a
                  href={safeUrl(l.registerUrl)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  {l.licenceNumber || "Register"}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : (
                l.licenceNumber || "–"
              ),
            ])}
          />
        </Block>
      )}

      {(accountTypes.length > 0 || hasPayments) && (
        <Block icon={Wallet} title="Accounts and payments">
          {accountTypes.length > 0 && (
            <Table
              caption={`${company.name} account types`}
              head={["Account", "Min deposit", "Spread from", "Commission"]}
              rows={accountTypes.map((a) => [
                <span className="font-medium text-white">{a.name}</span>,
                a.minDeposit !== undefined && a.minDeposit !== null ? money(a.minDeposit) : "–",
                a.spreadFrom !== undefined && a.spreadFrom !== null ? `${a.spreadFrom} pips` : "–",
                a.commission || "–",
              ])}
            />
          )}
          {company.maxLeverage && (
            <p className="text-sm text-gray-300">
              <span className="text-gray-400">Max leverage:</span> {company.maxLeverage}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Chips label="Deposits" items={company.depositMethods} />
            <Chips label="Withdrawals" items={company.withdrawalMethods} />
          </div>
        </Block>
      )}

      {(challenges.length > 0 || hasChallengeExtras) && (
        <Block icon={Trophy} title="Challenges">
          {challenges.length > 0 && (
            <Table
              caption={`${company.name} challenges`}
              head={["Challenge", "Account", "Price", "Profit target", "Daily drawdown", "Max drawdown", "Min days", "Split", "Payouts"]}
              rows={challenges.map((c) => {
                const phases = c.phases || [];
                const perPhase = (fn) => (phases.length ? phases.map(fn).join(" / ") : "–");
                return [
                  <div>
                    <div className="font-medium text-white">{c.name}</div>
                    <div className="text-xs text-gray-400">
                      {[c.drawdownType && `${DRAWDOWN_LABELS[c.drawdownType] || c.drawdownType} drawdown`, c.refundableFee && "Fee refunded"]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>,
                  money(c.accountSize, c.currency),
                  money(c.price, c.currency),
                  perPhase((p) => pct(p.profitTarget)),
                  perPhase((p) => pct(p.dailyDrawdown)),
                  perPhase((p) => pct(p.maxDrawdown)),
                  perPhase((p) => (p.minTradingDays ?? "–")),
                  pct(c.profitSplit),
                  c.payoutFrequency || "–",
                ];
              })}
            />
          )}
          {challenges.some((c) => (c.phases || []).length > 1) && (
            <p className="text-xs text-gray-500">Figures separated by / are per phase.</p>
          )}
          {company.scalingPlan && (
            <p className="text-sm text-gray-300">
              <span className="text-gray-400">Scaling plan:</span> {company.scalingPlan}
            </p>
          )}
          <Chips label="Payout methods" items={company.payoutMethods} />
        </Block>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {pros.length > 0 && (
            <Block icon={ThumbsUp} title="Pros">
              <ul className="space-y-2 text-sm text-gray-200">
                {pros.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-green-400" aria-hidden="true">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Block>
          )}
          {cons.length > 0 && (
            <Block icon={ThumbsDown} title="Cons">
              <ul className="space-y-2 text-sm text-gray-200">
                {cons.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="text-red-400" aria-hidden="true">–</span>
                    {c}
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      )}

      {(restricted.length > 0 || checked) && (
        <div className="flex flex-col gap-3 text-sm text-gray-400 sm:flex-row sm:items-start sm:justify-between">
          {restricted.length > 0 && (
            <p className="flex gap-2">
              <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Not available in: {restricted.join(", ")}</span>
            </p>
          )}
          {checked && <p className="sm:text-right">Details checked by XK on {checked}</p>}
        </div>
      )}
    </div>
  );
}

export default CompanyFacts;
