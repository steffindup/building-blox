// Compares two copies of public/weekly (committed vs freshly exported), ignoring the picture bytes, so CI can tell
// when WEEKLY_PLAN or a Weekly's model changed without re-running tests/weekly-export.mjs. Exit 1 on a difference.
//   node tests/weekly-check.mjs <committed dir> <fresh dir>
import fs from 'node:fs';
import path from 'node:path';
const [a, b] = process.argv.slice(2);
const files = (d) => fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort();
const strip = (j) => JSON.stringify(j, (k, v) => (k === 'png' ? `${typeof v}` : v));
const fa = files(a), fb = files(b), diffs = [];
if (fa.join() !== fb.join()) diffs.push(`files differ: committed [${fa}] vs fresh [${fb}]`);
for (const f of fa.filter((x) => fb.includes(x))) {
  const ja = JSON.parse(fs.readFileSync(path.join(a, f), 'utf8')), jb = JSON.parse(fs.readFileSync(path.join(b, f), 'utf8'));
  if (strip(ja) !== strip(jb)) diffs.push(`${f} differs`);
  else if (ja.views) ja.views.forEach((v, i) => { const n = jb.views[i]; if (Math.abs(v.png.length - n.png.length) > v.png.length * 0.25) diffs.push(`${f}: the ${v.view} picture changed a lot`); });
}
if (diffs.length) { console.error('public/weekly is out of date. Run tests/weekly-export.mjs and commit public/weekly.\n' + diffs.join('\n')); process.exit(1); }
console.log(`public/weekly is up to date (${fa.length} files).`);
