"""Prepare a small ODbL-labelled browser cache; no third-party packages needed."""
import json, pathlib, re, collections, gzip
ROOT = pathlib.Path(__file__).resolve().parents[1]
raw = json.loads(gzip.decompress((ROOT / 'data/osm-raw.json.gz').read_bytes()))
source = json.loads((ROOT / 'data/source.json').read_text())
west,south,east,north=source['bbox']
def coordinates(geometry):
    return [[round(p['lon'],6),round(p['lat'],6)] for p in geometry if 'lon' in p]
def centroid(points):
    return [sum(p[i] for p in points)/len(points) for i in (0,1)]
def number(value):
    if not value:return None
    match=re.match(r'^\s*(\d+(?:[.,]\d+)?)\s*(m)?\s*$',str(value))
    return float(match[1].replace(',','.')) if match else None
def clip(points):
    for axis,bound,sign in [(0,west,1),(0,east,-1),(1,south,1),(1,north,-1)]:
        result=[]
        if not points:break
        a=points[-1]
        for b in points:
            ai=(a[axis]-bound)*sign>=0;bi=(b[axis]-bound)*sign>=0
            if ai != bi:
                t=(bound-a[axis])/(b[axis]-a[axis]);result.append([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])
            if bi:result.append(b)
            a=b
        points=result
    return [[round(x,6),round(y,6)] for x,y in points]
buildings=[];roads=[];areas=[];counts=collections.Counter()
for item in raw['elements']:
    tags=item.get('tags',{});p=coordinates(item.get('geometry',[]))
    if item['type']=='way' and len(p)>1:
        if tags.get('building') and p[0]==p[-1]:
            c=centroid(p)
            if not(west<=c[0]<=east and south<=c[1]<=north):continue
            height=number(tags.get('height'));levels=number(tags.get('building:levels'))
            if height:kind='osm_height'
            elif levels:height=levels*3.2;kind='levels_estimate'
            else:height=12;kind='fallback_mock'
            counts[kind]+=1
            buildings.append({'id':item['id'],'coordinates':p,'height_m':round(height,1),'height_kind':kind,'name':tags.get('name',''),'building':tags['building']})
        elif tags.get('highway'):
            roads.append({'id':item['id'],'coordinates':p,'kind':tags['highway'],'name':tags.get('name','')})
        elif p[0]==p[-1]:
            cp=clip(p)
            if len(cp)>3:areas.append({'id':item['id'],'coordinates':cp,'kind':'water' if tags.get('natural')=='water' else 'green','name':tags.get('name','')})
    elif item['type']=='relation' and tags.get('natural')=='water':
        # Stitch outer ways before clipping; inner rings are retained separately as cut-outs.
        for role in ['outer','inner']:
            parts=[coordinates(m.get('geometry',[])) for m in item.get('members',[]) if m.get('role')==role and m.get('geometry')]
            while parts:
                ring=parts.pop()
                while ring[0]!=ring[-1]:
                    for i,part in enumerate(parts):
                        if ring[-1]==part[0]:ring+=part[1:];parts.pop(i);break
                        if ring[-1]==part[-1]:ring+=list(reversed(part))[1:];parts.pop(i);break
                        if ring[0]==part[-1]:ring=part[:-1]+ring;parts.pop(i);break
                        if ring[0]==part[0]:ring=list(reversed(part))[:-1]+ring;parts.pop(i);break
                    else:break
                if ring[0]!=ring[-1]:continue
                cp=clip(ring)
                if len(cp)>3:areas.append({'id':item['id'],'coordinates':cp,'kind':'water' if role=='outer' else 'island','name':tags.get('name','')})
result={'source':source,'stats':{'buildings':len(buildings),'roads':len(roads),'areas':len(areas),'heights':dict(counts)},'buildings':buildings,'roads':roads,'areas':areas}
(ROOT/'data/warsaw-map.js').write_text('// © OpenStreetMap contributors · ODbL-1.0 · see source.json\nwindow.WARSAW_MAP='+json.dumps(result,separators=(',',':'),ensure_ascii=False)+';\n')
print(json.dumps(result['stats'],indent=2))
