(function () {
  var OWNER = 'vixenweb';
  var REPO = 'nachoHouseMenu';
  var BRANCH = 'main';
  var FILE_PATH = 'prices.json';
  var API_BASE = 'https://api.github.com';
  var STORAGE_KEY = 'nachoAdminToken';

  // Category grouping + order, matching the public food.html / drinks.html pages.
  var GROUPS = [
    { title: 'برگر', icon: '🍔', ids: ['burger-classic','burger-spicy','burger-caramel','burger-cheese','burger-bacon','burger-chicken','burger-mushroom'] },
    { title: 'رویال کامبو', icon: '💥', ids: ['combo-royal'] },
    { title: 'ناچوز', icon: '🌮', ids: ['nacho-chicken','nacho-meat','nacho-mix'] },
    { title: 'پاستا', icon: '🍝', ids: ['pasta-alfredo-penne','pasta-alfredo-chicken'] },
    { title: 'سیب زمینی', icon: '🍟', ids: ['fries-classic','fries-alfredo','fries-alfredo-special','fries-bacon'] },
    { title: 'سالاد', icon: '🥗', ids: ['salad-caesar'] },
    { title: 'کافی', icon: '☕', ids: ['coffee-plain','coffee-espresso-single','coffee-espresso-double','coffee-americano','coffee-cappuccino','coffee-nescafe-milk','coffee-latte-biscuit','coffee-latte-macchiato','coffee-latte'] },
    { title: 'نوشیدنی سرد', icon: '🍹', ids: ['cold-lemonade','cold-redvelvet','cold-pinacolada','cold-mojito','cold-redmojito','cold-goldenberry','cold-bluesky'] },
    { title: 'نوشیدنی گرم', icon: '☕', ids: ['hot-chocolate','hot-pink-chocolate','hot-hazelnut','hot-milk-biscuit','hot-milk-honey','hot-tea-brewed','hot-tea-masala','hot-tea-kork'] },
    { title: 'ماچا اسپرولینا', icon: '🍵', ids: ['matcha-ice-spirulina-latte','matcha-ice-matcha-latte','matcha-spirulina-latte','matcha-latte'] },
    { title: 'شیک', icon: '🥤', ids: ['shake-vanilla','shake-chocolate','shake-nutella','shake-lotus','shake-strawberry','shake-banana-chocolate','shake-peanut'] },
    { title: 'بار سرد', icon: '🧊', ids: ['coldbar-ice-americano','coldbar-ice-macchiato','coldbar-ice-romano','coldbar-ice-latte','coldbar-affogato-classic','coldbar-affogato-lotus','coldbar-affogato-nutella'] },
  ];

  // ---------- UTF-8 safe base64 helpers (item names are in Persian) ----------
  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  // ---------- Number formatting helpers ----------
  function formatWithCommas(n) {
    if (n === null || n === undefined || n === '') return '';
    var num = Number(n);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  }

  function attachFormattingListeners() {
    var inputs = formEl.querySelectorAll('input[data-price-id]');
    inputs.forEach(function (inp) {
      inp.addEventListener('input', function (e) {
        var raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
        if (raw === '') { e.target.value = ''; return; }
        e.target.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      });
      // On blur, ensure formatting is applied (useful if pasted)
      inp.addEventListener('blur', function (e) {
        var raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
        e.target.value = raw === '' ? '' : raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      });
    });
  }
  function base64ToUtf8(b64) {
    var binary = atob(b64.replace(/\n/g, ''));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // ---------- Elements ----------
  var gateEl = document.getElementById('gate');
  var gateTokenEl = document.getElementById('gate-token');
  var gateRememberEl = document.getElementById('gate-remember');
  var gateBtnEl = document.getElementById('gate-btn');
  var gateErrorEl = document.getElementById('gate-error');
  var editorEl = document.getElementById('editor');
  var statusEl = document.getElementById('admin-status');
  var skeletonEl = document.getElementById('admin-skeleton');
  var formEl = document.getElementById('admin-form');
  var saveBtnEl = document.getElementById('admin-save-btn');
  var logoutBtnEl = document.getElementById('admin-logout-btn');

  var state = { token: null, sha: null, prices: null };

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'admin-status show ' + (kind || '');
  }

  function ghHeaders() {
    return {
      Authorization: 'token ' + state.token,
      Accept: 'application/vnd.github+json',
    };
  }

  function fetchFile() {
    var url = API_BASE + '/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH + '?ref=' + BRANCH;
    return fetch(url, { headers: ghHeaders() }).then(function (res) {
      if (!res.ok) {
        var err = new Error('fetch-failed');
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
  }

  function render(prices) {
    var frag = document.createDocumentFragment();
    GROUPS.forEach(function (group) {
      var section = document.createElement('div');
      section.className = 'admin-group';

      var h = document.createElement('h2');
      h.className = 'admin-group-title';
      h.textContent = group.icon + ' ' + group.title;
      section.appendChild(h);

      group.ids.forEach(function (id) {
        var entry = prices[id] || { name: id, amount: null };
        var row = document.createElement('div');
        row.className = 'admin-row';

        var label = document.createElement('label');
        label.setAttribute('for', 'price-' + id);
        label.textContent = entry.name;
        row.appendChild(label);

        var fieldWrap = document.createElement('div');
        fieldWrap.className = 'field';

        var input = document.createElement('input');
        // Use text input so we can show formatted numbers with commas as the
        // user requested. Use inputmode numeric for mobile keyboards.
        input.type = 'text';
        input.inputMode = 'numeric';
        input.id = 'price-' + id;
        input.dataset.priceId = id;
        input.placeholder = entry.amount !== null && entry.amount !== undefined ? formatWithCommas(entry.amount) : 'قیمت';
        // Leave value empty so previous price appears as a faded placeholder.
        input.value = '';
        fieldWrap.appendChild(input);

        var unit = document.createElement('span');
        unit.className = 'unit';
        unit.textContent = 'ریال';
        fieldWrap.appendChild(unit);

        row.appendChild(fieldWrap);
        section.appendChild(row);
      });

      frag.appendChild(section);
    });
    formEl.innerHTML = '';
    formEl.appendChild(frag);
    // Wire up formatting for the newly-created inputs
    attachFormattingListeners();
  }

  function unlock(token, remember) {
    gateErrorEl.classList.remove('show');
    gateBtnEl.disabled = true;
    gateBtnEl.textContent = 'در حال بررسی…';
    state.token = token;

    fetchFile()
      .then(function (file) {
        state.sha = file.sha;
        state.prices = JSON.parse(base64ToUtf8(file.content));

        if (remember) localStorage.setItem(STORAGE_KEY, token);

        gateEl.classList.add('hidden');
        editorEl.classList.remove('hidden');
        skeletonEl.style.display = 'none';
        render(state.prices);
      })
      .catch(function (err) {
        gateErrorEl.classList.add('show');
        if (err.status === 404) {
          gateErrorEl.textContent = 'فایل prices.json یا مخزن پیدا نشد. با توسعه دهنده تماس بگیرید.';
        } else {
          gateErrorEl.textContent = 'توکن نامعتبره. دوباره امتحان کنید.';
        }
      })
      .finally(function () {
        gateBtnEl.disabled = false;
        gateBtnEl.textContent = 'ورود به پنل';
      });
  }

  gateBtnEl.addEventListener('click', function () {
    var token = gateTokenEl.value.trim();
    if (!token) return;
    unlock(token, gateRememberEl.checked);
  });

  gateTokenEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') gateBtnEl.click();
  });

  logoutBtnEl.addEventListener('click', function () {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    saveBtnEl.disabled = true;
    setStatus('در حال ذخیره ', 'loading');

    var merged = {};
    Object.keys(state.prices).forEach(function (id) {
      var input = document.getElementById('price-' + id);
      var raw = input && input.value ? input.value.replace(/,/g, '').trim() : '';
      var val;
      if (raw !== '') {
        val = Number(raw);
      } else {
        // Preserve previous amount if the admin left the field empty
        val = state.prices[id] && state.prices[id].amount !== undefined ? state.prices[id].amount : null;
      }
      merged[id] = { name: (state.prices[id] && state.prices[id].name) || id, amount: val !== null && !isNaN(val) ? val : null };
    });

    var body = {
      message: 'chore: به‌روزرسانی قیمت‌های منو',
      content: utf8ToBase64(JSON.stringify(merged, null, 2)),
      sha: state.sha,
      branch: BRANCH,
    };

    fetch(API_BASE + '/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders()),
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (j) { throw new Error(j.message || 'save-failed'); });
        return res.json();
      })
      .then(function (json) {
        state.sha = json.content.sha;
        state.prices = merged;
        setStatus('ذخیره شد ✅ حدود ۱ دقیقه دیگه روی سایت میاد.', 'ok');
      })
      .catch(function (err) {
        setStatus('ذخیره‌سازی با خطا مواجه شد: ' + err.message, 'error');
      })
      .finally(function () {
        saveBtnEl.disabled = false;
      });
  });

  // Auto-unlock if a token was remembered on this device.
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    gateTokenEl.value = saved;
    unlock(saved, true);
  }
})();
