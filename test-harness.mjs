// Minimal headless browser surface so `public/game.js` and `public/meta.js` can
// be imported and driven from `node --test`. Deliberately dependency-free: the
// project ships zero runtime and zero dev dependencies and should stay that way.
//
// This is not a DOM emulator. It is a real element tree seeded from the shipped
// `public/index.html`, with just enough behaviour that the run loop can be
// stepped by hand and input injected. Selectors, class lists, `offsetParent`
// visibility and dynamically appended nodes are modelled faithfully because the
// menu and death-flow tests assert on exactly those; layout, styling and
// painting are not modelled at all.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const NOOP = () => {};

function makeCanvasContext() {
  const gradient = {addColorStop: NOOP};
  const target = {
    canvas: null,
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    createPattern: () => null,
    measureText: (t) => ({width: String(t).length * 6}),
    getImageData: () => ({data: new Uint8ClampedArray(4)}),
    createImageData: () => ({data: new Uint8ClampedArray(4)}),
    putImageData: NOOP,
    drawImage: NOOP,
    setTransform: NOOP,
    getTransform: () => ({a: 1, b: 0, c: 0, d: 1, e: 0, f: 0}),
  };
  // Every other 2D-context member is a no-op; the tests assert on game state,
  // never on pixels.
  return new Proxy(target, {
    get(obj, key) {
      if (key in obj) return obj[key];
      if (typeof key === 'symbol') return undefined;
      return (obj[key] = NOOP);
    },
    set(obj, key, value) { obj[key] = value; return true; },
  });
}

class FakeClassList {
  constructor(owner) { this._set = new Set(); this._owner = owner; }
  add(...c) { for (const x of c) if (x) this._set.add(x); }
  remove(...c) { for (const x of c) this._set.delete(x); }
  contains(c) { return this._set.has(c); }
  toggle(c, force) {
    const on = force === undefined ? !this._set.has(c) : !!force;
    if (on) this._set.add(c); else this._set.delete(c);
    return on;
  }
  get value() { return [...this._set].join(' '); }
  toString() { return this.value; }
}

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this.id = '';
    this.classList = new FakeClassList(this);
    this.style = new Proxy({setProperty: NOOP, removeProperty: NOOP}, {
      get: (o, k) => (k in o ? o[k] : ''),
      set: (o, k, v) => { o[k] = v; return true; },
    });
    this.dataset = {};
    this.children = [];
    this.parentNode = null;
    this.value = '';
    this.width = 0;
    this.height = 0;
    this.hidden = false;
    this.disabled = false;
    this._text = '';
    this._listeners = new Map();
    this._ctx = null;
  }

  get className() { return this.classList.value; }
  set className(v) { this.classList._set = new Set(String(v).split(/\s+/).filter(Boolean)); }

  get textContent() { return this._text || this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this._text = String(v); this.children = []; }

  // Markup written through innerHTML becomes real children, because the menus
  // render their lists that way and then query the result (renderWorlds builds
  // the sector cards as a string, then wires their onclick). Parsing is lazy:
  // the HUD rewrites markup every frame and almost none of it is ever queried.
  get innerHTML() { return this._html || ''; }
  set innerHTML(v) { this._html = String(v); this.children = []; this._pendingHTML = this._html; }
  _ensureParsed() {
    if (this._pendingHTML == null) return;
    const html = this._pendingHTML;
    this._pendingHTML = null;
    if (html.includes('<')) parseInto(html, this);
  }

  // `offsetParent === null` is how the game asks "is this on screen?". A node is
  // off screen when it or any ancestor carries `hidden`, which is exactly how
  // the screens are toggled.
  get offsetParent() {
    for (let node = this; node; node = node.parentNode) {
      // `hidden` is how the screens toggle; aria-hidden marks the touch overlay,
      // which CSS keeps off-screen on pointer/gamepad devices.
      if (node.classList.contains('hidden') || node.hidden || node['aria-hidden'] === 'true') return null;
    }
    return this.parentNode;
  }

  getContext() { return (this._ctx ||= makeCanvasContext()); }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    const list = this._listeners.get(type);
    if (list) this._listeners.set(type, list.filter((f) => f !== fn));
  }
  dispatchEvent(event) {
    for (const fn of this._listeners.get(event.type) || []) fn(event);
    const inline = this['on' + event.type];
    if (typeof inline === 'function') inline(event);
    return true;
  }
  click() { return this.dispatchEvent({type: 'click', target: this, preventDefault: NOOP, stopPropagation: NOOP}); }

  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  append(...kids) { for (const k of kids) this.appendChild(k); }
  removeChild(child) { this.children = this.children.filter((c) => c !== child); child.parentNode = null; return child; }
  remove() { this.parentNode?.removeChild(this); }
  insertAdjacentHTML(_pos, html) { this._html = (this._html || '') + html; }

  querySelector(sel) { return queryAll(this, sel)[0] || null; }
  querySelectorAll(sel) { return queryAll(this, sel); }
  closest(sel) {
    for (let node = this; node; node = node.parentNode) if (matches(node, sel)) return node;
    return null;
  }

  focus() { ownerDocument.activeElement = this; }
  blur() { if (ownerDocument.activeElement === this) ownerDocument.activeElement = null; }
  scrollIntoView() {}
  getBoundingClientRect() { return {x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600}; }
  setAttribute(name, value) { name === 'class' ? (this.className = value) : (this[name] = value); }
  getAttribute(name) { return name === 'class' ? this.className : (this[name] ?? null); }
  removeAttribute(name) { delete this[name]; }
  hasAttribute(name) { return this[name] != null; }
  toDataURL() { return 'data:,'; }
}

