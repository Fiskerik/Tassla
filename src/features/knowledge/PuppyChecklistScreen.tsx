import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppBar, Button, Card, ChecklistItem, Field, IconChip, Progress, SectionHeader, Toast } from '../../components/ui';
import { CHECKLIST_TEMPLATES } from './checklist-content';
import { addChecklistCustomItem, deleteChecklistCustomItem, fetchChecklistOverview, fetchChecklistState, setChecklistItem, setChecklistPreference, updateChecklistCustomItem } from './checklist-data';
import { checklistPercent, chooseChecklistPhase, normalizeCustomChecklistTitle, type ChecklistContext, type ChecklistCustomItem, type ChecklistTemplate } from './checklist-model';
import { classifyPendingChecklistOperation, freezePendingChecklistMemory, type PendingChecklistMemory, type PendingChecklistOperation } from './checklist-intent';
import { tokens } from '../../theme/tokens';

type LoadState = 'loading' | 'ready' | 'error';
const CONTEXTS: { id: ChecklistContext; title: string }[] = [
  { id: 'before_homecoming', title: 'Före hemkomst' },
  { id: 'first_days', title: 'Första dagarna hemma' },
  { id: 'by_age', title: 'Efter ålder' },
];
function sameCustom(left: ChecklistCustomItem, right: ChecklistCustomItem) {
  return left.id === right.id && left.dogId === right.dogId && left.templateId === right.templateId && left.title === right.title && left.completed === right.completed;
}

