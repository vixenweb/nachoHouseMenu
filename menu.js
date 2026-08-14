/* Nacho House — public price synchronizer. Prices are read from Cloudflare D1 through /api/menu. */
(() => {
  const toPersianDigits = (value) => String(value).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const formatRial = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return '۰۰۰٬۰۰۰';
    return new Intl.NumberFormat('fa-IR').format(Math.trunc(n));
  };

  async function syncPrices() {
    const nodes = document.querySelectorAll('[data-item-id] .item-price');
    if (!nodes.length) return;
    try {
      const response = await fetch('/api/menu', { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const prices = new Map(data.items.map(item => [item.id, item.price]));
      document.querySelectorAll('[data-item-id]').forEach(row => {
        const price = prices.get(row.dataset.itemId);
        const priceNode = row.querySelector('.item-price');
        if (priceNode && Number.isInteger(price) && price > 0) {
          priceNode.firstChild.textContent = formatRial(price);
        }
      });
    } catch (_) {
      // Static fallback remains visible if the API is temporarily unavailable.
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncPrices);
  else syncPrices();
})();
