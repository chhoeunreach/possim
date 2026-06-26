require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function query(pool, sql, params) {
  const [rows] = await pool.execute(sql, params || []);
  return rows;
}

async function queryOne(pool, sql, params) {
  const rows = await query(pool, sql, params);
  return rows[0] || null;
}

async function execute(pool, sql, params) {
  const [result] = await pool.execute(sql, params || []);
  return result;
}

async function seed() {
  const dbName = process.env.DB_NAME || 'pos_mini_app';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    timezone: '+07:00'
  });

  console.log('Connected to MySQL\n');

  // --- Create tables first (ignore if exist) ---
  console.log('Creating tables...');
  await execute(pool, `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'staff'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await execute(pool, `
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
      INDEX idx_shifts_user_id (user_id),
      INDEX idx_shifts_status (status),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await execute(pool, `
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
  await execute(pool, `
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
  console.log('Tables ready\n');

  // --- Clear existing data ---
  console.log('Clearing existing data...');
  await execute(pool, 'SET FOREIGN_KEY_CHECKS = 0');
  await execute(pool, 'DELETE FROM activity_logs');
  await execute(pool, 'DELETE FROM transactions');
  await execute(pool, 'DELETE FROM shifts');
  await execute(pool, 'DELETE FROM users');
  await execute(pool, 'ALTER TABLE users AUTO_INCREMENT = 1');
  await execute(pool, 'ALTER TABLE shifts AUTO_INCREMENT = 1');
  await execute(pool, 'ALTER TABLE transactions AUTO_INCREMENT = 1');
  await execute(pool, 'ALTER TABLE activity_logs AUTO_INCREMENT = 1');
  await execute(pool, 'SET FOREIGN_KEY_CHECKS = 1');
  console.log('All tables cleared\n');

  // --- Seed users ---
  console.log('Creating users...');
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'staff1', password: 'password123', role: 'staff' },
    { username: 'staff2', password: 'password123', role: 'staff' },
    { username: 'staff3', password: 'password123', role: 'staff' }
  ];

  const userIds = {};
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    const result = await execute(pool, 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [u.username, hash, u.role]);
    userIds[u.username] = result.insertId;
    console.log(`  ${u.username} / ${u.password} (${u.role})`);
  }

  // --- Seed shifts, transactions & logs ---
  console.log('\nCreating sample shifts...');
  const branches = ['SIM Retail - Main Branch', 'SIM Retail - North Branch'];

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  function makeTs(baseDate, h, m) {
    const d = new Date(baseDate);
    d.setHours(h, m || 0, 0, 0);
    return d.toISOString().replace('T', ' ').slice(0, 19);
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
    const startTime = makeTs(baseDate, 8, 0);
    const endTime = s.daysAgo > 0 ? makeTs(baseDate, 17, 0) : null;

    const shiftResult = await execute(pool,
      `INSERT INTO shifts (user_id, branch_name, start_time, end_time, opening_usd, opening_khr, closing_usd, closing_khr, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.userId, s.branch, startTime, endTime, s.openUSD, s.openKHR, s.closeUSD, s.closeKHR, endTime ? 'closed' : 'open']
    );
    const shiftId = shiftResult.insertId;

    for (const t of s.txns) {
      await execute(pool,
        'INSERT INTO transactions (shift_id, type, currency, payment_method, amount, cost, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [shiftId, t.type, t.currency, t.method, t.amount, t.cost, makeTs(baseDate, t.hour, t.min)]
      );
    }

    for (const l of s.logs) {
      await execute(pool,
        'INSERT INTO activity_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, ?)',
        [s.userId, l.action, l.details, makeTs(baseDate, l.hour)]
      );
    }

    console.log(`  Shift #${shiftId}: ${s.branch} — ${s.userId === userIds['staff1'] ? 'staff1' : s.userId === userIds['staff2'] ? 'staff2' : 'staff3'} (${endTime ? 'closed' : 'open'})`);
  }

  console.log('\nSample data seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('  admin   / admin123');
  console.log('  staff1  / password123');
  console.log('  staff2  / password123');
  console.log('  staff3  / password123');

  await pool.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
