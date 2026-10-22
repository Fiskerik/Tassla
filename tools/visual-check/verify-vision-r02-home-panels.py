from __future__ import annotations

import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[2]
DAILY_CHECKLIST_SOURCE = (ROOT / 'src/features/home/DailyChecklistScreen.tsx').read_text(encoding='utf-8')
DAILY_ACTIVITY_SOURCE = (ROOT / 'src/components/ui/DailyActivityItem.tsx').read_text(encoding='utf-8')
REVIEW = os.environ.get('TASSLA_UI_REVIEW') == 'true'
BASE = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4173')
DEFAULT_EVIDENCE = ROOT / 'docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/home' / ('review' if REVIEW else 'public')
OUT = Path(os.environ.get('TASSLA_UI_EVIDENCE', DEFAULT_EVIDENCE))
OUT.mkdir(parents=True, exist_ok=True)
results: list[dict[str, object]] = []
failures: list[str] = []


def record(name: str, passed: bool, details: dict[str, object] | None = None) -> None:
    result = {'check': name, 'result': 'PASS' if passed else 'FAIL', **(details or {})}
    results.append(result)
    if not passed:
        failures.append(name)
        print(f'FAIL {name}: {details}')
    else:
        print(f'PASS {name}')


def home_url(scenario: str = 'ready', daily_mutation: str | None = None) -> str:
    mutation = f'&dailyMutation={daily_mutation}' if daily_mutation else ''
    return f'{BASE}/?screen=home&homeScenario={scenario}{mutation}'


