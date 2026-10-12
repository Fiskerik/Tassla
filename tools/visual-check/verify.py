from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
import os
from datetime import datetime, timezone
default_out=Path(__file__).resolve().parents[2] / 'docs/design/QA-11/evidence'
out=Path(os.environ.get('TASSLA_UI_EVIDENCE',default_out));out.mkdir(parents=True,exist_ok=True)
base_url=os.environ.get('TASSLA_UI_BASE_URL','http://127.0.0.1:4173')
results=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 page.clock.install(time=datetime(2026,10,11,15,0,tzinfo=timezone.utc))
 page.on('pageerror',lambda e:errors.append(str(e)))
 def open(screen,extra=''):
  page.goto(base_url+'/?screen='+screen+extra);page.wait_for_timeout(350)
 def passed(label): results.append(label);print('PASS',label)
 def apply_large_text():
  page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
 def start_detail(kind,extra=''):
  open('log',extra)
  if kind in ['accident','water']:
   page.get_by_role('button',name='Visa fler loggtyper').click()
  label={'accident':'olycka','food':'mat','water':'vatten'}[kind]
  page.get_by_role('button',name='Logga '+label,exact=True).click()
  expect(page.get_by_role('heading',name={'accident':'Olycka','food':'Mat','water':'Vatten'}[kind])).to_be_visible()
  page.wait_for_timeout(450)
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  for screen in ['home','log','training','health','knowledge','passport']:
   open(screen)
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   page.screenshot(path=str(out/f'{screen}-{width}.png'))
  passed(f'Six screens at {width}px; no document horizontal overflow')
 page.set_viewport_size({'width':390,'height':844})
 open('home');page.get_by_role('tab',name='lördag',exact=False).click();expect(page.get_by_role('button',name='Veterinärbesök, Uppföljning')).to_be_visible();passed('Date strip changes day and content')
 open('log');page.get_by_role('button',name='Visa fler loggtyper').click();expect(page.get_by_role('button',name='Logga promenad',exact=True)).to_be_visible();passed('More log types expand')
 open('log','&state=empty');expect(page.get_by_role('button',name='Visa dina senaste mönster',exact=True)).to_have_count(0);expect(page.get_by_role('button',name='Dölj dina senaste mönster',exact=True)).to_have_count(0);passed('No latest-pattern toggle appears without pattern data')
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844});open('log','&patterns=1')
  toggle=page.get_by_role('button',name='Visa dina senaste mönster',exact=True);expect(toggle).to_be_visible();expect(page.get_by_text('Kiss: 2 gånger',exact=False)).to_have_count(0);toggle.scroll_into_view_if_needed();page.screenshot(path=str(out/f'log-patterns-collapsed-{width}.png'))
  toggle.click();hide=page.get_by_role('button',name='Dölj dina senaste mönster',exact=True);expect(hide).to_be_visible();pattern_text=page.get_by_text('Kiss: 2 gånger',exact=False);expect(pattern_text).to_be_visible();pattern_text.scroll_into_view_if_needed();page.screenshot(path=str(out/f'log-patterns-expanded-{width}.png'));pattern_text.evaluate("el => el.scrollIntoView({block:'center'})");page.screenshot(path=str(out/f'log-patterns-expanded-content-{width}.png'))
  hide.click();expect(page.get_by_role('button',name='Visa dina senaste mönster',exact=True)).to_be_visible();expect(page.get_by_text('Kiss: 2 gånger',exact=False)).to_have_count(0)
  passed(f'Latest-pattern summary is user-controlled at {width}px')
 page.set_viewport_size({'width':390,'height':844})
 open('log');page.get_by_role('button',name='Visa fler loggtyper').click()
 page.screenshot(path=str(out/'log-toast-before-add-375.png'));page.get_by_role('button',name='Logga promenad',exact=True).click();expect(page.get_by_text('Promenad loggat',exact=True)).to_be_visible();page.screenshot(path=str(out/'log-toast-success-375.png'));page.get_by_role('button',name='Ångra',exact=True).click();expect(page.get_by_text('Promenad loggat',exact=True)).to_have_count(0);passed('Quick add, spaced success toast and confirmed undo')
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  open('log');page.get_by_role('button',name='Mat 12:05',exact=False).click();expect(page.get_by_label('Anteckning, högst 500 tecken')).to_be_visible()
  if width == 375:
   page.get_by_label('Anteckning, högst 500 tecken').fill('Efter promenaden');page.get_by_role('button',name='Spara ändring',exact=True).click();expect(page.get_by_role('button',name='Efter promenaden',exact=False)).to_be_visible()
  else:
   page.screenshot(path=str(out/f'log-edit-food-{width}.png'))
  passed(f'Existing food edit sheet at {width}px'+('; saves note and closes' if width == 375 else ''))
 open('log');page.get_by_role('button',name='Vatten 06:20',exact=False).click();ml_radio=page.get_by_role('radio',name='ml',exact=True);dl_radio=page.get_by_role('radio',name='dl',exact=True);assert ml_radio.evaluate('(el)=>getComputedStyle(el).borderColor') != dl_radio.evaluate('(el)=>getComputedStyle(el).borderColor');page.screenshot(path=str(out/'log-edit-water-legacy-375.png'));passed('Legacy water event with a null unit defaults to selected ml in the editor')
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  start_detail('accident');page.screenshot(path=str(out/f'log-accident-sheet-{width}.png'))
  pee=page.get_by_role('checkbox',name='Kiss',exact=True);poop=page.get_by_role('checkbox',name='Bajs',exact=True)
  assert pee.bounding_box()['height']>=44 and poop.bounding_box()['height']>=44
  pee.click();poop.click();page.screenshot(path=str(out/f'log-accident-selected-{width}.png'));page.get_by_role('button',name='Spara detaljer').click();expect(page.get_by_text('Olycka · kiss och bajs',exact=True)).to_be_visible()
  start_detail('food');expect(page.get_by_text('Dina tidigare fodertyper',exact=True)).to_be_visible();page.screenshot(path=str(out/f'log-food-sheet-{width}.png'))
  page.get_by_label('Mängd (valfri)').fill('80');page.get_by_role('button',name='Välj fodertyp Torrfoder A',exact=True).click();page.get_by_role('button',name='Spara detaljer').click();expect(page.get_by_text('Mat · 80 g · Torrfoder A',exact=True)).to_be_visible()
  start_detail('water');page.get_by_label('Mängd (valfri)').fill('200');page.screenshot(path=str(out/f'log-water-sheet-{width}.png'))
  page.get_by_role('radio',name='dl',exact=True).click();expect(page.get_by_label('Mängd (valfri)')).to_have_value('2');page.get_by_role('button',name='Spara detaljer').scroll_into_view_if_needed();page.screenshot(path=str(out/f'log-water-sheet-actions-{width}.png'));page.get_by_role('button',name='Spara detaljer').click();expect(page.get_by_text('Vatten · 2 dl',exact=True)).to_be_visible()
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  passed(f'Accident, food and water detail sheets at {width}px; 44pt checkbox targets and volume conversion')
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  start_detail('food','&detailMutation=pending');page.get_by_label('Mängd (valfri)').fill('80');page.get_by_role('button',name='Spara detaljer').click();expect(page.get_by_text('Sparar…',exact=True).last).to_be_visible();page.screenshot(path=str(out/f'log-detail-pending-{width}.png'));passed(f'Detail patch pending state stays visible at {width}px')
  start_detail('food','&detailMutation=failed');page.get_by_label('Mängd (valfri)').fill('90');page.get_by_role('button',name='Spara detaljer').click();expect(page.get_by_text('Kunde inte spara detaljerna.',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Försök igen',exact=True)).to_be_visible();page.get_by_text('Kunde inte spara detaljerna.',exact=True).scroll_into_view_if_needed();page.screenshot(path=str(out/f'log-detail-failed-{width}.png'));page.get_by_role('button',name='Hoppa över och kasta detaljerna',exact=True).click();expect(page.get_by_text('Kunde inte spara detaljerna.',exact=True)).to_have_count(0);passed(f'Failed detail patch offers retry and explicit skip at {width}px')
  start_detail('water','&detailMutation=unsure');page.get_by_label('Mängd (valfri)').fill('150');page.get_by_role('button',name='Spara detaljer').click();expect(page.get_by_text('Vi kunde inte kontrollera om detaljerna sparades.',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Ångra',exact=True)).to_be_visible();page.get_by_text('Vi kunde inte kontrollera om detaljerna sparades.',exact=True).scroll_into_view_if_needed();page.screenshot(path=str(out/f'log-detail-unsure-{width}.png'));page.get_by_role('button',name='Ångra',exact=True).click();expect(page.get_by_text('Vi kunde inte kontrollera om detaljerna sparades.',exact=True)).to_have_count(0);passed(f'Unsure detail patch offers retry and undo at {width}px')
 start_detail('food','&detailMutation=failed');page.get_by_label('Mängd (valfri)').fill('250');expect(page.get_by_text('Du kan ange högst 2 000 g per loggpost.',exact=True)).to_have_count(0);page.get_by_label('Mängd (valfri)').fill('2001');expect(page.get_by_text('Du kan ange högst 2 000 g per loggpost.',exact=True)).to_be_visible();page.screenshot(path=str(out/'log-detail-validation-375.png'));passed('Food amount limit is stated as a per-entry field bound')
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  open('log');page.get_by_role('button',name='Mat 12:05',exact=False).click();expect(page.get_by_label('Mängd (valfri)')).to_have_value('80');page.wait_for_timeout(450);page.screenshot(path=str(out/f'log-edit-food-{width}.png'));passed(f'Existing food detail can be read and edited at {width}px')
  open('log','&mutation=unsure');page.get_by_role('button',name='Mat 12:05',exact=False).click();page.wait_for_timeout(450);page.get_by_label('Mängd (valfri)').fill('120');page.get_by_role('button',name='Spara ändring',exact=True).click();expect(page.get_by_text('Vi kunde inte kontrollera om ändringen sparades.',exact=True)).to_be_visible();page.wait_for_timeout(450);page.get_by_text('Vi kunde inte kontrollera om ändringen sparades.',exact=True).scroll_into_view_if_needed();page.screenshot(path=str(out/f'log-edit-unsure-{width}.png'));page.get_by_role('button',name='Stäng och fortsätt senare',exact=True).click();expect(page.get_by_text('Vi kunde inte kontrollera om ändringen sparades.',exact=True)).to_be_visible();page.get_by_role('button',name='Mat 12:05',exact=False).click();expect(page.get_by_label('Mängd (valfri)')).to_have_value('120');page.get_by_role('button',name='Försök igen',exact=True).click();expect(page.get_by_role('button',name='Mat · 120 g · Torrfoder A',exact=False)).to_be_visible();passed(f'Uncertain existing edit preserves its draft at {width}px')
  for state in ['failed','unsure']:
   open('log','&mutation='+state);page.get_by_role('button',name='Mat 12:05',exact=False).click();page.get_by_role('button',name='Spara ändring',exact=True).click();expect(page.get_by_role('button',name='Försök igen',exact=True)).to_be_visible();page.get_by_text('Kunde inte spara ändringen.' if state=='failed' else 'Vi kunde inte kontrollera om ändringen sparades.').scroll_into_view_if_needed();page.screenshot(path=str(out/f'log-edit-{state}-{width}.png'));page.get_by_role('button',name='Försök igen',exact=True).click();expect(page.get_by_label('Anteckning, högst 500 tecken')).to_have_count(0);passed(f'Edit {state} recovery remains inside sheet at {width}px')
 open('training');page.get_by_role('button',name='Miljöträning – nya ljud',exact=True).click();page.get_by_role('button',name='Markera övningen som genomförd').click();expect(page.get_by_text('2 av 5 genomförda',exact=True)).to_be_visible();passed('Training completion updates progress')
 open('health');expect(page.get_by_text('Datum har passerat',exact=True)).to_be_visible();page.get_by_role('tab',name='Vaccinationer',exact=True).click();expect(page.get_by_text('Uppföljning',exact=True)).to_have_count(0);page.get_by_role('tab',name='Vikt',exact=True).click();expect(page.get_by_label('Vikt i kilogram')).to_be_visible();page.get_by_role('button',name='Tillbaka',exact=True).click();expect(page.get_by_text('Kommande',exact=True)).to_be_visible();passed('Health filters, overdue plan and weight navigation')
 open('health');expect(page.get_by_text('14:20',exact=True)).to_be_visible();expect(page.get_by_text('10:30',exact=True)).to_be_visible();page.screenshot(path=str(out/'health-times-375.png'));passed('Health history and plan rows render their distinct times')
 open('home','&state=error');expect(page.get_by_text('Tidigare hälsohändelser kunde inte visas.',exact=True)).to_be_visible();page.get_by_role('button',name='Försök igen',exact=True).click();expect(page.get_by_text('Tidigare hälsohändelser kunde inte visas.',exact=True)).to_have_count(0);expect(page.get_by_text('Vaccination valp 2',exact=False)).to_be_visible();page.screenshot(path=str(out/'home-history-retry.png'));passed('Home history error retries and leaves planned events visible')
 page.set_viewport_size({'width':375,'height':844});open('planned');page.screenshot(path=str(out/'planned-health-375.png'));expect(page.get_by_text('Tid 10:30',exact=False)).to_be_visible();
 page.get_by_role('button',name='Välj tid (valfri) från tider',exact=True).click();page.get_by_role('button',name='Välj 08:15',exact=True).click();page.get_by_role('button',name='Avbryt tid',exact=True).click();expect(page.get_by_role('button',name='Bekräfta tid',exact=True)).to_have_count(0);expect(page.get_by_label('Tid (valfri), timmar och minuter')).to_have_value('');
 page.get_by_role('button',name='Välj tid (valfri) från tider',exact=True).click();page.get_by_role('button',name='Välj 08:15',exact=True).click();
 confirm=page.get_by_role('button',name='Bekräfta tid',exact=True);expect(confirm).to_be_visible();box=confirm.bounding_box();assert box and box['y']>=0 and box['y']+box['height']<=844,f'Confirm button outside viewport: {box}';page.screenshot(path=str(out/'time-picker-modal-375.png'));
 confirm.click();expect(page.get_by_role('button',name='Bekräfta tid',exact=True)).to_have_count(0);expect(page.get_by_label('Tid (valfri), timmar och minuter')).to_have_value('08:15');expect(page.get_by_text('Sparat',exact=True)).to_have_count(0);page.get_by_role('button',name='Spara plan',exact=True).click();expect(page.get_by_label('Tid (valfri), timmar och minuter')).to_have_value('');expect(page.get_by_text('Tid 08:15',exact=False)).to_be_visible();page.wait_for_timeout(400);page.screenshot(path=str(out/'planned-health-time-saved-375.png'));passed('Planned time draft cancels or confirms; confirm is viewport-reachable; save displays time')
 action_label='Åtgärder för Planerad vaccination 2026-10-23';actions=page.get_by_role('button',name=action_label,exact=True);expect(actions).to_be_visible();action_box=actions.bounding_box();assert action_box and action_box['width']>=44 and action_box['height']>=44,f'Actions target below 44pt: {action_box}'
 page.evaluate("window.__tasslaAlertActions=['Ändra']");actions.click();expect(page.get_by_role('button',name='Spara rättning',exact=True)).to_be_visible();expect(page.get_by_label('Tid (valfri), timmar och minuter')).to_have_value('10:30');assert page.evaluate('window.__tasslaAlertOptions')==['Ändra','Ta bort','Avbryt'];page.get_by_role('button',name='Avbryt rättning',exact=True).click();passed('Alert edit option loads selected plan and stored time')
 page.evaluate("window.__tasslaAlertActions=['Avbryt']");page.get_by_role('button',name=action_label,exact=True).click();expect(page.get_by_text('Vaccination valp 2',exact=True)).to_be_visible();assert page.evaluate('window.__tasslaAlertOptions')==['Ändra','Ta bort','Avbryt'];passed('Alert cancel option keeps the saved plan')
 page.evaluate("window.__tasslaAlertActions=['Ta bort','Avbryt']");page.get_by_role('button',name=action_label,exact=True).click();expect(page.get_by_text('Vaccination valp 2',exact=True)).to_be_visible();passed('Alert delete opens a confirmation and cancel preserves the plan')
 page.evaluate("window.__tasslaAlertActions=['Ta bort','Ta bort']");page.get_by_role('button',name=action_label,exact=True).click();expect(page.get_by_text('Vaccination valp 2',exact=True)).to_have_count(0);page.screenshot(path=str(out/'planned-health-delete-confirmed-375.png'));passed('Alert delete confirmation invokes the delete callback')
 open('knowledge');page.get_by_role('button',name='Läs En trygg start hemma',exact=True).click();expect(page.get_by_text('En plats att landa',exact=True)).to_be_visible();page.get_by_role('button',name='Tillbaka till guider',exact=True).click();page.get_by_role('tab',name='Checklistor',exact=True).click();expect(page.get_by_role('button',name='Läs En trygg start hemma',exact=True)).to_have_count(0);passed('Article reader, return and category filter')
 open('passport');page.get_by_role('button',name='Välj avsnitt att dela').click();page.get_by_role('checkbox').first.click();page.get_by_role('button',name='Klar',exact=True).click();expect(page.get_by_text('Luna',exact=True)).to_have_count(0);passed('Passport selection changes preview')
 for state in ['empty','loading','error']:
  for screen in ['home','log','health','knowledge','planned']:
   open(screen,'&state='+state);page.screenshot(path=str(out/f'{screen}-{state}.png'))
  passed(f'Loading/empty/error rendering: {state}')
 page.emulate_media(reduced_motion='reduce')
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  start_detail('food');apply_large_text();page.screenshot(path=str(out/f'log-food-sheet-large-text-{width}.png'));assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');page.get_by_role('button',name='Hoppa över detaljer',exact=True).click()
  open('log','&patterns=1');apply_large_text();pattern_toggle=page.get_by_role('button',name='Visa dina senaste mönster',exact=True);pattern_toggle.scroll_into_view_if_needed();page.wait_for_timeout(350);pattern_box=pattern_toggle.bounding_box();assert pattern_box and pattern_box['y']>=0 and pattern_box['y']+pattern_box['height']<=844,f'Pattern toggle outside viewport at {width}px: {pattern_box}';page.screenshot(path=str(out/f'log-patterns-collapsed-large-text-{width}.png'));pattern_toggle.click();pattern_hide=page.get_by_role('button',name='Dölj dina senaste mönster',exact=True);expect(pattern_hide).to_be_visible();pattern_text=page.get_by_text('Kiss: 2 gånger',exact=False);expect(pattern_text).to_be_visible();apply_large_text();pattern_text.scroll_into_view_if_needed();page.wait_for_timeout(350);page.screenshot(path=str(out/f'log-patterns-expanded-large-text-{width}.png'));pattern_text.evaluate("el => el.scrollIntoView({block:'center'})");page.wait_for_timeout(200);page.screenshot(path=str(out/f'log-patterns-expanded-content-large-text-{width}.png'));assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  open('log');page.get_by_role('button',name='Mat 12:05',exact=False).click();page.wait_for_timeout(450);apply_large_text();page.screenshot(path=str(out/f'log-edit-food-large-text-{width}.png'));save_button=page.get_by_role('button',name='Spara ändring',exact=True);save_button.scroll_into_view_if_needed();page.wait_for_timeout(500);expect(save_button).to_be_visible();box=save_button.bounding_box();assert box and box['y']>=0 and box['y']+box['height']<=844,f'Save action outside viewport at {width}px: {box}';page.screenshot(path=str(out/f'log-edit-food-large-text-actions-{width}.png'));assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');page.get_by_role('button',name='Avbryt ändring',exact=True).click()
  passed(f'Food detail sheet and editor at 140% text, {width}px; no horizontal overflow')
 for screen in ['home','log','training','health','knowledge','passport']:
  open(screen)
  apply_large_text()
  page.screenshot(path=str(out/f'{screen}-large-text.png'))
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 passed('Reduced motion preference and 140% text smoke rendering; no document overflow')
 assert not errors,errors
 browser.close()
(out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'React Native Web rendering of production UI; native services stubbed, synthetic data; not device/backend certification'},ensure_ascii=False,indent=2)+'\n')
