/* © OpenStreetMap contributors, ODbL-1.0. Local cache; see data/source.json.
   Orthographic isometric rendering in Canvas 2D. No tiles, WebGL, or map SDK. */
let mapCanvas, mapContext, mapBuildings=[], mapRoads=[], mapAreas=[], mapTrees=[];
function world(coordinates) {
  // Local equirectangular projection, metres converted to drawing units.
  return [(coordinates[0]-20.984)*111320*Math.cos(52.24*Math.PI/180)/4.3,
          (52.255-coordinates[1])*111320/4.3];
}
function ringContains(point, ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if((a[1]>point[1])!==(b[1]>point[1]) && point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
function initCity() {
  const data=window.WARSAW_MAP;
  mapCanvas=document.createElement('canvas');mapCanvas.setAttribute('aria-hidden','true');
  Object.assign(mapCanvas.style,{position:'absolute',pointerEvents:'none'});
  svg.before(mapCanvas);svg.style.position='relative';mapContext=mapCanvas.getContext('2d');
  places.forEach((p,i)=>{
    const anchor=data.anchors[i];
    if(anchor){p.coordinates=anchor.coordinates;p.osm_id=anchor.osm_id;}
    p.point=world(p.coordinates);
  });
  setRouteData(0);
  document.querySelector('#source-detail').textContent=`Fetched ${data.source.fetched_at.slice(0,10)}. ${data.stats.heights.osm_height} heights from OSM; ${data.stats.heights.levels_estimate} estimated at 3.2 m per floor; ${data.stats.heights.fallback_mock} use a mock 12 m height. Vertical scale is exaggerated ×2.3. Flat roofs and decorative trees are simulated. Place coordinates are area centroids where linked to OSM; other markers remain approximate fixtures.`;
  const observer=new ResizeObserver(()=>drawCity());observer.observe(svg);
}
const corridorLoads=new Map();
function loadCorridor(index) {
  if(window.WARSAW_ROUTE_MAPS?.[index])return Promise.resolve();
  if(!corridorLoads.has(index))corridorLoads.set(index,new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=`data/corridor-${index}.js`;
    script.onload=resolve;script.onerror=()=>{corridorLoads.delete(index);script.remove();reject(new Error('Could not load cached corridor'));};document.head.append(script);
  }));
  return corridorLoads.get(index);
}
function setRouteData(index) {
  const tile=window.WARSAW_ROUTE_MAPS[index];
  mapBuildings=tile.buildings.map(b=>{
    const ring=b.coordinates.map(world),centre=ring.reduce((s,p)=>[s[0]+p[0]/ring.length,s[1]+p[1]/ring.length],[0,0]);
    return {...b,ring,x:centre[0],y:centre[1],z:b.height_m*.45};
  }).sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  mapRoads=tile.roads.map(r=>({...r,ring:r.coordinates.map(world)}));
  mapAreas=tile.areas.map(a=>({...a,ring:a.coordinates.map(world)}));
  mapTrees=[];
  for(const a of mapAreas){
    const xs=a.ring.map(p=>p[0]),ys=a.ring.map(p=>p[1]);
    for(let x=Math.ceil(Math.min(...xs)/15)*15;x<Math.max(...xs);x+=15)
      for(let y=Math.ceil(Math.min(...ys)/15)*15;y<Math.max(...ys);y+=15)
        if(mapTrees.length<600&&near(x,y)&&ringContains([x,y],a.ring))mapTrees.push([x,y]);
  }
  document.querySelector('#map-facts').textContent=`${tile.buildings.length} buildings near this path · cached OSM · detail within ~210 m`;
}
let activeCorridor=0;
function updateCorridor() {
  if(window.WARSAW_ROUTE_MAPS?.[selected]){setRouteData(selected);activeCorridor=selected;drawCity();return;}
  const requested=selected;
  // Hide the previous corridor while its replacement loads. Context remains visible.
  mapBuildings=[];mapRoads=[];mapTrees=[];mapAreas=[];drawCity();
  document.querySelector('#map-facts').textContent='Loading this path’s cached map detail…';
  loadCorridor(requested).then(()=>{
    if(selected!==requested)return;
    setRouteData(requested);activeCorridor=requested;drawCity();
  }).catch(()=>{if(selected===requested)document.querySelector('#map-facts').textContent='Map detail unavailable. Select this route again to retry.';});
}
function drawCity() {
  if(!mapContext)return;
  const c=mapContext,box=svg.getBoundingClientRect(),parent=svg.parentElement.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio||1,2),scale=Math.min(box.width/1400,box.height/1000);
  mapCanvas.style.left=`${box.left-parent.left}px`;mapCanvas.style.top=`${box.top-parent.top}px`;
  mapCanvas.style.width=`${box.width}px`;mapCanvas.style.height=`${box.height}px`;
  mapCanvas.width=Math.round(box.width*dpr);mapCanvas.height=Math.round(box.height*dpr);
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,box.width,box.height);
  c.translate((box.width-1400*scale)/2,(box.height-1000*scale)/2);c.scale(scale,scale);
  function path(points,fill,stroke,width=1,close=true){
    if(points.length<2)return;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);if(close)c.closePath();
    if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}
  }
  const boundary=[[0,0],[940,0],[940,760],[0,760]].map(p=>project(...p));
  path(boundary,'#e9ede4');c.save();c.beginPath();boundary.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();
  for(const a of window.WARSAW_MAP.areas)path(a.coordinates.map(p=>project(...world(p))),a.kind==='water'?'#cbded9':a.kind==='green'?'#dce5d4':'#e9ede4');
  for(const r of window.WARSAW_MAP.roads)path(r.coordinates.map(p=>project(...world(p))),null,'#f3f5ee',1.5,false);
  for(const a of mapAreas)path(a.ring.map(p=>project(...p)),'#d1dfc4');
  const widths={trunk:4.5,primary:4,secondary:3.2,tertiary:2.8,residential:2.2,pedestrian:2,living_street:1.8,unclassified:2,service:1.2,footway:.7,path:.6};
  for(const r of mapRoads)path(r.ring.map(p=>project(...p)),null,['footway','path'].includes(r.kind)?'#eaf0df':'#fafbf6',widths[r.kind]||1,false);
  for(const [x,y] of mapTrees){const p=project(x,y),active=near(x,y);path([[p[0],p[1]-8],[p[0]-3,p[1]-1],[p[0]+3,p[1]-1]],active?'#729362':'#aaba9b');}
  c.restore();
  for(const b of mapBuildings){
    const active=near(b.x,b.y);
    const tint=(mix)=>{const hex=routes[selected].colour.slice(1);return '#'+[0,2,4].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-mix)+245*mix).toString(16).padStart(2,'0')).join('');};
    const roof=b.ring.map(p=>project(...p,b.z)),base=b.ring.map(p=>project(...p));
    if(b.ring.length<4)continue;
    path(base.map(p=>[p[0]+b.z*.2,p[1]+b.z*.12]),'#69775d12');
    for(let i=0;i<base.length-1;i++){
      const a=base[i],d=base[i+1];
      // Only screen-facing walls; rear walls cannot obscure the roof.
      path([a,d,roof[i+1],roof[i]],active?(d[0]>a[0]?tint(.43):tint(.63)):(d[0]>a[0]?'#b7c2ae':'#cbd3c1'),null);
    }
    path(roof,active?tint(.81):'#f1f3e9','#d0d7c6',.45);
    // Taller blocks retain a subtle floor rhythm; footprint and height determine the walls.
    if(b.z>20){const i=base.findIndex((a,j)=>j<base.length-1&&Math.hypot(a[0]-base[j+1][0],a[1]-base[j+1][1])>6);
      if(i>=0)for(let h=7;h<b.z-3;h+=7)path([[base[i][0],base[i][1]-h],[base[i+1][0],base[i+1][1]-h]],null,active?'#7d9c733b':'#89977e30',.6,false);
    }
  }
}
