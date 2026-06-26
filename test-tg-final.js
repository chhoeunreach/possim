const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function formatCurrency(amount, currency) {
  if (currency === 'USD') return '$' + Number(amount).toFixed(2);
  return '៛' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

async function test(msg, label) {
  console.log(`\n=== ${label} ===`);
  try {
    const resp = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: msg,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: false
    });
    console.log('SUCCESS:', resp.data.ok);
  } catch (err) {
    console.error('ERROR:', JSON.stringify(err.response?.data || err.message));
  }
}

// Test 1: Shift open alert (exact format from sendTelegramShiftOpenAlert)
const shiftOpenMsg = [
  `🟢 *Shift Opened \\- ${escapeMarkdown('TestBranch')}*`,
  '',
  `🏢 *Branch:* ${escapeMarkdown('TestBranch')}`,
  `👤 *Staff:* ${escapeMarkdown('staff1')}`,
  `💰 *Opening USD:* ${escapeMarkdown(formatCurrency(100, 'USD'))}`,
  `💰 *Opening KHR:* ${escapeMarkdown(formatCurrency(0, 'KHR'))}`,
  `🕐 ${escapeMarkdown('2026-06-26 09:00:00')}`
].join('\n');

// Test 2: Transaction alert (exact format from sendTelegramTransactionAlert)
const txnMsg = [
  `📈 *Inflow \\- ${escapeMarkdown('TestBranch')}*`,
  '',
  `🏢 *Branch:* ${escapeMarkdown('TestBranch')}`,
  `👤 *Staff:* ${escapeMarkdown('staff1')}`,
  `💰 *Amount:* ${escapeMarkdown(formatCurrency(25, 'USD'))}`,
  `💳 *Method:* Cash`,
  `🕐 ${escapeMarkdown('2026-06-26 14:30:00')}`
].filter(l => l !== '').join('\n');

// Test 3: Transaction alert with invoice (exact format)
const invoiceUrl = 'http://localhost:3000/uploads/invoice_test.jpg';
const txnWithInvoice = [
  `📉 *Outflow \\- ${escapeMarkdown('TestBranch')}*`,
  '',
  `🏢 *Branch:* ${escapeMarkdown('TestBranch')}`,
  `👤 *Staff:* ${escapeMarkdown('staff1')}`,
  `💰 *Amount:* ${escapeMarkdown(formatCurrency(5000, 'KHR'))}`,
  `💳 *Method:* Bank`,
  `📎 [View Invoice](${escapeMarkdown(invoiceUrl)})`,
  `🕐 ${escapeMarkdown('2026-06-26 14:30:00')}`
].filter(l => l !== '').join('\n');

test(shiftOpenMsg, 'Shift Open Alert');
test(txnMsg, 'Transaction Alert (no invoice)');
test(txnWithInvoice, 'Transaction Alert (with invoice)');
