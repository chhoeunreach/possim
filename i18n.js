(function () {
  'use strict';

  // Bilingual (English / Khmer) string catalog for the POS UI.
  // Usage:
  //   const t = window.I18N.t;     // function
  //   t('login.title')              // 'Staff Login'  (en) | 'ចូលប្រើប្រាស់' (kh)
  //   t('dash.welcome', { name })   // 'Welcome, john'

  const STORAGE_KEY = 'pos_lang';

  const STRINGS = {
    en: {
      'app.title':          'SIM Retail POS',
      'app.subtitle':       'Staff Shift Management System',

      'login.title':        'Staff Login',
      'login.username':     'Username',
      'login.username.ph':  'Enter username',
      'login.password':     'Password',
      'login.password.ph':  'Enter password',
      'login.submit':       'Sign In',
      'login.err.empty':    'Please enter username and password',
      'login.err.cred':     'Invalid username or password',
      'login.ok':           'Welcome, {name}',

      'logout':             'Logout',
      'back':               'Back',

      'open.title':         'Open New Shift',
      'open.loggedin':      'Logged in as: {name}',
      'open.branch':        'Branch',
      'open.branch.ph':     'Select a branch...',
      'open.usd':           'Opening Cash (USD)',
      'open.khr':           'Opening Cash (KHR)',
      'open.photo':         'Opening Photo',
      'open.photo.optional':'(optional)',
      'open.photo.hint':    'Tap to capture or upload opening photo',
      'open.submit':        'Start Shift',
      'open.err.branch':    'Please select a branch',
      'open.ok':            'Shift started at {branch}',

      'dash.title':         'Dashboard',
      'dash.staff':         'Staff: {name}',
      'dash.opening':       'Opening:',
      'dash.status.open':   'OPEN',
      'dash.status.closed': 'CLOSED',
      'dash.usdCash':       'USD Cash',
      'dash.usdBank':       'USD Bank',
      'dash.khrCash':       'KHR Cash',
      'dash.khrBank':       'KHR Bank',
      'dash.newTxn':        '+ New Transaction',
      'dash.closeShift':    'Close Shift',
      'dash.openAdmin':     'Open Admin Dashboard',
      'dash.recent':        'Recent Transactions',
      'dash.empty':         'No transactions yet',
      'dash.err.load':      'Failed to load dashboard: {msg}',

      'txn.title':          'New Transaction',
      'txn.branch':         'Branch',
      'txn.type':           'Type',
      'txn.type.inflow':    'Inflow',
      'txn.type.outflow':   'Outflow',
      'txn.currency':       'Currency',
      'txn.currency.usd':   'USD ($)',
      'txn.currency.khr':   'KHR (៛)',
      'txn.method':         'Payment Method',
      'txn.method.cash':    'Cash',
      'txn.method.bank':    'Bank',
      'txn.amount':         'Amount',
      'txn.amount.ph':      '0.00',
      'txn.cost':           'Cost / Expense (optional)',
      'txn.invoice':        'Invoice / Proof Photo',
      'txn.invoice.hint':   'Tap to capture or upload invoice / proof photo',
      'txn.submit':         'Record Transaction',
      'txn.err.noShift':    'No active shift',
      'txn.err.amount':     'Enter a valid amount',
      'txn.ok':             'Transaction recorded',

      'close.title':        'Close Shift',
      'close.info':         '{name} \u00b7 {branch}',
      'close.expected':     'Expected Closing Balances',
      'close.autoTitle':    'Auto-calculated Closing',
      'close.autoTag':      'Opening + Transactions',
      'close.actualUsd':    'Actual USD',
      'close.actualKhr':    'Actual KHR',
      'close.autoHelp':     'Computed from opening balance + all recorded inflows/outflows. Tap "Override" to enter a different amount.',
      'close.overrideLabel':'Manual override',
      'close.overrideBtn':  'Override manually',
      'close.useAuto':      'Use auto-calculated',
      'close.usd':          'Actual Closing USD',
      'close.khr':          'Actual Closing KHR',
      'close.optional':     '(override)',
      'close.photo':        'Closing Photo',
      'close.photo.hint':   'Tap to capture or upload closing photo',
      'close.submit':       'Confirm & End Shift',
      'close.err.noShift':  'No active shift',
      'close.err.usd':      'Enter a valid closing USD amount',
      'close.err.khr':      'Enter a valid closing KHR amount',
      'close.ok':           'Shift closed successfully! Report sent to Telegram.',

      'upload.compress':    'Compressing ({size})...',
      'upload.uploading':   'Uploading ({size})...',
      'upload.done':        'Compressed: {size} \u2014 Uploaded',
      'upload.fail':        'Upload failed',
      'upload.ok':          'Invoice uploaded ({size})',
      'upload.opening.ok':  'Opening photo uploaded ({size})',
      'upload.closing.ok':  'Closing photo uploaded ({size})',
      'upload.err':         'Upload failed: {msg}',

      'admin.title':        'Admin Dashboard',
      'admin.backStaff':    'Staff',
      'admin.manageStaff':  'Manage Staff',
      'admin.staffCount':   '{n} staff account | {n} staff accounts',
      'admin.newStaff':     '+ New Staff',
      'admin.createUser':   'Create Account',
      'admin.cancel':       'Cancel',
      'admin.users':        'Staff / Users',
      'admin.usersCount':   '{n} account | {n} accounts',
      'admin.search.ph':    'Search username...',
      'admin.refresh':      'Refresh',
      'admin.tab.shifts':   'Shifts',
      'admin.tab.txns':     'Transactions',
      'admin.tab.logs':     'Activity Logs',
      'admin.filterBranch': 'Filter by Branch',
      'admin.allBranches':  'All Branches',
      'admin.empty.shifts': 'No shifts found',
      'admin.empty.txns':   'No transactions found',
      'admin.empty.logs':   'No activity logs found',
      'admin.empty.users':  'No users found',
      'admin.loading':      'Loading...',
      'admin.backStaff.full':'Back to Staff Dashboard',
      'admin.err.loadShifts': 'Failed to load shifts',
      'admin.err.loadTxns':   'Failed to load transactions',
      'admin.err.loadLogs':   'Failed to load logs',
      'admin.err.loadUsers':  'Failed to load users',

      'user.username.ph':   'Username',
      'user.password.ph':   'Password',
      'user.role.staff':    'Staff',
      'user.role.admin':    'Admin',
      'user.role.ph':       'Role',
      'user.err.username':  'Username must be at least 2 characters',
      'user.err.role':      'Role must be "admin" or "staff"',
      'user.err.password':  'Password must be at least 4 characters',
      'user.err.selfDel':   'You cannot delete your own account',
      'user.ok.created':    'User "{name}" created as {role}',
      'user.ok.updated':    'User updated',
      'user.ok.deleted':    'User deleted',
      'user.err.update':    'Update failed',
      'user.err.delete':    'Delete failed',
      'user.err.fields':    'Fill in all fields',

      'lang.toggle':        '\u2022 Language',
      'lang.en':            'English',
      'lang.kh':            '\u1797\u17b6\u179f\u17b6\u1781\u17d2\u1798\u17c2\u1780'
    },

    kh: {
      'app.title':          'SIM Retail POS',
      'app.subtitle':       '\u179f\u17bc\u1793\u1794\u17d2រ\u17b6\u1794\u17cb\u1780\u17b6\u179a\u17a2\u17b6ក\u17b6រ',

      'login.title':        '\u1785\u17bcល\u17cb\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb\u179f\u17d2ត\u17b6\u17c6',
      'login.username':     '\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb',
      'login.username.ph':  '\u1794\u17b7\u1793\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb',
      'login.password':     '\u1796\u17b6\u179a\u17c1\u1791\u17d0\u1799\u1791\u17b6\u17c6\u1784',
      'login.password.ph':  '\u1794\u17b7\u1793\u1796\u17b6\u179a\u17c1\u1791\u17d0\u1799\u1791\u17b6\u17c6\u1784',
      'login.submit':       '\u1785\u17bcល\u17cb\u1791\u17b7\u1793',
      'login.err.empty':    '\u179f\u17bc\u1798\u1796\u17b7\u1791\u17b7\u1793\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb \u1793\u17b7\u1794\u1796\u17b6\u179a\u17c1\u1791\u17d0\u1799\u1791\u17b6\u17c6\u1784',
      'login.err.cred':     '\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb \u178a\u17c2\u179b\u17d2\u178b\u1796\u17b6\u179a\u17c1\u1791\u17d0\u1799\u1791\u17b6\u17c6\u1784 \u1798\u17b7\u1793\u179f\u179a\u17beប\u17d2រ\u17b6ញ\u17cb',
      'login.ok':           '\u179f\u17bc\u1798\u1796\u179a\u17a2\u17b6\u1793\u17ba\u1780\u17d2\u179b\u17b6\u1799 {name}',

      'logout':             '\u1795\u17d2\u179b\u17b9\u1794\u17d2\u179a\u17be\u1791\u17b7\u1793',
      'back':               '\u179f\u17d2ត\u17b9\u1793\u1795\u17d2\u1791\u1793\u1795\u17d2\u179f\u17b9\u1798',

      'open.title':         '\u1785\u17d6\u1794\u17be\u1794\u17d2រ\u17b7\u179c\u179f\u17d2ត\u17b6\u17c6\u1780\u17b6រ',
      'open.loggedin':      '\u1785\u17bcល\u17cb\u1791\u17b7\u1793\u1796\u17b8\u1780\u17d2\u179b\u17b6\u1799\u1780\u17d2\u179b\u17b6\u1799\u1798\u17b7ន: {name}',
      'open.branch':        '\u179f\u17d2គន\u17b7\u�',
      'open.branch.ph':     '\u1794\u17b7ន\u1780\u17d2\u179a\u17b7\u1791\u17d0\u1799\u179f\u17d2គ\u1793\u17b7\u2026',
      'open.usd':           '\u179b\u17bb\u1791\u17d2\u1799\u1785\u17b6\u1794\u17cb\u1791\u17b7\u1793 (USD)',
      'open.khr':           '\u179b\u17bb\u1791\u17d2\u1799\u1785\u17b6\u1794\u17cb\u1791\u17b7\u1793 (KHR)',
      'open.photo':         '\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u1794\u17beក',
      'open.photo.optional':'(\u1780\u17be\u1798\u1794\u17b6\u1793)',
      'open.photo.hint':    '\u1794\u17c1\u1794\u17d4\u1785\u17d2\u179b\u17b6\u178a\u1793\u17bb\u1791\u17d2\u1799\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u1794\u17beក',
      'open.submit':        '\u1785\u17bdម\u179b\u17d2ប\u17b6\u17c6\u179f\u17d2ត\u17b6\u17c6\u179a\u17bcប\u179c\u17c4\u179b',
      'open.err.branch':    '\u179f\u17bc\u1798\u1796\u17b7\u��\u1799\u179f\u17d2គ\u1793\u17b7\u1780\u17d2\u179a\u17b7\u1791\u17d0\u1799\u1798\u17bd\u1793\u17b9\u1785',
      'open.ok':            '\u179f\u17d2ត\u17b6\u17c6\u179a\u17bc\u1794\u179c\u17c4\u179b\u178a\u179b\u17cb\u179f\u17d2គ\u1793\u17b7 {branch}',

      'dash.title':         '\u1797\u17d2\u179b\u17b6\u�\u179f\u17d2\u179a\u17b6\u�',
      'dash.staff':         '\u1798\u17b7\u1793\u1797\u17b6\u179a: {name}',
      'dash.opening':       '\u179b\u17bb\u1791\u17d2\u1799\u1785\u17b6\u1794\u17cb\u1791\u17b7\u1793:',
      'dash.status.open':   '\u1785\u17be\u1794\u17d2ល\u17beក',
      'dash.status.closed': '\u178a\u17bc\u179b\u1794\u17d2រ\u17b7\u179c',
      'dash.usdCash':       'USD \u179b\u17bb\u1791\u17d2\u1799\u1795\u1791\u17d2\u1799',
      'dash.usdBank':       'USD \u179b\u17bb\u1791\u17d2\u1799\u178a\u17cd\u1793\u17b7\u1793\u17d4',
      'dash.khrCash':       'KHR \u179b\u17bb\u1791\u17d2\u1799\u1795\u1791\u17d2\u1799',
      'dash.khrBank':       'KHR \u179b\u17bb\u1791\u17d2\u1799\u178a\u17cd\u1793\u17b7\u1793\u17d4',
      'dash.newTxn':        '+ ប\u17d2រត\u17b6\u1794\u17cbថ\u17d2\u1798\u17b7\u1793\u1780\u17b6\u�',
      'dash.closeShift':    '\u178a\u17bc\u179b\u1794\u17d2រ\u17b7\u179c\u179f\u17d2ត\u17b6\u17c6',
      'dash.openAdmin':     '\u1785\u17d2\u179b\u17b6\u1794\u17be\u1796\u179a\u1791\u17d2\u1799\u�\u17bc\u179b\u17d2ប\u17b6\u�\u17d2\u1799\u1794\u17b6ន\u1793\u17b7\u1793\u17d4',
      'dash.recent':        '\u1794\u17d2រ\u17b6\u1794\u17cb\u1790\u17d2\u1798\u17b7\u1793\u1780\u17b6រ\u179c\u17a0\u17d2\u1799',
      'dash.empty':         '\u178a\u17c2\u1798\u17b7\u1793\u1794\u17d2រ\u17b6ប\u17cb\u179c\u179a\u17b8\u17d2\u179a\u17c1\u1780\u17b6រ\u179c\u1790\u17d2\u1798\u17b7\u1793\u179f\u17bcម\u178e\u17d2\u178c',
      'dash.err.load':      '\u1794\u17c1\u179c\u17b7\u1782\u17c2\u1794\u17b6\u��\u1791\u17b6\u179b\u179f\u17d2\u179a\u17b6ក\u17cb\u1794\u17d2\u179a\u179b\u17cb\u1795\u17d2\u1793\u17c0\u1799\u�{msg}',

      'txn.title':          '\u1794\u17d2រ\u17b6ប\u17cb\u179c\u179a\u17b8\u17d2\u179a\u17c1\u1780\u17b6រ',
      'txn.branch':         '\u179f\u17d2គ\u1793\u17b7\u�',
      'txn.type':           '\u179b\u17b7\u1793\u1794\u17d2\u179a\u17b7\u179c\u2026',
      'txn.type.inflow':    '\u1795\u17d2\u179b\u17b6\u�\u1795\u17d2\u1791\u17b7\u1793\u1795\u179a\u1791\u17d2\u1799',
      'txn.type.outflow':   '\u1795\u17d2\u179b\u17b6\u�\u1795\u17d2\u1791\u17b7\u1793\u1791\u17b9\u1784',
      'txn.currency':       '\u179b\u17bb\u1791\u17d2\u1799',
      'txn.currency.usd':   'USD ($)',
      'txn.currency.khr':   'KHR (\u17db)',
      'txn.method':         '\u1795\u179b\u17b6\u�\u179d\u1780\u17d2\u179b\u17b6\u�',
      'txn.method.cash':    '\u179b\u17bb\u1791\u17d2\u1799\u1795\u1791\u17d2\u1799',
      'txn.method.bank':    '\u178a\u17cd\u1793\u17b7\u1793\u17d4',
      'txn.amount':         '\u179f\u17c1\u1791\u17d2\u1799\u1794\u17b7\u1793\u179b\u17bb\u1791\u17d2\u1799',
      'txn.amount.ph':      '0.00',
      'txn.cost':           '\u179f\u17c1\u1791\u17d2\u1799\u1798\u17b7\u1793\u179b\u17bb\u1791\u17d2\u1799\u2026',
      'txn.invoice':        '\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u200b\u1797\u17c5\u179c\u17b7\u179f\u17d2\u179f',
      'txn.invoice.hint':   '\u1794\u17c1\u1794\u17d4\u1785\u17d2\u179b\u17b6\u178a\u1793\u17bb\u1791\u17d2\u1799\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u1797\u17c5\u179c\u17b7\u179f\u17d2\u179f',
      'txn.submit':         '\u179a\u17b6\u1794\u179f\u17cb\u179f\u17d2ត\u17b9\u180c\u1794\u17d2រ\u17b6\u�\u17cb',
      'txn.err.noShift':    '\u178a\u17c2\u1798\u17b7\u1793\u179f\u17d2ត\u17b6\u17c6\u1795\u17d2\u179f\u179f\u179b\u17cb',
      'txn.err.amount':     '\u179f\u17bc\u1798\u1796\u17b7\u1791\u17b7\u1793\u179f\u17c1\u1791\u17d2\u1799\u1794\u17b7\u1793\u178f\u1799\u179c\u17a0\u17d2\u1799',
      'txn.ok':             '\u179f\u17d2ត\u17b9\u180c\u1794\u17d2រ\u17b6\u�\u17cb\u179a\u17bc\u1794\u179c\u17c4\u179b',

      'close.title':        '\u178a\u17bc\u179b\u1794\u17d2រ\u17b7\u179c\u179f\u17d2ត\u17b6\u17c6',
      'close.info':         '{name} \u00b7 {branch}',
      'close.expected':     '\u179b\u17bb\u1791\u17d2\u1799\u179a\u17b6\u1794\u17cb\u1791\u17d0\u1799\u1794\u17bc\u1794\u17d2\u179a\u17b7\u179c\u179f\u17d2\u179a\u17b6\u�',
      'close.autoTitle':    '\u179f\u17c1\u1791\u17d2\u1799\u179a\u1780\u1794\u1799\u179f\u17d2\u179a\u17b6\u�\u179f\u17d2\u179a\u17b7\u1794\u17cb\u178a\u17d2\u1794\u17b8\u179f\u17d2\u179a\u17b6\u�',
      'close.autoTag':      '\u179b\u17bb\u1791\u17d2\u1799\u179a\u1780\u1794\u1799 + \u1794\u17d2រ\u17b6\u�\u17cb',
      'close.actualUsd':    'USD \u179f\u1799\u17b7\u179a\u17b6ប\u17cb',
      'close.actualKhr':    'KHR \u179f\u1799\u17b7\u179a\u17b6\u�\u17cb',
      'close.autoHelp':     '\u179a\u1780\u1794\u1799\u1797\u17d2\u179b\u17b6\u�\u17cb\u1794\u1799\u179f\u17d2គ\u1793\u17b7 + \u1794\u17d2រ\u17b6\u�\u17cb\u1798\u17bd\u1791\u17d0\u1799\u1791\u17b9\u1784\u1794\u17c1\u1794\u1799\u1791\u17d2\u1799\u2026',
      'close.overrideLabel':'\u178f\u1799\u179f\u17d2\u�\u1799\u179a\u17b6\u�\u17cb',
      'close.overrideBtn':  '\u178f\u1799\u179f\u17d2\u�\u1799\u179a\u17b6\u�\u17cb\u1785\u17d2\u179c\u17b6\u�\u17cb',
      'close.useAuto':      '\u1794\u17d2\u179a\u17be\u179f\u17d2រ\u17b6ប\u17cb\u179f\u17d2\u179a\u17b7\u1794\u17cb\u178a\u17d2\u1794\u17b8',
      'close.usd':          'USD \u179f\u1799\u17b7\u179a\u17b6\u�\u17cb\u179f\u17d2រ\u17b7\u179c\u179f\u17d2ត\u17b6\u17c6',
      'close.khr':          'KHR \u179f\u1799\u17b7\u179a\u17b6\u�\u17cb\u179f\u17d2រ\u17b7\u179c\u179f\u17d2ត\u17b6\u17c6',
      'close.optional':     '(\u178f\u1799\u179f\u17d2\u�\u1799)',
      'close.photo':        '\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u178a\u17bcល\u179f\u17d2ត\u17b6\u17c6',
      'close.photo.hint':   '\u1794\u17c1\u1794\u17d4\u1785\u17d2\u179b\u17b6\u178a\u1793\u17bb\u1791\u17d2\u1799\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u178a\u17bcល\u179f\u17d2ត\u17b6\u17c6',
      'close.submit':       '\u1794\u17b8\u1791\u17d2\u179b\u1799\u1793\u17b7\u179c\u1793\u17b7\u178a\u17bc\u�\u179f\u17d2ត\u17b6\u17c6',
      'close.err.noShift':  '\u178a\u17c2\u1798\u17b7\u1793\u179f\u17d2ត\u17b6\u17c6\u1795\u17d2\u179f\u179f\u179b\u17cb',
      'close.err.usd':      '\u179f\u17bc\u1798\u1796\u17b7\u1791\u17b7\u1793\u179f\u17c1\u1791\u17d2\u1799 USD \u179f\u17d2រ\u17b7\u179c\u179f\u17d2ត\u17b6\u17c6\u179f\u1799\u17b7\u179a\u17b6\u�\u17cb',
      'close.err.khr':      '\u179f\u17bc\u1798\u1796\u17b7\u1791\u17b7\u1793\u179f\u17c1\u1791\u17d2\u1799 KHR \u179f\u17d2រ\u17b7\u179c\u179f\u17d2ត\u17b6\u17c6\u179f\u1799\u17b7\u179a\u17b6\u�\u17cb',
      'close.ok':           '\u179f\u17d2ត\u17b6\u17c6\u179a\u17bc\u1794\u179c\u17c4\u179b\u179b\u17bb\u1791\u17d2\u1799\u179f\u17d2\u�\u1799! \u179b\u17d2\u179a\u17b6\u�\u17cb\u1795\u17d2\u1793\u17c0\u1799\u1791\u17d2\u179b\u17b9 Telegram\u2026',

      'upload.compress':    '\u1780\u17c2\u1794\u1794\u1791\u17d2\u1799\u179a\u17bc\u179b ({size})...',
      'upload.uploading':   '\u1780\u17c2\u1794\u1794\u1789\u17d2\u1793\u17c0\u1799 ({size})...',
      'upload.done':        '\u1794\u1794\u1791\u17d2\u1799\u179a\u17bc\u179b: {size} \u2014 \u1794\u17b6\u1793\u1795\u17d2\u1793\u17c0\u1799\u179a\u17bcប\u179c\u17c4\u179b',
      'upload.fail':        '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc',
      'upload.ok':          '\u1794\u1789\u17d2\u1793\u17c0\u1799\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb ({size})',
      'upload.opening.ok':  '\u1794\u1789\u17d2\u1793\u17c0\u1799\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u179a\u17bc\u1794\u179c\u17c4ល ({size})',
      'upload.closing.ok':  '\u1794\u1789\u17d2\u1793\u17c0\u1799\u1795\u1792\u17b9\u1794\u1793\u17b6ក\u17cb\u178a\u17bcល ({size})',
      'upload.err':         '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc: {msg}',

      'admin.title':        '\u1796\u179a\u1791\u17d2\u1799\u179c\u17c4\u179b\u179f\u17d2\u�\u1799',
      'admin.backStaff':    '\u179f\u17d2ត\u17b6\u17c6',
      'admin.manageStaff':  '\u1792\u1799\u1791\u17d2\u1799\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb',
      'admin.staffCount':   '{n} \u1798\u17b7\u1793\u1797\u17b6\u179a | {n} \u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb',
      'admin.newStaff':     '+ \u1798\u17b7\u1793\u1797\u17b6\u179a\u1790\u17d2\u1798\u17b7\u1793',
      'admin.createUser':   '\u1784\u17d2\u1793\u17c4\u179f\u17d2\u179a\u17b6\u�\u17cb',
      'admin.cancel':       '\u1794\u17ca\u1791\u17d2\u179a\u17b9\u1793\u17b7\u1793\u17d4',
      'admin.users':        '\u1798\u17b7\u1793\u1797\u17b6\u179a / \u1794\u17bb\u1780\u179a\u1792\u1799\u1791\u17d2\u1799',
      'admin.usersCount':   '{n} \u1798\u17b7\u1793\u1797\u17b6\u179a | {n} \u1798\u17b7\u1793\u1797\u17b6\u179a',
      'admin.search.ph':    '\u178f\u17d2\u1799\u1785\u17d2\u179c\u17b6\u�\u17cb\u1798\u17b7\u1793\u1797\u17b6\u179a...',
      'admin.refresh':      '\u1794\u1789\u17d2\u1793\u17c0\u1799\u179f\u17a2\u1797\u17d2\u1793\u17b6\u�\u17cb',
      'admin.tab.shifts':   '\u179f\u17d2ត\u17b6\u17c6',
      'admin.tab.txns':     '\u1794\u17d2រ\u17b6ប\u17cb\u179c\u179a\u17b8\u17d2\u179a\u17c1\u1780\u17b6រ',
      'admin.tab.logs':     '\u179f\u1780\u1798\u1798\u1794\u1798\u179c\u179a\u17b8\u17d2\u179a\u17c1\u1780\u17b6រ',
      'admin.filterBranch': '\u2026\u179f\u17d2\u179a\u17c5\u1791\u17d2\u1799\u179f\u17d2គ\u1793\u17b7\u�',
      'admin.allBranches':  '\u179f\u17d2គ\u1793\u17b7\u1793\u17bb\u1791\u17d2\u1799\u1791\u17b9\u1784',
      'admin.empty.shifts': '\u178a\u17c2\u1798\u17b7\u1793\u179a\u17be\u1794\u17d2រ\u17b6\u�\u17cb\u179f\u17d2ត\u17b6\u17c6\u179f\u17bc\u�',
      'admin.empty.txns':   '\u178a\u17c2\u1798\u17b7\u1793\u1798\u17b7\u1793\u1794\u17d2រ\u17b6\u�\u17cb',
      'admin.empty.logs':   '\u178a\u17c2\u1798\u17b7\u1793\u179b\u17d2\u179a\u17b6ប\u17cb\u179c\u179a\u17b8\u17d2\u179a\u17c1\u1780\u17b6រ',
      'admin.empty.users':  '\u178a\u17c2\u1798\u17b7\u1793\u179�\u1780\u179a\u1790\u1791\u17d2\u1799',
      'admin.loading':      '\u1780\u17c2\u1794\u1794\u1789\u17d2\u1793\u17c0\u1799...',
      'admin.backStaff.full':'\u179f\u17d2\u��\u1793\u1793\u17b7\u178a\u17bc\u�\u1796\u179a\u1791\u17d2\u1799\u179f\u17d2ត\u17b6\u17c6',
      'admin.err.loadShifts': '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc\u1780\u17b6\u�\u179c\u179a\u17b8\u17d2\u179a\u17c1\u179f\u17d2ត\u17b6\u17c6',
      'admin.err.loadTxns':   '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc\u1780\u17b6\u�\u179c\u179a\u17b8\u17d2\u179a\u17c1\u1794\u17d2រ\u17b6ប\u17cb',
      'admin.err.loadLogs':   '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc\u1780\u17b6\u�\u179c\u179b\u17d2\u179a\u17b6ប\u17cb\u179f\u1780\u1798\u1798',
      'admin.err.loadUsers':  '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc\u1780\u17b6\u�\u179c\u179c\u179a\u17b8\u17d2\u179a\u17c1\u1798\u17b7\u1793\u1797\u17b6\u179a',

      'user.username.ph':   '\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb',
      'user.password.ph':   '\u1796\u17b6\u179a\u17c1\u1791\u17d0\u1799\u1791\u17b6\u17c6\u1784',
      'user.role.staff':    '\u1798\u17b7\u1793\u1797\u17b6\u179a',
      'user.role.admin':    '\u179c\u17c4\u179b\u179f\u17d2រ\u17b7\u179c',
      'user.role.ph':       '\u179f\u17b7\u1793\u1794\u17d2\u179a\u17b7\u179c\u2026',
      'user.err.username':  '\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb\u179f\u1799\u179c\u17c4\u179f\u17d2\u1796\u179b\u17cb 2 \u1798\u17bb\u179b',
      'user.err.role':      '\u179f\u17b7\u1793\u1794\u17d2\u179a\u17b7\u179c\u179f\u17bcម\u178a\u17c2\u179b\u17d2\u178b\u1780\u17d2\u179a\u17b7\u1791\u17d0\u1799 admin \u1786\u17b7\u1793 staff',
      'user.err.password':  '\u1796\u17b6\u179a\u17c1\u1791\u17d0\u1799\u1791\u17b6\u17c6\u1784\u179f\u1799\u179c\u17c4\u179f\u17d2\u1796\u179b\u17cb 4 \u1798\u17bb\u179b',
      'user.err.selfDel':   '\u179f\u17bcម\u1798\u17b7\u1793\u179f\u1799\u179a\u17b9\u1785\u1794\u1794\u17d2រ\u17bb\u179f\u178a\u17bc\u�\u182\u1798\u17b7\u1793\u1797\u17b6\u179a\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb\u179c\u17c4\u179b',
      'user.ok.created':    '\u179f\u17d2\u179a\u17b6ប\u17cb\u1798\u17b7\u1793\u1797\u17b6\u179a "{name}" \u1780\u17d2\u179a\u17b7\u1791\u17d0\u1799 {role}',
      'user.ok.updated':    '\u1798\u17b7\u1793\u1797\u17b6\u179a\u179f\u17d2\u179a\u17b6ប\u17cb\u179f\u17d2\u�\u1799\u179a\u17bcល\u179b\u17cb\u179a\u17bcល\u179b\u17cb\u2026',
      'user.ok.deleted':    '\u1798\u17b7\u1793\u1797\u17b6\u179a\u179f\u17d2រ\u17bb\u179f\u179a\u17bcល\u179b\u17cb\u179a\u17bcល\u179b\u17cb\u2026',
      'user.err.update':    '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc\u1780\u17b6\u�\u179c\u178f\u1799\u179f\u17d2\u�\u1799',
      'user.err.delete':    '\u1794\u1794\u1794\u1798\u1794\u17b7\u1793\u179f\u17c1\u1799\u1796\u179a\u17bc\u1780\u17b6\u�\u179c\u179b\u17d2\u179a\u17bb\u179f',
      'user.err.fields':    '\u179f\u17bcម\u1796\u17b7\u1791\u17b7\u1793\u2026',

      'lang.toggle':        '\u2022 \u1797\u17b6\u179f\u17b6\u1781\u17d2\u1798\u17c2\u1780',
      'lang.en':            'English',
      'lang.kh':            '\u1797\u17b6\u179f\u17b6\u1781\u17d2\u1798\u17c2\u1780'
    }
  };

  function getLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'kh') return stored;
    } catch (_) {}
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('km') || nav.startsWith('kh') ? 'kh' : 'en';
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'kh') lang = 'en';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    applyStaticTranslations();
    document.documentElement.setAttribute('lang', lang);
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
  }

  // Lightweight pluralization helper. Pipe-separated values: "1 item | 2 items"
  function pickPlural(key, n) {
    const raw = (STRINGS[getLang()] || {})[key] || (STRINGS.en[key] || '');
    if (raw.indexOf('|') === -1) return raw;
    const parts = raw.split('|').map(s => s.trim());
    return (n === 1 ? parts[0] : parts[1] || parts[0]);
  }

  function format(template, vars) {
    if (!template) return '';
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ('{' + k + '}');
    });
  }

  function t(key, vars) {
    const lang = getLang();
    const dict = STRINGS[lang] || STRINGS.en;
    let value = dict[key];
    if (value === undefined) value = STRINGS.en[key] || key;
    if (key.endsWith('.count') || /Count$/.test(key)) {
      return format(pickPlural(key, vars && vars.n), vars);
    }
    return format(value, vars);
  }

  // Map of [data-i18n] attribute → text-content key (or placeholder / value)
  const ATTRS = [
    { attr: 'data-i18n-text',     kind: 'text' },
    { attr: 'data-i18n-placeholder', kind: 'placeholder' },
    { attr: 'data-i18n-title',    kind: 'title' }
  ];

  function applyStaticTranslations() {
    ATTRS.forEach(({ attr, kind }) => {
      document.querySelectorAll('[' + attr + ']').forEach(el => {
        const key = el.getAttribute(attr);
        if (!key) return;
        const value = t(key);
        if (kind === 'text') el.textContent = value;
        else if (kind === 'placeholder') el.setAttribute('placeholder', value);
        else if (kind === 'title') el.setAttribute('title', value);
      });
    });
  }

  function init() {
    const lang = getLang();
    document.documentElement.setAttribute('lang', lang);
    document.addEventListener('DOMContentLoaded', applyStaticTranslations);
  }

  window.I18N = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    applyStatic: applyStaticTranslations,
    onChange: function (handler) {
      document.addEventListener('i18n:change', function (e) { handler(e.detail.lang); });
    }
  };

  init();
})();