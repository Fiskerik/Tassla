import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppBar, BottomSheet, Button, Card, ChecklistItem, Dialog, Field, Progress, SectionHeader, Toast } from '../../components/ui';
import { ChecklistIconPickerChoices, ChecklistIconPickerTrigger } from '../checklists/ChecklistIconPicker';
import { checklistIconTone, type ChecklistIcon } from '../checklists/checklist-icons';
import { CHECKLIST_TEMPLATES } from './checklist-content';
import { addChecklistCustomItem, cacheChecklistOverview, cacheChecklistPreference, cacheChecklistTemplateState, checklistCatalogReadCacheScope, checklistOverviewSnapshot, checklistTemplateSnapshot, deleteChecklistCustomItem, fetchChecklistOverview, fetchChecklistState, fetchPublishedChecklistCatalog, setChecklistItem, setChecklistPreference, updateChecklistCustomItem, type PublishedChecklistCatalog } from './checklist-data';
import { checklistPercent, chooseChecklistPhase, normalizeCustomChecklistTitle, type ChecklistContext, type ChecklistCustomItem, type ChecklistTemplate } from './checklist-model';
import { classifyPendingChecklistOperation, freezePendingChecklistMemory, type PendingChecklistMemory, type PendingChecklistOperation } from './checklist-intent';
import { getContentSourceMetadata, getSafeContentSourceUrl } from './source-links';
import { checklistPhaseVisualFor } from './checklist-phase-visuals';
import { KnowledgeImage } from './KnowledgeImage';
import { tokens } from '../../theme/tokens';

type LoadState = 'loading' | 'ready' | 'error';
const CONTEXTS: { id: ChecklistContext; title: string }[] = [
  { id: 'before_homecoming', title: 'Före hemkomst' },
  { id: 'first_days', title: 'Första dagarna hemma' },
  { id: 'by_age', title: 'Efter ålder' },
];
const CHECKLIST_ITEM_ICONS: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  'safe-space': 'bed-outline',
  supplies: 'basket-outline',
  'vet-contact': 'medkit-outline',
  'quiet-start': 'volume-mute-outline',
  routine: 'time-outline',
  rest: 'moon-outline',
  name: 'text-outline',
  handling: 'hand-left-outline',
  alone: 'home-outline',
  recall: 'walk-outline',
  settle: 'leaf-outline',
  walks: 'trail-sign-outline',
  review: 'refresh-outline',
  focus: 'locate-outline',
  breaks: 'pause-outline',
  enjoy: 'star-outline',
  adapt: 'options-outline',
  play: 'tennisball-outline',
};
function sameCustom(left: ChecklistCustomItem, right: ChecklistCustomItem) {
  return left.id === right.id && left.dogId === right.dogId && left.templateId === right.templateId && left.title === right.title && left.completed === right.completed && left.icon === right.icon;
}

type CustomChecklistForm = { id: string | null; requestId: string; title: string; completed: boolean; icon: ChecklistIcon | null };

