from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
from datetime import datetime, timezone
out=Path(__file__).resolve().parents[2] / 'docs/design/QA-11/evidence';out.mkdir(parents=True,exist_ok=True)
results=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 page.clock.install(time=datetime(2026,10,11,15,0,tzinfo=timezone.utc))
 page.on('pageerror',lambda e:errors.append(str(e)))
 def open(screen,extra=''):
  page.goto('http://127.0.0.1:4173/?screen='+screen+extra);page.wait_for_timeout(350)
 def passed(label): results.append(label);print('PASS',label)
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
 page.screenshot(path=str(out/'log-toast-before-add-375.png'));page.get_by_role('button',name='Logga promenad',exact=True).click();expect(page.get_by_text('Promenad loggat',exact=True)).to_be_visible();page.screenshot(path=str(out/'log-toast-success-375.png'));page.get_by_role('button',name='Ångra',exact=True).click();expect(page.get_by_text('Promenad loggat',exact=True)).to_have_count(0);passed('Quick add, spaced success toast and confirmed undo')
 open('log');page.get_by_role('button',name='Mat 12:05',exact=False).click();expect(page.get_by_label('Anteckning, högst 500 tecken')).to_be_visible();page.get_by_label('Anteckning, högst 500 tecken').fill('Efter promenaden');page.get_by_role('button',name='Spara ändring',exact=True).click();expect(page.get_by_text('Efter promenaden',exact=True)).to_be_visible();passed('Edit sheet saves note and closes')
 for state in ['failed','unsure']:
  open('log','&mutation='+state);page.get_by_role('button',name='Mat 12:05',exact=False).click();page.get_by_role('button',name='Spara ändring',exact=True).click();expect(page.get_by_role('button',name='Försök igen',exact=True)).to_be_visible();page.screenshot(path=str(out/f'log-edit-{state}.png'));page.get_by_role('button',name='Försök igen',exact=True).click();expect(page.get_by_label('Anteckning, högst 500 tecken')).to_have_count(0);passed(f'Edit {state} recovery remains inside sheet')
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
 open('knowledge');page.get_by_role('button',name='Läs En trygg start hemma',exact=True).click();expect(page.get_by_text('En plats att landa',exact=True)).to_be_visible();page.get_by_role('button',name='Tillbaka till guider',exact=True).click();page.get_by_role('tab',name='Checklistor',exact=True).click();expect(page.get_by_role('button',name='Läs Inför hemkomsten',exact=True)).to_be_visible();passed('Article reader, return and category filter')
 open('passport');page.get_by_role('button',name='Välj avsnitt att dela').click();page.get_by_role('checkbox').first.click();page.get_by_role('button',name='Klar',exact=True).click();expect(page.get_by_text('Luna',exact=True)).to_have_count(0);passed('Passport selection changes preview')
 for state in ['empty','loading','error']:
  for screen in ['home','log','health','knowledge','planned']:
   open(screen,'&state='+state);page.screenshot(path=str(out/f'{screen}-{state}.png'))
  passed(f'Loading/empty/error rendering: {state}')
 page.emulate_media(reduced_motion='reduce')
 for screen in ['home','log','training','health','knowledge','passport']:
  open(screen)
  page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
  page.screenshot(path=str(out/f'{screen}-large-text.png'))
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 passed('Reduced motion preference and 140% text smoke rendering; no document overflow')
 assert not errors,errors
 browser.close()
(out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'React Native Web rendering of production UI; native services stubbed, synthetic data; not device/backend certification'},ensure_ascii=False,indent=2)+'\n')
