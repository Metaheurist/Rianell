/** Plan 04 L5 — Open Food Facts barcode lookup (free tier, no API key). */

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product';

export async function fetchOpenFoodFactsProduct(barcode, fetchImpl = globalThis.fetch) {
  const code = String(barcode || '').replace(/\D/g, '');
  if (code.length < 8) throw new Error('Invalid barcode');
  if (typeof fetchImpl !== 'function') throw new Error('fetch unavailable');
  const res = await fetchImpl(`${OFF_API}/${code}.json`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Rianell/1.0 (health PWA; contact: support@rianell.com)' },
  });
  if (!res.ok) throw new Error(`Open Food Facts HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) throw new Error('Product not found');
  const p = data.product;
  const name = p.product_name || p.generic_name || p.brands || 'Unknown product';
  const brand = typeof p.brands === 'string' ? p.brands.split(',')[0].trim() : '';
  return {
    barcode: code,
    name: String(name).trim().slice(0, 200),
    brand: brand.slice(0, 120),
    nutriScore: typeof p.nutriscore_grade === 'string' ? p.nutriscore_grade.toUpperCase().slice(0, 1) : undefined,
    serving: typeof p.serving_size === 'string' ? p.serving_size.slice(0, 80) : undefined,
  };
}

export function formatBarcodeFoodLabel(product) {
  if (!product || typeof product !== 'object') return '';
  const parts = [product.brand, product.name].filter(Boolean);
  return parts.join(', ').slice(0, 200);
}
