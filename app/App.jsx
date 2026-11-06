import React, {useState,useEffect,useMemo,useRef,Suspense,lazy} from 'react';
import {Search,ArrowUpRight,ArrowRight,ArrowLeftRight,MapPin,Navigation,Layers,Plus,Minus,Maximize,LocateFixed,BookOpen,Utensils,DoorOpen,Bookmark,Check,X,Info,Play,Pause,ChevronRight,Route,Building2,Heart,CornerUpRight,Footprints,Menu} from 'lucide-react';
import rooms from './rooms.json';
import LocationPanel from './LocationPanel.jsx';
const Map3D=lazy(()=>import('./Map3D.jsx')); 
import {routeBetween,smooth,length,routePosition} from './routing.js';

const byId=id=>rooms.find(r=>r.id===id);
const pretty=r=>r?.kind==='room'?`Room ${r.name.split('.').at(-1)}`:r?.name;
const Icon=({room,...props})=>{const C=room?.name==='Library'?BookOpen:room?.name==='Dining hall'?Utensils:room?.name==='Medical centre'?Heart:DoorOpen;return <C {...props}/>;};
export default function App(){
 const [live,setLive]=useState(null);
 const initialDistance=useRef(null);
 const params=new URLSearchParams(location.search);
 const [dest,setDest]=useState(byId(params.get('to'))||rooms.find(r=>r.name==='Library'));
 const [origin,setOrigin]=useState(byId(params.get('from'))||byId('1-C1.2.124K'));
 const [floor,setFloor]=useState(dest.floor),[view,setView]=useState('2D'),[query,setQuery]=useState(''),[category,setCategory]=useState('All'),[tab,setTab]=useState('Explore');
 const [zoom,setZoom]=useState(1),[pan,setPan]=useState([0,0]),[svg,setSvg]=useState(''),[mapError,setMapError]=useState(false),[active,setActive]=useState(false),[progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[about,setAbout]=useState(false),[toast,setToast]=useState(''),[mobilePanel,setMobilePanel]=useState(false);
 const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem('aitu-saved')||'[]')}catch{return []}});
 const mapRef=useRef(null),searchRef=useRef(null),drag=useRef(null),moved=useRef(false);
 const route=useMemo(()=>{const start=live?{id:'live',floor:live.floor,x:live.point[0],y:live.point[1],door:live.point}:origin;const r=routeBetween(start,dest);if(!r)return null;const legs=r.legs.map(l=>({...l,points:smooth(l.points,l.floor)}));return {...r,legs,total:legs.reduce((s,l)=>s+length(l.points),0)};},[origin,dest,live]);
 const pos=route?routePosition(route,live?0:progress):null;
 useEffect(()=>{if(live&&active&&route){if(initialDistance.current===null)initialDistance.current=route.total;setProgress(Math.max(0,Math.min(.99,initialDistance.current>0?1-route.total/initialDistance.current:0)));setFloor(live.floor)}},[live,active,route]);
 const checkpoints=useMemo(()=>{if(!route)return [];let before=0;let list=[];for(const l of route.legs){let dist=0;for(let i=1;i<l.points.length;i++){dist+=Math.hypot(l.points[i][0]-l.points[i-1][0],l.points[i][1]-l.points[i-1][1]);if(i===l.points.length-1||dist-(list.at(-1)?.local||0)>30)list.push({value:(before+dist)/route.total,point:l.points[i],floor:l.floor,local:dist});}before+=length(l.points);}return list;},[route]);
 useEffect(()=>{let ignore=false;setMapError(false);setSvg('');fetch(`/maps/floor-${floor}.svg`).then(r=>{if(!r.ok)throw Error();return r.text()}).then(s=>{if(!ignore)setSvg(s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,''))}).catch(()=>!ignore&&setMapError(true));return()=>{ignore=true}},[floor]);
 useEffect(()=>{if(live)setPlaying(false)},[live]);
 useEffect(()=>{if(!playing)return;const id=setInterval(()=>setProgress(p=>{if(p>=1){setPlaying(false);return 1}return Math.min(1,p+.006)}),100);return()=>clearInterval(id)},[playing]);
 useEffect(()=>{if(active&&pos)setFloor(pos.floor)},[pos?.floor,active]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(id)},[toast]);
 useEffect(()=>{function key(e){if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();setMobilePanel(true);searchRef.current?.focus()}if(e.key==='Escape'){setAbout(false);searchRef.current?.blur()}}document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[]);
 useEffect(()=>{const url=new URL(location.href);url.searchParams.set('from',origin.id);url.searchParams.set('to',dest.id);history.replaceState({},'',url)},[origin,dest]);
 const filtered=rooms.filter(r=>(tab!=='Saved'||saved.includes(r.id))&&(category==='All'||(category==='Rooms'?r.kind==='room':r.kind==='place'))&&(!query||`${r.name} ${r.aliases}`.toLowerCase().includes(query.toLowerCase())));
 const shown=query||category!=='All'||tab==='Saved'?filtered:rooms.filter(r=>r.kind==='place');
 function select(r){if(window.innerWidth<=1100)setMobilePanel(false);setDest(r);setFloor(r.floor);setActive(false);setPlaying(false);setProgress(0);setPan([0,0]);setZoom(1);setQuery('')}
 function changeStart(id){setOrigin(byId(id));setProgress(0);setActive(false);setPlaying(false)}
 function bookmark(){const next=saved.includes(dest.id)?saved.filter(x=>x!==dest.id):[...saved,dest.id];setSaved(next);try{localStorage.setItem('aitu-saved',JSON.stringify(next))}catch{setToast('Saved for this visit only')}}
 function start(preview=false){initialDistance.current=null;if(preview)setLive(null);setProgress(0);setActive(true);setPlaying(preview);setFloor(live&&!preview?live.floor:origin.floor);setMobilePanel(false)}
 function nextPoint(){if(pos && route.legs[pos.leg].stairs && pos.t>=.999){setProgress(p=>Math.min(1,p+.00001));return}const n=checkpoints.find(c=>c.value>progress+.001);setProgress(n?.value||1)}
 const atStairs=active&&pos&&route?.legs[pos.leg]?.stairs&&pos.t>=.999;
 const currentLeg=route?.legs.find(l=>l.floor===floor);
 const d=currentLeg?.points.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join(' ');
 const destFloor=dest.floor===floor;
 const currentPoint=live?.floor===floor?live.point:pos?.floor===floor?pos.point:null;
 const nextCheckpoint=checkpoints.find(c=>c.value>progress+.001);
 const routeStatus=progress>=1?'You’ve arrived':playing?'Route preview':active?'Walking directions':'Your route';
 const allFloorRooms=useMemo(()=>rooms.filter(r=>r.floor===floor),[floor]);
 return <div className="app">
  <header className="header"><a className="brand" href="/" aria-label="AITU Map home"><img src="/aitu-logo.png" alt="Astana IT University"/><span>Map</span></a><div className="header-rule"/><span className="university">Astana IT University</span><nav aria-label="Main navigation">{['Explore','Saved'].map(t=><button className={tab===t?'nav active':'nav'} onClick={()=>{setTab(t);setQuery('');setMobilePanel(true)}} key={t}>{t==='Explore'?<Layers/>:<Bookmark/>}{t}</button>)}</nav><button aria-label="About the map" className="help" onClick={()=>setAbout(true)}><Info/><span>About the map</span></button></header>
  <div className="workspace">
   <aside className={`sidebar ${mobilePanel?'open':''}`}>
    <div className="sidebar-heading"><p className="eyebrow">A little less searching</p><h1>Find your next stop<span>.</span></h1><p>Your way around campus, one room at a time</p></div>
    <div className="search"><Search/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a room or place" aria-label="Search a room or place"/>{query?<button onClick={()=>setQuery('')} aria-label="Clear search"><X/></button>:<kbd>Ctrl K</kbd>}</div>
    <div className="categories" aria-label="Place categories">{['All','Rooms','Places'].map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}<span>{filtered.length} places</span></div>
    <div className="list-heading"><h2>{query?'Search results':tab==='Saved'?'Saved places':category==='Rooms'?'Room directory':'On campus'}</h2><span>{query?`${shown.length} found`:'3 floors'}</span></div>
    <div className="places">{shown.length?shown.map(r=><button key={r.id} className={`place ${dest.id===r.id?'selected':''}`} onClick={()=>select(r)}><span className="place-icon"><Icon room={r}/></span><span><strong>{pretty(r)}</strong><small>{r.block} <span>·</span> Floor {r.floor}</small></span><ChevronRight/></button>):<div className="empty"><Search/><strong>{tab==='Saved'?'Your shortcuts live here':'No matching rooms'}</strong><p>{tab==='Saved'?'Save a place with the bookmark button below.':'Try a room number like 126, or “Library”.'}</p></div>}</div>
    <LocationPanel rooms={rooms} onPosition={setLive} onStop={()=>{setLive(null);setActive(false);setProgress(0)}}/>
    <section className="destination" aria-label="Route planner"><div className="destination-title"><span className="destination-icon"><Icon room={dest}/></span><div><small>Destination</small><h2>{pretty(dest)}</h2></div><button className={`icon-button ${saved.includes(dest.id)?'bookmarked':''}`} onClick={bookmark} aria-label={saved.includes(dest.id)?'Unsave destination':'Save destination'}><Bookmark fill={saved.includes(dest.id)?'currentColor':'none'}/></button></div><div className="tags"><span>{dest.block}</span><span>Floor {dest.floor}</span><span>{dest.kind==='room'?'Classroom':'Campus place'}</span></div>
     <div className="origin"><span className="origin-dot"/><label htmlFor="origin">Starting point<select id="origin" value={origin.id} onChange={e=>changeStart(e.target.value)}>{[...rooms].sort((a,b)=>a.name.localeCompare(b.name)).map(r=><option key={r.id} value={r.id}>{r.name} · Floor {r.floor}</option>)}</select></label><button className="icon-button" aria-label="Swap start and destination" onClick={()=>{const old=origin;changeStart(dest.id);select(old)}}><ArrowLeftRight/></button></div>
     <p className="manual-note"><LocateFixed/> Set your starting room manually</p>
     <button className="primary" disabled={!route} onClick={()=>start(false)}><Navigation/>{origin.id===dest.id?'You’re at the destination':route?'Start directions':'Route unavailable'}<ArrowRight/></button>
     {route?<button className="preview" disabled={!!live} onClick={()=>start(true)}><Play/>Preview the route</button>:<p className="manual-note">{origin.id===dest.id?'Choose another destination to plan a route.':'This connection is not mapped. Try another starting room.'}</p>}
    </section>
    <footer className="sidebar-footer"><span className="status-dot"/> Campus map <span>·</span> Original floor plans <button onClick={()=>setAbout(true)} aria-label="Map information"><Info/></button></footer>
   </aside>
   <main className="main"><div className="map-toolbar"><div><div className="breadcrumb"><Building2/> Campus <ChevronRight/> {floor===1?'First':floor===2?'Second':'Third'} floor</div><h2>Know where you’re going</h2></div><div className="view-switch" aria-label="Map style">{['Normal','2D','3D'].map(v=><button key={v} aria-pressed={view===v} className={view===v?'selected':''} onClick={()=>setView(v)}>{v==='2D'&&<Layers/>}{v}</button>)}</div></div>
    <div className="map-area" ref={mapRef}>
     <div className="map-caption"><span className="status-dot"/> Astana IT University <span>/</span> C1</div>
     <div className="floor-switch" aria-label="Floor selector"><span>Floor</span>{[3,2,1].map(f=><button key={f} aria-pressed={floor===f} className={floor===f?'selected':''} onClick={()=>{setFloor(f);setZoom(1);setPan([0,0])}}>{f}</button>)}</div>
     <svg style={{display:view==='3D'?'none':undefined}} className={`floor-map ${view==='2D'?'simple':''}`} viewBox="-40 -60 1005 530" aria-label={`Floor ${floor} map. Select a destination using the directory.`} onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,pan};moved.current=false;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;if(Math.abs(dx)+Math.abs(dy)>5)moved.current=true;const scale=1005/e.currentTarget.getBoundingClientRect().width;setPan([drag.current.pan[0]+dx*scale,drag.current.pan[1]+dy*scale])}} onPointerUp={e=>{drag.current=null;if(!moved.current){const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-room]');if(el){const r=byId(el.getAttribute('data-room'));if(r)select(r)}}}} onPointerCancel={()=>drag.current=null}>
      <g transform={`translate(${462*(1-zoom)+pan[0]} ${210*(1-zoom)+pan[1]}) scale(${zoom})`}>
       <g className="map-art" dangerouslySetInnerHTML={{__html:svg}}/>
       <text className="block-label" x="168" y="42" textAnchor="middle">C1.1</text><text className="block-label" x="462" y="8" textAnchor="middle">C1.2</text><text className="block-label" x="755" y="42" textAnchor="middle">C1.3</text>
       {destFloor&&<polygon points={dest.points.map(p=>p.join(',')).join(' ')} className="selected-room"/>}
       {view==='2D'&&allFloorRooms.filter(r=>zoom>1.35||r.kind==='place'||r.id===dest.id).map(r=><text className="room-label" key={r.id} x={r.x} y={r.y} textAnchor="middle">{r.kind==='room'?r.name.split('.').at(-1):r.name}</text>)}
       {[325,600].map(x=><g className="stairs-marker" key={x} transform={`translate(${x} 177)`}><rect x="-7" y="-7" width="14" height="14" rx="3"/><path d="M-4 4V1H-1V-2H2V-5H5"/></g>)}
       {d&&<><path d={d} className="route-under"/><path d={d} className="route-line"/>{active&&pos?.floor===floor&&<path d={d} pathLength="100" className="route-completed" strokeDasharray={`${pos.t*100} 100`}/>}</>}
       {currentLeg&&<g transform={`translate(${currentLeg.points.at(-1).join(' ')})`}><circle className="end-halo" r="10"/><circle className="end-dot" r="5"/></g>}
       {currentPoint&&<g transform={`translate(${currentPoint.join(' ')})`}><circle className="position-halo" r="14"/><circle className="position-dot" r="7"/><path className="position-arrow" d="M-2 2L0-3L2 2L0 1Z"/></g>}
       {nextCheckpoint&&active&&!playing&&nextCheckpoint.floor===floor&&<g transform={`translate(${nextCheckpoint.point.join(' ')})`}><circle r="7" fill="#fff" stroke="#167da8" strokeWidth="1.5"/><text textAnchor="middle" y="3" fontSize="8" fill="#12698e">+</text></g>}
       {destFloor&&<g className="map-pin-label" transform={`translate(${dest.x} ${dest.y-26})`}><rect x={-Math.max(43,pretty(dest).length*3.5)} y="-14" width={Math.max(86,pretty(dest).length*7)} height="26" rx="7"/><text textAnchor="middle" y="3">{pretty(dest)}</text></g>}
      </g>
     </svg>
     {view==='3D'&&<Suspense fallback={<div className="map-loading">Loading 3D…</div>}><Map3D rooms={allFloorRooms} dest={dest} points={currentLeg?.points} position={currentPoint}/></Suspense>}
     {!svg&&<div className="map-loading" role="status">{mapError?'Could not load this floor. Reload to try again.':'Loading floor plan…'}</div>}
     <div className="map-controls" style={{display:view==='3D'?'none':undefined}}><button aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(3,z+.25))}><Plus/></button><button aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(.75,z-.25))}><Minus/></button><div/><button aria-label="Fit map" onClick={()=>{setZoom(1);setPan([0,0])}}><Maximize/></button><button aria-label="Show route position" onClick={()=>{setFloor(pos?.floor||origin.floor);setPan([0,0]);setZoom(1);setToast(active?'Showing your route position':'Showing your selected starting point')}}><LocateFixed/></button></div>
     <div className="map-key"><span><i className="key-room"/>Room</span><span><i className="key-route"/>Your route</span><span><i className="key-position"/>Route position</span></div>
     <div className="map-note">Floor plan from the original AITU Map<br/>Check current room signs on campus</div>
     {route&&<section className={`journey ${active?'walking':''}`} aria-label="Navigation progress"><div className="journey-icon">{progress>=1?<Check/>:active?<Navigation/>:<Route/>}</div><div className="journey-main"><div className="journey-kicker">{routeStatus}<span>{(live?.floor||origin.floor)===dest.floor?'Same floor':`Floors ${live?.floor||origin.floor} → ${dest.floor} · stairs`}</span></div><h3>{progress>=1?pretty(dest):`${live?'Your phone location':pretty(origin)} → ${pretty(dest)}`}</h3><p>{playing?'Simulated movement · not live location':active?(live?'Live GPS · follow the blue route; verify campus signs':atStairs?`Take the stairs to floor ${dest.floor}, then confirm below.`:'Follow the blue line. Confirm each marked waypoint.'):'A clear path from your starting room to your destination'}</p>{active&&<><div className="progress-track"><div style={{transform:`scaleX(${progress})`}}/></div><div className="progress-meta"><span>{Math.round(progress*100)}% complete</span><span>{progress>=1?'Destination reached':`Floor ${pos?.floor} · ${live?'Live GPS':playing?'Preview':'Manual progress'}`}</span></div></>}</div><div className="journey-actions">{active?<><button className="icon-button" aria-label={playing?'Pause preview':'Play route preview'} onClick={()=>{if(progress>=1)setProgress(0);setPlaying(!playing)}}>{playing?<Pause/>:<Play/>}</button><button className="icon-button" aria-label="End navigation" onClick={()=>{setActive(false);setPlaying(false);setProgress(0)}}><X/></button></>:<span className="journey-mode"><Footprints/>Walking</span>}</div>{active&&!playing&&!live&&progress<1&&<button className="confirm-waypoint" onClick={nextPoint}><Check/>{atStairs?`Reached floor ${dest.floor}`:"Reached marked point"}<ChevronRight/></button>}</section>}
    </div>
    <div className="main-footer"><span><Layers/> Three floors. One familiar campus.</span><button onClick={async()=>{try{await navigator.clipboard.writeText(location.href);setToast('Route link copied')}catch{setToast('Copy the page address to share this route')}}}>Share this route <ArrowUpRight/></button></div>
   </main>
  </div>
  <button className="mobile-toggle" onClick={()=>setMobilePanel(!mobilePanel)}>{mobilePanel?<><MapPin/>Show map</>:<><Search/>Find a place</>}</button>
  {toast&&<div className="toast" role="status"><Check/>{toast}</div>}
  {about&&<div className="modal-backdrop" onClick={()=>setAbout(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}><button className="icon-button close" autoFocus onClick={()=>setAbout(false)} aria-label="Close information"><X/></button><img src="/aitu-logo.png" alt="Astana IT University"/><h2 id="about-title">A familiar campus.<br/>A clearer way around.</h2><p>AITU Map brings the original Astana IT University floor plans into a searchable, interactive campus guide.</p><h3>About directions</h3><p>Routes are calculated around rooms in the original floor plans. These archival plans have not been verified against the current building. Follow campus signage; routes are not emergency or accessibility guidance. Routes between floors use stairs.</p><h3>Your position stays yours</h3><p>Enable phone location to receive real GPS updates. Your coordinates stay on your phone. Indoor guidance requires two-point map alignment, a manually selected floor, and accuracy of 10 m or better. GPS can be unreliable indoors; this is approximate guidance, not a surveyed positioning system. You can stop tracking at any time. Manual waypoints and simulated preview remain available.</p><h3>Three ways to see campus</h3><p>Normal shows the original detailed plan. 2D simplifies labels for easier navigation. 3D shows extruded room geometry with illustrative heights. Drag to orbit and pinch to zoom. In 2D, drag to pan and tap a room to select it.</p><h3>Built by Hussain Hassani</h3><p><a href="https://t.me/hhassani1" target="_blank" rel="noreferrer">Telegram · @hhassani1</a><br/><a href="https://github.com/Hassani0x" target="_blank" rel="noreferrer">GitHub · Hassani0x</a></p><p className="credits">Original map by <a href="https://github.com/Yuujiso/aitumap" target="_blank" rel="noreferrer">Yuujiso</a> · MIT license</p></section></div>}
 </div>
}


