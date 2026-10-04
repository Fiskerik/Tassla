import copy
import importlib.util
spec=importlib.util.spec_from_file_location('dev_flow','tools/dev_flow.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def task(key,paths,deps=None):
    return dict(id=key,title=key,status='planned',mvp_requirement='MVP onboarding',plan='plan-v1.md',write_paths=paths,acceptance=['works'],checks=['test'],depends_on=deps or [])
data=dict(segment='test',segment_approved_by_erik=False,tasks=[task('A',['app/a']),task('B',['app/b'],['A'])])
def reject(fn):
    try: fn()
    except ValueError: return
    raise AssertionError('Gate accepted invalid transition')
reject(lambda:m.transition(copy.deepcopy(data),'A','implementing','implementer','attempt'))
m.transition(data,'A','ready','architect','APPROVE v1')
reject(lambda:m.transition(copy.deepcopy(data),'A','implementing','implementer','start'))
data['segment_approved_by_erik']=True
m.transition(data,'B','ready','architect','APPROVE v1')
reject(lambda:m.transition(copy.deepcopy(data),'B','implementing','implementer','start'))
for target,actor in [('implementing','implementer'),('qa','implementer'),('review','qa'),('done','reviewer')]: m.transition(data,'A',target,actor,'Actual evidence')
m.transition(data,'B','implementing','implementer','start after A')
overlap=dict(segment='x',segment_approved_by_erik=True,tasks=[task('A',['app']),task('B',['app/a'])])
for t in overlap['tasks']:t['status']='implementing'
reject(lambda:m.validate(overlap))
three=dict(segment='x',segment_approved_by_erik=True,tasks=[task(str(i),[f'app/{i}']) for i in range(3)])
for t in three['tasks']:t['status']='implementing'
reject(lambda:m.validate(three))
print('PASS: mandatory pre-review, Erik gate, dependencies, ordered QA/review, ownership and concurrency caps')
