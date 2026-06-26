const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let data = fs.readFileSync(filePath, 'utf8');

// New function to replace the existing sendTelegramTransactionAlert
const newFunction = sync function sendTelegramTransactionAlert(txn, shift) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured — skipping transaction alert');
    return;
  }
  try {
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

    // If there's an invoice, send as photo with caption
    if (txn.invoice_url) {
      // Extract filename from URL
      const filename = txn.invoice_url.substring(txn.invoice_url.lastIndexOf('/') + 1);
      const filePath = path.join(__dirname, 'uploads', filename);
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        const caption = [
          \\ *\ \\\\- \*\,
          '',
          \🏢 *Branch:* \\,
          \👤 *Staff:* \\,
          \💰 *Amount:* \\,
          \💳 *Method:* \\,
          costLine.replace(/\\\\n/g, ''), // Remove newline from cost line for caption
          \🕐 \\
        ].filter(l => l !== '').join('\\n');
        
        await sendTelegramPhoto(TELEGRAM_CHAT_ID, filePath, caption);
        console.log('Telegram photo sent for transaction');
        return; // Sent as photo, done
      } else {
        console.warn(\Invoice file not found: \\);
        // Fall back to sending message
      }
    }

    // No invoice or file not found, send as message
    const resp = await axios.post(\https://api.telegram.org/bot\/sendMessage\, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: false
    });

    console.log(\Telegram transaction alert sent (ok: \)\);
  } catch (err) {
    console.error('Failed to send transaction alert:', err.response?.data || err.message);
    if (err.response?.data?.description?.includes('can\\'t parse entities')) {
      console.error('Markdown error in text — sending without parse_mode');
      try {
        const fallbackText = \\ - \\\nAmount: \\\nMethod: \\;
        await axios.post(\https://api.telegram.org/bot\/sendMessage\, {
          chat_id: TELEGRAM_CHAT_ID,
          text: fallbackText
        });
        console.log('Fallback Telegram message sent (plain text)');
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr.response?.data || fallbackErr.message);
      }
    }
  }
};

// We need to replace the existing function. Let's find the start and end.
// We'll use a regex to match the function from 'async function sendTelegramTransactionAlert' to the closing brace that matches the opening brace.
// But simpler: replace from 'async function sendTelegramTransactionAlert(txn, shift) {' to the line before 'app.post' (the next function after it).
// However, we can do a more precise replacement by finding the function and its matching braces.

const start = data.indexOf('async function sendTelegramTransactionAlert(txn, shift) {');
if (start === -1) {
  console.error('Function not found');
  process.exit(1);
}

// Now find the matching closing brace
let braceCount = 0;
let i = start;
while (i < data.length) {
  if (data[i] === '{') braceCount++;
  if (data[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      // Found the end
      const end = i + 1; // include the closing brace
      const before = data.slice(0, start);
      const after = data.slice(end);
      data = before + newFunction + after;
      break;
    }
  }
  i++;
}

fs.writeFileSync(filePath, data, 'utf8');
console.log('sendTelegramTransactionAlert function replaced successfully');
