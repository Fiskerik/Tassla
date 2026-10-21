from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
from datetime import datetime, timezone
import os
import re
import hashlib
import subprocess
out=Path(os.environ.get('TASSLA_UI_EVIDENCE', str(Path(__file__).resolve().parents[2] / 'docs/design/QA-11/evidence')));out.mkdir(parents=True,exist_ok=True)
os.environ.setdefault('XDG_CONFIG_HOME','/tmp/tassla-chrome-config')
ui_base=os.environ.get('TASSLA_UI_BASE_URL','http://127.0.0.1:4173/')
results=[];errors=[]
def color_components(value):
 parts=[float(part) for part in re.findall(r"\d+(?:\.\d+)?",value)]
 if len(parts)<3: raise AssertionError(f'Could not parse computed CSS color: {value}')
 return parts[0:3]+([parts[3]] if len(parts)>3 else [1.0])
with sync_playwright() as p:
 browser_options={'headless':True,'args':['--no-sandbox','--disable-crash-reporter','--disable-breakpad']}
 if os.environ.get('TASSLA_UI_CHROMIUM'): browser_options['executable_path']=os.environ['TASSLA_UI_CHROMIUM']
 else: browser_options['executable_path']='/usr/bin/chromium'
 browser=p.chromium.launch(**browser_options)
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 page.clock.install(time=datetime(2026,10,11,15,0,tzinfo=timezone.utc))
 page.on('pageerror',lambda e:errors.append(str(e)))
 def open(screen,extra=''):
  page.goto(f'{ui_base}?screen={screen}{extra}');page.wait_for_timeout(350)
 def passed(label): results.append(label);print('PASS',label)
 if os.environ.get('TASSLA_UI_SCOPE')=='home':
  review_mode=os.environ.get('TASSLA_UI_REVIEW')=='true' or '/review' in str(out).replace('\\','/')
  flow_captures=[]
  repo_root=Path(__file__).resolve().parents[2]
  build_file=Path(os.environ['TASSLA_UI_BUILD_FILE']).resolve() if os.environ.get('TASSLA_UI_BUILD_FILE') else None
  try:
   branch=subprocess.check_output(['git','rev-parse','--abbrev-ref','HEAD'],cwd=repo_root,text=True).strip()
   commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo_root,text=True).strip()
  except Exception:
   branch=commit='NOT TESTABLE'
  build_sha=hashlib.sha256(build_file.read_bytes()).hexdigest() if build_file and build_file.is_file() else 'NOT PROVIDED'
  verifier_sha=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
  def capture_flow(name,route):
   page.wait_for_timeout(350)
   path=out/f'checklist-filters-{name}.png'
   page.screenshot(path=str(path))
   flow_captures.append({'file':path.name,'route':route,'viewport':page.evaluate('({width:innerWidth,height:innerHeight})'),'scenario':name})
  def check_filter_layout(width,expected_count=4):
   tabs=page.get_by_role('tablist',name='Avsnitt').get_by_role('tab')
   expect(tabs).to_have_count(expected_count)
   for tab in tabs.all():
    expect(tab).to_be_visible()
    box=tab.bounding_box();assert box is not None and box['x']>=0 and box['x']+box['width']<=width,f'Filter segment is clipped at {width}px: {box}'
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'Checklist filter has horizontal overflow at {width}px'
  def assert_filter_selected(name):
   tablist=page.get_by_role('tablist',name='Avsnitt')
   selected=tablist.get_by_role('tab',name=name,exact=True)
   inactive=tablist.get_by_role('tab',name='Idag' if name!='Idag' else 'Alla',exact=True)
   assert selected.evaluate('(el)=>getComputedStyle(el).backgroundColor')!=inactive.evaluate('(el)=>getComputedStyle(el).backgroundColor'),f'{name} selected state is not visually distinct'
  def home_viewport(height): return height
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
    expect(page.get_by_text('Efter måltid',exact=True)).to_have_count(0)
    expect(page.get_by_text('Rent vatten i skålen',exact=True)).to_have_count(0)
    page.screenshot(path=str(out/f'home-checklist-compact-{width}.png'))
    expect(page.get_by_role('button',name='Miljöträning – nya ljud, inte klar, öppna Träning',exact=True)).to_be_visible()
   else:
    expect(page.get_by_text('Idag',exact=True)).to_have_count(0)
    expect(page.get_by_role('button',name='Öppna dagens checklista',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Hantera dagens aktiviteter',exact=True)).to_be_visible()
    for heading in ['Loggat idag','Nästa träningssteg','Planerat idag']:
     expect(page.get_by_text(heading,exact=True)).to_have_count(0)
   for label in ['Logga','Träna','Kunskap']:
    expect(page.get_by_role('button',name=f'Öppna {label}',exact=True)).to_be_visible()
   expect(page.get_by_text('Standardbild',exact=True)).to_be_visible()
   portrait=page.get_by_test_id('home-dog-portrait');portrait_box=portrait.bounding_box()
   badge=page.get_by_test_id('home-portrait-standard-label');badge_box=badge.bounding_box()
   assert portrait_box is not None and badge_box is not None
   assert badge_box['x']>=portrait_box['x'] and badge_box['y']>=portrait_box['y'] and badge_box['x']+badge_box['width']<=portrait_box['x']+portrait_box['width'] and badge_box['y']+badge_box['height']<=portrait_box['y']+portrait_box['height'],f'Standardbild label clipped by portrait at {width}px: {badge_box} / {portrait_box}'
   badge_background=color_components(badge.evaluate('(el)=>getComputedStyle(el).backgroundColor'))
   assert badge_background[3]>=0.99,f'Standardbild label background is not opaque at {width}px: {badge_background}'
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
    glyph_opacity=float(glyph.evaluate('(el)=>getComputedStyle(el).opacity'))
    glyph_box=glyph.bounding_box();assert glyph_box is not None
    overlaps_portrait=(glyph_box['x'] < portrait_box['x']+portrait_box['width'] and glyph_box['x']+glyph_box['width'] > portrait_box['x'] and glyph_box['y'] < portrait_box['y']+portrait_box['height'] and glyph_box['y']+glyph_box['height'] > portrait_box['y'])
    if number_bg[3] < 0.99:
     assert not overlaps_portrait,f'week {week} numeral overlaps the photo without an opaque backing at {width}px: {glyph_box} / {portrait_box}'
    assert glyph_opacity==1.0,f'week {week} numeral should remain fully visible over its own backing at {width}px: opacity={glyph_opacity}'
    if expected is None:
     expect(wash).to_have_count(0)
    else:
     expect(wash).to_have_count(1)
     wash_color=color_components(wash.evaluate('(el)=>getComputedStyle(el).backgroundColor'))
     assert abs(wash_color[3]-(1-expected))<0.03,f'week {week} canvas wash opacity is wrong: expected {1-expected}, got {wash_color[3]}'
     assert number_bg[3]>=0.99 and number_bg[:3]==[245,240,232],f'week {week} number lacks its warm solid backing: {number_bg}'
   current_dot=float(page.get_by_test_id('home-week-dot-11').evaluate('(el)=>getComputedStyle(el).opacity'))
   current_number_bg=color_components(page.get_by_test_id('home-week-number-11').evaluate('(el)=>getComputedStyle(el).backgroundColor'))
   assert current_dot==1.0 and current_number_bg[:3]==[33,116,72],f'active week marker was faded: opacity={current_dot}, background={current_number_bg}'
   passed(f'Portrait label bounds and measured week-strip fade at {width}px')
   review_banner=page.get_by_text('AI-GENERERAD STANDARDBILD',exact=True)
   fixture_checkboxes=page.get_by_role('checkbox')
   if review_mode:
    expect(review_banner).to_be_visible()
    expect(page.get_by_text('2 av 5 klara',exact=True)).to_be_visible()
    expect(fixture_checkboxes).to_have_count(4)
    banner_top=review_banner.bounding_box()['y']
    banner_box=page.get_by_test_id('review-banner').bounding_box();app_box=page.get_by_test_id('review-app-viewport').bounding_box()
    assert banner_box is not None and banner_box['y']==0 and banner_box['height']==32,f'review banner is not a separate 32px fixture: {banner_box}'
    assert app_box is not None and app_box['y']==32 and app_box['height']==812,f'review fixture does not fit beneath its banner inside the 844px viewport: {app_box}'
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
     tile.evaluate("el => el.scrollIntoView({block:'center',inline:'nearest'})")
     expect(tile).to_be_visible()
     box=tile.bounding_box()
     current_nav=page.get_by_role('tablist',name='Huvudmeny').bounding_box()
     assert box is not None and current_nav is not None and box['y']+box['height'] <= current_nav['y']-16,f'{label} lacks 16pt clearance above fixed navigation after scroll: {box} / {current_nav}'
    expect(review_banner).to_be_visible()
    page.screenshot(path=str(out/f'home-review-destinations-{width}.png'))
    page.get_by_role('button',name='Öppna Rutin Morgonrutin, punkt Kissa',exact=True).click()
    expect(page.get_by_role('region',name='Hantera Morgonrutin')).to_be_visible()
    page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
    expect(page.get_by_label('Namn på rutin Morgonrutin')).to_be_visible()
    expect(page.get_by_text('Vecka 11',exact=True).first).to_be_visible()
    expect(page.get_by_role('button',name='Ta bort rutinen Morgonrutin från Hemskärmen',exact=True)).to_be_visible()
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
    above_nav += [page.get_by_role('button',name=name,exact=True) for name in ['Öppna dagens checklista','Hantera dagens aktiviteter']]
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
   expect(page.get_by_role('button',name='Öppna dagens checklista',exact=True)).to_be_visible()
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
  # The checklist link remains available in every Home read state and opens a Home child route.
  for scenario in ['ready','loading','error','empty']:
   open('home','&state='+scenario)
   expect(page.get_by_role('button',name='Öppna dagens checklista',exact=True)).to_be_visible()
  page.set_viewport_size({'width':375,'height':home_viewport(844)})
  open('home')
  page.get_by_role('button',name='Öppna dagens checklista',exact=True).click()
  expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
  expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
  expect(page.get_by_text('Checklista',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'checklist-entry-375.png'))
  passed('Permanent checklist entry opens a Home child route from ready/loading/error/empty states')
  # Zero/one/five/seven items at normal size; this runs in both public and review builds.
  for count in [0,1,5,7]:
   open('checklist','&checklistCount='+str(count))
   expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
   expect(page.get_by_text('Kommande, 7 dagar',exact=True)).to_be_visible()
   expect(page.get_by_role('button',name='Visa alla kommande aktiviteter',exact=True)).to_be_visible()
   expect(page.locator('[data-testid^="upcoming-preview-row-"]')).to_have_count(3)
   if count==0:
    expect(page.get_by_text('Inga aktiviteter idag',exact=True)).to_be_visible()
    expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
    expect(page.get_by_text(re.compile(r'\d+ av \d+ klara'))).to_have_count(0)
   else:
    expect(page.get_by_text(f'Idag · {3 if count>=5 else 0} av {min(5,count)} klara',exact=True)).to_be_visible()
    expect(page.get_by_test_id('daily-checklist-progress')).to_be_visible()
    if count==7:
     for description in ['Efter måltid','Rent vatten i skålen','Kontrollera passformen','Låt Luna nosa i lugn takt']:
      expect(page.get_by_text(description,exact=True)).to_be_visible()
   if count==7:
    expect(page.get_by_text('Träningsprogram',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name=re.compile(r'Träningsuppgift: .*'))).to_have_count(2)
   else:
    expect(page.get_by_text('Träningsprogram',exact=True)).to_have_count(0)
   page.screenshot(path=str(out/f'checklist-{count}-375.png'))
  passed('Checklist zero/one/five/seven states keep routine-only progress separate from training')
  for scenario in ['loading','error']:
   open('checklist','&checklistCount=7&state='+scenario)
   if scenario=='loading':
    expect(page.get_by_label('Checklistan hämtas')).to_be_visible()
    expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
   else:
    expect(page.get_by_text('Dagens checklista kunde inte hämtas',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Hämta dagens checklista igen',exact=True)).to_be_visible()
    expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
   page.screenshot(path=str(out/f'checklist-{scenario}-375.png'))
  passed('Checklist loading and read-error states do not claim an empty or complete list')
  # Checklist is richer than Home; normal tap, checkbox, and long-press remain independent actions.
  page.set_viewport_size({'width':375,'height':844})
  open('checklist','&checklistCount=7')
  expect(page.get_by_text('Efter måltid',exact=True)).to_be_visible()
  expect(page.get_by_text('Rent vatten i skålen',exact=True)).to_be_visible()
  capture_flow('routine-details-with-varied-icons','checklist?filter=Idag&details=icons-descriptions')
  page.get_by_role('button',name='Öppna Rutin Morgonrutin, punkt Kissa',exact=True).click()
  expect(page.get_by_text('Hantera Morgonrutin',exact=True)).to_be_visible()
  expect(page.get_by_label('Beskrivning för checklistepunkt 1 (valfri)',exact=True)).to_have_count(0)
  expect(page.get_by_text('Välj en ikon',exact=True)).to_have_count(0)
  page.get_by_role('button',name='Klar',exact=True).click()
  unchecked=page.get_by_role('checkbox',name='Rutin Morgonrutin, punkt Kissa, inte klar',exact=True)
  expect(unchecked).to_be_visible();unchecked.click()
  checked=page.get_by_role('checkbox',name='Rutin Morgonrutin, punkt Kissa, klar',exact=True)
  expect(checked).to_have_attribute('aria-checked','true')
  expect(page.get_by_text('Hantera Morgonrutin',exact=True)).to_have_count(0)
  row=page.get_by_role('button',name='Öppna Rutin Morgonrutin, punkt Kissa',exact=True)
  box=row.bounding_box();assert box is not None
  page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
  page.mouse.down();page.wait_for_timeout(850);page.mouse.up()
  expect(page.get_by_text('Hantera Morgonrutin',exact=True)).to_be_visible()
  description_input=page.get_by_label('Beskrivning för checklistepunkt 1 (valfri)',exact=True)
  expect(description_input).to_have_value('Efter måltid')
  expect(description_input).to_have_attribute('placeholder','Förklaring (valfri)')
  title_input=page.get_by_label('Checklistepunkt 1',exact=True)
  assert description_input.evaluate('(element) => getComputedStyle(element).backgroundColor') != title_input.evaluate('(element) => getComputedStyle(element).backgroundColor')
  expect(page.get_by_text('Ändringar gäller nästa rutintillfälle.',exact=True)).to_be_visible()
  expect(page.get_by_text('Välj en ikon',exact=True)).to_have_count(0)
  kissa_icon_row=page.get_by_test_id('routine-checklist-title-00000000-0000-4000-8000-000000000001')
  water_icon_row=page.get_by_test_id('routine-checklist-title-00000000-0000-4000-8000-000000000002')
  expect(kissa_icon_row.get_by_role('button',name='Välj ikon för Kissa',exact=True)).to_be_visible()
  expect(water_icon_row.get_by_role('button',name='Välj ikon för Fyll på vatten',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name=re.compile(r'^Välj ikon för '))).to_have_count(2)
  sol=page.get_by_role('radio',name='Sol',exact=True);expect(sol).to_be_visible()
  capture_flow('routine-long-press-focused-editor','checklist?filter=Idag&edit=long-press')
  sol.click()
  page.get_by_label('Beskrivning för checklistepunkt 1 (valfri)',exact=True).fill('Börja med morgonrundan')
  page.get_by_role('button',name='Spara rutin Morgonrutin',exact=True).click()
  expect(page.get_by_text('Börja med morgonrundan',exact=True)).to_be_visible()
  expect(page.get_by_text('Efter måltid',exact=True)).to_have_count(1)
  page.get_by_role('button',name='Klar',exact=True).click()
  expect(page.get_by_text('Efter måltid',exact=True)).to_be_visible()
  expect(page.get_by_text('Börja med morgonrundan',exact=True)).to_have_count(0)
  row=page.get_by_role('button',name='Öppna Rutin Morgonrutin, punkt Kissa',exact=True)
  box=row.bounding_box();assert box is not None
  page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
  page.mouse.down();page.wait_for_timeout(850);page.mouse.up()
  expect(page.get_by_label('Beskrivning för checklistepunkt 1 (valfri)',exact=True)).to_have_value('Börja med morgonrundan')
  expect(page.get_by_role('radio',name='Sol',exact=True)).to_have_attribute('aria-checked','true')
  page.get_by_role('region',name='Hantera Morgonrutin').get_by_role('button',name='Stäng',exact=True).click()
  expect(page.get_by_text('Efter måltid',exact=True)).to_be_visible()
  capture_flow('routine-template-edit-keeps-todays-snapshot','checklist?filter=Idag&snapshot=frozen')
  passed('Home stays compact; Checklist shows optional detail; normal open, checkbox, long-press edit and frozen day snapshot work independently')
  # Full panel-4 filter flow: functional scopes, honest states, source actions and return.
  for width,height in [(375,home_viewport(844)),(430,home_viewport(844)),(375,home_viewport(667))]:
   page.set_viewport_size({'width':width,'height':height})
   open('checklist','&today=2026-10-11&checklistFilter=Idag&checklistCount=7')
   check_filter_layout(width,3)
   expect(page.get_by_text('Idag · 3 av 5 klara',exact=True)).to_be_visible()
   expect(page.get_by_test_id('daily-checklist-progress')).to_have_attribute('aria-label','3 av 5 checklistepunkter klara')
   expect(page.get_by_label('Dagens checklista')).to_be_visible()
   expect(page.get_by_text('Träningsprogram',exact=True)).to_be_visible()
   expect(page.locator('[data-testid^="upcoming-preview-row-"]')).to_have_count(3)
   expect(page.get_by_label('Kommande, 7 dagar').get_by_role('checkbox')).to_have_count(0)
   assert all('Framtida träningsprov' not in row.inner_text() for row in page.locator('[data-testid^="upcoming-preview-row-"]').all()),'upcoming preview must exclude saved training rows'
   if height==844:
    nav_box=page.get_by_role('tablist',name='Huvudmeny').bounding_box();assert nav_box is not None
    for upcoming_row in page.locator('[data-testid^="upcoming-preview-row-"]').all():
     row_box=upcoming_row.bounding_box();assert row_box is not None and row_box['y']+row_box['height']<=nav_box['y'],f'upcoming preview row is hidden under fixed navigation at {width}px: {row_box} / {nav_box}'
   capture_flow(f'{width}x{height}-routine-training-separation','checklist?filter=Idag&groups=separate')
   for filter_name in ['Denna vecka','Alla']:
    tab=page.get_by_role('tablist',name='Avsnitt').get_by_role('tab',name=filter_name,exact=True);tab.click()
    expect(tab).to_have_attribute('aria-label',filter_name)
    selected_background=tab.evaluate('(el)=>getComputedStyle(el).backgroundColor')
    inactive_background=page.get_by_role('tablist',name='Avsnitt').get_by_role('tab',name='Idag' if filter_name!='Idag' else 'Alla',exact=True).evaluate('(el)=>getComputedStyle(el).backgroundColor')
    assert selected_background!=inactive_background,f'{filter_name} selected state is not visually distinct from inactive tabs'
    check_filter_layout(width)
    expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
    expect(page.get_by_text(re.compile(r'\d+ av \d+ klara'))).to_have_count(0)
    if filter_name=='Alla': expect(page.get_by_text('Senaste 30 dagarna',exact=True)).to_be_visible()
    check_filter_layout(width,4)
    capture_flow(f'{width}x{height}-{filter_name.lower().replace(" ","-")}',f'checklist?filter={filter_name}')
   page.get_by_role('tablist',name='Avsnitt').get_by_role('tab',name='Idag',exact=True).click()
   check_filter_layout(width,3)
   page.get_by_role('button',name='Visa alla kommande aktiviteter',exact=True).click()
   expect(page.get_by_text('Planerat, inte utfört',exact=True)).to_be_visible()
   expect(page.get_by_role('tablist',name='Avsnitt').get_by_role('tab')).to_have_count(4)
   assert_filter_selected('Kommande')
   expect(page.get_by_role('button',name=re.compile(r'^Planerad rutin:'))).to_have_count(9)
   expect(page.get_by_role('button',name=re.compile(r'^Vaccination, planerad'))).to_be_visible()
   expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
   capture_flow(f'{width}x{height}-kommande-from-preview','checklist?filter=Idag&action=Visa-alla-kommande')
  passed('Idag has three reference segments and a three-row upcoming preview; CTA opens the full four-segment Kommande view at all three viewports')
  for scenario in ['loading','empty','partial','error']:
   page.set_viewport_size({'width':375,'height':844})
   open('checklist','&today=2026-10-11&checklistCount=7&upcomingScenario='+scenario)
   page.evaluate('''() => {
    const screen=document.querySelector('[data-testid="daily-checklist-screen"]');
    let node=screen;
    while(node && (node.scrollHeight<=node.clientHeight || !['auto','scroll'].includes(getComputedStyle(node).overflowY))) node=node.parentElement;
    if(node) node.scrollTop=0;
   }''')
   expect(page.get_by_text('Kommande, 7 dagar',exact=True)).to_be_visible()
   action=page.get_by_role('button',name='Visa alla kommande aktiviteter',exact=True)
   expect(action).to_be_visible()
   state_action=None
   if scenario=='loading':
    state_content=page.get_by_label('Kommande aktiviteter hämtas')
    expect(state_content).to_be_visible()
   elif scenario=='empty':
    state_content=page.get_by_text('Inget planerat de närmaste sju dagarna.',exact=True)
    expect(state_content).to_be_visible()
   elif scenario=='partial':
    state_content=page.get_by_text('En del av listan kunde inte hämtas.',exact=True)
    state_action=page.get_by_role('button',name='Läs in hela listan med kommande aktiviteter igen',exact=True)
    expect(state_content).to_be_visible()
    expect(state_action).to_be_visible()
   else:
    state_content=page.get_by_text('Kommande aktiviteter kunde inte hämtas.',exact=True)
    state_action=page.get_by_role('button',name='Hämta kommande aktiviteter igen',exact=True)
    expect(state_content).to_be_visible()
    expect(state_action).to_be_visible()
   title=page.get_by_text('Kommande, 7 dagar',exact=True)
   expect(title).to_be_visible()
   assert title.evaluate('(el) => el.scrollWidth <= el.clientWidth'), 'preview heading is visually truncated'
   nav_box=page.get_by_role('tablist',name='Huvudmeny').bounding_box();assert nav_box is not None
   for label,locator in [('heading',title),('full-list action',action)]:
    box=locator.bounding_box()
    assert box is not None and box['y']>=0 and box['y']+box['height']<=nav_box['y'],f'{scenario} preview {label} is outside the visible content area: {box} / {nav_box}'
   state_box=state_content.bounding_box()
   assert state_box is not None and state_box['y']>=0 and state_box['y']+state_box['height']<=nav_box['y'],f'{scenario} preview state is outside the visible content area: {state_box} / {nav_box}'
   if state_action:
    retry_box=state_action.bounding_box()
    assert retry_box is not None and retry_box['y']>=0 and retry_box['y']+retry_box['height']<=nav_box['y'],f'{scenario} preview retry action is outside the visible content area: {retry_box} / {nav_box}'
   if scenario=='partial':
    visible_rows=page.locator('[data-testid^="upcoming-preview-row-"]').all()
    assert len(visible_rows)==1,'partial preview should remain compact enough to show its available row'
    for row in visible_rows:
     row_box=row.bounding_box()
     assert row_box is not None and row_box['y']+row_box['height']<=nav_box['y'],f'partial preview row is hidden under fixed navigation: {row_box} / {nav_box}'
   capture_flow(f'preview-{scenario}-state','checklist?filter=Idag&preview='+scenario)
   page.get_by_role('button',name='Visa alla kommande aktiviteter',exact=True).click()
   expect(page.get_by_role('tablist',name='Avsnitt').get_by_role('tab')).to_have_count(4)
   assert_filter_selected('Kommande')
   capture_flow(f'preview-{scenario}-cta','checklist?filter=Idag&preview='+scenario)
  passed('Kommande preview loading, empty, partial and error keep the inline action and available rows visible above fixed navigation')
  for width,height in [(375,home_viewport(844)),(430,home_viewport(844)),(375,home_viewport(667))]:
   page.set_viewport_size({'width':width,'height':height})
   open('checklist','&checklistFilter=Idag&checklistScenario=routine-only')
   expect(page.get_by_text('Idag · 3 av 5 klara',exact=True)).to_be_visible()
   expect(page.get_by_role('button',name=re.compile(r'Träningsuppgift: .*'))).to_have_count(0)
   open('checklist','&checklistFilter=Idag&checklistScenario=training-only')
   expect(page.get_by_text('Träningsprogram',exact=True)).to_be_visible()
   expect(page.get_by_role('button',name=re.compile(r'Träningsuppgift: .*'))).to_have_count(2)
   expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
   expect(page.get_by_text(re.compile(r'\d+ av \d+ klara'))).to_have_count(0)
   expect(page.get_by_test_id('daily-checklist-count')).to_have_text('Idag')
   capture_flow(f'{width}x{height}-training-only','checklist?filter=Idag&groups=training-only')
  passed('Routine-only and training-only Checklist states stay distinct without 0-of-0 progress at all three viewports')
  page.set_viewport_size({'width':375,'height':844})
  open('checklist','&today=2026-10-11&checklistFilter=Alla&rangeScenario=scroll')
  scroll_state=page.evaluate('''() => {
   const screen=document.querySelector('[data-testid="daily-checklist-screen"]');
   let node=screen;
   while(node && (node.scrollHeight<=node.clientHeight || !['auto','scroll'].includes(getComputedStyle(node).overflowY))) node=node.parentElement;
   if(!node) throw new Error('Checklist ScrollView not found for scroll-reset verification');
   node.scrollTop=node.scrollHeight;
   return {before:node.scrollTop,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight};
  }''')
  assert scroll_state['before']>0 and scroll_state['scrollHeight']>scroll_state['clientHeight'],f'Fixture did not create a scrollable checklist: {scroll_state}'
  page.get_by_role('tablist',name='Avsnitt').get_by_role('tab',name='Denna vecka',exact=True).evaluate('(el)=>el.click()')
  page.wait_for_function('''() => {
   const screen=document.querySelector('[data-testid="daily-checklist-screen"]');
   let node=screen;
   while(node && (node.scrollHeight<=node.clientHeight || !['auto','scroll'].includes(getComputedStyle(node).overflowY))) node=node.parentElement;
   return node?.scrollTop===0;
  }''')
  assert_filter_selected('Denna vecka')
  capture_flow('filter-change-scroll-reset','checklist?filter=Alla-to-Denna-vecka&rangeScenario=scroll')
  passed('Changing a Checklist filter resets the scroll offset to the top of the new date groups')
  for scenario in ['loading','empty','partial','error']:
   open('checklist','&today=2026-10-11&checklistFilter=Alla&rangeScenario='+scenario)
   if scenario=='loading':
    expect(page.get_by_label('Checklistan hämtas')).to_be_visible()
    expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
   elif scenario=='empty':
    expect(page.get_by_text('Inga sparade aktiviteter',exact=True)).to_be_visible()
    expect(page.get_by_text('En del av listan kunde inte hämtas.',exact=False)).to_have_count(0)
   elif scenario=='partial':
    expect(page.get_by_text('En del av listan kunde inte hämtas.',exact=False)).to_be_visible()
    expect(page.get_by_role('button',name='Läs in hela filtret Alla igen',exact=True)).to_be_visible()
    expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
   else:
    expect(page.get_by_text('Checklistan kunde inte hämtas',exact=True)).to_be_visible()
    retry=page.get_by_role('button',name='Hämta filtret Alla igen',exact=True);expect(retry).to_be_visible();retry.click()
    expect(page.get_by_role('button',name=re.compile(r'^Sparat träningssteg:'))).to_be_visible()
   capture_flow(f'range-{scenario}',f'checklist?filter=Alla&rangeScenario={scenario}')
  passed('Range loading, empty, partial, retry and error states remain distinct and never claim complete progress')
  open('checklist','&today=2026-10-11&checklistFilter=Alla')
  historical=page.get_by_role('button',name=re.compile(r'^Sparat träningssteg:'))
  expect(historical).to_have_count(1);historical.click()
  expect(page.get_by_test_id('home-training-step-detail')).to_be_visible()
  expect(page.get_by_text(re.compile(r'Historisk aktivitet · skrivskyddad ·'))).to_be_visible()
  expect(page.get_by_role('button',name='Markera övningen som genomförd',exact=True)).to_have_count(0)
  expect(page.get_by_role('button',name='Avmarkera övningen som genomförd',exact=True)).to_have_count(0)
  capture_flow('historical-training-read-only','home-training-detail?returnFilter=Alla')
  page.get_by_role('button',name='Tillbaka till Checklistan',exact=True).click()
  expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
  assert_filter_selected('Alla')
  expect(page.get_by_role('button',name=re.compile(r'^Sparat träningssteg:'))).to_be_visible()
  capture_flow('historical-training-return','checklist?filter=Alla')
  passed('Historical training opens exact fixture source read-only and returns to the selected filter')
  open('checklist','&today=2026-10-11&checklistFilter=Kommande')
  future_routine=page.get_by_role('button',name=re.compile(r'^Planerad rutin: Morgonrutin$')).first
  expect(future_routine).to_be_visible();future_routine.click()
  expect(page.get_by_text('Kommande rutin · endast mall och upprepning',exact=True)).to_be_visible()
  expect(page.get_by_text('Lägg till ett träningssteg',exact=True)).to_have_count(0)
  expect(page.get_by_role('button',name=re.compile(r'Lägg till rutinen .* på Hemskärmen'))).to_have_count(0)
  capture_flow('planned-routine-source','checklist?filter=Kommande&source=routine')
  page.get_by_role('button',name='Redigera rutin Morgonrutin',exact=True).click()
  page.get_by_label('Namn på rutin Morgonrutin',exact=True).fill('Morgonrutin uppdaterad')
  page.get_by_role('button',name='Spara rutin Morgonrutin',exact=True).click()
  expect(page.get_by_text('Hantera Morgonrutin uppdaterad',exact=True)).to_be_visible()
  page.get_by_role('button',name='Klar',exact=True).click()
  assert_filter_selected('Kommande')
  expect(page.get_by_role('button',name=re.compile(r'^Planerad rutin: Morgonrutin uppdaterad$'))).to_have_count(7)
  expect(page.get_by_role('button',name=re.compile(r'^Planerad rutin: Morgonrutin$'))).to_have_count(0)
  capture_flow('planned-routine-after-edit','checklist?filter=Kommande&source=updated-routine')
  passed('Editing a planned routine returns to Kommande with the refreshed projected rows')
  page.get_by_role('button',name=re.compile(r'^Planerad rutin: Morgonrutin uppdaterad$')).first.click()
  page.evaluate("window.__tasslaAlertActions=['Avbryt']")
  page.get_by_role('button',name='Ta bort rutin Morgonrutin uppdaterad',exact=True).click()
  expect(page.get_by_role('button',name=re.compile(r'^Planerad rutin: Morgonrutin uppdaterad$'))).to_have_count(7)
  expect(page.get_by_text('Hantera Morgonrutin uppdaterad',exact=True)).to_be_visible()
  page.evaluate("window.__tasslaAlertActions=['Ta bort rutin']")
  page.get_by_role('button',name='Ta bort rutin Morgonrutin uppdaterad',exact=True).click()
  expect(page.get_by_text('Rutiner och aktiviteter',exact=True)).to_be_visible()
  assert page.evaluate('window.__tasslaAlertOptions')==['Avbryt','Ta bort rutin']
  page.get_by_role('button',name='Klar',exact=True).click()
  assert_filter_selected('Kommande')
  expect(page.get_by_role('button',name=re.compile(r'^Planerad rutin: Morgonrutin uppdaterad$'))).to_have_count(0)
  capture_flow('planned-routine-after-delete','checklist?filter=Kommande&source=deleted-routine')
  passed('Planned routine deletion stays confirmed and removes its projected rows from Kommande')
  page.get_by_role('button',name=re.compile(r'^Vaccination, planerad')).click()
  expect(page.get_by_text('Planerade hälsohändelser',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Tillbaka till Checklistan',exact=True)).to_be_visible()
  capture_flow('planned-health-source','planned-health?returnFilter=Kommande')
  page.get_by_role('button',name='Tillbaka till Checklistan',exact=True).click()
  assert_filter_selected('Kommande')
  capture_flow('planned-health-return','checklist?filter=Kommande')
  passed('Planned routine hides day-level actions; planned health opens and returns to Kommande')
  page.set_viewport_size({'width':430,'height':home_viewport(844)})
  open('checklist','&checklistCount=7')
  expect(page.get_by_text('Idag · 3 av 5 klara',exact=True)).to_be_visible()
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(out/'checklist-7-430.png'))
  page.set_viewport_size({'width':375,'height':home_viewport(667)})
  open('checklist','&checklistCount=7')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(out/'checklist-7-short-viewport-375.png'))
  passed('Checklist fits the standard 430px and short 375×667 viewports')
  # Open the lower of two training rows, complete its exact step, and verify list/count/scroll on return.
  page.set_viewport_size({'width':375,'height':home_viewport(844)})
  open('checklist','&checklistCount=7')
  training_rows=page.get_by_role('button',name=re.compile(r'Träningsuppgift: .*'))
  expect(training_rows).to_have_count(2)
  source_row=training_rows.last
  source_row.scroll_into_view_if_needed()
  source_box=source_row.bounding_box();assert source_box is not None
  page.screenshot(path=str(out/'checklist-lower-training-source-375.png'))
  source_row.click()
  expect(page.get_by_test_id('home-training-step-detail')).to_be_visible()
  expect(page.get_by_role('tab',name='Hem')).to_have_attribute('aria-selected','true')
  detail_back=page.get_by_role('button',name='Tillbaka till Checklistan',exact=True)
  expect(detail_back).to_be_visible()
  detail_back_box=detail_back.bounding_box();assert detail_back_box is not None and detail_back_box['y']<150,f'training detail did not open at the top with its back action visible: {detail_back_box}'
  page.screenshot(path=str(out/'checklist-training-detail-375.png'))
  page.get_by_role('button',name='Markera övningen som genomförd',exact=True).click()
  expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
  expect(page.get_by_text('Idag · 3 av 5 klara',exact=True)).to_be_visible()
  completed_source=page.get_by_role('button',name=re.compile(r'Träningsuppgift: (?!.*inte klar).*klar, öppna Träning$'))
  expect(completed_source).to_be_visible()
  restored_box=completed_source.bounding_box();assert restored_box is not None
  assert abs(restored_box['y']-source_box['y'])<24,f'Checklist return did not preserve source row position: before={source_box}, after={restored_box}'
  page.screenshot(path=str(out/'checklist-training-return-complete-375.png'))
  passed('Training detail opens at top with a visible back action; lower checklist row returns at its saved scroll position')
  page.get_by_role('button',name='Tillbaka till Hem',exact=True).click()
  expect(page.get_by_text('Just nu med Luna',exact=True)).to_be_visible()
  page.get_by_role('button',name='Öppna dagens checklista',exact=True).click()
  reopened_back=page.get_by_role('button',name='Tillbaka till Hem',exact=True)
  expect(reopened_back).to_be_visible()
  reopened_back_box=reopened_back.bounding_box();assert reopened_back_box is not None and reopened_back_box['y']<150,f'Checklist reopened below its top after leaving the flow: {reopened_back_box}'
  expect(page.get_by_text('Checklista',exact=True)).to_be_visible()
  page.screenshot(path=str(out/'checklist-reopen-after-leave-375.png'))
  passed('Leaving Checklistan for Hem clears the saved offset; reopening starts at the top')
  open('checklist','&checklistCount=7&checklistScopeReset=true')
  scope_source=page.get_by_role('button',name=re.compile(r'Träningsuppgift: .*')).last
  scope_source.scroll_into_view_if_needed()
  page.get_by_role('button',name='Byt hund i testfixture',exact=True).scroll_into_view_if_needed()
  page.get_by_role('button',name='Byt hund i testfixture',exact=True).click()
  expect(page.get_by_text('Just nu med Milo',exact=True)).to_be_visible()
  page.get_by_role('button',name='Öppna dagens checklista',exact=True).click()
  scope_back=page.get_by_role('button',name='Tillbaka till Hem',exact=True)
  expect(scope_back).to_be_visible()
  scope_back_box=scope_back.bounding_box();assert scope_back_box is not None and scope_back_box['y']<150,f'Checklist after scope invalidation reopened below the top: {scope_back_box}'
  expect(page.get_by_label('Dagens checklista')).to_be_visible()
  check_filter_layout(375,3)
  page.screenshot(path=str(out/'checklist-reopen-after-scope-change-375.png'))
  passed('Scope invalidation returns to Home and reopening Checklistan starts at the top after selection change')
  assert not errors,errors
  passed('Home and Checklist navigation, review gate and standard-scale layouts')
  browser.close()
  build_info={'file':str(build_file.relative_to(repo_root)) if build_file and build_file.is_relative_to(repo_root) else str(build_file) if build_file else 'NOT PROVIDED','sha256':build_sha}
  (out/'browser-results.json').write_text(json.dumps({'branch':branch,'commit':commit,'mode':'review' if review_mode else 'public','build':build_info,'verifierSha256':verifier_sha,'passes':results,'pageErrors':errors,'scope':'Home and Checklist; synthetic data and React Native Web, not device/backend certification','deferred':'Broad accessibility, Dynamic Type, screen-reader, reduced-motion and target-size matrix after MVP release and approval'},ensure_ascii=False,indent=2)+'\n')
  (out/'flow-home-checklist-filters-results.json').write_text(json.dumps({'branch':branch,'commit':commit,'mode':'review' if review_mode else 'public','build':build_info,'verifierSha256':verifier_sha,'captures':flow_captures,'passes':[result for result in results if 'Checklist filter' in result or 'Range loading' in result or 'Historical training' in result or 'Planned routine' in result],'pageErrors':errors,'liveSupabaseRls':'NOT TESTABLE','native':'NOT TESTABLE','visualReference':'vision_rev02.jpg panel 4; see RENDER-REPORT.md for observed match and deviations'},ensure_ascii=False,indent=2)+'\n')
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
 checklist=page.get_by_text('Checklistor för valptiden',exact=True)
 if review_mode: expect(checklist).to_be_visible()
 else: expect(checklist).to_have_count(0)
 page.screenshot(path=str(out/f'home-checklist-{"on" if review_mode else "off"}-375.png'))
 passed('Home fixtures remain available at standard scale')
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
 action_label='Åtgärder för Planerad vaccination 2026-10-23';actions=page.get_by_role('button',name=action_label,exact=True);expect(actions).to_be_visible()
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
 passed('Functional Home, Log, Training, Health, Knowledge and Passport flows at standard scale')
 assert not errors,errors
 browser.close()
(out/'browser-results.json').write_text(json.dumps({'passes':results,'pageErrors':errors,'scope':'React Native Web rendering of production UI; native services stubbed, synthetic data; not device/backend certification'},ensure_ascii=False,indent=2)+'\n')
