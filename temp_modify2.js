const fs = require('fs');
let data = fs.readFileSync('server.js', 'utf8');
const search = '\n\nasync function sendTelegramShiftOpenAlert(shift) {';
const replace = '\n\nasync function sendTelegramPhoto(chatId, photoPath, caption, parseMode = \'MarkdownV2\') {\n  if (!TELEGRAM_BOT_TOKEN || !chatId) {\n    console.warn(\'Telegram not configured, skipping photo send\');\n    return;\n  }\n  try {\n    const form = new FormData();\n    form.append(\'chat_id\', chatId);\n    form.append(\'photo\', fs.createReadStream(photoPath));\n    if (caption) form.append(\'caption\", caption);\n    if (parseMode) form.append(\'parse_mode\", parseMode);\n\n    const response = await axios.post(\n      \https://api.telegram.org/bot\/sendPhoto\,\n      form,\n      { headers: form.getHeaders() }\n    );\n    console.log(\Telegram photo sent: \\);\n    return response.data;\n  } catch (err) {\n    console.error(\'Failed to send Telegram photo:\', err);\n    throw err;\n  }\n}\n\nasync function sendTelegramShiftOpenAlert(shift) {';
const newData = data.replace(search, replace);
fs.writeFileSync('server.js', newData, 'utf8');