export function PuppyChecklistScreen({ client, dogId, ageWeeks, cacheScope, onBack, registerInvalidate, active = true, pendingState = null, onPendingStateChange, onDetailChange }: { client: SupabaseClient; dogId: string; ageWeeks: number | null; cacheScope: string; onBack: () => void; registerInvalidate?: (invalidate: (() => void) | null) => void; active?: boolean; pendingState?: PendingChecklistMemory | null; onPendingStateChange?: (state: PendingChecklistMemory | null) => void; onDetailChange?: (open: boolean) => void }) {
  const reviewEnabled = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';
  const initialScope = reviewEnabled ? cacheScope : '';
  const initialOverview = initialScope ? checklistOverviewSnapshot(initialScope) : null;
  const [templates, setTemplates] = useState<readonly ChecklistTemplate[]>(() => reviewEnabled ? CHECKLIST_TEMPLATES : []);
  const [resolvedCacheScope, setResolvedCacheScope] = useState(initialScope);
  const resolvedCacheScopeRef = useRef(initialScope);
  const catalogRef = useRef<PublishedChecklistCatalog | null>(reviewEnabled ? { templates: CHECKLIST_TEMPLATES, versionIds: [] } : null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>(() => reviewEnabled && initialOverview ? 'ready' : 'loading');
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<ChecklistCustomItem[]>([]);
  const [summaries, setSummaries] = useState<Record<string, { done: number; total: number }>>(() => initialOverview?.summary ?? {});
  const [uncertain, setUncertain] = useState(pendingState?.uncertain ?? false);
  const [pendingOperation, setPendingOperation] = useState<PendingChecklistOperation | null>(pendingState?.operation ?? null);
  const [formError, setFormError] = useState('');
  const [context, setContext] = useState<ChecklistContext>(() => initialOverview?.preference?.context ?? 'by_age');
  const [preferenceSaved, setPreferenceSaved] = useState(() => initialOverview?.preference !== null && initialOverview?.preference !== undefined);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [failedContext, setFailedContext] = useState<ChecklistContext | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
  const [formSheetOpen, setFormSheetOpen] = useState(Boolean(pendingState?.uncertain && pendingState?.draft));
  const [failedFormAction, setFailedFormAction] = useState<'save' | 'delete' | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [discardFormOpen, setDiscardFormOpen] = useState(false);
  const [discardTarget, setDiscardTarget] = useState<'sheet' | 'checklist'>('sheet');
  const [deleteTarget, setDeleteTarget] = useState<ChecklistCustomItem | null>(null);
  const [message, setMessage] = useState(pendingState?.uncertain ? 'Det gick inte att kontrollera om ändringen sparades.' : '');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'uncertain'>(pendingState?.uncertain ? 'uncertain' : 'error');
  const [sourceMessage, setSourceMessage] = useState('');
  const [form, setForm] = useState<CustomChecklistForm | null>(pendingState?.draft ?? null);
  const formRef = useRef(form);
  const pendingChangeRef = useRef(onPendingStateChange);
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { pendingChangeRef.current = onPendingStateChange; }, [onPendingStateChange]);
  const pending = useRef(false);
  const writeIntent = useRef<PendingChecklistOperation | null>(pendingState?.operation ?? null);
  const controllerRef = useRef<AbortController | null>(null);
  const writeControllerRef = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const activeTemplate = templates.find((item) => item.id === templateId) ?? null;
  const currentCacheScope = resolvedCacheScope || cacheScope;
  const catalogReady = templates.length === CHECKLIST_TEMPLATES.length && templates.every((item) => reviewEnabled || Boolean(item.versionId));

  async function openSource(source: string) {
    const url = getSafeContentSourceUrl(source);
    if (!url) return;
    try {
      await Linking.openURL(url);
      setSourceMessage('Källan öppnades.');
    } catch {
      setSourceMessage('Källan kunde inte öppnas just nu. Du kan försöka igen.');
    }
  }

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
    setSavingRowKey(null);
    setContextSheetOpen(false);
    setFormSheetOpen(false);
  }, [form, onPendingStateChange]);

  function rememberWrite(operation: PendingChecklistOperation) {
    writeIntent.current = operation;
  }
  function markUnknown(operation: PendingChecklistOperation) {
    writeIntent.current = operation;
    onPendingStateChange?.(freezePendingChecklistMemory(operation, form));
    setFailedFormAction(null);
    setPendingOperation(operation); setUncertain(true);
  }
  function resolveWrite() {
    writeIntent.current = null;
    onPendingStateChange?.(null);
    setFailedFormAction(null);
    setPendingOperation(null); setUncertain(false);
  }

  function storeTemplateSnapshot(id: string, itemKeys: Iterable<string>, items: readonly ChecklistCustomItem[]) {
    cacheChecklistTemplateState(currentCacheScope, id, {
      progress: [...itemKeys].map((itemKey) => ({ dogId, templateId: id, itemKey })),
      customItems: [...items],
      preference: preferenceSaved ? { dogId, context } : null,
    }, templates);
  }

  function openAddForm() {
    if (form) { setFormSheetOpen(true); return; }
    setFormError('');
    setFailedFormAction(null);
    setMessage('');
    setForm({ id: null, requestId: Crypto.randomUUID(), title: '', completed: false, icon: null });
    setIconPickerOpen(false);
    setFormSheetOpen(true);
  }

  function openEditForm(item: ChecklistCustomItem) {
    if (form) { setFormSheetOpen(true); return; }
    setFormError('');
    setFailedFormAction(null);
    setMessage('');
    setForm({ id: item.id, requestId: item.id, title: item.title, completed: item.completed, icon: item.icon });
    setIconPickerOpen(false);
    setFormSheetOpen(true);
  }

  function formIsDirty() {
    if (!form) return false;
    if (!form.id) return Boolean(form.title.trim() || form.icon || form.completed);
    const original = customItems.find((item) => item.id === form.id);
    return !original || form.title !== original.title || form.completed !== original.completed || form.icon !== original.icon;
  }

  function leaveChecklistNow() {
    invalidateCurrentView();
    if (templateId) { setTemplateId(null); setForm(null); if (!uncertain) setMessage(''); }
    else onBack();
  }

  function requestFormClose(target: 'sheet' | 'checklist' = 'sheet') {
    if (busy || uncertain) return;
    if (formIsDirty()) {
      setDiscardTarget(target);
      setDiscardFormOpen(true);
      return;
    }
    setForm(null);
    setFormSheetOpen(false);
    setIconPickerOpen(false);
    if (target === 'checklist') leaveChecklistNow();
  }

  function closeFormSheet() {
    requestFormClose('sheet');
  }

  function confirmDiscardForm() {
    const target = discardTarget;
    setDiscardFormOpen(false);
    setForm(null);
    setFormSheetOpen(false);
    setIconPickerOpen(false);
    setFormError('');
    setFailedFormAction(null);
    if (!uncertain) setMessage('');
    if (target === 'checklist') leaveChecklistNow();
  }

  function leaveChecklist() {
    if (formSheetOpen && form) { requestFormClose('checklist'); return; }
    leaveChecklistNow();
  }

  const load = useCallback(async (selectedId: string | null, withSpinner = true, forceRefresh = false): Promise<boolean> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    let loadedCatalog: PublishedChecklistCatalog;
    try {
      loadedCatalog = reviewEnabled
        ? { templates: CHECKLIST_TEMPLATES, versionIds: [] }
        : !forceRefresh && catalogRef.current ? catalogRef.current : await fetchPublishedChecklistCatalog(client, controller.signal);
      if (controller.signal.aborted) return false;
      catalogRef.current = loadedCatalog;
      setTemplates(loadedCatalog.templates);
      const nextScope = reviewEnabled ? cacheScope : checklistCatalogReadCacheScope(cacheScope, loadedCatalog.versionIds);
      resolvedCacheScopeRef.current = nextScope;
      setResolvedCacheScope(nextScope);
      if (loadedCatalog.templates.length === 0) {
        setSummaries({});
        setProgress(new Set());
        setCustomItems([]);
        setState('ready');
        return true;
      }
      if (loadedCatalog.templates.length !== CHECKLIST_TEMPLATES.length) throw new Error('Published checklist catalog is incomplete');
    } catch {
      if (controller.signal.aborted) return false;
      if (!catalogRef.current?.templates.length) setTemplates([]);
      setState('error');
      setMessage('Checklistorna kunde inte läsas in. Försök igen.');
      setMessageTone('error');
      return false;
    }
    const activeScope = resolvedCacheScopeRef.current;
    const previousOverview = checklistOverviewSnapshot(activeScope);
    const previousTemplate = selectedId ? checklistTemplateSnapshot(activeScope, selectedId) : null;
    const cachedOverview = forceRefresh ? null : previousOverview;
    const cachedTemplate = forceRefresh ? null : previousTemplate;
    const hasRequiredCache = Boolean(cachedOverview && (!selectedId || cachedTemplate));
    if (withSpinner && !hasRequiredCache) setState('loading');
    if (hasRequiredCache && !forceRefresh) {
      setSummaries(cachedOverview!.summary);
      setContext(cachedOverview!.preference?.context ?? 'by_age');
      setPreferenceSaved(cachedOverview!.preference !== null);
      if (cachedTemplate) {
        setProgress(new Set(cachedTemplate.progress.map((row) => row.itemKey)));
        setCustomItems(cachedTemplate.customItems);
      }
      setState('ready');
      return true;
    }
    setBusy(false);
    try {
      const [overview, loaded] = await Promise.all([
        cachedOverview ?? fetchChecklistOverview(client, dogId, controller.signal, loadedCatalog.templates),
        selectedId ? cachedTemplate ?? fetchChecklistState(client, dogId, selectedId, controller.signal, loadedCatalog.templates) : Promise.resolve(null),
      ]);
      if (controller.signal.aborted) return false;
      cacheChecklistOverview(activeScope, overview);
      setSummaries(overview.summary);
      setContext(overview.preference?.context ?? 'by_age');
      setPreferenceSaved(overview.preference !== null);
      if (loaded) {
        cacheChecklistTemplateState(activeScope, selectedId!, loaded, loadedCatalog.templates);
        setSummaries(checklistOverviewSnapshot(activeScope)?.summary ?? overview.summary);
        setProgress(new Set(loaded.progress.map((row) => row.itemKey)));
        setCustomItems(loaded.customItems);
      }
      setState('ready');
      return true;
    } catch {
      if (controller.signal.aborted) return false;
      const canKeepConfirmedState = Boolean(previousOverview && (!selectedId || previousTemplate));
      setState(canKeepConfirmedState ? 'ready' : 'error');
      setMessage(canKeepConfirmedState
        ? 'Uppdateringen misslyckades. Visar senast bekräftade data. Försök igen.'
        : 'Listan kunde inte läsas in. Försök igen.');
      setMessageTone('error');
      return false;
    }
  }, [cacheScope, client, dogId, reviewEnabled]);

  useEffect(() => {
    const scope = ++generation.current;
    writeControllerRef.current?.abort();
    pending.current = false;
    const timer = setTimeout(() => {
      if (active) void load(templateId);
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
  }, [active, client, dogId, load, reviewEnabled, cacheScope, templateId]);

  useEffect(() => {
    registerInvalidate?.(invalidateCurrentView);
    return () => registerInvalidate?.(null);
  }, [invalidateCurrentView, registerInvalidate]);

  useEffect(() => { onDetailChange?.(Boolean(templateId)); }, [onDetailChange, templateId]);

  const total = activeTemplate ? summaries[activeTemplate.id]?.total ?? activeTemplate.items.length + customItems.length : 0;
  const done = activeTemplate ? summaries[activeTemplate.id]?.done ?? (activeTemplate.items.filter((item) => progress.has(item.key)).length + customItems.filter((item) => item.completed).length) : 0;
  const recommended = ageWeeks === null ? null : chooseChecklistPhase(ageWeeks, context);
  const percentage = checklistPercent(done, total);
  const allItemsComplete = state === 'ready' && total > 0 && done === total;
  function openTemplate(template: ChecklistTemplate) {
    invalidateCurrentView();
    const cached = checklistTemplateSnapshot(currentCacheScope, template.id);
    if (cached) {
      setState('ready');
      setProgress(new Set(cached.progress.map((row) => row.itemKey)));
      setCustomItems(cached.customItems);
    } else {
      setState('loading'); setProgress(new Set()); setCustomItems([]);
    }
    setForm(null); setFormError(''); if (!uncertain) setMessage(''); setTemplateId(template.id);
  }

  async function chooseContext(next: ChecklistContext) {
    if (!catalogReady || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    pending.current = true; setBusy(true); setMessage(''); setFailedContext(null);
    const operation: PendingChecklistOperation = { kind: 'preference', context: next };
    rememberWrite(operation);
    setPendingOperation(operation);
    try {
      const result = await setChecklistPreference(client, dogId, next, controller.signal);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') { resolveWrite(); cacheChecklistPreference(currentCacheScope, { dogId, context: next }); setContext(next); setPreferenceSaved(true); setContextSheetOpen(false); setMessage('Valet är sparat.'); setMessageTone('success'); }
      else if (result.status === 'unknown') { markUnknown(operation); setContextSheetOpen(false); setMessage('Det gick inte att kontrollera om valet sparades.'); setMessageTone('uncertain'); }
      else { resolveWrite(); setFailedContext(next); setContextSheetOpen(false); setMessage('Kunde inte spara valet. Försök igen.'); setMessageTone('error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  async function togglePreset(key: string) {
    if (!catalogReady || !activeTemplate || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const completed = !progress.has(key);
    const operation: PendingChecklistOperation = { kind: 'preset', templateId: activeTemplate.id, itemKey: key, completed };
    rememberWrite(operation);
    pending.current = true; setBusy(true); setMessage('');
    setSavingRowKey(`preset:${activeTemplate.id}:${key}`);
    try {
      const result = await setChecklistItem(client, dogId, activeTemplate.id, key, completed, controller.signal, templates);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') {
        resolveWrite();
        const nextProgress = new Set(progress);
        if (completed) nextProgress.add(key); else nextProgress.delete(key);
        setProgress(nextProgress);
        storeTemplateSnapshot(activeTemplate.id, nextProgress, customItems);
        setSummaries((current) => ({ ...current, [activeTemplate.id]: { done: done + (completed ? 1 : -1), total } }));
        setMessage('Sparat'); setMessageTone('success');
      } else if (result.status === 'unknown') { markUnknown(operation); setMessage('Det gick inte att kontrollera om ändringen sparades.'); setMessageTone('uncertain'); }
      else { resolveWrite(); setMessage('Kunde inte spara. Försök igen.'); setMessageTone('error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); setSavingRowKey(null); } }
  }

  async function toggleCustom(item: ChecklistCustomItem) {
    if (!catalogReady || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const completed = !item.completed;
    const operation: PendingChecklistOperation = { kind: 'update', previous: item, changes: { title: item.title, completed } };
    rememberWrite(operation);
    pending.current = true; setBusy(true); setMessage('');
    setSavingRowKey(`custom:${item.id}`);
    try {
      const result = await updateChecklistCustomItem(client, item, { title: item.title, completed }, controller.signal, templates);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') {
        resolveWrite();
        const nextItems = customItems.map((row) => row.id === item.id ? result.value : row);
        setCustomItems(nextItems);
        storeTemplateSnapshot(item.templateId, progress, nextItems);
        setSummaries((current) => ({ ...current, [item.templateId]: { done: done + (completed ? 1 : -1), total } }));
        setMessage('Sparat'); setMessageTone('success');
      } else if (result.status === 'unknown') { markUnknown(operation); setMessage('Det gick inte att kontrollera om ändringen sparades.'); setMessageTone('uncertain'); }
      else if (result.status === 'conflict') { resolveWrite(); setMessage('Punkten har ändrats. Läs in listan igen.'); setMessageTone('error'); }
      else { resolveWrite(); setMessage('Kunde inte spara. Försök igen.'); setMessageTone('error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); setSavingRowKey(null); } }
  }

  async function saveCustom() {
    if (!catalogReady || !activeTemplate || !form || pending.current || state !== 'ready' || uncertain) return;
    if (!normalizeCustomChecklistTitle(form.title)) { setFormError('Skriv en punkt på mellan 1 och 160 tecken.'); return; }
    setFormError('');
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const normalizedTitle = normalizeCustomChecklistTitle(form.title)!;
    const operation: PendingChecklistOperation = form.id
      ? { kind: 'update', previous: customItems.find((item) => item.id === form.id)!, changes: { title: normalizedTitle, completed: form.completed, icon: form.icon } }
      : { kind: 'add', templateId: activeTemplate.id, id: form.requestId, title: normalizedTitle, icon: form.icon };
    rememberWrite(operation);
    setFailedFormAction(null);
    setPendingOperation(operation);
    pending.current = true; setBusy(true); setMessage('');
    try {
      if (form.id) {
        const previous = customItems.find((item) => item.id === form.id);
        if (!previous) { resolveWrite(); setMessage('Punkten saknas. Läs in listan igen.'); setMessageTone('error'); return; }
        const result = await updateChecklistCustomItem(client, previous, { title: normalizedTitle, completed: form.completed, icon: form.icon }, controller.signal, templates);
        if (scope !== generation.current || controller.signal.aborted) return;
        if (result.status === 'saved') { resolveWrite(); const nextItems = customItems.map((item) => item.id === result.value.id ? result.value : item); setCustomItems(nextItems); storeTemplateSnapshot(activeTemplate.id, progress, nextItems); setSummaries((current) => ({ ...current, [activeTemplate.id]: { done: done + Number(result.value.completed) - Number(previous.completed), total } })); setForm(null); setFormSheetOpen(false); setMessage('Sparat'); setMessageTone('success'); }
        else if (result.status === 'conflict') { resolveWrite(); setMessage('Punkten har ändrats. Läs in listan igen.'); setMessageTone('error'); }
        else { if (result.status === 'unknown') markUnknown(operation); else { resolveWrite(); setFailedFormAction('save'); } setMessage(result.status === 'unknown' ? 'Det gick inte att kontrollera om ändringen sparades.' : 'Kunde inte spara. Försök igen.'); setMessageTone(result.status === 'unknown' ? 'uncertain' : 'error'); }
      } else {
        const result = await addChecklistCustomItem(client, dogId, activeTemplate.id, form.requestId, form.title, form.icon, controller.signal, templates);
        if (scope !== generation.current || controller.signal.aborted) return;
        if (result.status === 'saved') { resolveWrite(); const nextItems = customItems.some((item) => item.id === result.value.id) ? customItems : [...customItems, result.value]; setCustomItems(nextItems); storeTemplateSnapshot(activeTemplate.id, progress, nextItems); setSummaries((current) => ({ ...current, [activeTemplate.id]: { done, total: total + 1 } })); setForm(null); setFormSheetOpen(false); setMessage('Sparat'); setMessageTone('success'); }
        else { if (result.status === 'unknown') markUnknown(operation); else { resolveWrite(); setFailedFormAction('save'); } setMessage(result.status === 'unknown' ? 'Det gick inte att kontrollera om ändringen sparades.' : 'Kunde inte spara. Försök igen.'); setMessageTone(result.status === 'unknown' ? 'uncertain' : 'error'); }
      }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  async function removeCustom(item: ChecklistCustomItem) {
    if (!catalogReady || pending.current || state !== 'ready' || uncertain) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    const operation: PendingChecklistOperation = { kind: 'delete', previous: item };
    rememberWrite(operation);
    setFailedFormAction(null);
    setPendingOperation(operation);
    pending.current = true; setBusy(true); setMessage('');
    try {
      const result = await deleteChecklistCustomItem(client, item, controller.signal, templates);
      if (scope !== generation.current || controller.signal.aborted) return;
      if (result.status === 'saved') { resolveWrite(); const nextItems = customItems.filter((row) => row.id !== item.id); setCustomItems(nextItems); storeTemplateSnapshot(item.templateId, progress, nextItems); setSummaries((current) => ({ ...current, [item.templateId]: { done: done - Number(item.completed), total: total - 1 } })); setForm(null); setFormSheetOpen(false); setMessage('Punkten är borttagen.'); setMessageTone('success'); }
      else if (result.status === 'conflict') { resolveWrite(); setMessage('Punkten har ändrats. Läs in listan igen.'); setMessageTone('error'); }
      else { if (result.status === 'unknown') markUnknown(operation); else { resolveWrite(); setFailedFormAction('delete'); } setMessage(result.status === 'unknown' ? 'Det gick inte att kontrollera om punkten togs bort.' : 'Kunde inte ta bort punkten. Försök igen.'); setMessageTone(result.status === 'unknown' ? 'uncertain' : 'error'); }
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  function applyLoadedTemplate(template: ChecklistTemplate, loaded: Awaited<ReturnType<typeof fetchChecklistState>>) {
    cacheChecklistTemplateState(currentCacheScope, template.id, loaded, templates);
    const completed = loaded.progress.length + loaded.customItems.filter((row) => row.completed).length;
    setSummaries((current) => ({ ...current, [template.id]: { done: completed, total: template.items.length + loaded.customItems.length } }));
    if (templateId === template.id) {
      setProgress(new Set(loaded.progress.map((row) => row.itemKey)));
      setCustomItems(loaded.customItems);
    }
  }

  async function checkPendingOperation() {
    const operation = pendingOperation;
    if (!operation || pending.current || !catalogReady) return;
    const scope = generation.current;
    const controller = new AbortController(); writeControllerRef.current = controller;
    pending.current = true; setBusy(true); setMessage(uncertain ? 'Kontrollerar om ändringen sparades…' : '');
    const current = () => scope === generation.current && !controller.signal.aborted;
    const finish = (text: string, tone: 'success' | 'error' = 'success', failedAction?: 'save' | 'delete') => {
      if (!current()) return;
      resolveWrite();
      if (failedAction) setFailedFormAction(failedAction);
      setMessage(text); setMessageTone(tone);
    };
    try {
      if (operation.kind === 'preference') {
        const overview = await fetchChecklistOverview(client, dogId, controller.signal, templates);
        if (!current()) return;
        cacheChecklistOverview(currentCacheScope, overview);
        setSummaries(overview.summary);
        const decision = classifyPendingChecklistOperation(operation, { preference: overview.preference?.context ?? null, progress: [], customItems: [] });
        if (decision === 'saved') { cacheChecklistPreference(currentCacheScope, { dogId, context: operation.context }); setContext(operation.context); setPreferenceSaved(true); setFailedContext(null); finish('Valet är sparat.'); return; }
        const result = await setChecklistPreference(client, dogId, operation.context, controller.signal);
        if (!current()) return;
        if (result.status === 'saved') { cacheChecklistPreference(currentCacheScope, result.value); setContext(result.value.context); setPreferenceSaved(true); setFailedContext(null); finish('Valet är sparat.'); }
        else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om valet sparades.');
        else { setFailedContext(operation.context); finish('Kunde inte spara valet. Försök igen.', 'error'); }
        return;
      }

      const operationTemplateId = operation.kind === 'update' || operation.kind === 'delete' ? operation.previous.templateId : operation.templateId;
      const template = templates.find((entry) => entry.id === operationTemplateId);
      if (!template) { finish('Checklistan saknas. Läs in listan igen.', 'error'); return; }
      const loaded = await fetchChecklistState(client, dogId, operationTemplateId, controller.signal, templates);
      if (!current()) return;
      const decision = classifyPendingChecklistOperation(operation, { ...loaded, preference: loaded.preference?.context ?? null });

      if (operation.kind === 'preset') {
        if (decision === 'saved') { applyLoadedTemplate(template, loaded); finish('Sparat'); return; }
        const result = await setChecklistItem(client, dogId, operation.templateId, operation.itemKey, operation.completed, controller.signal, templates);
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
            setFormSheetOpen(false);
            finish('Sparat');
          } else { setForm((value) => value?.requestId === operation.id ? null : value); setFormSheetOpen(false); finish('Punkten har ändrats. Läs in listan igen.', 'error'); }
          return;
        }
        const result = await addChecklistCustomItem(client, dogId, operation.templateId, operation.id, operation.title, operation.icon, controller.signal, templates);
        if (!current()) return;
        if (result.status === 'saved') {
          const refreshedItems = loaded.customItems.some((item) => item.id === result.value.id) ? loaded.customItems : [...loaded.customItems, result.value];
          applyLoadedTemplate(template, { ...loaded, customItems: refreshedItems });
          setForm((value) => value?.requestId === operation.id ? null : value);
          setFormSheetOpen(false);
          finish('Sparat');
        } else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om ändringen sparades.');
        else finish('Kunde inte spara. Försök igen.', 'error', 'save');
        return;
      }

      const previous = operation.previous;
      const found = loaded.customItems.find((item) => item.id === previous.id);
      if (operation.kind === 'update') {
        if (decision === 'saved') {
          applyLoadedTemplate(template, loaded); setForm(null); setFormSheetOpen(false); finish('Sparat'); return;
        }
        if (decision === 'conflict' || !found || !sameCustom(found, previous)) {
          applyLoadedTemplate(template, loaded); setForm(null); setFormSheetOpen(false); finish('Punkten har ändrats. Läs in listan igen.', 'error'); return;
        }
        const result = await updateChecklistCustomItem(client, previous, operation.changes, controller.signal, templates);
        if (!current()) return;
        if (result.status === 'saved') { applyLoadedTemplate(template, { ...loaded, customItems: loaded.customItems.map((item) => item.id === result.value.id ? result.value : item) }); setForm(null); setFormSheetOpen(false); finish('Sparat'); }
        else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om ändringen sparades.');
        else if (result.status === 'conflict') { setForm(null); setFormSheetOpen(false); finish('Punkten har ändrats. Läs in listan igen.', 'error'); }
        else finish('Kunde inte spara. Försök igen.', 'error', 'save');
        return;
      }

      if (decision === 'saved' || !found) { applyLoadedTemplate(template, loaded); setForm(null); setFormSheetOpen(false); finish('Punkten är borttagen.'); return; }
      if (decision === 'conflict' || !sameCustom(found, previous)) { applyLoadedTemplate(template, loaded); setForm(null); setFormSheetOpen(false); finish('Punkten har ändrats. Läs in listan igen.', 'error'); return; }
      const result = await deleteChecklistCustomItem(client, previous, controller.signal, templates);
      if (!current()) return;
      if (result.status === 'saved') {
        applyLoadedTemplate(template, { ...loaded, customItems: loaded.customItems.filter((item) => item.id !== previous.id) }); setForm(null); setFormSheetOpen(false); finish('Punkten är borttagen.');
      } else if (result.status === 'unknown') setMessage('Det gick inte att kontrollera om punkten togs bort.');
      else if (result.status === 'failed') finish('Kunde inte ta bort punkten. Försök igen.', 'error', 'delete');
      else finish('Punkten har ändrats. Läs in listan igen.', 'error');
    } catch {
      if (current()) setMessage('Det gick inte att kontrollera om ändringen sparades.');
    } finally { if (scope === generation.current) { pending.current = false; setBusy(false); } }
  }

  const retry = async () => {
    if (uncertain) { await checkPendingOperation(); return; }
    if (failedContext) { await chooseContext(failedContext); return; }
    if (failedFormAction === 'save' && form) { setFormSheetOpen(true); await saveCustom(); return; }
    if (failedFormAction === 'delete' && form?.id) {
      const item = customItems.find((row) => row.id === form.id);
      if (item) { setFormSheetOpen(true); await removeCustom(item); return; }
    }
    if (await load(templateId, true, true)) setMessage('');
  };
  const activeLabel = useMemo(() => CONTEXTS.find((item) => item.id === context)?.title ?? 'Efter ålder', [context]);
  const recommendedTemplate = state === 'ready' ? templates.find((item) => item.phase === recommended) ?? null : null;
  const unknownAgeDefault = state === 'ready' && ageWeeks === null && context === 'by_age' && !preferenceSaved;
  const contextSummary = unknownAgeDefault ? 'Ingen fas vald' : context === 'by_age' && recommendedTemplate ? `${activeLabel} · ${recommendedTemplate.title}` : activeLabel;
  const otherTemplates = recommendedTemplate ? templates.filter((item) => item.id !== recommendedTemplate.id) : templates;
  const preferencePending = busy && pendingOperation?.kind === 'preference' && !activeTemplate;
  const preferenceUncertain = uncertain && pendingOperation?.kind === 'preference' && !activeTemplate;
  const inlineContextStatus = !activeTemplate && (state === 'error' || Boolean(failedContext) || preferenceUncertain);
  const closeContextSheet = () => { if (!busy && !uncertain) setContextSheetOpen(false); };
  const sourceLinks = (activeTemplate?.sources ?? []).filter((source) => getContentSourceMetadata(source) !== null);
  const phaseVisual = activeTemplate ? checklistPhaseVisualFor(activeTemplate.phase) : null;
  function renderTemplateCard(template: ChecklistTemplate, isRecommended: boolean, summary = summaries[template.id] ?? { done: 0, total: template.items.length }) {
    return <Card key={template.id} selected={isRecommended} onPress={uncertain || busy ? undefined : () => openTemplate(template)} accessibilityLabel={`Öppna ${template.title}${isRecommended ? ', föreslagen fas' : ''}`}>
      <View style={styles.templateHeading}>
        <View style={styles.templateIcon}><Ionicons name="list-outline" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} /></View>
        <View style={styles.templateCopy}><Text style={styles.templateTitle}>{template.title}</Text></View>
        <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </View>
      <Text style={styles.templateIntro}>{template.intro}</Text>
      {state === 'ready' ? <Progress value={summary.total > 0 ? summary.done / summary.total * 100 : 0} label={`${summary.done} av ${summary.total} genomförda`} /> : <Text style={styles.meta}>{state === 'error' ? 'Framsteg kunde inte hämtas' : 'Läser in framsteg…'}</Text>}
    </Card>;
  }

  return <View>
    {activeTemplate ? <AppBar mode="Back" title={activeTemplate.title} onAction={leaveChecklist} variant="compact" /> : null}
    {activeTemplate && phaseVisual ? <View testID={`checklist-phase-image-${activeTemplate.phase}`} style={styles.phaseImageFrame}>
      <KnowledgeImage source={phaseVisual.source} focus={phaseVisual.focus} />
    </View> : null}
    {!catalogReady && state === 'loading' ? <Text accessibilityLiveRegion="polite" style={styles.meta}>Läser in checklistor…</Text> : null}
    {!catalogReady && state === 'error' ? <View style={styles.contextStatus}>
      <Text style={styles.contextStatusText}>Checklistorna kunde inte läsas in.</Text>
      <Button variant="secondary" label="Försök igen" accessibilityLabel="Försök hämta checklistorna igen" onPress={retry} />
    </View> : null}
    {!reviewEnabled && state === 'ready' && !catalogReady ? <Text style={styles.meta}>Inga checklistor publicerade ännu.</Text> : null}
    {catalogReady && templates.length > 0 && !activeTemplate ? <>
      <View style={styles.contextSummary}>
        <View style={styles.contextCopy}>
          <Text style={styles.contextEyebrow}>{unknownAgeDefault ? 'Checklistkontext' : 'Er fas'}</Text>
          <Text style={styles.contextTitle}>{state === 'ready' ? contextSummary : state === 'error' ? 'Valet kunde inte hämtas' : 'Läser in ert val…'}</Text>
          <Text style={styles.contextHint}>{preferencePending ? 'Sparar nytt val…' : unknownAgeDefault ? 'Lägg till hundens födelsedatum för ett åldersförslag, eller välj en fas själv.' : state !== 'ready' ? 'Checklistorna visas när valet har lästs in.' : preferenceSaved ? 'Sparat val' : 'Förslag utifrån hundens ålder'}</Text>
        </View>
        <Button variant="icon" iconName="create-outline" label="Ändra" accessibilityLabel="Ändra checklistornas fas" disabled={busy || state !== 'ready' || uncertain} onPress={() => setContextSheetOpen(true)} />
      </View>
      {state === 'error' ? <View style={styles.contextStatus}><Text style={styles.contextStatusText}>Val och framsteg kunde inte hämtas.</Text><Button variant="secondary" label="Försök igen" accessibilityLabel="Försök hämta checklistorna igen" onPress={retry} /></View> : null}
      {failedContext ? <View style={styles.contextStatus}><Text style={styles.contextStatusText}>Det nya valet kunde inte sparas. Ditt tidigare läge gäller fortfarande.</Text><Button variant="secondary" label="Försök igen" accessibilityLabel="Försök spara samma fasval igen" onPress={retry} /></View> : null}
      {preferenceUncertain ? <View style={styles.contextStatus}><Text style={styles.contextStatusText}>{message || 'Det gick inte att kontrollera om valet sparades.'} Ditt tidigare läge visas tills kontrollen är klar.</Text><Button variant="secondary" label="Kontrollera" accessibilityLabel="Kontrollera om fasvalet sparades" onPress={retry} /></View> : null}
      {state === 'ready' && recommendedTemplate ? <>
        <SectionHeader title="För er just nu" />
        <View style={styles.templateList}>{renderTemplateCard(recommendedTemplate, true)}</View>
        <SectionHeader title="Övriga checklistor" />
      </> : <SectionHeader title="Checklistor" />}
      <View style={styles.templateList}>{otherTemplates.map((template) => {
        const summary = summaries[template.id] ?? { done: 0, total: template.items.length };
        return renderTemplateCard(template, false, summary);
      })}</View>
    </> : null}
    {catalogReady && templates.length > 0 && activeTemplate ? <>
      <Text style={styles.body}>{activeTemplate.intro}</Text>
      <Card accessibilityLabel={`Framsteg för ${activeTemplate.title}`}>
        {state === 'ready' ? <>
          <Progress value={percentage} label={`${done} av ${total} genomförda`} />
          {allItemsComplete ? <Text style={styles.completeLabel}>Alla punkter klara</Text> : null}
          <View style={styles.groupedList}>
            <SectionHeader title="Att göra" />
            {activeTemplate.items.map((item, index) => <View key={item.key} style={[styles.groupedRow, (index < activeTemplate.items.length - 1 || customItems.length > 0) && styles.dividedRow]}>
              <ChecklistItem variant="grouped" label={item.title} checked={progress.has(item.key)} leadingIcon={CHECKLIST_ITEM_ICONS[item.key] ?? 'list-outline'} disabled={busy || uncertain} pending={savingRowKey === `preset:${activeTemplate.id}:${item.key}`} onPress={() => { void togglePreset(item.key); }} />
            </View>)}
            {customItems.length > 0 ? <SectionHeader title="Egna punkter" /> : null}
            {customItems.length === 0 ? <Text style={styles.meta}>Lägg till något som passar er.</Text> : customItems.map((item, index) => <View key={item.id} style={[styles.groupedRow, styles.customRow, index < customItems.length - 1 && styles.dividedRow]}>
              <ChecklistItem variant="grouped" label={item.title} checked={item.completed} leadingIcon={item.icon ?? 'list-outline'} leadingIconTone={checklistIconTone(item.icon ?? 'list-outline')} disabled={busy || uncertain} pending={savingRowKey === `custom:${item.id}`} onPress={() => { void toggleCustom(item); }} />
              <Button variant="icon" label="Ändra" iconName="create-outline" accessibilityLabel={`Ändra ${item.title}`} disabled={busy || uncertain} onPress={() => openEditForm(item)} />
            </View>)}
            <Button label={form ? form.id ? 'Fortsätt redigera punkt' : 'Fortsätt med egen punkt' : 'Lägg till egen punkt'} accessibilityLabel={form ? form.id ? 'Fortsätt redigera egen punkt' : 'Fortsätt med egen punkt' : 'Lägg till egen punkt'} variant="tertiary" disabled={busy || (uncertain && !form)} onPress={openAddForm} />
          </View>
        </> : <Text style={styles.meta}>{state === 'error' ? 'Checklistan kunde inte hämtas. Inga bockar visas som sparade.' : 'Läser in checklistan…'}</Text>}
      </Card>
      {sourceLinks.length > 0 ? <View style={styles.references}>
        <View style={styles.referenceLinks}>
        {sourceLinks.map((source, index) => {
          const metadata = getContentSourceMetadata(source);
          if (!metadata) return null;
          const referenceNumber = index + 1;
          return <Pressable key={source} accessibilityRole="link"
            accessibilityLabel={`Öppna referens ${referenceNumber}: ${metadata.title} (${metadata.publisher})`}
            style={styles.referenceLink} onPress={() => { void openSource(source); }}>
            <Text style={styles.referenceNumber}>{referenceNumber})</Text>
          </Pressable>;
        })}
        </View>
        {sourceMessage ? <Text accessibilityLiveRegion="polite" style={styles.meta}>{sourceMessage}</Text> : null}
      </View> : null}
    </> : null}
    {uncertain && message && !preferenceUncertain && !(form && formSheetOpen) ? <View style={styles.uncertain}><Text style={styles.meta}>{message}</Text><Button variant="secondary" label={busy ? 'Kontrollerar…' : 'Kontrollera'} accessibilityLabel="Kontrollera om ändringen sparades" disabled={busy} onPress={retry} /></View> : null}
    <Toast visible={Boolean(message) && !uncertain && !inlineContextStatus && !(form && formSheetOpen)} tone={messageTone === 'uncertain' ? 'neutral' : messageTone} message={message || undefined} onRetry={retry} onAutoDismiss={() => setMessage('')} autoDismissMs={messageTone === 'success' ? 2500 : undefined} confirmed={messageTone === 'success'} />
    <BottomSheet visible={contextSheetOpen} title="Var är ni just nu?" onRequestClose={closeContextSheet}>
      <Text style={styles.body}>Välj det som passar er. Du kan ändra senare.</Text>
      {CONTEXTS.map((item) => {
        const savingThisContext = preferencePending && pendingOperation?.kind === 'preference' && pendingOperation.context === item.id;
        return <View key={item.id} style={styles.contextOption}>
          <Button variant={context === item.id ? 'secondary' : 'tertiary'} label={item.title} accessibilityLabel={`${savingThisContext ? 'Sparar' : 'Välj'} ${item.title}${context === item.id ? ', nuvarande val' : ''}`} loading={savingThisContext} disabled={busy || state !== 'ready' || uncertain} onPress={() => { void chooseContext(item.id); }} />
          {savingThisContext ? <Text style={styles.contextPending}>Sparar {item.title}…</Text> : null}
        </View>;
      })}
    </BottomSheet>
    <BottomSheet visible={Boolean(form && formSheetOpen)} title={form?.id ? 'Ändra egen punkt' : 'Ny egen punkt'} onRequestClose={closeFormSheet} keyboardAware
      footer={form ? <Button label="Spara" accessibilityLabel="Spara egen punkt" loading={busy} disabled={busy || state !== 'ready' || uncertain} onPress={() => { void saveCustom(); }} /> : null}>
      {form ? <>
      {uncertain && message ? <View style={styles.formStatus}><Text style={styles.contextStatusText}>{message} Ditt utkast och samma sparåtgärd finns kvar.</Text><Button variant="secondary" label={busy ? 'Kontrollerar…' : 'Kontrollera'} accessibilityLabel="Kontrollera om ändringen sparades" disabled={busy} onPress={retry} /></View> : null}
      {busy && pendingOperation && ['add', 'update', 'delete'].includes(pendingOperation.kind) ? <Text accessibilityLiveRegion="polite" style={styles.contextPending}>{pendingOperation.kind === 'delete' ? 'Tar bort punkten…' : 'Sparar punkten…'}</Text> : null}
      {!uncertain && messageTone === 'error' && message ? <Toast visible tone="error" message={message} onRetry={retry} /> : null}
      <View style={styles.formFieldStack}>
      <View style={styles.formFieldRow}>
        <Field containerStyle={styles.formTitleField} label="Punkt" value={form.title} onChangeText={(title) => { setForm((current) => current ? { ...current, title } : current); setFormError(''); }} error={formError} help={formError ? undefined : 'Högst 160 tecken.'} state={busy || uncertain || failedFormAction === 'delete' ? 'disabled' : 'default'} />
        <ChecklistIconPickerTrigger value={form.icon} label={form.title || 'egen punkt'} expanded={iconPickerOpen}
          disabled={busy || uncertain || failedFormAction === 'delete'} testIDPrefix="knowledge-checklist" itemKey={form.id ?? 'new'}
          onToggle={() => setIconPickerOpen((open) => !open)} />
      </View>
      {iconPickerOpen ? <View style={styles.formIconChoices}>
        <ChecklistIconPickerChoices value={form.icon} label={form.title || 'egen punkt'} expanded={iconPickerOpen}
          disabled={busy || uncertain || failedFormAction === 'delete'} testIDPrefix="knowledge-checklist"
          onSelect={(icon) => { setForm((current) => current ? { ...current, icon } : current); setIconPickerOpen(false); }} />
      </View> : null}
      </View>
      {form.id ? <View style={styles.formIconActions}>
        <Button variant="icon" iconName={form.completed ? 'checkbox' : 'square-outline'} label="Klar" accessibilityLabel={form.completed ? 'Markera punkten som inte klar' : 'Markera punkten som klar'} disabled={busy || uncertain || failedFormAction === 'delete'} onPress={() => setForm((current) => current ? { ...current, completed: !current.completed } : current)} />
        <View style={styles.formActionSpacer} />
        <Button variant="icon" iconName="trash-outline" label="Radera" accessibilityLabel={`Radera ${form.title}`} disabled={busy || uncertain || state !== 'ready'} onPress={() => { const item = customItems.find((row) => row.id === form.id); if (item) setDeleteTarget(item); }} />
      </View> : null}
      </> : null}
    </BottomSheet>
    <Dialog visible={discardFormOpen} title="Lämna utan att spara?" onRequestClose={() => setDiscardFormOpen(false)} onConfirm={confirmDiscardForm}
      confirmLabel="Lämna utan att spara" cancelLabel="Fortsätt redigera" compactActions>
      <Text style={styles.body}>Dina ändringar på {form?.title.trim() ? `”${form.title.trim()}”` : 'punkten'} sparas inte.</Text>
    </Dialog>
    <Dialog visible={Boolean(deleteTarget)} title="Radera punkten?" onRequestClose={() => setDeleteTarget(null)} onConfirm={() => { const item = deleteTarget; setDeleteTarget(null); if (item) void removeCustom(item); }}
      confirmLabel="Radera" cancelLabel="Avbryt" compactActions>
      <Text style={styles.body}>{deleteTarget ? `”${deleteTarget.title}” tas bort från checklistan.` : ''}</Text>
    </Dialog>
  </View>;
}

const styles = StyleSheet.create({
  body: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  contextSummary: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding },
  contextCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  contextEyebrow: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  contextTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 },
  contextHint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  contextStatus: { gap: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.dangerBorder, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.dangerSurface, padding: tokens.spacing.md },
  contextStatusText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  contextOption: { gap: tokens.spacing.xs },
  contextPending: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center' },
  formStatus: { gap: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.warningSurface, padding: tokens.spacing.md },
  templateHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  templateList: { gap: tokens.layout.listGap },
  templateIcon: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.destination.knowledge.surface, borderRadius: tokens.radius.full },
  templateCopy: { flex: 1, minWidth: 0 },
  templateTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 },
  templateIntro: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: tokens.spacing.xs },
  groupedList: { marginTop: tokens.spacing.md },
  groupedRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center' },
  dividedRow: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  completeLabel: { ...tokens.typography.label, color: tokens.colors.success, marginTop: tokens.spacing.sm },
  phaseImageFrame: { alignSelf: 'stretch', height: 88, overflow: 'hidden', borderRadius: tokens.radius.md, marginBottom: tokens.spacing.sm },
  references: { marginTop: tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, flexWrap: 'wrap' },
  referenceLinks: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  referenceLink: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  referenceNumber: { ...tokens.typography.smallCaption, color: tokens.colors.primary, textDecorationLine: 'underline' },
  customRow: { gap: tokens.spacing.xs },
  formFieldRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  formFieldStack: { gap: tokens.spacing.xs },
  formIconChoices: { borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.training.card },
  formTitleField: { flex: 1, minWidth: 0 },
  formIconActions: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  formActionSpacer: { flex: 1 },
  uncertain: { gap: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: tokens.spacing.md, marginVertical: tokens.spacing.sm },
});
