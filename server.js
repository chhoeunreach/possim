const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

require('dotenv').config();

const { initDB, getPool } = require('./db');
const { connectRedis, getRedis } = require('./redis');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pos-mini-app-secret-key-change-in-production';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `invoice_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|bmp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) ||
               allowed.test(file.mimetype);
    cb(null, ok);
  }
});

function query(sql, params) {
  return getPool().execute(sql, params || []).then(([rows]) => rows);
}

function queryOne(sql, params) {
  return query(sql, params).then(rows => rows[0] || null);
}

function execute(sql, params) {
  return getPool().execute(sql, params || []).then(([result]) => result);
}

async function initSchema() {
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'staff'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      branch_name VARCHAR(255) NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NULL,
      opening_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
      opening_khr DECIMAL(12,2) NOT NULL DEFAULT 0,
      closing_usd DECIMAL(12,2) NULL,
      closing_khr DECIMAL(12,2) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      opening_photo_url TEXT NULL,
      closing_photo_url TEXT NULL,
      INDEX idx_shifts_user_id (user_id),
      INDEX idx_shifts_status (status),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Idempotent column adds for older databases created before opening_photo_url / closing_photo_url existed
  try { await execute('ALTER TABLE shifts ADD COLUMN opening_photo_url TEXT NULL'); } catch (_) {}
  try { await execute('ALTER TABLE shifts ADD COLUMN closing_photo_url TEXT NULL'); } catch (_) {}

  await execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shift_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      currency VARCHAR(10) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      cost DECIMAL(12,2) DEFAULT 0,
      invoice_url TEXT,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_transactions_shift_id (shift_id),
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_logs_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('Database schema initialized');
}

