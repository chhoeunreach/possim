# Read the file lines
 = Get-Content -Path '.\server.js' -Encoding UTF8

# Find the line number where the function starts
 = -1
for ( = 0;  -lt .Length; ++) {
    if ([].TrimStart().StartsWith('async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = ')) {
         = 
        break
    }
}

if ( -ge 0) {
    # Find the matching closing brace
     = 0
     = 
    for ( = ;  -lt .Length; ++) {
         = []
        foreach ( in .ToCharArray()) {
            if ( -eq '{') { ++ }
            elseif ( -eq '}') {
                --
                if ( -eq 0) {
                     = 
                    break
                }
            }
        }
        if ( -eq 0) { break }
    }

    if ( -eq 0) {
        # Define the new function as an array of lines
         = @(
            'async function sendTelegramPhoto(chatId, photoPath, caption, parseMode = ''MarkdownV2'') {',
            '  if (!TELEGRAM_BOT_TOKEN || !chatId) {',
            '    console.warn(''Telegram not configured, skipping photo send'');',
            '    return;',
            '  }',
            '  try {',
            '    const form = new FormData();',
            '    form.append(''chat_id'', chatId);',
            '    form.append(''photo'', fs.createReadStream(photoPath));',
            '    if (caption) form.append(''caption'', caption);',
            '    if (parseMode) form.append(''parse_mode'', parseMode);',
            '    ',
            '    const response = await axios.post(',
            '      `https://api.telegram.org/bot/sendPhoto`,',
            '      form,',
            '      { headers: form.getHeaders() }',
            '    );',
            '    console.log(`Telegram photo sent: `);',
            '    return response.data;',
            '  } catch (err) {',
            '    console.error(''Failed to send Telegram photo:'', err);',
            '    throw err;',
            '  }',
            '}'
        )

        # Remove the old function lines
         = [0..(-1)] +  + [(+1)..(.Length-1)]

        # Write back to file
        Set-Content -Path '.\server.js' -Value  -Encoding UTF8
        Write-Host 'Function replaced successfully'
    } else {
        Write-Error 'Could not find matching closing brace'
    }
} else {
    Write-Error 'Function not found'
}
