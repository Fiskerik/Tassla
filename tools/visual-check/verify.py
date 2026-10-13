from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
from datetime import datetime, timezone
import os
import re
out=Path(os.environ.get('TASSLA_UI_EVIDENCE', str(Path(__file__).resolve().parents[2] / 'docs/design/QA-11/evidence')));out.mkdir(parents=True,exist_ok=True)
results=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 page.clock.install(time=datetime(2026,10,11,15,0,tzinfo=timezone.utc))
 page.on('pageerror',lambda e:errors.append(str(e)))
 def open(screen,extra=''):
  page.goto('http://127.0.0.1:4173/?screen='+screen+extra);page.wait_for_timeout(350)
 def passed(label): results.append(label);print('PASS',label)
 if os.environ.get('TASSLA_UI_SCOPE')=='home':
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  for width in [375,430]:
   page.set_viewport_size({'width':width,'height':844})
   open('home')
   expect(page.get_by_text(re.compile(r'^(?:God morgon!|Hej!|God kväll!)$')).first).to_be_visible()
   expect(page.get_by_text('Luna',exact=False).first).to_be_visible()
   for heading in ['Just nu med Luna','Vad vill du göra nu?']:
    expect(page.get_by_text(heading,exact=True)).to_be_visible()
   if review_mode:
    expect(page.get_by_text('Idag',exact=True)).to_have_count(0)
    for heading in ['Dagens uppgifter']:
     expect(page.get_by_text(heading,exact=True)).to_be_visible()
    expect(page.get_by_text('2 av 5',exact=True)).to_be_visible()
    expect(page.get_by_role('checkbox')).to_have_count(5)
    expect(page.get_by_role('button',name='Visa detaljer: Börja dagen lugnt',exact=True)).to_be_visible()
   else:
    expect(page.get_by_text('Idag',exact=True)).to_be_visible()
    for heading in ['Loggat idag','Nästa träningssteg','Planerat idag']:
     expect(page.get_by_text(heading,exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='12:05, Mat',exact=True)).to_be_visible()
    expect(page.get_by_text('Kiss',exact=True)).to_have_count(0)
    expect(page.get_by_role('button',name='16:30, Vaccination idag',exact=True)).to_be_visible()
    expect(page.get_by_text('Hantering av tassar',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Visa dagens logg')).to_be_visible()
   for label in ['Logga','Träna','Kunskap']:
    expect(page.get_by_role('button',name=f'Öppna {label}',exact=True)).to_be_visible()
   review_banner=page.get_by_text('SYNTETISKT GRANSKNINGSLÄGE',exact=True)
   fixture_checkboxes=page.get_by_role('checkbox')
   if review_mode:
    expect(review_banner).to_be_visible()
    expect(page.get_by_text('2 av 5',exact=True)).to_be_visible()
    expect(fixture_checkboxes).to_have_count(5)
    banner_top=review_banner.bounding_box()['y']
   else:
    expect(review_banner).to_have_count(0)
    expect(page.get_by_text('Dagens uppgifter',exact=True)).to_have_count(0)
    expect(fixture_checkboxes).to_have_count(0)
   selected_tab=page.get_by_role('tab',name='Hem')
   expect(selected_tab).to_have_attribute('aria-selected','true')
   nav_box=page.get_by_role('tablist',name='Huvudmeny').bounding_box()
   assert nav_box is not None
   if review_mode:
    page.screenshot(path=str(out/f'home-ready-{width}.png'))
    for label in ['Öppna Logga','Öppna Träna','Öppna Kunskap']:
     tile=page.get_by_role('button',name=label,exact=True)
     box=tile.bounding_box()
     assert box is not None and box['y']+box['height'] <= nav_box['y']-16,f'{label} lacks 16pt clearance above fixed navigation: {box} / {nav_box}'
    expect(review_banner).to_be_visible()
    page.screenshot(path=str(out/f'home-review-destinations-{width}.png'))
    fixture_checkboxes.nth(4).scroll_into_view_if_needed()
    expect(review_banner).to_be_visible()
    assert review_banner.bounding_box()['y']==banner_top,'review banner moved with Home scroll content'
    fixture_checkboxes.first.click();expect(page.get_by_text('1 av 5',exact=True)).to_be_visible()
    fixture_checkboxes.first.click();expect(page.get_by_text('2 av 5',exact=True)).to_be_visible()
    page.screenshot(path=str(out/f'home-review-fixture-scroll-{width}.png'))
   else:
    above_nav=[page.get_by_text(name,exact=True) for name in ['Loggat idag','Nästa träningssteg','Hantering av tassar','Planerat idag','Visa dagens logg','Vad vill du göra nu?']]
    above_nav += [page.get_by_role('button',name=name,exact=True) for name in ['12:05, Mat','16:30, Vaccination idag','Öppna Logga','Öppna Träna','Öppna Kunskap']]
    for item in above_nav:
     box=item.bounding_box()
     assert box is not None and box['y']+box['height'] <= nav_box['y']-16,f'{item} lacks 16pt clearance above fixed navigation: {box} / {nav_box}'
   if not review_mode:
    expect(page.get_by_text('2 av 5',exact=False)).to_have_count(0)
    expect(page.get_by_text('SYNTETISKT GRANSKNINGSLÄGE',exact=True)).to_have_count(0)
   if not review_mode: page.screenshot(path=str(out/f'home-ready-{width}.png'))
   for scenario in ['loading','error','no-program','all-complete','stale-selection']:
    open('home','&homeScenario='+scenario)
    step=page.get_by_text('Hantering av tassar',exact=True)
    if scenario=='loading' or scenario=='error' or scenario=='no-program' or scenario=='all-complete' or scenario=='stale-selection':
     expect(step).to_have_count(0)
    page.screenshot(path=str(out/f'home-{scenario}-{width}.png'))
   open('home','&state=loading');page.screenshot(path=str(out/f'home-content-loading-{width}.png'))
   open('home','&state=error');expect(page.get_by_role('button',name='Hämta guider igen')).to_be_visible();page.screenshot(path=str(out/f'home-content-error-{width}.png'))
   open('home','&state=empty&homeScenario=all-complete')
   expect(page.get_by_text('Inget loggat idag.',exact=True)).to_be_visible()
   expect(page.get_by_text('Inget planerat idag.',exact=True)).to_be_visible()
   page.screenshot(path=str(out/f'home-empty-{width}.png'))
   passed(f'Home source states and layout at {width}px')
  page.set_viewport_size({'width':375,'height':667});open('home')
  page.screenshot(path=str(out/'home-short-viewport-375.png'))
  if review_mode:
   banner=page.get_by_text('SYNTETISKT GRANSKNINGSLÄGE',exact=True);expect(banner).to_be_visible();banner_top=banner.bounding_box()['y']
  last_tile=page.get_by_role('button',name='Öppna Kunskap',exact=True);last_tile.scroll_into_view_if_needed()
  expect(last_tile).to_be_visible()
  last_tile_box=last_tile.bounding_box();short_nav=page.get_by_role('tablist',name='Huvudmeny').bounding_box()
  assert last_tile_box is not None and short_nav is not None and last_tile_box['y']+last_tile_box['height']<=short_nav['y'],f'short viewport clips the last destination tile: {last_tile_box} / {short_nav}'
  if review_mode:
   expect(banner).to_be_visible();assert banner.bounding_box()['y']==banner_top,'review banner moved in short viewport'
  page.screenshot(path=str(out/'home-short-viewport-scrolled-375.png'))
  page.emulate_media(reduced_motion='reduce')
  for width in [375,430]:
   page.set_viewport_size({'width':width,'height':844})
   open('home')
   large_banner=page.get_by_text('SYNTETISKT GRANSKNINGSLÄGE',exact=True)
   page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   expect(page.get_by_role('button',name='Öppna Logga')).to_be_visible()
   expect(page.get_by_role('button',name='Öppna Träna')).to_be_visible()
   expect(page.get_by_role('button',name='Öppna Kunskap')).to_be_visible()
   if review_mode:
    expect(large_banner).to_be_visible()
    large_banner_top=large_banner.bounding_box()['y']
   page.screenshot(path=str(out/f'home-large-text-reduced-motion-{width}.png'))
   large_last_tile=page.get_by_role('button',name='Öppna Kunskap',exact=True)
   large_last_tile.scroll_into_view_if_needed()
   large_tile_before_scroll=large_last_tile.bounding_box()
   assert large_tile_before_scroll is not None
   page.mouse.move(width/2,large_tile_before_scroll['y']+large_tile_before_scroll['height']/2)
   page.mouse.wheel(0,48)
   page.wait_for_timeout(100)
   expect(large_last_tile).to_be_visible()
   large_tile_box=large_last_tile.bounding_box()
   large_nav=page.get_by_role('tablist',name='Huvudmeny').bounding_box()
   assert large_tile_box is not None and large_nav is not None and large_tile_box['y']+large_tile_box['height']<=large_nav['y'],f'140% text clips the last destination behind fixed navigation at {width}px: {large_tile_box} / {large_nav}'
   if review_mode:
    expect(large_banner).to_be_visible()
    large_banner_box=large_banner.bounding_box()
    assert large_banner_box is not None and large_banner_box['y']==large_banner_top,'review banner moved while revealing the last destination at 140% text'
   page.screenshot(path=str(out/f'home-large-text-scrolled-reduced-motion-{width}.png'))
  page.set_viewport_size({'width':375,'height':844});open('home')
  expect(page.get_by_role('tab',name='Hem')).to_be_visible()
  expect(page.get_by_role('tab',name='Logg')).to_be_visible()
  expect(page.get_by_role('tab',name='Träning')).to_be_visible()
  expect(page.get_by_role('tab',name='Kunskap')).to_be_visible()
  expect(page.get_by_role('tab',name='Mer')).to_be_visible()
  expect(page.get_by_role('tab',name='Hälsa')).to_have_count(0)
  page.get_by_role('button',name='Öppna Logga',exact=True).click();expect(page.get_by_role('tab',name='Logg')).to_have_attribute('aria-selected','true')
  page.get_by_role('tab',name='Hem').click();page.get_by_role('button',name='Öppna Träna',exact=True).click();expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  page.get_by_role('tab',name='Hem').click();page.get_by_role('button',name='Öppna Kunskap',exact=True).click();expect(page.get_by_role('tab',name='Kunskap')).to_have_attribute('aria-selected','true')
  page.get_by_role('tab',name='Mer').click();expect(page.get_by_role('button',name='Hälsa',exact=False)).to_be_visible();expect(page.get_by_role('button',name='Tassla-pass',exact=False)).to_be_visible();expect(page.get_by_role('button',name='Kunskap',exact=False)).to_have_count(0)
  page.screenshot(path=str(out/'home-navigation-more-375.png'))
  open('home','&homeScenario=review-training')
  review_step=page.get_by_text('Hantering av tassar',exact=True)
  review_marker=page.get_by_text(re.compile(r'Tillfälligt exempel – innehållet är inte sakgranskat'))
  if review_mode:
   expect(review_step).to_be_visible();expect(review_marker).to_be_visible();page.screenshot(path=str(out/'home-review-training-375.png'))
  else:
   expect(review_step).to_have_count(0);expect(review_marker).to_have_count(0);page.screenshot(path=str(out/'home-review-training-absent-375.png'))
  assert not errors,errors
  passed('Home navigation, review gate, reduced motion and 140% text')
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Home and shared navigation; synthetic data and React Native Web, not device/backend certification'},ensure_ascii=False,indent=2)+'\n')
  raise SystemExit(0)
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  for screen in ['home','log','training','health','knowledge','passport']:
   open(screen)
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   page.screenshot(path=str(out/f'{screen}-{width}.png'))
  passed(f'Six screens at {width}px; no document horizontal overflow')
 # Home-specific selection and feature-flag states use the same production Home UI.
 review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
 for width in [375,430]:
  page.set_viewport_size({'width':width,'height':844})
  for scenario in ['ready','loading','error','no-program','all-complete','stale-selection']:
   page.goto(f'http://127.0.0.1:4173/?screen=home&homeScenario={scenario}');page.wait_for_timeout(350)
   title=page.get_by_text('Hantering av tassar',exact=True)
   if scenario=='ready': expect(title).to_be_visible()
   else: expect(title).to_have_count(0)
   page.screenshot(path=str(out/f'home-{scenario}-{width}.png'))
   passed(f'Home training {scenario} at {width}px')
  page.goto('http://127.0.0.1:4173/?screen=home&homeScenario=ready');page.wait_for_timeout(350)
  checklist=page.get_by_text('Checklistor för valptiden',exact=True)
  if review_mode: expect(checklist).to_be_visible()
  else: expect(checklist).to_have_count(0)
  page.screenshot(path=str(out/f'home-checklist-{"on" if review_mode else "off"}-{width}.png'))
  passed(f'Home checklist flag {"on" if review_mode else "off"} at {width}px')
 page.set_viewport_size({'width':375,'height':844})
 for scenario in ['ready','loading','error','no-program','all-complete','stale-selection']:
  page.goto(f'http://127.0.0.1:4173/?screen=home&homeScenario={scenario}');page.wait_for_timeout(350)
  page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(out/f'home-{scenario}-375-text-140.png'))
 page.goto('http://127.0.0.1:4173/?screen=home&homeScenario=review-training');page.wait_for_timeout(350)
 review_step=page.get_by_text('Hantering av tassar',exact=True)
 training_example=page.get_by_text(re.compile(r'(?:.* · )?Tillfälligt exempel – innehållet är inte sakgranskat$'))
 if review_mode:
  expect(review_step).to_be_visible();expect(training_example).to_be_visible()
  page.screenshot(path=str(out/'home-review-training-375.png'))
  page.get_by_role('button',name=re.compile('Hantering av tassar.*Tillfälligt exempel')).click()
  expect(page.get_by_text('Syntetiskt granskningsprogram',exact=True)).to_be_visible()
 else:
  expect(review_step).to_have_count(0);expect(training_example).to_have_count(0)
  page.screenshot(path=str(out/'home-review-training-absent-375.png'))
 page.goto('http://127.0.0.1:4173/?screen=home&homeScenario=ready');page.wait_for_timeout(350)
 page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
 checklist=page.get_by_text('Checklistor för valptiden',exact=True)
 if review_mode: expect(checklist).to_be_visible()
 else: expect(checklist).to_have_count(0)
 page.screenshot(path=str(out/f'home-checklist-{"on" if review_mode else "off"}-375-text-140.png'))
 passed('Home states at 375px and 140% text')
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
