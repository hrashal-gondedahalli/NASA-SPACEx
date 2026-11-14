/* Page routes for Mission Control's activity screens and dashboard sections. */
(()=>{
 'use strict';
 const sections=new Set(['home','missions','voyage','profile','journey','more-adventures']);
 const screens=new Set(['a-launch','a-planets','a-gravity','destination','workshop','testing','launch','explore','returned']);
 let applying=false,scrollTicket=0;
 const active=()=>document.querySelector('.screen.active')?.id||'home';
 function currentNav(route){
  const selected=route==='profile'?'profile':route==='voyage'?'voyage':route==='home'?'home':'missions';
  document.querySelectorAll('.dash-nav a').forEach(a=>{if(a.hash==='#'+selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 }
 function write(route,replace=false){
  const url=new URL(location.href);url.searchParams.delete('activity');url.hash=route;
  if(url.href!==location.href)history[replace?'replaceState':'pushState']({missionControl:true},'',url);
  currentNav(route);
 }
 function scroll(route){
  const ticket=++scrollTicket;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(ticket!==scrollTicket)return;
   const target=document.getElementById(route)||document.getElementById('home');
   if(route==='home'){window.scrollTo({top:0,behavior:'instant'});return;}
   const header=document.querySelector('.site-header');
   const top=target.getBoundingClientRect().top+scrollY-(header?.getBoundingClientRect().height||0)-16;
   window.scrollTo({top:Math.max(0,top),behavior:'instant'});
   if(!target.hasAttribute('tabindex'))target.tabIndex=-1;
   target.focus({preventScroll:true});
  }));
 }
 function navigate(route,{replace=false,restore=false}={}){
  if(route==='more-adventures')route='missions';
  if(!sections.has(route)&&!screens.has(route))route='home';
  // History restores a launch at readiness; it must not ignite a new flight.
  if(restore&&route==='launch')route='testing';
  applying=true;
  try{MissionControl.open(sections.has(route)?'home':route);}finally{applying=false;}
  if(screens.has(route))route=active();
  write(route,replace);scroll(sections.has(route)?route:'home');
 }
 document.addEventListener('missioncontrol:change',e=>{
  if(applying)return;
  ++scrollTicket;write(e.detail);
 });
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const anchor=e.target.closest('a[href]');if(!anchor||anchor.target&&anchor.target!=='_self'||anchor.hasAttribute('download'))return;
  const url=new URL(anchor.href),route=url.hash.slice(1);
  if(url.origin!==location.origin||url.pathname!==location.pathname||!sections.has(route)&&!screens.has(route))return;
  e.preventDefault();navigate(route);
 });
 window.addEventListener('popstate',()=>navigate(location.hash.slice(1),{replace:true,restore:true}));
 window.addEventListener('hashchange',()=>navigate(location.hash.slice(1),{replace:true,restore:true}));
 window.addEventListener('pageshow',()=>scroll(location.hash.slice(1)||'home'));
 const requested=location.hash.slice(1)||new URLSearchParams(location.search).get('activity')||active();
 navigate(requested,{replace:true,restore:true});
})();
