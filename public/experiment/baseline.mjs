import{track,once}from'../challenger/analytics.mjs';
const map={build_started:'build_started',build_completed:'build_completed',first_build_completed:'first_completion',second_build_started_by_choice:'second_build'};
window.__abTrack=(...names)=>names.forEach(n=>{if(map[n])(['first_completion','second_build'].includes(map[n])?once:track)(map[n],'a');});
once('exposure','a');
