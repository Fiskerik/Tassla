import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const uiDir = path.join(root, 'src/components/ui');
const source = (file) => readFileSync(path.join(uiDir, file), 'utf8');

test('shared tokens retain the legacy theme while exposing the design foundations', () => {
  const tokenSource = readFileSync(path.join(root, 'src/theme/tokens.ts'), 'utf8');
  for (const required of ['#186A4D', 'background:', 'primary:', 'categoryColors', 'xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32', 'touchMin: 44', 'buttonHeight: 56', 'display: typography.title']) {
    assert.ok(tokenSource.includes(required), `missing token contract: ${required}`);
  }
  assert.match(tokenSource, /theme\s*=\s*\{[\s\S]*?spacing:\s*\{ small: 8, medium: 16, large: 24 \}/);
  assert.match(tokenSource, /type:\s*\{ body: 16, heading: 28, label: 14 \}/);
});

test('shared component source uses tokens and contains no local hex or font-size literals', () => {
  const files = readdirSync(uiDir).filter((file) => file.endsWith('.tsx'));
  assert.ok(files.length >= 18, 'all shared component files are present');
  for (const file of files) {
    const text = source(file);
    assert.doesNotMatch(text, /#[\da-f]{3,8}\b/i, `${file} contains a hard-coded color`);
    assert.doesNotMatch(text, /fontSize\s*:\s*\d+/, `${file} contains a hard-coded font size`);
  }
});

test('category identity and accessible example copy are centrally defined', () => {
  const icons = source('IconChip.tsx');
  for (const category of ['pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water', 'training', 'vaccination', 'deworming', 'veterinary']) {
    assert.match(icons, new RegExp(`\\b${category}:`));
  }
  assert.match(icons, /deworming:\s*'medical-outline'/);
  assert.match(source('PoopIcon.tsx'), /accessibilityElementsHidden/);
  const gallery = ['ComponentGalleryScreen.tsx', 'Toast.tsx', 'EmptyState.tsx', 'Field.tsx', 'Dialog.tsx', 'BottomSheet.tsx'].map(source).join('\n');
  for (const phrase of ['Loggat', 'Ångra', 'Kunde inte spara', 'Försök igen', 'Påminnelsen är avstängd', 'Inget här än', 'Lägg till den första händelsen', 'Kontrollera datumet', 'Radera händelsen?', 'Det går inte att ångra.', 'Dela som PDF']) {
    assert.ok(gallery.includes(phrase), `missing approved Swedish example: ${phrase}`);
  }
  const propsCopy = [...gallery.matchAll(/(?:title|label|message|placeholder|help|error)=['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const textCopy = [...gallery.matchAll(/>([^<{]+)</g)].map((match) => match[1].trim()).filter(Boolean);
  assert.doesNotMatch([...propsCopy, ...textCopy].join(' '), /server|synkronisera|backend|databas|request|cache|token|endpoint|underlag|registreringar/i);
});

test('index exports the requested shared component families', () => {
  const index = readFileSync(path.join(uiDir, 'index.ts'), 'utf8');
  for (const component of ['Button', 'AppBar', 'Tabs', 'ListRow', 'Card', 'HeroCard', 'QuickLogTile', 'ChecklistItem', 'Progress', 'Toast', 'IconChip', 'Field', 'CheckboxCard', 'Dialog', 'BottomSheet', 'EmptyState', 'SectionHeader', 'StatusBadge']) {
    assert.match(index, new RegExp(`export \\{ .*${component}`));
  }
});

test('Button stretches every non-icon variant and keeps icon controls square at touch minimum', () => {
  const button = source('Button.tsx');
  assert.doesNotMatch(button, /\bfullWidth\b/, 'fullWidth is not part of the public component API');
  assert.match(button, /button:\s*\{[^}]*alignSelf:\s*'stretch'/, 'the base control stretches to its parent width');
  assert.match(button, /icon:\s*\{[^}]*width:\s*tokens\.size\.touchMin[^}]*height:\s*tokens\.size\.touchMin/, 'icon control is exactly 44 by 44');
});
