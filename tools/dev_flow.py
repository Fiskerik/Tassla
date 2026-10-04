"""Local durable task queue; never starts models, shell commands or deployments."""
import argparse
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'docs/tasks/dev/queue.json'
STATES = {'planned','ready','implementing','qa','review','done','blocked'}

def normalized_path(value):
    path=value.replace('\\','/').rstrip('/')
    if (not path or path.startswith('/') or ':' in path or any(c in path for c in '*?[]')
        or any(part in {'','..','.'} for part in path.split('/'))):
        raise ValueError('Write paths must be explicit relative paths without traversal or glob patterns')
    return path.lower()

def validate(data):
    tasks = data['tasks']
    ids = {t['id'] for t in tasks}
    if len(ids) != len(tasks): raise ValueError('Duplicate task IDs')
    active = [t for t in tasks if t['status'] in {'implementing','qa','review'}]
    if len(active) > 2: raise ValueError('Maximum two active subtasks')
    for task in tasks:
        if task['status'] not in STATES: raise ValueError('Unknown status')
        if not set(task['depends_on']).issubset(ids): raise ValueError('Unknown dependency')
        if task['id'] in task['depends_on']: raise ValueError('Self dependency')
        for path in task['write_paths']: normalized_path(path)
        if task['status'] in {'ready','implementing','qa','review','done'}:
            if not all(task.get(k) for k in ['mvp_requirement','plan','write_paths','acceptance','checks']):
                raise ValueError('Ready/active/completed tasks require a complete contract')
    def visit(key, path):
        if key in path: raise ValueError('Dependency cycle')
        for dep in next(t for t in tasks if t['id']==key)['depends_on']: visit(dep, path | {key})
    for key in ids: visit(key, set())
    for index, task in enumerate(active):
        for other in active[index+1:]:
            for left in task['write_paths']:
                for right in other['write_paths']:
                    a,b=normalized_path(left),normalized_path(right)
                    if a==b or a.startswith(b+'/') or b.startswith(a+'/'): raise ValueError('Overlapping write ownership')

def load():
    data=json.loads(STATE.read_text(encoding='utf-8-sig'))
    validate(data)
    return data

def save(data):
    validate(data)
    temporary=STATE.with_suffix('.tmp')
    temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    os.replace(temporary,STATE)

def transition(data, key, target, actor, evidence):
    task=next((t for t in data['tasks'] if t['id']==key),None)
    if task is None: raise ValueError('Unknown task')
    if not evidence.strip(): raise ValueError('Evidence/checkpoint required')
    current=task['status']
    gates={('planned','ready'):'architect',('ready','implementing'):'implementer',
           ('implementing','qa'):'implementer',('qa','review'):'qa',('review','done'):'reviewer'}
    if target=='blocked': pass
    elif current=='blocked' and target=='planned':
        if actor!='coordinator': raise ValueError('Coordinator must replan blocked task')
    elif (current,target) not in gates or actor!=gates[(current,target)]:
        raise ValueError('Invalid transition or reviewer role')
    if target=='ready':
        if not all(task.get(k) for k in ['mvp_requirement','plan','write_paths','acceptance','checks']):
            raise ValueError('Task contract incomplete')
    if target=='implementing':
        if not data['segment_approved_by_erik']: raise ValueError('Segment lacks Erik approval')
        done={t['id'] for t in data['tasks'] if t['status']=='done'}
        if not set(task['depends_on']).issubset(done): raise ValueError('Dependencies not done')
    if target=='review' and not task.get('checks'): raise ValueError('Checks not defined')
    task['status']=target
    task.setdefault('history',[]).append({'from':current,'to':target,'actor':actor,'evidence':evidence})
    task['next_step']=evidence
    validate(data)

def main():
    parser=argparse.ArgumentParser(description='Tassla durable development queue')
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('status')
    sub.add_parser('validate')
    move=sub.add_parser('transition')
    move.add_argument('task')
    move.add_argument('target',choices=sorted(STATES))
    move.add_argument('--actor',required=True,choices=['architect','implementer','qa','reviewer','coordinator'])
    move.add_argument('--evidence',required=True,help='Actual review/check result and next step; never invent approval')
    args=parser.parse_args()
    try:
        data=load()
        if args.command=='transition':
            transition(data,args.task,args.target,args.actor,args.evidence)
            save(data)
        print('Segment:',data['segment'],'Erik approval:',data['segment_approved_by_erik'])
        for task in data['tasks']: print(task['id'],task['status'],task['title'])
    except (ValueError,KeyError,StopIteration) as error:
        parser.exit(1,str(error)+'\n')

if __name__=='__main__': main()
