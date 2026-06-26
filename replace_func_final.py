import sys

def replace_function_between_markers(content, start_marker, end_marker, new_text):
    start = content.find(start_marker)
    if start == -1:
        return False, f'Start marker not found: {start_marker}'
    # Find the matching end brace for the function
    brace_count = 0
    i = start + len(start_marker)
    while i < len(content):
        ch = content[i]
        if ch == '{':
            brace_count += 1
        elif ch == '}':
            brace_count -= 1
            if brace_count == 0:
                end = i + 1  # include the closing brace
                break
        i += 1
    else:
        return False, 'Could not find matching closing brace'
    # Replace
    new_content = content[:start] + new_text + content[end:]
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

start_marker = 'async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = \\'MarkdownV2\\') {'
success, new_content = replace_function_between_markers(content, start_marker, '}', new_func)
if not success:
    print(f'Error: {new_content}', file=sys.stderr)
    sys.exit(1)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Function replaced successfully')
