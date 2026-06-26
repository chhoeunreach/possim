use strict;
use warnings;

open my , '<:encoding(UTF-8)', 'server.js' or die \"Cannot open file: $!\";
local $/; # Enable slurp mode
my  = <>;
close ;

my \ = <<'NEW_FUNC';
async function sendTelegramTransactionAlert(txn, shift) {
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
        const costLine = txn.cost > 0 ? \\n💸 *Cost*: \ : '';
        caption = [
          \\ *\ \\- \*\,
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
    const costLine = txn.cost > 0 ? \\n💸 *Cost*: \ : '';
    const invoiceLine = txn.invoice_url ? \\n📎 [View Invoice]() : '';

    const text = [
      \\ *\ \\- \*\,
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
    if (err.response?.data?.description?.includes('can\\'t parse entities')) {
      console.error('Markdown error in text — sending without parse_mode');
      try {
        const fallbackText = \\ - \\nAmount: \\nMethod: \\;
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
}
NEW_FUNC

# Replace the function
if ( =~ s/(async function sendTelegramTransactionAlert\(txn, shift\) \{[\s\S]*?\})//s) {
  open my , '>:encoding(UTF-8)', 'server.js' or die \"Cannot write file: $!\";
  print  ;
  close ;
  print \"Function replaced successfully\\n\";
} else {
  die \"Function not found\\n\";
}
