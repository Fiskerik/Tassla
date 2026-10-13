import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const { homeGreetingAt } = await import('../src/features/home/home-greeting.ts');
hook.deregister();

test('Home greeting follows local time with neutral fallback', () => {
  const localDateAt = (hour) => new Date(2026, 9, 13, hour, 0, 0);
  assert.equal(homeGreetingAt(localDateAt(5)), 'God morgon!');
  assert.equal(homeGreetingAt(localDateAt(10)), 'God morgon!');
  assert.equal(homeGreetingAt(localDateAt(11)), 'Hej!');
  assert.equal(homeGreetingAt(localDateAt(17)), 'Hej!');
  assert.equal(homeGreetingAt(localDateAt(18)), 'God kväll!');
  assert.equal(homeGreetingAt(localDateAt(21)), 'God kväll!');
  assert.equal(homeGreetingAt(localDateAt(22)), 'Hej!');
  assert.equal(homeGreetingAt(new Date(Number.NaN)), 'Hej!');
});
