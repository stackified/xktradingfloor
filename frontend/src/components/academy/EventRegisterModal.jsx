import React from "react";
import { X, ExternalLink, CheckCircle2 } from "lucide-react";
import { registerEventLead } from "../../controllers/eventsController.js";
import { countryOptions } from "../../utils/countries.js";
import { formatEventWhen } from "../../utils/eventTime.js";

// Event registration form (client, 2 Oct 2026). Anyone can register, no XK
// account needed. Full name and email are required, phone and company are
// optional, country is required, and the consent box starts unticked. After
// sending, events with their own organiser registration show that link.

const EMPTY = { fullName: "", email: "", phone: "", country: "", company: "", consent: false, website: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT =
  "w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 " +
  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function Field({ id, label, optional, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-200">
        {label}
        {optional ? <span className="ml-1 font-normal text-gray-400">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EventRegisterModal({ isOpen, onClose, event }) {
  const [form, setForm] = React.useState(EMPTY);
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [done, setDone] = React.useState(null);
  const firstFieldRef = React.useRef(null);
  // Kept in a ref so the open/close effect below doesn't re-run (and steal
  // focus back to the first field) every time the parent re-renders.
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const countries = React.useMemo(() => countryOptions(), []);

  const eventId = event?._id || event?.id;
  const externalUrl = (done?.externalUrl || event?.externalUrl || "").trim();

  React.useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY);
      setErrors({});
      setSubmitError("");
      setDone(null);
      return undefined;
    }
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: "" }));
  };

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Enter your full name.";
    if (!form.email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.country) next.country = "Choose your country.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await registerEventLead(eventId, form);
      setDone(result || {});
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const when = formatEventWhen(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-register-title"
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-gray-700 bg-gray-950 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-400" aria-hidden="true" />
            <h2 id="event-register-title" className="font-display text-xl font-bold text-white">
              You're registered
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Thanks, {form.fullName.trim().split(" ")[0]}. We've saved your registration for{" "}
              <span className="text-white">{event?.title}</span> and will be in touch at {form.email.trim()}.
            </p>
            {externalUrl ? (
              <>
                <p className="mt-5 text-sm text-gray-300">
                  This event also has its own registration with the organiser. Complete it there to get your
                  ticket or badge:
                </p>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-3 inline-flex items-center justify-center gap-2 rounded-full"
                >
                  Official event registration
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </>
            ) : null}
            <button type="button" onClick={onClose} className="mt-5 block w-full text-sm text-gray-400 hover:text-white">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 pr-8">
              <p className="text-sm text-gray-400">Register for</p>
              <h2 id="event-register-title" className="font-display text-lg font-bold text-white">
                {event?.title || "this event"}
              </h2>
              {when ? <p className="mt-1 text-xs text-gray-400">{when}</p> : null}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <Field id="reg-name" label="Full name" error={errors.fullName}>
                <input
                  ref={firstFieldRef}
                  id="reg-name"
                  className={INPUT}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={set("fullName")}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "reg-name-error" : undefined}
                  maxLength={120}
                />
              </Field>
              <Field id="reg-email" label="Email address" error={errors.email}>
                <input
                  id="reg-email"
                  type="email"
                  className={INPUT}
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "reg-email-error" : undefined}
                  maxLength={160}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="reg-phone" label="Phone number" optional>
                  <input
                    id="reg-phone"
                    type="tel"
                    className={INPUT}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    maxLength={32}
                  />
                </Field>
                <Field id="reg-country" label="Country" error={errors.country}>
                  <select
                    id="reg-country"
                    className={INPUT}
                    autoComplete="country-name"
                    value={form.country}
                    onChange={set("country")}
                    aria-invalid={Boolean(errors.country)}
                    aria-describedby={errors.country ? "reg-country-error" : undefined}
                  >
                    <option value="">Choose…</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field id="reg-company" label="Company / organisation" optional>
                <input
                  id="reg-company"
                  className={INPUT}
                  autoComplete="organization"
                  value={form.company}
                  onChange={set("company")}
                  maxLength={120}
                />
              </Field>

              {/* Honeypot for bots: hidden from people and screen readers. */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="reg-website">Website</label>
                <input id="reg-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
              </div>

              <label htmlFor="reg-consent" className="flex items-start gap-3 text-sm text-gray-300">
                <input
                  id="reg-consent"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-900"
                  checked={form.consent}
                  onChange={set("consent")}
                />
                <span>I agree that XK Trading Floor can contact me about this and similar events.</span>
              </label>

              {submitError ? (
                <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {submitError}
                </p>
              ) : null}

              <button type="submit" className="btn btn-primary w-full rounded-full" disabled={submitting}>
                {submitting ? "Registering…" : "Register"}
              </button>
              <p className="text-center text-xs text-gray-400">
                We use your details for this event only, unless you tick the box above. See our{" "}
                <a href="/privacy-policy" className="text-blue-400 hover:text-blue-300">
                  privacy policy
                </a>
                .
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default EventRegisterModal;
