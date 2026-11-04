"""Read a synthetic published-shaped checklist; never uses live data."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base=os.environ['TASSLA_UI_BASE_URL'].rstrip('/')
out=Path(os.environ.get('TASSLA_UI_EVIDENCE','docs/design/evidence/knowledge-read-checklist-01'))
out.mkdir(parents=True,exist_ok=True)
errors=[]
def scale_text(page):
    page.evaluate('''() => document.querySelectorAll('[dir=auto]').forEach(el=>{if(el.dataset.tasslaScaled)return;let s=getComputedStyle(el),f=parseFloat(s.fontSize),l=parseFloat(s.lineHeight);if(Number.isFinite(f))el.style.fontSize=`${f*1.4}px`;if(Number.isFinite(l))el.style.lineHeight=`${l*1.4}px`;el.dataset.tasslaScaled='true'})''')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,large in [(375,False),(430,False),(375,True),(430,True)]:
        page=browser.new_page(viewport={'width':width,'height':844 if not large else 667})
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.goto(base+'/?screen=knowledge&knowledgeChecklistFixture=true')
        if large:
            scale_text(page)
        expect(page.get_by_role('heading',name='Rekommenderat för er just nu')).to_be_visible()
        card=page.get_by_role('button',name='Läs Trygghet i nya miljöer')
        expect(card).to_be_visible();expect(card.get_by_text('Checklista',exact=True)).to_be_visible()
        expect(page.get_by_text('Test av träningsprogram')).to_have_count(0)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(out/(f'recommended-{width}'+('-large' if large else '')+'.png')))
        search=page.get_by_label('Sök i biblioteket')
        search.fill('låt valpen titta')
        if large: scale_text(page)
        expect(card).to_be_visible();page.screenshot(path=str(out/(f'search-{width}'+('-large' if large else '')+'.png')))
        card.click()
        reader=page.get_by_test_id('knowledge-article-reader')
        expect(reader.get_by_role('heading',name='Trygghet i nya miljöer')).to_be_visible()
        expect(reader.get_by_text('AI-genererat innehåll')).to_be_visible()
        if large:
            scale_text(page)
            assert reader.get_by_role('heading',name='Trygghet i nya miljöer').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)') >= 33
        expect(reader.get_by_role('checkbox')).to_have_count(0)
        page.screenshot(path=str(out/(f'reader-top-{width}'+('-large' if large else '')+'.png')))
        for text in ['Börja på en lugn plats','Plocka undan sådant','Låt nya vardagsintryck','Låt valpen titta, nosa','Avsluta och skapa mer avstånd']:
            expect(reader.get_by_text(text,exact=False)).to_have_count(1)
        refs=reader.get_by_test_id('article-references');refs.scroll_into_view_if_needed()
        expect(refs.get_by_role('link')).to_have_count(3)
        page.screenshot(path=str(out/(f'reader-sources-{width}'+('-large' if large else '')+'.png')))
        page.get_by_role('button',name='Tillbaka till biblioteket').click()
        expect(page.get_by_label('Sök i biblioteket')).to_have_value('låt valpen titta')
        expect(page.get_by_role('button',name='Läs Trygghet i nya miljöer')).to_be_visible()
        page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'/?screen=knowledge&knowledgeChecklistFixture=true&ageOutside=true')
    expect(page.get_by_text('Inget rekommenderat innehåll för den valda hunden just nu. Du kan läsa allt i biblioteket.')).to_be_visible()
    expect(page.get_by_role('button',name='Läs Trygghet i nya miljöer')).to_have_count(0)
    page.get_by_role('tab',name='Biblioteket').click()
    expect(page.get_by_role('button',name='Läs Trygghet i nya miljöer')).to_be_visible()
    page.screenshot(path=str(out/'outside-age-library.png'));page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'/?screen=knowledge&articleFixture=true')
    page.get_by_role('tab',name='Biblioteket').click()
    expect(page.get_by_role('button',name='Läs Första dygnet hemma')).to_be_visible()
    page.get_by_role('button',name='Läs Första dygnet hemma').click()
    expect(page.get_by_text('Den har lämnat sin mamma, sina syskon',exact=False)).to_be_visible()
    page.get_by_role('button',name='Tillbaka till biblioteket').click()
    expect(page.get_by_role('button',name='Läs Första dygnet hemma')).to_be_visible()
    page.close();browser.close()
assert not errors,errors
print('PASS: recommended/read/search/return/sources, outside-age library and excluded training; synthetic RNWeb')