// --- selector matching -------------------------------------------------------
// Only the shapes this codebase actually uses: `#id`, `.class`, `tag`,
// `tag.class`, `tag:not([disabled])` and comma-separated groups of those.

function matchesSimple(el, sel) {
  let rest = sel.trim();
  if (!rest) return false;
  let negateDisabled = false;
  rest = rest.replace(/:not\(\[disabled\]\)/g, () => { negateDisabled = true; return ''; });
  if (negateDisabled && el.disabled) return false;
  const tagMatch = rest.match(/^[a-zA-Z][\w-]*/);
  if (tagMatch) {
    if (el.tagName !== tagMatch[0].toUpperCase()) return false;
    rest = rest.slice(tagMatch[0].length);
  }
  for (const token of rest.match(/[#.][\w-]+/g) || []) {
    if (token[0] === '#') { if (el.id !== token.slice(1)) return false; }
    else if (!el.classList.contains(token.slice(1))) return false;
  }
  return true;
}

function matches(el, sel) {
  // Only the last step of a descendant chain can be tested against one node;
  // full chains go through queryAll.
  return String(sel).split(',').some((part) => {
    const steps = part.trim().split(/\s+/);
    return matchesSimple(el, steps[steps.length - 1]);
  });
}

function descendants(root, step) {
  const out = [];
  const walk = (node) => {
    node._ensureParsed?.();
    for (const child of node.children) {
      if (matchesSimple(child, step)) out.push(child);
      walk(child);
    }
  };
  walk(root);
  return out;
}

// Supports comma groups and descendant chains (`#levelup h2`). Getting the
// chain wrong is not harmless: `$('#levelup h2')` used to resolve to #levelup
// itself, and writing textContent to it wiped the whole upgrade screen.
function queryAll(root, sel) {
  const seen = new Set();
  const out = [];
  for (const group of String(sel).split(',')) {
    const steps = group.trim().split(/\s+/).filter(Boolean);
    if (!steps.length) continue;
    let current = [root];
    for (const step of steps) {
      const next = [];
      for (const node of current) for (const found of descendants(node, step)) if (!next.includes(found)) next.push(found);
      current = next;
      if (!current.length) break;
    }
    for (const el of current) if (!seen.has(el)) { seen.add(el); out.push(el); }
  }
  return out;
}

// --- index.html seeding ------------------------------------------------------
// A deliberately small tag scanner. `public/index.html` is hand-written,
// well-formed and has no scripts inside body content, so a stack walk over the
// tags reproduces the tree the game queries.

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function parseBody(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = new FakeElement('body');
  if (bodyMatch) parseInto(bodyMatch[1], body);
  return body;
}

function parseInto(source, root) {
  const stack = [root];
  const tagPattern = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let match;
  let cursor = 0;
  while ((match = tagPattern.exec(source))) {
    const [full, closing, rawTag, rawAttrs, selfClosing] = match;
    const text = source.slice(cursor, match.index).trim();
    if (text) {
      const parent = stack[stack.length - 1];
      parent._text = (parent._text || '') + text;
    }
    cursor = match.index + full.length;
    const tag = rawTag.toLowerCase();
    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName === tag.toUpperCase()) { stack.length = i; break; }
      }
      continue;
    }
    const el = new FakeElement(tag);
    for (const attr of rawAttrs.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      const name = attr[1];
      const value = attr[2] ?? attr[3] ?? attr[4] ?? '';
      if (name === 'class') el.className = value;
      else if (name === 'id') el.id = value;
      else if (name === 'disabled') el.disabled = true;
      else el[name] = value;
    }
    stack[stack.length - 1].appendChild(el);
    if (!selfClosing && !VOID_TAGS.has(tag)) stack.push(el);
  }
  const tail = source.slice(cursor).trim();
  if (tail) { const parent = stack[stack.length - 1]; parent._text = (parent._text || '') + tail; }
  return root;
}

