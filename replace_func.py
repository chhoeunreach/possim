import re

def replace_function(content):
    # Pattern to match the function (including its body)
    pattern = r'asynchronous function sendTelegramTransactionAlert\(txn, shift\) \{[\s\S]*?\n\}'
    # New function definition
    new_func = '''async function sendTelegramTransactionAlert(txn, shift) {
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
      photoPath = require('path').join(__dirname, 'uploads', filename);
      // Check if file exists
      const fs = require('fs');
      if (fs.existsSync(photoPath)) {
        // Build caption
        const sign = txn.type === 'inflow' ? '📈' : '📉';
        const label = txn.type === 'inflow' ? 'Inflow' : 'Outflow';
        const costLine = txn.cost > 0 ? \n💸 *Cost:*  : '';
        caption = [
          ${sign} * \\- *,
          '',
          🏢 *Branch:* ,
          👤 *Staff:* ,
          💰 *Amount:* ,
          💳 *Method:* ,
          costLine,
          🕐 
        ].filter(l => l !== '').join('\n');
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
    const costLine = txn.cost > 0 ? \n💸 *Cost:*  : '';
    const invoiceLine = txn.invoice_url ? \n📎 [View Invoice]() : '';

    const text = [
      ${sign} * \\- *,
      '',
      🏢 *Branch:* ,
      👤 *Staff:* ,
      💰 *Amount:* ,
      💳 *Method:* ,
      costLine,
      invoiceLine,
      🕐 
    ].filter(l => l !== '').join('\n');

    console.log(Sending Telegram transaction alert for shift # (: ));
    console.log('MESSAGE TEXT:', JSON.stringify(text));

    const resp = await axios.post(https://api.telegram.org/bot/sendMessage, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: false
    });

    console.log(Telegram transaction alert sent (ok: ));
  } catch (err) {
    console.error('Failed to send transaction alert:', err.response?.data || err.message);
    if (err.response?.data?.description?.includes('can\\'t parse entities')) {
      console.error('Markdown error in text — sending without parse_mode');
      try {
        const fallbackText = ${txn.type === 'inflow' ? '📈 Inflow' : '📉 Outflow'} - \nAmount: \nMethod: ;
        await axios.post(https://api.telegram.org/bot/sendMessage, {
          chat_id: TELEGRAM_CHAT_ID,
          text: fallbackText
        });
        console.log('Fallback message sent');
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  }
}'''
    # Use re.DOTALL to match across lines
    new_content = re.sub(pattern, new_func, content, flags=re.DOTALL)
    return new_content

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = replace_function(content)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Function replaced successfully')
