import test from 'node:test';import assert from 'node:assert/strict';import {BLESSINGS,CORRUPTED_BLESSINGS} from './public/content-v1.js';import {BOSSES,SECTOR_DECKS,SALVAGE_FAMILIES} from './public/sector-content.js';
test('content library ships release-scale blessings and corruption',()=>{assert.ok(BLESSINGS.length>=40);assert.ok(CORRUPTED_BLESSINGS.length>=20);});
test('five sectors have authored bosses and director decks',()=>{assert.equal(BOSSES.length,5);assert.equal(SECTOR_DECKS.length,5);for(const b of BOSSES){assert.ok(b.name&&b.pattern&&b.phases.length>=2)}});
test('salvage families are authored rather than anonymous keys',()=>{assert.ok(SALVAGE_FAMILIES.length>=10);for(const f of SALVAGE_FAMILIES)assert.ok(f.name&&f.tags.length));});
