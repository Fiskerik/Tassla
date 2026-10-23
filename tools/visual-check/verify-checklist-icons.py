from pathlib import Path
import json
import os
import re
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect

out = Path(os.environ.get(
    'TASSLA_UI_EVIDENCE',
    str(Path(__file__).resolve().parents[2] / 'docs/design/evidence/flow-home-checklist-filters-2026-10-20/a02/public'),
))
out.mkdir(parents=True, exist_ok=True)
ui_base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4173/')
results = []
errors = []

repo = Path(__file__).resolve().parents[2]
icon_source = (repo / 'src/features/checklists/checklist-icons.ts').read_text()
token_source = (repo / 'src/theme/tokens.ts').read_text()
tone_body = re.search(r'export const CHECKLIST_ICON_TONES[^=]*=\s*\{([\s\S]*?)\n\};', icon_source)
primitive_body = re.search(r'const primitives\s*=\s*\{([\s\S]*?)\}\s+as const;', token_source)
category_body = re.search(r'export const categoryColors\s*=\s*\{([\s\S]*?)\}\s+as const;', token_source)
vision_body = re.search(r'const visionRev02Colors\s*=\s*\{([\s\S]*?)\}\s+as const;', token_source)
assert tone_body and primitive_body and category_body and vision_body, 'icon or theme token source could not be parsed'
icon_tones = dict(re.findall(r"'([^']+)':\s*'([^']+)'", tone_body.group(1)))
primitives = dict(re.findall(r"(\w+):\s*'(#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8}))'", primitive_body.group(1)))
categories = {}
for match in re.finditer(r"(\w+):\s*\{\s*fg:\s*primitives\.(\w+),\s*bg:\s*primitives\.(\w+)\s*\}", category_body.group(1)):
    categories[match.group(1)] = (primitives[match.group(2)], primitives[match.group(3)])
vision_colors = dict(re.findall(r"(\w+):\s*'(#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8}))'", vision_body.group(1)))


def as_rgb(value):
    rgb = re.fullmatch(r'rgb\((\d+),\s*(\d+),\s*(\d+)\)', value)
    assert rgb, f'expected an opaque RGB value, received {value!r}'
    return tuple(int(component) for component in rgb.groups())


def token_rgb(value):
    value = value.removeprefix('#')[:6]
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def contrast_ratio(foreground, background):
    def luminance(color):
        channels = [component / 255 for component in color]
        channels = [component / 12.92 if component <= 0.04045 else ((component + 0.055) / 1.055) ** 2.4 for component in channels]
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

    first, second = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (first + 0.05) / (second + 0.05)


def expected_tone_colors(tone):
    if tone == 'neutral':
        return token_rgb(vision_colors['textMuted']), None
    foreground, background = categories[tone]
    return token_rgb(foreground), token_rgb(background)


def passed(label):
    results.append(label)
    print('PASS', label)


