import React from "react";
import { Plus, Trash2 } from "lucide-react";

// Structured company data for the admin form: broker licences, account types
// and payments (B22), prop-firm challenges (B21), pros and cons, and the
// TrustScore inputs (B32). The backend reads every list and object here as a
// JSON string; `trusted` and `scoreInputs` are Admin only (an Operator who
// sends them gets a 403), so they are left out of an Operator's save.

const inputClass = "input input-bordered input-sm w-full border-white/10 bg-gray-950/40 text-white";
const labelClass = "text-xs font-medium text-gray-400";

export const LICENCE_TIERS = [
  ["strong", "Strong (FCA, ASIC, CySEC level)"],
  ["established", "Established"],
  ["offshore", "Offshore"],
  ["limited_or_unverified", "Limited or unverified"],
  ["unverified", "Unverified"],
];
const DRAWDOWN_TYPES = [
  ["", "Not set"],
  ["static", "Static"],
  ["trailing", "Trailing"],
  ["eod-trailing", "End-of-day trailing"],
];
// 1-5 scores per category, matching the backend WEIGHTS.
const SCORE_KEYS = {
  Broker: [
    ["payouts", "Withdrawals", "How reliably and quickly traders get paid"],
    ["tradingConditions", "Trading conditions", "Spreads, fees and execution"],
  ],
  PropFirm: [
    ["payouts", "Payouts", "Payout record and speed"],
    ["rules", "Rules", "How fair and clear the rules are"],
    ["background", "Background", "History, ownership and transparency"],
  ],
};

// Lists are edited as text: comma-separated, or one per line for pros/cons.
const LIST_FIELDS = ["restrictedCountries", "payoutMethods", "depositMethods", "withdrawalMethods"];
const LINE_FIELDS = ["pros", "cons"];

const blankLicence = () => ({ regulator: "", country: "", tier: "unverified", licenceNumber: "", entity: "", registerUrl: "", checkedAt: "" });
const blankAccountType = () => ({ name: "", minDeposit: "", spreadFrom: "", commission: "" });
const blankPhase = () => ({ profitTarget: "", dailyDrawdown: "", maxDrawdown: "", minTradingDays: "" });
const blankChallenge = () => ({
  name: "",
  accountSize: "",
  currency: "USD",
  price: "",
  phases: [blankPhase()],
  drawdownType: "",
  profitSplit: "",
  payoutFrequency: "",
  refundableFee: false,
  platforms: "",
});

const dateInput = (value) => (value ? String(value).slice(0, 10) : "");
const numText = (value) => (value === undefined || value === null ? "" : String(value));

// Form state from a company returned by the API.
export function companyDataFromApi(company = {}) {
  const out = {
    licences: (company.licences || []).map((l) => ({ ...blankLicence(), ...l, checkedAt: dateInput(l.checkedAt) })),
    accountTypes: (company.accountTypes || []).map((a) => ({
      ...blankAccountType(),
      ...a,
      minDeposit: numText(a.minDeposit),
      spreadFrom: numText(a.spreadFrom),
    })),
    challenges: (company.challenges || []).map((c) => ({
      ...blankChallenge(),
      ...c,
      accountSize: numText(c.accountSize),
      price: numText(c.price),
      profitSplit: numText(c.profitSplit),
      drawdownType: c.drawdownType || "",
      platforms: (c.platforms || []).join(", "),
      phases: (c.phases?.length ? c.phases : [{}]).map((p) => ({
        profitTarget: numText(p.profitTarget),
        dailyDrawdown: numText(p.dailyDrawdown),
        maxDrawdown: numText(p.maxDrawdown),
        minTradingDays: numText(p.minTradingDays),
      })),
    })),
    scalingPlan: company.scalingPlan || "",
    maxLeverage: company.maxLeverage || "",
    dataCheckedAt: dateInput(company.dataCheckedAt),
    trusted: Boolean(company.trusted),
    scoreInputs: {},
  };
  for (const key of LIST_FIELDS) out[key] = (company[key] || []).join(", ");
  for (const key of LINE_FIELDS) out[key] = (company[key] || []).join("\n");
  for (const key of ["payouts", "tradingConditions", "rules", "background"]) {
    out.scoreInputs[key] = numText(company.scoreInputs?.[key]);
  }
  return out;
}

export const emptyCompanyData = () => companyDataFromApi({});

const splitList = (text) => String(text || "").split(",").map((s) => s.trim()).filter(Boolean);
const splitLines = (text) => String(text || "").split("\n").map((s) => s.trim()).filter(Boolean);
const numOrUndefined = (value) => (value === "" || value === null || value === undefined ? undefined : Number(value));

