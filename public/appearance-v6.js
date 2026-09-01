const PALETTES={
 violet:{hue:278,accent:322,bodyL:13},magenta:{hue:318,accent:352,bodyL:14},ember:{hue:12,accent:46,bodyL:12},aqua:{hue:184,accent:216,bodyL:13},acid:{hue:92,accent:156,bodyL:12},gold:{hue:38,accent:188,bodyL:12},ice:{hue:204,accent:266,bodyL:15},rose:{hue:342,accent:285,bodyL:14}
};
export const MARKINGS=['none','bands','spots','split','visor','belly','dorsal'];
export function applySpeciesAppearance(g){
 const key=g.signature?.palette||'violet',p=PALETTES[key]||PALETTES.violet,stage=g.lineage?.stage||g.signature?.stage||1;
 g.appearance={palette:key,primaryHue:p.hue,accentHue:p.accent,bodyLightness:p.bodyL,marking:g.signature?.markings||'none',markingStrength:.55+(stage-1)*.12,material:g.mutations?.includes('shell')?'carapace':g.mutations?.includes('crystalGrowth')?'crystalline':'flesh'};
 g.presentation={...g.presentation,hue:p.hue,accent:p.accent};
 if(g.appearance.marking==='belly')g.signature.markings='split';
 if(g.appearance.marking==='dorsal')g.signature.secondary=g.signature.secondary||'back-crest';
 return g;
}
export function appearanceSummary(g){return`${g.appearance?.palette?.toUpperCase()||'DEFAULT'} · ${g.appearance?.material?.toUpperCase()||'FLESH'} · ${(g.appearance?.marking||'none').toUpperCase()}`}
export {PALETTES};
