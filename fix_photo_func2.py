import sys

with open('server.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find start line
start = None
for i, line in enumerate(lines):
    if line.strip().startswith('async function sendTelegramPhoto'):
        start = i
        break
if start is None:
    print('Function not found', file=sys.stderr)
    sys.exit(1)

# Find end by counting braces
brace_count = 0
for i in range(start, len(lines)):
    line = lines[i]
    brace_count += line.count('{')
    brace_count -= line.count('}')
    if brace_count == 0 and i > start:
        end = i  # inclusive
        break
else:
    print('Could not find matching brace', file=sys.stderr)
    sys.exit(1)

new_func = '''async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = 'MarkdownV2') {
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
      https://api.telegram.org/bot/sendPhoto,
      form,
      { headers: form.getHeaders() }
    );
    console.log(Telegram photo sent: );
    return response.data;
  } catch (err) {
    console.error('Failed to send Telegram photo:', err);
    throw err;
  }
}'''

# Ensure new_func ends with newline
if not new_func.endswith('\\n'):
    new_func += '\\n'

# Replace
lines[start:end+1] = [new_func]

with open('server.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Function replaced successfully')
