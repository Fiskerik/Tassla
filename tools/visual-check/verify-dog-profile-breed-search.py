#!/usr/bin/env python3
import argparse
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import expect, sync_playwright


def parse_args():
    parser = argparse.ArgumentParser(description='Verify the synthetic dog-profile breed-picker journeys.')
    parser.add_argument('--base-url', default='http://127.0.0.1:4173/')
    parser.add_argument('--output-dir', default='docs/design/evidence/vision-rev02/dog-profile-breed-search/public')
    parser.add_argument('--no-capture', action='store_true', help='Run interactions without writing screenshots.')
    return parser.parse_args()


def main():
    args = parse_args()
    output = Path(args.output_dir)
    if not args.no_capture:
        output.mkdir(parents=True, exist_ok=True)
    results = []

    def record(page, label, capture=None):
        results.append(label)
        print(f'PASS {label}')
        if capture and not args.no_capture:
            page.screenshot(path=str(output / f'{capture}.png'), full_page=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'],
        )
        page = browser.new_page(viewport={'width': 375, 'height': 844}, device_scale_factor=1)
        page.on('pageerror', lambda error: (_ for _ in ()).throw(AssertionError(str(error))))

        def visit(screen, scenario='ready', state=None):
            params = {'screen': screen, 'profileScenario': scenario}
            if state:
                params['state'] = state
            page.goto(f'{args.base_url}?{urlencode(params)}')
            expect(page.get_by_test_id('profile-fixture-banner')).to_be_visible()
            page.wait_for_timeout(300)

        def trigger(name):
            return page.get_by_role('button', name=f'Ras, {name}', exact=True)

        def open_picker(name):
            trigger(name).click()
            search = page.get_by_label('Sök hundras')
            expect(search).to_be_visible()
            return search

        def close_picker_without_choice(name):
            page.get_by_role('button', name='Stäng rasväljaren').click()
            expect(page.get_by_label('Sök hundras')).to_have_count(0)
            expect(trigger(name)).to_be_visible()

        for width, height in [(375, 844), (430, 844), (375, 667)]:
            page.set_viewport_size({'width': width, 'height': height})
            visit('profile-create')
            expect(trigger('Välj ras')).to_be_visible()
            name_field = page.get_by_label('Hundens namn')
            name_field.fill('Luna')
            page.get_by_label('Födelsedatum').fill('2026-01-01')
            primary = page.get_by_role('button', name='Fortsätt', exact=True)
            expect(primary).to_be_disabled()
            record(page, f'initial profile blocks submit before selection at {width}x{height}', f'profile-create-before-selection-{width}x{height}')

            search = open_picker('Välj ras')
            search.fill('lab')
            expect(page.get_by_role('radio', name='Labrador retriever', exact=True)).to_be_visible()
            record(page, f'catalog search match at {width}x{height}', f'profile-search-match-{width}x{height}')
            close_picker_without_choice('Välj ras')
            record(page, f'closing search leaves initial selection empty at {width}x{height}')

            search = open_picker('Välj ras')
            expect(search).to_have_value('')
            search.fill('Golden')
            expect(page.get_by_role('radio', name='Golden retriever', exact=True)).to_be_visible()
            page.get_by_role('radio', name='Golden retriever', exact=True).click()
            expect(trigger('Golden retriever')).to_be_visible()
            expect(primary).to_be_enabled()
            record(page, f'explicit catalog selection enables create at {width}x{height}', f'profile-create-selected-{width}x{height}')

            search = open_picker('Golden retriever')
            search.fill('no-such-breed')
            expect(page.get_by_text('Ingen ras hittades.', exact=True)).to_be_visible()
            expect(page.get_by_role('button', name='Välj Okänd ras', exact=True)).to_be_visible()
            record(page, f'no-match offers existing unknown-catalog action at {width}x{height}', f'profile-search-no-match-{width}x{height}')
            page.get_by_role('button', name='Välj Okänd ras', exact=True).click()
            expect(trigger('Okänd ras')).to_be_visible()
            record(page, f'unknown fallback selects the listed option at {width}x{height}', f'profile-create-unknown-{width}x{height}')

        visit('profile-create', 'without-unknown')
        search = open_picker('Välj ras')
        search.fill('no-such-breed')
        expect(page.get_by_text('Ingen ras hittades.', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name='Välj Okänd ras', exact=True)).to_have_count(0)
        record(page, 'no-match omits unknown action when catalog has no matching row')
        close_picker_without_choice('Välj ras')

        visit('profile-create', 'empty')
        expect(page.get_by_text('Raslistan saknar val just nu.', exact=False)).to_be_visible()
        expect(page.get_by_role('button', name='Försök igen', exact=True)).to_be_enabled()
        expect(page.get_by_role('button', name='Fortsätt', exact=True)).to_be_disabled()
        record(page, 'empty catalog has a separate state and blocks create', 'profile-create-empty-catalog')

        visit('profile-create', 'error')
        expect(page.get_by_text('Raslistan gick inte att hämta.', exact=False)).to_be_visible()
        page.get_by_role('button', name='Försök igen', exact=True).click()
        expect(trigger('Välj ras')).to_be_visible(timeout=5000)
        record(page, 'catalog fetch error retries into the picker', 'profile-create-retry')

        visit('profile-create', 'loading')
        expect(page.get_by_text('Hämtar raslistan…', exact=True)).to_be_visible()
        record(page, 'catalog loading is visible', 'profile-create-loading')
        expect(trigger('Välj ras')).to_be_visible(timeout=5000)

        page.set_viewport_size({'width': 430, 'height': 844})
        visit('profile-add')
        expect(trigger('Välj ras')).to_be_visible()
        add_button = page.get_by_role('button', name='Lägg till hund', exact=True)
        expect(add_button).to_be_disabled()
        open_picker('Välj ras')
        page.get_by_role('radio', name='Labrador retriever', exact=True).click()
        expect(trigger('Labrador retriever')).to_be_visible()
        page.get_by_role('button', name='Avbryt', exact=True).click()
        expect(page.get_by_test_id('profile-add-cancelled')).to_be_visible()
        record(page, 'add-dog uses the picker and keeps the cancel callback', 'profile-add-cancel')

        page.set_viewport_size({'width': 375, 'height': 667})
        visit('profile-edit')
        expect(trigger('Golden retriever')).to_be_visible()
        search = open_picker('Golden retriever')
        golden_row = page.get_by_role('radio', name='Golden retriever', exact=True)
        expect(golden_row).to_be_visible()
        checked = golden_row.get_attribute('aria-checked') or golden_row.get_attribute('aria-selected')
        assert checked == 'true', f'saved edit breed should be selected, got aria state {checked!r}'
        search.fill('labrador')
        close_picker_without_choice('Golden retriever')
        record(page, 'edit starts at saved catalog ID and close preserves it', 'profile-edit-saved')

        visit('profile-edit', 'missing-breed')
        expect(page.get_by_text('Nuvarande ras (removed-breed) finns inte i listan.', exact=False)).to_be_visible()
        expect(trigger('removed-breed')).to_be_visible()
        page.get_by_role('button', name='Spara profil', exact=True).click()
        expect(page.get_by_text('Välj en ras från listan.', exact=True)).to_be_visible()
        record(page, 'missing saved edit ID is preserved until explicit replacement', 'profile-edit-missing-id')

        for state in ['saving', 'pending']:
            visit('profile-edit', state=state)
            expect(trigger('Golden retriever')).to_be_disabled()
            record(page, f'edit picker is locked during {state}', f'profile-edit-{state}')

        page.goto(f'{args.base_url}?{urlencode({"screen": "profile-create", "profileScenario": "ready"})}')
        expect(trigger('Välj ras')).to_be_visible()
        search = open_picker('Välj ras')
        search.fill('labrador')
        page.keyboard.press('Escape')
        expect(page.get_by_label('Sök hundras')).to_have_count(0)
        expect(trigger('Välj ras')).to_be_visible()
        record(page, 'Escape closes without selecting a breed')

        browser.close()

    print(f'PASS {len(results)} dog-profile breed-picker checks')


if __name__ == '__main__':
    main()
