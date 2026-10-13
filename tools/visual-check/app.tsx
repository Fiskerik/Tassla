import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppScreen} from '../../src/components/AppPrimitives';
import {StyleSheet, Text, View} from 'react-native';
import {BottomNav, ListRow, AppBar} from '../../src/components/ui';
import {ScreenTransition} from '../../src/components/ui/Motion';
import {HomeScreen} from '../../src/features/home/HomeScreen';
import type {HomeDailyFixtureItem} from '../../src/features/home/HomeScreen';
import type {HomeDailyActivity} from '../../src/features/home/daily-activity-model';
import {LogScreen} from '../../src/features/puppy-log/LogScreen';
import {HealthScreen} from '../../src/features/health/HealthScreen';
import {PlannedHealthScreen} from '../../src/features/health/PlannedHealthScreen';
import {KnowledgeScreen} from '../../src/features/knowledge/KnowledgeScreen';
import {PublishedTrainingScreen} from '../../src/features/training/PublishedTrainingScreen';
import {PassportScreen} from '../../src/features/passport/PassportScreen';
import {tokens} from '../../src/theme/tokens';
const today=new Date().toISOString().slice(0,10);
const dog={id:'test-dog',name:'Luna',breed_id:'golden',birth_date:new Date(Date.now()-77*86400000).toISOString().slice(0,10)};
const homeDenseFixture={events:['food','pee','poop','walk','sleep'].map((type,i)=>({id:'event-'+i,dogId:dog.id,type,occurredAt:today+'T'+['12:05','10:30','08:20','07:15','06:50'][i]+':00',note:['Åt allt',null,null,'20 minuter',null][i],origin:'owner'})),trainingStep:'Hantering av tassar',plan:{id:'today-plan',dog_id:dog.id,event_type:'vaccination',due_on:today,due_time:'16:30',description:'Vaccination idag',reminder_enabled:false,reminder_minutes:null,created_at:today}};
const homeReviewFixture:HomeDailyFixtureItem[]=[
 {id:'morning',label:'Morgonrutin',detail:'En liten stund tillsammans',category:'awake',completed:true,destination:'log',routineId:'routine-morning'},
 {id:'walk',label:'Kort promenad',detail:'En tur i valpens takt',category:'walk',completed:true,destination:'log',routineId:'routine-walk'},
 {id:'handling',label:'Miljöträning – nya ljud',detail:'Vecka 11 · Trygghet och vardag',category:'training',completed:false,destination:'training',kind:'training'},
 {id:'rest',label:'Vila efter lek',detail:'En lugn stund hemma',category:'sleep',completed:false,destination:'training',routineId:'routine-rest'},
 {id:'sounds',label:'Kvällslugn',detail:'En mjuk avslutning på dagen',category:'awake',completed:false,destination:'knowledge',routineId:'routine-evening'},
];
const reviewRoutines=[
 {id:'routine-morning',dog_id:dog.id,label:'Morgonrutin'},
 {id:'routine-walk',dog_id:dog.id,label:'Kort promenad'},
 {id:'routine-rest',dog_id:dog.id,label:'Vila efter lek'},
 {id:'routine-evening',dog_id:dog.id,label:'Kvällslugn'},
];
const reviewDailyActivities:HomeDailyActivity[]=[
 {id:'routine:day-morning',label:'Morgonrutin',kind:'routine',completed:true,routineDay:{id:'day-morning',dog_id:dog.id,routine_id:'routine-morning',date_key:today,time_zone:'Europe/Stockholm',completed_at:'2026-10-11T06:30:00.000Z'}},
 {id:'routine:day-walk',label:'Kort promenad',kind:'routine',completed:true,routineDay:{id:'day-walk',dog_id:dog.id,routine_id:'routine-walk',date_key:today,time_zone:'Europe/Stockholm',completed_at:'2026-10-11T08:00:00.000Z'}},
 {id:'training:day-step',label:'Miljöträning – nya ljud',kind:'training',completed:false,programTitle:'Vecka 11',trainingSelection:{id:'selection-1',dog_id:dog.id,program_version_id:'review-version-11',step_id:'step-2',date_key:today,time_zone:'Europe/Stockholm'}},
 {id:'routine:day-rest',label:'Vila efter lek',kind:'routine',completed:false,routineDay:{id:'day-rest',dog_id:dog.id,routine_id:'routine-rest',date_key:today,time_zone:'Europe/Stockholm',completed_at:null}},
 {id:'routine:day-evening',label:'Kvällslugn',kind:'routine',completed:false,routineDay:{id:'day-evening',dog_id:dog.id,routine_id:'routine-evening',date_key:today,time_zone:'Europe/Stockholm',completed_at:null}},
];
const reviewTrainingOptions=[{programId:'review-program',versionId:'review-version-11',stepId:'step-3',programTitle:'Vecka 11',stepTitle:'Miljöträning ute'}];
const initialEvents=homeDenseFixture.events;
const content=[{id:'guide1',title:'En trygg start hemma',body:'Så skapar du lugn, rutin och trygghet de första veckorna.\n\n## En plats att landa\n\nGör plats för valpens saker och låt vardagen ta form i er takt.\n\n- En egen sovplats\n- Tid tillsammans',contentType:'guide'},{id:'guide2',title:'Hantera din valp',body:'Lär känna varandra i lugn och ro.',contentType:'article'},{id:'guide3',title:'Inför hemkomsten',body:'En lista över vad du behöver förbereda.',contentType:'checklist'},...(process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true'?[{id:'review-v1:training:home-harness',title:'Syntetiskt granskningsprogram',body:'Endast syntetiskt innehåll för interaktionsprov. Inte publicerat träningsråd.',contentType:'training_program'}]:[])].map(x=>({...x,version:1,contentId:x.id,sources:['Syntetiskt innehåll för UI-prov, inte publicerat råd.']}));
const history=[{id:'h1',dog_id:dog.id,event_type:'vaccination',occurred_on:'2026-09-28',occurred_time:'14:20',description:'Vaccination valp 1'},{id:'h2',dog_id:dog.id,event_type:'vet_visit',occurred_on:'2026-09-12',occurred_time:null,description:'Första besöket'}];
const weights=[{id:'w1',dog_id:dog.id,occurred_on:'2026-10-07',weight_kg:5.2}];
const initialPlan=[{id:'overdue',dog_id:dog.id,event_type:'vet_visit',due_on:new Date(Date.now()-86400000).toISOString().slice(0,10),due_time:null,description:'Uppföljning',reminder_enabled:false,reminder_minutes:null,created_at:today},{id:'p1',dog_id:dog.id,event_type:'vaccination',due_on:new Date(Date.now()+12*86400000).toISOString().slice(0,10),due_time:'10:30',description:'Vaccination valp 2',reminder_enabled:false,reminder_minutes:null,created_at:today}];
const initialProgram={id:'t1',content_id:'t1',version:1,title:'Vecka 11',body:'Trygghet och vardagsliv.',sources:['Syntetiskt program för interaktionstest.'],completedStepIds:['s0'],steps:['Hantering (tassar, öron, mun)','Miljöträning – nya ljud','Ensamhet – korta stunder','Inkallning – grunder','Möte med andra hundar'].map((title,i)=>({id:'s'+i,position:i,title,instruction:'Testinstruktion för att kontrollera läsning och sparflöde. Inget publicerat träningsråd.'}))};
const client={from:()=>({select:()=>({order:()=>({abortSignal:async()=>({data:[{id:'golden',name:'Golden retriever'}],error:null})})})})};
function App(){
 const [page,setPage]=useState(new URLSearchParams(location.search).get('screen')||'home');
 const [events,setEvents]=useState(initialEvents);const [mutation,setMutation]=useState(null);const [program,setProgram]=useState(initialProgram);const [focused,setFocused]=useState(null);const [plans,setPlans]=useState(initialPlan);const [historyError,setHistoryError]=useState(new URLSearchParams(location.search).get('state')==='error');
 const params=new URLSearchParams(location.search);const state=params.get('state')||'ready';
 const [dailyMutationMode,setDailyMutationMode]=useState(params.get('dailyMutation')||'');
 const homeScenario=params.get('homeScenario')||'ready';
 const reviewFixtureEnabled=process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true';
 const scenarioStep=homeScenario==='review-training'?process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT==='true'?homeDenseFixture.trainingStep:undefined:homeScenario==='ready'?homeDenseFixture.trainingStep:undefined;
 const empty=state==='empty';const records=empty?[]:history;
 const main=['home','log','training','knowledge'].includes(page)?page:'more';
 const go=(p)=>setPage(p==='profile'?'passport':p==='notification-settings'?'more':p==='planned-health'?'planned':p);
 return <View style={styles.shell}>
 {page==='home'&&reviewFixtureEnabled?<View style={styles.reviewBanner} testID="review-banner"><Text accessibilityLabel="Syntetiskt granskningsläge. AI-genererad standardbild." style={styles.reviewBannerText}>AI-GENERERAD STANDARDBILD</Text></View>:null}
 <View style={styles.appViewport} testID="review-app-viewport">
 <AppScreen scrollKey={page} footer={<BottomNav active={main} onChange={go}/>}><ScreenTransition transitionKey={page}>
 {page==='home'?<HomeScreen dog={homeScenario==='stale-selection'?{...dog,id:'new-dog',name:'Milo'}:dog} breed="Golden retriever" events={empty?[]:events} healthHistory={records} healthHistoryState={historyError?'error':state==='loading'?'loading':'ready'} plans={empty?[]:[...plans,homeDenseFixture.plan]} content={empty||homeScenario==='review-training'?[]:content} contentState={state==='empty'?'ready':state} logState={state==='empty'?'ready':state} planState={state==='empty'?'ready':state} trainingState={homeScenario==='loading'?'loading':homeScenario==='error'?'error':'ready'} nextStep={scenarioStep} reviewTrainingStep={homeScenario==='review-training'&&reviewFixtureEnabled} dailyFixture={reviewFixtureEnabled&&homeScenario==='ready'?homeReviewFixture:undefined} dailyState={state==='error'?'error':state==='loading'?'loading':'ready'} dailyDateKey={today} dailyActivities={reviewFixtureEnabled&&['ready','product-daily'].includes(homeScenario)?reviewDailyActivities:[]} routineTemplates={reviewFixtureEnabled&&['ready','product-daily'].includes(homeScenario)?reviewRoutines:[]} dailyTrainingOptions={reviewFixtureEnabled&&['ready','product-daily'].includes(homeScenario)?reviewTrainingOptions:[]} dailyMutationBusy={dailyMutationMode==='pending'} dailyMutationKey={dailyMutationMode?'complete-routine:day-morning':''} dailyMutationMessage={dailyMutationMode==='failed'?'Ändringen sparades inte. Kontrollera anslutningen och försök igen.':dailyMutationMode==='unknown'?'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.':dailyMutationMode==='readback'?'Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.':''} dailyMutationError={['failed','unknown','readback'].includes(dailyMutationMode)} onRetryDaily={()=>setDailyMutationMode('')} onRetryDailyMutation={()=>setDailyMutationMode('')} onCreateRoutine={()=>{}} onUpdateRoutine={()=>{}} onDeleteRoutine={()=>{}} onAddRoutineToDay={()=>{}} onRemoveRoutineFromDay={()=>{}} onSetRoutineCompletion={()=>{}} onAddTrainingToDay={()=>{}} onRemoveTrainingFromDay={()=>{}} onGo={go} onOpenContent={id=>{setFocused(id);go('knowledge')}} onRetryContent={()=>{}}/>:null}
 {page==='log'?<LogScreen mode="cloud" events={empty?[]:events} mutation={mutation} loading={state==='loading'} loadError={state==='error'} onReload={()=>{}} onAdd={type=>{const event={id:crypto.randomUUID(),dogId:dog.id,type,occurredAt:new Date().toISOString(),note:null,origin:'owner'};setEvents([event,...events]);setMutation({kind:'add',mutationId:event.id,...event,status:'saved'});}} onRetry={()=>{setMutation({...mutation,status:'saved'});return true;}} onCancel={()=>setMutation(null)} onUpdate={(id,changes)=>{if(new URLSearchParams(location.search).get('mutation')){setMutation({kind:'update',id,mutationId:id,type:'food',occurredAt:new Date().toISOString(),status:new URLSearchParams(location.search).get('mutation')});return false;}setEvents(events.map(e=>e.id===id?{...e,...changes}:e));return true;}} onDelete={id=>setEvents(events.filter(e=>e.id!==id))} onUndo={id=>{setEvents(events.filter(e=>e.id!==id));setMutation(null);}}/>:null}
 {page==='health'?<HealthScreen onBack={()=>go('more')} records={empty?[]:weights} loadState="ready" historyRecords={records} historyLoadState={historyError?'error':state==='empty'?'ready':state} plannedRecords={empty?[]:plans} plannedLoadState={state==='empty'?'ready':state} onRetryHistory={()=>setHistoryError(false)} onSave={async()=>true} onSaveHistory={async()=>true} onOpenPlannedHealth={()=>go('planned')}/>:null}
 {page==='planned'?<PlannedHealthScreen onBack={()=>go('health')} records={empty?[]:plans} loadState={state==='empty'?'ready':state} onRetry={()=>{}} onResolveConflict={()=>{}} onSave={async(id,type,dueOn,note,reminderEnabled,reminderMinutes,dueTime)=>{setPlans(rows=>id?rows.map(row=>row.id===id?{...row,due_on:dueOn,due_time:dueTime,description:note,reminder_enabled:reminderEnabled,reminder_minutes:reminderMinutes}:row):[{id:'new-plan',dog_id:dog.id,event_type:type,due_on:dueOn,due_time:dueTime,description:note,reminder_enabled:reminderEnabled,reminder_minutes:reminderMinutes,created_at:today},...rows]);return true;}} onDelete={async id=>{setPlans(rows=>rows.filter(row=>row.id!==id));return true;}}/>:null}
 {page==='knowledge'?<KnowledgeScreen items={empty?[]:content} contentState={state==='empty'?'ready':state} focusedContentId={focused} onSelectContent={setFocused} onBack={()=>{setFocused(null);go('home')}}/>:null}
 {page==='training'?<PublishedTrainingScreen programs={empty?[]:[program]} paused={[]} error={state==='error'?'Programmet kunde inte hämtas':''} busyStepKey={null} onCompleteStep={async(p,id)=>{setProgram({...program,completedStepIds:[...program.completedStepIds,id]});return true;}} onContinue={()=>{}} onResetProgram={()=>setProgram({...program,completedStepIds:[]})} onRetry={()=>{}}/>:null}
 {page==='passport'?<PassportScreen client={client} dog={dog} weights={weights} history={history} weightLoadState="ready" historyLoadState="ready" onBack={()=>go('more')}/>:null}
 {page==='more'?<><AppBar mode="Title" title="Mer"/><ListRow category="vaccination" title="Hälsa" onPress={()=>go('health')}/><ListRow category="veterinary" title="Tassla-pass" onPress={()=>go('passport')}/></>:null}
 </ScreenTransition></AppScreen>
 </View>
 </View>
}
const styles=StyleSheet.create({shell:{flex:1},appViewport:{flex:1,minHeight:0},reviewBanner:{alignSelf:'stretch',height:tokens.spacing.xxl,minHeight:tokens.spacing.xxl,justifyContent:'center',paddingHorizontal:tokens.spacing.md,backgroundColor:tokens.colors.warningSurface},reviewBannerText:{...tokens.typography.caption,color:tokens.colors.warning,fontWeight:'700',textAlign:'center'}});
createRoot(document.getElementById('root')).render(<App/>);
