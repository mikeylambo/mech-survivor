// Seam audit for the string-rewrite build.
//
// The passes patch shared files by anchoring on exact source text. `String
// .prototype.replace` with a string pattern (or a non-global regex) rewrites
// only the FIRST match, so an anchor that occurs more than once silently
// patches whichever site happens to come first in the file. That is not a
// hypothetical: `pass-s` anchored on `const m=input();`, which occurs in both
// `tryDash()` and `update(dt)`, and injected a `dt`-dependent call into
// `tryDash()` where `dt` is not in scope. Every dash threw a ReferenceError and
// no arsenal branch identity ever ticked.
//
// This audit re-runs the real pass chain with `replace` instrumented and fails
// the build on any anchor that matched in more than one place.
//
// Run: npm run seam-audit
import fs from 'node:fs';
import {PASSES} from './build-pipeline.mjs';

// A rewrite script sitting on disk but absent from the chain applies nothing.
// pass-f.mjs is in that state: it would install "guaranteed salvage + reward
// reveal + Garage collection" into meta.js, and the garage that shipped came
// from public/retention.js instead. Reported, not failed — an orphan is a
// decision to make, not a broken build.
function reportOrphanPasses() {
  const onDisk = fs.readdirSync('.').filter((f) => /^(pass-|post-|prepare-).*\.mjs$/.test(f) && !f.includes('.test.'));
  const orphans = onDisk.filter((f) => !PASSES.includes(f));
  if (orphans.length) console.log(`seam-audit: ${orphans.length} rewrite script(s) not in the pipeline and therefore never applied: ${orphans.join(', ')}`);
}

// Anchors that are ambiguous but provably safe, each with the reason it is
// safe. Keyed by `pass -> anchor`. Keep this list short and justified.
const ALLOWED = new Map([
]);

// Only audit replacements against whole source files; passes also do small
// string manipulations on labels and fragments, which are not seams.
const SOURCE_MIN_LENGTH = 4000;

const findings = [];
const skipped = [];
let currentPass = '(startup)';

const nativeReplace = String.prototype.replace;
const nativeReplaceAll = String.prototype.replaceAll;

function countOccurrences(subject, pattern) {
  if (typeof pattern === 'string') {
    if (pattern.length === 0) return Infinity;
    return subject.split(pattern).length - 1;
  }
  if (pattern instanceof RegExp) {
    if (pattern.flags.includes('g')) return 1; // global replace is unambiguous by design
    const global = new RegExp(pattern.source, pattern.flags + 'g');
    return (subject.match(global) || []).length;
  }
  return 1;
}

function describe(pattern) {
  const text = pattern instanceof RegExp ? String(pattern) : String(pattern);
  const oneLine = text.replace(/\s+/g, ' ');
  return oneLine.length > 110 ? oneLine.slice(0, 107) + '...' : oneLine;
}

function record(subject, pattern) {
  if (typeof subject !== 'string' || subject.length < SOURCE_MIN_LENGTH) return;
  const count = countOccurrences(subject, pattern);
  if (count <= 1) return;
  const anchor = describe(pattern);
  if (ALLOWED.get(currentPass) === anchor) return;
  findings.push({pass: currentPass, anchor, count});
}

String.prototype.replace = function (pattern, replacement) {
  record(this, pattern);
  return nativeReplace.call(this, pattern, replacement);
};

// `replaceAll` rewrites every match, so it is never ambiguous; it is wrapped
// only so the instrumentation is complete and obviously so.
String.prototype.replaceAll = function (pattern, replacement) {
  return nativeReplaceAll.call(this, pattern, replacement);
};

// Some passes downgrade a missing anchor to a console warning and carry on.
// That is how the dash lost its VFX recipe: pass-c inserted `audio.cue('dash')`
// into the middle of the text pass-q was anchoring on, pass-q printed
// "optional seam missing dash effect", and the build stayed green. A skipped
// seam is a silent feature regression, so it fails the audit too.
const nativeWarn = console.warn;
console.warn = (...args) => {
  skipped.push({pass: currentPass, message: args.join(' ')});
  nativeWarn.apply(console, args);
};

for (const pass of PASSES) {
  currentPass = pass;
  await import('./' + pass);
}

String.prototype.replace = nativeReplace;
String.prototype.replaceAll = nativeReplaceAll;
console.warn = nativeWarn;

reportOrphanPasses();

if (findings.length === 0 && skipped.length === 0) {
  console.log(`\nseam-audit: ${PASSES.length} passes clean — every anchor matched exactly one site, no seam skipped`);
  process.exit(0);
}

if (findings.length) {
  console.error(`\nseam-audit: ${findings.length} ambiguous anchor(s) — replace() patched only the first match:\n`);
  for (const f of findings) {
    console.error(`  ${f.pass}`);
    console.error(`    matched ${f.count}x: ${f.anchor}\n`);
  }
  console.error('Fix by extending the anchor until it is unique, or add a justified entry to ALLOWED.\n');
}

if (skipped.length) {
  console.error(`seam-audit: ${skipped.length} seam(s) skipped instead of applied:\n`);
  for (const s of skipped) console.error(`  ${s.pass}\n    ${s.message}\n`);
  console.error('A skipped seam means the feature it installs is silently absent from the build.\n');
}
process.exit(1);
