import urllib.request,urllib.parse,json,pathlib,datetime,gzip
bbox='52.226,20.984,52.255,21.043'
query=f'''[out:json][timeout:35];(way[building]({bbox});way[highway~"^(primary|secondary|tertiary|residential|pedestrian|living_street|footway|path|service|unclassified|trunk)$"]({bbox});way[leisure~"^(park|garden)$"]({bbox});way[natural~"^(water|wood|scrub)$"]({bbox});way[landuse~"^(forest|grass)$"]({bbox});relation[natural=water]({bbox}););out geom;'''
for endpoint in ['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter']:
 try:
  req=urllib.request.Request(endpoint,data=urllib.parse.urlencode({'data':query}).encode(),headers={'User-Agent':'Warsaw2076-hackathon-mockup/1.0','Content-Type':'application/x-www-form-urlencoded'})
  with urllib.request.urlopen(req,timeout=48) as response: data=json.load(response)
  if not data.get('elements'):raise ValueError(data)
  path=pathlib.Path(__file__).resolve().parents[1]/'data/osm-raw.json.gz';path.write_bytes(gzip.compress(json.dumps(data).encode(),mtime=0))
  path.with_name('source.json').write_text(json.dumps({'endpoint':endpoint,'query':query,'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'osm_timestamp':data.get('osm3s',{}).get('timestamp_osm_base'),'bbox':[20.984,52.226,21.043,52.255],'attribution':'© OpenStreetMap contributors','licence':'ODbL-1.0','licence_url':'https://www.openstreetmap.org/copyright','status':'cached'},indent=2))
  print(endpoint,len(data['elements']),path.stat().st_size);break
 except Exception as e:print(endpoint,str(e))
else:raise SystemExit('All endpoints failed')
