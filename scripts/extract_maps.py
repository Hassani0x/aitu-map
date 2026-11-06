"""Preserve Yuujiso's floor geometry and extract searchable room metadata."""
import re, json, pathlib, xml.etree.ElementTree as ET
from PIL import Image, ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[1]
def body(path, wrapper):
    s=path.read_text(encoding='utf-8')
    s=s.split('<'+wrapper+'>',1)[1].split('</'+wrapper+'>',1)[0]
    s=re.sub(r'<[A-Z][^>]*?/>','',s)
    s=re.sub(r'\{\/\*.*?\*\/\}','',s,flags=re.S)
    s=s.replace('className=', 'class=')
    return s
wall=body(ROOT/'src/shared/ui/general/map/Wallpaper.jsx','g id="WALLPAPER"') if False else ''
w=(ROOT/'src/shared/ui/general/map/Wallpaper.jsx').read_text()
wall=w[w.index('<g id="WALLPAPER">'):w.rindex('</g>')+4].replace('className=','class=')
names={'LIBRARY':'Library','ASSEMBLYHALL':'Assembly hall','DININGHALL':'Dining hall','MEDIKER':'Medical centre','COWORKING':'Coworking'}
rooms=[]
for f in [1,2,3]:
    s=body(ROOT/f'src/shared/ui/others/C1_ALL_{f}.jsx','MapLayout')
    xml=ET.fromstring('<svg>'+s+'</svg>')
    img=Image.new('RGB',(1900,850),'#f4f4f2'); d=ImageDraw.Draw(img)
    for el in xml.iter():
        if el.tag in ['polygon','polyline'] and el.get('points'):
            nums=list(map(float,re.findall(r'-?\d*\.?\d+',el.get('points')))); pts=list(zip(nums[::2],nums[1::2]))
            if len(pts)>2:d.polygon([(x*2+20,y*2+20) for x,y in pts],fill='#d9dcd9',outline='#8d9694',width=2)
    obstacles=[]
    for el in xml.iter():
        if el.tag in ['polygon','polyline'] and el.get('points'):
            ns=list(map(float,re.findall(r'-?\d*\.?\d+',el.get('points'))))
            ps=list(zip(ns[::2],ns[1::2]))
            if len(ps)>=3: obstacles.append(ps)
    (ROOT/f'app/obstacles-{f}.json').write_text(json.dumps(obstacles))
    seen=set()
    for el in xml.iter('g'):
        raw=el.get('data-name','')
        shape=next((e for e in el if e.tag in ['polygon','polyline']),None)
        if not raw or shape is None or raw in seen:continue
        seen.add(raw)
        nums=list(map(float,re.findall(r'-?\d*\.?\d+',shape.get('points','')))); pts=list(zip(nums[::2],nums[1::2]))
        if not pts:continue
        x=sum(p[0] for p in pts)/len(pts);y=sum(p[1] for p in pts)/len(pts)
        label=raw.split('|')[0]
        if label=='1.352K':label='C1.1.352K'
        name=names.get(label,label.replace('_',' ').title()) if not label.startswith('C1.') else label
        rid=f'{f}-{label}'
        el.set('data-room',rid)
        # The endpoints of open polylines identify the original doorway gap.
        door=[(pts[0][0]+pts[-1][0])/2,(pts[0][1]+pts[-1][1])/2] if shape.tag=='polyline' else None
        block=label[:4] if label.startswith('C1.') else ('C1.1' if x<315 else 'C1.3' if x>610 else 'C1.2')
        rooms.append(dict(id=rid,name=name,aliases=raw,floor=f,block=block,x=round(x,2),y=round(y,2),door=door,points=pts,kind='room' if label.startswith('C1.') else 'place'))
        d.text((x*2+20,y*2+20),label.split('.')[-1],fill='#101010',anchor='mm')
    svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -30 965 450">'+wall+''.join(ET.tostring(e,encoding='unicode') for e in xml)+'</svg>'
    (ROOT/f'public/maps/floor-{f}.svg').write_text(svg,encoding='utf-8')
    (ROOT/'work').mkdir(exist_ok=True)
    img.save(ROOT/f'work/inspection-{f}.png')
(ROOT/'app/rooms.json').write_text(json.dumps(rooms,ensure_ascii=False),encoding='utf-8')
print(f'Extracted {len(rooms)} destinations across three floors')
print([(r['name'],r['floor'],r['x'],r['y'],r['door']) for r in rooms if r['kind']=='place'])