async function seedSampleData() {
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'staff1', password: 'password123', role: 'staff' },
    { username: 'staff2', password: 'password123', role: 'staff' },
    { username: 'staff3', password: 'password123', role: 'staff' }
  ];

  const userIds = {};
  for (const u of users) {
    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [u.username]);
    if (existing) {
      userIds[u.username] = existing.id;
    } else {
      const hash = bcrypt.hashSync(u.password, 10);
      const result = await execute(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [u.username, hash, u.role]
      );
      userIds[u.username] = result.insertId;
      console.log(`Seed user created: ${u.username} / ${u.password} (${u.role})`);
    }
  }

  const hasData = await queryOne('SELECT id FROM shifts LIMIT 1');
  if (hasData) {
    console.log('Sample shift data already exists — skipping');
    return;
  }

  const branches = ['SIM Retail - Main Branch', 'SIM Retail - North Branch'];

  function daysFromNow(n) {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date;
  }

  const sampleShifts = [
    { daysAgo: 3, userId: userIds['staff1'], branch: branches[0], openUSD: 500, openKHR: 500000, closeUSD: 800, closeKHR: 600000,
      txns: [
        { type: 'inflow', currency: 'USD', method: 'Cash', amount: 200, cost: 0, hour: 9, min: 15 },
        { type: 'inflow', currency: 'USD', method: 'Bank', amount: 150, cost: 0, hour: 10, min: 30 },
        { type: 'inflow', currency: 'KHR', method: 'Cash', amount: 100000, cost: 0, hour: 11, min: 0 },
        { type: 'outflow', currency: 'USD', method: 'Cash', amount: 50, cost: 45, hour: 14, min: 0 }
      ],
      logs: [
        { action: 'Opened shift', details: 'Opened shift for branch "SIM Retail - Main Branch" with $500.00 USD and ៛500,000 KHR', hour: 8 },
        { action: 'Created transaction', details: 'Inflow of $200.00 via Cash', hour: 9 },
        { action: 'Created transaction', details: 'Inflow of $150.00 via Bank', hour: 10 },
        { action: 'Created transaction', details: 'Inflow of ៛100,000 via Cash', hour: 11 },
        { action: 'Created transaction', details: 'Outflow of $50.00 via Cash (cost: $45.00)', hour: 14 },
        { action: 'Closed shift', details: 'Closed shift for branch "SIM Retail - Main Branch". Expected USD: $800.00, Actual USD: $800.00 (+$300.00)', hour: 17 }
      ] },
    { daysAgo: 2, userId: userIds['staff2'], branch: branches[1], openUSD: 300, openKHR: 200000, closeUSD: 450, closeKHR: 180000,
      txns: [
        { type: 'inflow', currency: 'USD', method: 'Cash', amount: 100, cost: 0, hour: 10, min: 0 },
        { type: 'inflow', currency: 'USD', method: 'Bank', amount: 80, cost: 0, hour: 11, min: 15 },
        { type: 'outflow', currency: 'USD', method: 'Cash', amount: 30, cost: 28, hour: 13, min: 30 },
        { type: 'outflow', currency: 'KHR', method: 'Bank', amount: 20000, cost: 0, hour: 14, min: 45 }
      ],
      logs: [
        { action: 'Opened shift', details: 'Opened shift for branch "SIM Retail - North Branch" with $300.00 USD and ៛200,000 KHR', hour: 9 },
        { action: 'Created transaction', details: 'Inflow of $100.00 via Cash', hour: 10 },
        { action: 'Created transaction', details: 'Inflow of $80.00 via Bank', hour: 11 },
        { action: 'Created transaction', details: 'Outflow of $30.00 via Cash (cost: $28.00)', hour: 13 },
        { action: 'Created transaction', details: 'Outflow of ៛20,000 via Bank', hour: 14 },
        { action: 'Closed shift', details: 'Closed shift for branch "SIM Retail - North Branch". Expected USD: $450.00, Actual USD: $450.00 (+$150.00)', hour: 16 }
      ] },
    { daysAgo: 1, userId: userIds['staff3'], branch: branches[0], openUSD: 400, openKHR: 300000, closeUSD: 610, closeKHR: 350000,
      txns: [
        { type: 'inflow', currency: 'USD', method: 'Cash', amount: 250, cost: 0, hour: 9, min: 30 },
        { type: 'inflow', currency: 'KHR', method: 'Cash', amount: 50000, cost: 0, hour: 11, min: 0 },
        { type: 'outflow', currency: 'USD', method: 'Cash', amount: 40, cost: 36, hour: 15, min: 0 }
      ],
      logs: [
        { action: 'Opened shift', details: 'Opened shift for branch "SIM Retail - Main Branch" with $400.00 USD and ៛300,000 KHR', hour: 8 },
        { action: 'Created transaction', details: 'Inflow of $250.00 via Cash', hour: 9 },
        { action: 'Created transaction', details: 'Inflow of ៛50,000 via Cash', hour: 11 },
        { action: 'Created transaction', details: 'Outflow of $40.00 via Cash (cost: $36.00)', hour: 15 },
        { action: 'Closed shift', details: 'Closed shift for branch "SIM Retail - Main Branch". Expected USD: $610.00, Actual USD: $610.00 (+$210.00)', hour: 17 }
      ] },
    { daysAgo: 0, userId: userIds['staff1'], branch: branches[0], openUSD: 600, openKHR: 400000, closeUSD: null, closeKHR: null,
      txns: [],
      logs: [
        { action: 'Opened shift', details: 'Opened shift for branch "SIM Retail - Main Branch" with $600.00 USD and ៛400,000 KHR', hour: 8 }
      ] }
  ];

  for (const s of sampleShifts) {
    const baseDate = daysFromNow(s.daysAgo);

    function ts(h, m = 0) {
      const d = new Date(baseDate);
      d.setHours(h, m, Math.floor(Math.random() * 59), 0);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    }

    const startTime = ts(8, 0);
    const endTime = s.daysAgo > 0 ? ts(17, 0) : null;

    const shiftResult = await execute(
      `INSERT INTO shifts (user_id, branch_name, start_time, end_time, opening_usd, opening_khr, closing_usd, closing_khr, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.userId, s.branch, startTime, endTime, s.openUSD, s.openKHR, s.closeUSD, s.closeKHR, endTime ? 'closed' : 'open']
    );
    const shiftId = shiftResult.insertId;

    for (const t of s.txns) {
      await execute(
        `INSERT INTO transactions (shift_id, type, currency, payment_method, amount, cost, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [shiftId, t.type, t.currency, t.method, t.amount, t.cost, ts(t.hour, t.min || 0)]
      );
    }

    for (const l of s.logs) {
      await execute(
        'INSERT INTO activity_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, ?)',
        [s.userId, l.action, l.details, ts(l.hour)]
      );
    }

    console.log(`Sample shift created: #${shiftId} - ${s.branch} (${endTime ? 'closed' : 'open'})`);
  }

  console.log('Sample data seeded successfully');
}

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

