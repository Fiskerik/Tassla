import driveArticles from '../../docs/content/artiklar/drive-articles-v1.json';
import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppScreen} from '../../src/components/AppPrimitives';
import {StyleSheet, Text, View} from 'react-native';
import {BottomNav,Button} from '../../src/components/ui';
import {ScreenTransition} from '../../src/components/ui/Motion';
import {HomeScreen} from '../../src/features/home/HomeScreen';
import {DailyChecklistScreen} from '../../src/features/home/DailyChecklistScreen';
import {DailyProgressScreen} from '../../src/features/home/DailyProgressScreen';
import type {HomeDailyFixtureItem} from '../../src/features/home/HomeScreen';
import type {ChecklistFilter,HomeDailyActivity} from '../../src/features/home/daily-activity-model';
import type {DailyRoutine,DailyRoutineChecklistItem,DailyRoutineCreateInput,DailyRoutineDay,DailyRoutineDaySkip,DailyRoutineRepeatValues} from '../../src/features/home/daily-activity-data';
import {checklistFilterRange,deriveUpcomingActivities,isRoutineDueOnDate,isoWeekdayForDateKey} from '../../src/features/home/daily-activity-model';
import {dailyRoutineChecklistDisplayIcon} from '../../src/features/home/daily-routine-checklist-icons';
import {LogScreen} from '../../src/features/puppy-log/LogScreen';
import type {AccidentKind,AccidentLogIntent,LogEvent,LogEventChanges,LogEventType} from '../../src/features/puppy-log/log-model';
import {ComponentGalleryScreen} from '../../src/components/ui/ComponentGalleryScreen';
import {ActionMenu} from '../../src/components/ui/ActionMenu';
import {HealthScreen, type HealthTab} from '../../src/features/health/HealthScreen';
import {PlannedHealthScreen} from '../../src/features/health/PlannedHealthScreen';
import type {WeightEditorRecovery} from '../../src/features/health/WeightScreen';
import {KnowledgeScreen} from '../../src/features/knowledge/KnowledgeScreen';
import {PublishedTrainingScreen} from '../../src/features/training/PublishedTrainingScreen';
import type {PausedTrainingProgress,PublishedTrainingProgram} from '../../src/data/workspace-data';
import {REVIEW_TRAINING_PROGRAMS} from '../../src/features/knowledge/review-content';
import {localDate} from '../../src/features/onboarding/dog';
import {homeAgeInWeeks} from '../../src/features/home/home-today';
import {DevelopmentScreen} from '../../src/features/home/DevelopmentScreen';
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
import {OnboardingMetricsChoice} from '../../src/features/onboarding/OnboardingMetricsChoice';
import {tokens} from '../../src/theme/tokens';
import {createRoutineAndSelectForToday} from '../../src/features/home/daily-activity-data';
import {createdRoutineDaySelectionRecoveryCopy} from '../../src/features/home/daily-activity-recovery';
import {MainSwipeNavigation} from '../../src/components/ui/MainSwipeNavigation';
import {isMainTabDestination,nextMainTabDestination} from '../../src/features/home/main-navigation';
import {workspaceSnapshotReadDecision} from '../../src/data/workspace-data';
import {emptyTrainingProgression,latestHomeTrainingSummary,type PendingTrainingProgression,type TrainingProgressionAction,type TrainingProgressionWorkspace} from '../../src/features/training/training-progression';
import recallDraft from '../../docs/content/recall-program-v1.json';
type FixtureLogMutation={kind:'add'|'update'|'delete'|'undo';id:string;mutationId:string;type:LogEventType;occurredAt:string;status:'pending'|'failed'|'unsure'|'saved';accidentKinds?:AccidentKind[]|null};
window.__tasslaAccountDeleteCalls=0;
const today=new URLSearchParams(location.search).get('today')||localDate();
const healthRouteRoundTrip=new URLSearchParams(location.search).get('healthRouteRoundTrip')==='true';
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
const articleFixture=new URLSearchParams(location.search).get('articleFixture')==='true';
const fixtureSex=new URLSearchParams(location.search).get('sex');
const dog={id:'test-dog',name:articleFixture?(new URLSearchParams(location.search).get('dogName')||'Nemo'):'Luna',breed_id:'golden',birth_date:fixtureBirthDate,age_display_unit:ageDisplayUnit,expected_homecoming_date:articleFixture?'2026-12-15':null,sex:fixtureSex==='male'?'male' as const:fixtureSex==='female'?'female' as const:null};
const homeDenseFixture={events:(['food','pee','poop','walk','sleep'] as LogEventType[]).map((type,i)=>({id:'event-'+i,dogId:dog.id,type,occurredAt:today+'T'+['12:05','10:30','08:20','07:15','06:50'][i]+':00',note:['Åt allt',null,null,'20 minuter',null][i],origin:'local-test' as const,accidentKinds:null})),trainingStep:'Hantering av tassar',plan:{id:'today-plan',dog_id:dog.id,event_type:'vaccination',due_on:today,due_time:'16:30',description:'Vaccination idag',reminder_enabled:false,reminder_minutes:null,created_at:today}};
const homeReviewFixture:HomeDailyFixtureItem[]=[
 {id:'morning-pee',label:'Kissa',detail:'Morgonrutin',category:'pee',completed:false,destination:'log',routineId:'routine-morning',routineLabel:'Morgonrutin'},
 {id:'morning-water',label:'Fyll på vatten',detail:'Morgonrutin',category:'water',completed:true,destination:'log',routineId:'routine-morning',routineLabel:'Morgonrutin'},
 {id:'walk-short',label:'Gå en kort runda',detail:'Promenad',category:'walk',completed:false,destination:'log',routineId:'routine-walk',routineLabel:'Promenad'},
 {id:'walk-paws',label:'Torka tassar',detail:'Promenad',category:'walk',completed:true,destination:'log',routineId:'routine-walk',routineLabel:'Promenad'},
 {id:'handling',label:'Miljöträning – nya ljud',detail:'Vecka 11 · Trygghet och vardag',category:'training',completed:false,destination:'training',kind:'training'},
];
const routineMorningItems:DailyRoutineChecklistItem[]=[{id:'00000000-0000-4000-8000-000000000001',label:'Kissa',icon:'paw'},{id:'00000000-0000-4000-8000-000000000002',label:'Fyll på vatten',icon:'water-outline'}];
const routineWalkItems:DailyRoutineChecklistItem[]=[{id:'00000000-0000-4000-8000-000000000003',label:'Ta på sele'},{id:'00000000-0000-4000-8000-000000000004',label:'Gå en kort runda',icon:'walk-outline'},{id:'00000000-0000-4000-8000-000000000005',label:'Torka tassar',icon:'paw'}];
const routineEveningItems:DailyRoutineChecklistItem[]=[{id:'00000000-0000-4000-8000-000000000006',label:'Borsta tänderna',icon:'brush-outline'},{id:'00000000-0000-4000-8000-000000000007',label:'Förbered kvällsmat',icon:'restaurant-outline'}];
const reviewRoutines:DailyRoutine[]=[
 {id:'routine-morning',dog_id:dog.id,label:'Morgonrutin',checklist:routineMorningItems,checklist_revision:1,legacy_single_item:false,repeat_unit:'day',repeat_interval:1,repeat_weekdays:null,repeat_anchor_date:today},
 {id:'routine-walk',dog_id:dog.id,label:'Promenad',checklist:routineWalkItems,checklist_revision:1,legacy_single_item:false,repeat_unit:'week',repeat_interval:1,repeat_weekdays:[1,5],repeat_anchor_date:today},
 {id:'routine-evening',dog_id:dog.id,label:'Kvällsrutin',checklist:routineEveningItems,checklist_revision:1,legacy_single_item:false,repeat_unit:'week',repeat_interval:2,repeat_weekdays:null,repeat_anchor_date:today},
];
const reviewRoutineDays:DailyRoutineDay[]=[
 {id:'day-morning',dog_id:dog.id,routine_id:'routine-morning',date_key:today,time_zone:'Europe/Stockholm',routine_label_snapshot:'Morgonrutin',checklist_snapshot:routineMorningItems,completed_item_ids:[routineMorningItems[1].id],completed_at:null,is_recurring_occurrence:true,routine_revision_snapshot:1,routine_day_revision:1,last_state_mutation_id:null},
 {id:'day-walk',dog_id:dog.id,routine_id:'routine-walk',date_key:today,time_zone:'Europe/Stockholm',routine_label_snapshot:'Promenad',checklist_snapshot:routineWalkItems,completed_item_ids:[routineWalkItems[0].id,routineWalkItems[2].id],completed_at:null,is_recurring_occurrence:true,routine_revision_snapshot:1,routine_day_revision:1,last_state_mutation_id:null},
];
function fixtureDailyActivities(routines:DailyRoutine[],days:DailyRoutineDay[],dateKey=today,includeTraining=true):HomeDailyActivity[]{
 const routineRows=days.filter(day=>day.date_key===dateKey&&routines.some(routine=>routine.id===day.routine_id&&routine.dog_id===dog.id)).flatMap(day=>day.checklist_snapshot.map(item=>({
  id:`routine:${day.id}:${item.id}`,label:item.label,icon:dailyRoutineChecklistDisplayIcon(item),routineLabel:day.routine_label_snapshot,routineItemId:item.id,kind:'routine' as const,
  completed:day.completed_item_ids.includes(item.id),routineDay:day,
 })));
 const trainingRows=includeTraining?[{id:'training:day-step',label:'Miljöträning – nya ljud',kind:'training' as const,completed:false,programTitle:'Vecka 11',trainingSelection:{id:'selection-1',dog_id:dog.id,program_version_id:'review-version-11',step_id:'step-2',date_key:dateKey,time_zone:'Europe/Stockholm'}}]:[];
 return [...routineRows,...trainingRows];
}
const reviewTrainingOptions=[{programId:'review-program',versionId:'review-version-11',stepId:'step-3',programTitle:'Vecka 11',stepTitle:'Miljöträning ute'}];
const initialEvents:LogEvent[]=homeDenseFixture.events;
const placeholderContent=[{id:'guide1',title:'En trygg start hemma',body:'Så skapar du lugn, rutin och trygghet de första veckorna.\n\n## En plats att landa\n\nGör plats för valpens saker och låt vardagen ta form i er takt.\n\n- En egen sovplats\n- Tid tillsammans',contentType:'guide'},{id:'guide2',title:'Hantera din valp',body:'Lär känna varandra i lugn och ro.',contentType:'article'},{id:'guide3',title:'Inför hemkomsten',body:'En lista över vad du behöver förbereda.',contentType:'checklist'},...(process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true'?[{id:'review-v1:training:home-harness',title:'Trygg vardag',body:'',contentType:'training_program'}]:[])].map(x=>({...x,version:1,contentId:x.id,sources:[]}));
const history=[{id:'h1',dog_id:dog.id,event_type:'vaccination',occurred_on:'2026-09-28',occurred_time:'14:20',description:'Vaccination valp 1'},{id:'h2',dog_id:dog.id,event_type:'vet_visit',occurred_on:'2026-09-12',occurred_time:null,description:'Första besöket'}];
const weights=[{id:'w1',dog_id:dog.id,occurred_on:'2026-10-07',weight_kg:5.2}];
const initialPlan=[{id:'overdue',dog_id:dog.id,event_type:'vet_visit',due_on:new Date(Date.now()-86400000).toISOString().slice(0,10),due_time:null,description:'Uppföljning',reminder_enabled:false,reminder_minutes:null,created_at:today},{id:'p1',dog_id:dog.id,event_type:'vaccination',due_on:new Date(Date.now()+12*86400000).toISOString().slice(0,10),due_time:'10:30',description:'Vaccination valp 2',reminder_enabled:false,reminder_minutes:null,created_at:today}];
const healthRoutePlans=[
 {id:'health-route-a',dog_id:dog.id,event_type:'vet_visit',due_on:'2026-10-28',due_time:null,description:'Tandkontroll · Luna',reminder_enabled:false,reminder_minutes:null,created_at:today},
 {id:'health-route-target',dog_id:dog.id,event_type:'vet_visit',due_on:'2026-11-02',due_time:null,description:'Öronkontroll · Luna',reminder_enabled:false,reminder_minutes:null,created_at:today},
 {id:'health-route-b',dog_id:dog.id,event_type:'vet_visit',due_on:'2026-11-12',due_time:null,description:'Uppföljning · Luna',reminder_enabled:false,reminder_minutes:null,created_at:today},
];
const canonicalArticleFixtures=driveArticles.map((a,index)=>({id:'drive-article-'+index,contentId:'drive-content-'+index,version:1,slug:a.slug,title:a.title,body:a.body,contentType:'article',sources:a.sources,isAiGenerated:a.is_ai_generated,recommended:index!==0}));
const genericArticleFixture={id:'generic-guide',contentId:'generic-guide',version:1,slug:'synthetic-unassigned',title:'Syntetisk guide',body:'Syntetisk provtext för att granska läsbarhet och gemensam artikelstil.\n\n## Tydlig struktur\n\nProvet använder en befintlig dekorativ bild och samma tema som andra guider.',contentType:'guide',sources:[],isAiGenerated:false,recommended:false};
const content=articleFixture?[...canonicalArticleFixtures,...(new URLSearchParams(location.search).get('unassignedArticle')==='true'?[genericArticleFixture]:[])]:placeholderContent;
const initialProgram={id:'t1',content_id:'t1',version:1,title:'Vecka 11',body:'Trygghet och vardagsliv.',sources:[],completedStepIds:['s0'],completedAtByStepId:{},steps:['Hantering (tassar, öron, mun)','Miljöträning – nya ljud','Ensamhet – korta stunder','Inkallning – grunder','Möte med andra hundar'].map((title,i)=>({id:'s'+i,position:i,title,instruction:''}))};
const publicTrainingFixture:PublishedTrainingProgram[]=[
 {...initialProgram,id:'fixture-training:trygg-start',content_id:'fixture-training:trygg-start',currentAgeBreedMatch:true,title:'Trygg vardagsstart',body:'',sources:[],completedStepIds:['trygg-1'],completedAtByStepId:{'trygg-1':'2026-10-13T08:00:00.000Z'},steps:[{id:'trygg-1',position:0,title:'Utforska i egen takt',instruction:''},{id:'trygg-2',position:1,title:'En lugn paus',instruction:''},{id:'trygg-3',position:2,title:'Vila nära',instruction:''}]},
 {...initialProgram,id:'fixture-training:kontakt',content_id:'fixture-training:kontakt',currentAgeBreedMatch:true,title:'Kontakt i vardagen',body:'',sources:[],completedStepIds:[],steps:[{id:'kontakt-1',position:0,title:'Hitta varandra',instruction:''},{id:'kontakt-2',position:1,title:'Följ en rörelse',instruction:''}]},
 {...initialProgram,id:'fixture-training:trygg-miljo',content_id:'fixture-training:trygg-miljo',currentAgeBreedMatch:true,title:'Trygg i nya miljöer',body:'',sources:[],completedStepIds:[],steps:[{id:'miljo-1',position:0,title:'Titta i lugn takt',instruction:''},{id:'miljo-2',position:1,title:'Ta en kort paus',instruction:''}]},
];
function trainingScenarioFixture(scenario:string,reviewMode:boolean):PublishedTrainingProgram[]{
 const source=reviewMode?[...REVIEW_TRAINING_PROGRAMS]:publicTrainingFixture;
 if(scenario==='recall-draft')return [{id:recallDraft.version_id,content_id:recallDraft.content_id,version:recallDraft.version,title:recallDraft.title,body:recallDraft.body,sources:recallDraft.sources,is_ai_generated:true,currentAgeBreedMatch:true,completedStepIds:[],completedAtByStepId:{},steps:recallDraft.steps.map(step=>({id:step.id,position:step.position,title:step.title,instruction:step.instruction}))}];
 if(scenario==='structured')return source.map((program,index)=>index===0?{...program,completedStepIds:[],steps:program.steps.map((step,stepIndex)=>stepIndex===0?{...step,instruction:'Öva lugnt och belöna frivillig kontakt.\n\n## Du behöver\nEn belöning.\n\n## Så gör ni\n1. Välj en lugn plats.\n2. Belöna när hunden kommer.'}:step)}:program);
 if(scenario==='timeline')return source.map((program,index)=>index===0?{...program,
  completedStepIds:['trygg-1','trygg-3'],
  completedAtByStepId:{'trygg-1':'2026-08-15T12:00:00.000Z','trygg-3':'2026-10-01T12:00:00.000Z'},
  steps:program.steps.map((step,stepIndex)=>stepIndex===0?{...step,instruction:'Börja på en lugn plats och låt hunden utforska i egen takt.'}:stepIndex===1?{...step,instruction:'Erbjud en kort paus och belöna lugn kontakt. Avsluta medan det fortfarande känns tryggt.'}:{...step,instruction:'Gör nästa övning kort och följ hundens signaler.'})
 }:program);
 if(scenario==='unknown-age'&&reviewMode)return source.map((program,index)=>({...program,completedStepIds:index===0&&program.steps.length?[program.steps[0].id]:[]}));
 if(scenario==='unstarted')return source.map(program=>({...program,completedStepIds:[]}));
 if(scenario==='half')return source.map((program,index)=>({...program,completedStepIds:index===1&&program.steps.length?[program.steps[0].id]:[]}));
 if(scenario==='complete')return source.map((program,index)=>({...program,completedStepIds:index===1?program.steps.map(step=>step.id):[]}));
 if(scenario==='later-completed')return source.map((program,index)=>index===0?{...program,completedStepIds:program.steps.flatMap((step,stepIndex)=>stepIndex===0||stepIndex===2?[step.id]:[])}:program);
 if(scenario==='several')return source.map((program,index)=>({...program,completedStepIds:program.steps.length?[program.steps[0].id]:[],steps:program.steps.map((step,stepIndex)=>index===0&&stepIndex===1?{...step,title:'Miljöträning – nya ljud och oväntade möten i lugn takt'}:step)}));
 if(scenario==='long-title')return source.map((program,index)=>index===0?{...program,completedStepIds:[],title:'Trygg vardagsstart med lugna steg för nya situationer',steps:program.steps.map((step,stepIndex)=>stepIndex===1?{...step,title:'Öva på att pausa och hitta trygghet i en ny miljö'}:step)}:program);
 return source;
}
function initialProgressionFixture(scenario:string,programs:readonly PublishedTrainingProgram[]):TrainingProgressionWorkspace{
 if(scenario==='unavailable'){
  const journey={id:'journey-withdrawn',dog_id:dog.id,program_version_id:'withdrawn-fixture-version',active_step_id:'withdrawn-fixture-step',state:'paused' as const,last_operation_id:'fixture-seed-operation',created_at:'2026-10-24T10:00:00.000Z',updated_at:'2026-10-24T10:00:00.000Z'};
  return {journeys:[journey],sessions:[{id:'fixture-withdrawn-session',journey_id:journey.id,dog_id:dog.id,program_version_id:journey.program_version_id,step_id:journey.active_step_id,operation_id:'fixture-withdrawn-session-operation',feedback:'paused_early',performed_at:'2026-10-24T10:01:00.000Z'}],milestones:[]};
 }
 const program=programs[0];const firstStep=program?.steps[0];if(!program||!firstStep||!['active','paused','confirmed','timeline'].includes(scenario))return emptyTrainingProgression();
 const journey={id:`journey-${program.id}`,dog_id:dog.id,program_version_id:program.id,active_step_id:scenario==='timeline'?program.steps[1]?.id??firstStep.id:firstStep.id,state:scenario==='paused'?'paused' as const:'active' as const,
  last_operation_id:'fixture-seed-operation',created_at:'2026-10-24T10:00:00.000Z',updated_at:'2026-10-24T10:00:00.000Z'};
 const sessions=['confirmed','timeline'].includes(scenario)?[{id:'fixture-seed-session',journey_id:journey.id,dog_id:dog.id,program_version_id:program.id,step_id:scenario==='timeline'?journey.active_step_id:firstStep.id,
  operation_id:'fixture-seed-session-operation',feedback:'worked_as_planned' as const,performed_at:'2026-10-24T10:01:00.000Z'}]:[];
 const milestones=['confirmed','timeline'].includes(scenario)?[{id:'fixture-seed-milestone',journey_id:journey.id,dog_id:dog.id,program_version_id:program.id,step_id:firstStep.id,
  confirmation_operation_id:'fixture-seed-confirm-operation',confirmed_at:scenario==='timeline'?'2026-08-15T12:00:00.000Z':'2026-10-24T10:02:00.000Z'}]:[];
 return {journeys:[journey],sessions,milestones};
}
function applyProgressionFixtureAction(workspace:TrainingProgressionWorkspace,program:PublishedTrainingProgram|undefined,action:TrainingProgressionAction,operationId:string):TrainingProgressionWorkspace{
 if(!program||program.id!==action.programVersionId||program.steps.length===0)return workspace;
 const existing=workspace.journeys.find(row=>row.program_version_id===program.id);const firstStep=program.steps[0];const now=new Date().toISOString();
 if(action.kind==='start_or_resume'){
  const journey=existing?{...existing,state:'active' as const,last_operation_id:operationId,updated_at:now}:{id:`journey-${program.id}`,dog_id:dog.id,program_version_id:program.id,active_step_id:firstStep.id,state:'active' as const,last_operation_id:operationId,created_at:now,updated_at:now};
  return {...workspace,journeys:[journey,...workspace.journeys.filter(row=>row.id!==journey.id)]};
 }
 if(!existing||!('stepId' in action)||action.stepId!==existing.active_step_id)return workspace;
 const stepIndex=program.steps.findIndex(step=>step.id===existing.active_step_id);let journey={...existing,last_operation_id:operationId,updated_at:now};
 if(action.kind==='record_session'){
  if(workspace.sessions.some(row=>row.operation_id===operationId))return workspace;
  return {...workspace,journeys:workspace.journeys.map(row=>row.id===journey.id?journey:row),sessions:[...workspace.sessions,{id:`session-${operationId}`,journey_id:journey.id,dog_id:dog.id,program_version_id:program.id,step_id:action.stepId,operation_id:operationId,feedback:action.feedback,performed_at:now}]};
 }
 if(action.kind==='confirm_step'){
  const milestones=workspace.milestones.some(row=>row.journey_id===journey.id&&row.step_id===action.stepId)?workspace.milestones:[...workspace.milestones,{id:`milestone-${operationId}`,journey_id:journey.id,dog_id:dog.id,program_version_id:program.id,step_id:action.stepId,confirmation_operation_id:operationId,confirmed_at:now}];
  return {...workspace,journeys:workspace.journeys.map(row=>row.id===journey.id?journey:row),milestones};
 }
 if(action.kind==='undo_step'){
  if(!workspace.milestones.some(row=>row.id===action.expectedMilestoneId&&row.journey_id===journey.id&&row.step_id===action.stepId))return workspace;
  return {...workspace,journeys:workspace.journeys.map(row=>row.id===journey.id?journey:row),milestones:workspace.milestones.filter(row=>row.id!==action.expectedMilestoneId)};
 }
 if(action.kind==='next'&&workspace.milestones.some(row=>row.journey_id===journey.id&&row.step_id===action.stepId)&&stepIndex<program.steps.length-1)journey={...journey,active_step_id:program.steps[stepIndex+1].id};
 else if(action.kind==='back'&&stepIndex>0)journey={...journey,active_step_id:program.steps[stepIndex-1].id};
 else if(action.kind==='pause')journey={...journey,state:'paused'};
 else if(action.kind==='maintenance')journey={...journey,state:'maintenance'};
 return {...workspace,journeys:workspace.journeys.map(row=>row.id===journey.id?journey:row)};
}
function fixtureQuery(table){const query={eq(){return query;},order(){return query;},abortSignal(){return query;},maybeSingle(){return Promise.resolve({data:null,error:null});},then(resolve,reject){const data=table==='breeds'?[{id:'golden',name:'Golden retriever'}]:[];return Promise.resolve({data,error:null}).then(resolve,reject);}};return query;}
const client={from:table=>({select:()=>fixtureQuery(table)})};
window.__tasslaMetricsFixture={consent:false,events:[],calls:[]};
const profileClient={rpc:async(name,args)=>{const fixture=window.__tasslaMetricsFixture;fixture.calls.push(name);if(new URLSearchParams(location.search).get('metricsScenario')==='error')return {data:null,error:{message:'synthetic error'}};if(name==='get_beta_metrics_consent'){if(new URLSearchParams(location.search).get('metricsScenario')==='slow-retry'){if(fixture.calls.filter(call=>call==='get_beta_metrics_consent').length===1)return {data:null,error:{message:'synthetic error'}};await new Promise(resolve=>setTimeout(resolve,800));}return {data:fixture.consent,error:null};}if(name==='set_beta_metrics_consent'){fixture.consent=args.p_enabled;if(!fixture.consent)fixture.events=[];return {data:true,error:null};}if(name==='record_product_event'){if(fixture.consent)fixture.events.push(args.p_event_type);return {data:'synthetic-event',error:null};}return {data:null,error:{message:'unknown RPC'}};},from:()=>({select:()=>({order:()=>({abortSignal:async()=>{const scenario=new URLSearchParams(location.search).get('profileScenario');if(scenario==='loading')await new Promise(resolve=>setTimeout(resolve,1400));if(scenario==='error')return {data:null,error:{message:'synthetic read error'}};return {data:[{id:'golden',name:'Golden retriever'}],error:null};}})})})};
function isFixtureAccountCurrent(){return true;}
function ActionMenuContractFixture(){
 const [visible,setVisible]=useState(false);
 const calls=useRef({close:0,edit:0,delete:0});
 Object.assign(window,{__tasslaActionMenuCalls:calls.current});
 function record(key:'close'|'edit'|'delete'){calls.current[key]+=1;Object.assign(window,{__tasslaActionMenuCalls:{...calls.current}});}
 return <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:tokens.spacing.md,backgroundColor:tokens.colors.background}}>
  <Text style={{...tokens.typography.heading,color:tokens.colors.textPrimary}}>ActionMenu testyta</Text>
  <ActionMenu visible={visible} label="Testa åtgärdsmenyn" objectLabel="testpost"
   onOpen={()=>setVisible(true)} onClose={()=>{record('close');setVisible(false);}}
   onEdit={()=>record('edit')} onDelete={()=>record('delete')}/>
 </View>;
}
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
 const params=new URLSearchParams(location.search);const state=params.get('state')||'ready';const firstDayMode=params.get('firstDay')==='true';const logScenario=params.get('logScenario')||'ready';const calendarScenario=params.get('calendarScenario')||'loading';const usesSplitLogFixture=['split-day','split-day-error'].includes(logScenario);const insightsPaged=['insights-paged','insights-local-older'].includes(logScenario);const insightsMany=logScenario==='insights-many';const reviewFixtureEnabled=process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true';
 const [fixtureDate,setFixtureDate]=useState(today);
 const [fixtureChecklistPlanFocus,setFixtureChecklistPlanFocus]=useState(false);
 const [fixtureHistoricalFocus,setFixtureHistoricalFocus]=useState(false);
 const [page,setPage]=useState(new URLSearchParams(location.search).get('screen')||'home');const [knowledgeDetailOpen,setKnowledgeDetailOpen]=useState(false);const [focusedChecklistStep,setFocusedChecklistStep]=useState<{programId:string;stepId:string}|null>(null);const [checklistFilter,setChecklistFilter]=useState<ChecklistFilter>(()=>{const requested=params.get('checklistFilter');return requested==='Denna vecka'||requested==='Alla'||requested==='Kommande'?requested:'Idag';});
 const [fixtureScopeChanged,setFixtureScopeChanged]=useState(false);const fixtureDog=fixtureScopeChanged?{...dog,id:'fixture-dog-b',name:'Milo'}:dog;
 const workspaceState=params.get('workspaceState')||'';
 const mutationScenario=['pending','failed','unsure'].includes(params.get('mutation'));const accidentMutationScenario=logScenario==='accident-pending';const initialMutationStatus=accidentMutationScenario?'pending':mutationScenario?params.get('mutation'):null;
 const initialLogEvents=insightsMany?Array.from({length:45},(_,i)=>logEvent(`fixture-many-${i}`,today,8*60+i,'pee')):logScenario==='insights-local-older'?[logEvent('server-event',today,8*60,'pee'),logEvent('local-older',shiftFixtureDate(today,-10),8*60,'food')]:insightsPaged?Array.from({length:10},(_,i)=>logEvent(`insights-page-${i}`,today,12*60-i*10,'pee')):logScenario==='insights'?[logEvent('fixture-insights-pee',today,8*60,'pee')]:accidentEditFixtures[logScenario]??(usesSplitLogFixture?logSplitPage:initialEvents);const visualLogEvents=logScenario==='palette'?[...initialLogEvents,logEvent('fixture-water',today,13*60,'water'),logEvent('fixture-accident',today,14*60,'accident'),logEvent('fixture-yesterday',shiftFixtureDate(today,-1),7*60+30,'awake'),logEvent('fixture-marker-five-days-ago',shiftFixtureDate(today,-5),8*60,'water')]:initialLogEvents;
 const [fixtureLogView,setFixtureLogView]=useState<'today'|'overview'>(logScenario==='insights'||insightsPaged||insightsMany?'overview':'today');const [fixtureInsightsPeriod,setFixtureInsightsPeriod]=useState<'today'|'week'|'month'|'since_first_log'>('week');
 const [events]=useState(initialEvents);const [logEvents,setLogEvents]=useState<LogEvent[]>(visualLogEvents);const [logHasMore,setLogHasMore]=useState(usesSplitLogFixture||insightsPaged);const [logLoadingMore,setLogLoadingMore]=useState(false);const [logLoadMoreError,setLogLoadMoreError]=useState(false);const [logLoadAttempt,setLogLoadAttempt]=useState(0);const [mutation,setMutation]=useState<FixtureLogMutation|null>(()=>initialMutationStatus?{kind:'add',id:'fixture-pending',mutationId:'fixture-pending',type:accidentMutationScenario?'accident':'food',occurredAt:accidentMutationScenario?`${today}T08:11:00.000Z`:new Date().toISOString(),status:initialMutationStatus as FixtureLogMutation['status'],accidentKinds:accidentMutationScenario?['pee']:null}:null);const [pendingLogUpdate,setPendingLogUpdate]=useState<{id:string;changes:LogEventChanges}|null>(null);const [failNextLogUpdate,setFailNextLogUpdate]=useState(['failed','unsure'].includes(params.get('editScenario')||''));const [focused,setFocused]=useState(null);const [plans,setPlans]=useState(healthRouteRoundTrip?healthRoutePlans:initialPlan);const [healthTab,setHealthTab]=useState<HealthTab>('Översikt');const [healthFocus,setHealthFocus]=useState<{planId:string|null;returnTab:HealthTab}|null>(null);const [historyError,setHistoryError]=useState(new URLSearchParams(location.search).get('state')==='error');const [plannedState,setPlannedState]=useState<'loading'|'ready'|'error'>(()=>state==='empty'?'ready':state==='loading'?'loading':state==='error'?'error':'ready');const [plannedScenario,setPlannedScenario]=useState(params.get('plannedScenario')||'');
 const [weightRows,setWeightRows]=useState(weights);const [weightRecovery,setWeightRecovery]=useState<WeightEditorRecovery|null>(null);const [pendingWeightDelete,setPendingWeightDelete]=useState<string|null>(null);
 const [dailyMutationMode,setDailyMutationMode]=useState(params.get('dailyMutation')||'');
 const homeScenario=params.get('homeScenario')||'ready';
 const moreScenario=params.get('moreScenario')||'';
 const trainingScenario=params.get('trainingScenario')||'default';
 const trainingUnmarkScenario=params.get('trainingUnmark')||'';
 const [trainingPrograms,setTrainingPrograms]=useState<PublishedTrainingProgram[]>(()=>trainingScenarioFixture(trainingScenario,reviewFixtureEnabled));
 const progressionScenario=params.get('progression')||'';
 const [trainingProgression,setTrainingProgression]=useState<TrainingProgressionWorkspace>(()=>initialProgressionFixture(progressionScenario,trainingPrograms));
 const progressionStore=useRef(trainingProgression);
 const [pendingProgressions,setPendingProgressions]=useState<Record<string,PendingTrainingProgression>>({});
 const progressionOperationNumber=useRef(0);
 const progressionOperationLog=useRef<{operationId:string;action:TrainingProgressionAction}[]>([]);
 const progressionUnknownTriggered=useRef(false);
 const [trainingProgramFocus,setTrainingProgramFocus]=useState<string|null>(null);
 const [progressionReadState,setProgressionReadState]=useState<'ready'|'error'>(()=>params.get('progressionRead')==='error'?'error':'ready');
 const pausedTraining:PausedTrainingProgress[]=trainingScenario==='paused'?[{versionId:'fixture-training:previous-version',title:'Vardagsro och hantering',versionNumber:1,completedCount:2}]:trainingScenario==='paused-unavailable'?[{versionId:'fixture-training:unavailable-version',title:null,versionNumber:null,completedCount:2}]:[];
 const [checklistTrainingSelections]=useState(()=>firstDayMode?[]:trainingPrograms.flatMap(program=>{
  const step=program.steps.find(candidate=>!program.completedStepIds.includes(candidate.id));
  return step?[{programId:program.id,stepId:step.id}]:[];
 }).slice(0,2));
 const [trainingBusyStepKey,setTrainingBusyStepKey]=useState<string|null>(null);
 const [trainingError,setTrainingError]=useState(()=>params.get('trainingError')==='retryable'||state==='error'?'Programmet kunde inte hämtas':'');
 const [fixtureRoutines,setFixtureRoutines]=useState<DailyRoutine[]>(firstDayMode?[]:reviewRoutines);
 const [fixtureRoutineDays,setFixtureRoutineDays]=useState<DailyRoutineDay[]>(firstDayMode?[]:reviewRoutineDays);
 const [fixtureRoutineSkips,setFixtureRoutineSkips]=useState<DailyRoutineDaySkip[]>([]);
 const retryRoutineMutation=useRef<(()=>void)|null>(null);
 const firstDayDayRetry=useRef<(()=>void)|null>(null);
 const firstDayUnknownUsed=useRef(false);
 const firstDayMutationCounts=useRef({createCalls:0,dayAddCalls:0,routineId:'',dayRowId:'',mutationId:'',dateKey:''});
 const conflictReturned=useRef(false);
 function addLogFixture(type:LogEventType,intent?:AccidentLogIntent){if(type==='accident'&&!intent)return;const event:LogEvent={id:intent?.id??crypto.randomUUID(),dogId:dog.id,type,occurredAt:intent?.occurredAt??new Date().toISOString(),note:null,origin:'local-test',accidentKinds:intent?.accidentKinds??null};const status=logScenario==='accident-failed'?'failed':logScenario==='accident-unsure'?'unsure':'saved';if(status==='saved')setLogEvents(rows=>[event,...rows]);setMutation({kind:'add',id:event.id,mutationId:event.id,type:event.type,occurredAt:event.occurredAt,accidentKinds:event.accidentKinds,status});}
 function retryLogFixture(){if(mutation?.kind==='update'&&pendingLogUpdate){setLogEvents(rows=>rows.map(row=>row.id===pendingLogUpdate.id?{...row,...pendingLogUpdate.changes}:row));setMutation({...mutation,type:pendingLogUpdate.changes.type,occurredAt:pendingLogUpdate.changes.occurredAt,accidentKinds:pendingLogUpdate.changes.accidentKinds,status:'saved'});setPendingLogUpdate(null);return true;}if(mutation?.kind!=='add')return true;const event:LogEvent={id:mutation.id,dogId:dog.id,type:mutation.type,occurredAt:mutation.occurredAt,note:null,origin:'local-test',accidentKinds:mutation.accidentKinds??null};setLogEvents(rows=>rows.some(row=>row.id===event.id)?rows:[event,...rows]);setMutation({...mutation,status:'saved'});return true;}
 function loadMoreLog(){if(logLoadingMore||!logHasMore)return;setLogLoadingMore(true);setLogLoadMoreError(false);window.setTimeout(()=>{setLogLoadingMore(false);if((logScenario==='split-day-error'||insightsPaged)&&logLoadAttempt===0){setLogLoadAttempt(1);setLogLoadMoreError(true);return;}setLogEvents(rows=>[...rows,...(insightsPaged?[logEvent('insights-older',shiftFixtureDate(today,-1),8*60,'food')]:logSplitContinuation).filter(next=>!rows.some(row=>row.id===next.id))]);setLogHasMore(false);},650);}
 const scenarioStep=homeScenario==='review-training'?process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true'?homeDenseFixture.trainingStep:undefined:homeScenario==='ready'?homeDenseFixture.trainingStep:undefined;
 const empty=state==='empty';const records=empty?[]:history;
 const main=['home','log','training','knowledge'].includes(page)?page:['checklist','progress','home-training-detail','workspace-retention'].includes(page)?'home':'more';
 const navigateMainTab=(destination)=>{const enteringKnowledge=page!=='knowledge'&&destination==='knowledge';const leavingKnowledge=page==='knowledge'&&destination!=='knowledge';if(enteringKnowledge||leavingKnowledge){setFocused(null);setKnowledgeDetailOpen(false);}setPage(destination);};
 const go=(p)=>{const destination=p==='profile'?'passport':p==='notification-settings'?'more':p==='planned-health'?'planned':p;if(isMainTabDestination(destination))navigateMainTab(destination);else setPage(destination);};
 const fixtureActivities=fixtureDailyActivities(fixtureRoutines,fixtureRoutineDays,fixtureDate,!firstDayMode);
 const routineChecklistActivities=fixtureActivities.filter(activity=>activity.kind==='routine');
 const trainingChecklistActivities=checklistTrainingSelections.flatMap(selection=>{
  const program=trainingPrograms.find(candidate=>candidate.id===selection.programId);
  const step=program?.steps.find(candidate=>candidate.id===selection.stepId);
  return program&&step?[{id:`training:${program.id}:${step.id}`,label:step.title,kind:'training' as const,completed:program.completedStepIds.includes(step.id),programId:program.id,stepId:step.id,programTitle:program.title}]:[];
 });
 const checklistCandidates=[...routineChecklistActivities,...trainingChecklistActivities];
 const requestedChecklistCount=Number(params.get('checklistCount')??7);
 const checklistCount=Number.isFinite(requestedChecklistCount)?Math.max(0,Math.min(7,requestedChecklistCount)):7;
 const checklistVisual=params.get('checklistVisual')==='true';
 const fixtureChecklistActivities=checklistCandidates.slice(0,checklistCount);
 const visualTraining=trainingChecklistActivities[0];
 const checklistVisualActivities:HomeDailyActivity[]=[
  {id:'visual-morning-walk',label:'Morgonrast',icon:'walk-outline',routineLabel:'Morgonrast',kind:'routine',completed:true,dateKey:today},
  ...(visualTraining?[{...visualTraining,id:'visual-training-sit',label:'Träna sitt',completed:true,dateKey:today}]:[]),
  {id:'visual-environment',label:'Miljöträning ute',icon:'fitness-outline',routineLabel:'Miljöträning ute',kind:'routine',completed:false,dateKey:today},
  {id:'visual-vaccination',label:'Kontrollera vaccinationsplan',icon:'bandage-outline',routineLabel:'Kontrollera vaccinationsplan',kind:'routine',completed:false,healthType:'vaccination',dateKey:today},
  {id:'visual-evening',label:'Kvällsrutin',icon:'moon-outline',routineLabel:'Kvällsrutin',kind:'routine',completed:false,dateKey:today},
 ];
 const checklistActivities=checklistVisual?checklistVisualActivities:fixtureChecklistActivities;
 const checklistRangeActivities:HomeDailyActivity[]=params.get('checklistRangeEmpty')==='true'?[]:checklistVisual?[
  {...checklistVisualActivities[0],id:'visual-history-walk-1',dateKey:shiftFixtureDate(today,-1)},
  ...(visualTraining?[{...visualTraining,id:'visual-history-training-1',label:'Träna sitt',completed:true,dateKey:shiftFixtureDate(today,-1)}]:[]),
  {...checklistVisualActivities[2],id:'visual-history-environment-1',dateKey:shiftFixtureDate(today,-3)},
  {...checklistVisualActivities[4],id:'visual-history-evening-1',dateKey:shiftFixtureDate(today,-5)},
 ]:fixtureChecklistActivities.map((item,index)=>({...item,id:'fixture-history-'+index,dateKey:shiftFixtureDate(today,-(index<2?1:index>=5?index-4:index+1))}));
 const requestedChecklistRangeState=params.get('checklistRangeState')||'ready';
 const checklistRangeState=requestedChecklistRangeState==='loading'||requestedChecklistRangeState==='partial'||requestedChecklistRangeState==='error'?requestedChecklistRangeState:'ready';
 const fixtureRange=checklistFilter==='Idag'?null:checklistFilterRange(checklistFilter,today);
 const fixtureRangeActivities=!fixtureRange||params.get('checklistRangeEmpty')==='true'?[]:checklistFilter==='Kommande'
  ?deriveUpcomingActivities(fixtureRoutines,[{id:'fixture-upcoming-vaccine',dog_id:dog.id,event_type:'vaccination',due_on:shiftFixtureDate(today,2)}],dog.id,fixtureRange.from,fixtureRange.to)
  :checklistRangeActivities.filter(item=>item.dateKey&&item.dateKey>=fixtureRange.from&&item.dateKey<=fixtureRange.to);
 const historicalProgram=trainingPrograms.find(program=>program.id===focusedChecklistStep?.programId);
 const historicalStep=historicalProgram?.steps.find(step=>step.id===focusedChecklistStep?.stepId);
 const historicalActivity=fixtureRangeActivities.find(item=>item.programId===focusedChecklistStep?.programId&&item.stepId===focusedChecklistStep?.stepId);
 async function createRoutineFixture(input:DailyRoutineCreateInput){const routine:DailyRoutine={...input,dog_id:dog.id,checklist_revision:1,legacy_single_item:false,repeat_anchor_date:input.repeat_unit?fixtureDate:null};setFixtureRoutines(rows=>[routine,...rows]);return {status:'saved' as const,value:routine};}
 function publishFirstDayCounts(){Object.assign(window,{__homeFirstDayMutationCounts:{...firstDayMutationCounts.current}});}
 function addRoutineFixture(routine:DailyRoutine,dateKey=fixtureDate,dayId=crypto.randomUUID()){
  if(fixtureRoutineDays.some(row=>row.routine_id===routine.id&&row.date_key===dateKey))return;
  const skipped=fixtureRoutineSkips.find(row=>row.routine_id===routine.id&&row.date_key===dateKey);
  if(skipped){const {day_id,...snapshot}=skipped;setFixtureRoutineDays(rows=>[{...snapshot,id:day_id,routine_day_revision:snapshot.routine_day_revision+1},...rows]);setFixtureRoutineSkips(rows=>rows.filter(row=>row.day_id!==day_id));return;}
  setFixtureRoutineDays(rows=>[{id:dayId,dog_id:dog.id,routine_id:routine.id,date_key:dateKey,time_zone:'Europe/Stockholm',routine_label_snapshot:routine.label,checklist_snapshot:routine.checklist,completed_item_ids:[],completed_at:null,is_recurring_occurrence:isRoutineDueOnDate(routine,dateKey),routine_revision_snapshot:routine.checklist_revision,routine_day_revision:1,last_state_mutation_id:null},...rows]);
 }
 async function addFirstDayRoutineToToday(routine:DailyRoutine,dateKey:string,dayRowId:string,mutationId:string){
  firstDayMutationCounts.current.dayAddCalls+=1;publishFirstDayCounts();
  const configuredOutcome=params.get('firstDayAdd');
  if(configuredOutcome==='unknown'&&!firstDayUnknownUsed.current){
   firstDayUnknownUsed.current=true;setDailyMutationMode('day-add-unknown');
   firstDayDayRetry.current=()=>{firstDayDayRetry.current=null;void addFirstDayRoutineToToday(routine,dateKey,dayRowId,mutationId);};
   return {status:'unknown' as const};
  }
  if(configuredOutcome==='failed'){setDailyMutationMode('day-add-failed');return {status:'failed' as const};}
  addRoutineFixture(routine,dateKey,dayRowId);setDailyMutationMode('');
  return {status:'saved' as const,value:{id:dayRowId,dog_id:routine.dog_id,routine_id:routine.id,date_key:dateKey,time_zone:'Europe/Stockholm',routine_label_snapshot:routine.label,checklist_snapshot:routine.checklist,completed_item_ids:[],completed_at:null,is_recurring_occurrence:false,routine_revision_snapshot:routine.checklist_revision,routine_day_revision:1,last_state_mutation_id:null}};
 }
 async function createRoutineForTodayFixture(input:DailyRoutineCreateInput){
  firstDayMutationCounts.current.createCalls+=1;
  firstDayMutationCounts.current.routineId=input.id;
  const routine:DailyRoutine={...input,dog_id:dog.id,checklist_revision:1,legacy_single_item:false,repeat_anchor_date:input.repeat_unit?fixtureDate:null};
  const capturedDate=fixtureDate;const capturedDog=dog.id;
  const result=await createRoutineAndSelectForToday({routine,dateKey:capturedDate,timeZone:'Europe/Stockholm',createId:()=>crypto.randomUUID(),
   isScopeCurrent:()=>firstDayMode&&fixtureDate===capturedDate&&dog.id===capturedDog,
   createRoutine:()=>createRoutineFixture(input),
   selectRoutineDay:(day,mutationId)=>{
    firstDayMutationCounts.current.dayRowId=day.id;firstDayMutationCounts.current.mutationId=mutationId;firstDayMutationCounts.current.dateKey=day.date_key;publishFirstDayCounts();
    return addFirstDayRoutineToToday(routine,day.date_key,day.id,mutationId);
   }});
  return result.template?.status==='saved'?{status:'saved' as const}:result.template?.status==='unknown'?{status:'unknown' as const}:result.template?{status:'failed' as const}:undefined;
 }
 function saveRoutineFixture(routine:DailyRoutine,label:string,checklist:DailyRoutineChecklistItem[],repeat:DailyRoutineRepeatValues){const legacyDay=routine.repeat_anchor_date?isoWeekdayForDateKey(routine.repeat_anchor_date):null;const currentWeekdays=routine.repeat_weekdays??(legacyDay?[legacyDay]:[]);const desiredWeekdays=repeat.repeat_weekdays??(legacyDay?[legacyDay]:[]);const sameWeekdays=JSON.stringify(currentWeekdays)===JSON.stringify(desiredWeekdays);const sameRule=routine.repeat_unit===repeat.repeat_unit&&routine.repeat_interval===repeat.repeat_interval&&(routine.repeat_unit!=='week'||sameWeekdays);const weekdays=routine.repeat_unit==='week'&&repeat.repeat_unit==='week'&&routine.repeat_weekdays===null&&repeat.repeat_weekdays?.length===1&&repeat.repeat_weekdays[0]===legacyDay?null:repeat.repeat_weekdays;setFixtureRoutines(rows=>rows.map(row=>row.id===routine.id?{...row,label,checklist,...repeat,repeat_weekdays:weekdays,repeat_anchor_date:sameRule?row.repeat_anchor_date:repeat.repeat_unit?today:null,checklist_revision:row.checklist_revision+1,legacy_single_item:false}:row));}
 async function updateRoutineFixture(routine:DailyRoutine,label:string,checklist:DailyRoutineChecklistItem[],repeat:DailyRoutineRepeatValues){
  const simulatedFailure=params.get('routineMutation');
  if(simulatedFailure==='failed'||simulatedFailure==='unknown'){
   retryRoutineMutation.current=()=>{saveRoutineFixture(routine,label,checklist,repeat);retryRoutineMutation.current=null;setDailyMutationMode('');};
   setDailyMutationMode(simulatedFailure);
   return {status:simulatedFailure};
  }
  if(simulatedFailure==='conflict'&&!conflictReturned.current){
   conflictReturned.current=true;
   const latest:DailyRoutine={...routine,label:`${routine.label} · senaste`,checklist:routine.checklist.map((item,index)=>index===0?{...item,label:`${item.label} · senaste`}:{...item}),checklist_revision:routine.checklist_revision+1};
   setFixtureRoutines(rows=>rows.map(row=>row.id===routine.id?latest:row));
   return {status:'conflict' as const,value:latest};
  }
  saveRoutineFixture(routine,label,checklist,repeat);
  return {status:'saved' as const};
 }
 async function unmarkTrainingFixture(program:PublishedTrainingProgram,stepId:string){const key=`${program.id}:${stepId}:unmark`;setTrainingBusyStepKey(key);setTrainingError('');try{if(trainingUnmarkScenario)await new Promise(resolve=>window.setTimeout(resolve,trainingUnmarkScenario==='pending'?1800:500));if(trainingUnmarkScenario==='failed'){setTrainingError('Steget är fortfarande markerat. Kontrollera anslutningen och försök igen.');return false;}if(trainingUnmarkScenario==='unknown'){setTrainingError('Vi kunde inte bekräfta att steget avmarkerades. Kontrollera statusen innan du försöker på nytt.');return false;}setTrainingPrograms(current=>current.map(item=>item.id===program.id?{...item,completedStepIds:item.completedStepIds.filter(id=>id!==stepId)}:item));return {programId:program.id,stepId};}finally{setTrainingBusyStepKey(null);}}
 async function applyProgressionFixture(action:TrainingProgressionAction):Promise<'saved'|'failed'|'unknown'>{
  const versionId=action.programVersionId;const pending=pendingProgressions[versionId];const operationId=pending?.operationId??`fixture-progression-${++progressionOperationNumber.current}`;
  const progressionWrite=params.get('progressionWrite');
  progressionOperationLog.current.push({operationId,action});Object.assign(window,{__tasslaTrainingProgressionOperations:progressionOperationLog.current});
  if(trainingBusyStepKey)return 'failed';setTrainingBusyStepKey(`journey:${versionId}`);
  try{
   if(progressionWrite==='pending')await new Promise(resolve=>window.setTimeout(resolve,650));
   if(progressionWrite==='failed'&&!pending)return 'failed';
   if(progressionWrite==='failed-session'&&action.kind==='record_session'&&!pending)return 'failed';
   const next=applyProgressionFixtureAction(progressionStore.current,trainingPrograms.find(program=>program.id===versionId),action,operationId);
   progressionStore.current=next;
   const shouldReturnUnknown=progressionWrite==='unknown-once'||(progressionWrite==='unknown-session-once'&&action.kind==='record_session');
   if(shouldReturnUnknown&&!progressionUnknownTriggered.current&&!pending){
    progressionUnknownTriggered.current=true;setPendingProgressions(current=>({...current,[versionId]:{action,operationId,status:'unknown'}}));return 'unknown';
   }
   setTrainingProgression(next);setPendingProgressions(current=>{const copy={...current};delete copy[versionId];return copy;});return 'saved';
  }finally{setTrainingBusyStepKey(null);}
 }
 function retryProgressionFixture(versionId:string):Promise<'saved'|'failed'|'unknown'>{
  const pending=pendingProgressions[versionId];return pending?.status==='unknown'?applyProgressionFixture(pending.action):Promise.resolve('failed');
 }
 function retryDailyFixtureMutation(){if(firstDayDayRetry.current){firstDayDayRetry.current();return;}if(retryRoutineMutation.current){retryRoutineMutation.current();return;}setDailyMutationMode('');}
 async function deleteRoutineFixture(routine:DailyRoutine){setFixtureRoutines(rows=>rows.filter(row=>row.id!==routine.id));setFixtureRoutineDays(rows=>rows.filter(row=>row.routine_id!==routine.id));return {status:'saved' as const};}
 function removeRoutineFixture(row:DailyRoutineDay){const routine=fixtureRoutines.find(item=>item.id===row.routine_id);if(routine&&(row.is_recurring_occurrence||isRoutineDueOnDate(routine,row.date_key))){const {id,...snapshot}=row;setFixtureRoutineSkips(rows=>[...rows.filter(item=>item.routine_id!==row.routine_id||item.date_key!==row.date_key),{...snapshot,day_id:id,routine_day_revision:row.routine_day_revision+1,last_state_mutation_id:crypto.randomUUID()}]);}setFixtureRoutineDays(rows=>rows.filter(item=>item.id!==row.id));}
 function setRoutineItemFixture(row:DailyRoutineDay,itemId:string,completed:boolean){setFixtureRoutineDays(rows=>rows.map(item=>{if(item.id!==row.id)return item;const ids=item.checklist_snapshot.map(checklistItem=>checklistItem.id).filter(id=>id===itemId?completed:item.completed_item_ids.includes(id));return {...item,completed_item_ids:ids,completed_at:ids.length===item.checklist_snapshot.length?new Date().toISOString():null,routine_day_revision:item.routine_day_revision+1,last_state_mutation_id:crypto.randomUUID()};}));}
 const visibleRoutineActivities=firstDayMode?fixtureActivities:reviewFixtureEnabled&&state==='ready'&&homeScenario==='product-daily'?fixtureChecklistActivities:reviewFixtureEnabled&&state==='ready'&&homeScenario==='ready'?fixtureActivities:[];
 const firstDayHasActivity=firstDayMode&&fixtureRoutineDays.some(row=>row.date_key===fixtureDate);
 const firstDayMutationMessage=dailyMutationMode==='day-add-failed'?createdRoutineDaySelectionRecoveryCopy.failedMessage:dailyMutationMode==='day-add-unknown'?createdRoutineDaySelectionRecoveryCopy.unknownMessage:dailyMutationMode==='failed'?'Ändringen sparades inte. Försök igen.':dailyMutationMode==='unknown'?'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.':dailyMutationMode==='readback'?'Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.':'';
 const firstDayMutationError=['failed','unknown','readback','day-add-failed','day-add-unknown'].includes(dailyMutationMode);
 Object.assign(window,{__homeFirstDayMode:firstDayMode,__homeFirstDayMutationCounts:{...firstDayMutationCounts.current},__homeFirstDayDate:fixtureDate,__homeFirstDayAdvance:()=>setFixtureDate((date)=>shiftFixtureDate(date,1))});
 return <View style={styles.shell}>
 <View style={styles.appViewport} testID="review-app-viewport">
 {['sign-in','profile-create','auth-callback'].includes(page)?<>
 {page==='sign-in'?<SignInScreenView cancelGoogleSignIn={()=>{}} googlePending={params.get('signinScenario')==='google-pending'} sendMagicLink={async()=>params.get('signinScenario')!=='magic-error'} signInWithGoogle={async()=>params.get('signinScenario')!=='google-error'} signOutWarning={params.get('signinScenario')==='signout-warning'?'Du är utloggad på den här enheten. Servern kunde inte bekräfta att sessionen har återkallats.':null} status={params.get('signinScenario')==='unavailable'?'unavailable':'signedOut'}/>:null}
 {page==='profile-create'?<ProfileScreen client={profileClient as never} ownerId="00000000-0000-4000-8000-000000000002" accountGeneration={1} isCurrentAccount={isFixtureAccountCurrent} onCreated={()=>{}} mode={params.get('profileMode')==='add'?'add':'initial'} onCancel={()=>setPage('home')}/>:null}
 {page==='auth-callback'?<AuthCallbackView mode={params.get('callbackScenario')==='error'?'error':params.get('callbackScenario')==='preview'?'preview':'pending'} pendingMessage={params.get('callbackScenario')==='returned'?'Vi slutför inloggningen…':'Vänta medan länken öppnas…'} onReturn={()=>go('home')}/>:null}
 </>:<AppScreen scrollKey={page==='checklist'?'checklist-flow':page==='health'?'health-flow':page==='planned'&&healthFocus?'planned-health-health-source':page} preserveScrollKey={page==='checklist'||page==='home-training-detail'?'checklist-flow':page==='health'||(page==='planned'&&healthFocus)?'health-flow':undefined} footer={<BottomNav active={main} onChange={go}/>}><MainSwipeNavigation enabled={isMainTabDestination(page)&&!(page==='knowledge'&&knowledgeDetailOpen)} onSwipe={direction=>{const destination=nextMainTabDestination(page,direction);if(destination)navigateMainTab(destination);}}><ScreenTransition transitionKey={page}>
 {page==='workspace-retention'?<WorkspaceRetentionFixture review={reviewFixtureEnabled}/>:null}
 {page==='development'?<DevelopmentScreen dogName={dog.name} birthDate={dog.birth_date} today={fixtureDate} guides={[]} guidesState="ready" onBack={()=>go('home')} onOpenGuide={()=>{}} onRetryGuides={()=>{}}/>:null}
 {page==='metrics-fixture'?<OnboardingMetricsChoice client={profileClient as never} ownerId="00000000-0000-4000-8000-000000000002" accountGeneration={1} isCurrentAccount={isFixtureAccountCurrent} hasReferral />:null}
 {page==='action-menu-contract'?<ActionMenuContractFixture/>:null}
 {page==='home'?<HomeScreen today={fixtureDate} dog={fixtureScopeChanged?fixtureDog:homeScenario==='stale-selection'?{...dog,id:'new-dog',name:'Milo'}:dog} breed={fixtureBreed}
  events={empty?[]:events} healthHistory={records} healthHistoryState={historyError?'error':state==='loading'?'loading':'ready'}
  plans={empty?[]:[...plans,homeDenseFixture.plan]} content={empty||homeScenario==='review-training'?[]:content} contentState={state==='empty'?'ready':state}
  logState={state==='empty'?'ready':state} logPendingOrUnknown={params.get('reflectionPending')==='unknown'} planState={state==='empty'?'ready':state} trainingState={homeScenario==='loading'?'loading':homeScenario==='error'?'error':'ready'}
  trainingProgression={progressionReadState==='ready'?latestHomeTrainingSummary(trainingProgression,trainingPrograms):null} trainingProgressionState={progressionReadState}
  trainingReflection={homeScenario==='reflection-training'?{label:'Utforska i egen takt',date:'26 oktober',occurredAt:'2026-10-26T12:00:00Z',programVersionId:'fixture-training:trygg-start',kind:'milestone'}:null}
  nextTrainingSuggestion={homeScenario==='next-step'?{programId:'fixture-training:trygg-start',programTitle:'Trygg vardagsstart',stepTitle:'Utforska i egen takt'}:null}
  pendingProgression={params.get('suggestionPending')==='unknown'?{action:{kind:'start_or_resume',programVersionId:'fixture-training:trygg-start'},operationId:'fixture-unknown',status:'unknown'}:Object.values(pendingProgressions)[0]??null} onOpenTrainingJourney={versionId=>{setTrainingProgramFocus(versionId);setPage('training')}}
  onRetryProgression={retryProgressionFixture} onRetryTrainingProgressionRead={()=>setProgressionReadState('ready')}
  nextStep={scenarioStep} reviewTrainingStep={homeScenario==='review-training'&&reviewFixtureEnabled}
  dailyFixture={reviewFixtureEnabled&&homeScenario==='ready'&&state==='ready'?homeReviewFixture:undefined}
  dailyState={state==='error'?'error':state==='loading'?'loading':'ready'} dailyRefreshing={workspaceState==='refreshing'} dailyRefreshError={workspaceState==='refresh-error'} dailyDateKey={fixtureDate} dailyScopeKey={`fixture:${fixtureDog.id}:${fixtureDate}`}
  dailyActivities={visibleRoutineActivities} routineTemplates={firstDayMode?fixtureRoutines:reviewFixtureEnabled&&state==='ready'?fixtureRoutines:[]} routineDaySkips={firstDayMode?fixtureRoutineSkips:reviewFixtureEnabled&&state==='ready'?fixtureRoutineSkips:[]}
  dailyTrainingOptions={reviewFixtureEnabled&&state==='ready'&&['ready','product-daily'].includes(homeScenario)?reviewTrainingOptions:[]}
  dailyMutationBusy={dailyMutationMode==='pending'} dailyMutationKey={dailyMutationMode?'complete-routine:day-morning:00000000-0000-4000-8000-000000000001':''}
  dailyMutationMessage={firstDayMutationMessage}
  dailyMutationError={firstDayMutationError} onRetryDaily={()=>setDailyMutationMode('')} onRetryDailyMutation={['unknown','day-add-unknown'].includes(dailyMutationMode)?retryDailyFixtureMutation:undefined}
  onCreateRoutine={firstDayMode?createRoutineForTodayFixture:createRoutineFixture} onUpdateRoutine={updateRoutineFixture} onDeleteRoutine={deleteRoutineFixture}
  onAddRoutineToDay={addRoutineFixture} onRemoveRoutineFromDay={removeRoutineFixture} onSetRoutineCompletion={setRoutineItemFixture}
  onAddTrainingToDay={()=>{}} onRemoveTrainingFromDay={()=>{}} onGo={go}
  onOpenContent={id=>{setFocused(id);setKnowledgeDetailOpen(false);setPage('knowledge')}} onRetryContent={()=>{}} onOpenChecklist={()=>{setChecklistFilter('Idag');setPage('checklist')}}
  onOpenProgress={()=>setPage('progress')} onOpenDevelopment={homeScenario==='reflection-fallback'?()=>setPage('development'):undefined}/>:null}
 {page==='progress'?<DailyProgressScreen dogName={dog.name} dateKey={fixtureDate} state="ready" activities={visibleRoutineActivities}
  refreshing={false} refreshError={false} mutationBusy={false} mutationKey="" mutationMessage={firstDayMutationMessage} mutationError={firstDayMutationError}
  onBack={()=>setPage('home')} onRetry={()=>{}} onRetryMutation={['unknown','day-add-unknown'].includes(dailyMutationMode)?retryDailyFixtureMutation:undefined}
  onManage={()=>{setChecklistFilter('Idag');setPage('checklist')}} onOpenChecklist={()=>{setChecklistFilter('Idag');setPage('checklist')}} onOpenTrainingStep={()=>go('training')}
  onSetRoutineCompletion={setRoutineItemFixture}/>:null}
 {page==='checklist'?<DailyChecklistScreen dateKey={fixtureDate} state={state==='loading'?'loading':state==='error'?'error':'ready'}
  activities={state==='empty'&&!firstDayHasActivity?[]:checklistActivities} refreshing={workspaceState==='refreshing'} refreshError={workspaceState==='refresh-error'}
  filter={checklistFilter} onChangeFilter={setChecklistFilter} rangeState={checklistRangeState} rangeActivities={fixtureRangeActivities}
  onRetryRange={()=>{}}
  mutationBusy={dailyMutationMode==='pending'} mutationKey={dailyMutationMode?'complete-routine:day-morning:00000000-0000-4000-8000-000000000001':''}
  mutationMessage={firstDayMutationMessage}
  mutationError={firstDayMutationError} onBack={()=>setPage('home')} onRetry={()=>setDailyMutationMode('')} onRetryMutation={['unknown','day-add-unknown'].includes(dailyMutationMode)?retryDailyFixtureMutation:undefined}
  onOpenTrainingStep={(programId,stepId)=>{setFixtureHistoricalFocus(false);setFocusedChecklistStep({programId,stepId});setPage('home-training-detail')}} onSetRoutineCompletion={setRoutineItemFixture}
  onOpenHistoricalTrainingStep={(programId,stepId)=>{setFixtureHistoricalFocus(true);setFocusedChecklistStep({programId,stepId});setPage('home-training-detail')}}
  onOpenUpcomingRoutine={async routineId=>{const routine=fixtureRoutines.find(item=>item.id===routineId);return routine?{status:'ready',routine}:{status:'missing'};}} upcomingRoutines={fixtureRoutines}
  onOpenPlannedHealth={()=>{setFixtureChecklistPlanFocus(true);setPage('planned');}}
  routines={fixtureRoutines} routineDaySkips={fixtureRoutineSkips} trainingOptions={firstDayMode?[]:reviewTrainingOptions} onCreateRoutine={firstDayMode?createRoutineForTodayFixture:createRoutineFixture} onUpdateRoutine={updateRoutineFixture} onDeleteRoutine={deleteRoutineFixture}
  onAddRoutineToDay={addRoutineFixture} onRemoveRoutineFromDay={removeRoutineFixture} onAddTrainingToDay={()=>{}} onRemoveTrainingFromDay={()=>{}} onGoTraining={()=>go('training')}/>:null}
 {page==='checklist'&&params.get('checklistScopeReset')==='true'?<View style={{padding:16}}><Button label="Byt hund i testfixture" accessibilityLabel="Byt hund i testfixture" onPress={()=>{setFixtureScopeChanged(true);setChecklistFilter('Idag');setPage('home')}}/></View>:null}
 {page==='log'?<LogScreen mode="cloud" persistLayout={false} events={state==='empty'?[]:logEvents} view={fixtureLogView} onViewChange={(view,options)=>{window.__tasslaLogViewOptions=options??null;setFixtureLogView(view)}}
  insightsPeriod={fixtureInsightsPeriod} onInsightsPeriodChange={setFixtureInsightsPeriod} insightsState={logScenario==='insights'||insightsPaged||insightsMany?{status:'ready',data:{period:fixtureInsightsPeriod,timezone:'Europe/Stockholm',asOf:`${today}T21:59:59.000Z`,periodStartLocal:fixtureInsightsPeriod==='today'||fixtureInsightsPeriod==='since_first_log'?today:shiftFixtureDate(today,-6),periodEndExclusiveLocal:shiftFixtureDate(today,1),observedThroughLocal:today,firstLogDay:fixtureInsightsPeriod==='since_first_log'?today:null,bucket:fixtureInsightsPeriod==='since_first_log'?'month':'day',days:[{date:fixtureInsightsPeriod==='since_first_log'?today.slice(0,7):today,peeCount:1,poopCount:0,unclassifiedAccidentCount:0,sleepCount:0,awakeCount:0}]}}:undefined}
  mutation={mutation} loading={state==='loading'} loadError={state==='error'} onReload={()=>{}} loadMoreError={logLoadMoreError} onLoadMore={loadMoreLog} hasMore={state==='empty'?false:logHasMore} loadingMore={logLoadingMore} loadedThrough={logHasMore?{occurredAt:logScenario==='insights-local-older'?logEvents[0].occurredAt:logEvents.at(-1)?.occurredAt,id:logScenario==='insights-local-older'?logEvents[0].id:logEvents.at(-1)?.id}:null} calendarMarkerMonth={calendarScenario==='loading-month'?'':today.slice(0,7)} calendarMarkers={calendarScenario==='markers'?[today,shiftFixtureDate(today,-1),shiftFixtureDate(today,-5)]:[]} calendarStatus={calendarScenario==='loading'?'loading':calendarScenario==='error'?'error':'ready'} onLoadCalendarMonth={()=>{}} onAdd={addLogFixture} onRetry={retryLogFixture} onCancel={()=>{setMutation(null);setPendingLogUpdate(null);}} onUpdate={(id,changes)=>{if(failNextLogUpdate){setFailNextLogUpdate(false);setPendingLogUpdate({id,changes});setMutation({kind:'update',id,mutationId:id,type:changes.type,occurredAt:changes.occurredAt,accidentKinds:changes.accidentKinds,status:params.get('editScenario')==='unsure'?'unsure':'failed'});return false;}setLogEvents(rows=>rows.map(e=>e.id===id?{...e,...changes}:e));return true;}} onDelete={id=>setLogEvents(rows=>rows.filter(e=>e.id!==id))} onUndo={id=>{setLogEvents(rows=>rows.filter(e=>e.id!==id));setMutation(null);}}/>:null}
 {page==='components'?<ComponentGalleryScreen onBack={()=>go('home')}/>:null}
 {page==='health'?<HealthScreen onBack={()=>go('more')} activeTab={healthTab} onActiveTabChange={tab=>setHealthTab(tab as HealthTab)} records={empty?[]:weightRows} loadState="ready" weightEditorRecovery={weightRecovery} onWeightEditorRecoveryChange={setWeightRecovery} pendingStatus={Boolean(pendingWeightDelete)} blocked={Boolean(pendingWeightDelete)} statusError={Boolean(pendingWeightDelete)} statusMessage={pendingWeightDelete?'Vi kunde inte kontrollera om viktändringen sparades.':''} onRetryPending={()=>{const id=pendingWeightDelete;if(!id)return;setWeightRows(rows=>rows.filter(row=>row.id!==id));setWeightRecovery(current=>current?.id===id?null:current);setPendingWeightDelete(null);}} onDelete={async id=>{if(params.get('weightScenario')==='unknown-delete'){setPendingWeightDelete(id);return false;}setWeightRows(rows=>rows.filter(row=>row.id!==id));return true;}} historyRecords={records} historyLoadState={historyError?'error':state==='empty'?'ready':state} plannedRecords={empty?[]:plans} plannedLoadState={plannedState} onRetryHistory={()=>setHistoryError(false)} onRetryPlannedHealth={()=>setPlannedState('ready')} onSave={async()=>true} onSaveHistory={async()=>true} onOpenPlannedHealth={(planId,returnTab)=>{setHealthTab(returnTab);setHealthFocus({planId,returnTab});setPage('planned');}} onCreatePlannedHealth={returnTab=>{setHealthTab(returnTab);setHealthFocus({planId:null,returnTab});setPage('planned');}}/>:null}
 {page==='planned'?<PlannedHealthScreen
   onBack={()=>{if(fixtureChecklistPlanFocus){setFixtureChecklistPlanFocus(false);setPage('checklist');return;}if(healthFocus){setHealthTab(healthFocus.returnTab);setHealthFocus(null);}go('health')}}
   backLabel={fixtureChecklistPlanFocus?'Checklistan':'Hälsa'}
   records={empty?[]:plans}
   checklistFocusState={fixtureChecklistPlanFocus?'ready':'idle'}
   checklistFocusRecord={fixtureChecklistPlanFocus?{id:'fixture-upcoming-vaccine',dog_id:dog.id,event_type:'vaccination',due_on:shiftFixtureDate(today,2),due_time:null,description:null,reminder_enabled:false,reminder_minutes:null,created_at:today}:null}
   healthFocusActive={Boolean(healthFocus)}
   healthFocusPlanId={healthFocus?.planId ?? null}
   reminderSummary={healthRouteRoundTrip?'Påminnelser av på den här enheten. Sparade planval finns kvar.':''}
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
 {page==='training'||page==='home-training-detail'?<PublishedTrainingScreen
  ageWeeks={trainingScenario==='unknown-age'?null:homeAgeInWeeks(dog.birth_date,today)}
  programs={empty||['no-recommendations','paused','paused-unavailable'].includes(trainingScenario)?[]:trainingPrograms}
  paused={pausedTraining} reviewMode={page==='training'&&reviewFixtureEnabled&&!progressionScenario} error={trainingError} busyStepKey={trainingBusyStepKey}
  progression={trainingProgression} progressionState={progressionReadState} pendingProgressions={pendingProgressions}
  onApplyProgression={applyProgressionFixture} onRetryProgression={retryProgressionFixture}
  initialProgramId={trainingProgramFocus} onInitialProgramFocusApplied={()=>setTrainingProgramFocus(null)}
  focusStep={page==='home-training-detail'&&focusedChecklistStep?{...focusedChecklistStep,returnPage:'checklist',readOnly:fixtureHistoricalFocus,dateKey:historicalActivity?.dateKey,completed:historicalActivity?.completed}:undefined}
  historicalDetail={fixtureHistoricalFocus&&historicalProgram&&historicalStep?{status:'ready',detail:{programVersionId:historicalProgram.id,programTitle:historicalProgram.title,stepId:historicalStep.id,stepTitle:historicalStep.title,instruction:historicalStep.instruction,sources:[...historicalProgram.sources],isAiGenerated:historicalProgram.is_ai_generated}}:undefined}
  onCloseStep={()=>{setFixtureHistoricalFocus(false);setPage('checklist')}}
  onCompleteStep={async(p,id)=>{setTrainingPrograms(current=>current.map(program=>program.id===p.id?{...program,completedStepIds:program.completedStepIds.includes(id)?program.completedStepIds:[...program.completedStepIds,id]}:program));return {programId:p.id,stepId:id};}}
  onUnmarkStep={unmarkTrainingFixture} onContinue={()=>{if(page==='home-training-detail')setPage('checklist')}}
  onResetProgram={program=>setTrainingPrograms(current=>current.map(item=>item.id===program.id?{...item,completedStepIds:[]}:item))}
  onRetry={()=>{setTrainingError('');setProgressionReadState('ready')}}/>:null}
 {page==='passport'?<PassportScreen client={client} dog={dog} weights={empty?[]:weights} history={records} weightLoadState={state==='error'?'error':state==='loading'?'loading':'ready'} historyLoadState={state==='error'?'error':state==='loading'?'loading':'ready'} onBack={()=>go('more')}/>:null}
 {page==='profile'?<DogProfileScreen dog={dog} breed="Golden retriever" onBack={()=>go('more')}/>:null}
 {page==='profile-edit'?<EditDogProfileScreen client={client as never} dog={dog} busy={state==='saving'} pending={state==='pending'} statusMessage={state==='pending'?'Ändringen väntar på en säker statuskontroll.':'Ändringarna är inte sparade.'} statusError={state==='error'||state==='pending'} conflict={state==='conflict'?{...dog,name:'Luna (senaste sparade)'}:undefined} attribution={state==='empty'?null:{code:'ABC123',name:'Solgläntans kennel'}} attributionState={state==='loading'?'loading':state==='error'?'error':'ready'} attributionBusy={state==='saving'} attributionMessage={state==='error'?'Kennelkopplingen kunde inte sparas.':''} attributionMessageError={state==='error'} onBack={()=>go('more')} onSave={async()=>true} onSaveAttribution={async()=>true} onRetryAttribution={()=>{}} onRetryStatus={()=>{}} onAcceptCurrent={()=>{}}/>:null}
 {page==='reminders'?<NotificationSettingsScreen birthDate={dog.birth_date} onBack={()=>go('more')} preferences={{version:1,enabled:state==='saved',trainingEnabled:state==='training',trainingMinutes:8*60+30}} saved={state==='saved'} busy={state==='saving'} statusMessage={state==='error'?'Valen kunde inte sparas säkert. Kontrollera status innan du försöker igen.':''} statusError={state==='error'} permissionState={state==='granted'?'granted':state==='denied'?'denied':'unknown'} onSave={async(preferences)=>{window.__tasslaReminderSavedPreferences=preferences;return true;}} onRequestPermission={async()=>state==='denied'?'denied':'granted'}/>:null}
 {page==='account'?<AccountSettingsScreen ownerId="00000000-0000-4000-8000-000000000002" onBack={()=>go('more')} onOpenInformation={()=>go('beta-info')} onDeleteAccount={async()=>{window.__tasslaAccountDeleteCalls+=1;return {status:state==='failed'?'failed':state==='unavailable'?'unavailable':state==='unknown'?'unknown':'confirmed'};}} onSignOutLocally={async()=>true} busy={state==='saving' || state==='saving-analytics'} status={['confirmed','failed','unknown','unavailable','blocked'].includes(state)?state as 'confirmed'|'failed'|'unknown'|'unavailable'|'blocked':'idle'} localCleanupFailed={state==='cleanup-failed'} signOutFailed={state==='signout-failed' || state==='cleanup-failed'} analyticsConsent={state==='analytics-loading'?null:state==='analytics-on'} analyticsBusy={state==='saving-analytics'} analyticsError={state==='analytics-error'} onSetAnalyticsConsent={async()=>true} onRetryAnalyticsConsent={async()=>{}}/>:null}
 {page==='beta-info'?<BetaInfoScreen onBack={()=>go('account')}/>:null}
 {page==='more'?<MoreScreen onNavigate={destination=>setPage(destination)} signOutError={moreScenario==='signout-error'} signingOut={moreScenario==='signing-out'} onSignOut={()=>{}}/>:null}
 </ScreenTransition></MainSwipeNavigation></AppScreen>}
 </View>
 </View>
}
const styles=StyleSheet.create({shell:{flex:1},appViewport:{flex:1,minHeight:0}});
createRoot(document.getElementById('root')).render(<App/>);