def visible_destinations(page) -> list[dict[str, object]]:
    tiles = []
    for name in ('Öppna Logga', 'Öppna Träna', 'Öppna Kunskap'):
        locator = page.get_by_role('button', name=name, exact=True)
        expect(locator).to_be_visible(timeout=5000)
        tiles.append({'name': name, 'box': locator.bounding_box()})
    return tiles


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
        args=['--no-sandbox'],
    )
    for width, app_height in ((375, 844), (430, 844)):
        page = browser.new_page(viewport={'width': width, 'height': app_height + (32 if REVIEW else 0)})
        page_errors: list[str] = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(home_url(), wait_until='networkidle')
        expect(page.get_by_text('Dagens att göra', exact=True)).to_have_count(1)
        expect(page.get_by_test_id('home-open-checklist')).to_be_visible()
        checklist_control = page.get_by_test_id('home-open-checklist')
        expect(page.get_by_role('button', name='Öppna Checklistor', exact=True)).to_be_visible()
        checklist_chevron = page.get_by_test_id('home-open-checklist-chevron')
        expect(checklist_chevron).to_be_visible()
        control_box = checklist_control.bounding_box()
        chevron_box = checklist_chevron.bounding_box()
        record(f'Home checklist action is a chevron-only touch target at {width}px',
               control_box is not None and chevron_box is not None
               and control_box['width'] >= 44 and control_box['height'] >= 44
               and abs(control_box['width'] - 44) <= 2
               and abs(control_box['height'] - 44) <= 2
               and control_box['x'] <= chevron_box['x']
               and chevron_box['x'] + chevron_box['width'] <= control_box['x'] + control_box['width'],
               {'control': control_box, 'chevron': chevron_box})
        record(f'Home header contains no checklist or manager text action at {width}px',
               page.get_by_text('Checklista', exact=True).count() == 0
               and page.get_by_text('Visa alla', exact=True).count() == 0
               and page.get_by_text('Hantera', exact=True).count() == 0)
        tiles = visible_destinations(page)
        touch_targets = []
        for name, locator in (
            ('Checklistor chevron', page.get_by_test_id('home-open-checklist')),
            ('Logga', page.get_by_role('button', name='Öppna Logga', exact=True)),
            ('Träna', page.get_by_role('button', name='Öppna Träna', exact=True)),
            ('Kunskap', page.get_by_role('button', name='Öppna Kunskap', exact=True)),
        ):
            box = locator.bounding_box()
            touch_targets.append({'name': name, 'box': box})
        touch_targets_ok = all(target['box'] is not None and target['box']['width'] >= 44 and target['box']['height'] >= 44 for target in touch_targets)
        record(f'Home actions meet the 44pt touch target at {width}px', touch_targets_ok, {'targets': touch_targets})
        if REVIEW:
            checkbox = page.get_by_role('checkbox').first.bounding_box()
            record(f'Home routine checkbox target meets 44pt at {width}px', checkbox is not None and checkbox['width'] >= 44 and checkbox['height'] >= 44, {'box': checkbox})
        nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
        tile_bottom = max(tile['box']['y'] + tile['box']['height'] for tile in tiles if tile['box'])
        clearance = nav['y'] - tile_bottom if nav else None
        viewport_box = page.get_by_test_id('review-app-viewport').bounding_box()
        record(
            f'initial Home and three destinations at {width}x{app_height} ({"review" if REVIEW else "public"})',
            nav is not None and clearance is not None and clearance >= 16
            and viewport_box is not None and viewport_box['height'] == app_height,
            {'app_viewport': viewport_box, 'nav': nav, 'destination_tiles': tiles, 'clearance_pt': clearance},
        )
        record(f'no horizontal overflow or browser error at {width}px', page.evaluate('document.documentElement.scrollWidth <= innerWidth') and not page_errors, {'page_errors': page_errors})
        if REVIEW:
            expect(page.get_by_test_id('review-banner')).to_be_visible()
            expect(page.get_by_text('2/5', exact=True)).to_be_visible()
            expect(page.get_by_label('2 av 5 klara', exact=True)).to_be_visible()
            expect(page.get_by_role('button', name='Öppna Checklistor', exact=True)).to_be_visible()
        else:
            expect(page.get_by_text('Skapa en rutin eller välj ett träningssteg att ha med idag.', exact=True)).to_be_visible()
            record(f'public empty day has no 0/0 progress at {width}px', page.get_by_role('progressbar').count() == 0)
        page.screenshot(path=str(OUT / f'home-default-{width}.png'), full_page=True)

        # The arrow opens the full Checklistor route.
        page.get_by_test_id('home-open-checklist').click()
        expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
        expect(page.get_by_role('heading', name='Checklistor', exact=True)).to_be_visible()
        record(f'chevron opens Checklistor route at {width}px', page.evaluate('window.__homePanelsOpened') == 'checklist')
        page.screenshot(path=str(OUT / f'checklist-{width}.png'), full_page=True)
        if REVIEW:
            expect(page.get_by_text('Håll inne på rutinen för att redigera.', exact=True)).to_be_visible()
            if width == 375:
                routine_button = page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True)
                has_native_hint = "accessibilityHint={item.kind === 'routine' && routineDay?.routine_id ? 'Håll inne på rutinen för att redigera.' : undefined}" in DAILY_CHECKLIST_SOURCE
                hint_is_forwarded = 'accessibilityHint={accessibilityHint}' in DAILY_ACTIVITY_SOURCE
                record('routine detail passes the exact hold-to-edit accessibility hint', has_native_hint and hint_is_forwarded,
                       {'native_hint_source': has_native_hint, 'hint_forwarded_to_pressable': hint_is_forwarded,
                        'react_native_web_note': 'RN Web does not expose React Native accessibilityHint as a DOM attribute'})

                routine_checkbox = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)
                expect(routine_checkbox).to_have_attribute('aria-checked', 'false')
                # A normal press opens the focused manager and preserves its accessible pencil.
                routine_button.click()
                expect(page.get_by_text('Hantera Morgonrutin', exact=True)).to_be_visible()
                expect(page.get_by_role('button', name='Redigera rutin Morgonrutin', exact=True)).to_be_visible()
                record('ordinary routine press opens the focused manager without edit mode',
                       page.get_by_role('textbox', name='Namn på rutin Morgonrutin', exact=True).count() == 0)
                page.screenshot(path=str(OUT / 'checklist-routine-manager-375.png'), full_page=True)
                page.get_by_role('button', name='Stäng', exact=True).first.click()

                # A real held pointer exercises Pressable's long-press responder.
                routine_button = page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True)
                toggle_calls_before = page.evaluate('window.__routineToggleCalls || 0')
                box = routine_button.bounding_box()
                assert box is not None
                page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
                page.mouse.down()
                page.wait_for_timeout(750)
                page.mouse.up()
                expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin', exact=True)).to_be_visible()
                record('longpress opens edit mode without falling through to ordinary onPress', True)
                expect(routine_checkbox).to_have_attribute('aria-checked', 'false')
                toggle_calls_after = page.evaluate('window.__routineToggleCalls || 0')
                record('longpress does not invoke the separate routine checkbox action', toggle_calls_after == toggle_calls_before,
                       {'before': toggle_calls_before, 'after': toggle_calls_after, 'checkbox': routine_checkbox.get_attribute('aria-checked')})
                page.screenshot(path=str(OUT / 'checklist-routine-longpress-edit-375.png'), full_page=True)
                page.get_by_role('button', name='Stäng', exact=True).first.click()

        # Standard Home at 140% text; the app stays naturally scrollable with no horizontal clipping.
        page.goto(home_url(), wait_until='networkidle')
        page.evaluate("""() => {
          document.querySelectorAll('[dir="auto"]').forEach((element) => {
            const style = getComputedStyle(element);
            element.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
            element.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
          });
        }""")
        scaled_tiles = visible_destinations(page)
        record(f'140% text does not overflow horizontally at {width}px', page.evaluate('document.documentElement.scrollWidth <= innerWidth'), {'destination_tiles': scaled_tiles})
        page.screenshot(path=str(OUT / f'home-text-140-{width}.png'), full_page=True)
        page.close()

    # Loading, empty, error, unknown and partial source states keep the full-list control visible.
    for scenario, message in (
        ('loading', None),
        ('empty', 'Skapa en rutin eller välj ett träningssteg att ha med idag.'),
        ('error', 'Dagens uppgifter kunde inte hämtas. Ingen status räknas just nu.'),
        ('unknown', 'Dagens uppgifter är inte tillgängliga ännu.'),
        ('partial', 'Dagens uppgifter är inte tillgängliga ännu.'),
    ):
        page = browser.new_page(viewport={'width': 375, 'height': 844 + (32 if REVIEW else 0)})
        page.goto(home_url(scenario), wait_until='networkidle')
        expect(page.get_by_test_id('home-open-checklist')).to_be_visible()
        if message:
            expect(page.get_by_text(message, exact=True)).to_be_visible()
        if scenario in ('empty', 'unknown', 'partial'):
            record(f'{scenario} daily source does not show 0/0', page.get_by_role('progressbar').count() == 0)
        if scenario == 'error':
            expect(page.get_by_role('button', name='Hämta dagens uppgifter igen', exact=True)).to_be_visible()
        if scenario in ('unknown', 'partial'):
            expect(page.get_by_role('button', name='Hämta dagens uppgifter', exact=True)).to_be_visible()
        page.screenshot(path=str(OUT / f'home-{scenario}-375.png'), full_page=True)
        page.close()
        record(f'{scenario} state keeps one checklist control', True)

    if REVIEW:
        # Seven items preserve the total while the compact Home preview stays at five.
        page = browser.new_page(viewport={'width': 375, 'height': 876})
        page.goto(home_url('seven'), wait_until='networkidle')
        expect(page.get_by_text('2/7', exact=True)).to_be_visible()
        expect(page.get_by_label('2 av 7 klara', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name='Öppna Checklistor', exact=True)).to_be_visible()
        record('seven-item fixture shows total count and keeps only the chevron action',
               page.get_by_test_id('home-open-checklist').count() == 1
               and page.get_by_text('Visa alla', exact=True).count() == 0)
        page.screenshot(path=str(OUT / 'home-seven-items-375.png'), full_page=True)
        page.close()

        # A routine's visible check only follows confirmed persistence; each unresolved result keeps its retry path.
        for mode, message in (
            ('pending', 'Sparar…'),
            ('failed', 'Ändringen sparades inte. Kontrollera anslutningen och försök igen.'),
            ('unknown', 'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.'),
            ('readback', 'Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.'),
        ):
            page = browser.new_page(viewport={'width': 375, 'height': 876})
            page.goto(home_url('ready', mode), wait_until='networkidle')
            expect(page.get_by_text(message, exact=True)).to_be_visible()
            checkbox = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)
            expect(checkbox).to_have_attribute('aria-checked', 'false')
            if mode in ('failed', 'unknown', 'readback'):
                expect(page.get_by_role('button', name='Kontrollera ändringen för Kissa igen', exact=True)).to_be_visible()
            page.screenshot(path=str(OUT / f'home-mutation-{mode}-375.png'), full_page=True)
            record(f'{mode} routine status keeps the unconfirmed checkbox and feedback', True)
            page.close()

        # Exercise the production Home checkbox callback. The harness holds the
        # confirmed activity snapshot until its synthetic success/readback resolves.
        page = browser.new_page(viewport={'width': 375, 'height': 876})
        page.goto(home_url('ready', 'interaction'), wait_until='networkidle')
        unchecked = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)
        expect(unchecked).to_have_attribute('aria-checked', 'false')
        unchecked.click()
        expect(page.get_by_text('Sparar…', exact=True)).to_be_visible()
        expect(page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)).to_have_attribute('aria-checked', 'false')
        confirmed = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, klar', exact=True)
        expect(confirmed).to_have_attribute('aria-checked', 'true', timeout=5000)
        expect(page.get_by_label('3 av 5 dagsuppgifter klara', exact=True)).to_be_visible()
        page.screenshot(path=str(OUT / 'home-mutation-confirmed-375.png'), full_page=True)
        record('routine interaction stays unchecked while pending, then updates checkbox and count after synthetic confirmation', True)
        page.close()

    # The shorter screen is reachable by scrolling; destinations remain above the fixed menu.
    page = browser.new_page(viewport={'width': 375, 'height': 667 + (32 if REVIEW else 0)})
    page.goto(home_url(), wait_until='networkidle')
    page.get_by_role('button', name='Öppna Kunskap', exact=True).scroll_into_view_if_needed()
    last_tile = page.get_by_role('button', name='Öppna Kunskap', exact=True).bounding_box()
    nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
    record('375x667 Home scroll reaches the last destination above the menu', last_tile is not None and nav is not None and last_tile['y'] + last_tile['height'] <= nav['y'])
    page.screenshot(path=str(OUT / 'home-short-viewport-375.png'), full_page=True)
    page.close()
    browser.close()

report = {'mode': 'review' if REVIEW else 'public', 'evidence_dir': str(OUT), 'results': results, 'failures': failures}
(OUT / 'RESULTS.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'RESULTS {len(results) - len(failures)}/{len(results)} PASS; evidence={OUT}')
raise SystemExit(1 if failures else 0)