async function logActivity(userId, action, details) {
  try {
    await execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details || null]
    );
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

async function loginRateLimiter(req, res, next) {
  const redis = getRedis();
  if (!redis) return next();

  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `login_attempts:${ip}`;

  try {
    const attempts = await redis.get(key);
    if (attempts && parseInt(attempts) >= 5) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again in 15 minutes.'
      });
    }
  } catch (err) {
    // Redis error — allow through
  }

  next();
}

function cacheResponse(durationSeconds) {
  return (req, res, next) => {
    const redis = getRedis();
    if (!redis) return next();

    const key = `cache:${req.originalUrl}`;

    redis.get(key).then(cached => {
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redis.setEx(key, durationSeconds, JSON.stringify(data)).catch(() => {});
        originalJson(data);
      };
      next();
    }).catch(() => next());
  };
}

function formatCurrency(amount, currency) {
  if (currency === 'USD') return `$${Number(amount).toFixed(2)}`;
  return `៛${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = 'MarkdownV2') {
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.warn('Telegram not configured, skipping photo send');
    return;
  }
  try {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', fs.createReadStream(photoPath));
    if (caption) form.append('caption', caption);
    if (parseMode) form.append('parse_mode', parseMode);

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      form,
      { headers: form.getHeaders() }
    );
    console.log(`Telegram photo sent: ${photoPath}`);
    return response.data;
  } catch (err) {
    console.error('Failed to send Telegram photo:', err);
    throw err;
  }
}

async function sendTelegramShiftOpenAlert(shift, userId) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured — skipping shift open alert');
    return;
  }
  try {
    const staffUser = await queryOne('SELECT username FROM users WHERE id = ?', [shift.user_id]);
    const staffName = staffUser ? staffUser.username : 'Unknown';
    const text = [
      `🟢 *Shift Opened \\- ${escapeMarkdown(shift.branch_name)}*`,
      '',
      `🏢 *Branch:* ${escapeMarkdown(shift.branch_name)}`,
      `👤 *Staff:* ${escapeMarkdown(staffName)}`,
      `💰 *Opening USD:* ${escapeMarkdown(formatCurrency(shift.opening_usd, 'USD'))}`,
      `💰 *Opening KHR:* ${escapeMarkdown(formatCurrency(shift.opening_khr, 'KHR'))}`,
      `🕐 ${escapeMarkdown(shift.start_time)}`
    ].join('\n');

    let photoPath = null;
    if (shift.opening_photo_url) {
      try {
        const filename = path.basename(new URL(shift.opening_photo_url).pathname);
        const candidate = path.join(__dirname, 'uploads', filename);
        if (filename && fs.existsSync(candidate)) photoPath = candidate;
      } catch (_) {
        const filename = shift.opening_photo_url.substring(shift.opening_photo_url.lastIndexOf('/') + 1);
        const candidate = path.join(__dirname, 'uploads', filename);
        if (filename && fs.existsSync(candidate)) photoPath = candidate;
      }
    }

    if (photoPath) {
      await sendTelegramPhoto(TELEGRAM_CHAT_ID, photoPath, text, null);
    } else {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        { chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }
      );
    }
    await logActivity(userId, 'Telegram notification sent', `Sent shift open alert for branch "${shift.branch_name}" via Telegram`);
  } catch (err) {
    console.error('Failed to send shift open alert:', err.response && err.response.data ? err.response.data : err.message);
  }
}

async function sendTelegramReport(shiftId, userId) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram bot not configured — skipping notification');
    return;
  }

  try {
    const shift = await queryOne(`
      SELECT s.*, u.username as staff_name FROM shifts s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
    `, [shiftId]);
    if (!shift) throw new Error(`Shift ${shiftId} not found`);

    const txns = await query(
      'SELECT * FROM transactions WHERE shift_id = ? ORDER BY timestamp ASC',
      [shiftId]
    );

    const inflowUSD = { Cash: 0, Bank: 0 };
    const inflowKHR = { Cash: 0, Bank: 0 };
    const outflowUSD = { Cash: 0, Bank: 0 };
    const outflowKHR = { Cash: 0, Bank: 0 };

    for (const t of txns) {
      if (t.type === 'inflow') {
        if (t.currency === 'USD') inflowUSD[t.payment_method] += parseFloat(t.amount);
        else inflowKHR[t.payment_method] += parseFloat(t.amount);
      } else {
        if (t.currency === 'USD') outflowUSD[t.payment_method] += parseFloat(t.amount);
        else outflowKHR[t.payment_method] += parseFloat(t.amount);
      }
    }

    const totalInflowUSD = inflowUSD.Cash + inflowUSD.Bank;
    const totalInflowKHR = inflowKHR.Cash + inflowKHR.Bank;
    const totalOutflowUSD = outflowUSD.Cash + outflowUSD.Bank;
    const totalOutflowKHR = outflowKHR.Cash + outflowKHR.Bank;

    const expectedUSD = parseFloat(shift.opening_usd) + totalInflowUSD - totalOutflowUSD;
    const expectedKHR = parseFloat(shift.opening_khr) + totalInflowKHR - totalOutflowKHR;

    const start = new Date(shift.start_time);
    const end = shift.end_time ? new Date(shift.end_time) : new Date();
    const durationMs = end - start;
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const duration = `${hours}h ${minutes}m`;

    const invoiceLines = txns
      .filter(t => t.invoice_url)
      .map((t, i) => `• [View Invoice #${i + 1} — ${escapeMarkdown(formatCurrency(t.amount, t.currency))}](${escapeMarkdown(t.invoice_url)})`);

    const msg = [
      `📋 *Shift Report \\- ${escapeMarkdown(shift.branch_name)}*`,
      '',
      `🏢 *Branch:* ${escapeMarkdown(shift.branch_name)}`,
      `👤 *Staff:* ${escapeMarkdown(shift.staff_name)}`,
      `🕐 *Start:* ${escapeMarkdown(shift.start_time)}`,
      `🕐 *End:* ${escapeMarkdown(shift.end_time || 'Ongoing')}`,
      `⏱ *Duration:* ${escapeMarkdown(duration)}`,
      '',
      '━━━━━━━━━━━━━━━━━━━',
      '',
      `💰 *Opening Balances*`,
      `   ${escapeMarkdown(formatCurrency(shift.opening_usd, 'USD'))} \\(Cash\\)`,
      `   ${escapeMarkdown(formatCurrency(shift.opening_khr, 'KHR'))} \\(Cash\\)`,
      '',
      `📈 *Total Inflows*`,
      `   USD: ${escapeMarkdown(formatCurrency(totalInflowUSD, 'USD'))} \\(Cash: ${escapeMarkdown(formatCurrency(inflowUSD.Cash, 'USD'))} \\| Bank: ${escapeMarkdown(formatCurrency(inflowUSD.Bank, 'USD'))}\\)`,
      `   KHR: ${escapeMarkdown(formatCurrency(totalInflowKHR, 'KHR'))} \\(Cash: ${escapeMarkdown(formatCurrency(inflowKHR.Cash, 'KHR'))} \\| Bank: ${escapeMarkdown(formatCurrency(inflowKHR.Bank, 'KHR'))}\\)`,
      '',
      `📉 *Total Outflows*`,
      `   USD: ${escapeMarkdown(formatCurrency(totalOutflowUSD, 'USD'))} \\(Cash: ${escapeMarkdown(formatCurrency(outflowUSD.Cash, 'USD'))} \\| Bank: ${escapeMarkdown(formatCurrency(outflowUSD.Bank, 'USD'))}\\)`,
      `   KHR: ${escapeMarkdown(formatCurrency(totalOutflowKHR, 'KHR'))} \\(Cash: ${escapeMarkdown(formatCurrency(outflowKHR.Cash, 'KHR'))} \\| Bank: ${escapeMarkdown(formatCurrency(outflowKHR.Bank, 'KHR'))}\\)`,
      '',
      '━━━━━━━━━━━━━━━━━━━',
      '',
      `💵 *Expected Closing*`,
      `   USD: ${escapeMarkdown(formatCurrency(expectedUSD, 'USD'))}`,
      `   KHR: ${escapeMarkdown(formatCurrency(expectedKHR, 'KHR'))}`,
      '',
      `✅ *Actual Closing*`,
      `   USD: ${escapeMarkdown(formatCurrency(shift.closing_usd || 0, 'USD'))}`,
      `   KHR: ${escapeMarkdown(formatCurrency(shift.closing_khr || 0, 'KHR'))}`,
    ];

    if (invoiceLines.length > 0) {
      msg.push('');
      msg.push('━━━━━━━━━━━━━━━━━━━');
      msg.push('');
      msg.push('📎 *Invoice Attachments*');
      msg.push(...invoiceLines);
    }

    const text = msg.join('\n');

    let closingPhotoPath = null;
    if (shift.closing_photo_url) {
      try {
        const filename = path.basename(new URL(shift.closing_photo_url).pathname);
        const candidate = path.join(__dirname, 'uploads', filename);
        if (filename && fs.existsSync(candidate)) closingPhotoPath = candidate;
      } catch (_) {
        const filename = shift.closing_photo_url.substring(shift.closing_photo_url.lastIndexOf('/') + 1);
        const candidate = path.join(__dirname, 'uploads', filename);
        if (filename && fs.existsSync(candidate)) closingPhotoPath = candidate;
      }
    }

    if (closingPhotoPath) {
      // Send as photo with plain-text caption (dynamic report content is fragile under MarkdownV2)
      await sendTelegramPhoto(TELEGRAM_CHAT_ID, closingPhotoPath, text, null);
    } else {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: false
      });
    }

    console.log(`Telegram report sent for shift #${shiftId}`);
    await logActivity(userId, 'Telegram notification sent', `Sent shift report for shift #${shiftId} via Telegram`);
  } catch (err) {
    console.error('Failed to send Telegram report:', err.response?.data || err.message);
  }
}

