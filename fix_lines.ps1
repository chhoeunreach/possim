 = Get-Content -Path 'server.js' -Encoding UTF8
# lines are 0-indexed
# We want to replace lines 348 to 356 inclusive (based on the output above)
# Let's verify the line numbers: from the output, line 348 is '    const response = await axios.post('
# We'll replace from index 348 to 356 (inclusive) with the new block.
 = @(
    '    const response = await axios.post(',
    '      $https://api.telegram.org/bot/sendPhoto,',
    '      form,',
    '      { headers: form.getHeaders() }',
    '    );',
    '    console.log(Telegram photo sent: );',
    '    return response.data;'
)
# Remove the old lines and insert new ones
 = @()
for ( = 0;  -lt .Length; ++) {
    if ( -ge 348 -and  -le 356) {
        # skip old lines, we will add new ones after the loop? easier: build new array
        continue
    }
     += []
}
# Now insert the new lines at position 348
 = [0..347]
 = [348..-1]
# Actually we need to splice: take everything before 348, then newLines, then from 348 onward of original? Wait we removed 348-356 from original.
# Let's reconstruct: take lines 0-347, then newLines, then lines 357 onwards.
 = [0..347]
 = [357..(.Length-1)]
 =  +  + 
Set-Content -Path 'server.js' -Value  -Encoding UTF8
Write-Host 'Lines replaced'
