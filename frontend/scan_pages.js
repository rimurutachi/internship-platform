const fs = require('fs');
const path = require('path');

function scan(d) {
  fs.readdirSync(d).forEach(f => {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) scan(p);
    else if (f.endsWith('.tsx') && !f.includes('layout')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('h-screen') && c.includes('bg-background')) {
        const m = c.includes('Mobile View') ? 'Y' : 'N';
        const ccMatch = c.match(/<(\w+Content)\s*\/>/);
        const cc = ccMatch ? ccMatch[1] : 'N';
        const dp = c.match(/const Desktop/) ? 'DP' : '';
        const rel = p.replace(/\\/g, '/');
        console.log(`${rel} | Mobile:${m} CC:${cc} ${dp}`);
      }
    }
  });
}

scan('src/app/dashboard');