app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      const redis = getRedis();
      if (redis) {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const key = `login_attempts:${ip}`;
        await redis.incr(key);
        await redis.expire(key, 900);
      }
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(user.id, 'User logged in', `User "${user.username}" logged in as ${user.role}`);

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function sendTelegramTransactionAlert(txn, shift, userId) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured — skipping transaction alert');
    return;
  }
  try {
    const sign = txn.type === 'inflow' ? '📈' : '📉';
    const label = txn.type === 'inflow' ? 'Inflow' : 'Outflow';
    const branchName = shift && shift.branch_name ? shift.branch_name : 'N/A';
    const staffName = shift && shift.staff_name ? shift.staff_name : 'N/A';
    const amountStr = formatCurrency(txn.amount, txn.currency);
    const methodStr = txn.payment_method || 'N/A';
    const createdStr = txn.created_at || new Date().toISOString().replace('T', ' ').slice(0, 19);

    const lines = [
      `${sign} *${escapeMarkdown(label)} \\- ${escapeMarkdown(branchName)}*`,
      '',
      `🏢 *Branch:* ${escapeMarkdown(branchName)}`,
      `👤 *Staff:* ${escapeMarkdown(staffName)}`,
      `💰 *Amount:* ${escapeMarkdown(amountStr)} \\(${escapeMarkdown(txn.currency)}\\)`,
      `💳 *Method:* ${escapeMarkdown(methodStr)}`
    ];

    if (Number(txn.cost) > 0) {
      const costStr = formatCurrency(txn.cost, txn.currency);
      lines.push(`💸 *Cost:* ${escapeMarkdown(costStr)} \\(${escapeMarkdown(txn.currency)}\\)`);
    }

    lines.push(`🕐 ${escapeMarkdown(createdStr)}`);

    const caption = lines.join('\n');

    // Resolve invoice photo path on disk if it was uploaded
    let photoPath = null;
    if (txn.invoice_url) {
      let filename = null;
      try {
        filename = path.basename(new URL(txn.invoice_url).pathname);
      } catch (_) {
        filename = txn.invoice_url.substring(txn.invoice_url.lastIndexOf('/') + 1);
      }
      const candidate = path.join(__dirname, 'uploads', filename);
      if (filename && fs.existsSync(candidate)) {
        photoPath = candidate;
      }
    }

    console.log(`Sending Telegram transaction alert for shift #${txn.shift_id} (txn ${txn.id}) photo=${photoPath || 'none'}`);
    console.log('MESSAGE TEXT:', JSON.stringify(caption));

    if (photoPath) {
      await sendTelegramPhoto(TELEGRAM_CHAT_ID, photoPath, caption, null);
    } else {
      const resp = await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: TELEGRAM_CHAT_ID,
          text: caption,
          disable_web_page_preview: false
        }
      );
      console.log(`Telegram transaction alert sent (ok: ${resp.data && resp.data.ok})`);
    }
    await logActivity(userId, 'Telegram notification sent', `Sent transaction alert for shift #${txn.shift_id} (${txn.type} ${formatCurrency(txn.amount, txn.currency)}) via Telegram`);
  } catch (err) {
    console.error('Failed to send transaction alert:', err.response && err.response.data ? err.response.data : err.message);
  }
}

