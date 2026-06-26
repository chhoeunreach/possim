const axios = require('axios');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '6813780266:AAEhpjJrKq0fSfdjHjVt3b9_REle-Sxy3Z0';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1004348236909';

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function formatCurrency(amount, currency) {
  const n = Number(amount) || 0;
  if (currency === 'USD') return '$' + n.toFixed(2);
  return '៛' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const msg = [
  '📋 *Shift Report \\- ' + escapeMarkdown('កម្ពុជាក្រោម') + '*',
  '',
  '🏢 *Branch:* ' + escapeMarkdown('កម្ពុជាក្រោម'),
  '👤 *Staff:* ' + escapeMarkdown('staff1'),
  '🕐 *Start:* 09:00',
  '🕐 *End:* 17:00',
  '',
  '💰 *Opening Balances*',
  '   ' + escapeMarkdown(formatCurrency(100, 'USD')) + ' \\(Cash\\)',
  '   ' + escapeMarkdown(formatCurrency(0, 'KHR')) + ' \\(Cash\\)',
];

const text = msg.join('\n');
console.log('TEXT:');
console.log(text);

axios.post('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
  chat_id: CHAT_ID,
  text: text,
  parse_mode: 'MarkdownV2',
  disable_web_page_preview: false
}).then(r => console.log('SUCCESS:', JSON.stringify(r.data))).catch(e => console.error('ERROR:', JSON.stringify(e.response?.data || e.message)));
