import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
const toolsRoot = process.env.TASSLA_UI_TOOLS;
if (!toolsRoot) throw new Error('Set TASSLA_UI_TOOLS to the workspace tools directory containing node_modules/playwright.');
const { chromium } = await import(pathToFileURL(path.join(toolsRoot, 'node_modules/playwright/index.mjs')).href);
const root = process.cwd();
const outRoot = path.join(root, 'docs/design/evidence/vision-rev02/daily-progress');
const executablePath = process.env.TASSLA_CHROME;
if (!executablePath) throw new Error('Set TASSLA_CHROME to the installed Chrome/Chromium executable.');
const browser = await chromium.launch({ headless: true, executablePath });
const cases = [], interactions = [], pageErrors = [], blockedRequests = [];
const configurations = [
  { mode: 'public', port: Number(process.env.TASSLA_UI_PUBLIC_PORT || 8785) },
  { mode: 'review', port: Number(process.env.TASSLA_UI_REVIEW_PORT || 8786) },
];
async function fresh(mode, port, query, viewport={width:375,height:844}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', error => pageErrors.push(mode + query + ': ' + error.message));
  page.on('request', request => { if (new URL(request.url()).hostname !== '127.0.0.1') blockedRequests.push(mode + query + ': ' + request.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:' + port + '/' + query, { waitUntil: 'domcontentloaded' });
  return page;
}
for (const config of configurations) {
  for (const viewport of [{ w: 375, h: 844, label: '375x844' }, { w: 430, h: 844, label: '430x844' }, { w: 375, h: 667, label: '375x667' }, { w: 375, h: 844, label: '375x844-text-140', scaleText: true }]) {
    const page = await fresh(config.mode, config.port, '?screen=daily-progress&homeScenario=checklist-short', { width: viewport.w, height: viewport.h });
    await page.getByRole('heading', { name: 'Dagens framsteg' }).waitFor();
    if (viewport.scaleText) await page.evaluate(() => {
      for (const element of document.querySelectorAll('*')) {
        if (![...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) continue;
        const size = Number.parseFloat(getComputedStyle(element).fontSize);
        if (Number.isFinite(size)) element.style.setProperty('font-size', String(size * 1.4) + 'px', 'important');
      }
    });
    const checks = await page.evaluate(() => ({
      screen: document.body.innerText.includes('Dagens framsteg'),
      ring: Boolean(document.querySelector('[data-testid="daily-progress-ring"]')),
      list: document.body.innerText.includes('Det här har ni gjort idag'),
      width: document.documentElement.scrollWidth,
    }));
    const passes = [];
    if (checks.screen) passes.push('heading visible');
    if (checks.ring) passes.push('ring visible');
    if (checks.list) passes.push('activity section rendered');
    if (checks.width <= viewport.w) passes.push('no horizontal page overflow');
    const folder = path.join(outRoot, config.mode);
    await fs.mkdir(folder, { recursive: true });
    const filename = config.mode + '-daily-progress-' + viewport.label + '.png';
    await page.screenshot({ path: path.join(folder, filename), animations: 'disabled' });
    cases.push({ mode: config.mode, viewport: viewport.scaleText ? viewport.w + 'x' + viewport.h + '@140% web text proxy' : viewport.label, documentWidth: checks.width, passes, screenshot: filename });
    await page.close();
  }
  for (const state of [
    { label:'loading', query:'?screen=daily-progress&state=loading', expected:'Hämtar dagens framsteg' },
    { label:'error', query:'?screen=daily-progress&state=error', expected:'Dagens framsteg kunde inte hämtas. Ingen status räknas just nu.' },
    { label:'empty', query:'?screen=daily-progress&homeScenario=checklist-empty', expected:'Inga uppgifter valda för idag.' },
    { label:'stale', query:'?screen=daily-progress&workspaceState=refresh-error', expected:'Uppdateringen kunde inte hämtas. Visar senast bekräftade uppgifter.' },
  ]) {
    const page = await fresh(config.mode, config.port, state.query);
    const body = await page.locator('body').innerText();
    const ringLocator = page.locator('[data-testid="daily-progress-ring"]');
    const role = await ringLocator.count() ? await ringLocator.getAttribute('role') : null;
    const expectedRendered = state.label === 'loading'
      ? await page.locator('[role="region"][aria-label="Hämtar dagens framsteg"]').count() > 0
      : body.includes(state.expected);
    const checks = {
      expected: expectedRendered,
      noFalseProgress: state.label !== 'stale' || !role,
      noHorizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    };
    const passes = Object.entries(checks).filter(([,ok])=>ok).map(([key])=>key);
    const filename = config.mode + '-daily-progress-' + state.label + '-375x844.png';
    await page.screenshot({ path: path.join(outRoot, config.mode, filename), animations:'disabled' });
    cases.push({ mode:config.mode, viewport:'state:' + state.label + ' 375x844', passes, screenshot:filename });
    await page.close();
  }
}
for (const config of configurations) {
 const width=430,height=844;
 const page=await fresh(config.mode,config.port,'?screen=daily-progress&workspaceState=refresh-error',{width,height});
 await page.getByRole('heading',{name:'Dagens framsteg'}).waitFor();
 const data=await page.evaluate(()=>{
  const ring=document.querySelector('[data-testid="daily-progress-ring"]');
  const circles=[...ring.querySelectorAll('circle')].map(circle=>({stroke:getComputedStyle(circle).stroke,strokeWidth:circle.getAttribute('stroke-width')}));
  return {text:document.body.innerText,role:ring?.getAttribute('role'),width:document.documentElement.scrollWidth,circles};
 });
 const checks={staleDisclosure:data.text.includes('Uppdateringen kunde inte hämtas. Visar senast bekräftade uppgifter.'),neutralStaleCount:data.text.includes('uppdatering behövs'),noProgressbar:data.role!=='progressbar',noOverflow:data.width<=width,smoothSvgRing:data.circles.length>0&&data.circles.every(circle=>circle.strokeWidth==='12')};
 const passes=Object.entries(checks).filter(([,value])=>value).map(([key])=>key);
 const filename=config.mode+'-daily-progress-stale-430x844.png';
 await page.screenshot({path:path.join(outRoot,config.mode,filename),animations:'disabled',fullPage:true});
 cases.push({mode:config.mode,viewport:'state:stale 430x844',details:{role:data.role,circleCount:data.circles.length,strokes:data.circles.map(circle=>circle.stroke)},passes,screenshot:filename});
 await page.close();
}
for (const width of [375,430]) {
 for (const scenario of [
  {label:'half-known',query:'?screen=daily-progress&homeScenario=ready'},
  {label:'partial-unknown',query:'?screen=daily-progress&homeScenario=checklist-unavailable'},
  {label:'full-known',query:'?screen=daily-progress&homeScenario=progress-full'},
  {label:'full-known-plus-unknown',query:'?screen=daily-progress&homeScenario=progress-unknown-full'},
 ]) {
  const page=await fresh('review',Number(process.env.TASSLA_UI_REVIEW_PORT||8786),scenario.query,{width,height:844});
  const data=await page.evaluate(()=>{
   const ring=document.querySelector('[data-testid="daily-progress-ring"]');
   const circles=[...ring.querySelectorAll('circle')].map(circle=>({
    stroke:getComputedStyle(circle).stroke,
    strokeWidth:circle.getAttribute('stroke-width'),
    dasharray:(circle.getAttribute('stroke-dasharray')||'').split(/[ ,]+/).filter(Boolean).map(Number),
    dashoffset:Number(circle.getAttribute('stroke-dashoffset')||0),
    transform:circle.getAttribute('transform'),
   }));
   const trainingMarker=document.querySelector('[data-testid="daily-progress-training-status"]');
   return {text:document.body.innerText,role:ring?.getAttribute('role'),label:ring?.getAttribute('aria-label'),circles,
    trainingMarkerColor:trainingMarker?getComputedStyle(trainingMarker).backgroundColor:null,
    box:[...document.querySelectorAll('[role="checkbox"]')].map(element=>{const rect=element.getBoundingClientRect();return [rect.width,rect.height]})};
  });
  const circumference=2*Math.PI*100;
  const near=(actual,expected)=>Number.isFinite(actual)&&Math.abs(actual-expected)<0.05;
  const track=data.circles[0];
  const green=data.circles.find(circle=>circle.stroke==='rgb(53, 135, 90)');
  const unknown=data.circles.find(circle=>circle.stroke==='rgb(245, 182, 63)');
  const checks={smoothSvgRing:data.circles.length>=2&&Boolean(track&&green)&&data.circles.every(circle=>circle.strokeWidth==='12')&&green.transform==='rotate(-90)'};
  if(scenario.label==='half-known')Object.assign(checks,{halfCount:/3 av 6/.test(data.text),halfArcExact:Boolean(green&&near(green.dasharray[0],circumference/2)&&near(green.dasharray[1],circumference/2)),semanticProgressbar:data.role==='progressbar',numericAccessibleLabel:/3 av 6 bekräftade/.test(data.label||'')});
  if(scenario.label==='partial-unknown')Object.assign(checks,{partialShown:/3 av 5/.test(data.text),unknownDisclosed:/status kan inte bekräftas/i.test(data.text),unknownNotProgressbar:data.role!=='progressbar',unknownArcExact:Boolean(unknown&&near(unknown.dasharray[0],circumference*8/360)&&near(unknown.dashoffset,-circumference*352/360))});
  if(scenario.label==='full-known')Object.assign(checks,{fullCount:/6 av 6/.test(data.text),fullArc:Boolean(green&&green.dasharray.length===0),semanticProgressbar:data.role==='progressbar',numericAccessibleLabel:/6 av 6 bekräftade/.test(data.label||''),checkboxHitTargets44:data.box.length>0&&data.box.every(([boxWidth,boxHeight])=>boxWidth>=44&&boxHeight>=44),completedTrainingMarker:data.trainingMarkerColor==='rgb(33, 116, 72)'});
  if(scenario.label==='full-known-plus-unknown')Object.assign(checks,{confirmedCount:/5 av 5/.test(data.text),unknownDisclosed:/1 uppgift har en status/.test(data.text),notFullProgressbar:data.role!=='progressbar',accessibleTextHasUnknown:/status kan inte bekräftas/i.test(data.text),unknownArcExact:Boolean(green&&unknown&&near(green.dasharray[0],circumference*351/360)&&near(unknown.dasharray[0],circumference*8/360)&&near(unknown.dashoffset,-circumference*352/360))});
  const passes=Object.entries(checks).filter(([,value])=>value).map(([key])=>key);
  const filename=`review-daily-progress-${scenario.label}-${width}x844.png`;
  await page.screenshot({path:path.join(outRoot,'review',filename),animations:'disabled',fullPage:true});
  cases.push({mode:'review',viewport:`state:${scenario.label} ${width}x844`,details:{role:data.role,circleCount:data.circles.length,strokes:data.circles.map(circle=>circle.stroke),greenDasharray:green?.dasharray,unknownDasharray:unknown?.dasharray,unknownDashoffset:unknown?.dashoffset,trainingMarkerColor:data.trainingMarkerColor},passes,screenshot:filename});
  await page.close();
 }
}
{
 const page=await fresh('review',8786,'?screen=daily-progress&homeScenario=ready');
 const checkbox=page.getByRole('checkbox',{name:/punkt Kissa, inte klar/});
 const hit=await checkbox.boundingBox();
 await checkbox.click();
 await page.getByRole('checkbox',{name:/punkt Kissa, klar/}).waitFor();
 const afterText=await page.locator('body').innerText();
 const checks={routineToggleConfirmed:true,countChanged:afterText.includes('4 av 6 klara')||afterText.includes('4 av 6 bekräftade'),checkboxAtLeast44:Boolean(hit&&hit.width>=44&&hit.height>=44)};
 const passes=Object.entries(checks).filter(([,v])=>v).map(([k])=>k);
 const filename='review-daily-progress-routine-toggle-375x844.png';
 await page.screenshot({path:path.join(outRoot,'review',filename),animations:'disabled'});
 interactions.push({name:'synthetic routine toggle through rendered callback',passes,after:afterText.match(/\d av \d+(?: bekräftade)? klara/)?.[0]??null,screenshot:filename,limitation:'callback fixture only; no live persistence/readback'});
 await page.close();
}
{
 const page=await fresh('review',8786,'?screen=daily-progress&homeScenario=ready&dailyMutation=unknown');
 const retry=page.getByRole('button',{name:/Kontrollera ändringen för Kissa igen/});
 const visibleBefore=await retry.isVisible();
 await retry.click();
 await page.getByRole('button',{name:/Kontrollera ändringen för Kissa igen/}).waitFor({state:'detached'});
 const checks={unknownStateVisibleBefore:visibleBefore,retryClearsSyntheticUnknown:!await page.getByRole('button',{name:/Kontrollera ändringen för Kissa igen/}).count()};
 interactions.push({name:'synthetic uncertain routine mutation recovery affordance',passes:Object.entries(checks).filter(([,v])=>v).map(([k])=>k),limitation:'fixture clears the simulated status; does not exercise Supabase mutation/readback'});
 await page.close();
}
{
 const page=await fresh('review',8786,'?screen=daily-progress&homeScenario=ready');
 const before=await page.evaluate(()=>{const sc=[...document.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+10);sc.scrollTop=Math.max(0,sc.scrollHeight-sc.clientHeight);return sc.scrollTop});
 await page.getByRole('button',{name:/Träningsuppgift: Vila nära/}).click();
 await page.getByRole('button',{name:'Stäng'}).first().click({force:true});
 await page.getByRole('heading',{name:'Dagens framsteg'}).waitFor();
 const after=await page.evaluate(()=>[...document.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+10)?.scrollTop??0);
 const checks={opensExactTraining:await page.getByRole('button',{name:/Träningsuppgift: Vila nära/}).count()===1,returnsToDailyProgress:await page.getByRole('heading',{name:'Dagens framsteg'}).count()===1,scrollRestored:Math.abs(after-before)<=2};
 interactions.push({name:'exact training target open/return and daily progress scroll restoration',passes:Object.entries(checks).filter(([,v])=>v).map(([k])=>k),scrollTopBefore:before,scrollTopAfter:after});
 await page.close();
}
{
 const page=await fresh('review',8786,'?screen=home&homeScenario=ready');
 const link=page.getByTestId('home-open-daily-progress');
 const before=await page.evaluate(()=>{const sc=[...document.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+10);sc.scrollTop=Math.max(0,sc.scrollHeight-sc.clientHeight);return sc.scrollTop});
 await link.click();
 await page.getByRole('heading',{name:'Dagens framsteg'}).waitFor();
 await page.getByRole('button',{name:'Tillbaka till Hem'}).click();
 await page.getByTestId('home-open-daily-progress').waitFor();
 const after=await page.evaluate(()=>[...document.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+10)?.scrollTop??0);
 const checks={routeBackToHome:await page.getByTestId('home-open-daily-progress').count()===1,homeScrollRestored:Math.abs(after-before)<=2};
 interactions.push({name:'Home shortcut return retains Home scroll',passes:Object.entries(checks).filter(([,v])=>v).map(([k])=>k),scrollTopBefore:before,scrollTopAfter:after});
 const filename='review-daily-progress-home-scroll-return-375x844.png';
 await page.screenshot({path:path.join(outRoot,'review',filename),animations:'disabled'});
 await page.close();
}
{
 const page=await fresh('public',8785,'?screen=daily-progress&workspaceState=refresh-error');
 const data=await page.evaluate(()=>({text:document.body.innerText,role:document.querySelector('[data-testid="daily-progress-ring"]')?.getAttribute('role'),width:document.documentElement.scrollWidth}));
 const checks={staleDisclosure:data.text.includes('Uppdateringen kunde inte hämtas. Visar senast bekräftade uppgifter.'),neutralStaleCount:data.text.includes('uppdatering behövs'),noProgressbar:data.role!=='progressbar',noOverflow:data.width<=375};
 const passes=Object.entries(checks).filter(([,v])=>v).map(([k])=>k);
 const filename='public-daily-progress-refresh-error-375x844.png';
 await page.screenshot({path:path.join(outRoot,'public',filename),animations:'disabled'});
 interactions.push({name:'stale refresh failure shows neutral last-confirmed state',passes,screenshot:filename});
 await page.close();
}
await browser.close();
const result={scope:'R6 daily progress; synthetic React Native Web fixtures only',capture:{reducedMotion:'prefers-reduced-motion: reduce',animations:'disabled for screenshots',date:new Date().toISOString()},viewports:cases,interactions,pageErrors,blockedRequests,limitations:['No live Supabase writes/readback or RLS.','No native iOS/Android VoiceOver, Dynamic Type or physical safe-area testing.','140% text is a browser proxy.']};
await fs.writeFile(path.join(outRoot,'browser-results.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(pageErrors.length||blockedRequests.length||cases.some(c=>!c.passes.length)||interactions.some(i=>!i.passes.length))process.exitCode=1;
