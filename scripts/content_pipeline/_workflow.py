from __future__ import annotations
import hashlib, json, os, re, tempfile
from pathlib import Path
from datetime import datetime, timezone
try:
    import yaml
except ImportError:
    yaml = None

def sha256(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def atomic(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix='._', text=True)
    try:
        with os.fdopen(fd,'w',encoding='utf8') as f: f.write(text); f.flush(); os.fsync(f.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def parse(path: Path):
    text=path.read_text(encoding='utf8')
    m=re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$',text,re.S)
    if not m: raise ValueError('MISSING_FRONTMATTER')
    if yaml: data=yaml.safe_load(m.group(1)) or {}
    else:
        data={}
        for line in m.group(1).splitlines():
            if ':' in line: k,v=line.split(':',1); data[k.strip()]=v.strip()
    if not isinstance(data,dict): raise ValueError('INVALID_FRONTMATTER')
    return data,m.group(2),text

def dump(data, body):
    if yaml: front=yaml.safe_dump(data, sort_keys=False, default_flow_style=False).strip()
    else: front='\n'.join(f'{k}: {json.dumps(v)}' for k,v in data.items())
    return f'---\n{front}\n---\n{body.lstrip()}'.rstrip()+'\n'

def json_sidecar(path): return path.with_suffix('.json')
def now(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
def emit(payload): print(json.dumps(payload, indent=2, sort_keys=True))
