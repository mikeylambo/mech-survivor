import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome,generateEvolutionLine,breedCreatureGenomes,speciesMotifs} from './public/species-v5.js';

test('species signature is deterministic and uses a known motif',()=>{
 const a=generateCreatureGenome('SPECIES-A',{morphotype:'quadruped',world:1});
 const b=generateCreatureGenome('SPECIES-A',{morphotype:'quadruped',world:1});
 assert.deepEqual(a.signature,b.signature);
 assert.ok(speciesMotifs.includes(a.signature.motif));
});

test('evolution preserves and amplifies signature identity',()=>{
 const line=generateEvolutionLine('SPECIES-B',{morphotype:'avian',role:'artillery'});
 assert.equal(line[0].signature.motif,line[1].signature.motif);
 assert.equal(line[1].signature.motif,line[2].signature.motif);
 assert.ok(line[2].signature.magnitude>line[0].signature.magnitude);
});

test('hybrid child retains a dominant parental motif',()=>{
 const a=generateCreatureGenome('SPECIES-C',{morphotype:'plant-beast'});
 const b=generateCreatureGenome('SPECIES-D',{morphotype:'insectoid'});
 const child=breedCreatureGenomes(a,b,{seed:'SPECIES-CHILD'});
 assert.ok([a.signature.motif,b.signature.motif].includes(child.signature.motif));
 assert.equal(child.lineage.hybrid,true);
});
