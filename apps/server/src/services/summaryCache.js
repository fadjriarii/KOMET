/**
 * Cache respons ringkasan per proses. Sync membersihkannya, jadi TTL hanya
 * jaring pengaman untuk perubahan data di luar alur sync.
 */
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 100;
const stores = new Map();

function keyFor(query = {}) {
  const params = new URLSearchParams();
  for (const key of Object.keys(query).sort()) {
    const values = (Array.isArray(query[key]) ? query[key] : [query[key]])
      .filter((value) => value !== undefined && value !== null)
      .map(String)
      .sort();
    for (const value of values) params.append(key, value);
  }
  return params.toString();
}

function storeFor(namespace) {
  if (!stores.has(namespace)) {
    stores.set(namespace, { entries: new Map(), inflight: new Map() });
  }
  return stores.get(namespace);
}

async function getOrLoad(namespace, query, load) {
  const store = storeFor(namespace);
  const key = keyFor(query);
  const hit = store.entries.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  if (store.inflight.has(key)) return store.inflight.get(key);

  const pending = (async () => {
    try {
      const value = await load();
      store.entries.set(key, { value, expiresAt: Date.now() + TTL_MS });
      if (store.entries.size > MAX_ENTRIES) {
        store.entries.delete(store.entries.keys().next().value);
      }
      return value;
    } finally {
      store.inflight.delete(key);
    }
  })();

  store.inflight.set(key, pending);
  return pending;
}

function clearSummaryCaches() {
  // Ganti store, bukan cuma clear: promise yang masih berjalan menulis ke store
  // lama dan tidak boleh mengisi ulang cache dengan data sebelum sync.
  for (const namespace of stores.keys()) {
    stores.set(namespace, { entries: new Map(), inflight: new Map() });
  }
}

module.exports = { getOrLoad, clearSummaryCaches, keyFor, TTL_MS, MAX_ENTRIES };
