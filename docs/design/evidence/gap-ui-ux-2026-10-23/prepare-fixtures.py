"""Prepare audit-only fixtures in an isolated checkout of main eea0984."""
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
source = (root / 'tools/visual-check/app.tsx').read_text()
options = "[{id:'golden',name:'Golden retriever'},...Array.from({length:23},(_,i)=>({id:'synthetic-breed-'+i,name:'Exempelras '+String(i+1).padStart(2,'0')}))]"
replacements = [
    ("data:[{id:'golden',name:'Golden retriever'}]", 'data:' + options),
    ("table==='breeds'?[{id:'golden',name:'Golden retriever'}]:[]", "table==='breeds'?" + options + ':[]'),
    ("contentType:'checklist'},...(process.env", "contentType:'checklist'},...(new URLSearchParams(location.search).get('knowledgeImages')==='assigned'?[{id:'guide4',title:'Inför veterinärbesöket',body:'Syntetisk ingress för granskning av ett tredje guidkort.',contentType:'guide'}]:[]),...(process.env"),
    ('contentId:x.id,sources:', "contentId:new URLSearchParams(location.search).get('knowledgeImages')==='assigned'?({'guide1':'61000000-0000-4000-8000-000000000002','guide2':'61000000-0000-4000-8000-000000000004','guide4':'61000000-0000-4000-8000-000000000008'}[x.id]??x.id):x.id,sources:"),
]
for before, after in replacements:
    if source.count(before) != 1:
        raise SystemExit('Unexpected fixture source; check that the checkout is eea0984: ' + before[:70])
    source = source.replace(before, after)
target = root / 'tools/visual-check/gap-audit-app.tsx'
target.write_text(source)
print(target)
