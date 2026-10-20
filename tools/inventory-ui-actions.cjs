const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/design/UI-ACTION-INVENTORY-2026-10-18');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.[jt]sx?$/.test(entry.name)) files.push(full);
  }
}
walk(path.join(root, 'app')); walk(path.join(root, 'src'));
const rows = [];
const errors = [];
const events = /^(onPress|onLongPress|onBack|onValueChange|onAction|onOpen|onClose|onConfirm|onUndo|onRetry|onCancel|onPrimaryAction|onRequestClose|onDismiss|onSelect|onToggle|onChange|onEdit|onDelete|onSelectDog|onAddDog|onSubmitEditing)$/;
const interactionContainers = /Screen$|ScreenView$|Workspace$|Provider$|AppFlow$|MainSwipeNavigation$|HorizontalGestureRegion$/;
const compact = value => value.replace(/\s+/g, ' ').trim();
function properties(node, source) {
  const result = {};
  for (const prop of node.properties ?? []) {
    if (ts.isJsxAttribute(prop)) result[prop.name.getText(source)] = prop.initializer ? compact(prop.initializer.getText(source)) : 'true';
    else if (ts.isPropertyAssignment(prop)) result[prop.name.getText(source).replace(/['"]/g, '')] = compact(prop.initializer.getText(source));
  }
  return result;
}
function policy(tag, attrs, text, file, icons) {
  const label = `${attrs.label ?? ''} ${attrs.title ?? ''} ${attrs.accessibilityLabel ?? ''} ${text}`;
  if (['Pressable', 'MotionPressable', 'AnimatedPressable'].includes(tag) && /backdrop|dismissArea/.test(attrs.style ?? '')) return ['Osynlig stängyta', '', 'Kompletterande stängväg; synligt kryss måste finnas separat.'];
  if (tag === 'Systemyta') return ['Systemtext', '', 'Systemets webbläsare, behörighetsdialog eller delningspanel; behåll begriplig text i appens ingång.'];
  if (tag === 'Alert-knapp') return ['Text', '', 'Native dialog: tydlig åtgärd och konsekvens; behåll också Avbryt.'];
  if (tag === 'BottomSheet' || tag === 'Dialog') return ['Blandat', 'close', 'Stängkryss kan vara ikon; primär- och bekräftelseknappar behåller text.'];
  if (tag === 'Toast') return ['Blandat', 'return-up-back-outline', 'Ångra kan vara ikon; Försök igen och Avbryt vid fel behåller text.'];
  if (/DatePickerField/.test(tag)) return ['Text + ikon', 'calendar-outline', 'Behåll datumfältets etikett/värde; byt endast kalenderknappen till ikon.'];
  if (/TimePickerField/.test(tag)) return ['Text + ikon', 'time-outline', 'Behåll tidsetikett/värde; byt endast öppningsknappen till ikon.'];
  if (/ActionMenu/.test(file) && tag === 'Pressable' && attrs.accessibilityRole === '"menuitem"') return ['Text', '', 'Menyval behöver synliga namn; penna/papperskorg kan komplettera.'];
  if (/Tabs|BottomNav|CheckboxCard|ChecklistItem|DailyActivityItem|DestinationTile|QuickLogTile|TypeChoice|ChoiceButton|ToggleRow|Switch/.test(tag) || /"(tab|checkbox|radio|switch)"/.test(attrs.accessibilityRole ?? '')) return ['Text + symbol', '', 'Behåll alternativets namn och synlig vald/avvald markering; symbol ensam blir tvetydig.'];
  if (/^(AppBar|SupportScreenHeader|ProfileScreenHeader|IconOnlyButton)$/.test(tag) || attrs.variant === '"icon"') return ['Ikon', attrs.iconName ?? attrs.icon ?? '', 'Behåll ikon; full svensk accessibilityLabel och verifierad 44×44-yta krävs.'];
  if (/Ångra/.test(label)) return ['Ikon', 'return-up-back-outline', 'Kontextuell återställning; separat från navigation tillbaka. Behåll tydlig accessibilityLabel.'];
  if (/Redigera|Ändra (namn|rutin|upprepning)|Ändra"/.test(label) && !/Spara|Avbryt|hämt|bekräft/i.test(label)) return ['Ikon', 'create-outline', 'Penna intill namngiven post räcker; behåll postnamnet och full accessibilityLabel.'];
  if (/accessibilityLabel/.test(Object.keys(attrs).join(' ')) && /Stäng|Avbryt tid/.test(label)) return ['Ikon', 'close', 'Kryss på panel/modal; undvik flera identiska kryss utan sammanhang.'];
  if (/från kalender|kalendern/.test(label)) return ['Ikon', 'calendar-outline', 'Byt öppningsknappens text till kalenderikon; behåll fältetikett och datumvärde.'];
  if (/från tider/.test(label)) return ['Ikon', 'time-outline', 'Byt öppningsknappens text till klocka; behåll fältetikett och tidsvärde.'];
  if (/Visa (föregående|nästa)|^"Föregående"|^"Nästa"/.test(label.trim())) return ['Ikon', /nästa|Nästa/.test(label) ? 'chevron-forward' : 'chevron-back', 'Tydlig periodnavigation intill datumrubrik; tillgängligt namn anger riktning.'];
  if (['Pressable', 'MotionPressable', 'AnimatedPressable'].includes(tag) && !text && icons) return ['Ikon', icons, 'Befintlig symbolkontroll; behåll ikon med full kontextetikett och 44 pt.'];
  if (/^DestructiveButton$|^PrimaryButton$/.test(tag) || /Spara|Radera|Ta bort|Försök|Kontrollera|Logga ut|Fortsätt|Bekräfta|Avbryt|Börja om/.test(label)) return ['Text', '', 'Handlingens betydelse/konsekvens eller spar-/felläge behöver synlig text.'];
  if (['Pressable', 'MotionPressable', 'AnimatedPressable'].includes(tag) && /backdrop|dismissArea/.test(attrs.style ?? '')) return ['Osynlig stängyta', '', 'Behåll som kompletterande stängväg; synligt kryss krävs också.'];
  if (/^IconOnlyButton$/.test(tag)) return ['Ikon', attrs.icon ?? '', 'Behåll befintlig kontextuell ikon och tillgängligt namn.'];
  if (file.includes('/components/') && /^(Button|MotionPressable|Pressable|AnimatedPressable)$/.test(tag) && /^[{](label|title|accessibilityLabel|action.label)/.test(attrs.label ?? attrs.accessibilityLabel ?? '')) return ['Styrs av anrop', '', 'Delad renderer: behåll text som standard; explicit ikonvariant vid godkända anrop.'];
  return ['Text', '', 'Behåll titel/namn för begriplighet; dekorativ ikon kan komplettera. Ingen generell ikonkonvertering.'];
}
function add(source, file, node, tag, attrs, text = '', icons = '') {
  const pos = source.getLineAndCharacterOfPosition(node.getStart(source));
  const [decision, proposal, reason] = policy(tag, attrs, text, file, icons);
  const inferredLabel = attrs.actionLabel ?? attrs.label ?? attrs.title ?? attrs.text ?? (text || 'Dynamiskt/ärvt; följ anrop');
  const label = attrs.accessibilityLabel ?? (tag === 'Alert-knapp' ? `Native: ${attrs.text}` : `Ärvt/förslag: ${inferredLabel}`);
  const states = Object.entries(attrs).filter(([key]) => /disabled|loading|state|checked|selected|busy/i.test(key)).map(([key, value]) => `${key}=${value}`).join('; ') || 'Ärvt; kontrollera callbackens spärrar';
  const scope = /ComponentGallery|DevelopmentPreview|PreviewHome|PreviewProfile|DraftContentPreview/.test(file) ? 'Preview/galleri' : file.includes('/components/') ? 'Delad komponent' : 'App';
  const touch = tag === 'Alert-knapp' ? 'Native systemdialog; enhetsprov krävs' : /Button|Tabs|BottomNav|ListRow|Checklist|Checkbox|QuickLog|DestinationTile|AppBar|IconOnlyButton/.test(tag) ? 'Gemensam komponent; följ dess minmått, 44 pt runtime ej verifierad' : `Följ styles: ${attrs.style ?? 'ärvd'}; runtime ej verifierad`;
  const callbacks = Object.entries(attrs).filter(([key]) => events.test(key)).map(([key, value]) => `${key}=${value}`).join('; ');
  rows.push({ file, line: pos.line + 1, component: tag, scope, visible: attrs.label ?? attrs.title ?? attrs.text ?? (text || 'Ikon/ärvd text'), accessibility: label, icon: icons || attrs.iconName || attrs.icon || '', recommendation: decision, proposedIcon: proposal, rationale: reason, target: touch, states, callbacks, dynamic: /[{]|\.map\(|\?/.test(`${label} ${icons}`) ? 'Uttryck/dynamisk grupp: följ källa, inte unikt runtimeantal' : 'Statisk kodplats' });
}
for (const filePath of files) {
  const file = path.relative(root, filePath).replaceAll('\\', '/');
  const source = ts.createSourceFile(file, fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) errors.push(...source.parseDiagnostics.map(d => `${file}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`));
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(source);
      const attrs = properties(node.attributes, source);
      const actionKeys = Object.keys(attrs).filter(key => events.test(key));
      const isField = ['DatePickerField', 'TimePickerField'].includes(tag);
      if ((actionKeys.length && !interactionContainers.test(tag) && tag !== 'Modal') || isField || tag === 'AnimatedPressable') {
        const parent = ts.isJsxOpeningElement(node) ? node.parent : node;
        const parts = []; const icons = [];
        function children(child) {
          if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const opening = ts.isJsxElement(child) ? child.openingElement : child;
            const nested = properties(opening.attributes, source);
            if (child !== parent && (Object.keys(nested).some(key => events.test(key)) || interactionContainers.test(opening.tagName.getText(source)))) return;
            if (opening.tagName.getText(source) === 'Ionicons') icons.push(nested.name ?? 'dynamisk');
            if (ts.isJsxElement(child)) child.children.forEach(children);
            return;
          }
          if (ts.isJsxOpeningElement(child) || ts.isJsxClosingElement(child) || ts.isJsxAttribute(child)) return;
          if (ts.isJsxText(child) && compact(child.text)) parts.push(compact(child.text));
          if (ts.isJsxExpression(child) && child.expression && (ts.isIdentifier(child.expression) || ts.isPropertyAccessExpression(child.expression) || ts.isTemplateExpression(child.expression))) parts.push(`{${compact(child.expression.getText(source))}}`);
          ts.forEachChild(child, children);
        }
        children(parent);
        add(source, file, node, tag, attrs, parts.join(' '), icons.join(', '));
      }
    } else if (ts.isCallExpression(node) && /(?:^|\.)(?:openURL|openSettings|shareAsync|requestPermissionsAsync)$/.test(node.expression.getText(source))) {
      const name = compact(node.expression.getText(source));
      add(source, file, node, 'Systemyta', { title: name, onAction: compact(node.getText(source)) }, 'Systemets dialog/extern yta');
    } else if (ts.isObjectLiteralExpression(node)) {
      const attrs = properties(node, source);
      if (attrs.text && (attrs.onPress || /['"](?:cancel|destructive)['"]/.test(attrs.style ?? ''))) add(source, file, node, 'Alert-knapp', attrs);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (errors.length) throw new Error(errors.join('\n'));
const fields = Object.keys(rows[0]);
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
fs.writeFileSync(`${output}.csv`, '\ufeff' + [fields.join(','), ...rows.map(row => fields.map(key => quote(row[key])).join(','))].join('\n') + '\n');
const escape = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const group = field => Object.entries(rows.reduce((counts, row) => { counts[row[field]] = (counts[row[field]] ?? 0) + 1; return counts; }, {}));
const summary = group('scope').map(([key, count]) => `- ${key}: ${count} kodplatser.`).join('\n');
const decisions = group('recommendation').map(([key, count]) => `- ${key}: ${count}.`).join('\n');
const intro = `# Knappinventering 2026-10-18\n\nReproduceras med \`node tools/inventory-ui-actions.cjs\`. Läser samtliga ${files.length} JS/TS/TSX-filer i app/ och src/, med 0 parserfel. ${rows.length} actionkodplatser. Kodplatser är varken unika knappar eller bevis på aktiverade skärmar: dynamiska listor och delade renderers räknas var för sig. Uttryck skrivs som källkod och måste följas till anropet. CSV innehåller full callback, state och style-ankare utan trunkering.\n\n${summary}\n\n## Rekommenderad visuell form\n\n${decisions}\n\nRekommendationerna är en statisk första klassificering med konservativ textstandard; se den manuella familjegranskningen i [paketplanen](../plans/UI-UX-NEXT-PACKAGES-2026-10-18.md). Varje paket granskar synlig betydelse, svensk accessibilityLabel, 44×44 pt, loading/disabled/fel/unknown och skärmläsarordning före ikonbyte. Touch-raden är källkodsspårning, aldrig ett verifierat native-PASS.\n\n## Täckning och gränser\n\nButton/PrimaryButton/QuietButton och egna helpers, Pressable/MotionPressable, klickbara kort/rader, Tabs/BottomNav, radio/checkbox/Switch, Toast/BottomSheet/Dialog, datum/tid-väljare och Alert-knappar ingår. TextInput med onSubmitEditing tas med som tangentbordsåtgärd; vanlig textinmatning/onChangeText, touch-/pan-sensorer, rent dekorativa ikoner och screen/provider-callback-delegering exkluderas. Delegerade skärmars egna renderers läses i respektive fil. Native Alert återger även Avbryt utan callback (inklusive as const). System-API:er för behörighet, delning och externa länkar registreras som Systemyta; deras egna knappar styrs av plattformen. Dynamiska planned-health action-buildern läses som objekt även utanför Alert-anropet. Ingen data från användarkonton används.\n\n## Alla actionplatser\n\n| Källa | Kontroll / scope | Synlig etikett eller uttryck | Tillgängligt namn / förslag | Ikon nu → förslag | Beslut och skäl | State / träffyta |\n|---|---|---|---|---|---|---|\n`;
const table = rows.map(row => `| [${row.file}:${row.line}](../../${row.file}#L${row.line}) | ${escape(row.component)} / ${escape(row.scope)} | ${escape(row.visible)} | ${escape(row.accessibility)} | ${escape(row.icon)} → ${escape(row.proposedIcon)} | **${row.recommendation}**: ${escape(row.rationale)} | ${escape(row.states)}; ${escape(row.target)} |`).join('\n');
fs.writeFileSync(`${output}.md`, intro + table + '\n');
console.log(JSON.stringify({ parsedFiles: files.length, parseErrors: 0, actionSites: rows.length, scopes: Object.fromEntries(group('scope')), decisions: Object.fromEntries(group('recommendation')), outputs: [`${output}.md`, `${output}.csv`] }, null, 2));
