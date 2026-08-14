// Fills every [data-price-id] element with the live price from prices.json,
// a plain static file in this repo. The admin panel updates that file via a
// GitHub commit; GitHub Pages then redeploys automatically (~1 minute).
(function () {
  function toPersianDigits(str) {
    var fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(str).replace(/[0-9]/g, function (d) { return fa[d]; });
  }

  function formatAmount(n) {
    if (n === null || n === undefined || n === '' || isNaN(n)) return null;
    var grouped = Number(n).toLocaleString('en-US').replace(/,/g, '\u066C');
    return toPersianDigits(grouped);
  }

  fetch('prices.json', { cache: 'no-store' })
    .then(function (res) { if (!res.ok) throw new Error('bad response'); return res.json(); })
    .then(function (data) {
      document.querySelectorAll('[data-price-id]').forEach(function (node) {
        var entry = data[node.getAttribute('data-price-id')];
        var amountEl = node.querySelector('.price-amount');
        if (!amountEl) return;
        var formatted = entry ? formatAmount(entry.amount) : null;
        amountEl.textContent = formatted || 'به‌زودی';
      });
    })
    .catch(function () {
      // Leave the "—" placeholders in place if prices.json can't be loaded.
    });
})();

// Ensure category cards become visible even if a separate reveal script
// isn't present. Use IntersectionObserver when available, otherwise add
// the class immediately so `.category` doesn't stay at opacity: 0.
(function () {
  function revealCategories() {
    var cats = document.querySelectorAll('.category');
    if (!cats || cats.length === 0) return;
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      cats.forEach(function (c) { obs.observe(c); });
    } else {
      cats.forEach(function (c) { c.classList.add('in-view'); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealCategories);
  } else {
    revealCategories();
  }
})();
