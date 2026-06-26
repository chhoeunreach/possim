 = Get-Content -Path 'server.js' -Encoding UTF8
 = @(
    '    const response = await axios.post(',
    '      $https://api.telegram.org/bot/sendPhoto,',
    '      form,',
    '      { headers: form.getHeaders() }',
    '    );',
    '    console.log(Telegram photo sent: );',
    '    return response.data;'
)
 = [0..347]
 = [357..(.Length-1)]
 =  +  + 
Set-Content -Path 'server.js' -Value  -Encoding UTF8
Write-Host 'Lines replaced'
