// Minimal headless browser surface so `public/game.js` can be imported and
// driven from `node --test`. Deliberately dependency-free: the project ships
// zero runtime and zero dev dependencies and should stay that way.
//
// This is not a DOM emulator. It is just enough of one that the module
// evaluates, the run loop can be stepped by hand, and input can be injected —
// which is what the core-verb regression tests need. Anything the game reads
// back (HUD text, widths, classes) is stored faithfully so assertions can read
// what a player would see.

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
  // Every other 2D-context member is a recorded no-op; the tests assert on game
  // state, never on pixels.
  return new Proxy(target, {
    get(obj, key) {
      if (key in obj) return obj[key];
      if (typeof key === 'symbol') return undefined;
      return (obj[key] = NOOP);
    },
    set(obj, key, value) {
      obj[key] = value;
      return true;
    },
  });
}

class FakeClassList {
  constructor() { this._set = new Set(); }
  add(...c) { for (const x of c) this._set.add(x); }
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
  constructor(tag = 'div', id = '') {
    this.tagName = String(tag).toUpperCase();
    this.id = id;
    this.classList = new FakeClassList();
    this.style = new Proxy({setProperty: NOOP, removeProperty: NOOP}, {
      get: (o, k) => (k in o ? o[k] : ''),
      set: (o, k, v) => { o[k] = v; return true; },
    });
    this.dataset = {};
    this.children = [];
    this.textContent = '';
    this.value = '';
    this.width = 0;
    this.height = 0;
    this.hidden = false;
    this.disabled = false;
    this._html = '';
    this._listeners = new Map();
    this._ctx = null;
  }
  get innerHTML() { return this._html; }
  // Markup is stored verbatim rather than parsed; tests assert on the string,
  // and the game only ever writes it.
  set innerHTML(v) { this._html = String(v); }
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
  appendChild(child) { this.children.push(child); return child; }
  append(...kids) { this.children.push(...kids); }
  removeChild(child) { this.children = this.children.filter((c) => c !== child); return child; }
  remove() {}
  insertAdjacentHTML(_pos, html) { this._html += html; }
  querySelector(sel) { return document.querySelector(sel); }
  querySelectorAll(sel) { return document.querySelectorAll(sel); }
  closest() { return null; }
  focus() { document.activeElement = this; }
  blur() {}
  scrollIntoView() {}
  getBoundingClientRect() { return {x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600}; }
  setAttribute(name, value) { this[name] = value; }
  getAttribute(name) { return this[name] ?? null; }
  removeAttribute(name) { delete this[name]; }
  hasAttribute(name) { return this[name] != null; }
  toDataURL() { return 'data:,'; }
}

class FakeDocument {
  constructor() {
    this._byId = new Map();
    this.body = new FakeElement('body');
    this.documentElement = new FakeElement('html');
    this.activeElement = null;
    this._listeners = new Map();
  }
  // Selectors are only ever `#id`, `.class` or a tag in this codebase; anything
  // unknown resolves to a fresh detached element so the game never crashes on a
  // node the harness did not anticipate.
  _keyFor(sel) { return String(sel).trim(); }
  querySelector(sel) {
    const key = this._keyFor(sel);
    if (!this._byId.has(key)) {
      const id = key.startsWith('#') ? key.slice(1) : '';
      const el = new FakeElement(id === 'game' ? 'canvas' : 'div', id);
      this._byId.set(key, el);
    }
    return this._byId.get(key);
  }
  querySelectorAll(sel) {
    const single = this.querySelector(sel);
    const list = [single];
    list.forEach = Array.prototype.forEach.bind(list);
    return list;
  }
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
 * Installs the browser globals `public/game.js` expects.
 * Returns the controls the tests drive the game with.
 */
export function installBrowserEnvironment() {
  const document = new FakeDocument();
  const listeners = new Map();
  const frames = [];
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
  // exist for the tests that are actually exercising controller input.
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
  };

  // Node defines `navigator` and `performance` as getter-only globals, so every
  // global goes in through defineProperty rather than assignment.
  const define = (key, value) =>
    Object.defineProperty(globalThis, key, {value, writable: true, configurable: true, enumerable: true});
  const globals = {
    window: win,
    document,
    navigator: win.navigator,
    localStorage: win.localStorage,
    sessionStorage: win.sessionStorage,
    matchMedia: win.matchMedia,
    getComputedStyle: win.getComputedStyle,
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
  for (const [key, value] of Object.entries(globals)) define(key, value);

  return {
    window: win,
    document,
    gamepad,
    /** Attach/detach the fake controller. */
    setGamepadAttached(on) { gamepadAttached = on; },
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
    },
    /** Run `count` frames of `ms` each. */
    frames(count, ms = 16) { for (let i = 0; i < count; i++) this.step(ms); },
    get now() { return now; },
  };
}