export function PuppyChecklistScreen({ client, dogId, ageWeeks, onBack, registerInvalidate, active = true, pendingState = null, onPendingStateChange, onDetailChange }: { client: SupabaseClient; dogId: string; ageWeeks: number; onBack: () => void; registerInvalidate?: (invalidate: (() => void) | null) => void; active?: boolean; pendingState?: PendingChecklistMemory | null; onPendingStateChange?: (state: PendingChecklistMemory | null) => void; onDetailChange?: (open: boolean) => void }) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<ChecklistCustomItem[]>([]);
  const [summaries, setSummaries] = useState<Record<string, { done: number; total: number }>>({});
  const [uncertain, setUncertain] = useState(pendingState?.uncertain ?? false);
  const [pendingOperation, setPendingOperation] = useState<PendingChecklistOperation | null>(pendingState?.operation ?? null);
  const [reviewInfoOpen, setReviewInfoOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [context, setContext] = useState<ChecklistContext>('by_age');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(pendingState?.uncertain ? 'Det gick inte att kontrollera om ändringen sparades.' : '');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'uncertain'>(pendingState?.uncertain ? 'uncertain' : 'error');
  const [form, setForm] = useState<{ id: string | null; requestId: string; title: string; completed: boolean } | null>(pendingState?.draft ?? null);
  const formRef = useRef(form);
  const pendingChangeRef = useRef(onPendingStateChange);
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { pendingChangeRef.current = onPendingStateChange; }, [onPendingStateChange]);
  const pending = useRef(false);
  const writeIntent = useRef<PendingChecklistOperation | null>(pendingState?.operation ?? null);
  const controllerRef = useRef<AbortController | null>(null);
  const writeControllerRef = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const templates = CHECKLIST_TEMPLATES;
  const activeTemplate = templates.find((item) => item.id === templateId) ?? null;
  const reviewEnabled = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';

  const invalidateCurrentView = useCallback(() => {
    if (pending.current && writeIntent.current) {
      const operation = writeIntent.current;
      const draft = form;
      onPendingStateChange?.(freezePendingChecklistMemory(operation, draft));
      setPendingOperation(operation); setUncertain(true); setMessage('Det gick inte att kontrollera om ändringen sparades.'); setMessageTone('uncertain');
    }
    generation.current += 1;
    pending.current = false;
    controllerRef.current?.abort();
    writeControllerRef.current?.abort();
    setBusy(false);
  }, [form, onPendingStateChange]);

  function rememberWrite(operation: PendingChecklistOperation) {
    writeIntent.current = operation;
  }
  function markUnknown(operation: PendingChecklistOperation) {
    writeIntent.current = operation;
    onPendingStateChange?.(freezePendingChecklistMemory(operation, form));
    setPendingOperation(operation); setUncertain(true);
  }
  function resolveWrite() {
    writeIntent.current = null;
    onPendingStateChange?.(null);
    setPendingOperation(null); setUncertain(false);
  }

  const load = useCallback(async (selectedId: string | null, withSpinner = true): Promise<boolean> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (withSpinner) setState('loading');
    setBusy(false);
    try {
      const [overview, loaded] = await Promise.all([
        fetchChecklistOverview(client, dogId, controller.signal),
        selectedId ? fetchChecklistState(client, dogId, selectedId, controller.signal) : Promise.resolve(null),
      ]);
      if (controller.signal.aborted) return false;
      setSummaries(overview.summary);
      setContext(overview.preference?.context ?? 'by_age');
      if (loaded) {
        setProgress(new Set(loaded.progress.map((row) => row.itemKey)));
        setCustomItems(loaded.customItems);
      }
      setState('ready');
      return true;
    } catch {
      if (controller.signal.aborted) return false;
      setState('error');
      setMessage('Listan kunde inte läsas in. Försök igen.');
      setMessageTone('error');
      return false;
    }
  }, [client, dogId]);

  useEffect(() => {
    const scope = ++generation.current;
    writeControllerRef.current?.abort();
    pending.current = false;
    const timer = setTimeout(() => {
      if (reviewEnabled && active) void load(templateId);
      else setState('ready');
    }, 0);
    return () => {
      clearTimeout(timer);
      if (pending.current && writeIntent.current) {
        pendingChangeRef.current?.(freezePendingChecklistMemory(writeIntent.current, formRef.current));
      }
      if (generation.current === scope) generation.current += 1;
      controllerRef.current?.abort();
      writeControllerRef.current?.abort();
    };
  }, [active, client, dogId, load, reviewEnabled, templateId]);

  useEffect(() => {
    registerInvalidate?.(invalidateCurrentView);
    return () => registerInvalidate?.(null);
  }, [invalidateCurrentView, registerInvalidate]);

  useEffect(() => { onDetailChange?.(Boolean(templateId)); }, [onDetailChange, templateId]);

  const total = activeTemplate ? summaries[activeTemplate.id]?.total ?? activeTemplate.items.length + customItems.length : 0;
  const done = activeTemplate ? summaries[activeTemplate.id]?.done ?? (activeTemplate.items.filter((item) => progress.has(item.key)).length + customItems.filter((item) => item.completed).length) : 0;
  const recommended = chooseChecklistPhase(ageWeeks, context);
  const percentage = checklistPercent(done, total);
  function leaveChecklist() {
    invalidateCurrentView();
    if (templateId) { setTemplateId(null); setForm(null); if (!uncertain) setMessage(''); }
    else onBack();
  }

  function openTemplate(template: ChecklistTemplate) {
    invalidateCurrentView();
    setState('loading'); setProgress(new Set()); setCustomItems([]);
    setForm(null); setFormError(''); if (!uncertain) setMessage(''); setTemplateId(template.id);
  }

  async function chooseContext(next: ChecklistContext) {
    if (!reviewEnabled || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    pending.current = true; setBusy(true); setMessage('');
    const operation: PendingChecklistOperation = { kind: 'preference', context: next };
    rememberWrite(operation);
    try {
      const result = await setChecklistPreference(client, dogId, next, controller.signal);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') { resolveWrite(); setContext(next); setMessage('Valet är sparat.'); setMessageTone('success'); }
      else if (result.status === 'unknown') { markUnknown(operation); setMessage('Det gick inte att kontrollera om valet sparades.'); setMessageTone('uncertain'); }
      else { resolveWrite(); setMessage('Kunde inte spara valet. Försök igen.'); setMessageTone('error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  async function togglePreset(key: string) {
    if (!reviewEnabled || !activeTemplate || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const completed = !progress.has(key);
    const operation: PendingChecklistOperation = { kind: 'preset', templateId: activeTemplate.id, itemKey: key, completed };
    rememberWrite(operation);
    pending.current = true; setBusy(true); setMessage('');
    try {
      const result = await setChecklistItem(client, dogId, activeTemplate.id, key, completed, controller.signal);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') {
        resolveWrite();
        setProgress((current) => { const next = new Set(current); if (completed) next.add(key); else next.delete(key); return next; });
        setSummaries((current) => ({ ...current, [activeTemplate.id]: { done: done + (completed ? 1 : -1), total } }));
        setMessage('Sparat'); setMessageTone('success');
      } else if (result.status === 'unknown') { markUnknown(operation); setMessage('Det gick inte att kontrollera om ändringen sparades.'); setMessageTone('uncertain'); }
      else { resolveWrite(); setMessage('Kunde inte spara. Försök igen.'); setMessageTone('error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  async function toggleCustom(item: ChecklistCustomItem) {
    if (!reviewEnabled || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const completed = !item.completed;
    const operation: PendingChecklistOperation = { kind: 'update', previous: item, changes: { title: item.title, completed } };
    rememberWrite(operation);
    pending.current = true; setBusy(true); setMessage('');
    try {
      const result = await updateChecklistCustomItem(client, item, { title: item.title, completed }, controller.signal);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') {
        resolveWrite();
        setCustomItems((current) => current.map((row) => row.id === item.id ? result.value : row));
        setSummaries((current) => ({ ...current, [item.templateId]: { done: done + (completed ? 1 : -1), total } }));
        setMessage('Sparat'); setMessageTone('success');
      } else if (result.status === 'unknown') { markUnknown(operation); setMessage('Det gick inte att kontrollera om ändringen sparades.'); setMessageTone('uncertain'); }
      else if (result.status === 'conflict') { resolveWrite(); setMessage('Punkten har ändrats. Läs in listan igen.'); setMessageTone('error'); }
      else { resolveWrite(); setMessage('Kunde inte spara. Försök igen.'); setMessageTone('error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  async function saveCustom() {
    if (!reviewEnabled || !activeTemplate || !form || pending.current || state !== 'ready' || uncertain) return;
    if (!normalizeCustomChecklistTitle(form.title)) { setFormError('Skriv en punkt på mellan 1 och 160 tecken.'); return; }
    setFormError('');
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const normalizedTitle = normalizeCustomChecklistTitle(form.title)!;
    const operation: PendingChecklistOperation = form.id
      ? { kind: 'update', previous: customItems.find((item) => item.id === form.id)!, changes: { title: normalizedTitle, completed: form.completed } }
      : { kind: 'add', templateId: activeTemplate.id, id: form.requestId, title: normalizedTitle };
    rememberWrite(operation);
    pending.current = true; setBusy(true); setMessage('');
    try {
      if (form.id) {
        const previous = customItems.find((item) => item.id === form.id);
        if (!previous) { resolveWrite(); setMessage('Punkten saknas. Läs in listan igen.'); setMessageTone('error'); return; }
        const result = await updateChecklistCustomItem(client, previous, { title: normalizedTitle, completed: form.completed }, controller.signal);
        if (scope !== generation.current || controller.signal.aborted) return;
        if (result.status === 'saved') { resolveWrite(); setCustomItems((current) => current.map((item) => item.id === result.value.id ? result.value : item)); setSummaries((current) => ({ ...current, [activeTemplate.id]: { done: done + Number(result.value.completed) - Number(previous.completed), total } })); setForm(null); setMessage('Sparat'); setMessageTone('success'); }
        else if (result.status === 'conflict') { resolveWrite(); setMessage('Punkten har ändrats. Läs in listan igen.'); setMessageTone('error'); }
        else { if (result.status === 'unknown') markUnknown(operation); else resolveWrite(); setMessage(result.status === 'unknown' ? 'Det gick inte att kontrollera om ändringen sparades.' : 'Kunde inte spara. Försök igen.'); setMessageTone(result.status === 'unknown' ? 'uncertain' : 'error'); }
      } else {
        const result = await addChecklistCustomItem(client, dogId, activeTemplate.id, form.requestId, form.title, controller.signal);
        if (scope !== generation.current || controller.signal.aborted) return;
        if (result.status === 'saved') { resolveWrite(); setCustomItems((current) => current.some((item) => item.id === result.value.id) ? current : [...current, result.value]); setSummaries((current) => ({ ...current, [activeTemplate.id]: { done, total: total + 1 } })); setForm(null); setMessage('Sparat'); setMessageTone('success'); }
        else { if (result.status === 'unknown') markUnknown(operation); else resolveWrite(); setMessage(result.status === 'unknown' ? 'Det gick inte att kontrollera om ändringen sparades.' : 'Kunde inte spara. Försök igen.'); setMessageTone(result.status === 'unknown' ? 'uncertain' : 'error'); }
      }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  async function removeCustom(item: ChecklistCustomItem) {
    if (!reviewEnabled || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const operation: PendingChecklistOperation = { kind: 'delete', previous: item };
    rememberWrite(operation);
    pending.current = true; setBusy(true); setMessage('');
    try {
      const result = await deleteChecklistCustomItem(client, item, controller.signal);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') { resolveWrite(); setCustomItems((current) => current.filter((row) => row.id !== item.id)); setSummaries((current) => ({ ...current, [item.templateId]: { done: done - Number(item.completed), total: total - 1 } })); setForm(null); setMessage('Punkten är borttagen.'); setMessageTone('success'); }
      else if (result.status === 'conflict') { resolveWrite(); setMessage('Punkten har ändrats. Läs in listan igen.'); setMessageTone('error'); }
      else { if (result.status === 'unknown') markUnknown(operation); else resolveWrite(); setMessage(result.status === 'unknown' ? 'Det gick inte att kontrollera om punkten togs bort.' : 'Kunde inte ta bort punkten. Försök igen.'); setMessageTone(result.status === 'unknown' ? 'uncertain' : 'error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  function applyLoadedTemplate(template: ChecklistTemplate, loaded: Awaited<ReturnType<typeof fetchChecklistState>>) {
    const completed = loaded.progress.length + loaded.customItems.filter((row) => row.completed).length;
    setSummaries((current) => ({ ...current, [template.id]: { done: completed, total: template.items.length + loaded.customItems.length } }));
    if (templateId === template.id) {
      setProgress(new Set(loaded.progress.map((row) => row.itemKey)));
      setCustomItems(loaded.customItems);
    }
  }

  async function checkPendingOperation() {
    const operation = pendingOperation;
    if (!operation || pending.current || !reviewEnabled) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    pending.current = true; setBusy(true); setMessage('');
    const current = () => scope === generation.current && !controller.signal.aborted;
    const finish = (text: string, tone: 'success' | 'error' = 'success') => {
      if (!current()) return;
      resolveWrite(); setMessage(text); setMessageTone(tone);
    };
    try {
      if (operation.kind === 'preference') {
        const overview = await fetchChecklistOverview(client, dogId, controller.signal);
        if (!current()) return;
        const decision = classifyPendingChecklistOperation(operation, { preference: overview.preference?.context ?? null, progress: [], customItems: [] });
        if (decision === 'saved') { setContext(operation.context); finish('Valet är sparat.'); return; }
        const result = await setChecklistPreference(client, dogId, operation.context, controller.signal);
        if (!current()) return;
        if (result.status === 'saved') { setContext(result.value.context); finish('Valet är sparat.'); }
        else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om valet sparades.');
        else finish('Kunde inte spara valet. Försök igen.', 'error');
        return;
      }

      const operationTemplateId = operation.kind === 'update' || operation.kind === 'delete' ? operation.previous.templateId : operation.templateId;
      const template = templates.find((entry) => entry.id === operationTemplateId);
      if (!template) { finish('Checklistan saknas. Läs in listan igen.', 'error'); return; }
      const loaded = await fetchChecklistState(client, dogId, operationTemplateId, controller.signal);
      if (!current()) return;
      const decision = classifyPendingChecklistOperation(operation, { ...loaded, preference: loaded.preference?.context ?? null });

      if (operation.kind === 'preset') {
        if (decision === 'saved') { applyLoadedTemplate(template, loaded); finish('Sparat'); return; }
        const result = await setChecklistItem(client, dogId, operation.templateId, operation.itemKey, operation.completed, controller.signal);
        if (!current()) return;
        if (result.status === 'saved') {
          const nextProgress = operation.completed ? [...loaded.progress, { dogId, templateId: operation.templateId, itemKey: operation.itemKey }] : loaded.progress.filter((item) => item.itemKey !== operation.itemKey);
          applyLoadedTemplate(template, { ...loaded, progress: nextProgress }); finish('Sparat');
        } else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om ändringen sparades.');
        else finish('Kunde inte spara. Försök igen.', 'error');
        return;
      }

      if (operation.kind === 'add') {
        const existing = loaded.customItems.find((item) => item.id === operation.id);
        if (existing) {
          applyLoadedTemplate(template, loaded);
          if (decision === 'saved') {
            setForm((value) => value?.requestId === operation.id ? null : value);
            finish('Sparat');
          } else { setForm((value) => value?.requestId === operation.id ? null : value); finish('Punkten har ändrats. Läs in listan igen.', 'error'); }
          return;
        }
        const result = await addChecklistCustomItem(client, dogId, operation.templateId, operation.id, operation.title, controller.signal);
        if (!current()) return;
        if (result.status === 'saved') {
          const refreshedItems = loaded.customItems.some((item) => item.id === result.value.id) ? loaded.customItems : [...loaded.customItems, result.value];
          applyLoadedTemplate(template, { ...loaded, customItems: refreshedItems });
          setForm((value) => value?.requestId === operation.id ? null : value);
          finish('Sparat');
        } else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om ändringen sparades.');
        else finish('Kunde inte spara. Försök igen.', 'error');
        return;
      }

      const previous = operation.previous;
      const found = loaded.customItems.find((item) => item.id === previous.id);
      if (operation.kind === 'update') {
        if (decision === 'saved') {
          applyLoadedTemplate(template, loaded); setForm(null); finish('Sparat'); return;
        }
        if (decision === 'conflict' || !found || !sameCustom(found, previous)) {
          applyLoadedTemplate(template, loaded); setForm(null); finish('Punkten har ändrats. Läs in listan igen.', 'error'); return;
        }
        const result = await updateChecklistCustomItem(client, previous, operation.changes, controller.signal);
        if (!current()) return;
        if (result.status === 'saved') { applyLoadedTemplate(template, { ...loaded, customItems: loaded.customItems.map((item) => item.id === result.value.id ? result.value : item) }); setForm(null); finish('Sparat'); }
        else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om ändringen sparades.');
        else finish('Punkten har ändrats. Läs in listan igen.', 'error');
        return;
      }

      if (decision === 'saved' || !found) { applyLoadedTemplate(template, loaded); setForm(null); finish('Punkten är borttagen.'); return; }
      if (decision === 'conflict' || !sameCustom(found, previous)) { applyLoadedTemplate(template, loaded); setForm(null); finish('Punkten har ändrats. Läs in listan igen.', 'error'); return; }
      const result = await deleteChecklistCustomItem(client, previous, controller.signal);
      if (!current()) return;
      if (result.status === 'saved') {
        applyLoadedTemplate(template, { ...loaded, customItems: loaded.customItems.filter((item) => item.id !== previous.id) }); setForm(null); finish('Punkten är borttagen.');
      } else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om punkten togs bort.');
      else finish('Punkten har ändrats. Läs in listan igen.', 'error');
    } catch {
      if (current()) setMessage('Det gick inte att kontrollera om ändringen sparades.');
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  const retry = async () => {
    if (uncertain) { await checkPendingOperation(); return; }
    if (await load(templateId)) setMessage('');
  };
  const activeLabel = useMemo(() => CONTEXTS.find((item) => item.id === context)?.title ?? 'Efter ålder', [context]);

  return <View>
    {activeTemplate ? <AppBar mode="Back" title={activeTemplate.title} onAction={leaveChecklist} /> : null}
    {!reviewEnabled ? <Text style={styles.meta}>Inga checklistor publicerade ännu.</Text> : !activeTemplate ? <>
      <SectionHeader title="Var är ni just nu?" />
      <Text style={styles.body}>Välj det som passar er. Du kan ändra senare.</Text>
      <View style={styles.contextList}>{CONTEXTS.map((item) => <Button key={item.id} variant={context === item.id ? 'secondary' : 'tertiary'} label={item.title} accessibilityLabel={`Välj ${item.title}`} disabled={busy || state !== 'ready' || uncertain} onPress={() => { void chooseContext(item.id); }} />)}</View>
      <Text style={styles.selectedContext}>{state === 'ready' ? `Valt: ${activeLabel}` : state === 'error' ? 'Val kunde inte hämtas' : 'Läser in valt läge…'}</Text>
      <SectionHeader title="Checklistor" />
      <Text style={styles.body}>Välj en fas att läsa. Andra faser ändrar inte ditt val.</Text>
      {templates.map((template) => {
        const isRecommended = state === 'ready' && template.phase === recommended;
        return <Card key={template.id} onPress={uncertain || busy ? undefined : () => openTemplate(template)} accessibilityLabel={`Öppna ${template.title}${isRecommended ? ', föreslagen fas' : ''}`}>
          <View style={styles.templateHeading}><IconChip category="training" /><View style={styles.templateCopy}><Text style={styles.categoryLabel}>Checklista</Text><Text style={styles.templateTitle}>{template.title}</Text></View></View>
          <Text style={styles.meta}>Tillfälligt exempel – innehållet är inte sakgranskat</Text>
          <Button variant="tertiary" label={reviewInfoOpen ? 'Dölj information' : 'Läs mer'} accessibilityLabel="Läs mer om tillfälliga exempel" onPress={() => setReviewInfoOpen((open) => !open)} />
          {reviewInfoOpen ? <Text style={styles.meta}>Exemplen tas bort eller skrivs om före lansering.</Text> : null}
          {isRecommended ? <Text style={styles.meta}>Passar ert val</Text> : null}
          <Text style={styles.meta}>{state === 'ready' ? `${summaries[template.id]?.done ?? 0} av ${summaries[template.id]?.total ?? template.items.length} genomförda` : state === 'error' ? 'Framsteg kunde inte hämtas' : 'Läser in framsteg…'}</Text>
        </Card>;
      })}
    </> : <>
      <Text style={styles.body}>{activeTemplate.intro}</Text>
      <Text style={styles.meta}>Tillfälligt exempel – innehållet är inte sakgranskat. Läs mer om granskningsinnehållet före release.</Text>
      <Button variant="tertiary" label={reviewInfoOpen ? 'Dölj information' : 'Läs mer'} accessibilityLabel="Läs mer om tillfälliga exempel" onPress={() => setReviewInfoOpen((open) => !open)} />
      {reviewInfoOpen ? <Text style={styles.meta}>Exemplen tas bort eller skrivs om före lansering.</Text> : null}
      {state === 'ready' ? <Progress value={percentage} label={`${percentage} % · ${done} av ${total} genomförda`} /> : <Text style={styles.meta}>{state === 'error' ? 'Framsteg kunde inte hämtas' : 'Läser in framsteg…'}</Text>}
      {state === 'ready' ? <>
        <SectionHeader title="Att göra" />
        {activeTemplate.items.map((item) => <ChecklistItem key={item.key} label={item.title} checked={progress.has(item.key)} disabled={busy || uncertain} onPress={() => { void togglePreset(item.key); }} />)}
        <SectionHeader title="Egna punkter" />
        {customItems.length === 0 ? <Text style={styles.meta}>Lägg till något som passar er.</Text> : customItems.map((item) => <View key={item.id} style={styles.customRow}>
          <ChecklistItem label={item.title} checked={item.completed} disabled={busy || uncertain} onPress={() => { void toggleCustom(item); }} />
          <Button variant="tertiary" label="Ändra" accessibilityLabel={`Ändra ${item.title}`} disabled={busy || uncertain} onPress={() => { setFormError(''); setForm({ id: item.id, requestId: item.id, title: item.title, completed: item.completed }); }} />
        </View>)}
        {!form ? <Button label="Lägg till egen punkt" accessibilityLabel="Lägg till egen punkt" variant="primary" disabled={busy || uncertain} onPress={() => { setFormError(''); setForm({ id: null, requestId: Crypto.randomUUID(), title: '', completed: false }); }} /> : null}
      </> : <Text style={styles.meta}>{state === 'error' ? 'Checklistan kunde inte hämtas. Inga bockar visas som sparade.' : 'Läser in punkterna…'}</Text>}
    </>}
    {state === 'loading' ? <Text style={styles.meta}>Läser in…</Text> : null}
    {uncertain && message ? <View style={styles.uncertain}><Text style={styles.meta}>{message}</Text><Button variant="secondary" label="Kontrollera" accessibilityLabel="Kontrollera om ändringen sparades" onPress={retry} /></View> : null}
    <Toast visible={Boolean(message) && !uncertain} tone={messageTone === 'uncertain' ? 'neutral' : messageTone} message={message || undefined} onRetry={retry} onAutoDismiss={() => setMessage('')} autoDismissMs={messageTone === 'success' ? 2500 : undefined} confirmed={messageTone === 'success'} />
    {form ? <View style={styles.form}>
      <SectionHeader title={form.id ? 'Ändra egen punkt' : 'Ny egen punkt'} />
      <Field label="Punkt" value={form.title} onChangeText={(title) => { setForm((current) => current ? { ...current, title } : current); setFormError(''); }} error={formError} help={formError ? undefined : 'Högst 160 tecken.'} state={busy || uncertain ? 'disabled' : 'default'} />
      {form.id ? <Button variant="secondary" label={form.completed ? 'Markera som inte klar' : 'Markera som klar'} accessibilityLabel={form.completed ? 'Markera punkten som inte klar' : 'Markera punkten som klar'} disabled={busy || uncertain} onPress={() => setForm((current) => current ? { ...current, completed: !current.completed } : current)} /> : null}
      <Button label="Spara" accessibilityLabel="Spara egen punkt" loading={busy} disabled={busy || state !== 'ready' || uncertain} onPress={() => { void saveCustom(); }} />
      {form.id ? <Button variant="destructive" label="Radera punkt" accessibilityLabel="Radera egen punkt" disabled={busy || uncertain || state !== 'ready'} onPress={() => Alert.alert('Radera punkten?', 'Den egna punkten tas bort från checklistan.', [{ text: 'Avbryt', style: 'cancel' }, { text: 'Radera', style: 'destructive', onPress: () => { const item = customItems.find((row) => row.id === form.id); if (item) void removeCustom(item); } }])} /> : null}
      <Button variant="tertiary" label="Avbryt" accessibilityLabel="Avbryt ändring av egen punkt" disabled={busy} onPress={() => { setForm(null); setFormError(''); }} />
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  body: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  contextList: { gap: tokens.spacing.xs, marginBottom: tokens.spacing.sm },
  selectedContext: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  templateHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  templateCopy: { flex: 1, flexShrink: 1 },
  categoryLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  templateTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: tokens.spacing.xs },
  customRow: { marginBottom: tokens.spacing.sm },
  form: { gap: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, marginTop: tokens.spacing.lg, paddingTop: tokens.spacing.md },
  uncertain: { gap: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: tokens.spacing.md, marginVertical: tokens.spacing.sm },
});