with sync_playwright() as playwright:
    browser_options = {'headless': True, 'args': ['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad']}
    browser_options['executable_path'] = os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium')
    browser = playwright.chromium.launch(**browser_options)
    page = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
    page.set_default_timeout(8000)
    page.clock.install(time=datetime(2026, 10, 11, 15, 0, tzinfo=timezone.utc))
    page.on('pageerror', lambda error: errors.append(str(error)))

    def open_checklist(width, height, visual=False):
        page.set_viewport_size({'width': width, 'height': height + 32})
        fixture = '&checklistVisual=true' if visual else '&checklistCount=7'
        page.goto(f'{ui_base}?screen=checklist{fixture}')
        page.wait_for_timeout(350)
        expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()

    def long_press_kissa():
        point = page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True)
        point.scroll_into_view_if_needed()
        bounds = point.bounding_box()
        assert bounds is not None
        page.mouse.move(bounds['x'] + bounds['width'] / 2, bounds['y'] + bounds['height'] / 2)
        page.mouse.down()
        page.wait_for_timeout(700)
        page.mouse.up()
        expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_be_visible()

    def check_icon_style(test_id, tone, surface):
        icon = page.get_by_test_id(test_id).first
        icon.scroll_into_view_if_needed()
        expect(icon).to_be_visible()
        actual = icon.evaluate("""(element) => {
            const iconView = element.getAttribute('role') === 'radio'
                ? [...element.querySelectorAll('*')].find((node) => {
                    const style = getComputedStyle(node);
                    return style.display === 'flex' && style.width === '28px' && style.height === '28px';
                }) ?? element
                : element;
            const inheritedColor = getComputedStyle(iconView).color;
            const glyphColor = [...iconView.querySelectorAll('*')].map((node) => getComputedStyle(node).color)
                .find((color) => color !== inheritedColor) ?? inheritedColor;
            let backgroundNode = iconView.parentElement;
            let parentBackground = getComputedStyle(backgroundNode).backgroundColor;
            while (backgroundNode && (parentBackground === 'rgba(0, 0, 0, 0)' || parentBackground === 'transparent')) {
                backgroundNode = backgroundNode.parentElement;
                if (backgroundNode) parentBackground = getComputedStyle(backgroundNode).backgroundColor;
            }
            return {
                foreground: glyphColor,
                background: getComputedStyle(iconView).backgroundColor,
                parentBackground,
            };
        }""")
        expected_foreground, expected_background = expected_tone_colors(tone)
        assert as_rgb(actual['foreground']) == expected_foreground, \
            f'{test_id} foreground should match {tone} token: {actual}'
        if surface and expected_background is not None:
            assert as_rgb(actual['background']) == expected_background, \
                f'{test_id} needs the subtle {tone} token surface: {actual}'
            contrast_background = expected_background
        else:
            assert actual['background'] in ('rgba(0, 0, 0, 0)', 'transparent'), \
                f'{test_id} must not add a category surface: {actual}'
            contrast_background = as_rgb(actual['parentBackground'])
        ratio = contrast_ratio(expected_foreground, contrast_background)
        assert ratio >= 3, f'{test_id} icon contrast is below 3:1 ({ratio:.2f})'
        passed(f'{test_id} uses the {tone} token treatment with {ratio:.2f}:1 icon contrast')

    open_checklist(375, 844, visual=True)
    for icon, tone in [
        ('walk-outline', 'walk'), ('fitness-outline', 'training'),
        ('bandage-outline', 'vaccination'), ('moon-outline', 'sleep'),
    ]:
        check_icon_style(f'checklist-routine-icon-{icon}', tone, surface=True)
    page.screenshot(path=str(out / 'checklist-icons-toned-375x844.png'))

    for width, height in [(375, 844), (430, 844), (375, 667)]:
        open_checklist(width, height)
        if width == 375 and height == 844:
            for icon, tone in [
                ('paw', 'neutral'), ('water-outline', 'water'), ('walk-outline', 'walk'),
            ]:
                check_icon_style(f'checklist-routine-icon-{icon}', tone, surface=True)
        long_press_kissa()
        icon_button = page.get_by_role('button', name=re.compile(r'^Välj ikon för Kissa\. Aktuell ikon:'))
        expect(icon_button).to_be_visible()
        expect(icon_button).to_have_attribute('aria-expanded', 'true')
        picker = page.get_by_role('radiogroup', name='Välj ikon för Kissa', exact=True)
        expect(picker).to_be_visible()
        radios = picker.get_by_role('radio')
        expect(radios).to_have_count(20)
        expect(page.get_by_text('Välj ikon', exact=False)).to_have_count(0)
        page.screenshot(path=str(out / f'checklist-icon-picker-{width}x{height}.png'))
        for index in range(20):
            choice = radios.nth(index)
            choice.scroll_into_view_if_needed()
            expect(choice).to_be_visible()
            bounds = choice.bounding_box()
            assert bounds is not None and round(bounds['width']) >= 44 and round(bounds['height']) >= 44, \
                f'icon target below 44px at {width}x{height}: {bounds}'
            viewport = page.evaluate('({ width: innerWidth, height: innerHeight })')
            assert bounds['x'] >= 0 and bounds['x'] + bounds['width'] <= viewport['width'], \
                f'icon choice is clipped horizontally at {width}x{height}: {bounds}'
            assert bounds['y'] >= 0 and bounds['y'] + bounds['height'] <= viewport['height'], \
                f'icon choice is outside the visible picker area at {width}x{height}: {bounds}'
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), \
            f'icon picker overflows horizontally at {width}x{height}'
        passed(f'Long-press opens Kissa icon picker at {width}x{height}; all 20 choices are reachable while scrolling and have 44px targets')

        if width == 375 and height == 844:
            check_icon_style('routine-icon-choice-icon-water-outline', 'water', surface=False)
            picker.get_by_role('radio', name='Vatten', exact=True).click()
            icon_button = page.get_by_role('button', name='Välj ikon för Kissa. Aktuell ikon: Vatten', exact=True)
            icon_button.click()
            picker = page.get_by_role('radiogroup', name='Välj ikon för Kissa', exact=True)
            selected = picker.get_by_role('radio', name='Vatten', exact=True)
            expect(selected).to_have_attribute('aria-checked', 'true')
            selected_style = selected.evaluate('(element) => getComputedStyle(element).borderTopWidth')
            assert selected_style == '2px', f'selected icon needs a visible marker, received {selected_style}'
            page.screenshot(path=str(out / 'checklist-icon-picker-selected-375x844.png'))
            selected.click()
            page.get_by_role('button', name='Spara rutin Morgonrutin', exact=True).click()
            expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_have_count(0)
            check_icon_style('routine-template-icon-00000000-0000-4000-8000-000000000001', 'water', surface=True)

            # Reopen the saved template and confirm the chosen icon is still selected.
            page.get_by_role('button', name='Redigera rutin Morgonrutin', exact=True).click()
            saved_button = page.get_by_role('button', name='Välj ikon för Kissa. Aktuell ikon: Vatten', exact=True)
            expect(saved_button).to_be_visible()
            saved_button.click()
            saved_picker = page.get_by_role('radiogroup', name='Välj ikon för Kissa', exact=True)
            saved_vatten = saved_picker.get_by_role('radio', name='Vatten', exact=True)
            expect(saved_vatten).to_have_attribute('aria-checked', 'true')
            saved_picker.get_by_role('radio', name='Sol', exact=True).click()
            page.get_by_role('button', name='Stäng', exact=True).last.click()
            discard_dialog = page.get_by_role('alert', name='Kasta ändringar?', exact=True)
            expect(discard_dialog).to_be_visible()
            expect(discard_dialog.get_by_text('Dina osparade ändringar försvinner.', exact=True)).to_be_visible()
            discard_dialog.get_by_role('button', name='Fortsätt redigera', exact=True).click()
            expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_be_visible()
            page.get_by_role('button', name='Stäng', exact=True).last.click()
            discard_dialog = page.get_by_role('alert', name='Kasta ändringar?', exact=True)
            expect(discard_dialog).to_be_visible()
            discard_dialog.get_by_role('button', name='Kasta', exact=True).click()
            expect(page.get_by_role('button', name='Hantera rutiner och aktiviteter', exact=True)).to_be_visible()
            expect(page.get_by_role('checkbox', name=re.compile(r'Rutin Morgonrutin, punkt Kissa, inte klar'))).to_have_attribute('aria-checked', 'false')
            page.screenshot(path=str(out / 'checklist-icon-saved-template-375x844.png'))
            page.get_by_role('button', name='Hantera rutiner och aktiviteter', exact=True).click()
            page.get_by_role('button', name='Redigera rutin Morgonrutin', exact=True).click()
            persisted_picker_trigger = page.get_by_role('button', name='Välj ikon för Kissa. Aktuell ikon: Vatten', exact=True)
            expect(persisted_picker_trigger).to_be_visible()
            persisted_picker_trigger.click()
            persisted_picker = page.get_by_role('radiogroup', name='Välj ikon för Kissa', exact=True)
            expect(persisted_picker.get_by_role('radio', name='Vatten', exact=True)).to_have_attribute('aria-checked', 'true')
            persisted_picker.get_by_role('radio', name='Vatten', exact=True).click()
            page.get_by_role('button', name='Stäng', exact=True).last.click()
            passed('Chosen icon survives save and exact readback; dirty close can continue editing or discard without changing the saved icon')

            # Both compact icon actions present their own explanatory confirmation before mutation.
            open_checklist(375, 844)
            page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True).click()
            home_remove = page.get_by_role('button', name='Ta bort rutinen Morgonrutin från Hemskärmen', exact=True)
            delete_routine = page.get_by_role('button', name='Ta bort rutin Morgonrutin', exact=True)
            expect(home_remove).to_be_visible()
            expect(delete_routine).to_be_visible()
            delete_routine.scroll_into_view_if_needed()
            page.screenshot(path=str(out / 'routine-action-icons-375x844.png'))
            for action in [home_remove, delete_routine]:
                visible_label = action.inner_text().strip()
                assert not re.search(r'[A-Za-zÅÄÖåäö]{2,}', visible_label), \
                    f'compact icon action exposes button text: {visible_label!r}'

            page.evaluate("window.__tasslaAlertActions = ['Avbryt']")
            home_remove.click()
            alert = page.evaluate('window.__tasslaLastAlert')
            assert alert['title'] == 'Ta bort från Hemskärmen?'
            assert 'Rutinen finns kvar och kan läggas till igen.' in alert['message']
            assert alert['buttons'] == [{'text': 'Avbryt', 'style': 'cancel'}, {'text': 'Ta bort'}]
            expect(page.get_by_role('checkbox', name=re.compile(r'Rutin Morgonrutin, punkt Kissa, inte klar'))).to_be_visible()
            page.evaluate("window.__tasslaAlertActions = ['Ta bort']")
            page.get_by_role('button', name='Ta bort rutinen Morgonrutin från Hemskärmen', exact=True).click()
            expect(page.get_by_role('button', name='Lägg tillbaka rutinen Morgonrutin på Hemskärmen', exact=True)).to_be_visible()

            page.evaluate("window.__tasslaAlertActions = ['Avbryt']")
            page.get_by_role('button', name='Ta bort rutin Morgonrutin', exact=True).click()
            alert = page.evaluate('window.__tasslaLastAlert')
            assert alert['title'] == 'Ta bort rutin?'
            assert 'alla dess dagskopior och sparade överhoppningar tas bort.' in alert['message']
            assert alert['buttons'] == [{'text': 'Avbryt', 'style': 'cancel'}, {'text': 'Ta bort rutin', 'style': 'destructive'}]
            expect(page.get_by_role('button', name='Lägg tillbaka rutinen Morgonrutin på Hemskärmen', exact=True)).to_be_visible()
            page.evaluate("window.__tasslaAlertActions = ['Ta bort rutin']")
            page.get_by_role('button', name='Ta bort rutin Morgonrutin', exact=True).click()
            expect(page.get_by_role('button', name=re.compile(r'Öppna Rutin Morgonrutin, punkt'))).to_have_count(0)
            passed('Both icon-only routine actions show distinct confirmations, cancel safely, and perform the confirmed change')

    open_checklist(375, 844)
    page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True).click()
    expect(page.get_by_text('Valda träningssteg', exact=True)).to_have_count(0)
    expect(page.get_by_role('button', name='Skapa en ny rutin', exact=True)).to_have_count(0)
    page.get_by_role('button', name='Klar', exact=True).click()
    page.get_by_role('button', name='Hantera rutiner och aktiviteter', exact=True).click()
    page.get_by_role('button', name='Skapa en ny rutin', exact=True).click()
    expect(page.get_by_role('button', name='Avbryt skapa rutin', exact=True)).to_have_count(0)
    page.get_by_role('textbox', name='Namn på rutin', exact=True).fill('Kvällsvila')
    page.get_by_role('textbox', name='Checklistepunkt 1', exact=True).fill('Ta en paus')
    page.get_by_role('button', name='Välj ikon för Ta en paus. Aktuell ikon: Allmän lista', exact=True).click()
    create_picker = page.get_by_role('radiogroup', name='Välj ikon för Ta en paus', exact=True)
    expect(create_picker.get_by_role('radio')).to_have_count(20)
    create_picker.get_by_role('radio', name='Kväll', exact=True).click()
    page.get_by_role('button', name='Spara rutin', exact=True).click()
    expect(page.get_by_role('textbox', name='Namn på rutin', exact=True)).to_have_count(0)
    expect(page.get_by_text('Kvällsvila', exact=True)).to_be_visible()
    page.screenshot(path=str(out / 'routine-icon-created-375x844.png'))
    passed('The same 20-icon picker works while creating a routine and the new routine appears after save')

    assert not errors, errors
    passed('Checklist icon and routine action render has no browser errors')
    browser.close()
    (out / 'browser-results.json').write_text(json.dumps({
        'passes': results,
        'pageErrors': errors,
        'scope': 'A02 checklist icons and routine action confirmations; synthetic React Native Web fixture, not native/database certification',
    }, ensure_ascii=False, indent=2) + '\n')
