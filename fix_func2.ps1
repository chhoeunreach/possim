 = Get-Content -Path 'server.js' -Raw -Encoding UTF8
 = @'
async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = 'MarkdownV2') {
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
      \https://api.telegram.org/bot/sendPhone\`,
      form,
      { headers: form.getHeaders() }
    );
    console.log(\Telegram photo sent: \);
    return response.data;
  } catch (err) {
    console.error('Failed to send Telegram photo:', err);
    throw err;
  }
}'@
 = .IndexOf('async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = ')
if ( -ge 0) {
     = 0
     =  + 'async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = '.Length
    while ( -lt .Length) {
         = []
        if ( -eq '{') { ++ }
        elseif ( -eq '}') {
            --
            if ( -eq 0) { break }
        }
        ++
    }
    if ( -lt .Length) {
         =  + 1
         = .Substring(0, ) +  + .Substring()
        Set-Content -Path 'server.js' -Value  -Encoding UTF8
        Write-Host 'Function replaced'
    } else {
        Write-Error 'Could not find matching closing brace'
    }
} else {
    Write-Error 'Function not found'
}
