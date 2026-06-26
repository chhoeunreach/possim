const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// The new function source
const newFunc = sync function sendTelegramTransactionAlert(txn, shift) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured — skipping transaction alert');
    return;
  }
  try {
    // Extract filename from invoice_url if present
    let photoPath = null;
    let caption = '';
    if (txn.invoice_url) {
      const filename = txn.invoice_url.substring(txn.invoice_url.lastIndexOf('/') + 1);
      photoPath = path.join(__dirname, 'uploads', filename);
      // Check if file exists
      const fs = require('fs');
      if (fs.existsSync(photoPath)) {
        // Build caption
        const sign = txn.type === 'inflow' ? '📈' : '📉';
        const label = txn.type === 'inflow' ? 'Inflow' : 'Outflow';
        const costLine = txn.cost > 0 ? \\\n💸 *Cost:* \\ : '';
        caption = [
          \\ *\ \\\\- \*\,
          '',
          \🏢 *Branch:* \\,
          \👤 *Staff:* \\,
          \💰 *Amount:* \\,
          \💳 *Method:* \\,
          costLine,
          \🕐 \\
        ].filter(l => l !== '').join('\\n');
      }
    }

    if (photoPath) {
      // Send as photo
      await sendTelegramPhoto(TELEGRAM_CHAT_ID, photoPath, caption);
      return;
    }

    // Fallback to text message
    const sign = txn.type === 'inflow' ? '📈' : '📉';
    const label = txn.type === 'inflow' ? 'Inflow' : 'Outflow';
    const costLine = txn.cost > 0 ? \\\n💸 *Cost:* \\ : '';
    const invoiceLine = txn.invoice_url ? \\\n📎 [View Invoice]()\ : '';

    const text = [
      \\ *\ \\\\- \*\,
      '',
      \🏢 *Branch:* \\,
      \👤 *Staff:* \\,
      \💰 *Amount:* \\,
      \💳 *Method:* \\,
      costLine,
      invoiceLine,
      \🕐 \\
    ].filter(l => l !== '').join('\\n');

    console.log(\Sending Telegram transaction alert for shift #\ (\: \)\);
    console.log('MESSAGE TEXT:', JSON.stringify(text));

    const resp = await axios.post(\https://api.telegram.org/bot\/sendMessage\, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: false
    });

    console.log(\Telegram transaction alert sent (ok: \)\);
  } catch (err) {
    console.error('Failed to send transaction alert:', err.response?.data || err.message);
    if (err.response?.data?.description?.includes('can\\\\'t parse entities')) {
      console.error('Markdown error in text — sending without parse_mode');
      try {
        const fallbackText = \\ - \\;
        await axios.post(\https://api.telegram.org/bot\/sendMessage\, {
          chat_id: TELEGRAM_CHAT_ID,
          text: fallbackText
        });
        console.log('Fallback message sent');
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  }
};

// Find the start of the function
const startMarker = 'async function sendTelegramTransactionAlert(txn, shift) {';
let startPos = content.indexOf(startMarker);
if (startPos === -1) {
  console.error('Function not found');
  process.exit(1);
}

// Find the matching closing brace
let braceCount = 0;
let i = startPos;
while (i < content.length) {
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      // Found the end
      const endPos = i + 1; // include the closing brace
      const before = content.slice(0, startPos);
      const after = content.slice(endPos);
      content = before + newFunc + after;
      break;
    }
  }
  i++;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Function replaced successfully');
