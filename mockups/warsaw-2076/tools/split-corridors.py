"""Split the OSM cache into a light overview and three lazy-loaded route corridors."""
import pathlib,json,math
root=pathlib.Path(__file__).resolve().parents[1]
p=root/'data/warsaw-map.js'
data=json.loads(p.read_text().split('window.WARSAW_MAP=',1)[1].rstrip(';\n'))
# Fixture locations, in longitude/latitude; source-linked park and museum centroids match UI.
places=[[20.993152,52.249428],[21.00286,52.248677],[21.0115,52.2499],[21.007775,52.240913],[21.0239,52.2364],[21.0249,52.2316]]
routes=[[0,1,3],[0,1,2],[3,4,5]]
def metres(p):return [p[0]*111320*math.cos(math.radians(52.24)),p[1]*111320]
def distance(p,a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def near(points,segments,radius):
 return any(distance(metres(p),a,b)<radius for p in points for a,b in segments)
def thin(points,step=2):return points[::step]+([points[-1]] if points[-1]!=points[::step][-1] else [])
# Broad context stays flat: main streets, river and substantial green areas only.
def area(points):
 p=[metres(p) for p in points];return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]+p[:1])))/2
overview={**{k:data[k] for k in ['source','stats']},'buildings':[],'roads':[r for r in data['roads'] if r['kind'] in ['primary','secondary','tertiary','trunk']],'areas':[a for a in data['areas'] if a['kind']!='green' or area(a['coordinates'])>9000]}
for a in overview['areas']:a['coordinates']=thin(a['coordinates'],3)
# Source-linked marker coordinates are exported so UI and corridor selection share anchors.
overview['anchors']={str(i):{'coordinates':p,'osm_id':osm} for i,p,osm in [(0,places[0],186141946),(1,places[1],18467869),(3,places[3],4943389)]}
(root/'data/warsaw-overview.js').write_text('// © OpenStreetMap contributors · ODbL-1.0\nwindow.WARSAW_MAP='+json.dumps(overview,separators=(',',':'),ensure_ascii=False)+';\n')
for i,stops in enumerate(routes):
 points=[metres(places[j]) for j in stops];segments=list(zip(points,points[1:]))
 buildings=[b for b in data['buildings'] if near(b['coordinates'][::max(1,len(b['coordinates'])//5)],segments,210)]
 roads=[r for r in data['roads'] if near(r['coordinates'][::max(1,len(r['coordinates'])//6)],segments,190)]
 areas=[a for a in data['areas'] if a['kind']=='green' and near(a['coordinates'][::max(1,len(a['coordinates'])//6)],segments,230)]
 tile={'buildings':buildings,'roads':roads,'areas':areas,'radius_m':210}
 out=root/f'data/corridor-{i}.js';out.write_text('// © OpenStreetMap contributors · ODbL-1.0\nwindow.WARSAW_ROUTE_MAPS=window.WARSAW_ROUTE_MAPS||{};window.WARSAW_ROUTE_MAPS['+str(i)+']='+json.dumps(tile,separators=(',',':'),ensure_ascii=False)+';\n')
 print(i,len(buildings),len(roads),len(areas),out.stat().st_size)
print('overview bytes', (root/'data/warsaw-overview.js').stat().st_size)
