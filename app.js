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

  function showToast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
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
      showToast('Please enter username and password', 'error');
      return;
    }

    try {
      const result = await api.login(username, password);
      setAuth(result.token, result.user);
      showToast('Welcome, ' + result.user.username, 'success');
      $('input-login-username').value = '';
      $('input-login-password').value = '';
      routeAfterLogin();
    } catch (err) {
      showToast(err.message, 'error');
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
    if (!branch) { showToast('Please select a branch', 'error'); return; }

    try {
      const shift = await api.createShift({
        branch_name: branch,
        opening_usd: parseFloat($('input-opening-usd').value) || 0,
        opening_khr: parseFloat($('input-opening-khr').value) || 0
      });
      state.currentShift = shift;
      showToast('Shift started at ' + shift.branch_name, 'success');
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
      $('dash-staff-name').textContent = 'Staff: ' + (user ? user.username : '');
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
      showToast('Failed to load dashboard: ' + err.message, 'error');
    }
  }

  function renderTransactionList(txns, containerId) {
    const container = $(containerId || 'txn-list');
    if (!txns || !txns.length) {
      container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No transactions yet</p>';
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
        });
      });
    });
  }

  async function handleTransaction(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!state.currentShift) { showToast('No active shift', 'error'); return; }

    const type = $('input-type').value;
    const currency = $('input-currency').value;
    const method = $('input-method').value;
    const amount = parseFloat($('input-amount').value);
    const cost = parseFloat($('input-cost').value) || 0;

    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

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
      $('input-amount').value = '';
      $('input-cost').value = '0';
      resetUpload();
      showToast('Transaction recorded', 'success');
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

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    $('upload-status').textContent = 'Compressing (' + formatBytes(file.size) + ')...';

    try {
      const compressed = await compressImage(file, 1024, 0.65);

      const previewReader = new FileReader();
      previewReader.onload = function (ev) {
        $('preview-image').src = ev.target.result;
        $('upload-placeholder').classList.add('hidden');
        $('upload-preview').classList.remove('hidden');
      };
      previewReader.readAsDataURL(compressed);

      const sizeInfo = formatBytes(file.size) + ' → ' + formatBytes(compressed.size);
      $('upload-status').textContent = 'Uploading (' + sizeInfo + ')...';

      const result = await api.uploadInvoice(compressed);
      state.invoiceUrl = result.url;
      $('input-invoice-url').value = result.url;
      $('upload-status').textContent = 'Compressed: ' + sizeInfo + ' — Uploaded';
      showToast('Invoice uploaded (' + sizeInfo + ')', 'success');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
      $('upload-status').textContent = 'Upload failed';
    }
  }

  async function loadCloseShiftForm() {
    if (!requireAuth()) return;
    if (!state.currentShift) { showToast('No active shift', 'error'); return; }

    const user = getUser();
    $('close-shift-info').textContent = (user ? user.username : '') + ' · ' + state.currentShift.branch_name;

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

    const expectedUSD = state.currentShift.opening_usd + totalInUSD - totalOutUSD;
    const expectedKHR = state.currentShift.opening_khr + totalInKHR - totalOutKHR;

    $('close-expected-usd').textContent = fmt(expectedUSD, 'USD');
    $('close-expected-khr').textContent = fmt(expectedKHR, 'KHR');
    $('input-close-usd').value = expectedUSD > 0 ? expectedUSD.toFixed(2) : '0';
    $('input-close-khr').value = expectedKHR > 0 ? String(Math.round(expectedKHR)) : '0';
  }

  async function handleCloseShift(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!state.currentShift) { showToast('No active shift', 'error'); return; }

    const usd = parseFloat($('input-close-usd').value);
    const khr = parseFloat($('input-close-khr').value);

    if (isNaN(usd) || usd < 0) { showToast('Enter a valid closing USD amount', 'error'); return; }
    if (isNaN(khr) || khr < 0) { showToast('Enter a valid closing KHR amount', 'error'); return; }

    try {
      await api.closeShift(state.currentShift.id, {
        closing_usd: usd,
        closing_khr: khr
      });
      state.currentShift = null;
      state.transactions = [];
      state.invoiceUrl = null;
      showToast('Shift closed successfully! Report sent to Telegram.', 'success');
      $('input-branch').value = '';
      $('input-opening-usd').value = '0';
      $('input-opening-khr').value = '0';
      showScreen('screen-open-shift');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleLogout() {
    clearAuth();
    state.currentShift = null;
    state.transactions = [];
    state.invoiceUrl = null;
    showToast('Logged out', 'info');
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
        $('open-shift-user').textContent = 'Logged in as: ' + (user ? user.username : '');
        showScreen('screen-open-shift');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  function showAdminDashboard() {
    const user = getUser();
    $('admin-user-name').textContent = 'Logged in as: ' + (user ? user.username : '') + ' (Admin)';
    switchAdminTab('shifts');
    loadAdminShifts();
    loadStaffCount();
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
      $('input-amount').value = '';
      $('input-cost').value = '0';
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

    $('form-close-shift').addEventListener('submit', handleCloseShift);

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

    $('btn-go-admin-from-dash').addEventListener('click', function () {
      showAdminDashboard();
      showScreen('screen-admin');
    });

    $('btn-back-to-staff').addEventListener('click', async function () {
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
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
