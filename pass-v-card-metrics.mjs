// Surfaces the structured metric line on upgrade cards.
//
// The values come from `card.metrics`, which arsenal.js builds out of the same
// formulas arsenal-runtime.js runs on. Nothing is computed here — this pass
// only decides where the line is drawn, so the card can never drift from the
// runtime by way of the UI.
//
// Runs after pass-u, so its anchor is matched against the finished file.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  if (s.includes(to)) return;
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`pass-v: anchor for ${label} matched ${count} sites, expected exactly 1`);
  s = s.replace(from, to);
};

// The effect and level markup share one string literal, so the seam is the
// concatenation boundary between them, not a standalone `</div>`.
replaceOnce(
  `+effect+'</div><div class="level">'`,
  `+effect+'</div>'+(u.metricLine?'<div class="metrics">'+u.metricLine+'</div>':'')+'<div class="level">'`,
  'upgrade card metric line',
);

if (!s.includes('u.metricLine')) throw new Error('pass-v: metric line not installed');
fs.writeFileSync(path, s);
console.log('pass-v: upgrade cards now show runtime-derived metrics');
