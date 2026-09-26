// Small stale-while-revalidate cache for public GET-style API calls.
//
// Why: the backend sleeps when idle and can take 30–60s to wake, and several
// components on one page ask for the same data. With this, identical requests
// in flight are shared, and a recent answer is shown straight away — the
// blog, a post or the broker list appears instantly for returning visitors,
// even while the backend is still waking up — then refreshed quietly in the
// background so the next view is current.
//
// Entries live in memory, and (when `persist`) in localStorage so they
// survive a reload. Keep it to public data: admin views pass persist:false and
// a short maxAge.

const MAX_PERSISTED_BYTES = 300 * 1024; // don't store huge payloads
const MAX_ENTRIES_PER_NAMESPACE = 20;

const memory = new Map(); // `${ns}:${key}` -> { t, data }
const inflight = new Map();

function storeKey(ns) {
  return `xk_cache_${ns}_v1`;
}

function readStore(ns) {
  try {
    return JSON.parse(localStorage.getItem(storeKey(ns)) || "{}");
  } catch {
    return {};
  }
}

function writeStore(ns, key, entry) {
  try {
    const json = JSON.stringify(entry);
    if (json.length > MAX_PERSISTED_BYTES) return;
    const store = { ...readStore(ns), [key]: entry };
    const newest = Object.keys(store)
      .sort((a, b) => store[b].t - store[a].t)
      .slice(0, MAX_ENTRIES_PER_NAMESPACE);
    localStorage.setItem(storeKey(ns), JSON.stringify(Object.fromEntries(newest.map((k) => [k, store[k]]))));
  } catch {
    // Storage full or blocked (private mode) — the memory cache still works.
  }
}

export function clearCache(ns) {
  for (const k of [...memory.keys()]) if (k.startsWith(`${ns}:`)) memory.delete(k);
  try {
    localStorage.removeItem(storeKey(ns));
  } catch {
    // ignore
  }
}

/**
 * Resolve `request()` (an axios call) through the cache.
 * Only successful responses (`data.success !== false`) are cached.
 * Returns an axios-like `{ data }`.
 */
export function cachedRequest(ns, key, request, { maxAge = 10 * 60 * 1000, refreshAfter = 60 * 1000, persist = true } = {}) {
  const id = `${ns}:${key}`;
  let entry = memory.get(id);
  if (!entry && persist) {
    entry = readStore(ns)[key];
    if (entry) memory.set(id, entry);
  }

  const fetchFresh = () => {
    if (inflight.has(id)) return inflight.get(id);
    const p = Promise.resolve()
      .then(request)
      .then((res) => {
        if (res?.data && res.data.success !== false) {
          const fresh = { t: Date.now(), data: res.data };
          memory.set(id, fresh);
          if (persist) writeStore(ns, key, fresh);
        }
        return res;
      })
      .finally(() => inflight.delete(id));
    inflight.set(id, p);
    return p;
  };

  const age = entry ? Date.now() - entry.t : Infinity;
  if (age < maxAge) {
    if (age > refreshAfter) fetchFresh().catch(() => {});
    return Promise.resolve({ data: entry.data });
  }
  return fetchFresh();
}
