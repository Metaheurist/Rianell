import fs from 'fs';

const html = fs.readFileSync('apps/pwa-webapp/index.html', 'utf8');
const lines = html.split('\n');
const stack = [];

for (let lineNo = 1; lineNo <= lines.length; lineNo++) {
  const line = lines[lineNo - 1];
  const openRe = /<div\b[^>]*>/gi;
  const closeRe = /<\/div>/gi;
  let m;
  while ((m = openRe.exec(line))) {
    const idMatch = m[0].match(/\bid="([^"]+)"/);
    const id = idMatch?.[1] || '(anon)';
    stack.push({ id, line: lineNo });
    if (lineNo >= 1103 && lineNo <= 1640) console.log(`L${lineNo} OPEN ${id} depth=${stack.length}`);
  }
  while ((m = closeRe.exec(line))) {
    const closed = stack.pop();
    if (lineNo >= 1103 && lineNo <= 1640) console.log(`L${lineNo} CLOSE ${closed?.id} depth=${stack.length}`);
  }
}

console.log('\nFinal:', stack);
