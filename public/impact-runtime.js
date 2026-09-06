const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createImpactRuntime(){return{freeze:0,slow:1,slowFor:0,zoom:0,zoomVel:0,rumbleCooldown:0,enabled:true,haptics:true}}
export function hitstop(i,seconds=.045){if(!i?.enabled)return;i.freeze=Math.max(i.freeze,seconds)}
export function slowmo(i,scale=.3,seconds=.18){if(!i?.enabled)return;i.slow=Math.min(i.slow,clamp(scale,.05,1));i.slowFor=Math.max(i.slowFor,seconds)}
export function zoomPunch(i,amount=.035){if(!i?.enabled)return;i.zoom=Math.max(i.zoom,amount);i.zoomVel=Math.max(i.zoomVel,amount*5)}
export function updateImpact(i,realDt){if(!i)return{dt:realDt,scale:1,zoom:0};i.rumbleCooldown=Math.max(0,i.rumbleCooldown-realDt);if(i.freeze>0){i.freeze=Math.max(0,i.freeze-realDt);return{dt:0,scale:0,zoom:i.zoom}}if(i.slowFor>0){i.slowFor=Math.max(0,i.slowFor-realDt)}else i.slow+=(1-i.slow)*Math.min(1,realDt*10);i.zoomVel+=(0-i.zoom)*realDt*38;i.zoomVel*=Math.pow(.02,realDt);i.zoom+=i.zoomVel*realDt;i.zoom*=Math.pow(.001,realDt);return{dt:realDt*i.slow,scale:i.slow,zoom:i.zoom}}
export function impactTransform(ctx,W,H,i){const z=1+(i?.zoom||0);if(Math.abs(z-1)<.0005)return false;ctx.translate(W/2,H/2);ctx.scale(z,z);ctx.translate(-W/2,-H/2);return true}
export function hapticPulse(i,tier='light'){
 if(!i?.haptics||i.rumbleCooldown>0)return false;i.rumbleCooldown=tier==='boss'?.08:.035;
 const spec={light:{duration:28,strong:.15,weak:.25},medium:{duration:48,strong:.35,weak:.45},heavy:{duration:75,strong:.7,weak:.7},boss:{duration:130,strong:1,weak:.85}}[tier]||{duration:35,strong:.2,weak:.3};
 try{const gp=globalThis.navigator?.getGamepads?.()[0],act=gp?.vibrationActuator||gp?.hapticActuators?.[0];if(act?.playEffect)act.playEffect('dual-rumble',{duration:spec.duration,strongMagnitude:spec.strong,weakMagnitude:spec.weak});else if(act?.pulse)act.pulse(spec.strong,spec.duration)}catch{}
 try{globalThis.navigator?.vibrate?.(spec.duration)}catch{}
 return true
}
export function impactPreset(i,type){if(type==='dash'){zoomPunch(i,.012);hapticPulse(i,'light')}else if(type==='elite-kill'){hitstop(i,.05);zoomPunch(i,.028);hapticPulse(i,'heavy')}else if(type==='boss-break'){hitstop(i,.065);slowmo(i,.22,.16);zoomPunch(i,.055);hapticPulse(i,'boss')}else if(type==='level'){hitstop(i,.035);zoomPunch(i,.02);hapticPulse(i,'medium')}else if(type==='player-hit'){hitstop(i,.028);zoomPunch(i,.018);hapticPulse(i,'medium')}}
