lines = []
with open('server.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# line numbers are 0-indexed
# Line 350 (1-indexed) => index 349
# Line 353 => index 352
if len(lines) >= 353:
    lines[349] = '      https://api.telegram.org/bot/sendPhoto,\\n'
    lines[352] = '    console.log(Telegram photo sent: );\\n'
else:
    print('File too short')
    exit(1)

with open('server.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Lines replaced')
