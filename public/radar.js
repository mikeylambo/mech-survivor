// Radar.
//
// The rule that shapes it: NEVER individual swarm dots. A radar that plots
// every trash enemy is a second, worse view of the playfield — noise dressed as
// information. It plots only things worth turning the frame toward: the
// commander, elites, caches, and the active objective. Everything else the
// player can already see.
//
// Contact selection is a pure function so the rule is testable without a canvas.

const TAU = Math.PI * 2;

export const CONTACT_STYLE = {
  commander: {color: '#ff4664', size: 5.4, ring: true, priority: 0},
  elite: {color: '#ffcf65', size: 3.6, ring: false, priority: 1},
  objective: {color: '#78e7ff', size: 4.2, ring: true, priority: 2},
  cache: {color: '#d6ae52', size: 3.0, ring: false, priority: 3},
};

export const DEFAULT_RANGE = 1500;

/**
 * What the radar is allowed to show.
 *
 * Contacts beyond `range` are kept but flagged `edge`: knowing a commander is
 * out there and roughly where matters more than its exact distance, and
 * dropping it entirely would make the radar lie by omission.
 */
export function radarContacts({player, enemies = [], caches = [], objective = null, range = DEFAULT_RANGE} = {}) {
  if (!player) return [];
  const out = [];
  const add = (kind, x, y) => {
    const dx = x - player.x;
    const dy = y - player.y;
    const dist = Math.hypot(dx, dy);
    const edge = dist > range;
    const scale = edge && dist > 0 ? range / dist : 1;
    out.push({kind, x, y, dx: dx * scale, dy: dy * scale, dist, edge, priority: CONTACT_STYLE[kind].priority});
  };

  for (const e of enemies) {
    if (!e || e.dead) continue;
    // Only the things worth steering toward. `swarm`, `brute` and friends are
    // deliberately absent: that is the whole design rule.
    if (e.t === 'boss') add('commander', e.x, e.y);
    else if (e.t === 'elite') add('elite', e.x, e.y);
  }
  for (const c of caches) {
    if (!c || c.dead || c.taken) continue;
    add('cache', c.x, c.y);
  }
  if (objective && Number.isFinite(objective.x) && Number.isFinite(objective.y)) {
    add('objective', objective.x, objective.y);
  }

  return out.sort((a, b) => a.priority - b.priority || a.dist - b.dist);
}

/** Kinds the radar will never plot, stated so the rule is greppable. */
export const NEVER_PLOTTED = ['swarm', 'brute', 'runner', 'shooter', 'drone', 'add'];

/**
 * Draw in screen space, top corner. Returns the contacts drawn so the caller
 * (and the tests) can see what the player was actually shown.
 */
export function drawRadar(ctx, {
  cx, cy, radius = 54, player, enemies, caches, objective, range = DEFAULT_RANGE, alpha = 0.9,
}) {
  const contacts = radarContacts({player, enemies, caches, objective, range});
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  // Housing.
  ctx.fillStyle = 'rgba(4,14,26,.55)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(101,223,255,.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = alpha;

  // The frame, always dead centre.
  ctx.fillStyle = '#eaf7ff';
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, TAU);
  ctx.fill();

  const scale = radius / range;
  for (const contact of contacts) {
    const style = CONTACT_STYLE[contact.kind];
    const x = contact.dx * scale;
    const y = contact.dy * scale;
    ctx.fillStyle = style.color;
    ctx.strokeStyle = style.color;
    if (contact.edge) {
      // Off-range contacts become a chevron on the rim rather than a dot that
      // pretends to be a position.
      const a = Math.atan2(y, x);
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(radius - 2, 0);
      ctx.lineTo(radius - 9, -4);
      ctx.lineTo(radius - 9, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      continue;
    }
    ctx.beginPath();
    ctx.arc(x, y, style.size, 0, TAU);
    ctx.fill();
    if (style.ring) {
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, style.size + 3.5, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }
  }

  ctx.restore();
  return contacts;
}
