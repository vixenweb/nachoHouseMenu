(() => {
  const form = document.getElementById('price-form');
  const container = document.getElementById('menu-container');
  const status = document.getElementById('status');
  const saveButton = document.getElementById('save-button');

  const icons = { food: '🍔', drinks: '☕' };
  const labels = { food: 'منوی غذا', drinks: 'منوی نوشیدنی' };
  let items = [];

  const setStatus = (message, type='') => {
    status.textContent = message;
    status.className = `admin-status ${type}`;
  };

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function render() {
    const groups = new Map();
    for (const item of items) {
      const key = `${item.menu_type}:${item.category_id}`;
      if (!groups.has(key)) groups.set(key, { menu_type:item.menu_type, category_id:item.category_id, category_name:item.category_name, items:[] });
      groups.get(key).items.push(item);
    }
    const sections = [...groups.values()].map(group => `
      <section class="admin-category">
        <div class="admin-category-head">
          <span class="category-icon">${icons[group.menu_type] || '🍽️'}</span>
          <h3 class="admin-category-title">${escapeHtml(group.category_name)}</h3>
        </div>
        ${group.items.map(item => `
          <div class="admin-item">
            <div>
              <div class="admin-item-name">${escapeHtml(item.name)}</div>
              ${item.description ? `<div class="admin-item-desc">${escapeHtml(item.description)}</div>` : ''}
            </div>
            <div class="price-input-wrap">
              <input class="price-input" inputmode="numeric" pattern="[0-9]*" min="0" step="1" type="number" name="${escapeHtml(item.id)}" value="${Number(item.price) || 0}" aria-label="قیمت ${escapeHtml(item.name)}">
              <span class="rial-label">ریال</span>
            </div>
          </div>`).join('')}
      </section>`).join('');
    container.innerHTML = sections;
  }

  async function load() {
    setStatus('در حال دریافت قیمت‌ها…', 'loading');
    try {
      const res = await fetch('/api/admin/prices', { headers: { 'Accept':'application/json' }, cache:'no-store' });
      if (res.status === 401) { setStatus('دسترسی نیاز به ورود دارد.', 'error'); return; }
      if (!res.ok) throw new Error('load');
      const data = await res.json();
      items = data.items || [];
      render();
      setStatus(`تعداد ${items.length} آیتم آماده ویرایش است.`, 'success');
    } catch (_) {
      setStatus('دریافت اطلاعات انجام نشد. اتصال یا تنظیمات Cloudflare را بررسی کنید.', 'error');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    setStatus('در حال ذخیره قیمت‌ها…', 'loading');
    const payload = items.map(item => {
      const input = form.elements[item.id];
      return { id:item.id, price:Number(input?.value) };
    });
    try {
      if (payload.some(x => !Number.isSafeInteger(x.price) || x.price < 0 || x.price > 1000000000000)) throw new Error('price');
      const res = await fetch('/api/admin/prices', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Accept':'application/json', 'X-Admin-Request':'1' },
        body:JSON.stringify({ items:payload })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'save');
      }
      setStatus('✓ همه قیمت‌ها با موفقیت ذخیره شدند.', 'success');
      window.scrollTo({top:0, behavior:'smooth'});
    } catch (error) {
      setStatus(error.message === 'price' ? 'یکی از قیمت‌ها معتبر نیست.' : `ذخیره انجام نشد: ${error.message}`, 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  load();
})();
