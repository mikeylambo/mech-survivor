import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync('public/style.css','utf8');
test('mobile shell respects dynamic viewport and safe areas',()=>{for(const token of['100dvh','safe-area-inset-top','safe-area-inset-bottom','overscroll-behavior:none'])assert.ok(css.includes(token),token)});
test('touch controls stay below modal screens and use mobile-only play visibility',()=>{assert.ok(css.includes('.screen{position:fixed'));assert.ok(css.includes('z-index:24'));assert.ok(css.includes('body.playing #touch-controls'))});
test('mobile HUD is compact rather than covering playfield',()=>{assert.ok(css.includes('grid-template-columns:repeat(5,minmax(0,1fr)) 38px'));assert.ok(css.includes('.systems{grid-column:1/3'));assert.ok(css.includes('#build{display:none!important}'))});
test('mobile menu and class screens are touch-sized and scroll-safe',()=>{assert.ok(css.includes('.menu-stack button{min-height:48px'));assert.ok(css.includes('.class-grid{grid-template-columns:1fr;width:100%'));assert.ok(css.includes('-webkit-overflow-scrolling:touch'))});