// --- document ----------------------------------------------------------------

let ownerDocument = null;

class FakeDocument {
  constructor(body) {
    this.body = body;
    this.documentElement = new FakeElement('html');
    this.documentElement.appendChild(this.body);
    this.activeElement = null;
    this._detached = new Map();
    this._listeners = new Map();
  }
  querySelector(sel) {
    const found = queryAll(this.body, sel)[0];
    if (found) return found;
    // Nodes the game creates at runtime and immediately queries before they are
    // appended. A stable detached stand-in keeps identity across lookups.
    const key = String(sel).trim();
    if (!this._detached.has(key)) {
      const el = new FakeElement(key.startsWith('#') ? 'div' : key.replace(/[^a-zA-Z].*$/, '') || 'div');
      if (key.startsWith('#')) el.id = key.slice(1);
      this._detached.set(key, el);
    }
    return this._detached.get(key);
  }
  querySelectorAll(sel) { return queryAll(this.body, sel); }
  getElementById(id) { return this.querySelector('#' + id); }
  createElement(tag) { return new FakeElement(tag); }
  createElementNS(_ns, tag) { return new FakeElement(tag); }
  createDocumentFragment() { return new FakeElement('fragment'); }
  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }
  removeEventListener() {}
  dispatchEvent(event) {
    for (const fn of this._listeners.get(event.type) || []) fn(event);
    return true;
  }
}

class FakeStorage {
  constructor() { this._m = new Map(); }
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }
  setItem(k, v) { this._m.set(k, String(v)); }
  removeItem(k) { this._m.delete(k); }
  clear() { this._m.clear(); }
  key(i) { return [...this._m.keys()][i] ?? null; }
  get length() { return this._m.size; }
}

/**
 * Installs the browser globals the game expects, with the document seeded from
 * the shipped `public/index.html`. Returns the controls tests drive it with.
 */
