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
 if os.environ.get('TASSLA_UI_SCOPE')=='log-sheet-gesture':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='no-preference')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  viewports=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  def sheet_top():
   box=page.get_by_test_id('bottom-sheet-surface').bounding_box()
   assert box is not None,'opt-in sheet surface is visible'
   return box['y']
  def wait_for_sheet_return(start):
   stable_samples=0
   for _ in range(40):
    current=sheet_top()
    if abs(current-start)<=2: stable_samples+=1
    else: stable_samples=0
    if stable_samples>=2: return
    page.wait_for_timeout(50)
   current=sheet_top();assert abs(current-start)<=2,f'denied drag spring returns to its initial position: start={start:.2f}, current={current:.2f}'
  def drag_header(distance,steps=8,dx=0):
   region=page.get_by_test_id('bottom-sheet-drag-region');box=region.bounding_box()
   assert box is not None,'drag region is visible'
   x=box['x']+box['width']/2;y=box['y']+box['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+distance,steps=steps)
   page.wait_for_timeout(40)
   held_top=sheet_top()
   page.mouse.up()
   return held_top
  def touch_drag_header(distance,cancel=False):
   region=page.get_by_test_id('bottom-sheet-drag-region');box=region.bounding_box()
   assert box is not None,'touch drag region is visible'
   x=box['x']+box['width']/2;y=box['y']+box['height']/2
   return page.evaluate('''async ({x,y,distance,cancel})=>{
    const region=document.querySelector('[data-testid="bottom-sheet-drag-region"]');
    const point=(nextY)=>new Touch({identifier:1,target:region,clientX:x,clientY:nextY,pageX:x,pageY:nextY,screenX:x,screenY:nextY});
    const dispatch=(type,nextY,active)=>{const changed=point(nextY);const current=active?[changed]:[];region.dispatchEvent(new TouchEvent(type,{touches:current,targetTouches:current,changedTouches:[changed],bubbles:true,cancelable:true}));};
    dispatch('touchstart',y,true);
    for(let step=1;step<=8;step++){await new Promise(resolve=>setTimeout(resolve,8));dispatch('touchmove',y+distance*step/8,true);}
    const surface=document.querySelector('[data-testid="bottom-sheet-surface"]');const held=surface.getBoundingClientRect().top;
    dispatch(cancel?'touchcancel':'touchend',y+distance,false);
    return held;
   }''',{'x':x,'y':y,'distance':distance,'cancel':cancel})
  def open_log(extra=''):
   page.set_viewport_size({'width':375,'height':844})
   open('log',extra)
   expect(page.get_by_role('tab',name='Logg')).to_have_attribute('aria-selected','true')
  def open_editor():
   page.get_by_role('button',name=re.compile(r'tryck för att ändra')).first.click()
   expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  def change_note(value): page.get_by_label('Anteckning, högst 500 tecken').fill(value)

  page.set_viewport_size({'width':375,'height':844})
  open('sheet-gesture-fixture')
  expect(page.get_by_test_id('bottom-sheet-surface')).to_be_visible()
  start=sheet_top();held=drag_header(40)
  assert held >= start+25,f'held sheet follows finger: start={start}, held={held}'
  assert page.evaluate('window.__tasslaSheetCloseCount()')==0,'held sub-threshold drag has no close callback'
  wait_for_sheet_return(start)
  drag_header(119);wait_for_sheet_return(start)
  assert page.evaluate('window.__tasslaSheetCloseCount()')==0,'short drag does not request close'
  page.screenshot(path=str(out/'sheet-short-drag-returned-375x844.png'),animations='disabled')
  passed('Production BottomSheet tracks a held downward drag and returns below the 120 pt threshold')
  for distance,dx,label in [(-35,0,'upward'),(0,35,'horizontal')]:
   start=sheet_top();drag_header(distance,dx=dx);wait_for_sheet_return(start)
   assert page.evaluate('window.__tasslaSheetCloseCount()')==0,f'{label} movement never requests close'
  passed('Upward and horizontal header movement do not take over or dismiss the sheet')

  open('sheet-gesture-fixture','&denyClose=true')
  start=sheet_top();drag_header(150)
  assert page.evaluate('window.__tasslaSheetCloseCount()')==1,'denied drag requests close once and leaves the controlled sheet visible'
  expect(page.get_by_test_id('bottom-sheet-surface')).to_be_visible()
  region=page.get_by_test_id('bottom-sheet-drag-region');box=region.bounding_box()
  for _ in range(40):
   if box is not None and box['y']+box['height']/2<=page.viewport_size['height']-10: break
   page.wait_for_timeout(10);box=region.bounding_box()
  assert box is not None and box['y']+box['height']/2<=page.viewport_size['height']-10,'drag region becomes reachable before the return spring settles'
  spring_top=sheet_top()
  assert spring_top>=start+20,'the first denied drag is still moving back toward its origin when the next drag begins'
  x=box['x']+box['width']/2;y=box['y']+box['height']/2
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y+8,steps=1);page.wait_for_timeout(16)
  claimed_top=sheet_top()
  assert claimed_top>=start+12 and claimed_top>=spring_top-90,f'new gesture preserves the active spring offset instead of snapping to the sheet origin: origin={start:.2f}, spring={spring_top:.2f}, claimed={claimed_top:.2f}'
  page.mouse.move(x,y+40,steps=2);page.wait_for_timeout(16)
  held_top=sheet_top()
  assert held_top>=claimed_top+16,f'the re-drag continues to follow the finger: claimed={claimed_top:.2f}, held={held_top:.2f}'
  page.screenshot(path=str(out/'sheet-redrag-during-return-spring-375x844.png'),animations='disabled')
  page.mouse.up()
  assert page.evaluate('window.__tasslaSheetCloseCount()')==1,'the sub-threshold re-drag does not request another close'
  expect(page.get_by_test_id('bottom-sheet-surface')).to_be_visible()
  wait_for_sheet_return(start)
  page.screenshot(path=str(out/'sheet-redrag-returned-after-active-spring-375x844.png'),animations='disabled')
  passed('A second header drag interrupts the return spring from its current position without snapping')

  open('sheet-gesture-fixture')
  expect(page.get_by_test_id('bottom-sheet-surface')).to_be_visible()
  drag_header(130)
  assert page.evaluate('window.__tasslaSheetCloseCount()')==1,f'qualifying drag calls the owner once; actual count={page.evaluate("window.__tasslaSheetCloseCount()")}'
  expect(page.get_by_test_id('bottom-sheet-surface')).to_be_hidden()
  passed('A qualifying drag calls the controlled owner exactly once and closes through visible state')

  page.emulate_media(reduced_motion='reduce');page.reload();page.wait_for_timeout(250)
  expect(page.get_by_test_id('bottom-sheet-surface')).to_be_visible()
  start=sheet_top();drag_header(40);page.wait_for_timeout(40)
  assert abs(sheet_top()-start)<=1,'reduced motion resets directly without a spring'
  page.screenshot(path=str(out/'sheet-reduced-motion-returned-375x844.png'),animations='disabled')
  passed('Reduced motion returns the denied drag directly')

  open_log()
  for width,height,label in viewports:
   page.set_viewport_size({'width':width,'height':height});open('log');open_editor()
   expect(page.get_by_test_id('bottom-sheet-drag-region')).to_be_visible()
   assert page.get_by_test_id('bottom-sheet-scroll-view').count()==1
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'editor horizontal overflow at {label}'
   page.screenshot(path=str(out/f'log-editor-clean-{label}.png'),animations='disabled')
   if width==375:
    change_note('Utkast före dragning');page.screenshot(path=str(out/'log-editor-dirty-375x844.png'),animations='disabled')
    scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const s=getComputedStyle(el);const size=parseFloat(s.fontSize);const line=parseFloat(s.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
    assert scaled>0 and page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'140% text proxy remains within the editor viewport'
    page.screenshot(path=str(out/'log-editor-dirty-140-text.png'),animations='disabled')
  passed('Production LogScreen keeps the opt-in editor usable across the target viewport and text matrix')

  open_log();open_editor();clean_start=sheet_top();drag_header(130)
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_have_count(0)
  assert page.evaluate('window.__tasslaLogWriteCount()')==0,'clean editor drag closes without an update write'
  passed('Clean LogScreen editor accepts drag close with no write')

  open_log();open_editor();page.set_viewport_size({'width':375,'height':430})
  note=page.get_by_label('Anteckning, högst 500 tecken');note.fill('Behåll fokusprov');note.focus()
  scroll=page.get_by_test_id('bottom-sheet-scroll-view')
  before=scroll.evaluate('(el)=>({top:el.scrollTop,height:el.clientHeight,content:el.scrollHeight})')
  scroll_box=scroll.bounding_box();assert scroll_box is not None
  page.mouse.move(scroll_box['x']+scroll_box['width']/2,scroll_box['y']+scroll_box['height']/2);page.mouse.wheel(0,220);page.wait_for_timeout(80)
  after=scroll.evaluate('(el)=>({top:el.scrollTop,height:el.clientHeight,content:el.scrollHeight})')
  assert after['content']>after['height'] and after['top']>before['top'],'keyboard-height proxy leaves the editor vertically scrollable'
  note.focus()
  expect(note).to_be_focused()
  focus_before=note.evaluate('(el)=>document.activeElement===el')
  start=sheet_top();held=touch_drag_header(40,cancel=True)
  assert held>=start+25,'touch gesture follows finger before cancellation'
  wait_for_sheet_return(start)
  focus_after=note.evaluate('(el)=>document.activeElement===el')
  expect(note).to_have_value('Behåll fokusprov')
  assert page.evaluate('window.__tasslaLogWriteCount()')==0,'cancelled touch has no update write'
  assert focus_after,'cancelled header drag restores the field that was focused before the gesture'
  focus_probe={'before':focus_before,'after':focus_after,'note':'RN Web focus was restored after the cancelled header drag; native keyboard/focus behavior is not established by this browser check.'}
  page.screenshot(path=str(out/'log-editor-keyboard-proxy-scroll-focus-cancel-375x430.png'),animations='disabled')
  passed('Keyboard-height proxy remains scrollable; cancelled header touch resets, restores focus, and preserves the draft')

  open_log();open_editor();note=page.get_by_label('Anteckning, högst 500 tecken');change_note('Behåll det här utkastet')
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaAlertActions=['Stanna kvar']")
  before_writes=page.evaluate('window.__tasslaLogWriteCount()')
  start=sheet_top();held=drag_header(150)
  assert held>=start+100,'dirty drag follows the finger before release'
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara'],'dirty drag uses the existing discard choices'
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  expect(note).to_have_value('Behåll det här utkastet')
  assert page.evaluate('window.__tasslaLogWriteCount()')==before_writes,'dirty drag creates no mutation'
  page.screenshot(path=str(out/'log-editor-dirty-drag-stay-375x844.png'),animations='disabled')
  passed('Dirty drag preserves the draft, routes to the existing discard prompt and writes nothing')

  open_log();open_editor();note=page.get_by_label('Anteckning, högst 500 tecken');change_note('Kasta endast på uttryckligt val')
  page.evaluate('''() => {
   let current=window.__tasslaAlertOptions ?? [];
   let calls=0;
   Object.defineProperty(window,'__tasslaAlertOptions',{configurable:true,get:()=>current,set:value=>{current=value;calls++;}});
   window.__tasslaAlertCallCount=()=>calls;
   window.__tasslaAlertActions=['Lämna utan att spara'];
   window.__tasslaDeferNextAlert=true;
  }''')
  before_writes=page.evaluate('window.__tasslaLogWriteCount()')
  start=sheet_top();drag_header(150);wait_for_sheet_return(start)
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara'],'drag exposes existing explicit discard choices'
  assert page.evaluate('window.__tasslaAlertCallCount()')==1,'first qualifying dirty drag opens one discard prompt'
  assert page.evaluate('typeof window.__tasslaDelayedAlertConfirm')=='function','the fixture defers the selected discard callback'
  delayed_prompt=page.evaluate('window.__tasslaDelayedAlertConfirm.toString()')
  start=sheet_top();drag_header(150);wait_for_sheet_return(start)
  assert page.evaluate('window.__tasslaAlertCallCount()')==1,'an already-open discard prompt is not duplicated by another drag'
  assert page.evaluate('window.__tasslaDelayedAlertConfirm.toString()')==delayed_prompt,'the existing prompt decision remains authoritative'
  expect(note).to_have_value('Kasta endast på uttryckligt val')
  assert page.evaluate('window.__tasslaLogWriteCount()')==before_writes,'drag and open prompt do not write'
  page.screenshot(path=str(out/'log-editor-dirty-drag-discard-375x844.png'),animations='disabled')
  page.evaluate('window.__tasslaDelayedAlertConfirm()')
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_have_count(0)
  assert page.evaluate('window.__tasslaLogWriteCount()')==before_writes,'explicit discard closes without mutation'
  passed('Dirty drag keeps the draft until explicit discard; an open prompt is not replaced and discard writes nothing')

  for scenario in ['pending','failed','unsure']:
   open_log(f'&editScenario={scenario}');open_editor();change_note(f'Behåll {scenario}')
   page.get_by_role('button',name='Spara ändring',exact=True).click()
   status='Ändringen sparas. Vänta tills resultatet har bekräftats innan du lämnar.' if scenario=='pending' else 'Ändringen sparades inte. Försök igen eller fortsätt redigera.' if scenario=='failed' else 'Vi kunde inte kontrollera om ändringen sparades. Kontrollera status innan du lämnar.'
   expect(page.get_by_text(status,exact=True)).to_be_visible()
   baseline=page.evaluate('window.__tasslaLogWriteCount()')
   page.evaluate('window.__tasslaAlertOptions=[]')
   start=sheet_top();drag_header(150);wait_for_sheet_return(start)
   expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
   expect(page.get_by_label('Anteckning, högst 500 tecken')).to_have_value(f'Behåll {scenario}')
   expect(page.get_by_text(status,exact=True)).to_be_visible()
   assert page.evaluate('window.__tasslaLogWriteCount()')==baseline,f'{scenario} drag creates no extra mutation'
   assert page.evaluate('window.__tasslaAlertOptions.length')==0,f'{scenario} locked state does not open discard prompt'
   page.screenshot(path=str(out/f'log-editor-{scenario}-drag-denied-375x844.png'),animations='disabled')
  passed('Pending, failed and unsure states deny drag closure while preserving draft, recovery and write count')

  open_log()
  page.get_by_role('button',name='Lägg till händelse',exact=True).click()
  expect(page.get_by_role('heading',name='Lägg till händelse',exact=True)).to_be_visible()
  assert page.get_by_test_id('bottom-sheet-drag-region').count()==0,'opt-out sheet has no drag region or responder wrapper'
  assert page.get_by_test_id('bottom-sheet-surface').count()==0,'opt-out sheet has no animated drag wrapper'
  page.screenshot(path=str(out/'log-add-event-opt-out-375x844.png'),animations='disabled')
  passed('The existing Log add-event sheet remains on the legacy opt-out path')
  assert not errors,errors
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'focusProbe':focus_probe,'scope':'Production BottomSheet and LogScreen drag-to-dismiss behavior in synthetic public/review RN Web fixtures','bundle':'review' if review_mode else 'public','viewports':viewports,'limitations':['Native iOS/Android touch, real system keyboard, VoiceOver, Modal/back priority and physical Dynamic Type are NOT TESTABLE','The cancelled RN Web header touch restores the focused textarea; native keyboard/focus behavior must still be checked on a device','Live Supabase/RLS and mutation persistence are not exercised','The 140% text proxy is a web CSS approximation']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)
 if os.environ.get('TASSLA_UI_SCOPE')=='health-history-draft':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  viewports=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  def open_health(width=375,height=844,scenario=''):
   page.set_viewport_size({'width':width,'height':height+44})
   open('health',f'&historyDraftTest=true&historyDraftScenario={scenario}')
   expect(page.get_by_test_id('health-fixture-banner')).to_be_visible()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'health draft fixture overflows horizontally'
  def open_history_entry(name='Vaccination valp 1'):
   page.get_by_text(name,exact=False).click()
   expect(page.get_by_label('Kort anteckning, högst 500 tecken')).to_be_visible()
  for width,height,label in viewports:
   open_health(width,height);open_history_entry()
   page.screenshot(path=str(out/f'health-history-editor-clean-{label}.png'),animations='disabled')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow at {label}'
  open_health();open_history_entry()
  note=page.get_by_label('Kort anteckning, högst 500 tecken');note.fill('Rättad vaccination')
  page.evaluate('window.__tasslaRefreshHealthHistory()')
  expect(note).to_have_value('Rättad vaccination')
  expect(page.get_by_text('Orelaterad uppdatering',exact=False)).to_be_visible()
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaAlertActions=['Stanna kvar']")
  page.get_by_role('button',name='Stäng',exact=True).last.click()
  expect(note).to_have_value('Rättad vaccination')
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara']
  page.screenshot(path=str(out/'health-history-dirty-close-alert-375x844.png'),animations='disabled')
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaAlertActions=['Stanna kvar'];window.__tasslaNavigateMainTab('more')")
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'the active More tab should not prompt'
  page.evaluate("window.__tasslaAlertActions=['Stanna kvar'];window.__tasslaNavigateMainTab('home')")
  expect(note).to_have_value('Rättad vaccination')
  expect(page.get_by_role('tab',name='Mer')).to_have_attribute('aria-selected','true')
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara']
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaNavigateMainTab('home')")
  expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
  passed('Health history sheet close and main-tab route share the discard guard; Stay preserves the draft and same tab is a no-op')

  open_health();open_history_entry();note=page.get_by_label('Kort anteckning, högst 500 tecken');note.fill('Första destination')
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaDeferNextAlert=true;window.__tasslaNavigateMainTab('home')")
  page.evaluate("window.__tasslaNavigateMainTab('more')")
  page.evaluate('window.__tasslaDelayedAlertConfirm()')
  expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
  passed('The first requested route remains authoritative while the discard Alert is open')

  open_health();open_history_entry();note=page.get_by_label('Kort anteckning, högst 500 tecken');note.fill('Första redigering')
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaDeferNextAlert=true")
  page.get_by_role('button',name='Avbryt rättning',exact=True).click()
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara']
  page.evaluate('window.__tasslaChangeHealthScope()')
  open_history_entry();current_note=page.get_by_label('Kort anteckning, högst 500 tecken');current_note.fill('Ny scope-utkast')
  page.evaluate('window.__tasslaDelayedAlertConfirm()')
  expect(current_note).to_have_value('Ny scope-utkast')
  passed('A delayed discard action from the previous account generation cannot close the new health editor')

  page.evaluate("window.__tasslaAlertActions=['Avbryt']")
  page.get_by_role('button',name='Radera händelse',exact=True).click()
  expect(page.get_by_label('Kort anteckning, högst 500 tecken')).to_have_value('Ny scope-utkast')
  assert page.evaluate('window.__tasslaAlertOptions')==['Avbryt','Radera']
  page.get_by_label('Kort anteckning, högst 500 tecken').fill('Sparad rättning')
  page.get_by_role('button',name='Spara rättning',exact=True).click()
  expect(page.get_by_text('Hälsohändelsen uppdaterades.',exact=True)).to_be_visible()
  expect(page.get_by_text('Sparad rättning',exact=False)).to_be_visible()
  toast_box=page.get_by_text('Hälsohändelsen uppdaterades.',exact=True).bounding_box()
  assert toast_box and toast_box['y']>=0 and toast_box['y']+toast_box['height']<=page.viewport_size['height'],'confirmed feedback must remain inside the health viewport'
  page.screenshot(path=str(out/'health-history-update-confirmed-375x844.png'),animations='disabled')
  passed('Delete cancel keeps all draft fields; confirmed update closes once, keeps the refreshed row, and shows parent-owned success feedback')

  open_history_entry('Sparad rättning')
  page.get_by_label('Kort anteckning, högst 500 tecken').fill('Osparad rättning')
  page.evaluate("window.__tasslaAlertActions=['Radera']")
  page.get_by_role('button',name='Radera händelse',exact=True).click()
  assert page.evaluate('window.__tasslaAlertOptions')==['Avbryt','Radera']
  expect(page.get_by_text('Hälsohändelsen raderades.',exact=True)).to_be_visible()
  expect(page.get_by_text('Sparad rättning',exact=False)).to_have_count(0)
  passed('Confirmed delete removes the row and produces a distinct parent-owned confirmation')

  open_health(scenario='type-swap');open_history_entry();note=page.get_by_label('Kort anteckning, högst 500 tecken');note.fill('Utkast vid typbyte')
  page.evaluate('window.__tasslaChangeHealthHistoryType()')
  expect(note).to_have_value('Utkast vid typbyte')
  page.get_by_role('button',name='Spara rättning',exact=True).click()
  expect(page.get_by_text('Vi kunde inte bekräfta ändringen. Kontrollera status innan du försöker igen.',exact=True)).to_be_visible()
  expect(page.get_by_text('Hälsohändelsen uppdaterades.',exact=True)).to_have_count(0)
  page.get_by_role('button',name='Kontrollera status',exact=True).click()
  expect(page.get_by_text('Aktuell sparad version',exact=True)).to_be_visible()
  expect(page.get_by_text('Aktuell veterinärpost',exact=False).last).to_be_visible()
  expect(note).to_have_value('Utkast vid typbyte')
  page.screenshot(path=str(out/'health-history-type-swap-conflict-draft-375x844.png'),animations='disabled')
  page.get_by_role('button',name='Använd aktuell historik och börja om',exact=True).click()
  expect(page.get_by_text('Aktuell veterinärpost',exact=False)).to_be_visible()
  expect(page.get_by_label('Kort anteckning, högst 500 tecken')).to_have_count(0)
  passed('A supported type swap remains a visible conflict, retains the opening draft/type, and requires explicit recovery')

  open_health(scenario='reject-once');open_history_entry();note=page.get_by_label('Kort anteckning, högst 500 tecken');note.fill('Spara efter avslag')
  page.get_by_role('button',name='Spara rättning',exact=True).click()
  expect(page.get_by_text('Ändringen kunde inte sparas. Dina fält finns kvar.',exact=True)).to_be_visible()
  expect(note).to_have_value('Spara efter avslag')
  page.get_by_role('button',name='Spara rättning',exact=True).click()
  expect(page.get_by_text('Hälsohändelsen uppdaterades.',exact=True)).to_be_visible()
  assert page.evaluate('window.__tasslaHealthHistoryWriteCount()')==2,'a rejected write should unlock exactly one explicit retry'
  passed('Rejected writes retain the draft and release the synchronous write-flight for an explicit retry')

  open_health(scenario='reload-error');open_history_entry();note=page.get_by_label('Kort anteckning, högst 500 tecken');note.fill('Bekräftas vid readback')
  page.get_by_role('button',name='Spara rättning',exact=True).click()
  expect(page.get_by_text('Hälsohändelsen uppdaterades.',exact=True)).to_have_count(0)
  expect(page.get_by_text('Vi kunde inte bekräfta ändringen. Kontrollera status innan du försöker igen.',exact=True)).to_be_visible()
  page.get_by_role('button',name='Kontrollera status',exact=True).click()
  expect(page.get_by_text('Hälsohändelsen uppdaterades.',exact=True)).to_be_visible()
  expect(page.get_by_text('Ändringen är sparad, men historiken kunde inte uppdateras.',exact=True)).to_be_visible()
  assert page.get_by_text('Hälsohändelsen uppdaterades.',exact=True).count()==1,'one later confirmation event must produce exactly one toast'
  page.screenshot(path=str(out/'health-history-readback-confirmed-reload-warning-375x844.png'),animations='disabled')
  passed('Unknown update has no early success; exact later confirmation gives one toast and preserves the reload warning')

  open_health(scenario='deferred');open_history_entry();note=page.get_by_label('Kort anteckning, högst 500 tecken');note.fill('Väntande rättning')
  page.get_by_role('button',name='Spara rättning',exact=True).click()
  expect(page.get_by_role('button',name='Sparar…',exact=True)).to_be_disabled()
  page.get_by_role('button',name='Stäng',exact=True).last.click(force=True)
  page.get_by_role('button',name='Sparar…',exact=True).click(force=True)
  assert page.evaluate('window.__tasslaHealthHistoryWriteCount()')==1,'write-flight must reject close and duplicate submission'
  expect(note).to_have_value('Väntande rättning')
  page.screenshot(path=str(out/'health-history-write-flight-draft-375x844.png'),animations='disabled')
  page.evaluate('window.__tasslaResolveHealthHistoryWrite()')
  expect(page.get_by_label('Kort anteckning, högst 500 tecken')).to_have_value('Väntande rättning')
  passed('Synchronous write-flight blocks sheet close and duplicate submission while preserving fields')

  open_health(scenario='unknown');page.get_by_role('button',name='Lägg till hälsohändelse',exact=True).click()
  page.get_by_text('Något som har hänt',exact=True).click()
  page.get_by_label('Kort anteckning, högst 500 tecken').fill('Ny bekräftad händelse')
  page.get_by_role('button',name='Spara händelse',exact=True).click()
  expect(page.get_by_text('Hälsohändelsen lades till.',exact=True)).to_have_count(0)
  page.get_by_role('button',name='Kontrollera status',exact=True).click()
  expect(page.get_by_text('Hälsohändelsen lades till.',exact=True)).to_be_visible()
  assert page.get_by_text('Hälsohändelsen lades till.',exact=True).count()==1
  passed('Unknown create stays open until readback and then reports one parent-owned confirmation')

  open_health();open_history_entry()
  scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const s=getComputedStyle(el);const size=parseFloat(s.fontSize);const line=parseFloat(s.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
  assert scaled>0,'text proxy found no rendered health-history text'
  field_bounds=page.evaluate('''() => [['date','Datum, år-månad-dag','Välj datum i kalender'],['time','Tid (valfri), timmar och minuter','Välj tid (valfri) från tider']].map(([name,inputLabel,buttonLabel])=>{const input=document.querySelector(`[aria-label="${inputLabel}"]`),button=document.querySelector(`[aria-label="${buttonLabel}"]`),row=input?.parentElement;if(!input||!button||!row)return {name,missing:true};const r=row.getBoundingClientRect(),b=button.getBoundingClientRect();return {name,missing:false,withinRow:b.left>=r.left-1&&b.right<=r.right+1,noRowOverflow:row.scrollWidth<=row.clientWidth+1,rowWidth:r.width,rowScrollWidth:row.scrollWidth};})''')
  assert all(not item['missing'] and item['withinRow'] and item['noRowOverflow'] for item in field_bounds),f'140% field control clipping: {field_bounds}'
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'health history overflows at 140% text proxy'
  page.screenshot(path=str(out/'health-history-editor-large-text-140-375x844.png'),animations='disabled')
  passed('Health history editor fits 375px at 140% and both picker buttons remain inside their field rows')

  assert not errors,errors
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Production HealthScreen and HealthHistoryScreen in React Native Web with synthetic callbacks and records; no backend writes','bundle':'review' if review_mode else 'public','viewports':viewports,'limitations':['Native Alert presentation, Android BackHandler, iOS/Android Modal ordering and real device gestures are NOT TESTABLE','Live Supabase/RLS and actual unknown-write/readback timing are NOT TESTABLE','Native VoiceOver/Dynamic Type, physical keyboard and safe-area behavior are NOT TESTABLE','The 140% text proxy is a web CSS approximation']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)
 if os.environ.get('TASSLA_UI_SCOPE')=='profile-draft':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  viewports=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  def open_profile_edit(scenario='',extra='',width=375,height=844):
   page.set_viewport_size({'width':width,'height':height+44})
   query=f'&profileEditScenario={scenario}{extra}'
   open('profile-edit',query)
   expect(page.get_by_test_id('profile-fixture-banner')).to_be_visible()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow for {scenario or "clean"} at {width}x{height}'
  def profile_counts(): return page.evaluate('window.__profileAttributionCounts()')

  open_profile_edit('unknown-removal')
  removal_copy='Vi kunde inte kontrollera om kennelkopplingen togs bort.'
  expect(page.get_by_text(removal_copy,exact=True)).to_be_visible()
  expect(page.get_by_label('Kennelkod, valfri')).to_have_attribute('readonly','')
  expect(page.get_by_label('Kennelkod, valfri')).to_have_value('')
  expect(page.get_by_role('button',name='Stäng',exact=True)).to_be_visible()
  page.get_by_text(removal_copy,exact=True).scroll_into_view_if_needed()
  page.screenshot(path=str(out/'profile-unknown-removal-alone-375x844.png'),animations='disabled',full_page=True)
  expect(page.get_by_role('button',name='Kontrollera kennelkopplingen',exact=True)).to_be_visible()
  page.get_by_role('button',name='Kontrollera kennelkopplingen',exact=True).click()
  expect(page.get_by_label('Kennelkod, valfri')).to_be_enabled()
  assert profile_counts()['reads']==1 and profile_counts()['writes']==0,'readback action must not invoke a write'
  assert profile_counts()['intent'] is None,'exact null readback confirms only the explicit removal intent'
  passed('Unknown removal alone has explicit removal copy, a locked blank field, Stäng, and readback-only null confirmation')

  open_profile_edit('unknown-removal','&profileReadback=linked')
  page.get_by_role('button',name='Kontrollera kennelkopplingen',exact=True).click()
  expect(page.get_by_text('Kopplad till Exempelkennel B.',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Kontrollera kennelkopplingen igen',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Använd den aktuella kennelkopplingen',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'profile-removal-mismatch-current-link-375x844.png'),animations='disabled',full_page=True)
  page.get_by_role('button',name='Använd den aktuella kennelkopplingen',exact=True).click()
  expect(page.get_by_label('Kennelkod, valfri')).to_have_value('XYZ789')
  assert profile_counts()['writes']==0 and profile_counts()['intent'] is None,'use-current must accept the fetched value without writing'
  passed('Removal mismatch displays actual linked server state; Use current adopts it without a write')

  open_profile_edit('unknown-link','&profileReadback=none')
  expect(page.get_by_text('Vi kunde inte kontrollera om kennelkopplingen sparades.',exact=True)).to_be_visible()
  expect(page.get_by_label('Kennelkod, valfri')).to_have_value('ABC123')
  page.get_by_role('button',name='Kontrollera kennelkopplingen',exact=True).click()
  expect(page.get_by_text('Ingen kennelkoppling.',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Kontrollera kennelkopplingen igen',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Använd den aktuella kennelkopplingen',exact=True)).to_be_visible()
  assert profile_counts()['writes']==0 and profile_counts()['intent']['attemptedCode']=='ABC123'
  page.screenshot(path=str(out/'profile-link-mismatch-no-link-375x844.png'),animations='disabled',full_page=True)
  passed('Unknown link has distinct copy; mismatch exposes no-link server state and preserves intent without a write')

  open_profile_edit('unknown-removal-dirty')
  page.get_by_label('Hundens namn',exact=True).fill('Luna ny')
  expect(page.get_by_role('button',name='Avbryt ändringar',exact=True)).to_be_visible()
  page.get_by_text(removal_copy,exact=True).scroll_into_view_if_needed()
  page.screenshot(path=str(out/'profile-removal-with-dirty-profile-375x844.png'),animations='disabled',full_page=True)
  page.get_by_role('button',name='Avbryt ändringar',exact=True).click()
  expect(page.get_by_role('tab',name='Mer')).to_have_attribute('aria-selected','true')
  assert profile_counts()['intent']['attemptedCode'] is None,'discarding local profile fields must leave the parent removal intent intact'
  page.evaluate('window.__fixtureOpenProfileEdit()')
  expect(page.get_by_text(removal_copy,exact=True)).to_be_visible()
  expect(page.get_by_label('Hundens namn',exact=True)).to_have_value('Luna')
  assert profile_counts()['writes']==0
  passed('Dirty profile fields show Avbryt ändringar; leaving discards only those fields and the unknown removal survives revisit')

  open_profile_edit('mismatch-none')
  expect(page.get_by_text('Ingen kennelkoppling.',exact=True)).to_be_visible()
  page.get_by_role('button',name='Använd den aktuella kennelkopplingen',exact=True).click()
  expect(page.get_by_label('Kennelkod, valfri')).to_have_value('')
  assert profile_counts()['writes']==0
  passed('A mismatched saved state with no kennel link is explicit and Use current adopts the empty state')

  for width,height,label in viewports:
   open_profile_edit('',width=width,height=height)
   expect(page.get_by_role('button',name='Stäng',exact=True)).to_be_visible()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow at {label}'
   page.screenshot(path=str(out/f'profile-clean-{label}.png'),animations='disabled')
   if width==375:
    scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const s=getComputedStyle(el);const size=parseFloat(s.fontSize);const line=parseFloat(s.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
    assert scaled>0,'text proxy found no rendered profile text'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'horizontal overflow with 140% text proxy'
    page.screenshot(path=str(out/'profile-clean-large-text-140-375x844.png'),animations='disabled')
  passed('Clean profile editor fits 375x844, 430x844, 375x667, and 140% web text proxy')

  open_profile_edit()
  page.get_by_label('Hundens namn',exact=True).fill('Luna ändrad')
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaNavigateMainTab('more')")
  expect(page.get_by_label('Hundens namn',exact=True)).to_have_value('Luna ändrad')
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'selecting the already active More tab must be a no-op'
  page.evaluate("window.__tasslaAlertActions=['Stanna kvar'];window.__tasslaNavigateMainTab('training')")
  expect(page.get_by_label('Hundens namn',exact=True)).to_have_value('Luna ändrad')
  expect(page.get_by_role('tab',name='Mer')).to_have_attribute('aria-selected','true')
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara']
  page.screenshot(path=str(out/'profile-dirty-discard-alert-375x844.png'),animations='disabled')
  passed('Dirty profile navigation confirms; Stay preserves the form and active tab, same active tab is a no-op')

  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaNavigateMainTab('training')")
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  passed('Confirmed discard commits only the requested main-tab destination')

  open_profile_edit()
  page.get_by_label('Hundens namn',exact=True).fill('Header-utkast')
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaAlertActions=['Stanna kvar']")
  page.get_by_role('button',name='Tillbaka till Mer',exact=True).click()
  expect(page.get_by_label('Hundens namn',exact=True)).to_have_value('Header-utkast')
  expect(page.get_by_role('tab',name='Mer')).to_have_attribute('aria-selected','true')
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara']
  page.screenshot(path=str(out/'profile-header-back-alert-375x844.png'),animations='disabled')
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara']")
  page.get_by_role('button',name='Tillbaka till Mer',exact=True).click()
  expect(page.get_by_role('tab',name='Mer')).to_have_attribute('aria-selected','true')
  assert profile_counts()['writes']==0
  passed('Profile header Back uses the same guard; Stay preserves the draft and explicit discard returns to More without saving')

  open_profile_edit()
  page.get_by_label('Hundens namn',exact=True).fill('Första destination')
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaDeferNextAlert=true;window.__tasslaNavigateMainTab('training')")
  expect(page.get_by_label('Hundens namn',exact=True)).to_have_value('Första destination')
  page.evaluate("window.__tasslaNavigateMainTab('more')")
  page.evaluate('window.__tasslaDelayedAlertConfirm()')
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  passed('The first requested destination remains authoritative while the discard Alert is open')

  open_profile_edit('', '&state=pending')
  expect(page.get_by_role('button',name='Stäng',exact=True)).to_be_visible()
  expect(page.get_by_label('Hundens namn',exact=True)).to_have_attribute('readonly','')
  page.get_by_label('Kennelkod, valfri').fill('ZZZ123')
  expect(page.get_by_role('button',name='Avbryt ändringar',exact=True)).to_be_visible()
  passed('Profile-pending is parent-owned recovery, while a separate dirty kennel code remains locally discardable')

  open_profile_edit('', '&state=saving')
  expect(page.get_by_role('button',name='Stäng',exact=True)).to_be_disabled()
  page.evaluate("window.__tasslaAlertOptions=[];window.__tasslaNavigateMainTab('training')")
  expect(page.get_by_label('Hundens namn',exact=True)).to_be_visible()
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'busy write locks navigation without opening discard confirmation'
  passed('An in-flight profile and attribution write disables every exit path')

  assert not errors,errors
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Production EditDogProfileScreen; public/review React Native Web fixture with synthetic attribution callbacks; no backend writes','bundle':'review' if review_mode else 'public','viewports':viewports,'limitations':['Android BackHandler and native Alert presentation are NOT TESTABLE in RN Web','Live Supabase/RLS and attribution persistence are NOT TESTABLE','Native VoiceOver/Dynamic Type and physical keyboard/gestures are NOT TESTABLE','The 140% text proxy is a web CSS approximation']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)
 if os.environ.get('TASSLA_UI_SCOPE')=='profile-create':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  viewports=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  def open_profile(scenario,width=375,height=844):
   page.set_viewport_size({'width':width,'height':height+44})
   open('profile-create','&breedScenario='+scenario)
   expect(page.get_by_test_id('auth-fixture-banner')).to_be_visible()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow at {width}x{height} for {scenario}'
  def fill_profile_fields():
   page.get_by_label('Hundens namn',exact=True).fill('Nala')
   page.get_by_label('Födelsedatum',exact=True).fill('2026-07-01')
  open_profile('ready')
  guidance=page.get_by_text('Välj en ras för att fortsätta.',exact=True)
  radio=page.get_by_role('radio',name='Golden retriever',exact=True)
  continue_button=page.get_by_role('button',name='Fortsätt',exact=True)
  expect(guidance).to_be_visible()
  expect(page.get_by_role('radiogroup',name='Välj hundras')).to_be_visible()
  expect(page.get_by_role('radio')).to_have_count(1)
  expect(radio).not_to_be_checked()
  expect(continue_button).to_be_disabled()
  page.screenshot(path=str(out/'profile-ready-unselected-375x844.png'),animations='disabled')
  fill_profile_fields()
  expect(continue_button).to_be_disabled()
  radio.click()
  expect(radio).to_be_checked()
  expect(guidance).to_have_count(0)
  expect(continue_button).to_be_enabled()
  expect(page.get_by_label('Kennelkod',exact=True)).to_have_value('')
  page.screenshot(path=str(out/'profile-ready-selected-375x844.png'),animations='disabled')
  passed('A fresh non-empty catalog stays unselected; Continue requires an explicit breed and valid name/date while kennel code stays optional')

  open_profile('empty-then-success')
  expect(page.get_by_text('Raslistan är tom just nu.',exact=True)).to_be_visible()
  expect(page.get_by_role('radio')).to_have_count(0)
  expect(page.get_by_role('button',name='Fortsätt',exact=True)).to_be_disabled()
  page.screenshot(path=str(out/'profile-catalog-empty-375x844.png'),animations='disabled')
  page.get_by_role('button',name='Försök igen',exact=True).click()
  expect(page.get_by_role('radio',name='Golden retriever',exact=True)).to_be_visible()
  expect(page.get_by_text('Välj en ras för att fortsätta.',exact=True)).to_be_visible()
  expect(page.get_by_role('radio',name='Golden retriever',exact=True)).not_to_be_checked()
  page.screenshot(path=str(out/'profile-empty-retry-ready-375x844.png'),animations='disabled')
  passed('A successful empty catalog offers retry without an empty radio group; retry recovers to ready and unselected')

  open_profile('error-then-success')
  expect(page.get_by_text('Raslistan gick inte att hämta. Kontrollera anslutningen och försök igen.',exact=True)).to_be_visible()
  expect(page.get_by_role('radio')).to_have_count(0)
  expect(page.get_by_role('button',name='Fortsätt',exact=True)).to_be_disabled()
  page.screenshot(path=str(out/'profile-catalog-error-375x844.png'),animations='disabled')
  page.get_by_role('button',name='Försök igen',exact=True).click()
  expect(page.get_by_role('radio',name='Golden retriever',exact=True)).to_be_visible()
  expect(page.get_by_text('Välj en ras för att fortsätta.',exact=True)).to_be_visible()
  expect(page.get_by_role('radio',name='Golden retriever',exact=True)).not_to_be_checked()
  passed('Catalog error retry recovers to the ready/unselected state')

  open_profile('error')
  expect(page.get_by_text('Raslistan gick inte att hämta. Kontrollera anslutningen och försök igen.',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Försök igen',exact=True)).to_be_enabled()
  expect(page.get_by_role('radio')).to_have_count(0)
  passed('Persistent catalog failure preserves the existing visible retry state')

  open_profile('loading')
  expect(page.get_by_text('Hämtar raslistan…',exact=True)).to_be_visible()
  expect(page.get_by_role('radio')).to_have_count(0)
  page.screenshot(path=str(out/'profile-catalog-loading-375x844.png'),animations='disabled')
  expect(page.get_by_role('radio',name='Golden retriever',exact=True)).to_be_visible(timeout=8000)
  expect(page.get_by_text('Välj en ras för att fortsätta.',exact=True)).to_be_visible()
  passed('Catalog loading transitions to the ready/unselected state')

  open_profile('selection-preserve')
  preserve_radio=page.get_by_role('radio',name='Golden retriever',exact=True)
  preserve_radio.click()
  expect(preserve_radio).to_be_checked()
  page.evaluate('window.__profileRefetchCatalog()')
  expect(page.get_by_role('radio',name='Golden retriever',exact=True)).to_be_visible()
  expect(page.get_by_role('radio',name='Golden retriever',exact=True)).to_be_checked()
  passed('A harness-only subsequent catalog fetch preserves an existing explicit selection')

  for width,height,label in viewports:
   open_profile('ready',width,height)
   expect(page.get_by_text('Välj en ras för att fortsätta.',exact=True)).to_be_visible()
   expect(page.get_by_role('radio',name='Golden retriever',exact=True)).not_to_be_checked()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow at {label}'
   page.screenshot(path=str(out/f'profile-ready-unselected-{label}.png'),animations='disabled')
   if width==375:
    scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const s=getComputedStyle(el);const size=parseFloat(s.fontSize);const line=parseFloat(s.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
    assert scaled>0,'text proxy found no rendered text nodes'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'horizontal overflow with 140% text proxy'
    page.screenshot(path=str(out/f'profile-large-text-140-{label}.png'),animations='disabled')
  assert not errors,errors
  passed('Ready profile renders at 375x844, 430x844, and 375x667, plus 140% text proxy at 375px without horizontal overflow')
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Onboarding ProfileScreen; public/review React Native Web fixture with synthetic catalog responses; does not prove native accessibility or live profile persistence','bundle':'review' if review_mode else 'public','viewports':viewports,'limitations':['Live Supabase/RLS and profile save/readback are not tested','Native Dynamic Type and VoiceOver are not tested','The 140% text proxy is a web CSS approximation']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)
 if os.environ.get('TASSLA_UI_SCOPE')=='notification-draft':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  viewports=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  def open_reminders(scenario='ready'):
   page.set_viewport_size({'width':375,'height':844})
   open('reminders',f'&reminderScenario={scenario}')
   expect(page.get_by_role('heading',name='Påminnelser',exact=True)).to_be_visible()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'reminder screen has horizontal overflow'
  def counts(): return page.evaluate('window.__tasslaReminderCounters()')
  def dirty_reminder(): page.get_by_role('checkbox',name='Tillåt Tasslas påminnelser på den här enheten').click()

  for width,height,label in viewports:
   open_reminders()
   page.set_viewport_size({'width':width,'height':height})
   page.screenshot(path=str(out/f'reminders-clean-{label}.png'),animations='disabled',full_page=True)
   dirty_reminder()
   expect(page.get_by_role('checkbox',name='Tillåt Tasslas påminnelser på den här enheten')).to_have_attribute('aria-checked','true')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow at {label}'
   page.screenshot(path=str(out/f'reminders-dirty-{label}.png'),animations='disabled',full_page=True)
   if width==375:
    scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const s=getComputedStyle(el);const size=parseFloat(s.fontSize);const line=parseFloat(s.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
    assert scaled>0,'reminder text proxy found no text nodes'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'reminder screen overflows at 140% text proxy'
    page.screenshot(path=str(out/'reminders-dirty-140-text-375x844.png'),animations='disabled',full_page=True)
  passed('Production reminder screen clean/dirty layouts fit 375x844, 430x844, 375x667 and 140% web text proxy')

  open_reminders()
  page.evaluate('window.__tasslaAlertOptions=[];window.__tasslaNavigateMainTab("more")')
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'same active More tab must be a no-op'
  dirty_reminder()
  page.evaluate("window.__tasslaAlertActions=['Stanna kvar']")
  page.get_by_role('button',name='Tillbaka till Mer',exact=True).click()
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara']
  expect(page.get_by_role('heading',name='Påminnelser',exact=True)).to_be_visible()
  expect(page.get_by_role('checkbox',name='Tillåt Tasslas påminnelser på den här enheten')).to_have_attribute('aria-checked','true')
  passed('Same More tab is a no-op; guarded header back Stay keeps the unsaved reminder choice')

  open_reminders()
  dirty_reminder()
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara']")
  page.evaluate('window.__tasslaNavigateMainTab("training")')
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  passed('Explicit discard commits the first requested main tab')

  open_reminders()
  dirty_reminder()
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaDeferNextAlert=true")
  page.evaluate('window.__tasslaNavigateMainTab("training")')
  page.evaluate('window.__tasslaNavigateMainTab("home")')
  page.evaluate('window.__tasslaDelayedAlertConfirm()')
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  passed('Repeated route requests while the Alert is open keep the first destination')

  open_reminders('loading')
  expect(page.get_by_role('button',name='Tillbaka till Mer',exact=True)).to_be_enabled()
  page.get_by_role('button',name='Tillbaka till Mer',exact=True).click()
  expect(page.get_by_role('heading',name='Påminnelser',exact=True)).to_have_count(0)
  passed('Initial preference readiness disables form controls without trapping header navigation')

  open_reminders('permission-deferred')
  dirty_reminder()
  page.get_by_role('button',name='Tillåt påminnelser på telefonen',exact=True).click()
  expect(page.get_by_role('button',name='Kontrollerar tillåtelse för notiser',exact=True)).to_be_disabled()
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaNavigateMainTab('training')")
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  assert counts()['permissions']==1
  page.evaluate("window.__tasslaResolveReminderPermission('granted')")
  passed('A permission request remains separate from the dirty-draft exit guard')

  open_reminders('failed')
  dirty_reminder()
  page.get_by_role('button',name='Spara val',exact=True).click()
  expect(page.get_by_text('Valen kunde inte sparas säkert. Kontrollera status innan du försöker igen.',exact=True)).to_be_visible()
  expect(page.get_by_role('checkbox',name='Tillåt Tasslas påminnelser på den här enheten')).to_have_attribute('aria-checked','true')
  page.screenshot(path=str(out/'reminders-failed-retains-draft-375x844.png'),animations='disabled',full_page=True)
  page.evaluate("window.__tasslaAlertActions=['Stanna kvar']")
  page.get_by_role('button',name='Tillbaka till Mer',exact=True).click()
  expect(page.get_by_role('checkbox',name='Tillåt Tasslas påminnelser på den här enheten')).to_have_attribute('aria-checked','true')
  passed('Failed save keeps the dirty field and requires explicit Stay or discard')

  open_reminders('deferred')
  dirty_reminder()
  save_button=page.get_by_role('button',name='Spara val',exact=True)
  save_button.click()
  expect(page.get_by_role('button',name='Sparar val',exact=True)).to_be_disabled()
  page.evaluate('window.__tasslaAlertOptions=[];window.__tasslaNavigateMainTab("training")')
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'save flight must block navigation without opening discard alert'
  expect(page.get_by_role('heading',name='Påminnelser',exact=True)).to_be_visible()
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaNavigateMainTab('home')")
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'save flight must consume route requests'
  assert counts()['writes']==1,'at most one preference write may be started'
  page.evaluate('window.__tasslaResolveReminderSave(false)')
  expect(page.get_by_text('Valen kunde inte sparas säkert. Kontrollera status innan du försöker igen.',exact=True)).to_be_visible()
  expect(page.get_by_role('checkbox',name='Tillåt Tasslas påminnelser på den här enheten')).to_have_attribute('aria-checked','true')
  page.screenshot(path=str(out/'reminders-save-flight-failed-375x844.png'),animations='disabled',full_page=True)
  passed('Synchronous save flight blocks route work and failure releases the lock without losing fields')

  open_reminders('ready')
  page.get_by_label('Träningspåminnelse, lokal tid, timmar och minuter').fill('08:45')
  page.get_by_role('button',name='Välj träningspåminnelse, lokal tid från tider',exact=True).click()
  page.get_by_role('button',name='Välj 09:00',exact=True).click()
  page.get_by_role('button',name='Avbryt tid',exact=True).click()
  expect(page.get_by_label('Träningspåminnelse, lokal tid, timmar och minuter')).to_have_value('08:45')
  page.get_by_label('Träningspåminnelse, lokal tid, timmar och minuter').fill('08:30')
  page.evaluate('window.__tasslaAlertOptions=[]')
  page.get_by_role('button',name='Tillbaka till Mer',exact=True).click()
  expect(page.get_by_role('heading',name='Påminnelser',exact=True)).to_have_count(0)
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'reverting all fields should make the form clean'
  passed('TimePickerField cancel keeps its uncommitted modal value; reverting to saved HH:mm is clean')

  open_reminders()
  dirty_reminder()
  page.evaluate('window.__tasslaChangeReminderScope()')
  expect(page.get_by_role('checkbox',name='Tillåt Tasslas påminnelser på den här enheten')).to_have_attribute('aria-checked','false')
  page.evaluate('window.__tasslaAlertOptions=[]')
  page.get_by_role('button',name='Tillbaka till Mer',exact=True).click()
  assert page.evaluate('window.__tasslaAlertOptions.length')==0,'scope-key remount should discard the old local draft'
  passed('Existing scope-key change remounts a clean local reminder draft')

  assert not errors,errors
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Production NotificationSettingsScreen; synthetic public/review callbacks, guarded navigation and local reminder draft only','bundle':'review' if review_mode else 'public','viewports':viewports,'limitations':['SecureStore and local scheduled delivery are not exercised','Android BackHandler, native Alert and Modal back priority are NOT TESTABLE in RN Web','Real OS permission prompt and owner/account transitions are not exercised','VoiceOver, Dynamic Type and physical keyboard/safe area are not exercised','The 140% text proxy is a web CSS approximation']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)

 if os.environ.get('TASSLA_UI_SCOPE')=='log-draft':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  viewports=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  def open_log(extra=''):
   page.set_viewport_size({'width':375,'height':844})
   open('log',extra)
   expect(page.get_by_role('tab',name='Logg')).to_have_attribute('aria-selected','true')
  def open_editor():
   page.get_by_role('button',name=re.compile(r'tryck för att ändra')).first.click()
   expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  def change_note(value='Ändrad anteckning'):
   page.get_by_label('Anteckning, högst 500 tecken').fill(value)
  def capture_editor(width,height,label):
   page.set_viewport_size({'width':width,'height':height})
   open('log')
   open_editor()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow at {label}'
   page.screenshot(path=str(out/f'editor-clean-{label}.png'),animations='disabled')
   change_note()
   expect(page.get_by_role('button',name='Spara ändring',exact=True)).to_be_enabled()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'horizontal overflow for dirty editor at {label}'
   page.screenshot(path=str(out/f'editor-dirty-{label}.png'),animations='disabled')
   if width==375:
    scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const s=getComputedStyle(el);const size=parseFloat(s.fontSize);const line=parseFloat(s.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
    assert scaled>0,'text proxy found no rendered text nodes'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'horizontal overflow with 140% text proxy'
    page.screenshot(path=str(out/f'editor-dirty-large-text-140-{label}.png'),animations='disabled')
  for width,height,label in viewports: capture_editor(width,height,label)
  passed('Production LogScreen editor renders clean and dirty states at 375x844, 430x844, 375x667, and with a 140% text proxy at 375px')

  open_log()
  open_editor();change_note('Stanna kvar')
  page.evaluate('window.__tasslaAlertOptions=[]')
  page.evaluate("window.__tasslaNavigateMainTab('log')")
  assert page.evaluate('window.__tasslaAlertOptions?.length ?? 0')==0,'the current tab must be a no-op'
  page.get_by_role('button',name='Stäng',exact=True).last.click()
  assert page.evaluate('window.__tasslaAlertOptions')==['Stanna kvar','Lämna utan att spara']
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  expect(page.get_by_label('Anteckning, högst 500 tecken')).to_have_value('Stanna kvar')
  passed('Same-tab is a no-op; close prompts and Stay preserves editor fields')

  open_log();open_editor();change_note('Bekräftad lämning')
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara']")
  page.evaluate("window.__tasslaNavigateMainTab('training')")
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  passed('Explicit discard commits only the requested tab after confirmation')

  open_log();open_editor();change_note('Första destination')
  page.evaluate("window.__tasslaAlertActions=['Lämna utan att spara'];window.__tasslaDeferNextAlert=true")
  page.evaluate("window.__tasslaNavigateMainTab('training')")
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  page.evaluate("window.__tasslaNavigateMainTab('more')")
  page.evaluate('window.__tasslaDelayedAlertConfirm()')
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  expect(page.get_by_role('tab',name='Mer')).to_have_attribute('aria-selected','false')
  passed('Repeated navigation while Alert is open is ignored; the first destination alone commits')

  for width,height,label in viewports:
   open('log','&editScenario=pending')
   page.set_viewport_size({'width':width,'height':height})
   open_editor();change_note('Pending edit')
   page.get_by_role('button',name='Spara ändring',exact=True).click()
   pending_copy='Ändringen sparas. Vänta tills resultatet har bekräftats innan du lämnar.'
   expect(page.get_by_text(pending_copy,exact=True)).to_have_count(1)
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'pending status overflow at {label}'
   page.screenshot(path=str(out/f'editor-pending-{label}.png'),animations='disabled')
   if width==375:
    scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const s=getComputedStyle(el);const size=parseFloat(s.fontSize);const line=parseFloat(s.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
    assert scaled>0,'pending text proxy found no rendered text nodes'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'pending overflow with 140% text proxy'
    page.screenshot(path=str(out/f'editor-pending-large-text-140-{label}.png'),animations='disabled')
  passed('Locked pending status renders across the viewport matrix and 140% text proxy')

  open_log('&editScenario=pending');open_editor();change_note('Pending edit')
  page.get_by_role('button',name='Spara ändring',exact=True).click()
  pending='Ändringen sparas. Vänta tills resultatet har bekräftats innan du lämnar.'
  expect(page.get_by_text(pending,exact=True)).to_have_count(1)
  page.get_by_role('button',name='Stäng',exact=True).last.click()
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  assert page.evaluate('window.__tasslaAlertOptions?.length ?? 0')==0,'locked close must not prompt'
  passed('Pending save displays one locked status and prevents sheet close without prompting')

  open_log('&editScenario=failed');open_editor();change_note('Keep failed draft')
  page.get_by_role('button',name='Spara ändring',exact=True).click()
  expect(page.get_by_text('Ändringen sparades inte. Försök igen eller fortsätt redigera.',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Fortsätt redigera',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'editor-failed-375x844.png'),animations='disabled')
  page.get_by_role('button',name='Fortsätt redigera',exact=True).click()
  expect(page.get_by_role('heading',name='Ändra händelse',exact=True)).to_be_visible()
  expect(page.get_by_label('Anteckning, högst 500 tecken')).to_have_value('Keep failed draft')
  expect(page.get_by_text('Ändringen sparades inte. Försök igen eller fortsätt redigera.',exact=True)).to_have_count(0)
  passed('Failed save has one truthful Toast; Continue editing clears only failure intent and preserves fields')

  open_log('&editScenario=unsure');open_editor();change_note('Keep unknown draft')
  page.get_by_role('button',name='Spara ändring',exact=True).click()
  expect(page.get_by_text('Vi kunde inte kontrollera om ändringen sparades. Kontrollera status innan du lämnar.',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Försök igen',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Fortsätt redigera',exact=True)).to_have_count(0)
  expect(page.get_by_label('Anteckning, högst 500 tecken')).to_have_value('Keep unknown draft')
  page.screenshot(path=str(out/'editor-unsure-375x844.png'),animations='disabled')
  passed('Unknown save outcome offers readback/retry only and keeps the draft locked')

  open_log('&mutation=failed')
  expect(page.get_by_role('button',name='Avbryt',exact=True)).to_be_visible()
  passed('Existing Toast consumers keep the default Avbryt label')
  assert not errors,errors
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'Production LogScreen dirty draft protection and shared navigation gate in a synthetic public/review RN Web fixture','bundle':'review' if review_mode else 'public','viewports':viewports,'limitations':['Native Alert appearance and Android system-back are not tested','Live Supabase mutation/readback, VoiceOver, Dynamic Type, physical swipe/keyboard behavior, and app build are not tested','The 140% text proxy is a web CSS approximation']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise SystemExit(0)

 if os.environ.get('TASSLA_UI_SCOPE')=='home-training-target':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  sizes=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  for width,height,label in sizes:
   page.set_viewport_size({'width':width,'height':height})
   open('home','&homeScenario=training-target')
   row=page.get_by_role('button',name=re.compile(r'^Träningsuppgift: .*öppna Träning$'))
   expect(row).to_be_visible()
   page.screenshot(path=str(out/f'home-training-target-home-{label}.png'),animations='disabled')
   row.scroll_into_view_if_needed()
   row.click()
   expect(page.get_by_text('Övning',exact=True)).to_be_visible()
   expect(page.get_by_role('region',name='\u00d6vning').get_by_text(training_program_step_title(review_mode),exact=True)).to_be_visible()
   expect(page.get_by_role('button',name='Tillbaka till Hem',exact=True)).to_be_visible()
   expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   page.screenshot(path=str(out/f'home-training-target-detail-{label}.png'),animations='disabled')
   page.get_by_role('region',name='\u00d6vning').get_by_role('button',name='St\u00e4ng',exact=True).click()
   expect(page.get_by_text('Dagens att göra',exact=True)).to_be_visible()
   expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
   expect(page.get_by_text('Luna | Golden retriever',exact=True)).to_be_visible()
   passed(f'Exact Home training target opens and returns to Home at {label}')

  open('home','&homeScenario=training-target-stale')
  page.evaluate('window.__staleHomeTrainingTarget()')
  page.wait_for_timeout(100)
  row=page.get_by_role('button',name=re.compile(r'^Träningsuppgift: .*öppna Träning$'))
  expect(row).to_be_visible()
  row.click()
  expect(page.get_by_text('Dagens att göra',exact=True)).to_be_visible()
  expect(page.get_by_text('Uppgiften har ändrats. Öppna dagens checklista för att se det aktuella valet.',exact=True)).to_be_visible()
  expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','false')
  page.screenshot(path=str(out/'home-training-target-stale-feedback-375x844.png'),animations='disabled')
  passed('Stale exact source stays on Home and gives row-local truthful feedback')

  open('home','&homeScenario=training-target-missing')
  home_region=page.get_by_role('region',name='Dagens att göra')
  assert 'Valt träningssteg kunde inte hämtas' in home_region.inner_text()
  expect(page.get_by_role('button',name=re.compile(r'^Träningsuppgift: Valt träningssteg kunde inte hämtas'))).to_have_count(0)
  page.set_viewport_size({'width':375,'height':844})
  page.screenshot(path=str(out/'home-training-target-missing-source-375x844.png'),animations='disabled')
  passed('Missing exact source is rendered as non-actionable text without button semantics')

  open('home','&homeScenario=training-target')
  page.get_by_role('tab',name='Träning').click()
  expect(page.get_by_role('tab',name='Träning')).to_have_attribute('aria-selected','true')
  expect(page.get_by_role('button',name='Tillbaka till Hem',exact=True)).to_have_count(0)
  expect(page.get_by_role('button',name='Tillbaka till dagens checklista',exact=True)).to_have_count(0)
  passed('Home general Training destination remains generic')

  open('home','&homeScenario=training-target')
  page.set_viewport_size({'width':375,'height':844})
  scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const style=getComputedStyle(el);const size=parseFloat(style.fontSize);const line=parseFloat(style.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
  assert scaled>0,'Home text proxy found no rendered text'
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'Home training target overflows at 140% text proxy'
  page.screenshot(path=str(out/'home-training-target-large-text-140-375x844.png'),animations='disabled')
  passed('Home training target fits 375x844 at 140% web text proxy')
  assert not errors,errors
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'R3a exact Home training target, origin return, stale-source race and missing-source semantics in synthetic public/review RN Web','bundle':'review' if review_mode else 'public','viewports':sizes+[(375,844,'140% text proxy')],'limitations':['Fixtures use synthetic content and callbacks','Live Supabase/RLS, native iOS/Android, VoiceOver, physical gestures and installed app are NOT TESTABLE','The 140% text proxy is a web approximation']},ensure_ascii=False,indent=2)+chr(10),encoding='utf-8')
  raise SystemExit(0)

 if os.environ.get('TASSLA_UI_SCOPE')=='checklist-week':
  page.set_default_timeout(8000)
  page.emulate_media(reduced_motion='reduce')
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  viewports=[(375,844,'375x844'),(430,844,'430x844'),(375,667,'375x667')]
  day_pattern=re.compile(r'^(måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag) \d+(, idag)?$')
  def open_week(extra=''):
   open('home-checklist','&homeScenario=checklist'+extra)
   expect(page.get_by_test_id('checklist-fixture-banner')).to_be_visible()
   expect(page.get_by_role('tab',name='Idag',exact=True)).to_be_visible()
   expect(page.get_by_role('tab',name='Denna vecka',exact=True)).to_be_visible()
   page.get_by_role('tab',name='Denna vecka',exact=True).click()
   expect(page.get_by_text('Veckans sparade aktiviteter',exact=True)).to_be_visible()
   dates=page.get_by_role('button',name=day_pattern)
   expect(dates).to_have_count(7)
   return dates
  for width,height,label in viewports:
   page.set_viewport_size({'width':width,'height':height})
   open_week()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'weekly view overflows at {label}'
   for index in range(7):
    date_button=page.get_by_role('button',name=day_pattern).nth(index)
    box=date_button.bounding_box()
    assert box and box['width']>=44 and box['height']>=44,f'date target below 44pt at {label}: {box}'
    text_colors=date_button.evaluate('''node => {const background=getComputedStyle(node).backgroundColor;return [...node.querySelectorAll('[dir="auto"]')].map(text=>({foreground:getComputedStyle(text).color,background}));}''')
    assert text_colors and min(contrast_ratio(color_components(item['foreground']),color_components(item['background'])) for item in text_colors)>=4.5,f'date text contrast below 4.5:1 at {label}'
   page.screenshot(path=str(out/f'checklist-week-ready-{label}.png'),animations='disabled')
  passed('Weekly selector exposes seven accessible dates with 44pt targets at 375x844, 430x844, and 375x667')

  open_week()
  page.get_by_role('button',name=re.compile(r'^måndag \d+$')).click()
  expect(page.get_by_text('Sparad rutin från tidigare dag',exact=True)).to_be_visible()
  expect(page.get_by_text('Historisk rutinpunkt',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name=re.compile(r'^Öppna träningssteget '))).to_have_count(0)
  assert page.get_by_text('Gammal veckorad',exact=True).count()==0,'a raw weekly today row is not rendered on a historical day'
  page.screenshot(path=str(out/'checklist-week-historical-read-only-375x844.png'),animations='disabled')
  passed('Historical saved snapshots are shown read-only; training has no button semantics or open affordance')

  page.get_by_role('button',name=re.compile(r'^fredag \d+$')).click()
  expect(page.get_by_text('Ingen sparad dagslista',exact=True)).to_be_visible()
  open_week('&weekScenario=timezone-mismatch')
  page.get_by_role('button',name=re.compile(r'^måndag \d+$')).click()
  expect(page.get_by_text(re.compile(r'Tidszon skiljer sig'))).to_be_visible()
  page.screenshot(path=str(out/'checklist-week-timezone-mismatch-375x844.png'),animations='disabled')
  passed('Missing days and timezone-mismatched history remain distinct and unconfirmed')

  open_week('&weekScenario=error')
  expect(page.get_by_text('Veckans sparade aktiviteter kunde inte hämtas. Ingen veckostatus räknas just nu.',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Hämta veckans sparade aktiviteter igen',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'checklist-week-read-error-375x844.png'),animations='disabled')
  open_week('&state=error')
  expect(page.get_by_text('Dagens checklista kunde inte hämtas. Veckans rådata används inte för idag.',exact=True)).to_be_visible()
  assert page.get_by_text('Gammal veckorad',exact=True).count()==0,'raw weekly today rows must stay ignored when the daily read fails'
  page.screenshot(path=str(out/'checklist-week-today-error-375x844.png'),animations='disabled')
  passed('Weekly read error and authoritative-today read error render separate retry states; raw today is never trusted')

  open_week()
  current=page.get_by_role('button',name=re.compile(r', idag$'))
  expect(current).to_have_count(1)
  current.click()
  expect(page.get_by_text('Gammal veckorad',exact=True)).to_have_count(0)
  open_training=page.get_by_role('button',name=re.compile(r'^Öppna träningssteget ')).first
  expect(open_training).to_be_visible()
  expect(page.get_by_text(training_program_step_title(review_mode),exact=True)).to_be_visible()
  before_week=int(re.search(r'^(\d+) av \d+ bekräftade klara den här veckan$',page.get_by_text(re.compile(r'^\d+ av \d+ bekräftade klara den här veckan$')).inner_text()).group(1))
  before_day=int(re.search(r'^(\d+) av \d+ bekräftade klara idag$',page.get_by_text(re.compile(r'^\d+ av \d+ bekräftade klara idag$')).inner_text()).group(1))
  page.screenshot(path=str(out/'checklist-week-today-exact-training-375x844.png'),animations='disabled')
  open_training.click()
  expect(page.get_by_test_id('training-fixture-banner')).to_be_visible()
  expect(page.get_by_role('button',name='Tillbaka till veckans dag',exact=True)).to_be_visible()
  mark=page.get_by_role('button',name='Markera övningen som genomförd',exact=True)
  expect(mark).to_be_visible();mark.click()
  expect(page.get_by_text('Övningen är genomförd.',exact=True)).to_be_visible()
  page.get_by_role('button',name='Tillbaka till veckans dag',exact=True).click()
  expect(page.get_by_text('Veckans sparade aktiviteter',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name=re.compile(r', idag$'))).to_have_count(1)
  after_week=int(re.search(r'^(\d+) av \d+ bekräftade klara den här veckan$',page.get_by_text(re.compile(r'^\d+ av \d+ bekräftade klara den här veckan$')).inner_text()).group(1))
  after_day=int(re.search(r'^(\d+) av \d+ bekräftade klara idag$',page.get_by_text(re.compile(r'^\d+ av \d+ bekräftade klara idag$')).inner_text()).group(1))
  assert after_week==before_week+1 and after_day==before_day+1,'only confirmed completion increments the selected-day and weekly totals'
  expect(page.get_by_text('Genomförd',exact=True).last).to_be_visible()
  passed('Exact current-day training opens and returns to today; confirmed readback increments day and week totals')

  page.get_by_role('button',name=re.compile(r'^Öppna träningssteget ')).first.click()
  expect(page.get_by_role('button',name=re.compile(r'^Avmarkera '))).to_be_visible()
  page.get_by_role('button',name=re.compile(r'^Avmarkera ')).click()
  expect(page.get_by_text('Övningen är avmarkerad.',exact=True)).to_be_visible()
  page.get_by_role('region',name='Övning').get_by_role('button',name='Stäng',exact=True).click()
  after_unmark=int(re.search(r'^(\d+) av \d+ bekräftade klara den här veckan$',page.get_by_text(re.compile(r'^\d+ av \d+ bekräftade klara den här veckan$')).inner_text()).group(1))
  assert after_unmark==before_week,'confirmed unmark readback removes only the selected step from weekly completion'
  page.get_by_role('button',name=re.compile(r'^Öppna träningssteget ')).first.click()
  page.get_by_role('button',name='Markera övningen som genomförd',exact=True).click()
  expect(page.get_by_text('Övningen är genomförd.',exact=True)).to_be_visible()
  page.get_by_role('button',name='Tillbaka till veckans dag',exact=True).click()
  assert int(re.search(r'^(\d+) av \d+ bekräftade klara den här veckan$',page.get_by_text(re.compile(r'^\d+ av \d+ bekräftade klara den här veckan$')).inner_text()).group(1))==before_week+1
  page.evaluate("window.__tasslaNavigateMainTab('training')")
  page.get_by_role('tab',name='Mina',exact=True).click()
  page.evaluate("window.__tasslaAlertActions=['Börja om']")
  program_title='Trygg start hemma' if review_mode else 'Trygg vardagsstart'
  reset_button=page.get_by_role('button',name=f'Börja om med {program_title}',exact=True)
  expect(reset_button).to_be_visible();reset_button.click()
  expect(page.get_by_role('button',name=f'Börja om med {program_title}',exact=True)).to_have_count(0)
  page.evaluate("window.__tasslaNavigateMainTab('home')")
  page.get_by_role('button',name='Visa dagens checklista',exact=True).click()
  expect(page.get_by_text('Veckans sparade aktiviteter',exact=True)).to_be_visible()
  reset_week=int(re.search(r'^(\d+) av \d+ bekräftade klara den här veckan$',page.get_by_text(re.compile(r'^\d+ av \d+ bekräftade klara den här veckan$')).inner_text()).group(1))
  assert reset_week==before_week,'confirmed reset readback removes selected training completion from the weekly total'
  passed('Confirmed program reset removes its current-day training selection from weekly progress')

  page.set_viewport_size({'width':375,'height':844})
  open_week()
  scaled=page.evaluate('''() => {const nodes=[...document.querySelectorAll('[dir="auto"]')];nodes.forEach(el=>{const style=getComputedStyle(el);const size=parseFloat(style.fontSize);const line=parseFloat(style.lineHeight);if(Number.isFinite(size))el.style.fontSize=(size*1.4)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*1.4)+'px';});return nodes.length;}''')
  assert scaled>0,'weekly text proxy found no rendered text'
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'weekly view overflows at 140% text proxy'
  page.screenshot(path=str(out/'checklist-week-large-text-140-375x844.png'),animations='disabled')
  passed('Weekly view fits 375x844 at a 140% web text proxy')
  assert not errors,errors
  browser.close()
  (out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'R3b current ISO-week read-only view, current-day authority, exact training route/return, and synthetic confirmed progress in public/review RN Web','bundle':'review' if review_mode else 'public','viewports':viewports+[(375,844,'140% text proxy')],'limitations':['Fixtures use synthetic local snapshots and callbacks; no live Supabase/RLS reads or writes are performed','Native iOS/Android, VoiceOver, device Dynamic Type, app resume and physical timezone/midnight transitions are NOT TESTABLE in RN Web','The 140% text proxy is a web CSS approximation']},ensure_ascii=False,indent=2)+chr(10),encoding='utf-8')
  raise SystemExit(0)

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
