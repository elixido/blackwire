const fs = require('node:fs');
const path = require('node:path');

const distRoot = path.join(__dirname, '..', 'server', 'dist');
const packagePath = path.join(distRoot, 'package.json');

fs.mkdirSync(distRoot, { recursive: true });
fs.writeFileSync(
  packagePath,
  JSON.stringify(
    {
      type: 'commonjs'
    },
    null,
    2
  ) + '\n',
  'utf8'
);
