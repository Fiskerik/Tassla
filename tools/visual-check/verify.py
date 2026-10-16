from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
from datetime import datetime, timezone
import os
import re
out=Path(os.environ.get('TASSLA_UI_EVIDENCE', str(Path(__file__).resolve().parents[2] / 'docs/design/QA-11/evidence')));out.mkdir(parents=True,exist_ok=True)
os.environ.setdefault('XDG_CONFIG_HOME','/tmp/tassla-chrome-config')
ui_base=os.environ.get('TASSLA_UI_BASE_URL','http://127.0.0.1:4173/')
results=[];errors=[]
def color_components(value):
 parts=[float(part) for part in re.findall(r"\d+(?:\.\d+)?",value)]
 if len(parts)<3: raise AssertionError(f'Could not parse computed CSS color: {value}')
 return parts[0:3]+([parts[3]] if len(parts)>3 else [1.0])
def luminance(rgb):
 channels=[]
 for channel in rgb:
  value=channel/255
  channels.append(value/12.92 if value<=0.04045 else ((value+0.055)/1.055)**2.4)
 return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2]
def contrast_ratio(foreground,background):
 first=luminance(foreground);second=luminance(background)
 light,dark=max(first,second),min(first,second)
 return (light+0.05)/(dark+0.05)
def training_program_step_title(review_mode): return 'Vila nära' if review_mode else 'En lugn paus'
with sync_playwright() as p:
 launch_options={'headless':True,'args':['--no-sandbox','--disable-crash-reporter','--disable-breakpad']}
 chromium_path=os.environ.get('TASSLA_UI_CHROMIUM')
 if chromium_path: launch_options['executable_path']=chromium_path
 browser=p.chromium.launch(**launch_options)
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 page.clock.install(time=datetime(2026,10,11,15,0,tzinfo=timezone.utc))
 page.on('pageerror',lambda e:errors.append(str(e)))
 def open(screen,extra=''):
  page.goto(f'{ui_base}?screen={screen}{extra}');page.wait_for_timeout(350)
 def passed(label): results.append(label);print('PASS',label)
 if os.environ.get('TASSLA_UI_SCOPE')=='home-checklist':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  for scenario,expected_count in [('checklist-empty',0),('checklist-short',3),('checklist',6)]:
   open('home','&homeScenario='+scenario)
   entry=page.get_by_role('button',name='Visa dagens checklista',exact=True)
   expect(entry).to_be_visible();entry.click()
   expect(page.get_by_text('Idag',exact=True)).to_be_visible()
   if expected_count==0: expect(page.get_by_text('Inget valt för idag',exact=True)).to_be_visible()
   else:
    expect(page.get_by_text(f'{2 if expected_count==3 else 3} av {expected_count} klara',exact=True)).to_be_visible()
    expect(page.get_by_text('Kissa',exact=True)).to_be_visible()
   expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   page.screenshot(path=str(out/f'checklist-entry-{scenario}-375.png'),animations='disabled')
   page.get_by_role('button',name='Tillbaka till Hem',exact=True).click()
   expect(page.get_by_text('Dagens att göra',exact=True)).to_be_visible()
  passed('Home checklist entry is visible for 0, 1–5 and >5 activities and returns to Home')

  page.set_viewport_size({'width':375,'height':844})
  open('home-checklist','&homeScenario=checklist')
  expect(page.get_by_text('Kissa',exact=True)).to_be_visible()
  checklist_date=page.get_by_text(re.compile(r'^Luna · \d{4}-\d{2}-\d{2}$'),exact=True).inner_text()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Välj rutinen Kvällsrutin för idag',exact=True)).to_be_visible()
  page.wait_for_timeout(150)
  page.screenshot(path=str(out/'checklist-manager-375x844.png'),animations='disabled')
  page.get_by_role('button',name='Välj rutinen Kvällsrutin för idag',exact=True).click()
  page.get_by_role('button',name='Klar',exact=True).click()
  expect(page.get_by_text('Idag',exact=True)).to_be_visible()
  expect(page.get_by_text('Borsta tänderna',exact=True)).to_be_visible()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  expect(page.get_by_role('button',name='Ta bort rutinen Kvällsrutin från idag',exact=True)).to_be_visible()
  page.get_by_role('button',name='Ta bort rutinen Kvällsrutin från idag',exact=True).click()
  page.get_by_role('button',name='Klar',exact=True).click()
  expect(page.get_by_text('Idag',exact=True)).to_be_visible()
  expect(page.get_by_text(checklist_date,exact=True)).to_be_visible()
  expect(page.get_by_text('Borsta tänderna',exact=True)).to_have_count(0)
  expect(page.get_by_text('Kissa',exact=True)).to_be_visible()
  passed('Checklist routine manager opens, adds/removes a routine for today and returns to the same date/list')

  for state_name in ['loading','error']:
   open('home','&homeScenario=checklist&state='+state_name)
   expect(page.get_by_role('button',name='Visa dagens checklista',exact=True)).to_be_visible()
   page.get_by_role('button',name='Visa dagens checklista',exact=True).click()
   if state_name=='loading': expect(page.get_by_label('Laddar dagens checklista')).to_be_visible()
   else: expect(page.get_by_text('Dagens checklista kunde inte hämtas. Ingen status räknas just nu.',exact=True)).to_be_visible()
   page.screenshot(path=str(out/f'checklist-{state_name}-375.png'),animations='disabled')
  passed('Checklist loading, empty and read-error states remain distinct')

  open('home','&homeScenario=checklist-unavailable')
  expect(page.get_by_text('3 av 5 bekräftade klara · 1 status kan inte bekräftas',exact=True)).to_be_visible()
  home_progress=page.get_by_role('progressbar',name='3 av 5 bekräftade klara · 1 status kan inte bekräftas i dagens uppgifter')
  expect(home_progress).to_be_visible()
  page.screenshot(path=str(out/'home-progress-unavailable-375.png'),animations='disabled')
  open('home-checklist','&homeScenario=checklist-unavailable')
  expect(page.get_by_text('Källan kunde inte hämtas',exact=True)).to_be_visible()
  expect(page.get_by_text('Status kan inte bekräftas',exact=True)).to_be_visible()
  expect(page.get_by_label('Träningsuppgift: Valt träningssteg kunde inte hämtas, status kan inte bekräftas, Källan kunde inte hämtas')).to_be_visible()
  expect(page.get_by_text('3 av 5 bekräftade klara · 1 status kan inte bekräftas',exact=True)).to_be_visible()
  expect(page.get_by_text('Inte genomförd',exact=True)).to_have_count(0)
  expect(page.get_by_role('button',name=re.compile(r'^Öppna träningssteget '))).to_have_count(0)
  page.screenshot(path=str(out/'checklist-training-unavailable-375.png'),animations='disabled')
  passed('Missing training source remains non-actionable and does not claim unconfirmed completion')

  for width,height in [(375,844),(430,844),(375,667)]:
   page.set_viewport_size({'width':width,'height':height})
   open('home','&homeScenario=checklist')
   page.get_by_role('button',name='Visa dagens checklista',exact=True).click()
   expect(page.get_by_text('6 av 6 klara',exact=False)).to_have_count(0)
   expect(page.get_by_text('Idag',exact=True)).to_be_visible()
   expect(page.get_by_text('Kissa',exact=True)).to_be_visible()
   step_title=training_program_step_title(review_mode)
   expect(page.get_by_role('button',name=f'Öppna träningssteget {step_title}',exact=True)).to_be_visible()
   page.screenshot(path=str(out/f'checklist-ready-{width}x{height}.png'),animations='disabled')
   if width==375 and height==667:
    # Scroll to the bottom of each independent route, then verify the screen restores its offset.
    return_button=page.get_by_role('button',name=f'Öppna träningssteget {step_title}',exact=True)
    return_button.scroll_into_view_if_needed();page.wait_for_timeout(150)
    checklist_offset=page.evaluate("""() => {const el=[...document.querySelectorAll('*')].filter(node=>node.scrollHeight>node.clientHeight+4&&getComputedStyle(node).overflowY==='auto').sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];return el?.scrollTop??0;}""")
    return_button.click();expect(page.get_by_text('Övning',exact=True)).to_be_visible()
    expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
    expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','false')
    page.get_by_role('button',name='Stäng',exact=True).last.click()
    expect(page.get_by_text('Idag',exact=True)).to_be_visible();page.wait_for_timeout(150)
    expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
    restored_offset=page.evaluate("""() => {const el=[...document.querySelectorAll('*')].filter(node=>node.scrollHeight>node.clientHeight+4&&getComputedStyle(node).overflowY==='auto').sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];return el?.scrollTop??0;}""")
    assert abs(restored_offset-checklist_offset)<=3,f'checklist scroll did not restore: {checklist_offset} -> {restored_offset}'
    page.get_by_role('button',name='Tillbaka till Hem',exact=True).click();expect(page.get_by_text('Dagens att göra',exact=True)).to_be_visible()
    page.mouse.move(180,420);page.mouse.wheel(0,100);page.wait_for_timeout(100)
    home_offset=page.evaluate("""() => {const el=[...document.querySelectorAll('*')].filter(node=>node.scrollHeight>node.clientHeight+4&&getComputedStyle(node).overflowY==='auto').sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];return el?.scrollTop??0;}""")
    assert home_offset>0,f'Home fixture did not reach a nonzero scroll position: {home_offset}'
    expect(page.get_by_role('button',name='Visa dagens checklista',exact=True)).to_be_visible()
    page.get_by_role('button',name='Visa dagens checklista',exact=True).click();expect(page.get_by_text('Idag',exact=True)).to_be_visible()
    page.get_by_role('button',name='Tillbaka till Hem',exact=True).click();expect(page.get_by_text('Dagens att göra',exact=True)).to_be_visible()
    page.wait_for_timeout(100)
    restored_home_offset=page.evaluate("""() => {const el=[...document.querySelectorAll('*')].filter(node=>node.scrollHeight>node.clientHeight+4&&getComputedStyle(node).overflowY==='auto').sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];return el?.scrollTop??0;}""")
    assert abs(restored_home_offset-home_offset)<=3,f'Home scroll did not restore after checklist return: {home_offset} -> {restored_home_offset}'
    page.get_by_role('button',name='Visa dagens checklista',exact=True).click();expect(page.get_by_text('Idag',exact=True)).to_be_visible()
    routine_detail=page.get_by_role('button',name='Visa detaljer: Torka tassar',exact=True)
    routine_detail.scroll_into_view_if_needed();page.wait_for_timeout(100)
    manager_list_offset=page.evaluate("""() => {const el=[...document.querySelectorAll('*')].filter(node=>node.scrollHeight>node.clientHeight+4&&getComputedStyle(node).overflowY==='auto').sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];return el?.scrollTop??0;}""")
    assert manager_list_offset>0,f'Checklist fixture did not reach nonzero scroll before manager open: {manager_list_offset}'
    routine_detail.click();expect(page.get_by_role('heading',name='Hantera Promenad',exact=True)).to_be_visible()
    page.get_by_role('button',name='Klar',exact=True).click();expect(page.get_by_text('Idag',exact=True)).to_be_visible();page.wait_for_timeout(100)
    restored_manager_list_offset=page.evaluate("""() => {const el=[...document.querySelectorAll('*')].filter(node=>node.scrollHeight>node.clientHeight+4&&getComputedStyle(node).overflowY==='auto').sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];return el?.scrollTop??0;}""")
    assert abs(restored_manager_list_offset-manager_list_offset)<=3,f'Checklist scroll did not restore after manager close: {manager_list_offset} -> {restored_manager_list_offset}'
   if width in [375,430]:
    page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    open('home-checklist','&homeScenario=checklist')
    page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(out/f'checklist-large-text-{width}.png'),animations='disabled')
  assert not errors,errors
  passed('Exact training-step open/return, checklist and Home scroll restoration, focused routine manager scroll restoration, 3 viewports and 140% text')
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Panel 4 Idag flow; production React Native Web components with synthetic data; not device/backend certification'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)
 if os.environ.get('TASSLA_UI_SCOPE')=='checklist-all':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  def all_viewport(height): return height+(32 if review_mode else 0)
  for width,height,name in [(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]:
   page.set_viewport_size({'width':width,'height':all_viewport(height)})
   open('home-checklist','&homeScenario=checklist-all')
   page.get_by_role('tab',name='Alla',exact=True).click()
   expect(page.get_by_role('heading',name='Alla rutinmallar',exact=True)).to_be_visible()
   expect(page.get_by_role('heading',name='Morgonrutin',exact=True)).to_be_visible()
   expect(page.get_by_role('heading',name='Promenad',exact=True)).to_be_visible()
   expect(page.get_by_role('heading',name='Kvällsrutin',exact=True)).to_be_visible()
   expect(page.get_by_text('Borsta tänderna',exact=True)).to_be_visible()
   expect(page.get_by_text('Vald idag',exact=True)).to_have_count(2)
   expect(page.get_by_role('button',name='Välj för idag: Kvällsrutin',exact=True)).to_be_visible()
   expect(page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True)).to_be_enabled()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   page.screenshot(path=str(out/f'all-templates-{name}.png'),animations='disabled')
  passed('Alla shows each saved template, repeat and day state at 375×844, 430×844 and 375×667')

  page.set_viewport_size({'width':375,'height':all_viewport(844)})
  open('home-checklist','&homeScenario=checklist-all')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Välj för idag: Kvällsrutin',exact=True).click()
  expect(page.get_by_role('heading',name='Kvällsrutin',exact=True)).to_be_visible()
  expect(page.get_by_text('Vald idag',exact=True)).to_have_count(3)
  expect(page.get_by_text('Borsta tänderna',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Välj för idag: Kvällsrutin',exact=True)).to_have_count(0)
  page.screenshot(path=str(out/'all-template-selected-today-375x844.png'),animations='disabled')
  passed('An unselected template can be chosen for today and becomes selected without a duplicate action')

  open('home-checklist','&homeScenario=checklist-all')
  page.get_by_role('tab',name='Alla',exact=True).click()
  morning_item=page.get_by_role('checkbox',name='Rutinpunkt: Morgonrutin, Kissa',exact=True)
  expect(page.get_by_text('1 av 2 punkter klara',exact=True)).to_be_visible()
  morning_item.click()
  expect(page.get_by_text('2 av 2 punkter klara',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'all-selected-routine-completion-375x844.png'),animations='disabled')
  passed('Selected All-view checklist rows use the existing confirmed completion action and day snapshot')

  open('home-checklist','&homeScenario=checklist-all')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Välj rutinen Kvällsrutin för idag',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Ta bort rutinen Morgonrutin från idag',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'all-routine-manager-copy-375x844.png'),animations='disabled')
  page.get_by_role('button',name='Klar',exact=True).click()
  expect(page.get_by_role('heading',name='Alla rutinmallar',exact=True)).to_be_visible()
  passed('Fresh All snapshot reaches the existing manager with explicit today-only choose/remove labels')

  open('home-checklist','&homeScenario=checklist-all-skipped')
  page.get_by_role('tab',name='Alla',exact=True).click()
  expect(page.get_by_text('Överhoppad idag',exact=True)).to_be_visible()
  page.get_by_role('button',name='Välj igen idag: Kvällsrutin',exact=True).click()
  expect(page.get_by_role('button',name='Välj igen idag: Kvällsrutin',exact=True)).to_have_count(0)
  expect(page.get_by_text('Vald idag',exact=True)).to_have_count(3)
  page.screenshot(path=str(out/'all-skipped-routine-restored-375x844.png'),animations='disabled')
  passed('A skipped routine can be restored for today using its existing skip snapshot')

  for workspace_state in ['refreshing','refresh-error','stale']:
   scenario='checklist-all-stale' if workspace_state=='stale' else 'checklist-all'
   open('home-checklist',f'&homeScenario={scenario}&workspaceState={workspace_state}')
   page.get_by_role('tab',name='Alla',exact=True).click()
   expect(page.get_by_role('heading',name='Kvällsrutin',exact=True)).to_be_visible()
   expect(page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True)).to_be_disabled()
   expect(page.get_by_role('button',name=re.compile(r'^Välj (?:för idag|igen idag):'))).to_have_count(0)
   if workspace_state=='refresh-error':
    expect(page.get_by_text('Uppdateringen misslyckades. Visade rutinmallar är senast bekräftade och skrivskyddade.',exact=True)).to_be_visible()
   page.screenshot(path=str(out/f'all-read-only-{workspace_state}-375x844.png'),animations='disabled')
  passed('Refreshing, failed refresh and stale All lists retain content and disable routine writes')

  open('home-checklist','&homeScenario=checklist-all&workspaceState=near-expiry&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.wait_for_timeout(120)
  page.evaluate('''() => {
    const byLabel = label => [...document.querySelectorAll('[aria-label]')].find(element => element.getAttribute('aria-label') === label)
    byLabel('Hantera rutiner och dagens aktiviteter').click()
    byLabel('Välj för idag: Kvällsrutin').click()
    byLabel('Rutinpunkt: Morgonrutin, Kissa').click()
  }''')
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_have_count(0)
  expect(page.get_by_text('Rutinmallarna är skrivskyddade medan listan uppdateras.',exact=True)).to_be_visible()
  expect(page.get_by_text('Vald idag',exact=True)).to_have_count(2)
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('Blocked actions 3 · refreshes 1 · writes 0')
  page.screenshot(path=str(out/'all-event-time-expiry-zero-writes-375x844.png'),animations='disabled')
  passed('A click after the rendered snapshot expires blocks open and add callbacks, makes one shared refresh, and performs zero writes')

  open('home-checklist','&homeScenario=checklist-all&workspaceState=expires-soon&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_be_visible()
  page.clock.run_for(3400)
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_have_count(0)
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('refreshes 1 · writes 0')
  passed('A pristine manager closes when its snapshot expires and the automatic refresh completes')

  open('home-checklist','&homeScenario=checklist-all&workspaceState=expires-soon&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.evaluate("window.__tasslaDeferNextAlert=true;window.__tasslaAlertActions=['Ta bort rutin']")
  page.get_by_role('button',name='Ta bort rutin Morgonrutin',exact=True).click()
  assert page.evaluate('typeof window.__tasslaDelayedAlertConfirm')=='function'
  page.clock.run_for(3400)
  page.evaluate('window.__tasslaDelayedAlertConfirm()')
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('refreshes 1 · writes 0')
  expect(page.get_by_role('heading',name='Morgonrutin',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'all-delayed-delete-confirmation-blocked-after-refresh-375x844.png'),animations='disabled')
  passed('A delete confirmation opened before expiry cannot mutate after the snapshot refreshes; the old session token is rejected')

  open('home-checklist','&homeScenario=checklist-all&workspaceState=expires-soon&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  draft_name=page.get_by_role('textbox',name='Namn på rutin Morgonrutin',exact=True)
  draft_name.fill('Morgonutkast som ska bevaras')
  page.clock.run_for(3400)
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_be_visible()
  expect(page.get_by_role('alert')).to_contain_text('Den här sessionen är skrivskyddad')
  expect(draft_name).to_have_value('Morgonutkast som ska bevaras')
  expect(draft_name).to_have_attribute('readonly','')
  expect(page.get_by_role('button',name='Spara rutin Morgonrutin',exact=True)).to_be_disabled()
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('refreshes 1 · writes 0')
  page.screenshot(path=str(out/'all-dirty-manager-preserved-read-only-375x844.png'),animations='disabled')
  page.get_by_role('button',name='Stäng',exact=True).last.click()
  expect(page.get_by_role('heading',name='Kasta ändringar?',exact=True)).to_be_visible()
  page.get_by_role('button',name='Stäng och kasta osparade ändringar',exact=True).click()
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_have_count(0)
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  expect(page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True)).to_be_enabled()
  page.screenshot(path=str(out/'all-fresh-session-reopens-after-discard-375x844.png'),animations='disabled')
  passed('Dirty manager draft stays visible and read-only after expiry and successful refresh; explicit local discard permits a fresh session')

  open('home-checklist','&homeScenario=checklist-all&workspaceState=expires-soon&routineMutation=delayed-saved&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  page.get_by_role('textbox',name='Namn på rutin Morgonrutin',exact=True).fill('Sparad efter utgång')
  page.get_by_role('button',name='Spara rutin Morgonrutin',exact=True).click()
  page.clock.run_for(3800)
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_be_visible()
  expect(page.get_by_role('alert')).to_contain_text('Den här sessionen är skrivskyddad')
  expect(page.get_by_role('button',name='Redigera rutin Sparad efter utgång',exact=True)).to_be_disabled()
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('refreshes 2 · writes 1')
  page.screenshot(path=str(out/'all-operation-resolves-after-expiry-session-stays-read-only-375x844.png'),animations='disabled')
  passed('A routine update started while fresh may resolve after expiry, but the old manager session stays read-only after readback')

  open('home-checklist','&homeScenario=checklist-all&workspaceState=expires-soon&routineMutation=unknown&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  page.get_by_role('textbox',name='Namn på rutin Morgonrutin',exact=True).fill('Okänt sparresultat')
  page.get_by_role('button',name='Spara rutin Morgonrutin',exact=True).click()
  expect(page.get_by_text('Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.',exact=True)).to_be_visible()
  page.clock.run_for(3400)
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_be_visible()
  expect(page.get_by_role('alert').first).to_contain_text('Den här sessionen är skrivskyddad')
  expect(page.get_by_text('Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.',exact=True).first).to_be_visible()
  expect(page.get_by_role('button',name='Kontrollera samma ändring igen',exact=True)).to_be_disabled()
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('refreshes 1 · writes 0')
  page.screenshot(path=str(out/'all-unknown-mutation-preserved-after-successful-refresh-375x844.png'),animations='disabled')
  passed('An unknown mutation remains visible with retry disabled through a successful snapshot refresh')

  open('home-checklist','&homeScenario=checklist-all&scopeTest=true&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  page.get_by_role('textbox',name='Namn på rutin Morgonrutin',exact=True).fill('Utkast som ska rensas vid scopebyte')
  page.evaluate("document.querySelector('[data-testid=fixture-scope-change]').click()")
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_have_count(0)
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  expect(page.get_by_role('textbox',name='Namn på rutin Morgonrutin',exact=True)).to_have_value('Morgonrutin')
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('writes 0')
  page.screenshot(path=str(out/'all-dirty-session-cleared-on-scope-change-375x844.png'),animations='disabled')
  passed('Changing the scope fixture unmounts a dirty session immediately and a new session has no prior draft')

  open('home-checklist','&homeScenario=checklist-all&scopeTest=true&routineMutation=unknown&guardTest=true')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  page.get_by_role('textbox',name='Namn på rutin Morgonrutin',exact=True).fill('Osäker ändring före scopebyte')
  page.get_by_role('button',name='Spara rutin Morgonrutin',exact=True).click()
  expect(page.get_by_text('Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.',exact=True).first).to_be_visible()
  page.evaluate("document.querySelector('[data-testid=fixture-scope-change]').click()")
  expect(page.get_by_role('heading',name='Rutiner och aktiviteter',exact=True)).to_have_count(0)
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  expect(page.get_by_role('textbox',name='Namn på rutin Morgonrutin',exact=True)).to_have_value('Morgonrutin')
  expect(page.get_by_text('Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.',exact=True)).to_have_count(0)
  expect(page.get_by_test_id('checklist-all-guard-results')).to_contain_text('writes 0')
  page.screenshot(path=str(out/'all-pending-session-cleared-on-scope-change-375x844.png'),animations='disabled')
  passed('A pending/unknown session is cleared on scope change without carrying its draft or retry into the new scope')

  for state_name in ['loading','error']:
   open('home-checklist',f'&homeScenario=checklist-all&state={state_name}')
   page.get_by_role('tab',name='Alla',exact=True).click()
   if state_name=='loading':
    expect(page.get_by_label('Laddar rutinmallar')).to_be_visible()
   else:
    expect(page.get_by_text('Rutinmallarna kunde inte hämtas. Ingen lista visas.',exact=True)).to_be_visible()
   expect(page.get_by_role('heading',name='Morgonrutin',exact=True)).to_have_count(0)
   page.screenshot(path=str(out/f'all-{state_name}-375x844.png'),animations='disabled')
  open('home-checklist','&homeScenario=checklist-all-empty')
  page.get_by_role('tab',name='Alla',exact=True).click()
  expect(page.get_by_text('Inga rutinmallar än',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Skapa en rutinmall',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'all-empty-375x844.png'),animations='disabled')
  passed('All distinguishes loading, read error and a genuinely empty template list')

  page.set_viewport_size({'width':375,'height':all_viewport(844)})
  open('home-checklist','&homeScenario=checklist-all')
  page.get_by_role('tab',name='Alla',exact=True).click()
  page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(out/'all-templates-375x844-text-140.png'),animations='disabled')
  assert not errors,errors
  passed('All template labels and actions fit at 140% text proxy without horizontal overflow')
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Panel 4 Alla routine templates; production React Native Web components with synthetic data; not device/backend certification'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)
 if os.environ.get('TASSLA_UI_SCOPE')=='home':
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  def home_viewport(height): return height+(32 if review_mode else 0)
  for width in [375,430]:
   page.set_viewport_size({'width':width,'height':home_viewport(844)})
   open('home')
   expect(page.get_by_text(re.compile(r'^(?:God morgon!|Hej!|God kväll!)$')).first).to_be_visible()
   expect(page.get_by_text('Luna',exact=False).first).to_be_visible()
   for heading in ['Just nu med Luna','Dagens att göra','Vad vill du göra nu?']:
    expect(page.get_by_text(heading,exact=True)).to_be_visible()
   if review_mode:
    expect(page.get_by_text('Idag',exact=True)).to_have_count(0)
    expect(page.get_by_text('2 av 5 klara',exact=True)).to_be_visible()
    expect(page.get_by_role('checkbox')).to_have_count(4)
    expect(page.get_by_role('button',name='Öppna Rutin Morgonrutin, punkt Kissa',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Miljöträning – nya ljud, inte klar, öppna Träning',exact=True)).to_be_visible()
   else:
    expect(page.get_by_text('Idag',exact=True)).to_have_count(0)
    expect(page.get_by_role('button',name='Hantera dagens aktiviteter',exact=True)).to_be_visible()
    for heading in ['Loggat idag','Nästa träningssteg','Planerat idag']:
     expect(page.get_by_text(heading,exact=True)).to_have_count(0)
   for label in ['Logga','Träna','Kunskap']:
    expect(page.get_by_role('button',name=f'Öppna {label}',exact=True)).to_be_visible()
   expect(page.get_by_text('Standardbild',exact=True)).to_be_visible()
   expect(page.get_by_label('Standardbild',exact=True)).to_be_visible()
   portrait=page.get_by_test_id('home-dog-portrait');portrait_box=portrait.bounding_box()
   badge=page.get_by_test_id('home-portrait-standard-label');badge_box=badge.bounding_box()
   assert portrait_box is not None and badge_box is not None
   assert badge_box['x']>=portrait_box['x'] and badge_box['y']>=portrait_box['y'] and badge_box['x']+badge_box['width']<=portrait_box['x']+portrait_box['width'] and badge_box['y']+badge_box['height']<=portrait_box['y']+portrait_box['height'],f'Standardbild label clipped by portrait at {width}px: {badge_box} / {portrait_box}'
   badge_colors=badge.evaluate('(el)=>{const s=getComputedStyle(el);return {foreground:s.color,background:s.backgroundColor}}')
   badge_fg=color_components(badge_colors['foreground']);badge_bg=color_components(badge_colors['background'])
   badge_contrast=contrast_ratio(badge_fg[:3],badge_bg[:3])
   assert badge_bg[3]>=0.99 and badge_contrast>=4.5,f'Standardbild contrast below 4.5:1 at {width}px: {badge_colors} => {badge_contrast:.2f}:1'
   strip=page.get_by_test_id('home-week-strip');strip_box=strip.bounding_box()
   assert strip_box is not None
   assert strip_box['y']<portrait_box['y']+portrait_box['height'] and strip_box['y']+strip_box['height']>portrait_box['y'],f'week strip does not vertically overlap portrait at {width}px: {strip_box} / {portrait_box}'
   assert strip_box['x']<portrait_box['x']+portrait_box['width'] and strip_box['x']+strip_box['width']>portrait_box['x'],f'week strip does not cross portrait horizontally at {width}px'
   layers=page.evaluate('''() => ({portrait:getComputedStyle(document.querySelector('[data-testid="home-dog-portrait"]')).zIndex,strip:getComputedStyle(document.querySelector('[data-testid="home-week-strip"]')).zIndex})''')
   assert int(layers['strip'])>int(layers['portrait']),f'week strip is not layered over the portrait: {layers}'
   for week in range(8,15):
    item_box=page.get_by_test_id(f'home-week-{week}').bounding_box()
    assert item_box is not None
    marker_center=item_box['x']+item_box['width']/2;fade_start=portrait_box['x']-16;fade_end=portrait_box['x']+portrait_box['width']
    expected=None
    if week!=11 and fade_start<=marker_center<=fade_end:
     z=(marker_center-fade_start)/(fade_end-fade_start)
     expected=0.78 if z<1/3 else 0.56 if z<2/3 else 0.38
    dot_opacity=float(page.get_by_test_id(f'home-week-dot-{week}').evaluate('(el)=>getComputedStyle(el).opacity'))
    assert abs(dot_opacity-(expected if expected is not None else 1.0))<0.02,f'week {week} dot fade does not match measured overlap geometry at {width}px: expected {expected}, got {dot_opacity}'
    wash=page.get_by_test_id(f'home-week-wash-{week}')
    number_wrap=page.get_by_test_id(f'home-week-number-{week}')
    number_bg=color_components(number_wrap.evaluate('(el)=>getComputedStyle(el).backgroundColor'))
    glyph=page.get_by_test_id(f'home-week-glyph-{week}')
    glyph_style=glyph.evaluate('(el)=>{const s=getComputedStyle(el);return {color:s.color,opacity:s.opacity}}')
    glyph_fg=color_components(glyph_style['color'])
    glyph_box=glyph.bounding_box();assert glyph_box is not None
    overlaps_portrait=(glyph_box['x'] < portrait_box['x']+portrait_box['width'] and glyph_box['x']+glyph_box['width'] > portrait_box['x'] and glyph_box['y'] < portrait_box['y']+portrait_box['height'] and glyph_box['y']+glyph_box['height'] > portrait_box['y'])
    if number_bg[3] >= 0.99:
     glyph_bg=number_bg[:3]
    else:
     assert not overlaps_portrait,f'week {week} numeral overlaps the photo without an opaque backing at {width}px: {glyph_box} / {portrait_box}'
     glyph_bg=[245,240,232]
    glyph_contrast=contrast_ratio(glyph_fg[:3],glyph_bg)
    assert float(glyph_style['opacity'])==1.0 and glyph_contrast>=4.5,f'week {week} numeral contrast below 4.5:1 at {width}px: foreground={glyph_style["color"]}, background={glyph_bg}, opacity={glyph_style["opacity"]}, ratio={glyph_contrast:.2f}:1'
    if expected is None:
     expect(wash).to_have_count(0)
    else:
     expect(wash).to_have_count(1)
     wash_color=color_components(wash.evaluate('(el)=>getComputedStyle(el).backgroundColor'))
     assert abs(wash_color[3]-(1-expected))<0.03,f'week {week} canvas wash opacity is wrong: expected {1-expected}, got {wash_color[3]}'
     assert number_bg[3]>=0.99 and number_bg[:3]==[245,240,232],f'week {week} number lacks a solid warm contrast backing: {number_bg}'
   current_dot=float(page.get_by_test_id('home-week-dot-11').evaluate('(el)=>getComputedStyle(el).opacity'))
   current_number_bg=color_components(page.get_by_test_id('home-week-number-11').evaluate('(el)=>getComputedStyle(el).backgroundColor'))
   assert current_dot==1.0 and current_number_bg[:3]==[33,116,72],f'active week marker was faded: opacity={current_dot}, background={current_number_bg}'
   passed(f'Portrait label {badge_contrast:.2f}:1 and measured week-strip fade at {width}px')
   review_banner=page.get_by_text('AI-GENERERAD STANDARDBILD',exact=True)
   fixture_checkboxes=page.get_by_role('checkbox')
   if review_mode:
    expect(review_banner).to_be_visible()
    expect(page.get_by_text('2 av 5 klara',exact=True)).to_be_visible()
    expect(fixture_checkboxes).to_have_count(4)
    banner_top=review_banner.bounding_box()['y']
    banner_box=page.get_by_test_id('review-banner').bounding_box();app_box=page.get_by_test_id('review-app-viewport').bounding_box()
    assert banner_box is not None and banner_box['y']==0 and banner_box['height']==32,f'review banner is not a separate 32px fixture: {banner_box}'
    assert app_box is not None and app_box['y']==32 and app_box['height']==844,f'review app viewport is not 844px below the banner: {app_box}'
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
    page.get_by_role('button',name='Öppna Rutin Morgonrutin, punkt Kissa',exact=True).click()
    expect(page.get_by_role('heading',name='Hantera Morgonrutin',exact=True)).to_be_visible()
    page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
    expect(page.get_by_label('Namn på rutin Morgonrutin')).to_be_visible()
    expect(page.get_by_role('textbox',name='Checklistepunkt 1',exact=True)).to_have_value('Kissa')
    expect(page.get_by_role('button',name='Ta bort rutinen Morgonrutin från idag',exact=True)).to_be_visible()
    page.screenshot(path=str(out/'home-routine-detail-375.png'))
    page.get_by_role('button',name='Avbryt ändring av Morgonrutin',exact=True).click()
    page.get_by_role('button',name='Klar',exact=True).click()
    page.get_by_role('button',name='Hantera rutiner och dagens aktiviteter',exact=True).click()
    expect(page.get_by_text('Lägg till ett träningssteg',exact=True)).to_be_visible()
    expect(page.get_by_text('Vecka 11',exact=True).first).to_be_visible()
    page.screenshot(path=str(out/'home-manager-sheet-375.png'))
    page.get_by_role('button',name='Klar',exact=True).click()
    fixture_checkboxes.nth(3).scroll_into_view_if_needed()
    expect(review_banner).to_be_visible()
    assert review_banner.bounding_box()['y']==banner_top,'review banner moved with Home scroll content'
    fixture_checkboxes.first.click();expect(page.get_by_text('3 av 5 klara',exact=True)).to_be_visible()
    fixture_checkboxes.first.click();expect(page.get_by_text('2 av 5 klara',exact=True)).to_be_visible()
    page.screenshot(path=str(out/f'home-review-fixture-scroll-{width}.png'))
   else:
    above_nav=[page.get_by_text(name,exact=True) for name in ['Just nu med Luna','Dagens att göra','Vad vill du göra nu?']]
    above_nav += [page.get_by_role('button',name=name,exact=True) for name in ['Hantera dagens aktiviteter','Öppna Logga','Öppna Träna','Öppna Kunskap']]
    for item in above_nav:
     box=item.bounding_box()
     assert box is not None and box['y']+box['height'] <= nav_box['y']-16,f'{item} lacks 16pt clearance above fixed navigation: {box} / {nav_box}'
   if not review_mode:
    expect(page.get_by_text('2 av 5 klara',exact=False)).to_have_count(0)
    expect(page.get_by_text('AI-GENERERAD STANDARDBILD',exact=True)).to_have_count(0)
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
   expect(page.get_by_role('button',name='Hantera dagens aktiviteter',exact=True)).to_be_visible()
   page.screenshot(path=str(out/f'home-empty-{width}.png'))
   passed(f'Home source states and layout at {width}px')
  page.set_viewport_size({'width':375,'height':home_viewport(667)});open('home')
  page.screenshot(path=str(out/'home-short-viewport-375.png'))
  if review_mode:
    banner=page.get_by_text('AI-GENERERAD STANDARDBILD',exact=True);expect(banner).to_be_visible();banner_top=banner.bounding_box()['y']
  last_tile=page.get_by_role('button',name='Öppna Kunskap',exact=True);last_tile.scroll_into_view_if_needed()
  expect(last_tile).to_be_visible()
  last_tile_box=last_tile.bounding_box();short_nav=page.get_by_role('tablist',name='Huvudmeny').bounding_box()
  assert last_tile_box is not None and short_nav is not None and last_tile_box['y']+last_tile_box['height']<=short_nav['y'],f'short viewport clips the last destination tile: {last_tile_box} / {short_nav}'
  if review_mode:
   expect(banner).to_be_visible();assert banner.bounding_box()['y']==banner_top,'review banner moved in short viewport'
  page.screenshot(path=str(out/'home-short-viewport-scrolled-375.png'))
  page.emulate_media(reduced_motion='reduce')
  for width in [375,430]:
   page.set_viewport_size({'width':width,'height':home_viewport(844)})
   open('home')
   large_banner=page.get_by_text('AI-GENERERAD STANDARDBILD',exact=True)
   page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   if review_mode:
    banner_metrics=page.get_by_test_id('review-banner').evaluate('''el=>{const text=el.querySelector('[dir="auto"]')||el.firstElementChild;const r=document.createRange();r.selectNodeContents(text);const rects=[...r.getClientRects()];return {lineCount:rects.length,textWidth:Math.max(...rects.map(x=>x.width)),innerWidth:el.clientWidth-32,height:el.clientHeight}}''')
    assert banner_metrics['lineCount']==1 and banner_metrics['textWidth']<=banner_metrics['innerWidth'] and banner_metrics['height']==32,f'AI placeholder banner does not fit on one line at 140% text / {width}px: {banner_metrics}'
   expect(page.get_by_role('button',name='Öppna Logga')).to_be_visible()
   expect(page.get_by_role('button',name='Öppna Träna')).to_be_visible()
   expect(page.get_by_role('button',name='Öppna Kunskap')).to_be_visible()
   large_portrait_box=page.get_by_test_id('home-dog-portrait').bounding_box()
   large_badge=page.get_by_test_id('home-portrait-standard-label');large_badge_box=large_badge.bounding_box()
   assert large_portrait_box is not None and large_badge_box is not None and large_badge_box['x']>=large_portrait_box['x'] and large_badge_box['y']>=large_portrait_box['y'] and large_badge_box['x']+large_badge_box['width']<=large_portrait_box['x']+large_portrait_box['width'] and large_badge_box['y']+large_badge_box['height']<=large_portrait_box['y']+large_portrait_box['height'],f'Standardbild label clips at 140% text at {width}px: {large_badge_box} / {large_portrait_box}'
   expect(large_badge).to_be_visible()
   for week in range(8,15):
    wrap=page.get_by_test_id(f'home-week-number-{week}')
    bg=color_components(wrap.evaluate('(el)=>getComputedStyle(el).backgroundColor'))
    glyph=page.get_by_test_id(f'home-week-glyph-{week}')
    glyph_style=glyph.evaluate('(el)=>{const s=getComputedStyle(el);return {color:s.color,opacity:s.opacity}}')
    glyph_fg=color_components(glyph_style['color'])
    glyph_box=glyph.bounding_box();assert glyph_box is not None
    overlaps_portrait=(glyph_box['x'] < large_portrait_box['x']+large_portrait_box['width'] and glyph_box['x']+glyph_box['width'] > large_portrait_box['x'] and glyph_box['y'] < large_portrait_box['y']+large_portrait_box['height'] and glyph_box['y']+glyph_box['height'] > large_portrait_box['y'])
    if bg[3]>=0.99:
     glyph_bg=bg[:3]
    else:
     assert not overlaps_portrait,f'week {week} numeral overlaps photo without a background at 140% text / {width}px: {glyph_box} / {large_portrait_box}'
     glyph_bg=[245,240,232]
    ratio=contrast_ratio(glyph_fg[:3],glyph_bg)
    assert float(glyph_style['opacity'])==1.0 and ratio>=4.5,f'week {week} numeral contrast below 4.5:1 at 140% text / {width}px: {glyph_style}, {glyph_bg}, {ratio:.2f}:1'
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
  page.set_viewport_size({'width':375,'height':home_viewport(844)});open('home')
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
  if review_mode:
   for mode in ['pending','failed','unknown','readback']:
    open('home','&homeScenario=product-daily&dailyMutation='+mode)
    if mode=='pending':
     expect(page.get_by_text('Sparar…',exact=True)).to_be_visible()
    else:
     expect(page.get_by_role('button',name='Kontrollera ändringen för Kissa igen',exact=True)).to_be_visible()
     if mode=='failed': expect(page.get_by_text('Ändringen sparades inte. Kontrollera anslutningen och försök igen.',exact=True)).to_be_visible()
     if mode=='unknown': expect(page.get_by_text('Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.',exact=True)).to_be_visible()
     if mode=='readback': expect(page.get_by_text('Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.',exact=True)).to_be_visible()
    page.screenshot(path=str(out/f'home-routine-{mode}-375.png'))
    if mode!='pending':
     page.get_by_role('button',name='Kontrollera ändringen för Kissa igen',exact=True).click()
     expect(page.get_by_text('Ändringen sparades inte. Kontrollera anslutningen och försök igen.',exact=True)).to_have_count(0)
   passed('Routine detail sheet and same-row pending/error/unknown recovery')
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
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Home and shared navigation; synthetic data and React Native Web, not device/backend certification'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
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
   page.goto(f'{ui_base}?screen=home&homeScenario={scenario}');page.wait_for_timeout(350)
   title=page.get_by_text('Hantering av tassar',exact=True)
   if scenario=='ready': expect(title).to_be_visible()
   else: expect(title).to_have_count(0)
   page.screenshot(path=str(out/f'home-{scenario}-{width}.png'))
   passed(f'Home training {scenario} at {width}px')
  page.goto(f'{ui_base}?screen=home&homeScenario=ready');page.wait_for_timeout(350)
  checklist=page.get_by_text('Checklistor för valptiden',exact=True)
  if review_mode: expect(checklist).to_be_visible()
  else: expect(checklist).to_have_count(0)
  page.screenshot(path=str(out/f'home-checklist-{"on" if review_mode else "off"}-{width}.png'))
  passed(f'Home checklist flag {"on" if review_mode else "off"} at {width}px')
 page.set_viewport_size({'width':375,'height':844})
 for scenario in ['ready','loading','error','no-program','all-complete','stale-selection']:
  page.goto(f'{ui_base}?screen=home&homeScenario={scenario}');page.wait_for_timeout(350)
  page.evaluate('''() => {document.querySelectorAll('[dir="auto"]').forEach(el => { const s=getComputedStyle(el);el.style.fontSize=(parseFloat(s.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(s.lineHeight)*1.4)+'px'; });}''')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(out/f'home-{scenario}-375-text-140.png'))
 page.goto(f'{ui_base}?screen=home&homeScenario=review-training');page.wait_for_timeout(350)
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
 page.goto(f'{ui_base}?screen=home&homeScenario=ready');page.wait_for_timeout(350)
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
(out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'React Native Web rendering of production UI; native services stubbed, synthetic data; not device/backend certification'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
