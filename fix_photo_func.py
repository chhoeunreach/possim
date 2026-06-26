import re
import sys

def replace_function(content, func_name, new_func):
    pattern = rf'async function {re.escape(func_name)}\\([^)]*\\) \\{{[^}}]+\\}}'
    # Since the function may contain nested braces, we need a more robust approach.
    # Instead, we'll find the start and then balance braces.
    start_pattern = f'async function {re.escape(func_name)}'
    start = content.find(start_pattern)
    if start == -1:
        return False, f'Function {func_name} not found'
    brace_count = 0
    i = start
    while i < len(content):
        ch = content[i]
        if ch == '{':
            brace_count += 1
        elif ch == '}':
            brace_count -= 1
            if brace_count == 0:
                # Found the end
                end = i + 1
                break
        i += 1
    else:
        return False, 'Could not find matching brace'
    # Replace
    new_content = content[:start] + new_func + content[end:]
    return True, new_content

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

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

success, result = replace_function(content, 'sendTelegramPhoto', new_func)
if not success:
    print(f'Error: {result}', file=sys.stderr)
    sys.exit(1)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(result)
print('Function replaced successfully')
