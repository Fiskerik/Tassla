import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppScreen} from '../../src/components/AppPrimitives';
import {StyleSheet, Text, View} from 'react-native';
import {BottomNav,Button} from '../../src/components/ui';
import {ScreenTransition} from '../../src/components/ui/Motion';
import {HomeScreen} from '../../src/features/home/HomeScreen';
import {DailyChecklistScreen} from '../../src/features/home/DailyChecklistScreen';
import type {HomeDailyFixtureItem} from '../../src/features/home/HomeScreen';
import type {HomeDailyActivity} from '../../src/features/home/daily-activity-model';
import type {DailyRoutine,DailyRoutineChecklistItem,DailyRoutineCreateInput,DailyRoutineDay,DailyRoutineDaySkip,DailyRoutineRepeatValues} from '../../src/features/home/daily-activity-data';
import {isRoutineDueOnDate,isoWeekdayForDateKey} from '../../src/features/home/daily-activity-model';
import {LogScreen} from '../../src/features/puppy-log/LogScreen';
import type {AccidentKind,AccidentLogIntent,LogEvent,LogEventChanges,LogEventType} from '../../src/features/puppy-log/log-model';
import {ComponentGalleryScreen} from '../../src/components/ui/ComponentGalleryScreen';
import {HealthScreen} from '../../src/features/health/HealthScreen';
import {PlannedHealthScreen} from '../../src/features/health/PlannedHealthScreen';
import {KnowledgeScreen} from '../../src/features/knowledge/KnowledgeScreen';
import {PublishedTrainingScreen} from '../../src/features/training/PublishedTrainingScreen';
import type {PublishedTrainingProgram} from '../../src/data/workspace-data';
import {REVIEW_TRAINING_PROGRAMS} from '../../src/features/knowledge/review-content';
import {localDate} from '../../src/features/onboarding/dog';
import {homeAgeInWeeks} from '../../src/features/home/home-today';
import {PassportScreen} from '../../src/features/passport/PassportScreen';
import {MoreScreen} from '../../src/features/more/MoreScreen';
import {DogProfileScreen} from '../../src/features/onboarding/DogProfileScreen';
import {EditDogProfileScreen} from '../../src/features/onboarding/EditDogProfileScreen';
import {NotificationSettingsScreen} from '../../src/features/notifications/NotificationSettingsScreen';
import {AccountSettingsScreen} from '../../src/features/account/AccountSettingsScreen';
import {BetaInfoScreen} from '../../src/features/account/BetaInfoScreen';
import {SignInScreenView} from '../../src/features/account/SignInScreenView';
import {AuthCallbackView} from '../../src/features/account/AuthCallbackView';
import {ProfileScreen} from '../../src/features/onboarding/ProfileScreen';
import {tokens} from '../../src/theme/tokens';
import {MainSwipeNavigation} from '../../src/components/ui/MainSwipeNavigation';
import {isMainTabDestination,nextMainTabDestination} from '../../src/features/home/main-navigation';
import {workspaceSnapshotReadDecision} from '../../src/data/workspace-data';
type FixtureLogMutation={kind:'add'|'update'|'delete'|'undo';id:string;mutationId:string;type:LogEventType;occurredAt:string;status:'pending'|'failed'|'unsure'|'saved';accidentKinds?:AccidentKind[]|null};
const today=new URLSearchParams(location.search).get('today')||localDate();
function shiftFixtureDate(dateKey:string,days:number){const date=new Date(`${dateKey}T00:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);}
function subtractFixtureMonths(dateKey:string,months:number){const date=new Date(`${dateKey}T00:00:00Z`);const monthIndex=date.getUTCFullYear()*12+date.getUTCMonth()-months;const year=Math.floor(monthIndex/12);const month=monthIndex-year*12;const day=Math.min(date.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate());return `${String(year).padStart(4,'0')}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;}
function localDateKey(offset=0){const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+offset);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function logEvent(id,date,minutes,type:LogEventType,note:string|null=null,accidentKinds:AccidentKind[]|null=null):LogEvent{const hours=String(Math.floor(minutes/60)).padStart(2,'0');const mins=String(minutes%60).padStart(2,'0');return {id,dogId:'test-dog',type,occurredAt:`${date}T${hours}:${mins}:00`,note,origin:'local-test',accidentKinds};}
const logSplitPage=Array.from({length:40},(_,index)=>logEvent(`split-${index}`,localDateKey(),23*60+45-index*32,['pee','food','poop','walk','sleep'][index%5],index===0?'Efter kvällspromenaden':null));
const logSplitContinuation=[logEvent('split-cont-1',localDateKey(),2*60+55,'pee','Fortsättning på samma dag'),logEvent('split-cont-2',localDateKey(),2*60+10,'food'),logEvent('split-older-boundary',localDateKey(-1),23*60+50,'sleep')];
const accidentEditFixtures:Record<string,LogEvent[]>={
 'accident-edit-typed':[logEvent('accident-typed',localDateKey(),8*60+11,'accident',null,['pee','poop'])],
 'accident-edit-pee':[logEvent('accident-pee',localDateKey(),8*60+11,'accident',null,['pee'])],
 'accident-edit-poop':[logEvent('accident-poop',localDateKey(),8*60+11,'accident',null,['poop'])],
 'accident-edit-both':[logEvent('accident-both',localDateKey(),8*60+11,'accident',null,['pee','poop'])],
 'accident-edit-legacy':[logEvent('accident-legacy',localDateKey(),8*60+11,'accident')],
 'accident-edit-long-note':[logEvent('accident-long-note',localDateKey(),8*60+11,'accident','Efter en lång och lite stökig promenad runt kvarteret valde Luna en plats nära porten, och vi vill kunna läsa anteckningen utan att den tränger ihop tiden eller olyckssymbolen.',['pee'])],
 'accident-patterns':[logEvent('pattern-pee-old',localDateKey(),8*60,'pee'),logEvent('pattern-pee-accident',localDateKey(),8*60+12,'accident',null,['pee']),logEvent('pattern-poop-old',localDateKey(-1),8*60+11,'poop'),logEvent('pattern-poop-accident',localDateKey(),6*60+11,'accident',null,['poop'])],
 'accident-duplicate':[logEvent('accident-recent',localDateKey(),new Date().getHours()*60+new Date().getMinutes(),'accident',null,['pee'])],
};
const ageUnitParam=new URLSearchParams(location.search).get('ageUnit');
const ageDisplayUnit=ageUnitParam==='months'?'months':ageUnitParam==='years'?'years':'weeks';
const ageExampleParam=new URLSearchParams(location.search).get('ageExample');
const fixtureBirthDate=ageExampleParam==='week20'?shiftFixtureDate(today,-140):ageExampleParam==='week21'?shiftFixtureDate(today,-141):ageExampleParam==='birthday'?subtractFixtureMonths(today,12):ageExampleParam==='after-birthday'?shiftFixtureDate(subtractFixtureMonths(today,12),-1):ageExampleParam==='leap'?'2024-02-29':ageExampleParam==='stage-six'?subtractFixtureMonths(today,6):ageExampleParam==='stage-two-years'?subtractFixtureMonths(today,24):ageExampleParam==='invalid'?'2026-02-31':ageExampleParam==='future'?shiftFixtureDate(today,1):ageExampleParam==='missing'?'':shiftFixtureDate(today,-(ageExampleParam==='calendar'?494:77));
const breedParam=new URLSearchParams(location.search).get('breed');
const fixtureBreed=breedParam==='long'?'Nova Scotia Duck Tolling Retriever':'Golden retriever';
const dog={id:'test-dog',name:'Luna',breed_id:'golden',birth_date:fixtureBirthDate,age_display_unit:ageDisplayUnit};
const homeDenseFixture={events:(['food','pee','poop','walk','sleep'] as LogEventType[]).map((type,i)=>({id:'event-'+i,dogId:dog.id,type,occurredAt:today+'T'+['12:05','10:30','08:20','07:15','06:50'][i]+':00',note:['Åt allt',null,null,'20 minuter',null][i],origin:'local-test' as const,accidentKinds:null})),trainingStep:'Hantering av tassar',plan:{id:'today-plan',dog_id:dog.id,event_type:'vaccination',due_on:today,due_time:'16:30',description:'Vaccination idag',reminder_enabled:false,reminder_minutes:null,created_at:today}};
const homeReviewFixture:HomeDailyFixtureItem[]=[
 {id:'morning-pee',label:'Kissa',detail:'Morgonrutin',category:'pee',completed:false,destination:'log',routineId:'routine-morning',routineLabel:'Morgonrutin'},
 {id:'morning-water',label:'Fyll på vatten',detail:'Morgonrutin',category:'water',completed:true,destination:'log',routineId:'routine-morning',routineLabel:'Morgonrutin'},
 {id:'walk-short',label:'Gå en kort runda',detail:'Promenad',category:'walk',completed:false,destination:'log',routineId:'routine-walk',routineLabel:'Promenad'},
 {id:'walk-paws',label:'Torka tassar',detail:'Promenad',category:'walk',completed:true,destination:'log',routineId:'routine-walk',routineLabel:'Promenad'},
 {id:'handling',label:'Miljöträning – nya ljud',detail:'Vecka 11 · Trygghet och vardag',category:'training',completed:false,destination:'training',kind:'training'},
];
const routineMorningItems:DailyRoutineChecklistItem[]=[{id:'00000000-0000-4000-8000-000000000001',label:'Kissa'},{id:'00000000-0000-4000-8000-000000000002',label:'Fyll på vatten'}];
const routineWalkItems:DailyRoutineChecklistItem[]=[{id:'00000000-0000-4000-8000-000000000003',label:'Ta på sele'},{id:'00000000-0000-4000-8000-000000000004',label:'Gå en kort runda'},{id:'00000000-0000-4000-8000-000000000005',label:'Torka tassar'}];
const routineEveningItems:DailyRoutineChecklistItem[]=[{id:'00000000-0000-4000-8000-000000000006',label:'Borsta tänderna'},{id:'00000000-0000-4000-8000-000000000007',label:'Förbered kvällsmat'}];
const reviewRoutines:DailyRoutine[]=[
 {id:'routine-morning',dog_id:dog.id,label:'Morgonrutin',checklist:routineMorningItems,checklist_revision:1,legacy_single_item:false,repeat_unit:'day',repeat_interval:1,repeat_weekdays:null,repeat_anchor_date:today},
 {id:'routine-walk',dog_id:dog.id,label:'Promenad',checklist:routineWalkItems,checklist_revision:1,legacy_single_item:false,repeat_unit:'week',repeat_interval:1,repeat_weekdays:[1,5],repeat_anchor_date:today},
 {id:'routine-evening',dog_id:dog.id,label:'Kvällsrutin',checklist:routineEveningItems,checklist_revision:1,legacy_single_item:false,repeat_unit:'week',repeat_interval:2,repeat_weekdays:null,repeat_anchor_date:today},
];
const reviewRoutineDays:DailyRoutineDay[]=[
 {id:'day-morning',dog_id:dog.id,routine_id:'routine-morning',date_key:today,time_zone:'Europe/Stockholm',routine_label_snapshot:'Morgonrutin',checklist_snapshot:routineMorningItems,completed_item_ids:[routineMorningItems[1].id],completed_at:null,is_recurring_occurrence:true,routine_revision_snapshot:1,routine_day_revision:1,last_state_mutation_id:null},
 {id:'day-walk',dog_id:dog.id,routine_id:'routine-walk',date_key:today,time_zone:'Europe/Stockholm',routine_label_snapshot:'Promenad',checklist_snapshot:routineWalkItems,completed_item_ids:[routineWalkItems[0].id,routineWalkItems[2].id],completed_at:null,is_recurring_occurrence:true,routine_revision_snapshot:1,routine_day_revision:1,last_state_mutation_id:null},
];
function fixtureDailyActivities(routines:DailyRoutine[],days:DailyRoutineDay[]):HomeDailyActivity[]{
 const routineRows=days.filter(day=>routines.some(routine=>routine.id===day.routine_id&&routine.dog_id===dog.id)).flatMap(day=>day.checklist_snapshot.map(item=>({
  id:`routine:${day.id}:${item.id}`,label:item.label,routineLabel:day.routine_label_snapshot,routineItemId:item.id,kind:'routine' as const,
  completed:day.completed_item_ids.includes(item.id),routineDay:day,
 })));
 return [...routineRows,{id:'training:day-step',label:'Miljöträning – nya ljud',kind:'training',completed:false,programTitle:'Vecka 11',trainingSelection:{id:'selection-1',dog_id:dog.id,program_version_id:'review-version-11',step_id:'step-2',date_key:today,time_zone:'Europe/Stockholm'}}];
}
const reviewTrainingOptions=[{programId:'review-program',versionId:'review-version-11',stepId:'step-3',programTitle:'Vecka 11',stepTitle:'Miljöträning ute'}];
const initialEvents:LogEvent[]=homeDenseFixture.events;
const content=[{id:'guide1',title:'En trygg start hemma',body:'Så skapar du lugn, rutin och trygghet de första veckorna.\n\n## En plats att landa\n\nGör plats för valpens saker och låt vardagen ta form i er takt.\n\n- En egen sovplats\n- Tid tillsammans',contentType:'guide'},{id:'guide2',title:'Hantera din valp',body:'Lär känna varandra i lugn och ro.',contentType:'article'},{id:'guide3',title:'Inför hemkomsten',body:'En lista över vad du behöver förbereda.',contentType:'checklist'},...(process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true'?[{id:'review-v1:training:home-harness',title:'Syntetiskt granskningsprogram',body:'Endast syntetiskt innehåll för interaktionsprov. Inte publicerat träningsråd.',contentType:'training_program'}]:[])].map(x=>({...x,version:1,contentId:x.id,sources:['Syntetiskt innehåll för UI-prov, inte publicerat råd.']}));
const history=[{id:'h1',dog_id:dog.id,event_type:'vaccination',occurred_on:'2026-09-28',occurred_time:'14:20',description:'Vaccination valp 1'},{id:'h2',dog_id:dog.id,event_type:'vet_visit',occurred_on:'2026-09-12',occurred_time:null,description:'Första besöket'}];
const weights=[{id:'w1',dog_id:dog.id,occurred_on:'2026-10-07',weight_kg:5.2}];
const initialPlan=[{id:'overdue',dog_id:dog.id,event_type:'vet_visit',due_on:new Date(Date.now()-86400000).toISOString().slice(0,10),due_time:null,description:'Uppföljning',reminder_enabled:false,reminder_minutes:null,created_at:today},{id:'p1',dog_id:dog.id,event_type:'vaccination',due_on:new Date(Date.now()+12*86400000).toISOString().slice(0,10),due_time:'10:30',description:'Vaccination valp 2',reminder_enabled:false,reminder_minutes:null,created_at:today}];
const initialProgram={id:'t1',content_id:'t1',version:1,title:'Vecka 11',body:'Trygghet och vardagsliv.',sources:['Syntetiskt program för interaktionstest.'],completedStepIds:['s0'],completedAtByStepId:{},steps:['Hantering (tassar, öron, mun)','Miljöträning – nya ljud','Ensamhet – korta stunder','Inkallning – grunder','Möte med andra hundar'].map((title,i)=>({id:'s'+i,position:i,title,instruction:'Testinstruktion för att kontrollera läsning och sparflöde. Inget publicerat träningsråd.'}))};
const publicTrainingFixture:PublishedTrainingProgram[]=[
 {...initialProgram,id:'fixture-training:trygg-start',content_id:'fixture-training:trygg-start',title:'Trygg vardagsstart',body:'Syntetiskt innehåll för visuell granskning. Inte ett publicerat träningsprogram.',sources:['Syntetiskt UI-fixture – inte publicerat träningsråd.'],completedStepIds:['trygg-1'],completedAtByStepId:{'trygg-1':'2026-10-13T08:00:00.000Z'},steps:[{id:'trygg-1',position:0,title:'Utforska i egen takt',instruction:'Syntetisk text för layoutgranskning.'},{id:'trygg-2',position:1,title:'En lugn paus',instruction:'Syntetisk text för layoutgranskning.'},{id:'trygg-3',position:2,title:'Vila nära',instruction:'Syntetisk text för layoutgranskning.'}]},
 {...initialProgram,id:'fixture-training:kontakt',content_id:'fixture-training:kontakt',title:'Kontakt i vardagen',body:'Syntetiskt innehåll för visuell granskning. Inte ett publicerat träningsprogram.',sources:['Syntetiskt UI-fixture – inte publicerat träningsråd.'],completedStepIds:[],steps:[{id:'kontakt-1',position:0,title:'Hitta varandra',instruction:'Syntetisk text för layoutgranskning.'},{id:'kontakt-2',position:1,title:'Följ en rörelse',instruction:'Syntetisk text för layoutgranskning.'}]},
];
function trainingScenarioFixture(scenario:string,reviewMode:boolean):PublishedTrainingProgram[]{
 const source=reviewMode?[...REVIEW_TRAINING_PROGRAMS]:publicTrainingFixture;
 if(scenario==='unknown-age'&&reviewMode)return source.map((program,index)=>({...program,completedStepIds:index===0&&program.steps.length?[program.steps[0].id]:[]}));
 if(scenario==='unstarted')return source.map(program=>({...program,completedStepIds:[]}));
 if(scenario==='half')return source.map((program,index)=>({...program,completedStepIds:index===1&&program.steps.length?[program.steps[0].id]:[]}));
 if(scenario==='complete')return source.map((program,index)=>({...program,completedStepIds:index===1?program.steps.map(step=>step.id):[]}));
 if(scenario==='later-completed')return source.map((program,index)=>index===0?{...program,completedStepIds:program.steps.flatMap((step,stepIndex)=>stepIndex===0||stepIndex===2?[step.id]:[])}:program);
 if(scenario==='several')return source.map((program,index)=>({...program,completedStepIds:program.steps.length?[program.steps[0].id]:[],steps:program.steps.map((step,stepIndex)=>index===0&&stepIndex===1?{...step,title:'Miljöträning – nya ljud och oväntade möten i lugn takt'}:step)}));
 if(scenario==='long-title')return source.map((program,index)=>index===0?{...program,title:'Trygg vardagsstart med lugna steg för nya situationer',steps:program.steps.map((step,stepIndex)=>stepIndex===1?{...step,title:'Öva på att pausa och hitta trygghet i en ny miljö'}:step)}:program);
 return source;
}
function fixtureQuery(table){const query={eq(){return query;},order(){return query;},abortSignal(){return query;},maybeSingle(){return Promise.resolve({data:null,error:null});},then(resolve,reject){const data=table==='breeds'?[{id:'golden',name:'Golden retriever'}]:[];return Promise.resolve({data,error:null}).then(resolve,reject);}};return query;}
const client={from:table=>({select:()=>fixtureQuery(table)})};
const profileClient={from:()=>({select:()=>({order:()=>({abortSignal:async()=>{const scenario=new URLSearchParams(location.search).get('profileScenario');if(scenario==='loading')await new Promise(resolve=>setTimeout(resolve,1400));if(scenario==='error')return {data:null,error:{message:'synthetic read error'}};return {data:[{id:'golden',name:'Golden retriever'}],error:null};}})})})};
function isFixtureAccountCurrent(){return true;}
function WorkspaceRetentionFixture({review}:{review:boolean}){
 const [result,setResult]=useState<{requests:number;joined:number;cacheHits:number;trips:number;trace:string[]}|null>(null);
 function runTrace(){
  const scope='fixture-account:fixture-dog:2026-10-15:Europe/Stockholm:public';
  const refreshMs=60_000;let now=1_000;let trainingFlight:string|null=null;let dailyFlight:string|null=null;
  let trainingCache:{scope:string;at:number}|null=null;let dailyCache:{scope:string;at:number}|null=null;
  let requests=0;let joined=0;let cacheHits=0;const trace:string[]=[];
  const trainingStart=workspaceSnapshotReadDecision({scope,cacheScope:trainingCache?.scope,cachedAt:trainingCache?.at,inFlightScope:trainingFlight,now,maxAgeMs:refreshMs});
  if(trainingStart==='request'){requests++;trainingFlight=scope;trace.push('Träning · 1 läsning startar');}
  const dailyStart=workspaceSnapshotReadDecision({scope,cacheScope:dailyCache?.scope,cachedAt:dailyCache?.at,inFlightScope:dailyFlight,now,maxAgeMs:refreshMs});
  if(dailyStart==='request'){
   requests++;dailyFlight=scope;trace.push('Hem · dagens data · 1 läsning startar');
   const sharedTraining=workspaceSnapshotReadDecision({scope,cacheScope:trainingCache?.scope,cachedAt:trainingCache?.at,inFlightScope:trainingFlight,now,maxAgeMs:refreshMs});
   if(sharedTraining==='join'){joined++;trace.push('Hem · ansluter till pågående träningsläsning');}
  }
  trainingCache={scope,at:now};dailyCache={scope,at:now};trainingFlight=null;dailyFlight=null;
  for(let trip=1;trip<=20;trip++){
   now+=2_000;
   const trainingDecision=workspaceSnapshotReadDecision({scope,cacheScope:trainingCache.scope,cachedAt:trainingCache.at,inFlightScope:trainingFlight,now,maxAgeMs:refreshMs});
   const dailyDecision=workspaceSnapshotReadDecision({scope,cacheScope:dailyCache.scope,cachedAt:dailyCache.at,inFlightScope:dailyFlight,now,maxAgeMs:refreshMs,cacheValid:trainingCache.scope===scope&&now-trainingCache.at<refreshMs});
   for(const decision of [trainingDecision,dailyDecision]){
    if(decision==='cache')cacheHits++;
    else if(decision==='request')requests++;
    else joined++;
   }
   trace.push(`${String(trip).padStart(2,'0')} · Hem → Träning → Kunskap → Hem · ${dailyDecision}/${trainingDecision}`);
  }
  setResult({requests,joined,cacheHits,trips:20,trace});
 }
 return <View style={{flex:1,padding:tokens.spacing.lg,gap:tokens.spacing.md,backgroundColor:tokens.colors.home.background}}>
  <Text accessibilityRole="header" style={{...tokens.typography.heading,color:tokens.colors.home.text}}>Workspace · syntetisk spårning</Text>
  <Text style={{...tokens.typography.body,color:tokens.colors.home.textMuted}}>Syntetiskt {review?'review':'public'}-läge · endast lokala fixture-scope. Kör 20 varma resor mellan Hem, Träning och Kunskap.</Text>
  <Button label="Kör 20 varma flikresor" accessibilityLabel="Kör 20 varma flikresor i den syntetiska workspace-spårningen" onPress={runTrace}/>
  {result?<View testID="workspace-trace-result" style={{gap:tokens.spacing.xs}}>
   <Text style={{...tokens.typography.body,color:tokens.colors.home.text}}>Resor: {result.trips} · Fixture-läsningar: {result.requests} · Delade läsningar: {result.joined} · Cacheträffar: {result.cacheHits}</Text>
   {result.trace.map((line,index)=><Text key={index} style={{...tokens.typography.caption,color:tokens.colors.home.textMuted}}>{line}</Text>)}
  </View>:null}
 </View>;
}
function App(){
 const params=new URLSearchParams(location.search);const state=params.get('state')||'ready';const logScenario=params.get('logScenario')||'ready';const usesSplitLogFixture=['split-day','split-day-error'].includes(logScenario);const reviewFixtureEnabled=process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true';
 const [page,setPage]=useState(new URLSearchParams(location.search).get('screen')||'home');const [knowledgeDetailOpen,setKnowledgeDetailOpen]=useState(false);const [focusedChecklistStep,setFocusedChecklistStep]=useState<{programId:string;stepId:string}|null>(null);
 const [fixtureScopeChanged,setFixtureScopeChanged]=useState(false);const fixtureDog=fixtureScopeChanged?{...dog,id:'fixture-dog-b',name:'Milo'}:dog;
 const workspaceState=params.get('workspaceState')||'';
 const mutationScenario=['pending','failed','unsure'].includes(params.get('mutation'));const accidentMutationScenario=logScenario==='accident-pending';const initialMutationStatus=accidentMutationScenario?'pending':mutationScenario?params.get('mutation'):null;
 const initialLogEvents=accidentEditFixtures[logScenario]??(usesSplitLogFixture?logSplitPage:initialEvents);
 const [events]=useState(initialEvents);const [logEvents,setLogEvents]=useState<LogEvent[]>(initialLogEvents);const [logHasMore,setLogHasMore]=useState(usesSplitLogFixture);const [logLoadingMore,setLogLoadingMore]=useState(false);const [logLoadMoreError,setLogLoadMoreError]=useState(false);const [logLoadAttempt,setLogLoadAttempt]=useState(0);const [mutation,setMutation]=useState<FixtureLogMutation|null>(()=>initialMutationStatus?{kind:'add',id:'fixture-pending',mutationId:'fixture-pending',type:accidentMutationScenario?'accident':'food',occurredAt:accidentMutationScenario?`${today}T08:11:00.000Z`:new Date().toISOString(),status:initialMutationStatus as FixtureLogMutation['status'],accidentKinds:accidentMutationScenario?['pee']:null}:null);const [pendingLogUpdate,setPendingLogUpdate]=useState<{id:string;changes:LogEventChanges}|null>(null);const [failNextLogUpdate,setFailNextLogUpdate]=useState(['failed','unsure'].includes(params.get('editScenario')||''));const [focused,setFocused]=useState(null);const [plans,setPlans]=useState(initialPlan);const [historyError,setHistoryError]=useState(new URLSearchParams(location.search).get('state')==='error');const [plannedState,setPlannedState]=useState<'loading'|'ready'|'error'>(()=>state==='empty'?'ready':state==='loading'?'loading':state==='error'?'error':'ready');const [plannedScenario,setPlannedScenario]=useState(params.get('plannedScenario')||'');
 const [dailyMutationMode,setDailyMutationMode]=useState(params.get('dailyMutation')||'');
 const homeScenario=params.get('homeScenario')||'ready';
 const moreScenario=params.get('moreScenario')||'';
 const trainingScenario=params.get('trainingScenario')||'default';
 const trainingUnmarkScenario=params.get('trainingUnmark')||'';
 const [trainingPrograms,setTrainingPrograms]=useState<PublishedTrainingProgram[]>(()=>trainingScenarioFixture(trainingScenario,reviewFixtureEnabled));
 const [checklistTrainingSelections]=useState(()=>trainingPrograms.flatMap(program=>{
  const step=program.steps.find(candidate=>!program.completedStepIds.includes(candidate.id));
  return step?[{programId:program.id,stepId:step.id}]:[];
 }).slice(0,2));
 const [trainingBusyStepKey,setTrainingBusyStepKey]=useState<string|null>(null);
 const [trainingError,setTrainingError]=useState('');
 const [fixtureRoutines,setFixtureRoutines]=useState<DailyRoutine[]>(reviewRoutines);
 const [fixtureRoutineDays,setFixtureRoutineDays]=useState<DailyRoutineDay[]>(reviewRoutineDays);
 const [fixtureRoutineSkips,setFixtureRoutineSkips]=useState<DailyRoutineDaySkip[]>([]);
 const retryRoutineMutation=useRef<(()=>void)|null>(null);
 function addLogFixture(type:LogEventType,intent?:AccidentLogIntent){if(type==='accident'&&!intent)return;const event:LogEvent={id:intent?.id??crypto.randomUUID(),dogId:dog.id,type,occurredAt:intent?.occurredAt??new Date().toISOString(),note:null,origin:'local-test',accidentKinds:intent?.accidentKinds??null};const status=logScenario==='accident-failed'?'failed':logScenario==='accident-unsure'?'unsure':'saved';if(status==='saved')setLogEvents(rows=>[event,...rows]);setMutation({kind:'add',id:event.id,mutationId:event.id,type:event.type,occurredAt:event.occurredAt,accidentKinds:event.accidentKinds,status});}
 function retryLogFixture(){if(mutation?.kind==='update'&&pendingLogUpdate){setLogEvents(rows=>rows.map(row=>row.id===pendingLogUpdate.id?{...row,...pendingLogUpdate.changes}:row));setMutation({...mutation,type:pendingLogUpdate.changes.type,occurredAt:pendingLogUpdate.changes.occurredAt,accidentKinds:pendingLogUpdate.changes.accidentKinds,status:'saved'});setPendingLogUpdate(null);return true;}if(mutation?.kind!=='add')return true;const event:LogEvent={id:mutation.id,dogId:dog.id,type:mutation.type,occurredAt:mutation.occurredAt,note:null,origin:'local-test',accidentKinds:mutation.accidentKinds??null};setLogEvents(rows=>rows.some(row=>row.id===event.id)?rows:[event,...rows]);setMutation({...mutation,status:'saved'});return true;}
 function loadMoreLog(){if(logLoadingMore||!logHasMore)return;setLogLoadingMore(true);setLogLoadMoreError(false);window.setTimeout(()=>{setLogLoadingMore(false);if(logScenario==='split-day-error'&&logLoadAttempt===0){setLogLoadAttempt(1);setLogLoadMoreError(true);return;}setLogEvents(rows=>[...rows,...logSplitContinuation.filter(next=>!rows.some(row=>row.id===next.id))]);setLogHasMore(false);},650);}
 const scenarioStep=homeScenario==='review-training'?process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true'?homeDenseFixture.trainingStep:undefined:homeScenario==='ready'?homeDenseFixture.trainingStep:undefined;
 const empty=state==='empty';const records=empty?[]:history;
 const main=['home','log','training','knowledge'].includes(page)?page:['checklist','home-training-detail','workspace-retention'].includes(page)?'home':'more';
 const navigateMainTab=(destination)=>{const enteringKnowledge=page!=='knowledge'&&destination==='knowledge';const leavingKnowledge=page==='knowledge'&&destination!=='knowledge';if(enteringKnowledge||leavingKnowledge){setFocused(null);setKnowledgeDetailOpen(false);}setPage(destination);};
 const go=(p)=>{const destination=p==='profile'?'passport':p==='notification-settings'?'more':p==='planned-health'?'planned':p;if(isMainTabDestination(destination))navigateMainTab(destination);else setPage(destination);};
 const fixtureActivities=fixtureDailyActivities(fixtureRoutines,fixtureRoutineDays);
 const routineChecklistActivities=fixtureActivities.filter(activity=>activity.kind==='routine');
 const trainingChecklistActivities=checklistTrainingSelections.flatMap(selection=>{
  const program=trainingPrograms.find(candidate=>candidate.id===selection.programId);
  const step=program?.steps.find(candidate=>candidate.id===selection.stepId);
  return program&&step?[{id:`training:${program.id}:${step.id}`,label:step.title,kind:'training' as const,completed:program.completedStepIds.includes(step.id),programId:program.id,stepId:step.id,programTitle:program.title}]:[];
 });
 const checklistCandidates=[...routineChecklistActivities,...trainingChecklistActivities];
 const requestedChecklistCount=Number(params.get('checklistCount')??7);
 const checklistCount=Number.isFinite(requestedChecklistCount)?Math.max(0,Math.min(7,requestedChecklistCount)):7;
 const checklistActivities=checklistCandidates.slice(0,checklistCount);
 async function createRoutineFixture(input:DailyRoutineCreateInput){const routine:DailyRoutine={...input,dog_id:dog.id,checklist_revision:1,legacy_single_item:false,repeat_anchor_date:input.repeat_unit?today:null};setFixtureRoutines(rows=>[routine,...rows]);return {status:'saved' as const};}
 function saveRoutineFixture(routine:DailyRoutine,label:string,checklist:DailyRoutineChecklistItem[],repeat:DailyRoutineRepeatValues){const legacyDay=routine.repeat_anchor_date?isoWeekdayForDateKey(routine.repeat_anchor_date):null;const currentWeekdays=routine.repeat_weekdays??(legacyDay?[legacyDay]:[]);const desiredWeekdays=repeat.repeat_weekdays??(legacyDay?[legacyDay]:[]);const sameWeekdays=JSON.stringify(currentWeekdays)===JSON.stringify(desiredWeekdays);const sameRule=routine.repeat_unit===repeat.repeat_unit&&routine.repeat_interval===repeat.repeat_interval&&(routine.repeat_unit!=='week'||sameWeekdays);const weekdays=routine.repeat_unit==='week'&&repeat.repeat_unit==='week'&&routine.repeat_weekdays===null&&repeat.repeat_weekdays?.length===1&&repeat.repeat_weekdays[0]===legacyDay?null:repeat.repeat_weekdays;setFixtureRoutines(rows=>rows.map(row=>row.id===routine.id?{...row,label,checklist,...repeat,repeat_weekdays:weekdays,repeat_anchor_date:sameRule?row.repeat_anchor_date:repeat.repeat_unit?today:null,checklist_revision:row.checklist_revision+1,legacy_single_item:false}:row));}
 async function updateRoutineFixture(routine:DailyRoutine,label:string,checklist:DailyRoutineChecklistItem[],repeat:DailyRoutineRepeatValues){const simulatedFailure=params.get('routineMutation');if(simulatedFailure==='failed'||simulatedFailure==='unknown'){retryRoutineMutation.current=()=>{saveRoutineFixture(routine,label,checklist,repeat);retryRoutineMutation.current=null;setDailyMutationMode('');};setDailyMutationMode(simulatedFailure);return {status:simulatedFailure};}saveRoutineFixture(routine,label,checklist,repeat);return {status:'saved' as const};}
 async function unmarkTrainingFixture(program:PublishedTrainingProgram,stepId:string){const key=`${program.id}:${stepId}:unmark`;setTrainingBusyStepKey(key);setTrainingError('');try{if(trainingUnmarkScenario)await new Promise(resolve=>window.setTimeout(resolve,trainingUnmarkScenario==='pending'?1800:500));if(trainingUnmarkScenario==='failed'){setTrainingError('Steget är fortfarande markerat. Kontrollera anslutningen och försök igen.');return false;}if(trainingUnmarkScenario==='unknown'){setTrainingError('Vi kunde inte bekräfta att steget avmarkerades. Kontrollera statusen innan du försöker på nytt.');return false;}setTrainingPrograms(current=>current.map(item=>item.id===program.id?{...item,completedStepIds:item.completedStepIds.filter(id=>id!==stepId)}:item));return {programId:program.id,stepId};}finally{setTrainingBusyStepKey(null);}}
 function retryDailyFixtureMutation(){if(retryRoutineMutation.current){retryRoutineMutation.current();return;}setDailyMutationMode('');}
 async function deleteRoutineFixture(routine:DailyRoutine){setFixtureRoutines(rows=>rows.filter(row=>row.id!==routine.id));setFixtureRoutineDays(rows=>rows.filter(row=>row.routine_id!==routine.id));return {status:'saved' as const};}
 function addRoutineFixture(routine:DailyRoutine){if(fixtureRoutineDays.some(row=>row.routine_id===routine.id&&row.date_key===today))return;const skipped=fixtureRoutineSkips.find(row=>row.routine_id===routine.id&&row.date_key===today);if(skipped){const {day_id,...snapshot}=skipped;setFixtureRoutineDays(rows=>[{...snapshot,id:day_id,routine_day_revision:snapshot.routine_day_revision+1,last_state_mutation_id:crypto.randomUUID()},...rows]);setFixtureRoutineSkips(rows=>rows.filter(row=>row.day_id!==day_id));return;}setFixtureRoutineDays(rows=>[{id:crypto.randomUUID(),dog_id:dog.id,routine_id:routine.id,date_key:today,time_zone:'Europe/Stockholm',routine_label_snapshot:routine.label,checklist_snapshot:routine.checklist,completed_item_ids:[],completed_at:null,is_recurring_occurrence:isRoutineDueOnDate(routine,today),routine_revision_snapshot:routine.checklist_revision,routine_day_revision:1,last_state_mutation_id:null},...rows]);}
 function removeRoutineFixture(row:DailyRoutineDay){const routine=fixtureRoutines.find(item=>item.id===row.routine_id);if(routine&&(row.is_recurring_occurrence||isRoutineDueOnDate(routine,row.date_key))){const {id,...snapshot}=row;setFixtureRoutineSkips(rows=>[...rows.filter(item=>item.routine_id!==row.routine_id||item.date_key!==row.date_key),{...snapshot,day_id:id,routine_day_revision:row.routine_day_revision+1,last_state_mutation_id:crypto.randomUUID()}]);}setFixtureRoutineDays(rows=>rows.filter(item=>item.id!==row.id));}
 function setRoutineItemFixture(row:DailyRoutineDay,itemId:string,completed:boolean){setFixtureRoutineDays(rows=>rows.map(item=>{if(item.id!==row.id)return item;const ids=item.checklist_snapshot.map(checklistItem=>checklistItem.id).filter(id=>id===itemId?completed:item.completed_item_ids.includes(id));return {...item,completed_item_ids:ids,completed_at:ids.length===item.checklist_snapshot.length?new Date().toISOString():null,routine_day_revision:item.routine_day_revision+1,last_state_mutation_id:crypto.randomUUID()};}));}
 const visibleRoutineActivities=reviewFixtureEnabled&&state==='ready'&&['ready','product-daily'].includes(homeScenario)?fixtureActivities:[];
 return <View style={styles.shell}>
 {page==='home'&&reviewFixtureEnabled?<View style={styles.reviewBanner} testID="review-banner"><Text accessibilityLabel="Syntetiskt granskningsläge. AI-genererad standardbild." style={styles.reviewBannerText}>AI-GENERERAD STANDARDBILD</Text></View>:null}
 {page==='checklist'||page==='home-training-detail'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="checklist-fixture-banner"><Text style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · checklista':'Syntetisk visningsfixture · checklista'}</Text></View>:null}
 {page==='log'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="review-log-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, loggfixture":"Syntetisk visningsfixture, logg"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · loggfixture':'Syntetisk visningsfixture · logg'}</Text></View>:null}
 {page==='training'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="training-fixture-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, träningsfixture":"Syntetisk visningsfixture, träning"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · träningsfixture':'Syntetisk visningsfixture · träning'}</Text></View>:null}
 {page==='health'||page==='planned'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="health-fixture-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, hälsofixture":"Syntetisk visningsfixture, hälsa"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · hälsofixture':'Syntetisk visningsfixture · hälsa'}</Text></View>:null}
 {page==='passport'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="passport-fixture-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, Tassla-passfixture":"Syntetisk visningsfixture, Tassla-pass"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · Tassla-pass':'Syntetisk visningsfixture · Tassla-pass'}</Text></View>:null}
 {page==='profile'||page==='profile-edit'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="profile-fixture-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, hundprofilfixture":"Syntetisk visningsfixture, hundprofil"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · hundprofil':'Syntetisk visningsfixture · hundprofil'}</Text></View>:null}
 {page==='reminders'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="reminders-fixture-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, påminnelsefixture":"Syntetisk visningsfixture, påminnelser"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · påminnelser':'Syntetisk visningsfixture · påminnelser'}</Text></View>:null}
 {page==='account'||page==='beta-info'?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="account-fixture-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, kontofixture":"Syntetisk visningsfixture, konto"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · konto':'Syntetisk visningsfixture · konto'}</Text></View>:null}
 {['sign-in','profile-create','auth-callback'].includes(page)?<View style={[styles.reviewBanner,styles.reviewLogBanner]} testID="auth-fixture-banner"><Text accessibilityLabel={reviewFixtureEnabled?"Syntetiskt granskningsläge, authfixture":"Syntetisk visningsfixture, auth och onboarding"} style={styles.reviewBannerText}>{reviewFixtureEnabled?'Syntetiskt granskningsläge · auth/onboarding':'Syntetisk visningsfixture · auth/onboarding'}</Text></View>:null}
 <View style={styles.appViewport} testID="review-app-viewport">
 {['sign-in','profile-create','auth-callback'].includes(page)?<>
 {page==='sign-in'?<SignInScreenView cancelGoogleSignIn={()=>{}} googlePending={params.get('signinScenario')==='google-pending'} sendMagicLink={async()=>params.get('signinScenario')!=='magic-error'} signInWithGoogle={async()=>params.get('signinScenario')!=='google-error'} signOutWarning={params.get('signinScenario')==='signout-warning'?'Du är utloggad på den här enheten. Servern kunde inte bekräfta att sessionen har återkallats.':null} status={params.get('signinScenario')==='unavailable'?'unavailable':'signedOut'}/>:null}
 {page==='profile-create'?<ProfileScreen client={profileClient as never} ownerId="00000000-0000-4000-8000-000000000002" accountGeneration={1} isCurrentAccount={isFixtureAccountCurrent} onCreated={()=>{}}/>:null}
 {page==='auth-callback'?<AuthCallbackView mode={params.get('callbackScenario')==='error'?'error':params.get('callbackScenario')==='preview'?'preview':'pending'} pendingMessage={params.get('callbackScenario')==='returned'?'Vi slutför inloggningen…':'Vänta medan länken öppnas…'} onReturn={()=>go('home')}/>:null}
 </>:<AppScreen scrollKey={page==='checklist'?'checklist-flow':page} preserveScrollKey={page==='checklist'||page==='home-training-detail'?'checklist-flow':undefined} footer={<BottomNav active={main} onChange={go}/>}><MainSwipeNavigation enabled={isMainTabDestination(page)&&!(page==='knowledge'&&knowledgeDetailOpen)} onSwipe={direction=>{const destination=nextMainTabDestination(page,direction);if(destination)navigateMainTab(destination);}}><ScreenTransition transitionKey={page}>
 {page==='workspace-retention'?<WorkspaceRetentionFixture review={reviewFixtureEnabled}/>:null}
 {page==='home'?<HomeScreen today={today} dog={fixtureScopeChanged?fixtureDog:homeScenario==='stale-selection'?{...dog,id:'new-dog',name:'Milo'}:dog} breed={fixtureBreed}
  events={empty?[]:events} healthHistory={records} healthHistoryState={historyError?'error':state==='loading'?'loading':'ready'}
  plans={empty?[]:[...plans,homeDenseFixture.plan]} content={empty||homeScenario==='review-training'?[]:content} contentState={state==='empty'?'ready':state}
  logState={state==='empty'?'ready':state} planState={state==='empty'?'ready':state} trainingState={homeScenario==='loading'?'loading':homeScenario==='error'?'error':'ready'}
  nextStep={scenarioStep} reviewTrainingStep={homeScenario==='review-training'&&reviewFixtureEnabled}
  dailyFixture={reviewFixtureEnabled&&homeScenario==='ready'&&state==='ready'?homeReviewFixture:undefined}
  dailyState={state==='error'?'error':state==='loading'?'loading':'ready'} dailyRefreshing={workspaceState==='refreshing'} dailyRefreshError={workspaceState==='refresh-error'} dailyDateKey={today} dailyScopeKey={`fixture:${fixtureDog.id}:${today}`}
  dailyActivities={visibleRoutineActivities} routineTemplates={reviewFixtureEnabled&&state==='ready'?fixtureRoutines:[]} routineDaySkips={reviewFixtureEnabled&&state==='ready'?fixtureRoutineSkips:[]}
  dailyTrainingOptions={reviewFixtureEnabled&&state==='ready'&&['ready','product-daily'].includes(homeScenario)?reviewTrainingOptions:[]}
  dailyMutationBusy={dailyMutationMode==='pending'} dailyMutationKey={dailyMutationMode?'complete-routine:day-morning:00000000-0000-4000-8000-000000000001':''}
  dailyMutationMessage={dailyMutationMode==='failed'?'Ändringen sparades inte. Kontrollera anslutningen och försök igen.':dailyMutationMode==='unknown'?'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.':dailyMutationMode==='readback'?'Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.':''}
  dailyMutationError={['failed','unknown','readback'].includes(dailyMutationMode)} onRetryDaily={()=>setDailyMutationMode('')} onRetryDailyMutation={['failed','unknown'].includes(dailyMutationMode)?retryDailyFixtureMutation:undefined}
  onCreateRoutine={createRoutineFixture} onUpdateRoutine={updateRoutineFixture} onDeleteRoutine={deleteRoutineFixture}
  onAddRoutineToDay={addRoutineFixture} onRemoveRoutineFromDay={removeRoutineFixture} onSetRoutineCompletion={setRoutineItemFixture}
  onAddTrainingToDay={()=>{}} onRemoveTrainingFromDay={()=>{}} onGo={go}
  onOpenContent={id=>{setFocused(id);setKnowledgeDetailOpen(false);setPage('knowledge')}} onRetryContent={()=>{}} onOpenChecklist={()=>setPage('checklist')}/>:null}
 {page==='checklist'?<DailyChecklistScreen dogName={fixtureDog.name} dateKey={today} state={state==='loading'?'loading':state==='error'?'error':'ready'}
  activities={state==='empty'?[]:checklistActivities} refreshing={workspaceState==='refreshing'} refreshError={workspaceState==='refresh-error'}
  mutationBusy={dailyMutationMode==='pending'} mutationKey={dailyMutationMode?'complete-routine:day-morning:00000000-0000-4000-8000-000000000001':''}
  mutationMessage={dailyMutationMode==='failed'?'Ändringen sparades inte. Kontrollera anslutningen och försök igen.':dailyMutationMode==='unknown'?'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.':dailyMutationMode==='readback'?'Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.':''}
  mutationError={['failed','unknown','readback'].includes(dailyMutationMode)} onBack={()=>setPage('home')} onRetry={()=>setDailyMutationMode('')} onRetryMutation={['failed','unknown'].includes(dailyMutationMode)?retryDailyFixtureMutation:undefined}
  onOpenTrainingStep={(programId,stepId)=>{setFocusedChecklistStep({programId,stepId});setPage('home-training-detail')}} onSetRoutineCompletion={setRoutineItemFixture}
  routines={fixtureRoutines} routineDaySkips={fixtureRoutineSkips} trainingOptions={reviewTrainingOptions} onCreateRoutine={createRoutineFixture} onUpdateRoutine={updateRoutineFixture} onDeleteRoutine={deleteRoutineFixture}
  onAddRoutineToDay={addRoutineFixture} onRemoveRoutineFromDay={removeRoutineFixture} onAddTrainingToDay={()=>{}} onRemoveTrainingFromDay={()=>{}} onGoTraining={()=>go('training')}/>:null}
 {page==='checklist'&&params.get('checklistScopeReset')==='true'?<View style={{padding:16}}><Button label="Byt hund i testfixture" accessibilityLabel="Byt hund i testfixture" onPress={()=>{setFixtureScopeChanged(true);setPage('home')}}/></View>:null}
 {page==='log'?<LogScreen mode="cloud" persistLayout={false} events={state==='empty'?[]:logEvents} mutation={mutation} loading={state==='loading'} loadError={state==='error'} onReload={()=>{}} loadMoreError={logLoadMoreError} onLoadMore={loadMoreLog} hasMore={state==='empty'?false:logHasMore} loadingMore={logLoadingMore} onAdd={addLogFixture} onRetry={retryLogFixture} onCancel={()=>{setMutation(null);setPendingLogUpdate(null);}} onUpdate={(id,changes)=>{if(failNextLogUpdate){setFailNextLogUpdate(false);setPendingLogUpdate({id,changes});setMutation({kind:'update',id,mutationId:id,type:changes.type,occurredAt:changes.occurredAt,accidentKinds:changes.accidentKinds,status:params.get('editScenario')==='unsure'?'unsure':'failed'});return false;}setLogEvents(rows=>rows.map(e=>e.id===id?{...e,...changes}:e));return true;}} onDelete={id=>setLogEvents(rows=>rows.filter(e=>e.id!==id))} onUndo={id=>{setLogEvents(rows=>rows.filter(e=>e.id!==id));setMutation(null);}}/>:null}
 {page==='components'?<ComponentGalleryScreen onBack={()=>go('home')}/>:null}
 {page==='health'?<HealthScreen onBack={()=>go('more')} records={empty?[]:weights} loadState="ready" historyRecords={records} historyLoadState={historyError?'error':state==='empty'?'ready':state} plannedRecords={empty?[]:plans} plannedLoadState={plannedState} onRetryHistory={()=>setHistoryError(false)} onRetryPlannedHealth={()=>setPlannedState('ready')} onSave={async()=>true} onSaveHistory={async()=>true} onOpenPlannedHealth={()=>go('planned')}/>:null}
 {page==='planned'?<PlannedHealthScreen
   onBack={()=>go('health')}
   records={empty?[]:plans}
   loadState={plannedState}
   busy={plannedScenario==='saving'}
   pending={['pending','conflict'].includes(plannedScenario)}
   statusMessage={plannedScenario==='unknown'?'Vi kunde inte kontrollera om planen sparades. Kontrollera den aktuella planen innan du försöker igen.':plannedScenario==='pending'||plannedScenario==='conflict'?'Ändringen väntar på kontroll av sparstatus.':''}
   statusError={plannedScenario==='unknown'}
   conflict={plannedScenario==='conflict'?{current:plans[0]??null}:null}
   onRetry={()=>{setPlannedState('ready');setPlannedScenario('');}}
   onResolveConflict={()=>setPlannedScenario('')}
   onSave={async(id,type,dueOn,note,reminderEnabled,reminderMinutes,dueTime)=>{setPlans(rows=>id?rows.map(row=>row.id===id?{...row,due_on:dueOn,due_time:dueTime,description:note,reminder_enabled:reminderEnabled,reminder_minutes:reminderMinutes}:row):[{id:'new-plan',dog_id:dog.id,event_type:type,due_on:dueOn,due_time:dueTime,description:note,reminder_enabled:reminderEnabled,reminder_minutes:reminderMinutes,created_at:today},...rows]);return true;}}
   onDelete={async id=>{setPlans(rows=>rows.filter(row=>row.id!==id));return true;}}
 />:null}
 {page==='knowledge'?<KnowledgeScreen items={empty?[]:content} contentState={state==='empty'?'ready':state} focusedContentId={focused} onSelectContent={setFocused} onDetailChange={setKnowledgeDetailOpen} client={client as never} dogId={dog.id} ageWeeks={homeAgeInWeeks(dog.birth_date,today)} sessionKey="visual-check" onBack={()=>{setFocused(null);go('home')}}/>:null}
 {page==='training'||page==='home-training-detail'?<PublishedTrainingScreen ageWeeks={trainingScenario==='unknown-age'?null:homeAgeInWeeks(dog.birth_date,today)} programs={empty?[]:trainingPrograms} paused={[]} reviewMode={page==='training'&&reviewFixtureEnabled} error={trainingError|| (state==='error'?'Programmet kunde inte hämtas':'')} busyStepKey={trainingBusyStepKey} focusStep={page==='home-training-detail'&&focusedChecklistStep?{...focusedChecklistStep,returnPage:'checklist'}:undefined} onCloseStep={()=>setPage('checklist')} onCompleteStep={async(p,id)=>{setTrainingPrograms(current=>current.map(program=>program.id===p.id?{...program,completedStepIds:program.completedStepIds.includes(id)?program.completedStepIds:[...program.completedStepIds,id]}:program));return {programId:p.id,stepId:id};}} onUnmarkStep={unmarkTrainingFixture} onContinue={()=>{if(page==='home-training-detail')setPage('checklist')}} onResetProgram={program=>setTrainingPrograms(current=>current.map(item=>item.id===program.id?{...item,completedStepIds:[]}:item))} onRetry={()=>setTrainingError('')}/>:null}
 {page==='passport'?<PassportScreen client={client} dog={dog} weights={empty?[]:weights} history={records} weightLoadState={state==='error'?'error':state==='loading'?'loading':'ready'} historyLoadState={state==='error'?'error':state==='loading'?'loading':'ready'} onBack={()=>go('more')}/>:null}
 {page==='profile'?<DogProfileScreen dog={dog} breed="Golden retriever" onBack={()=>go('more')}/>:null}
 {page==='profile-edit'?<EditDogProfileScreen client={client as never} dog={dog} busy={state==='saving'} pending={state==='pending'} statusMessage={state==='pending'?'Ändringen väntar på en säker statuskontroll.':'Ändringarna är inte sparade.'} statusError={state==='error'||state==='pending'} conflict={state==='conflict'?{...dog,name:'Luna (senaste sparade)'}:undefined} attribution={state==='empty'?null:{code:'ABC123',name:'Exempelkennel'}} attributionState={state==='loading'?'loading':state==='error'?'error':'ready'} attributionBusy={state==='saving'} attributionMessage={state==='error'?'Kennelkopplingen kunde inte sparas.':''} attributionMessageError={state==='error'} onBack={()=>go('more')} onSave={async()=>true} onSaveAttribution={async()=>true} onRetryAttribution={()=>{}} onRetryStatus={()=>{}} onAcceptCurrent={()=>{}}/>:null}
 {page==='reminders'?<NotificationSettingsScreen onBack={()=>go('more')} preferences={{version:1,enabled:state==='saved',trainingEnabled:state==='training',trainingMinutes:8*60+30}} saved={state==='saved'} busy={state==='saving'} statusMessage={state==='error'?'Valen kunde inte sparas säkert. Kontrollera status innan du försöker igen.':''} statusError={state==='error'} permissionState={state==='granted'?'granted':state==='denied'?'denied':'unknown'} onSave={async()=>true} onRequestPermission={async()=>state==='denied'?'denied':'granted'}/>:null}
 {page==='account'?<AccountSettingsScreen ownerId="00000000-0000-4000-8000-000000000002" onBack={()=>go('more')} onOpenInformation={()=>go('beta-info')} onDeleteAccount={async()=>({status:state==='failed'?'failed':state==='unavailable'?'unavailable':state==='unknown'?'unknown':'confirmed'})} onSignOutLocally={async()=>true} busy={state==='saving' || state==='saving-analytics'} status={['confirmed','failed','unknown','unavailable','blocked'].includes(state)?state as 'confirmed'|'failed'|'unknown'|'unavailable'|'blocked':'idle'} localCleanupFailed={state==='cleanup-failed'} signOutFailed={state==='signout-failed' || state==='cleanup-failed'} analyticsConsent={state==='analytics-loading'?null:state==='analytics-on'} analyticsBusy={state==='saving-analytics'} analyticsError={state==='analytics-error'} onSetAnalyticsConsent={async()=>true} onRetryAnalyticsConsent={async()=>{}}/>:null}
 {page==='beta-info'?<BetaInfoScreen onBack={()=>go('account')}/>:null}
 {page==='more'?<MoreScreen onNavigate={destination=>setPage(destination)} signOutError={moreScenario==='signout-error'} signingOut={moreScenario==='signing-out'} onSignOut={()=>{}}/>:null}
 </ScreenTransition></MainSwipeNavigation></AppScreen>}
 </View>
 </View>
}
const styles=StyleSheet.create({shell:{flex:1},appViewport:{flex:1,minHeight:0},reviewBanner:{alignSelf:'stretch',height:tokens.spacing.xxl,minHeight:tokens.spacing.xxl,justifyContent:'center',paddingHorizontal:tokens.spacing.md,backgroundColor:tokens.colors.warningSurface},reviewLogBanner:{height:'auto',minHeight:tokens.size.touchMin,paddingVertical:tokens.spacing.xs},reviewBannerText:{...tokens.typography.caption,color:tokens.colors.warning,fontWeight:'700',textAlign:'center'}});
createRoot(document.getElementById('root')).render(<App/>);
