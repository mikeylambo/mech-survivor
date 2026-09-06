// Single source of truth for the files the string-rewrite pipeline mutates.
//
// The passes patch their targets in place. If they patched the committed copy
// directly the build would only be correct on a pristine checkout: a second run
// re-patches already-patched text and the anchors no longer match. Restoring
// from src/ first makes every build start from the same bytes, so `npm run
// build` is repeatable and its output is a pure function of src/.
import fs from 'node:fs';
import path from 'node:path';

export const GENERATED = [
  'game.js',
  'meta.js',
  'retention.js',
  'celestial-frame.js',
  'arsenal-runtime.js',
];

export function restoreGeneratedSources(root = process.cwd()) {
  for (const file of GENERATED) {
    const from = path.join(root, 'src', file);
    const to = path.join(root, 'public', file);
    if (!fs.existsSync(from)) throw new Error(`build-sources: missing src/${file}`);
    fs.copyFileSync(from, to);
  }
  return GENERATED.length;
}