// Fields to merge into the company save. Lists and objects go as JSON
// strings, so an emptied list is sent as [] and clears on the server.
export function companyDataPayload(data, { category, isAdmin }) {
  const payload = {
    licences: JSON.stringify(
      data.licences
        .filter((l) => l.regulator.trim())
        .map((l) => ({ ...l, checkedAt: l.checkedAt || undefined }))
    ),
    accountTypes: JSON.stringify(
      data.accountTypes
        .filter((a) => a.name.trim())
        .map((a) => ({ ...a, minDeposit: numOrUndefined(a.minDeposit), spreadFrom: numOrUndefined(a.spreadFrom) }))
    ),
    challenges: JSON.stringify(
      data.challenges
        .filter((c) => c.name.trim())
        .map((c) => ({
          ...c,
          accountSize: numOrUndefined(c.accountSize),
          price: numOrUndefined(c.price),
          profitSplit: numOrUndefined(c.profitSplit),
          drawdownType: c.drawdownType || undefined,
          platforms: splitList(c.platforms),
          phases: c.phases
            .map((p) => ({
              profitTarget: numOrUndefined(p.profitTarget),
              dailyDrawdown: numOrUndefined(p.dailyDrawdown),
              maxDrawdown: numOrUndefined(p.maxDrawdown),
              minTradingDays: numOrUndefined(p.minTradingDays),
            }))
            .filter((p) => Object.values(p).some((v) => v !== undefined)),
        }))
    ),
    scalingPlan: data.scalingPlan,
    maxLeverage: data.maxLeverage,
    dataCheckedAt: data.dataCheckedAt,
  };
  for (const key of LIST_FIELDS) payload[key] = JSON.stringify(splitList(data[key]));
  for (const key of LINE_FIELDS) payload[key] = JSON.stringify(splitLines(data[key]));

  if (isAdmin) {
    payload.trusted = String(Boolean(data.trusted));
    const scores = {};
    for (const [key] of SCORE_KEYS[category] || []) {
      scores[key] = data.scoreInputs[key] === "" ? null : Number(data.scoreInputs[key]);
    }
    if (Object.keys(scores).length) payload.scoreInputs = JSON.stringify(scores);
  }
  return payload;
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function RowCard({ title, onRemove, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-300">{title}</span>
        <button type="button" onClick={onRemove} className="text-gray-500 hover:text-red-400" aria-label={`Remove ${title}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:border-blue-500/50"
    >
      <Plus className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

export default function CompanyDataFields({ value, onChange, category, isAdmin }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const setRow = (key, index, patch) =>
    set({ [key]: value[key].map((row, i) => (i === index ? { ...row, ...patch } : row)) });
  const removeRow = (key, index) => set({ [key]: value[key].filter((_, i) => i !== index) });

  const isBroker = category === "Broker";
  const isPropFirm = category === "PropFirm";
  const scoreKeys = SCORE_KEYS[category] || [];

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">TrustScore (Admin only)</h3>
            <p className="mt-1 text-xs text-gray-400">
              The score is calculated on save from these, the licences, reviews and platforms. Only the total is
              shown on the site.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={value.trusted}
              onChange={(e) => set({ trusted: e.target.checked })}
            />
            Show the &ldquo;Trusted&rdquo; label on this company
          </label>
          {scoreKeys.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {scoreKeys.map(([key, label, hint]) => (
                <Field key={key} label={`${label} (1 to 5)`}>
                  <select
                    value={value.scoreInputs[key] ?? ""}
                    onChange={(e) => set({ scoreInputs: { ...value.scoreInputs, [key]: e.target.value } })}
                    className={inputClass}
                  >
                    <option value="">Not scored</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={String(n)}>{n}</option>
                    ))}
                  </select>
                  <span className="block text-[11px] text-gray-500">{hint}</span>
                </Field>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Crypto platforms are scored on reviews only.</p>
          )}
        </div>
      )}

      {isBroker && (
        <div className="rounded-2xl border border-white/10 bg-gray-950/30 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200">Licences</h3>
          <p className="text-xs text-gray-500">
            The strongest tier counts toward the TrustScore. Always add the country: FSC and FSA exist in several.
          </p>
          {value.licences.map((l, i) => (
            <RowCard key={i} title={l.regulator || `Licence ${i + 1}`} onRemove={() => removeRow("licences", i)}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Regulator">
                  <input className={inputClass} value={l.regulator} placeholder="FCA" onChange={(e) => setRow("licences", i, { regulator: e.target.value })} />
                </Field>
                <Field label="Country">
                  <input className={inputClass} value={l.country} placeholder="United Kingdom" onChange={(e) => setRow("licences", i, { country: e.target.value })} />
                </Field>
                <Field label="Tier">
                  <select
                    className={inputClass}
                    value={l.tier}
                    onChange={(e) => setRow("licences", i, { tier: e.target.value })}
                  >
                    {LICENCE_TIERS.map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Licence number">
                  <input className={inputClass} value={l.licenceNumber} onChange={(e) => setRow("licences", i, { licenceNumber: e.target.value })} />
                </Field>
                <Field label="Licensed entity">
                  <input className={inputClass} value={l.entity} placeholder="Example Markets Ltd" onChange={(e) => setRow("licences", i, { entity: e.target.value })} />
                </Field>
                <Field label="Checked on">
                  <input type="date" className={inputClass} value={l.checkedAt} onChange={(e) => setRow("licences", i, { checkedAt: e.target.value })} />
                </Field>
                <Field label="Register link" className="sm:col-span-3">
                  <input type="url" className={inputClass} value={l.registerUrl} placeholder="https://register.fca.org.uk/..." onChange={(e) => setRow("licences", i, { registerUrl: e.target.value })} />
                </Field>
              </div>
            </RowCard>
          ))}
          <AddButton onClick={() => set({ licences: [...value.licences, blankLicence()] })}>Add licence</AddButton>

          <h3 className="pt-2 text-sm font-semibold text-gray-200">Account types</h3>
          {value.accountTypes.map((a, i) => (
            <RowCard key={i} title={a.name || `Account ${i + 1}`} onRemove={() => removeRow("accountTypes", i)}>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Name">
                  <input className={inputClass} value={a.name} placeholder="Raw" onChange={(e) => setRow("accountTypes", i, { name: e.target.value })} />
                </Field>
                <Field label="Min deposit (USD)">
                  <input type="number" min="0" className={inputClass} value={a.minDeposit} onChange={(e) => setRow("accountTypes", i, { minDeposit: e.target.value })} />
                </Field>
                <Field label="Spread from (pips)">
                  <input type="number" min="0" step="0.01" className={inputClass} value={a.spreadFrom} onChange={(e) => setRow("accountTypes", i, { spreadFrom: e.target.value })} />
                </Field>
                <Field label="Commission">
                  <input className={inputClass} value={a.commission} placeholder="$3.50 per lot per side" onChange={(e) => setRow("accountTypes", i, { commission: e.target.value })} />
                </Field>
              </div>
            </RowCard>
          ))}
          <AddButton onClick={() => set({ accountTypes: [...value.accountTypes, blankAccountType()] })}>Add account type</AddButton>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <Field label="Max leverage">
              <input className={inputClass} value={value.maxLeverage} placeholder="1:500 (1:30 for EU clients)" onChange={(e) => set({ maxLeverage: e.target.value })} />
            </Field>
            <Field label="Deposit methods (comma-separated)">
              <input className={inputClass} value={value.depositMethods} placeholder="Card, Bank transfer, Skrill" onChange={(e) => set({ depositMethods: e.target.value })} />
            </Field>
            <Field label="Withdrawal methods (comma-separated)">
              <input className={inputClass} value={value.withdrawalMethods} placeholder="Card, Bank transfer" onChange={(e) => set({ withdrawalMethods: e.target.value })} />
            </Field>
          </div>
        </div>
      )}

      {isPropFirm && (
        <div className="rounded-2xl border border-white/10 bg-gray-950/30 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200">Challenges</h3>
          <p className="text-xs text-gray-500">
            One entry per account size. These power the challenge filter (account size, max price) on the prop firm list.
          </p>
          {value.challenges.map((c, i) => (
            <RowCard key={i} title={c.name || `Challenge ${i + 1}`} onRemove={() => removeRow("challenges", i)}>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Name" className="sm:col-span-2">
                  <input className={inputClass} value={c.name} placeholder="2-Step 100K" onChange={(e) => setRow("challenges", i, { name: e.target.value })} />
                </Field>
                <Field label="Account size">
                  <input type="number" min="0" className={inputClass} value={c.accountSize} placeholder="100000" onChange={(e) => setRow("challenges", i, { accountSize: e.target.value })} />
                </Field>
                <Field label="Currency">
                  <input className={inputClass} value={c.currency} maxLength={3} onChange={(e) => setRow("challenges", i, { currency: e.target.value.toUpperCase() })} />
                </Field>
                <Field label="Price">
                  <input type="number" min="0" step="0.01" className={inputClass} value={c.price} onChange={(e) => setRow("challenges", i, { price: e.target.value })} />
                </Field>
                <Field label="Profit split (%)">
                  <input type="number" min="0" max="100" className={inputClass} value={c.profitSplit} onChange={(e) => setRow("challenges", i, { profitSplit: e.target.value })} />
                </Field>
                <Field label="Drawdown type">
                  <select
                    className={inputClass}
                    value={c.drawdownType}
                    onChange={(e) => setRow("challenges", i, { drawdownType: e.target.value })}
                  >
                    {DRAWDOWN_TYPES.map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Payout frequency">
                  <input className={inputClass} value={c.payoutFrequency} placeholder="Every 14 days" onChange={(e) => setRow("challenges", i, { payoutFrequency: e.target.value })} />
                </Field>
                <Field label="Platforms (comma-separated)" className="sm:col-span-3">
                  <input className={inputClass} value={c.platforms} placeholder="MT5, cTrader" onChange={(e) => setRow("challenges", i, { platforms: e.target.value })} />
                </Field>
                <label className="flex items-center gap-2 self-end pb-1 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={Boolean(c.refundableFee)}
                    onChange={(e) => setRow("challenges", i, { refundableFee: e.target.checked })}
                  />
                  Fee refunded
                </label>
              </div>

              <div className="space-y-2">
                <span className={labelClass}>Phases: profit target %, daily drawdown %, max drawdown %, minimum trading days</span>
                {c.phases.map((p, pi) => (
                  <div key={pi} className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] sm:items-center">
                    <span className="text-xs text-gray-500 col-span-2 sm:col-span-1">Phase {pi + 1}</span>
                    {[
                      ["profitTarget", "Profit target"],
                      ["dailyDrawdown", "Daily DD"],
                      ["maxDrawdown", "Max DD"],
                      ["minTradingDays", "Min days"],
                    ].map(([key, label]) => (
                      <input
                        key={key}
                        type="number"
                        min="0"
                        step="0.1"
                        aria-label={`Phase ${pi + 1} ${label}`}
                        placeholder={label}
                        className={inputClass}
                        value={p[key]}
                        onChange={(e) =>
                          setRow("challenges", i, {
                            phases: c.phases.map((ph, j) => (j === pi ? { ...ph, [key]: e.target.value } : ph)),
                          })
                        }
                      />
                    ))}
                    <button
                      type="button"
                      className="text-gray-500 hover:text-red-400 justify-self-start"
                      aria-label={`Remove phase ${pi + 1}`}
                      onClick={() => setRow("challenges", i, { phases: c.phases.filter((_, j) => j !== pi) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {c.phases.length < 5 && (
                  <AddButton onClick={() => setRow("challenges", i, { phases: [...c.phases, blankPhase()] })}>Add phase</AddButton>
                )}
              </div>
            </RowCard>
          ))}
          <AddButton onClick={() => set({ challenges: [...value.challenges, blankChallenge()] })}>Add challenge</AddButton>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Field label="Payout methods (comma-separated)">
              <input className={inputClass} value={value.payoutMethods} placeholder="Rise, Crypto, Bank transfer" onChange={(e) => set({ payoutMethods: e.target.value })} />
            </Field>
            <Field label="Scaling plan">
              <input className={inputClass} value={value.scalingPlan} placeholder="+25% every 4 months with 10% profit" onChange={(e) => set({ scalingPlan: e.target.value })} />
            </Field>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-gray-950/30 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-200">Pros, cons and availability</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pros (one per line)">
            <textarea rows={4} className="textarea textarea-bordered w-full border-white/10 bg-gray-950/40 text-white text-sm" value={value.pros} onChange={(e) => set({ pros: e.target.value })} />
          </Field>
          <Field label="Cons (one per line)">
            <textarea rows={4} className="textarea textarea-bordered w-full border-white/10 bg-gray-950/40 text-white text-sm" value={value.cons} onChange={(e) => set({ cons: e.target.value })} />
          </Field>
          <Field label="Restricted countries (comma-separated)">
            <input className={inputClass} value={value.restrictedCountries} placeholder="United States, Canada" onChange={(e) => set({ restrictedCountries: e.target.value })} />
          </Field>
          <Field label="Details checked on">
            <input type="date" className={inputClass} value={value.dataCheckedAt} onChange={(e) => set({ dataCheckedAt: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  );
}
