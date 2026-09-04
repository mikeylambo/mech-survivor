const C=(id,name,tier,requires,hook,desc)=>({id,name,tier,requires,hook,desc});
export const CONFIGURATIONS=[
C('gravity-spear','GRAVITY SPEAR','standard',['rail','graviton'],'gravity-align','Gravity compresses enemies into rail execution lanes.'),
C('killbox','KILLBOX','standard',['scatter','repulsor'],'suppression-push','Repulsor control keeps enemies inside scatter geometry.'),
C('ballistic-cyclone','BALLISTIC CYCLONE','standard',['repeater','ricochet'],'ballistic-rebound','Rapid fire and rebounds feed one another.'),
C('hunter-killer','HUNTER-KILLER','standard',['hunter','mark'],'priority-hunt','Seekers aggressively execute marked targets.'),
C('breach-engine','BREACH ENGINE','standard',['drill','rail'],'breach-rail','Drill breach stacks turn rail hits into internal detonations.'),
C('prismatic-lance','PRISMATIC LANCE','standard',['beam','prism'],'beam-prism','Beam impacts become origins for prism branches.'),
C('sun-engine','SUN ENGINE','standard',['beam','nova'],'beam-reactor','Sustained beam damage charges Nova output.'),
C('light-cathedral','LIGHT CATHEDRAL','advanced',['sweep','funnels'],'remote-sweep','Funnels become secondary sweep origins.'),
C('storm-circuit','STORM CIRCUIT','standard',['arc','prism'],'electric-prism','Prism branches carry chain lightning.'),
C('thunder-dome','THUNDER DOME','standard',['arc','barrier'],'barrier-conductor','Barrier-contact enemies become lightning relays.'),
C('blade-tempest','BLADE TEMPEST','standard',['orbit','slash'],'blade-launch','Slashes launch orbiting blades outward and back.'),
C('moon-halo','MOON HALO','standard',['orbit','launchblade'],'return-orbit','Returning blades join the orbit before relaunching.'),
C('execution-frame','EXECUTION FRAME','advanced',['drill','mark'],'drill-execute','Marked elites build an execution gauge under drill contact.'),
C('comet-edge','COMET EDGE','standard',['ram','slash'],'dash-slash','Dashing cuts along and across the movement vector.'),
C('siege-network','SIEGE NETWORK','standard',['mortar','sentry'],'fire-control','Turrets designate artillery targets and receive bombardment buffs.'),
C('gravity-bombardment','GRAVITY BOMBARDMENT','standard',['mortar','graviton'],'mortar-well','Gravity drags enemies into artillery coordinates.'),
C('cascade-warhead','CASCADE WARHEAD','standard',['cluster','death'],'recursive-frag','Fragment kills can feed death propagation.'),
C('mine-drive','MINE DRIVE','standard',['mine','ram'],'dash-mines','Dash paths automatically seed explosive traps.'),
C('gravity-bloom','GRAVITY BLOOM','standard',['cluster','graviton'],'fragment-orbit','Gravity curves fragments into expanding and collapsing flowers.'),
C('firebreak','FIREBREAK','standard',['plasma','repulsor'],'push-through-fire','Repulsor waves force enemies through plasma field edges.'),
C('seraph-wing','SERAPH WING','standard',['drone','missile'],'drone-missiles','Drones join missile salvos with micro-launchers.'),
C('celestial-mandala','CELESTIAL MANDALA','advanced',['funnels','orbit'],'mandala-sync','Funnels lock into blade orbit and form armed geometry.'),
C('mobile-fortress','MOBILE FORTRESS','standard',['sentry','barrier'],'shield-network','Turrets inside the barrier gain linked shielding.'),
C('aegis-choir','AEGIS CHOIR','standard',['interceptor','drone'],'adaptive-drones','Drone network dynamically trades offense and defense.'),
C('kill-satellites','KILL SATELLITES','advanced',['funnels','mark'],'triangulate','Funnels triangulate marked elites for synchronized crossfire.'),
C('impact-throne','IMPACT THRONE','standard',['barrier','ram'],'barrier-impact','Stored barrier energy converts into dash shockwaves.'),
C('zero-domain','ZERO DOMAIN','advanced',['barrier','graviton'],'orbit-barrier','Gravity traps enemies around the shield perimeter.'),
C('mirror-storm','MIRROR STORM','apex',['barrier','interceptor','arc'],'counter-charge','Intercepted projectiles charge electrical counterbursts.'),
C('extinction-chain','EXTINCTION CHAIN','standard',['death','arc'],'death-lightning','Death triggers propagate as electrical chains.'),
C('soul-missile-array','SOUL MISSILE ARRAY','advanced',['death','missile'],'death-missiles','Kills generate micro-missiles that join current salvos.'),
C('harvest-crown','HARVEST CROWN','advanced',['death','orbit'],'spectral-blades','Kill streaks add temporary spectral blades to the crown.'),
C('aftershock','AFTERSHOCK','standard',['temporal','nova'],'echo-nova','Nova pulses repeat after a temporal delay.'),
C('ghost-battery','GHOST BATTERY','advanced',['temporal','mortar'],'echo-artillery','The battlefield remembers artillery coordinates and strikes again.'),
C('secondary-frame','SECONDARY FRAME','apex',['temporal','drone'],'ghost-frame','A temporal copy repeats drone commands and selected attacks.'),
C('chrono-blade','CHRONO BLADE','advanced',['temporal','slash'],'echo-slash','Cuts remain as temporal scars and replay later.'),
C('broken-heaven','BROKEN HEAVEN','apex',['temporal','prism','funnels'],'fracture-lattice','Funnels establish fracture nodes that duplicate crossing beams.')
];
export const CONFIG_BY_ID=Object.fromEntries(CONFIGURATIONS.map(c=>[c.id,c]));
const invested=(arsenal,id)=>{const s=arsenal?.[id];return s?(s.tier||0)+(s.evo||0)*2:0};
export function evaluateBuildIdentity(arsenal,previous=new Set()){const active=CONFIGURATIONS.filter(c=>c.requires.every(id=>invested(arsenal,id)>=3));const ids=new Set(active.map(c=>c.id));const gained=active.filter(c=>!previous.has(c.id));const lost=[...previous].filter(id=>!ids.has(id));const score=c=>c.requires.reduce((n,id)=>n+invested(arsenal,id),0)+(c.tier==='apex'?8:c.tier==='advanced'?3:0);const primary=active.slice().sort((a,b)=>score(b)-score(a))[0]||null;return{active:ids,gained,lost,primary,definitions:active}}
export function configurationHooks(ids){return new Set([...ids].map(id=>CONFIG_BY_ID[id]?.hook).filter(Boolean))}
