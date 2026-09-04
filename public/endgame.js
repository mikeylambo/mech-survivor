import {CONFIGURATIONS} from './configurations.js';
import {ARSENAL_FAMILIES} from './arsenal.js';
export const CHALLENGE_CONTRACTS=[
{id:'clean-frame',name:'CLEAN FRAME',desc:'Clear a sector without taking a Corrupted Blessing.',reward:'Reliquary + Configuration clue',check:s=>!!s.won&&!(s.corruption>0)},
{id:'ascendant',name:'ASCENDANT',desc:'Reach the God Window with an evolved weapon.',reward:'Evolution archive credit',check:s=>!!s.won&&Object.values(s.arsenal||{}).some(x=>x?.evolved)},
{id:'architect',name:'FRAME ARCHITECT',desc:'Achieve three Configurations in one sortie.',reward:'Configuration clue cache',check:s=>(s.configurations||[]).length>=3},
{id:'purist',name:'PURIST',desc:'Defeat a commander with no Garage prototype seed.',reward:'Reliquary cache',check:s=>!!s.won&&!s.garagePrototype},
{id:'opportunist',name:'OPPORTUNIST',desc:'Complete every Director opportunity offered in a sortie.',reward:'Salvage quality boost',check:s=>(s.directorHistory||[]).length>=3&&(s.directorHistory||[]).every(x=>x.success!==false)},
{id:'apex-machine',name:'APEX MACHINE',desc:'Finish a sortie with an Apex Configuration active.',reward:'Apex archive seal',check:s=>!!s.won&&(s.configurations||[]).some(id=>CONFIGURATIONS.find(c=>c.id===id)?.tier==='apex')}
];
export const MUTATORS=[
{id:'redline',name:'REDLINE',desc:'+enemy tempo · +salvage quality',mods:{enemyRate:.82,salvageLuck:.18}},
{id:'glass-frame',name:'GLASS FRAME',desc:'-35% integrity · +35% output',mods:{hp:.65,damage:.35}},
{id:'swarm-law',name:'SWARM LAW',desc:'+formation density · elites arrive earlier',mods:{density:1.35,eliteLead:18}},
{id:'starved',name:'STARVED REACTOR',desc:'slower XP · stronger Blessings',mods:{xp:.78,blessingPower:1.25}},
{id:'blight-tide',name:'BLIGHT TIDE',desc:'corruption arrives early · Reliquary doubled',mods:{corruptionLead:45,reliquary:2}},
{id:'commander-law',name:'COMMANDER LAW',desc:'boss phases gain extra pressure · boss salvage improved',mods:{bossPressure:1.35,bossLoot:.25}}
];
export const ENDGAME_TIERS=[
{id:'circuit-1',name:'SOVEREIGN CIRCUIT I',requires:{campaignClears:1},mutators:['redline'],desc:'Replay the five-sector campaign under REDLINE.'},
{id:'circuit-2',name:'SOVEREIGN CIRCUIT II',requires:{campaignClears:2,mastery:15},mutators:['redline','swarm-law'],desc:'Formation density and tempo rise together.'},
{id:'circuit-3',name:'SOVEREIGN CIRCUIT III',requires:{campaignClears:3,mastery:30},mutators:['glass-frame','commander-law'],desc:'Extreme output. Commander mistakes become lethal.'},
{id:'circuit-apex',name:'APEX CIRCUIT',requires:{campaignClears:5,configs:24,mastery:50},mutators:['redline','swarm-law','blight-tide','commander-law'],desc:'The campaign stops pretending to be fair.'}
];
export function sectorMastery(summary){let score=summary.won?3:0;score+=Math.min(3,summary.directorHistory?.filter(x=>x.success!==false).length||0);score+=Math.min(2,summary.configurations?.length||0);score+=summary.primaryConfiguration?1:0;score+=summary.corruption>0?1:0;return Math.min(10,score)}
export function completedContracts(summary){return CHALLENGE_CONTRACTS.filter(c=>{try{return c.check(summary)}catch{return false}}).map(c=>c.id)}
export function unlockedCircuit(save){let best=null;for(const t of ENDGAME_TIERS){const r=t.requires;if((save.campaignClears||0)>=(r.campaignClears||0)&&(save.totalMastery||0)>=(r.mastery||0)&&(save.configs||0)>=(r.configs||0))best=t}return best}
export function arsenalArchive(){return ARSENAL_FAMILIES.map(f=>({id:f.id,name:f.name,category:f.category,finals:[f.branches.a.tiers[2],f.branches.b.tiers[2]]}))}
