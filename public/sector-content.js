export const BOSSES=[
{id:'crown-breaker',name:'CROWN BREAKER',world:0,hp:1,speed:1,damage:1,phases:[.72,.38],pattern:'charge-ring',rewardFamily:'crown'},
{id:'glass-oracle',name:'GLASS ORACLE',world:1,hp:1.28,speed:.9,damage:1.12,phases:[.75,.5,.25],pattern:'prism-volley',rewardFamily:'oracle'},
{id:'war-foundry',name:'WAR FOUNDRY',world:2,hp:1.55,speed:.72,damage:1.3,phases:[.66,.33],pattern:'artillery-adds',rewardFamily:'foundry'},
{id:'void-regent',name:'VOID REGENT',world:3,hp:1.82,speed:1.08,damage:1.42,phases:[.8,.55,.3],pattern:'gravity-collapse',rewardFamily:'regent'},
{id:'last-engine',name:'THE LAST ENGINE',world:4,hp:2.2,speed:1.0,damage:1.62,phases:[.8,.6,.4,.2],pattern:'configuration-mirror',rewardFamily:'engine'}
];
export const bossForWorld=w=>BOSSES[Math.max(0,Math.min(BOSSES.length-1,w))];

export const SECTOR_DECKS=[
{id:'sector-1',name:'CROWN APPROACH',formations:['wedge','column','ring'],objectives:['purge','intercept','hunt'],pressure:'lanes'},
{id:'sector-2',name:'MIRROR EXPANSE',formations:['pincer','cross','ring'],objectives:['hold','seal','anomaly'],pressure:'crossfire'},
{id:'sector-3',name:'FOUNDRY BELT',formations:['column','escort','wedge'],objectives:['defend','intercept','extract'],pressure:'artillery'},
{id:'sector-4',name:'VOID BASIN',formations:['ring','pincer','cross'],objectives:['hold','anomaly','hunt'],pressure:'compression'},
{id:'sector-5',name:'ENGINE THRONE',formations:['escort','ring','column','cross'],objectives:['purge','defend','seal','anomaly'],pressure:'mixed'}
];
export const deckForWorld=w=>SECTOR_DECKS[Math.max(0,Math.min(SECTOR_DECKS.length-1,w))];

export const SALVAGE_FAMILIES=[
{id:'crown',name:'CROWN RELIQUARY',tags:['orbit','barrier','crit']},
{id:'oracle',name:'ORACLE GLASS',tags:['beam','prism','temporal']},
{id:'foundry',name:'FOUNDRY RELIC',tags:['mortar','sentry','explosive']},
{id:'regent',name:'REGENT SHARD',tags:['graviton','repulsor','corruption']},
{id:'engine',name:'ENGINE HEART',tags:['temporal','death','configuration']},
{id:'kinetic',name:'KINETIC ASSEMBLY',tags:['rail','repeater','scatter','ricochet','hunter']},
{id:'energy',name:'ENERGY ASSEMBLY',tags:['beam','sweep','prism','nova','arc']},
{id:'blade',name:'BLADE ASSEMBLY',tags:['orbit','launchblade','slash','drill','ram']},
{id:'ordnance',name:'ORDNANCE ASSEMBLY',tags:['missile','mortar','cluster','mine','plasma']},
{id:'autonomous',name:'AUTONOMOUS ASSEMBLY',tags:['drone','funnels','sentry','interceptor']}
];