export function installBrowserEnvironment() {
  const html = fs.readFileSync(fileURLToPath(new URL('./public/index.html', import.meta.url)), 'utf8');
  const document = new FakeDocument(parseBody(html));
  ownerDocument = document;

  const listeners = new Map();
  const frames = [];
  const microtasks = [];
  let now = 0;

  const addEventListener = (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(fn);
  };

  const gamepad = {
    connected: true,
    id: 'harness-pad',
    index: 0,
    axes: [0, 0, 0, 0],
    buttons: Array.from({length: 17}, () => ({pressed: false, touched: false, value: 0})),
  };
  // Off by default: `input()` reads the pad on every call, so a pad must only
  // exist for the tests actually exercising controller input.
  let gamepadAttached = false;

  const win = {
    document,
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener,
    removeEventListener: NOOP,
    dispatchEvent: NOOP,
    localStorage: new FakeStorage(),
    sessionStorage: new FakeStorage(),
    matchMedia: () => ({matches: false, addEventListener: NOOP, removeEventListener: NOOP, addListener: NOOP, removeListener: NOOP}),
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: NOOP,
    getComputedStyle: () => new Proxy({}, {get: () => ''}),
    navigator: {
      userAgent: 'node-harness',
      maxTouchPoints: 0,
      vibrate: NOOP,
      getGamepads: () => (gamepadAttached ? [gamepad] : []),
    },
    performance: {now: () => now},
    // Left undefined on purpose: game.js treats a missing AudioContext as
    // "audio unavailable" and skips the whole audio graph.
    AudioContext: undefined,
    webkitAudioContext: undefined,
    confirm: () => true,
  };

  // Node defines `navigator` and `performance` as getter-only globals, so every
  // global goes in through defineProperty rather than assignment.
  const globals = {
    window: win,
    document,
    navigator: win.navigator,
    localStorage: win.localStorage,
    sessionStorage: win.sessionStorage,
    matchMedia: win.matchMedia,
    getComputedStyle: win.getComputedStyle,
    confirm: win.confirm,
    // Deterministic: screen() defers its focus reset with queueMicrotask, and
    // the tests need that to land on a known frame rather than whenever Node
    // happens to drain its real microtask queue.
    queueMicrotask: (fn) => { microtasks.push(fn); },
    addEventListener,
    removeEventListener: NOOP,
    requestAnimationFrame: win.requestAnimationFrame,
    cancelAnimationFrame: NOOP,
    devicePixelRatio: 1,
    innerWidth: win.innerWidth,
    innerHeight: win.innerHeight,
    HTMLElement: FakeElement,
    Element: FakeElement,
    performance: win.performance,
  };
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, {value, writable: true, configurable: true, enumerable: true});
  }

  const drainMicrotasks = () => {
    const due = microtasks.splice(0, microtasks.length);
    for (const fn of due) fn();
  };

  return {
    window: win,
    document,
    gamepad,
    $: (sel) => document.querySelector(sel),
    /** Attach/detach the fake controller. */
    setGamepadAttached(on) { gamepadAttached = on; },
    /** Every enabled button the game would consider on-screen right now. */
    visibleButtons() {
      return document.querySelectorAll('button:not([disabled])').filter((b) => b.offsetParent !== null && !b.classList.contains('hidden'));
    },
    /** The button the pad would activate, or null. */
    focusedButton() {
      return document.querySelectorAll('button').find((b) => b.classList.contains('gamepad-focus')) || null;
    },
    /** Fire a window-level event (the game listens on the window for input). */
    emit(type, detail = {}) {
      const event = {type, preventDefault: NOOP, stopPropagation: NOOP, repeat: false, ...detail};
      for (const fn of listeners.get(type) || []) fn(event);
      return event;
    },
    keyDown(code, extra = {}) { return this.emit('keydown', {code, key: code, ...extra}); },
    keyUp(code) { return this.emit('keyup', {code, key: code}); },
    /** Advance the run loop by `ms`, honouring the game's own rAF scheduling. */
    step(ms = 16) {
      now += ms;
      const due = frames.splice(0, frames.length);
      for (const fn of due) fn(now);
      drainMicrotasks();
    },
    /** Run `count` frames of `ms` each. */
    frames(count, ms = 16) { for (let i = 0; i < count; i++) this.step(ms); },
    /** Step until `predicate()` is true, or give up after `limit` frames. */
    stepUntil(predicate, limit = 4000, ms = 16) {
      for (let i = 0; i < limit; i++) {
        if (predicate()) return true;
        this.step(ms);
      }
      return predicate();
    },
    get now() { return now; },
  };
}
