import sys
from types import ModuleType, SimpleNamespace
fake = ModuleType('agents')
class Agent:
    def __init__(self, **kwargs): self.__dict__.update(kwargs)
fake.Agent = Agent
fake.ModelSettings = fake.RunConfig = lambda **kwargs: kwargs
calls = []
class Runner:
    plan = None
    stop = False
    @staticmethod
    def run_sync(agent, *args, **kwargs):
        calls.append(agent.name)
        if 'routing' in agent.name:
            output = Runner.plan
        elif agent.name == 'Customer/Product Critic':
            output = SimpleNamespace(assessment='Ingen anledning till STOP' if not Runner.stop else 'Risk', verdict='STOP' if Runner.stop else 'PROCEED')
        else: output = 'Rådgivning'
        return SimpleNamespace(final_output=output, context_wrapper=SimpleNamespace(usage=SimpleNamespace(requests=1,input_tokens=1,output_tokens=1)))
fake.Runner = Runner
sys.modules['agents'] = fake
from tassla_team.chief_of_staff import RoutingPlan, TeamRequest, run_question, validate_plan
Runner.plan = RoutingPlan(requests=[TeamRequest(team='commercial',reason='Economics',roles=['commercial_analyst'])], direct_answer='')
result = run_question('Revenue?', 'fake')
assert calls == ['AI Chief of Staff: routing', 'Commercial Analyst', 'Commercial Lead', 'AI Chief of Staff'], calls
calls.clear()
Runner.plan = RoutingPlan(requests=[TeamRequest(team='product',reason='Review',roles=['growth','critic'])], direct_answer='')
result = run_question('Breeder distribution?', 'fake')
assert calls.index('Head of Product: draft') < calls.index('Customer/Product Critic') < calls.index('Head of Product')
assert result.answer == 'Rådgivning'
calls.clear()
Runner.stop = True
result = run_question('Review?', 'fake')
assert 'STOP' in result.answer and 'AI Chief of Staff' not in calls
try:
    validate_plan(RoutingPlan(requests=[TeamRequest(team='commercial',reason='bad',roles=['qa'])], direct_answer=''))
    raise AssertionError('Wrong-team specialist accepted')
except ValueError: pass
calls.clear()
Runner.plan = RoutingPlan(requests=[], direct_answer='Hej')
result = run_question('Hej', 'fake')
assert len(calls) == 1 and result.answer == 'Hej'
print('Offline checks passed: selective dispatch, hierarchy, draft/review order, STOP, invalid role rejection, direct reply.')
