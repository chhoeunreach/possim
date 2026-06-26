import sys
with open('server.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'form.append(\'caption\", caption);' in line:
        lines[i] = line.replace('form.append(\'caption\", caption);', 'form.append(\'caption\', caption);')
    if 'form.append(\'parse_mode\", parseMode);' in line:
        lines[i] = line.replace('form.append(\'parse_mode\", parseMode);', 'form.append(\'parse_mode\', parseMode);')
with open('server.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed quotes')
