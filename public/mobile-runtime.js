// Mobile hardening.
//
// Orientation is a PREFERENCE, not a promise. iOS Safari does not let a web
// page lock orientation the way a native app can, so this module states the
// preference in three places that each work where they can — the manifest, the
// Screen Orientation API, and a CSS class — and then makes sure the game is
// still playable when all three are ignored. Nothing here fails a build for
// something the platform will not do.

/** Best-effort portrait lock. Never throws, never rejects into the console. */
export async function requestPortraitLock() {
  const orientation = globalThis.screen?.orientation;
  if (!orientation?.lock) return {locked: false, reason: 'unsupported'};
  try {
    await orientation.lock('portrait');
    return {locked: true, reason: 'locked'};
  } catch (err) {
    // Safari rejects unless fullscreen, and rejects always on iPhone. Expected.
    return {locked: false, reason: err?.name || 'refused'};
  }
}

/**
 * Landscape is a supported fallback, not a failure state: the class lets CSS
 * reflow, and the game keeps running either way.
 */
export function trackOrientation(doc = globalThis.document, win = globalThis) {
  const apply = () => {
    const landscape = (win.innerWidth || 0) > (win.innerHeight || 0);
    doc.body?.classList?.toggle('landscape', landscape);
    doc.body?.classList?.toggle('portrait', !landscape);
    return landscape;
  };
  apply();
  win.addEventListener?.('resize', apply);
  win.addEventListener?.('orientationchange', apply);
  return apply;
}

/**
 * Backgrounding pauses. A survivor game that keeps simulating in a background
 * tab kills the player while they are reading a message.
 */
export function installVisibilityPause(doc = globalThis.document, onHide = () => {}) {
  const handler = () => { if (doc.visibilityState === 'hidden') onHide(); };
  doc.addEventListener('visibilitychange', handler);
  globalThis.addEventListener?.('pagehide', handler);
  return handler;
}

/** The safe-area variables the layout depends on, for a notch audit. */
export const SAFE_AREA_VARS = ['--safe-t', '--safe-r', '--safe-b', '--safe-l'];
