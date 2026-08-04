// Open Food Facts client. Every call is best-effort: network failures and
// missing fields are handled gracefully, never thrown up to the UI as a
// crash — callers get { ok: false, error } instead.

function per100(nutriments) {
  const n = nutriments || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = n[k];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
  };
  return {
    kcal100: pick("energy-kcal_100g", "energy-kcal_value", "energy_100g"),
    protein100: pick("proteins_100g"),
    carbs100: pick("carbohydrates_100g"),
    fat100: pick("fat_100g"),
  };
}

function productToFood(p) {
  if (!p) return null;
  const macros = per100(p.nutriments);
  // Require at least a calorie value — a food with no usable macros is not
  // worth caching.
  if (macros.kcal100 == null) return null;
  return {
    name: p.product_name || p.generic_name || "Unknown product",
    brand: p.brands || "",
    kcal100: macros.kcal100 ?? 0,
    protein100: macros.protein100 ?? 0,
    carbs100: macros.carbs100 ?? 0,
    fat100: macros.fat100 ?? 0,
    source: "off",
    code: p.code || p._code || undefined,
  };
}

function offline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export async function searchFoods(query) {
  if (offline()) return { ok: false, error: "You're offline — search needs a network connection." };
  const q = query.trim();
  if (!q) return { ok: true, items: [] };

  const v2Url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(
    q
  )}&fields=code,product_name,brands,nutriments&page_size=20`;

  try {
    const res = await fetchWithTimeout(v2Url);
    if (res.ok) {
      const data = await res.json();
      const products = Array.isArray(data.products) ? data.products : null;
      if (products) {
        const items = products.map(productToFood).filter(Boolean);
        return { ok: true, items };
      }
    }
  } catch {
    /* fall through to legacy endpoint */
  }

  const legacyUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q
  )}&search_simple=1&action=process&json=1&page_size=20`;
  try {
    const res = await fetchWithTimeout(legacyUrl);
    if (!res.ok) return { ok: false, error: `Search failed (${res.status}).` };
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const items = products.map(productToFood).filter(Boolean);
    return { ok: true, items };
  } catch {
    return { ok: false, error: "Could not reach Open Food Facts. Check your connection." };
  }
}

export async function lookupBarcode(code) {
  if (offline()) return { ok: false, error: "You're offline — barcode lookup needs a network connection." };
  const c = code.trim();
  if (!c) return { ok: false, error: "Enter a barcode number." };
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(c)}.json`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return { ok: false, error: `Lookup failed (${res.status}).` };
    const data = await res.json();
    if (!data.product || data.status === 0) return { ok: false, error: "No product found for that barcode." };
    const food = productToFood({ ...data.product, code: data.product.code || c });
    if (!food) return { ok: false, error: "Product found, but it has no calorie data." };
    return { ok: true, item: food };
  } catch {
    return { ok: false, error: "Could not reach Open Food Facts. Check your connection." };
  }
}

function fetchWithTimeout(url, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}
