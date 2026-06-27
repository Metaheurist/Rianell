/** Plan 04 L5 / Plan 17 NU1 — Open Food Facts barcode lookup + full-text search. */

const OFF_PRODUCT_API = 'https://world.openfoodfacts.org/api/v2/product';
const OFF_SEARCH_API = 'https://world.openfoodfacts.org/cgi/search.pl';

const OFF_USER_AGENT = 'Rianell/1.0 (health PWA; contact: support@rianell.com)';

function parseNutrients(nutriments = {}) {
  const n = nutriments && typeof nutriments === 'object' ? nutriments : {};
  return {
    energy_kcal: numOrUndef(n['energy-kcal_100g'] ?? n['energy-kcal']),
    proteins_g: numOrUndef(n.proteins_100g ?? n.proteins),
    carbohydrates_g: numOrUndef(n.carbohydrates_100g ?? n.carbohydrates),
    fat_g: numOrUndef(n.fat_100g ?? n.fat),
    fiber_g: numOrUndef(n.fiber_100g ?? n.fiber),
  };
}

function numOrUndef(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : undefined;
}

function mapProduct(p, barcode) {
  const name = p.product_name || p.generic_name || p.brands || 'Unknown product';
  const brand = typeof p.brands === 'string' ? p.brands.split(',')[0].trim() : '';
  const nutrients = parseNutrients(p.nutriments);
  const tags = Array.isArray(p.labels_tags) ? p.labels_tags.filter((t) => typeof t === 'string') : [];
  return {
    barcode: String(barcode || p.code || '').replace(/\D/g, ''),
    name: String(name).trim().slice(0, 200),
    brand: brand.slice(0, 120),
    nutriScore: typeof p.nutriscore_grade === 'string' ? p.nutriscore_grade.toUpperCase().slice(0, 1) : undefined,
    serving: typeof p.serving_size === 'string' ? p.serving_size.slice(0, 80) : undefined,
    nutrients,
    fodmap_tags: tags.filter((t) => t.includes('fodmap')).map((t) => t.replace(/^en:/, '')),
  };
}

export async function fetchOpenFoodFactsProduct(barcode, fetchImpl = globalThis.fetch) {
  const code = String(barcode || '').replace(/\D/g, '');
  if (code.length < 8) throw new Error('Invalid barcode');
  if (typeof fetchImpl !== 'function') throw new Error('fetch unavailable');
  const res = await fetchImpl(`${OFF_PRODUCT_API}/${code}.json`, {
    headers: { Accept: 'application/json', 'User-Agent': OFF_USER_AGENT },
  });
  if (!res.ok) throw new Error(`Open Food Facts HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) throw new Error('Product not found');
  return mapProduct(data.product, code);
}

/** Alias for plan spec compatibility. */
export const lookupBarcode = fetchOpenFoodFactsProduct;

/**
 * Full-text search on Open Food Facts (SSRF-safe: hardcoded host).
 * @param {string} query
 * @param {number} [page]
 * @returns {Promise<Array<{barcode:string,name:string,brand:string,nutrients:object,fodmap_tags?:string[]}>>}
 */
export async function searchFood(query, page = 1, fetchImpl = globalThis.fetch) {
  const q = String(query || '').trim().slice(0, 120);
  if (!q) return [];
  if (typeof fetchImpl !== 'function') throw new Error('fetch unavailable');
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    page: String(Math.max(1, Math.min(20, Number(page) || 1))),
  });
  const url = `${OFF_SEARCH_API}?${params.toString()}`;
  if (!url.startsWith(OFF_SEARCH_API)) throw new Error('Invalid search URL');
  const res = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'User-Agent': OFF_USER_AGENT },
  });
  if (!res.ok) throw new Error(`Open Food Facts search HTTP ${res.status}`);
  const data = await res.json();
  const products = Array.isArray(data.products) ? data.products : [];
  return products
    .filter((p) => p && (p.product_name || p.generic_name))
    .slice(0, 20)
    .map((p) => mapProduct(p, p.code || p._id));
}

export function formatBarcodeFoodLabel(product) {
  if (!product || typeof product !== 'object') return '';
  const parts = [product.brand, product.name].filter(Boolean);
  return parts.join(', ').slice(0, 200);
}

function parseServingGrams(serving) {
  if (typeof serving !== 'string' || !serving.trim()) return null;
  const gMatch = serving.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
  if (gMatch) {
    const n = Number(String(gMatch[1]).replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return Math.min(500, Math.round(n * 10) / 10);
  }
  return null;
}

/**
 * Map Open Food Facts product to a log food item (name + calories + protein like predefined tiles).
 * Uses per-100g nutrients; scales by serving grams when parseable, otherwise 100 g portion.
 */
export function barcodeProductToFoodItem(product) {
  if (!product || typeof product !== 'object') {
    return { name: '', calories: undefined, protein: undefined, barcode: '' };
  }
  const baseName = formatBarcodeFoodLabel(product);
  const nutrients = product.nutrients && typeof product.nutrients === 'object' ? product.nutrients : {};
  const grams = parseServingGrams(product.serving) ?? 100;
  const factor = grams / 100;
  let name = baseName;
  if (product.serving && grams !== 100) {
    name = `${baseName} (${String(product.serving).slice(0, 48)})`;
  } else if (grams === 100 && !product.serving) {
    name = `${baseName} (100g)`;
  }
  const calories = nutrients.energy_kcal != null
    ? Math.round(nutrients.energy_kcal * factor)
    : undefined;
  const protein = nutrients.proteins_g != null
    ? Math.round(nutrients.proteins_g * factor * 10) / 10
    : undefined;
  return {
    name: name.slice(0, 200),
    calories,
    protein,
    barcode: String(product.barcode || '').replace(/\D/g, ''),
    source: 'barcode',
  };
}
