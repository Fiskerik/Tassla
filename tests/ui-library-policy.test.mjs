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
  const tokenSource = readFileSync(path.join(root, 'src/theme/tokens.ts'), 'utf8');
  for (const category of ['pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water', 'training', 'vaccination', 'deworming', 'veterinary']) {
    assert.match(icons, new RegExp(`\\b${category}:`));
  }
  assert.match(icons, /deworming:\s*'medical-outline'/);
  assert.match(tokenSource, /pee: \{ fg: primitives\.amber700, bg: primitives\.amber100 \}/);
  assert.match(tokenSource, /food: \{ fg: primitives\.green700, bg: primitives\.green100 \}/);
  assert.match(source('IconChip.tsx'), /import Svg, \{ Path \} from 'react-native-svg'/);
  assert.match(source('IconChip.tsx'), /const peeDropPaths = \[/);
  assert.match(source('IconChip.tsx'), /peeDropPaths\.map\(\(path, index\) => <Path/);
  assert.doesNotMatch(source('IconChip.tsx'), /peeDrop(?:Top|Left|Right)|rotate\(45deg\)/);
  assert.match(source('IconChip.tsx'), /decorativeLogPee = category === 'pee' && variant === 'rev02-log'/);
  assert.match(source('IconChip.tsx'), /accessibilityElementsHidden=\{decorativeLogPee\}/);
  assert.match(source('PoopIcon.tsx'), /accessibilityElementsHidden/);
  const gallery = ['ComponentGalleryScreen.tsx', 'Toast.tsx', 'EmptyState.tsx', 'Field.tsx', 'Dialog.tsx', 'BottomSheet.tsx'].map(source).join('\n');
  for (const phrase of ['Loggat', 'Ångra', 'Kunde inte spara', 'Försök igen', 'Påminnelsen är avstängd', 'Inget här än', 'Lägg till den första händelsen', 'Kontrollera datumet', 'Radera händelsen?', 'Det går inte att ångra.', 'Dela som PDF']) {
    assert.ok(gallery.includes(phrase), `missing approved Swedish example: ${phrase}`);
  }
  const propsCopy = [...gallery.matchAll(/(?:title|label|message|placeholder|help|error)=['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const textCopy = [...gallery.matchAll(/>([^<{]+)</g)].map((match) => match[1].trim()).filter(Boolean);
  assert.doesNotMatch([...propsCopy, ...textCopy].join(' '), /server|synkronisera|backend|databas|request|cache|token|endpoint|underlag|registreringar/i);
});

test('checklist themed icons use the Log palette and keep one 20pt glyph on a 32pt roundel', () => {
  const themed = source('ThemedIcon.tsx');
  const checklist = readFileSync(path.join(root, 'src/features/checklists/checklist-icons.ts'), 'utf8');
  assert.match(themed, /const neutralColor = \{ fg: tokens\.colors\.textPrimary, bg: tokens\.colors\.selectedSurface \}/);
  assert.match(themed, /tone === 'neutral' \? neutralColor : tokens\.colors\.log\.category\[tone\]/);
  assert.match(themed, /size === 'medium' \? tokens\.size\.chipMd/);
  assert.match(themed, /size === 'medium' \? tokens\.size\.iconSm/);
  assert.match(checklist, /paw: 'training'/);
  assert.match(checklist, /'sunny-outline': 'walk'/);
  assert.match(checklist, /'heart-outline': 'vaccination'/);
  assert.match(checklist, /'brush-outline': 'veterinary'/);
  assert.match(checklist, /'flower-outline': 'sleep'/);
  assert.match(checklist, /'list-outline': 'neutral'/);
});

test('AppBar screen-title sizing is opt-in and reads the shared title token', () => {
  const appBar = source('AppBar.tsx');
  const tokenSource = readFileSync(path.join(root, 'src/theme/tokens.ts'), 'utf8');
  assert.match(appBar, /titleVariant = 'default'/);
  assert.match(appBar, /titleVariant === 'screen' && styles\.screenTitle/);
  assert.match(appBar, /screenTitle: \{ \.\.\.tokens\.typography\.screenTitle \}/);
  assert.match(appBar, /titleVariant === 'screen' && styles\.screenTitleBar/);
  assert.match(appBar, /screenTitleBar: \{ marginBottom: 0 \}/);
  assert.match(tokenSource, /screenTitle: \{[\s\S]*?fontSize: 24, lineHeight: 30, fontWeight: '700'/);
});

test('index exports the requested shared component families', () => {
  const index = readFileSync(path.join(uiDir, 'index.ts'), 'utf8');
  for (const component of ['Button', 'AppBar', 'Tabs', 'ListRow', 'Card', 'HeroCard', 'QuickLogTile', 'DailyActivityItem', 'DestinationTile', 'ChecklistItem', 'Progress', 'Toast', 'IconChip', 'Field', 'CheckboxCard', 'Dialog', 'BottomSheet', 'EmptyState', 'SectionHeader', 'StatusBadge']) {
    assert.match(index, new RegExp(`export \\{ .*${component}`));
  }
});

test('Home activity and destination components keep independent accessible actions', () => {
  const daily = source('DailyActivityItem.tsx');
  const destination = source('DestinationTile.tsx');
  const gallery = source('ComponentGalleryScreen.tsx');
  assert.match(daily, /accessibilityRole="checkbox"[\s\S]*?accessibilityState=\{\{ checked: completed/);
  assert.match(daily, /accessibilityRole="button" accessibilityLabel=\{`Visa detaljer:/);
  assert.match(daily, /minHeight: tokens\.size\.touchMin/);
  for (const icon of ["'paw-outline'", "'school-outline'", "'book-outline'"]) {
    assert.ok(destination.includes(icon), `missing destination icon ${icon}`);
  }
  assert.match(gallery, /<DailyActivityItem/);
  assert.match(gallery, /<DestinationTile destination="log"/);
  assert.match(gallery, /<DestinationTile destination="training"/);
  assert.match(gallery, /<DestinationTile destination="knowledge"/);
});

test('vision variants are opt-in and leave shared component defaults on their original styles', () => {
  const card = source('Card.tsx');
  const daily = source('DailyActivityItem.tsx');
  const destination = source('DestinationTile.tsx');
  const gallery = source('ComponentGalleryScreen.tsx');
  assert.match(card, /variant = 'default'/);
  assert.match(card, /variant === 'home' \? styles\.homeCard : styles\.card/);
  assert.match(daily, /if \(props\.variant === 'home'\) return <HomeDailyActivityItem/);
  assert.match(daily, /variant\?: 'default' \| 'home'/);
  assert.match(destination, /variant = 'default'/);
  assert.match(destination, /variant === 'home' \? homeItem\.surface : item\.background/);
  assert.match(gallery, /<Card variant="home"/);
  assert.match(gallery, /<DailyActivityItem variant="home"/);
  assert.match(gallery, /<DestinationTile destination="log" compact variant="home"/);
  const listRow = source('ListRow.tsx');
  assert.match(listRow, /iconVariant\?: IconChipVariant/);
  assert.match(listRow, /const rowIconVariant = isLogTimeline \? 'rev02-log' : iconVariant/);
});

test('Button stretches every non-icon variant and keeps icon controls square at touch minimum', () => {
  const button = source('Button.tsx');
  assert.doesNotMatch(button, /\bfullWidth\b/, 'fullWidth is not part of the public component API');
  assert.match(button, /button:\s*\{[^}]*alignSelf:\s*'stretch'/, 'the base control stretches to its parent width');
  assert.match(button, /icon:\s*\{[^}]*width:\s*tokens\.size\.touchMin[^}]*height:\s*tokens\.size\.touchMin/, 'icon control is exactly 44 by 44');
});
