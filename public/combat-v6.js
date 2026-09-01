function pushMove(list,id,source,tier=1){if(!list.some(m=>m.id===id))list.push({id,source,tier})}
const roleDefaults={predator:['rush','pounce'],bulwark:['brace','ram'],artillery:['strafe-shot','volley'],swarm:['brood-call','rush'],striker:['rush','burst-shot']};
export const CREATURE_MOVES=['rush','pounce','brace','ram','strafe-shot','volley','brood-call','burst-shot','pulse-burst','shield-flare','tail-sweep','wing-swoop','skitter-flank','root-snare','coil-lunge'];

export function deriveCombatKit(g){
 const stage=g.lineage?.stage||g.signature?.stage||1,role=g.lineage?.role||g.branch?.role||'striker',moves=[],defaults=roleDefaults[role]||roleDefaults.striker;
 pushMove(moves,defaults[0],'role',1);if(stage>=2)pushMove(moves,defaults[1],'role',2);
 if(g.stats?.projectiles>0)pushMove(moves,stage>=3?'volley':'burst-shot','projectile-organ',stage>=3?3:1);
 if(g.stats?.pulse)pushMove(moves,'pulse-burst','arcane-node',2);
 if(g.stats?.spawner)pushMove(moves,'brood-call','brood-organ',2);
 if(g.stats?.shield||g.stats?.armor>.18)pushMove(moves,'shield-flare','shell',2);
 if(g.signature?.motif==='long-tail')pushMove(moves,'tail-sweep','signature',2);
 if(g.signature?.motif==='wing-fins'||g.morphotype==='avian')pushMove(moves,'wing-swoop','signature',2);
 if(g.morphotype==='insectoid')pushMove(moves,'skitter-flank','morphotype',1);
 if(g.morphotype==='plant-beast')pushMove(moves,'root-snare','morphotype',2);
 if(g.morphotype==='serpent'||g.morphotype==='aquatic')pushMove(moves,'coil-lunge','morphotype',1);
 const unlocked=moves.filter(m=>m.tier<=stage),primary=unlocked[0]?.id||'rush';
 g.combatKit={role,stage,primary,moves:unlocked,locked:moves.filter(m=>m.tier>stage)};
 if(primary==='strafe-shot'||primary==='volley'||primary==='skitter-flank')g.behavior='strafe';
 else if(primary==='brace')g.behavior='chase';
 else if(primary==='coil-lunge'||primary==='pounce'||primary==='ram'||primary==='rush')g.behavior='charge';
 if(unlocked.some(m=>m.id==='volley'))g.stats.projectiles=Math.max(2,g.stats.projectiles||0);
 if(unlocked.some(m=>m.id==='brood-call'))g.stats.spawner=true;
 if(unlocked.some(m=>m.id==='pulse-burst'))g.stats.pulse=true;
 return g;
}
export function combatKitSummary(g){return`${g.combatKit?.role?.toUpperCase()||'UNKNOWN'} // ${(g.combatKit?.moves||[]).map(m=>m.id.toUpperCase().replaceAll('-',' ')).join(' · ')||'NO MOVES'}`}
