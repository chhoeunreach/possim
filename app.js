(function () {
  'use strict';

  const TOKEN_KEY = 'pos_token';
  const USER_KEY = 'pos_user';

  const state = {
    currentShift: null,
    transactions: [],
    invoiceUrl: null
  };

  function $(id) { return document.getElementById(id); }

  // Use the i18n helper when available so toasts/JS strings respect the
  // selected language. Falls back to the original English string otherwise.
  function tr(key, vars, fallback) {
    try {
      if (window.I18N && typeof window.I18N.t === 'function') {
        const out = window.I18N.t(key, vars);
        if (out && out !== key) return out;
      }
    } catch (_) {}
    if (!fallback) return key;
    if (!vars) return fallback;
    return fallback.replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ('{' + k + '}');
    });
  }

  // Pluralization-aware variant for keys like 'admin.usersCount'
  function trCount(key, n, fallback) {
    try {
      if (window.I18N && typeof window.I18N.t === 'function') {
        const out = window.I18N.t(key, { n: n });
        if (out && out !== key) return out;
      }
    } catch (_) {}
    if (!fallback) return String(n);
    return n + ' ' + fallback.replace(/\{n\}\s*/, '');
  }

  function showToast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
  }

  function toastT(key, vars, type, fallback) {
    showToast(tr(key, vars, fallback), type);
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  function fmt(amount, currency) {
    const n = Number(amount) || 0;
    if (currency === 'USD') return '$' + n.toFixed(2);
    return '៛' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isAuthenticated() {
    return !!getToken();
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      showScreen('screen-login');
      return false;
    }
    return true;
  }

  function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
  }

  const api = {
    async request(method, url, body) {
      const token = getToken();
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (token) {
        opts.headers['Authorization'] = 'Bearer ' + token;
      }
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      if (res.status === 401 || res.status === 403) {
        clearAuth();
        showScreen('screen-login');
        throw new Error('Session expired. Please login again.');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    },

    login(username, password) {
      return this.request('POST', '/api/auth/login', { username, password });
    },

    getCurrentShift() { return this.request('GET', '/api/shifts/current'); },
    getShift(id) { return this.request('GET', '/api/shifts/' + id); },
    getTransactions(shiftId) { return this.request('GET', '/api/shifts/' + shiftId + '/transactions'); },
    createShift(data) { return this.request('POST', '/api/shifts', data); },
    createTransaction(data) { return this.request('POST', '/api/transactions', data); },
    closeShift(id, data) { return this.request('PUT', '/api/shifts/' + id + '/close', data); },

    getAdminShifts(branch) {
      let url = '/api/admin/shifts';
      if (branch) url += '?branch=' + encodeURIComponent(branch);
      return this.request('GET', url);
    },
    getAdminTransactions() { return this.request('GET', '/api/admin/transactions'); },
    getAdminLogs() { return this.request('GET', '/api/admin/logs'); },
    createUser(data) { return this.request('POST', '/api/admin/users', data); },
    getUsers() { return this.request('GET', '/api/admin/users'); },
    updateUser(id, data) { return this.request('PUT', '/api/admin/users/' + id, data); },
    deleteUser(id) { return this.request('DELETE', '/api/admin/users/' + id); },

    async uploadInvoice(file) {
      const token = getToken();
      const fd = new FormData();
      fd.append('invoice', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
        body: fd
      });
      if (res.status === 401 || res.status === 403) {
        clearAuth();
        showScreen('screen-login');
        throw new Error('Session expired. Please login again.');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    }
  };

  function compressImage(file, maxDimension, quality) {
    if (!file.type.startsWith('image/')) {
      return Promise.resolve(file);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round(height * maxDimension / width);
              width = maxDimension;
            } else {
              width = Math.round(width * maxDimension / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(function (blob) {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', quality);
        };
        img.onerror = function () {
          resolve(file);
        };
        img.src = e.target.result;
      };
      reader.onerror = function () {
        resolve(file);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = $('input-login-username').value.trim();
    const password = $('input-login-password').value;

    if (!username || !password) {
      toastT('login.err.empty', null, 'error', 'Please enter username and password');
      return;
    }

    try {
      const result = await api.login(username, password);
      setAuth(result.token, result.user);
      toastT('login.ok', { name: result.user.username }, 'success', 'Welcome, ' + result.user.username);
      $('input-login-username').value = '';
      $('input-login-password').value = '';
      routeAfterLogin();
    } catch (err) {
      const msg = (err && err.message) || '';
      if (/invalid/i.test(msg)) {
        toastT('login.err.cred', null, 'error', msg);
      } else {
        showToast(msg || 'Login failed', 'error');
      }
    }
  }

  function routeAfterLogin() {
    if (isAdmin()) {
      showAdminDashboard();
      showScreen('screen-admin');
    } else {
      checkExistingShift();
    }
  }

  async function handleOpenShift(e) {
    e.preventDefault();
    if (!requireAuth()) return;

    const branch = $('input-branch').value;
    if (!branch) { toastT('open.err.branch', null, 'error', 'Please select a branch'); return; }

    const openingPhotoUrl = ($('input-opening-photo-url').value || '').trim() || null;

    try {
      const shift = await api.createShift({
        branch_name: branch,
        opening_usd: parseFloat($('input-opening-usd').value) || 0,
        opening_khr: parseFloat($('input-opening-khr').value) || 0,
        opening_photo_url: openingPhotoUrl
      });
      state.currentShift = shift;
      toastT('open.ok', { branch: shift.branch_name }, 'success', 'Shift started at ' + shift.branch_name);
      resetOpeningUpload();
      await loadDashboard();
      showScreen('screen-dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function loadDashboard() {
    if (!requireAuth()) return;

    try {
      const shift = await api.getCurrentShift();
      if (!shift) {
        showScreen('screen-open-shift');
        return;
      }
      state.currentShift = shift;
      const txns = await api.getTransactions(shift.id);
      state.transactions = txns;

      const user = getUser();
      $('dash-branch-name').textContent = shift.branch_name;
      $('dash-staff-name').textContent = tr('dash.staff', { name: (user ? user.username : '') }, 'Staff: ' + (user ? user.username : ''));
      $('dash-shift-time').textContent = new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      $('dash-opening-usd').textContent = fmt(shift.opening_usd, 'USD');
      $('dash-opening-khr').textContent = fmt(shift.opening_khr, 'KHR');

      let usdCash = shift.opening_usd, usdBank = 0;
      let khrCash = shift.opening_khr, khrBank = 0;

      for (const t of txns) {
        const sign = t.type === 'inflow' ? 1 : -1;
        if (t.currency === 'USD') {
          if (t.payment_method === 'Cash') usdCash += sign * t.amount;
          else usdBank += sign * t.amount;
        } else {
          if (t.payment_method === 'Cash') khrCash += sign * t.amount;
          else khrBank += sign * t.amount;
        }
      }

      $('dash-usd-cash').textContent = fmt(usdCash, 'USD');
      $('dash-usd-bank').textContent = fmt(usdBank, 'USD');
      $('dash-khr-cash').textContent = fmt(khrCash, 'KHR');
      $('dash-khr-bank').textContent = fmt(khrBank, 'KHR');

      if (isAdmin()) {
        $('admin-nav-dash').classList.remove('hidden');
      } else {
        $('admin-nav-dash').classList.add('hidden');
      }

      renderTransactionList(txns);
    } catch (err) {
      toastT('dash.err.load', { msg: err.message }, 'error', 'Failed to load dashboard: ' + err.message);
    }
  }

  function renderTransactionList(txns, containerId) {
    const container = $(containerId || 'txn-list');
    if (!txns || !txns.length) {
      container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">' + tr('dash.empty', null, 'No transactions yet') + '</p>';
      return;
    }
    container.innerHTML = txns.slice(0, 50).map(t => {
      const isInflow = t.type === 'inflow';
      const color = isInflow ? 'text-emerald-600' : 'text-red-600';
      const sign = isInflow ? '+' : '-';
      const branchInfo = t.branch_name ? '<span class="text-xs text-gray-400">' + t.branch_name + '</span>' : '';
      return `
        <div class="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full ${isInflow ? 'bg-emerald-500' : 'bg-red-500'}"></span>
            <div>
              <p class="text-sm font-medium text-gray-800 capitalize">${t.type} · ${t.payment_method} ${branchInfo}</p>
              <p class="text-xs text-gray-400">${t.timestamp}${t.staff_name ? ' · ' + t.staff_name : ''}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold ${color}">${sign}${fmt(t.amount, t.currency)}</p>
            ${t.invoice_url ? '<a href="' + t.invoice_url + '" target="_blank" class="text-xs text-blue-500 hover:underline">View Invoice</a>' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function setupToggleButtons() {
    const groups = [
      { buttons: ['btn-type-inflow', 'btn-type-outflow'], input: 'input-type' },
      { buttons: ['btn-currency-usd', 'btn-currency-khr'], input: 'input-currency' },
      { buttons: ['btn-method-cash', 'btn-method-bank'], input: 'input-method' }
    ];

    groups.forEach(group => {
      group.buttons.forEach(id => {
        const btn = $(id);
        btn.addEventListener('click', function () {
          group.buttons.forEach(b => {
            $(b).classList.remove('selected');
          });
          this.classList.add('selected');
          $(group.input).value = this.dataset.value;
          if (group.input === 'input-currency') updateCurrencySymbols(this.dataset.value);
        });
      });
    });
  }

  function updateCurrencySymbols(currency) {
    const symbol = currency === 'KHR' ? '៛' : '$';
    const amountEl = $('amount-currency-symbol');
    const costEl = $('cost-currency-symbol');
    if (amountEl) amountEl.textContent = symbol;
    if (costEl) costEl.textContent = symbol;
  }

  async function handleTransaction(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!state.currentShift) { toastT('txn.err.noShift', null, 'error', 'No active shift'); return; }

    const type = $('input-type').value;
    const currency = $('input-currency').value;
    const method = $('input-method').value;
    const amount = parseFloat($('input-amount').value);
    const cost = parseFloat($('input-cost').value) || 0;

    if (isNaN(amount) || amount < 0) { toastT('txn.err.amount', null, 'error', 'Enter a valid amount'); return; }

    try {
      await api.createTransaction({
        shift_id: state.currentShift.id,
        type,
        currency,
        payment_method: method,
        amount,
        cost,
        invoice_url: state.invoiceUrl || null
      });
      state.invoiceUrl = null;
      $('input-invoice-url').value = '';
      $('input-amount').value = '0';
      $('input-cost').value = '0';
      resetUpload();
      toastT('txn.ok', null, 'success', 'Transaction recorded');
      await loadDashboard();
      showScreen('screen-dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function resetUpload() {
    $('input-invoice').value = '';
    $('upload-placeholder').classList.remove('hidden');
    $('upload-preview').classList.add('hidden');
    $('preview-image').src = '';
    $('upload-status').textContent = '';
    state.invoiceUrl = null;
  }

  function resetOpeningUpload() {
    $('input-opening-photo').value = '';
    $('upload-opening-placeholder').classList.remove('hidden');
    $('upload-opening-preview').classList.add('hidden');
    $('preview-opening-image').src = '';
    $('upload-opening-status').textContent = '';
    $('input-opening-photo-url').value = '';
  }

  function resetClosingUpload() {
    $('input-closing-photo').value = '';
    $('upload-closing-placeholder').classList.remove('hidden');
    $('upload-closing-preview').classList.add('hidden');
    $('preview-closing-image').src = '';
    $('upload-closing-status').textContent = '';
    $('input-closing-photo-url').value = '';
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    $('upload-status').textContent = tr('upload.compress', { size: formatBytes(file.size) }, 'Compressing (' + formatBytes(file.size) + ')...');

    try {
      const compressed = await compressImage(file, 1024, 0.65);

      const previewReader = new FileReader();
      previewReader.onload = function (ev) {
        $('preview-image').src = ev.target.result;
        $('upload-placeholder').classList.add('hidden');
        $('upload-preview').classList.remove('hidden');
      };
      previewReader.readAsDataURL(compressed);

      const sizeInfo = formatBytes(file.size) + ' \u2192 ' + formatBytes(compressed.size);
      $('upload-status').textContent = tr('upload.uploading', { size: sizeInfo }, 'Uploading (' + sizeInfo + ')...');

      const result = await api.uploadInvoice(compressed);
      state.invoiceUrl = result.url;
      $('input-invoice-url').value = result.url;
      $('upload-status').textContent = tr('upload.done', { size: sizeInfo }, 'Compressed: ' + sizeInfo + ' \u2014 Uploaded');
      toastT('upload.ok', { size: sizeInfo }, 'success', 'Invoice uploaded (' + sizeInfo + ')');
    } catch (err) {
      toastT('upload.err', { msg: err.message }, 'error', 'Upload failed: ' + err.message);
      $('upload-status').textContent = tr('upload.fail', null, 'Upload failed');
    }
  }

  async function handleOpeningPhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    $('upload-opening-status').textContent = tr('upload.compress', { size: formatBytes(file.size) }, 'Compressing (' + formatBytes(file.size) + ')...');

    try {
      const compressed = await compressImage(file, 1024, 0.65);

      const previewReader = new FileReader();
      previewReader.onload = function (ev) {
        $('preview-opening-image').src = ev.target.result;
        $('upload-opening-placeholder').classList.add('hidden');
        $('upload-opening-preview').classList.remove('hidden');
      };
      previewReader.readAsDataURL(compressed);

      const sizeInfo = formatBytes(file.size) + ' \u2192 ' + formatBytes(compressed.size);
      $('upload-opening-status').textContent = tr('upload.uploading', { size: sizeInfo }, 'Uploading (' + sizeInfo + ')...');

      const result = await api.uploadInvoice(compressed);
      $('input-opening-photo-url').value = result.url;
      $('upload-opening-status').textContent = tr('upload.done', { size: sizeInfo }, 'Compressed: ' + sizeInfo + ' \u2014 Uploaded');
      toastT('upload.opening.ok', { size: sizeInfo }, 'success', 'Opening photo uploaded (' + sizeInfo + ')');
    } catch (err) {
      toastT('upload.err', { msg: err.message }, 'error', 'Upload failed: ' + err.message);
      $('upload-opening-status').textContent = tr('upload.fail', null, 'Upload failed');
    }
  }

  async function handleClosingPhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    $('upload-closing-status').textContent = tr('upload.compress', { size: formatBytes(file.size) }, 'Compressing (' + formatBytes(file.size) + ')...');

    try {
      const compressed = await compressImage(file, 1024, 0.65);

      const previewReader = new FileReader();
      previewReader.onload = function (ev) {
        $('preview-closing-image').src = ev.target.result;
        $('upload-closing-placeholder').classList.add('hidden');
        $('upload-closing-preview').classList.remove('hidden');
      };
      previewReader.readAsDataURL(compressed);

      const sizeInfo = formatBytes(file.size) + ' \u2192 ' + formatBytes(compressed.size);
      $('upload-closing-status').textContent = tr('upload.uploading', { size: sizeInfo }, 'Uploading (' + sizeInfo + ')...');

      const result = await api.uploadInvoice(compressed);
      $('input-closing-photo-url').value = result.url;
      $('upload-closing-status').textContent = tr('upload.done', { size: sizeInfo }, 'Compressed: ' + sizeInfo + ' \u2014 Uploaded');
      toastT('upload.closing.ok', { size: sizeInfo }, 'success', 'Closing photo uploaded (' + sizeInfo + ')');
    } catch (err) {
      toastT('upload.err', { msg: err.message }, 'error', 'Upload failed: ' + err.message);
      $('upload-closing-status').textContent = tr('upload.fail', null, 'Upload failed');
    }
  }

  async function loadCloseShiftForm() {
    if (!requireAuth()) return;
    if (!state.currentShift) { toastT('close.err.noShift', null, 'error', 'No active shift'); return; }

    const user = getUser();
    $('close-shift-info').textContent = tr('close.info', { name: (user ? user.username : ''), branch: state.currentShift.branch_name }, (user ? user.username : '') + ' \u00b7 ' + state.currentShift.branch_name);

    const txns = state.transactions;
    let totalInUSD = 0, totalOutUSD = 0;
    let totalInKHR = 0, totalOutKHR = 0;

    for (const t of txns) {
      if (t.type === 'inflow') {
        if (t.currency === 'USD') totalInUSD += t.amount;
        else totalInKHR += t.amount;
      } else {
        if (t.currency === 'USD') totalOutUSD += t.amount;
        else totalOutKHR += t.amount;
      }
    }

    const expectedUSD = parseFloat(state.currentShift.opening_usd || 0) + totalInUSD - totalOutUSD;
    const expectedKHR = parseFloat(state.currentShift.opening_khr || 0) + totalInKHR - totalOutKHR;

    state.autoCloseUSD = Math.max(0, expectedUSD);
    state.autoCloseKHR = Math.max(0, expectedKHR);
    state.closeOverridden = false;

    $('close-expected-usd').textContent = fmt(expectedUSD, 'USD');
    $('close-expected-khr').textContent = fmt(expectedKHR, 'KHR');
    $('close-actual-usd-display').textContent = fmt(state.autoCloseUSD, 'USD');
    $('close-actual-khr-display').textContent = fmt(state.autoCloseKHR, 'KHR');

    $('input-close-usd').value = state.autoCloseUSD > 0 ? state.autoCloseUSD.toFixed(2) : '0';
    $('input-close-khr').value = state.autoCloseKHR > 0 ? String(Math.round(state.autoCloseKHR)) : '0';

    const overrideSection = $('close-override-section');
    const toggleBtn = $('btn-toggle-close-override');
    if (overrideSection) overrideSection.classList.add('hidden');
    if (toggleBtn) {
      toggleBtn.textContent = tr('close.overrideBtn', null, 'Override manually');
      toggleBtn.classList.remove('text-red-600', 'hover:text-red-700');
      toggleBtn.classList.add('text-blue-600', 'hover:text-blue-700');
    }
  }

  async function handleCloseShift(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!state.currentShift) { toastT('close.err.noShift', null, 'error', 'No active shift'); return; }

    let usd, khr;
    if (state.closeOverridden) {
      usd = parseFloat($('input-close-usd').value);
      khr = parseFloat($('input-close-khr').value);
      if (isNaN(usd) || usd < 0) { toastT('close.err.usd', null, 'error', 'Enter a valid closing USD amount'); return; }
      if (isNaN(khr) || khr < 0) { toastT('close.err.khr', null, 'error', 'Enter a valid closing KHR amount'); return; }
    } else {
      usd = state.autoCloseUSD || 0;
      khr = state.autoCloseKHR || 0;
    }

    const closingPhotoUrl = ($('input-closing-photo-url').value || '').trim() || null;

    try {
      await api.closeShift(state.currentShift.id, {
        closing_usd: usd,
        closing_khr: khr,
        closing_photo_url: closingPhotoUrl
      });
      state.currentShift = null;
      state.transactions = [];
      state.invoiceUrl = null;
      state.closeOverridden = false;
      state.autoCloseUSD = 0;
      state.autoCloseKHR = 0;
      toastT('close.ok', null, 'success', 'Shift closed successfully! Report sent to Telegram.');
      $('input-branch').value = '';
      $('input-opening-usd').value = '0';
      $('input-opening-khr').value = '0';
      resetClosingUpload();
      showScreen('screen-open-shift');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function toggleCloseOverride() {
    const section = $('close-override-section');
    const btn = $('btn-toggle-close-override');
    if (!section || !btn) return;
    const isHidden = section.classList.contains('hidden');
    if (isHidden) {
      section.classList.remove('hidden');
      state.closeOverridden = true;
      btn.textContent = tr('close.useAuto', null, 'Use auto-calculated');
      btn.classList.remove('text-blue-600', 'hover:text-blue-700');
      btn.classList.add('text-red-600', 'hover:text-red-700');
    } else {
      section.classList.add('hidden');
      state.closeOverridden = false;
      btn.textContent = tr('close.overrideBtn', null, 'Override manually');
      btn.classList.remove('text-red-600', 'hover:text-red-700');
      btn.classList.add('text-blue-600', 'hover:text-blue-700');
      $('input-close-usd').value = state.autoCloseUSD > 0 ? state.autoCloseUSD.toFixed(2) : '0';
      $('input-close-khr').value = state.autoCloseKHR > 0 ? String(Math.round(state.autoCloseKHR)) : '0';
    }
  }

  function handleLogout() {
    clearAuth();
    state.currentShift = null;
    state.transactions = [];
    state.invoiceUrl = null;
    showToast(tr('logout', null, 'Logged out'), 'info');
    showScreen('screen-login');
  }

  async function checkExistingShift() {
    if (!requireAuth()) return;
    try {
      const shift = await api.getCurrentShift();
      if (shift) {
        state.currentShift = shift;
        await loadDashboard();
        showScreen('screen-dashboard');
      } else {
        const user = getUser();
        $('open-shift-user').textContent = tr('open.loggedin', { name: (user ? user.username : '') }, 'Logged in as: ' + (user ? user.username : ''));
        showScreen('screen-open-shift');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  function showAdminDashboard() {
    const user = getUser();
    $('admin-user-name').textContent = tr('open.loggedin', { name: (user ? user.username : '') }, 'Logged in as: ' + (user ? user.username : '')) + ' (Admin)';
    switchAdminTab('shifts');
    loadAdminShifts();
    loadStaffCount();
    loadUsersList();
  }

  function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));

    if (tab === 'shifts') {
      $('admin-tab-shifts').classList.add('active');
      $('admin-section-shifts').classList.remove('hidden');
      loadAdminShifts();
    } else if (tab === 'transactions') {
      $('admin-tab-transactions').classList.add('active');
      $('admin-section-transactions').classList.remove('hidden');
      loadAdminTransactions();
    } else if (tab === 'logs') {
      $('admin-tab-logs').classList.add('active');
      $('admin-section-logs').classList.remove('hidden');
      loadAdminLogs();
    }
  }

  async function loadAdminShifts() {
    if (!requireAuth()) return;
    const branch = $('admin-filter-branch').value;
    try {
      const shifts = await api.getAdminShifts(branch);
      const container = $('admin-shifts-list');
      if (!shifts.length) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No shifts found</p>';
        return;
      }
      container.innerHTML = shifts.map(s => {
        const isOpen = s.status === 'open';
        return `
          <div class="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold text-gray-800 text-sm">${s.branch_name}</span>
              <span class="text-xs px-2 py-0.5 rounded-full ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}">${s.status}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Staff: ${s.staff_name}</span>
              <span>${s.start_time}${s.end_time ? ' - ' + s.end_time : ''}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>USD: ${fmt(s.opening_usd, 'USD')} → ${s.closing_usd !== null ? fmt(s.closing_usd, 'USD') : '—'}</span>
              <span>KHR: ${fmt(s.opening_khr, 'KHR')} → ${s.closing_khr !== null ? fmt(s.closing_khr, 'KHR') : '—'}</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      $('admin-shifts-list').innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Failed to load shifts</p>';
    }
  }

  async function loadAdminTransactions() {
    if (!requireAuth()) return;
    try {
      const txns = await api.getAdminTransactions();
      renderTransactionList(txns, 'admin-txns-list');
    } catch (err) {
      $('admin-txns-list').innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Failed to load transactions</p>';
    }
  }

  async function loadStaffCount() {
    try {
      const users = await api.getUsers();
      const staff = users.filter(u => u.role === 'staff');
      $('admin-staff-count').textContent = staff.length + ' staff account' + (staff.length !== 1 ? 's' : '');
    } catch {}
  }

  let usersState = { all: [], loading: false };

  async function loadUsersList() {
    if (!requireAuth()) return;
    if (usersState.loading) return;
    usersState.loading = true;
    try {
      const users = await api.getUsers();
      usersState.all = users || [];
      renderUsersList();
    } catch (err) {
      $('admin-users-list').innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Failed to load users</p>';
    } finally {
      usersState.loading = false;
    }
  }

  function renderUsersList() {
    const query = ($('admin-users-search').value || '').trim().toLowerCase();
    const list = usersState.all.filter(u => !query || (u.username || '').toLowerCase().includes(query));
    const container = $('admin-users-list');
    $('admin-users-count').textContent = usersState.all.length + ' account' + (usersState.all.length !== 1 ? 's' : '');

    if (!list.length) {
      container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No users found</p>';
      return;
    }

    const me = getUser();
    container.innerHTML = list.map(u => {
      const isMe = me && me.id === u.id;
      const roleBadge = u.role === 'admin'
        ? '<span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">admin</span>'
        : '<span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">staff</span>';
      return `
        <div class="px-4 py-3 flex items-center justify-between gap-3" data-user-row data-user-id="${u.id}">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-800 text-sm truncate">${escapeHtml(u.username)}</span>
              ${roleBadge}
              ${isMe ? '<span class="text-xs text-purple-600 font-medium">(you)</span>' : ''}
            </div>
            <p class="text-xs text-gray-400 mt-0.5">ID: ${u.id}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button type="button" class="user-edit-btn text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium"
                    data-user-id="${u.id}" data-username="${escapeHtml(u.username)}" data-role="${u.role}">
              Edit
            </button>
            <button type="button" class="user-delete-btn text-xs text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium ${isMe ? 'opacity-50 cursor-not-allowed' : ''}"
                    data-user-id="${u.id}" data-username="${escapeHtml(u.username)}" ${isMe ? 'disabled' : ''}>
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function handleEditUser(userId, currentUsername, currentRole) {
    const me = getUser();
    const isMe = me && me.id === userId;
    const newUsername = (prompt(`Edit username for #${userId}:`, currentUsername) || '').trim();
    if (!newUsername) return;
    if (newUsername === currentUsername) {
      // skip username change
    } else if (newUsername.length < 2) {
      showToast('Username must be at least 2 characters', 'error');
      return;
    }

    const roleChoice = prompt(
      `Role for "${newUsername}" (current: ${currentRole}).\nType "admin" or "staff":`,
      currentRole
    );
    if (roleChoice === null) return;
    const trimmedRole = (roleChoice || '').trim().toLowerCase();
    if (!['admin', 'staff'].includes(trimmedRole)) {
      showToast('Role must be "admin" or "staff"', 'error');
      return;
    }

    const pwChoice = prompt('Set a new password? (leave empty to keep current)', '');
    if (pwChoice === null) return;
    let newPassword = null;
    if (pwChoice.trim()) {
      if (pwChoice.length < 4) {
        showToast('Password must be at least 4 characters', 'error');
        return;
      }
      newPassword = pwChoice;
    }

    try {
      const body = { username: newUsername, role: trimmedRole };
      if (newPassword) body.password = newPassword;
      await api.updateUser(userId, body);
      showToast('User updated', 'success');
      await loadUsersList();
      await loadStaffCount();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  }

  async function handleDeleteUser(userId, username) {
    const me = getUser();
    if (me && me.id === userId) {
      showToast('You cannot delete your own account', 'error');
      return;
    }
    if (!confirm(`Delete user "${username}" (#${userId})?\n\nThis cannot be undone.`)) return;
    try {
      await api.deleteUser(userId);
      showToast('User deleted', 'success');
      await loadUsersList();
      await loadStaffCount();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  }

  function bindUsersListEvents() {
    const list = $('admin-users-list');
    if (!list || list.__bound) return;
    list.__bound = true;
    list.addEventListener('click', function (e) {
      const editBtn = e.target.closest('.user-edit-btn');
      if (editBtn) {
        handleEditUser(editBtn.dataset.userId, editBtn.dataset.username, editBtn.dataset.role);
        return;
      }
      const delBtn = e.target.closest('.user-delete-btn');
      if (delBtn && !delBtn.disabled) {
        handleDeleteUser(delBtn.dataset.userId, delBtn.dataset.username);
      }
    });
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    const username = $('input-new-username').value.trim();
    const password = $('input-new-password').value;
    const role = $('input-new-role').value;
    if (!username || !password) { showToast('Fill in all fields', 'error'); return; }
    try {
      await api.createUser({ username, password, role });
      showToast('User "' + username + '" created as ' + role, 'success');
      $('input-new-username').value = '';
      $('input-new-password').value = '';
      $('form-create-user').classList.add('hidden');
      $('btn-show-create-user').classList.remove('hidden');
      loadStaffCount();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function loadAdminLogs() {
    if (!requireAuth()) return;
    try {
      const logs = await api.getAdminLogs();
      const container = $('admin-logs-list');
      if (!logs.length) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No activity logs found</p>';
        return;
      }
      container.innerHTML = logs.map(l => `
        <div class="log-entry px-4 py-3">
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0"></div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-800">${l.action}</p>
              <p class="text-xs text-gray-500 mt-0.5">${l.details || ''}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-purple-600 font-medium">${l.username}</span>
                <span class="text-xs text-gray-400">${l.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      container.scrollTop = 0;
    } catch (err) {
      $('admin-logs-list').innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Failed to load logs</p>';
    }
  }

  function init() {
    setupToggleButtons();

    if (isAuthenticated()) {
      routeAfterLogin();
    }

    $('form-login').addEventListener('submit', handleLogin);

    $('form-open-shift').addEventListener('submit', handleOpenShift);

    $('btn-new-transaction').addEventListener('click', function () {
      if (!requireAuth()) return;
      if (state.currentShift) {
        $('txn-branch-name').textContent = state.currentShift.branch_name;
      }
      $('input-amount').value = '0';
      $('input-cost').value = '0';
      updateCurrencySymbols($('input-currency').value);
      resetUpload();
      showScreen('screen-transaction');
    });

    $('btn-close-shift').addEventListener('click', async function () {
      if (!requireAuth()) return;
      await loadCloseShiftForm();
      showScreen('screen-close-shift');
    });

    $('btn-back-dashboard').addEventListener('click', async function () {
      await loadDashboard();
      showScreen('screen-dashboard');
    });

    $('btn-back-dashboard2').addEventListener('click', async function () {
      await loadDashboard();
      showScreen('screen-dashboard');
    });

    $('form-transaction').addEventListener('submit', handleTransaction);

    $('upload-zone').addEventListener('click', function () {
      $('input-invoice').click();
    });

    $('input-invoice').addEventListener('change', handleFileSelect);

    $('upload-zone-opening').addEventListener('click', function () {
      $('input-opening-photo').click();
    });
    $('input-opening-photo').addEventListener('change', handleOpeningPhotoSelect);

    $('upload-zone-closing').addEventListener('click', function () {
      $('input-closing-photo').click();
    });
    $('input-closing-photo').addEventListener('change', handleClosingPhotoSelect);

    $('form-close-shift').addEventListener('submit', handleCloseShift);
    $('btn-toggle-close-override').addEventListener('click', toggleCloseOverride);

    $('btn-logout-open').addEventListener('click', handleLogout);
    $('btn-logout-dash').addEventListener('click', handleLogout);
    $('btn-logout-admin').addEventListener('click', handleLogout);

    $('admin-tab-shifts').addEventListener('click', function () { switchAdminTab('shifts'); });
    $('admin-tab-transactions').addEventListener('click', function () { switchAdminTab('transactions'); });
    $('admin-tab-logs').addEventListener('click', function () { switchAdminTab('logs'); });

    $('btn-show-create-user').addEventListener('click', function () {
      $('form-create-user').classList.remove('hidden');
      this.classList.add('hidden');
    });
    $('btn-cancel-create-user').addEventListener('click', function () {
      $('form-create-user').classList.add('hidden');
      $('btn-show-create-user').classList.remove('hidden');
    });
    $('form-create-user').addEventListener('submit', handleCreateUser);

    $('admin-filter-branch').addEventListener('change', function () {
      loadAdminShifts();
    });

    $('admin-users-search').addEventListener('input', function () {
      renderUsersList();
    });
    $('btn-refresh-users').addEventListener('click', function () {
      loadUsersList();
    });
    bindUsersListEvents();

    $('btn-go-admin-from-dash').addEventListener('click', function () {
      showAdminDashboard();
      showScreen('screen-admin');
    });

    $('btn-back-to-staff').addEventListener('click', async function () {
      await goBackToStaff();
    });

    $('btn-back-to-staff-top').addEventListener('click', async function () {
      await goBackToStaff();
    });
  }

  async function goBackToStaff() {
    const shift = await api.getCurrentShift();
    if (shift) {
      state.currentShift = shift;
      await loadDashboard();
      showScreen('screen-dashboard');
    } else {
      const user = getUser();
      $('open-shift-user').textContent = 'Logged in as: ' + (user ? user.username : '');
      showScreen('screen-open-shift');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
