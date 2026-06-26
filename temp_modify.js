const fs = require('fs');
let data = fs.readFileSync('server.js', 'utf8');
data = data.replace(/const fs = require\('fs'\)\;/, 'const fs = require(\'fs\');\nconst FormData = require(\'form-data\');');
fs.writeFileSync('server.js', data, 'utf8');