app.post('/api/shifts', authenticateToken, async (req, res) => {
  try {
    const { branch_name, opening_usd, opening_khr, opening_photo_url } = req.body;

    if (!branch_name || !branch_name.trim()) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const existing = await queryOne(
      "SELECT id FROM shifts WHERE user_id = ? AND status = 'open'",
      [req.user.id]
    );
    if (existing) {
      return res.status(409).json({ error: 'You already have an open shift. Close it before starting a new one.' });
    }

    const usd = parseFloat(opening_usd) || 0;
    const khr = parseFloat(opening_khr) || 0;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const photoUrl = (typeof opening_photo_url === 'string' && opening_photo_url.trim()) ? opening_photo_url.trim() : null;

    const result = await execute(
      'INSERT INTO shifts (user_id, branch_name, start_time, opening_usd, opening_khr, status, opening_photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, branch_name.trim(), now, usd, khr, 'open', photoUrl]
    );

    const shift = await queryOne('SELECT * FROM shifts WHERE id = ?', [result.insertId]);

    await logActivity(
      req.user.id,
      'Opened shift',
      `Opened shift for branch "${branch_name.trim()}" with $${usd.toFixed(2)} USD and ៛${khr} KHR${photoUrl ? ' (photo attached)' : ''}`
    );

    sendTelegramShiftOpenAlert(shift, req.user.id);

    res.status(201).json(shift);
  } catch (err) {
    console.error('Create shift error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/shifts/current', authenticateToken, async (req, res) => {
  try {
    const shift = await queryOne(
      "SELECT * FROM shifts WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
      [req.user.id]
    );
    if (!shift) return res.json(null);
    res.json(shift);
  } catch (err) {
    console.error('Get current shift error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/shifts/:id', authenticateToken, async (req, res) => {
  try {
    const shift = await queryOne(
      'SELECT * FROM shifts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    res.json(shift);
  } catch (err) {
    console.error('Get shift error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/shifts/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const shift = await queryOne(
      'SELECT id FROM shifts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    const txns = await query(
      'SELECT * FROM transactions WHERE shift_id = ? ORDER BY timestamp DESC',
      [req.params.id]
    );
    res.json(txns);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { shift_id, type, currency, payment_method, amount, cost, invoice_url } = req.body;

    if (!shift_id || !type || !currency || !payment_method || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: shift_id, type, currency, payment_method, amount' });
    }

    const shiftCheck = await queryOne(
      'SELECT id FROM shifts WHERE id = ? AND user_id = ? AND status = ?',
      [shift_id, req.user.id, 'open']
    );
    if (!shiftCheck) {
      return res.status(400).json({ error: 'Shift not found or is already closed' });
    }

    const shift = await queryOne(
      'SELECT s.id, s.branch_name, u.username as staff_name FROM shifts s JOIN users u ON u.id = s.user_id WHERE s.id = ?',
      [shift_id]
    );

    const validTypes = ['inflow', 'outflow'];
    const validCurrencies = ['USD', 'KHR'];
    const validMethods = ['Cash', 'Bank'];

    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
    if (!validCurrencies.includes(currency)) return res.status(400).json({ error: 'Invalid currency' });
    if (!validMethods.includes(payment_method)) return res.status(400).json({ error: 'Invalid payment method' });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) return res.status(400).json({ error: 'Amount must be zero or a positive number' });

    const costAmt = parseFloat(cost) || 0;

    const result = await execute(
      'INSERT INTO transactions (shift_id, type, currency, payment_method, amount, cost, invoice_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [shift_id, type, currency, payment_method, amt, costAmt, invoice_url || null]
    );

    const txn = await queryOne('SELECT * FROM transactions WHERE id = ?', [result.insertId]);

    const txnDesc = `${type === 'inflow' ? 'Inflow' : 'Outflow'} of ${formatCurrency(amt, currency)} via ${payment_method}` + (costAmt > 0 ? ` (cost: ${formatCurrency(costAmt, currency)})` : '');
    await logActivity(req.user.id, 'Created transaction', txnDesc);

    sendTelegramTransactionAlert(txn, shift, req.user.id);

    res.status(201).json(txn);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/shifts/:id/close', authenticateToken, async (req, res) => {
  try {
    const { closing_usd, closing_khr, closing_photo_url } = req.body;
    const shift = await queryOne(
      'SELECT * FROM shifts WHERE id = ? AND user_id = ? AND status = ?',
      [req.params.id, req.user.id, 'open']
    );

    if (!shift) return res.status(404).json({ error: 'Open shift not found' });

    const usd = parseFloat(closing_usd) || 0;
    const khr = parseFloat(closing_khr) || 0;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const photoUrl = (typeof closing_photo_url === 'string' && closing_photo_url.trim()) ? closing_photo_url.trim() : null;

    await execute(
      'UPDATE shifts SET closing_usd = ?, closing_khr = ?, end_time = ?, status = ?, closing_photo_url = ? WHERE id = ?',
      [usd, khr, now, 'closed', photoUrl, req.params.id]
    );

    const updated = await queryOne('SELECT * FROM shifts WHERE id = ?', [req.params.id]);

    const expectedUSD = parseFloat(shift.opening_usd);
    const actualUSD = usd;
    const diffUSD = actualUSD - expectedUSD;
    const logDetail = `Closed shift for branch "${shift.branch_name}". Expected USD: ${formatCurrency(expectedUSD, 'USD')}, Actual USD: ${formatCurrency(actualUSD, 'USD')} (${diffUSD >= 0 ? '+' : ''}${formatCurrency(diffUSD, 'USD')})${photoUrl ? ' (photo attached)' : ''}`;
    await logActivity(req.user.id, 'Closed shift', logDetail);

    sendTelegramReport(req.params.id, req.user.id);

    res.json(updated);
  } catch (err) {
    console.error('Close shift error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/upload', authenticateToken, upload.single('invoice'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/admin/shifts', authenticateToken, requireAdmin, cacheResponse(30), async (req, res) => {
  try {
    const { branch } = req.query;
    let sql = `
      SELECT s.*, u.username as staff_name FROM shifts s
      JOIN users u ON u.id = s.user_id
    `;
    const params = [];
    if (branch && branch.trim() !== '') {
      sql += ' WHERE s.branch_name = ?';
      params.push(branch.trim());
    }
    sql += ' ORDER BY s.id DESC';
    const shifts = await query(sql, params);
    res.json(shifts);
  } catch (err) {
    console.error('Admin shifts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/transactions', authenticateToken, requireAdmin, cacheResponse(30), async (req, res) => {
  try {
    const txns = await query(`
      SELECT t.*, s.branch_name, u.username as staff_name FROM transactions t
      JOIN shifts s ON s.id = t.shift_id
      JOIN users u ON u.id = s.user_id
      ORDER BY t.id DESC
    `);
    res.json(txns);
  } catch (err) {
    console.error('Admin transactions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/logs', authenticateToken, requireAdmin, cacheResponse(30), async (req, res) => {
  try {
    const logs = await query(`
      SELECT l.*, u.username FROM activity_logs l
      JOIN users u ON u.id = l.user_id
      ORDER BY l.id DESC
    `);
    res.json(logs);
  } catch (err) {
    console.error('Admin logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const validRoles = ['staff', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'staff';

    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = await execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hash, userRole]
    );

    await logActivity(req.user.id, 'Created user', `Created ${userRole} user "${username}"`);

    res.status(201).json({ id: result.insertId, username, role: userRole });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, cacheResponse(30), async (req, res) => {
  try {
    const users = await query('SELECT id, username, role FROM users ORDER BY id ASC');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });

    const target = await queryOne('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const { username, password, role } = req.body;
    const updates = [];
    const params = [];

    if (typeof username === 'string' && username.trim() && username.trim() !== target.username) {
      const dup = await queryOne('SELECT id FROM users WHERE username = ? AND id <> ?', [username.trim(), userId]);
      if (dup) return res.status(409).json({ error: 'Username already exists' });
      updates.push('username = ?');
      params.push(username.trim());
    }

    const validRoles = ['staff', 'admin'];
    if (role !== undefined) {
      if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
      if (role !== target.role) {
        if (target.id === req.user.id && role !== 'admin') {
          return res.status(400).json({ error: 'You cannot demote your own admin account' });
        }
        if (target.role === 'admin' && role !== 'admin') {
          const adminCount = await queryOne("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
          if ((adminCount && adminCount.c <= 1)) {
            return res.status(400).json({ error: 'Cannot demote the last admin' });
          }
        }
        updates.push('role = ?');
        params.push(role);
      }
    }

    if (password !== undefined && password !== null && password !== '') {
      if (typeof password !== 'string' || password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
      }
      const hash = bcrypt.hashSync(password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.json({ id: target.id, username: target.username, role: target.role });
    }

    params.push(userId);
    await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    await logActivity(
      req.user.id,
      'Updated user',
      `Updated user "${target.username}" (#${userId})${password ? ' (password changed)' : ''}${role && role !== target.role ? ` (role: ${target.role} → ${role})` : ''}`
    );

    const updated = await queryOne('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    res.json(updated);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const target = await queryOne('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.role === 'admin') {
      const adminCount = await queryOne("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
      if (adminCount && adminCount.c <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    const txnCount = await queryOne('SELECT COUNT(*) AS c FROM transactions t JOIN shifts s ON s.id = t.shift_id WHERE s.user_id = ?', [userId]);
    if (txnCount && txnCount.c > 0) {
      return res.status(400).json({ error: 'Cannot delete user with existing shift transactions. Deactivate instead.' });
    }
    const shiftCount = await queryOne('SELECT COUNT(*) AS c FROM shifts WHERE user_id = ?', [userId]);
    if (shiftCount && shiftCount.c > 0) {
      return res.status(400).json({ error: 'Cannot delete user with existing shifts. Deactivate instead.' });
    }

    await execute('DELETE FROM users WHERE id = ?', [userId]);
    await logActivity(req.user.id, 'Deleted user', `Deleted user "${target.username}" (#${userId})`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10MB)' });
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await initDB();
    console.log('MySQL connected');
    await initSchema();
    await seedSampleData();
    await connectRedis();

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      console.log(`Telegram bot configured: chat_id=${TELEGRAM_CHAT_ID}`);
    } else {
      console.warn('Telegram bot NOT configured — messages will be skipped');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`POS Mini App server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
