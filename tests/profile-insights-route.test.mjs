import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const navigation = await import('../src/features/home/main-navigation.ts');
hooks.deregister();

const ready = {
  dogProfileDirty: false, kennelDraftDirty: false, profileBusy: false, profilePending: false,
  profileConflict: false, attributionBusy: false, attributionWriteUnresolved: false, attributionReady: true,
};

test('Dog Profile Insights action enables only after profile and kennel sources are settled', () => {
  assert.equal(navigation.profileInsightsDisabledReason(ready), null);
  const cases = [
    [{ dogProfileDirty: true }, 'Spara eller ändra tillbaka profiluppgifterna för att öppna Insikter.'],
    [{ kennelDraftDirty: true }, 'Kontrollera kenneländringen innan du öppnar Insikter.'],
    [{ profileBusy: true }, 'Kontrollera profiländringen innan du öppnar Insikter.'],
    [{ profilePending: true }, 'Kontrollera profiländringen innan du öppnar Insikter.'],
    [{ profileConflict: true }, 'Kontrollera profiländringen innan du öppnar Insikter.'],
    [{ attributionBusy: true }, 'Kontrollera kenneländringen innan du öppnar Insikter.'],
    [{ attributionWriteUnresolved: true }, 'Kontrollera kenneländringen innan du öppnar Insikter.'],
    [{ attributionReady: false }, 'Kontrollera kennelkopplingen innan du öppnar Insikter.'],
  ];
  for (const [changes, expected] of cases) assert.equal(navigation.profileInsightsDisabledReason({ ...ready, ...changes }), expected);
});

test('dirty profile and kennel context has the expected status priority', () => {
  assert.equal(navigation.profileInsightsDisabledReason({ ...ready, dogProfileDirty: true, kennelDraftDirty: true }), 'Spara eller ändra tillbaka profiluppgifterna för att öppna Insikter.');
  assert.equal(navigation.profileInsightsDisabledReason({ ...ready, profilePending: true, attributionWriteUnresolved: true }), 'Kontrollera profiländringen innan du öppnar Insikter.');
});
