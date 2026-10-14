import './style.css';
import { OUTER, CBD, routeIndex, reverseRoute, centreProfiles, csvMatrix, searchStudy, orderedRoutes, matchesFilters } from './analysis.js';
import { loadStudy } from './data.js';
import { icon, esc, routeName } from './ui.js';
import { renderPage, pageInfo } from './pages.js';
import { setMapData, setMapSelection, updateMap, mountMap, resizeMap, fitSelected, fitStudy, fitCentre } from './map.js';

const $=id=>document.getElementById(id);
const state={page:'dashboard',selectedId:null,centreId:'AC02',metric:'travel_time_min',scope:OUTER,
  showValues:true,showCentres:true,explorerTab:'journey',statsTab:'overview',compareOrigin:'',routeList:false,
  actualRoute:true,directRoute:false,filters:{origin:'',thresholds:{},match:'all'},
  filtersOpen:false,legendOpen:false,routeDetailsOpen:false,mapExpanded:false};
let study,rows=[],centres=[],byId=new Map(),byPair=new Map(),legsByRoute=new Map(),profiles=[];
const mobileMapQuery=window.matchMedia('(max-width:640px)');
function positionMapLegend(){
  const stage=document.querySelector('.map-stage'),slot=$('map-legend-mobile-slot'),legend=document.querySelector('.network-layout .map-legend');
  if(!stage||!slot||!legend)return;
  const parent=mobileMapQuery.matches&&!state.mapExpanded?slot:stage;
  if(legend.parentElement!==parent)parent.append(legend);
}
function render(fit=false) {
  if(!study)return;
  const shell=$('map-shell');shell.hidden=true;document.body.append(shell);$('map-overlap').hidden=true;
  document.querySelectorAll('#navigation button').forEach(b=>{const active=b.dataset.page===state.page;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
  const [title,subtitle]=pageInfo[state.page];
  $('page-title').textContent=state.page==='explorer'?routeName(byId.get(state.selectedId)||rows[0]):title;
  $('page-subtitle').textContent=subtitle;
  $('dashboard-title').hidden=state.page!=='dashboard';
  $('content').innerHTML=renderPage[state.page]({state,rows,centres,byId,byPair,legsByRoute,profiles,study});
  $('content').dataset.page=state.page;
  document.body.dataset.page=state.page;
  document.body.classList.toggle('map-fullscreen-active',state.page==='map'&&state.mapExpanded);
  document.querySelector('.map-stage')?.classList.toggle('expanded',state.mapExpanded);
  positionMapLegend();
  const slot=$('map-slot');
  if(slot){
    mountMap(slot);
    const route=byId.get(state.selectedId);
    const visibleSelection=state.page==='map'&&(!route||!matchesFilters(route,{...state.filters,scope:state.scope}))?null:state.selectedId;
    updateMap({selected:state.page==='centres'?null:visibleSelection,metric:state.metric,
      filters:state.page==='map'?{...state.filters,scope:state.scope}:state.page==='centres'?{scope:OUTER,origin:state.centreId,thresholds:{},match:'all'}:{scope:'compare',origin:'',thresholds:{},match:'all'},
      showRoutes:state.page==='explorer'?state.actualRoute:true,showDirect:state.page==='explorer'&&state.directRoute,
      showCentres:state.page==='map'?state.showCentres:true,onlySelected:state.page==='explorer',hideCBD:state.page==='centres',centreFocus:state.page==='centres'?state.centreId:''});
    if(fit)requestAnimationFrame(()=>state.page==='explorer'?fitSelected():state.page==='centres'?fitCentre(state.centreId):fitStudy());
    if(state.page==='map'&&state.mapExpanded)requestAnimationFrame(()=>$('expand-map')?.focus({preventScroll:true}));
  }
}
function navigate(page){if(!renderPage[page])return;if(page!=='map')state.mapExpanded=false;state.page=page;if(page==='explorer'&&!byId.has(state.selectedId))state.selectedId='OD_AC02_AC06';state.routeList=false;$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');history.replaceState(null,'',`#${page}`);render(true);$('content').focus({preventScroll:true});}
function selectRoute(id,page='explorer'){if(!byId.has(id))return;state.selectedId=id;state.centreId=byId.get(id).origin_id;state.routeDetailsOpen=false;if(page==='explorer')state.actualRoute=true;if(page==='map'&&state.page==='map'){render();return;}navigate(page);}
function setMapExpanded(expanded){
  const stage=document.querySelector('.map-stage');if(!stage)return;
  state.mapExpanded=expanded;stage.classList.toggle('expanded',expanded);
  document.body.classList.toggle('map-fullscreen-active',expanded);
  positionMapLegend();
  if(expanded){stage.setAttribute('role','dialog');stage.setAttribute('aria-modal','true');stage.setAttribute('aria-label','Expanded network map');}
  else{stage.removeAttribute('role');stage.removeAttribute('aria-modal');stage.removeAttribute('aria-label');}
  const toggle=$('expand-map');toggle.textContent=expanded?'Close map':'Expand map';toggle.setAttribute('aria-label',expanded?'Close expanded map':'Expand map');toggle.setAttribute('aria-expanded',String(expanded));
  toggle.focus({preventScroll:true});resizeMap();
}
function readFilters(){const thresholds={};document.querySelectorAll('[data-threshold]').forEach(input=>{if(input.value!==''&&Number.isFinite(input.valueAsNumber)&&input.valueAsNumber>=0)thresholds[input.dataset.threshold]=input.valueAsNumber;});state.filters={thresholds,origin:$('filter-origin')?.value||'',match:$('filter-match')?.value||'all'};}
function search(){
  const results=searchStudy(rows,centres,$('global-search').value);
  $('search-results').innerHTML=['Centre','Route'].map(type=>{
    const group=results.filter(r=>r.type===type);
    return group.length?`<section class="search-group" aria-label="${type==='Centre'?'Centres':'Routes'}"><h3>${type==='Centre'?'Centres':'Routes'}</h3>${group.map(r=>`<button type="button" data-${type==='Route'?'route':'centre'}="${r.id}">${icon(type==='Centre'?'centres':'explorer')}<span>${esc(r.label)}</span></button>`).join('')}</section>`:'';
  }).join('')||'<p>No matching centres or routes.</p>';
  $('search-results').hidden=!$('global-search').value.trim();
  $('global-search').setAttribute('aria-expanded',String(!$('search-results').hidden));
}
function closeSearch(){ $('search-results').hidden=true; $('global-search').setAttribute('aria-expanded','false'); }


document.addEventListener('click',event=>{
  const target=event.target.closest('button,[data-route]');if(!target)return;
  if(target.dataset.page){navigate(target.dataset.page);return;}
  if(target.dataset.route){closeSearch();$('global-search').value='';selectRoute(target.dataset.route,target.dataset.mapSelect?'map':'explorer');return;}
  if(target.dataset.centre){state.centreId=target.dataset.centre;closeSearch();$('global-search').value='';navigate('centres');return;}
  if(target.dataset.explorerTab){state.explorerTab=target.dataset.explorerTab;render();return;}
  if(target.dataset.statsTab){state.statsTab=target.dataset.statsTab;render();return;}
  switch(target.id){
    case 'menu-toggle':{const open=$('sidebar').classList.toggle('open');target.setAttribute('aria-expanded',String(open));break;}
    case 'reverse-route':{const reverse=reverseRoute(byId.get(state.selectedId),byPair);if(reverse)selectRoute(reverse.route_id);break;}
    case 'previous-route':case 'next-route':{const routes=orderedRoutes(rows),index=routes.findIndex(r=>r.route_id===state.selectedId);selectRoute(routes[(index+(target.id==='next-route'?1:-1)+routes.length)%routes.length].route_id);break;}
    case 'apply-filters':readFilters();render();break;
    case 'reset-filters':state.filters={origin:'',thresholds:{},match:'all'};render();break;
    case 'clear-selection':state.selectedId=null;render();break;
    case 'fit-map':state.page==='explorer'?fitSelected():state.page==='centres'?fitCentre(state.centreId):fitStudy();break;
    case 'fit-map-mobile':fitStudy();break;
    case 'expand-map':setMapExpanded(!state.mapExpanded);break;
    case 'toggle-map-filters':{state.filtersOpen=!state.filtersOpen;target.closest('.map-filters').dataset.open=String(state.filtersOpen);target.setAttribute('aria-expanded',String(state.filtersOpen));target.lastElementChild.textContent=state.filtersOpen?'−':'+';break;}
    case 'toggle-map-legend':{state.legendOpen=!state.legendOpen;target.closest('.map-legend').dataset.expanded=String(state.legendOpen);target.setAttribute('aria-expanded',String(state.legendOpen));target.lastElementChild.textContent=state.legendOpen?'−':'+';break;}
    case 'toggle-route-details':{state.routeDetailsOpen=!state.routeDetailsOpen;$('map-route-details').hidden=!state.routeDetailsOpen;target.setAttribute('aria-expanded',String(state.routeDetailsOpen));target.textContent=state.routeDetailsOpen?'Less detail':'Details';break;}
    case 'open-route-list':state.routeList=true;render();break;
    case 'close-route-list':state.routeList=false;render();break;
    case 'download-matrix':{const blob=new Blob(['\uFEFF'+csvMatrix(rows,centres,state.metric)],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`melbourne-od-matrix-${state.metric}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
  }
});
document.addEventListener('change',event=>{
  const input=event.target;
  switch(input.id){
    case 'metric-select':state.metric=input.value;render();break;
    case 'scope-select':if(state.page==='map')readFilters();state.scope=input.value;render();break;
    case 'show-values':state.showValues=input.checked;render();break;
    case 'show-centres':state.showCentres=input.checked;render();break;
    case 'actual-route':state.actualRoute=input.checked;render();break;
    case 'direct-route':state.directRoute=input.checked;render();break;
    case 'centre-select':state.centreId=input.value;render(true);break;
    case 'compare-origin':state.compareOrigin=input.value;render();break;
    case 'explorer-origin':selectRoute(rows.find(r=>r.origin_id===input.value).route_id);break;
    case 'explorer-destination':selectRoute(input.value);break;
  }
});
document.addEventListener('keydown',event=>{
  if(state.mapExpanded&&event.key==='Tab'){
    const stage=document.querySelector('.map-stage');
    const focusable=[...stage.querySelectorAll('button:not([disabled]),[href],[tabindex="0"]')].filter(node=>node.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&(document.activeElement===first||!stage.contains(document.activeElement))){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!stage.contains(document.activeElement))){event.preventDefault();first?.focus();}
  }
  if(event.key==='Escape'){if(state.mapExpanded){setMapExpanded(false);event.preventDefault();return;}closeSearch();state.routeList=false;$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');if($('close-route-list'))render();}
  if(event.target.matches('circle[data-route]')&&['Enter',' '].includes(event.key)){event.preventDefault();selectRoute(event.target.dataset.route);}
});
$('search-results').addEventListener('keydown',event=>{
  const items=[...$('search-results').querySelectorAll('button')],index=items.indexOf(document.activeElement);
  if(event.key==='ArrowDown'){event.preventDefault();items[(index+1)%items.length]?.focus();}
  if(event.key==='ArrowUp'){event.preventDefault();if(index<=0)$('global-search').focus();else items[index-1].focus();}
  if(event.key==='Escape')$('global-search').focus();
});
$('global-search').addEventListener('input',search);
$('global-search').addEventListener('keydown',event=>{if(event.key==='ArrowDown'){$('search-results').querySelector('button')?.focus();event.preventDefault();}if(event.key==='Enter')$('search-results').querySelector('button')?.click();});
document.addEventListener('click',event=>{if(!event.target.closest('.search-wrap'))closeSearch();});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
mobileMapQuery.addEventListener('change',event=>{if(!event.matches&&state.mapExpanded)setMapExpanded(false);else positionMapLegend();});
setMapSelection(ids=>{
  if(ids.length===1){selectRoute(ids[0],state.page==='map'?'map':'explorer');return;}
  const chooser=$('map-overlap');chooser.innerHTML=`<strong>Choose a journey (${ids.length})</strong>`+ids.map(id=>`<button type="button" data-route="${id}" ${state.page==='map'?'data-map-select="true"':''}>${esc(routeName(byId.get(id)))}</button>`).join('');chooser.hidden=false;
},id=>{if(id==='CBD01'){state.scope=CBD;navigate('map');}else{state.centreId=id;navigate('centres');}});

async function start(){
  try{
    study=await loadStudy();rows=study.routes.features.map(f=>f.properties);
    centres=study.centres.features.map(f=>f.properties).filter(c=>c.centre_id!=='CBD01').sort((a,b)=>a.centre_id.localeCompare(b.centre_id));
    if(rows.filter(r=>r.analysis_type===OUTER).length!==90||rows.filter(r=>r.analysis_type===CBD).length!==10)throw new Error('Unexpected route groups.');
    byId=new Map(rows.map(r=>[r.route_id,r]));byPair=routeIndex(rows);
    study.legs.forEach(leg=>{if(!legsByRoute.has(leg.route_id))legsByRoute.set(leg.route_id,[]);legsByRoute.get(leg.route_id).push(leg);});
    legsByRoute.forEach(legs=>legs.sort((a,b)=>a.leg_number-b.leg_number));profiles=centreProfiles(rows,centres);
    setMapData(study.routes,study.centres);
    document.documentElement.dataset.studySource=study.source;$('notice').hidden=true;
    document.querySelectorAll('#navigation button').forEach(b=>b.innerHTML=icon(b.dataset.page)+`<span>${b.textContent.trim()}</span>`);
    navigate(renderPage[location.hash.slice(1)]?location.hash.slice(1):'dashboard');
  }catch(error){$('notice').hidden=false;$('notice').textContent=`Study data unavailable: ${error.message}`;$('notice').classList.add('error');}
}
start();
