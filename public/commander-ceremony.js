// Presentation for a sector commander's arrival, phase breaks and death.
//
// Two rules shape all of it:
//
//   * The run never stops. The intro plays over live gameplay — the HUD yields,
//     the sky darkens and the camera eases back, but movement, fire and dash
//     keep taking input the whole time. Only phase breaks freeze, and only for
//     the few frames of hitstop the impact runtime already budgets.
//   * A commander is only introduced properly once. After the first meeting the
//     card is abbreviated, and it is always skippable with any input.
import {doctrineLabel} from './commander-doctrine.js';
import {impactPreset} from './impact-runtime.js';

const SEEN_KEY = 'mech-survivor-commanders';

const FULL_INTRO = 4.2;
const SHORT_INTRO = 1.5;
/** How far the camera eases back while a commander holds the field. */
const PULLBACK = 0.94;

export function seenCommanders() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export function hasMetCommander(id) {
  return seenCommanders().includes(id);
}

export function rememberCommander(id) {
  try {
    const seen = seenCommanders();
    if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
  } catch { /* progress is a nicety here, never a hard dependency */ }
}

export function createCommanderCeremony() {
  return {active: false, time: 0, duration: 0, intro: 0, present: 0, resolve: 0, card: null, skip: null, id: null};
}

function cardElement() {
  let el = document.querySelector('#commander-card');
  if (!el) {
    el = document.createElement('div');
    el.id = 'commander-card';
    document.body.append(el);
  }
  return el;
}

/**
 * Raise a commander. `spec` is the sector boss, `doctrine` the resolved read of
 * the player's build — the card names what the commander has decided to do,
 * which is the only place that decision is ever surfaced to the player.
 */
export function beginCommanderCeremony(ceremony, {spec, doctrine}) {
  const first = !hasMetCommander(spec.id);
  ceremony.active = true;
  ceremony.id = spec.id;
  ceremony.time = 0;
  ceremony.duration = first ? FULL_INTRO : SHORT_INTRO;
  ceremony.intro = 1;
  ceremony.present = 1;
  ceremony.resolve = 0;

  const card = cardElement();
  card.className = first ? 'first' : 'known';
  card.innerHTML = first
    ? `<span class="rank">ORBIT COMMANDER</span><h2>${spec.name}</h2><span class="doctrine">${doctrineLabel(doctrine)}</span><span class="hint">ANY INPUT TO SKIP</span>`
    : `<span class="rank">ORBIT COMMANDER</span><h2>${spec.name}</h2><span class="doctrine">${doctrineLabel(doctrine)}</span>`;
  card.classList.add('showing');

  document.body.classList.add('commander-present');
  document.querySelector('#hud')?.classList.add('yield');

  rememberCommander(spec.id);

  // Skippable by anything the player can press.
  const skip = () => skipCommanderCeremony(ceremony);
  ceremony.skip = skip;
  addEventListener('keydown', skip);
  addEventListener('pointerdown', skip);
  return ceremony;
}

export function skipCommanderCeremony(ceremony) {
  if (!ceremony.active || ceremony.time <= 0.12) return false; // ignore the press that spawned it
  ceremony.time = ceremony.duration;
  return true;
}

function closeCard(ceremony) {
  const card = document.querySelector('#commander-card');
  card?.classList.remove('showing');
  document.querySelector('#hud')?.classList.remove('yield');
  if (ceremony.skip) {
    removeEventListener('keydown', ceremony.skip);
    removeEventListener('pointerdown', ceremony.skip);
    ceremony.skip = null;
  }
}

/**
 * Advance the ceremony. Returns the camera scale to draw the world at, so the
 * pull-back is a rendering concern only and never touches simulation.
 */
export function updateCommanderCeremony(ceremony, dt) {
  if (ceremony.resolve > 0) {
    ceremony.resolve = Math.max(0, ceremony.resolve - dt);
    if (ceremony.resolve === 0) document.body.classList.remove('commander-resolved');
  }
  if (!ceremony.active) return {scale: 1, intro: 0};

  ceremony.time += dt;
  if (ceremony.time >= ceremony.duration && ceremony.intro > 0) {
    ceremony.intro = 0;
    closeCard(ceremony);
  }

  // Ease back over the first beat, then hold while the commander is alive.
  const t = Math.min(1, ceremony.time / Math.max(0.001, ceremony.duration * 0.55));
  const eased = t * t * (3 - 2 * t);
  const scale = 1 + (PULLBACK - 1) * eased * ceremony.present;
  return {scale, intro: ceremony.intro ? 1 - ceremony.time / ceremony.duration : 0};
}

/**
 * A phase break: hitstop, zoom-punch and a short audio drop. Deliberately built
 * on the existing impact runtime rather than a second feedback system.
 */
export function commanderPhaseBreak(ceremony, impact, audio) {
  impactPreset(impact, 'boss-break');
  duckAudio(audio, 0.34);
  document.body.classList.add('commander-break');
  setTimeout(() => document.body.classList.remove('commander-break'), 220);
}

/** Duck the master bus so the break lands in a hole in the mix. */
export function duckAudio(audio, seconds = 0.3) {
  const gain = audio?.master?.gain;
  const now = audio?.ctx?.currentTime;
  if (!gain || now == null) return false;
  try {
    const level = gain.value;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(level, now);
    gain.linearRampToValueAtTime(level * 0.15, now + 0.03);
    gain.linearRampToValueAtTime(level, now + seconds);
    return true;
  } catch { return false; }
}

/** The commander dies: the sky it brought goes with it. */
export function resolveCommanderCeremony(ceremony) {
  if (!ceremony.active) return false;
  ceremony.active = false;
  ceremony.present = 0;
  ceremony.intro = 0;
  ceremony.resolve = 1.1;
  closeCard(ceremony);
  document.body.classList.remove('commander-present');
  document.body.classList.add('commander-resolved');
  return true;
}

/** Tear everything down without ceremony — used when a run ends or restarts. */
export function clearCommanderCeremony(ceremony) {
  ceremony.active = false;
  ceremony.present = 0;
  ceremony.intro = 0;
  ceremony.resolve = 0;
  closeCard(ceremony);
  document.body.classList.remove('commander-present', 'commander-resolved', 'commander-break');
}

/**
 * The commander's doctrine state, drawn on the commander itself. Vulnerability
 * has to be legible or the whole system is invisible: a telegraph reads as an
 * amber warning arc, an open window as a gold halo, and remaining break plates
 * as ticks around the rim.
 */
export function drawCommanderTells(ctx, boss, time, palette) {
  if (!boss?._doctrine) return;
  const r = (boss.r || 40) * 1.5;

  if ((boss._telegraph || 0) > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 22);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.4 * pulse;
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, r + 14 + pulse * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if ((boss._exposed || 0) > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 12);
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = palette?.gold || '#d6ae52';
    ctx.shadowColor = palette?.gold || '#d6ae52';
    ctx.shadowBlur = 22;
    ctx.lineWidth = 4 + pulse * 2;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.restore();
  }

  const plates = boss._plates || 0;
  if (plates > 0) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = palette?.cyan || '#78e7ff';
    ctx.lineWidth = 3;
    const total = boss._doctrine.profile.weakpoints || plates;
    for (let i = 0; i < plates; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2) / total;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, r + 20, a - 0.16, a + 0.16);
      ctx.stroke();
    }
    ctx.restore();
  }
}
