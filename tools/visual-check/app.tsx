import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppScreen} from '../../src/components/AppPrimitives';
import {BottomNav, ListRow, AppBar} from '../../src/components/ui';
import {ScreenTransition} from '../../src/components/ui/Motion';
import {HomeScreen} from '../../src/features/home/HomeScreen';
import {LogScreen} from '../../src/features/puppy-log/LogScreen';
import {HealthScreen} from '../../src/features/health/HealthScreen';
import {PlannedHealthScreen} from '../../src/features/health/PlannedHealthScreen';
import {KnowledgeScreen} from '../../src/features/knowledge/KnowledgeScreen';
import {PublishedTrainingScreen} from '../../src/features/training/PublishedTrainingScreen';
import {PassportScreen} from '../../src/features/passport/PassportScreen';
const today=new Date().toISOString().slice(0,10);
const dog={id:'test-dog',name:'Luna',breed_id:'golden',birth_date:new Date(Date.now()-77*86400000).toISOString().slice(0,10)};
const patternEvents=new URLSearchParams(location.search).get('patterns')==='1'?[{id:'pattern-pee',dogId:dog.id,type:'pee',occurredAt:new Date(Date.now()-86400000).toISOString(),note:null,origin:'owner'},{id:'pattern-poop',dogId:dog.id,type:'poop',occurredAt:new Date(Date.now()-86400000).toISOString(),note:null,origin:'owner'}]:[];
const initialEvents=[...patternEvents,
 {id:'event-0',dogId:dog.id,type:'food',occurredAt:today+'T12:05:00',note:'Åt allt',origin:'owner',amount:80,amountUnit:'g',foodType:'Torrfoder A'},
 {id:'event-1',dogId:dog.id,type:'pee',occurredAt:today+'T10:30:00',note:null,origin:'owner'},
 {id:'event-2',dogId:dog.id,type:'poop',occurredAt:today+'T08:20:00',note:null,origin:'owner'},
 {id:'event-3',dogId:dog.id,type:'walk',occurredAt:today+'T07:15:00',note:'20 minuter',origin:'owner'},
 {id:'event-4',dogId:dog.id,type:'sleep',occurredAt:today+'T06:50:00',note:null,origin:'owner'},
 {id:'event-5',dogId:dog.id,type:'water',occurredAt:today+'T06:20:00',note:null,origin:'owner',amount:null,amountUnit:null},
];
const content=[{id:'guide1',title:'En trygg start hemma',body:'Så skapar du lugn, rutin och trygghet de första veckorna.\n\n## En plats att landa\n\nGör plats för valpens saker och låt vardagen ta form i er takt.\n\n- En egen sovplats\n- Tid tillsammans',contentType:'guide'},{id:'guide2',title:'Hantera din valp',body:'Lär känna varandra i lugn och ro.',contentType:'article'},{id:'guide3',title:'Inför hemkomsten',body:'En lista över vad du behöver förbereda.',contentType:'checklist'}].map(x=>({...x,version:1,contentId:x.id,sources:['Syntetiskt innehåll för UI-prov, inte publicerat råd.']}));
const history=[{id:'h1',dog_id:dog.id,event_type:'vaccination',occurred_on:'2026-09-28',occurred_time:'14:20',description:'Vaccination valp 1'},{id:'h2',dog_id:dog.id,event_type:'vet_visit',occurred_on:'2026-09-12',occurred_time:null,description:'Första besöket'}];
const weights=[{id:'w1',dog_id:dog.id,occurred_on:'2026-10-07',weight_kg:5.2}];
const initialPlan=[{id:'overdue',dog_id:dog.id,event_type:'vet_visit',due_on:new Date(Date.now()-86400000).toISOString().slice(0,10),due_time:null,description:'Uppföljning',reminder_enabled:false,reminder_minutes:null,created_at:today},{id:'p1',dog_id:dog.id,event_type:'vaccination',due_on:new Date(Date.now()+12*86400000).toISOString().slice(0,10),due_time:'10:30',description:'Vaccination valp 2',reminder_enabled:false,reminder_minutes:null,created_at:today}];
const initialProgram={id:'t1',content_id:'t1',version:1,title:'Vecka 11',body:'Trygghet och vardagsliv.',sources:['Syntetiskt program för interaktionstest.'],completedStepIds:['s0'],steps:['Hantering (tassar, öron, mun)','Miljöträning – nya ljud','Ensamhet – korta stunder','Inkallning – grunder','Möte med andra hundar'].map((title,i)=>({id:'s'+i,position:i,title,instruction:'Testinstruktion för att kontrollera läsning och sparflöde. Inget publicerat träningsråd.'}))};
const client={from:()=>({select:()=>({order:()=>({abortSignal:async()=>({data:[{id:'golden',name:'Golden retriever'}],error:null})})})})};
function App(){
 const params=new URLSearchParams(location.search);
 const [page,setPage]=useState(params.get('screen')||'home');
 const [events,setEvents]=useState(initialEvents);const [mutation,setMutation]=useState(null);const [program,setProgram]=useState(initialProgram);const [focused,setFocused]=useState(null);const [plans,setPlans]=useState(initialPlan);const [historyError,setHistoryError]=useState(params.get('state')==='error');
 const pendingLogChanges=React.useRef(null);
 const state=new URLSearchParams(location.search).get('state')||'ready';
 const empty=state==='empty';const records=empty?[]:history;
 const main=['home','log','training','health'].includes(page)?page:'more';
 const go=(p)=>setPage(p==='profile'?'passport':p==='notification-settings'?'more':p==='planned-health'?'planned':p);
 const addLog=(type)=>{
  const event={id:crypto.randomUUID(),dogId:dog.id,type,occurredAt:new Date().toISOString(),note:null,origin:'owner'};
  const needsDetails=['accident','food','water'].includes(type);
  const status=params.get('addMutation');
  if(status==='failed'||status==='unsure'){
   setMutation({kind:'add',mutationId:event.id,id:event.id,type,occurredAt:event.occurredAt,status,detailsHandled:!needsDetails});
   return;
  }
  if(status==='pending'){
   setMutation({kind:'add',mutationId:event.id,id:event.id,type,occurredAt:event.occurredAt,status:'pending',detailsHandled:!needsDetails});
   window.setTimeout(()=>{setEvents(rows=>[event,...rows]);setMutation({kind:'add',mutationId:event.id,id:event.id,type,occurredAt:event.occurredAt,status:'saved',detailsHandled:!needsDetails});},2500);
   return;
  }
  setEvents(rows=>[event,...rows]);
  setMutation({kind:'add',mutationId:event.id,id:event.id,type,occurredAt:event.occurredAt,status:'saved',detailsHandled:!needsDetails});
 };
 const applyChanges=(id,changes)=>{
  const row=events.find(event=>event.id===id);
  if(!row)return null;
  const updated={...row,...changes,type:changes.type||row.type,occurredAt:changes.occurredAt||row.occurredAt,note:changes.note===undefined?row.note:changes.note};
  setEvents(rows=>rows.map(event=>event.id===id?updated:event));
  return updated;
 };
 const updateLog=(id,changes,source='edit')=>{
  const row=events.find(event=>event.id===id);
  if(!row)return false;
  pendingLogChanges.current={id,changes,source};
  const failureMode=params.get(source==='quick-add-details'?'detailMutation':'mutation');
  const status=failureMode==='pending'?'pending':failureMode;
  if(status==='failed'||status==='unsure'||status==='pending'){
   setMutation({kind:'update',mutationId:id,id,type:changes.type||row.type,occurredAt:changes.occurredAt||row.occurredAt,status,source});
   if(status==='pending')return new Promise(resolve=>window.setTimeout(()=>{const updated=applyChanges(id,changes);setMutation(source==='quick-add-details'?{kind:'add',mutationId:id,id,type:updated?.type||row.type,occurredAt:updated?.occurredAt||row.occurredAt,status:'saved',detailsHandled:true}:{kind:'update',mutationId:id,id,type:updated?.type||row.type,occurredAt:updated?.occurredAt||row.occurredAt,status:'saved',source});resolve(Boolean(updated));},3500));
   return false;
  }
  const updated=applyChanges(id,changes);
  if(!updated)return false;
  setMutation(source==='quick-add-details'?{kind:'add',mutationId:id,id,type:updated.type,occurredAt:updated.occurredAt,status:'saved',detailsHandled:true}:{kind:'update',mutationId:id,id,type:updated.type,occurredAt:updated.occurredAt,status:'saved',source});
  return true;
 };
 const retryLog=()=>{
  if(mutation?.kind==='update'){
   const pending=pendingLogChanges.current;
   const updated=pending?applyChanges(pending.id,pending.changes):null;
   if(updated&&pending?.source==='quick-add-details')setMutation({kind:'add',mutationId:pending.id,id:pending.id,type:updated.type,occurredAt:updated.occurredAt,status:'saved',detailsHandled:true});
   else setMutation({...mutation,status:'saved'});
   return Boolean(updated)||!pending;
  }
  setMutation({...mutation,status:'saved'});
  return true;
 };
 const cancelLog=()=>{
  if(mutation?.source==='quick-add-details'){
   setMutation({kind:'add',mutationId:mutation.id,id:mutation.id,type:mutation.type,occurredAt:mutation.occurredAt,status:'saved',detailsHandled:true});
   return;
  }
  setMutation(null);
 };
 const undoLog=(id)=>{
  const row=events.find(event=>event.id===id);
  setEvents(rows=>rows.filter(event=>event.id!==id));
  setMutation({kind:'undo',mutationId:id,id,type:row?.type||'food',occurredAt:row?.occurredAt||new Date().toISOString(),status:'saved'});
 };
 return <AppScreen scrollKey={page} footer={<BottomNav active={main} onChange={go}/>}><ScreenTransition transitionKey={page}>
 {page==='home'?<HomeScreen dog={dog} breed="Golden retriever" events={empty?[]:events} healthHistory={records} healthHistoryState={historyError?'error':state==='loading'?'loading':'ready'} plans={empty?[]:plans} content={empty?[]:content} contentState={state==='empty'?'ready':state} logState={state==='empty'?'ready':state} planState={state==='empty'?'ready':state} nextStep="Hantering av tassar" onGo={go} onOpenContent={id=>{setFocused(id);go('knowledge')}} onRetryContent={()=>{}} onRetryHealthHistory={()=>setHistoryError(false)}/>:null}
 {page==='log'?<LogScreen mode="cloud" events={empty?[]:events} mutation={mutation} loading={state==='loading'} loadError={state==='error'} onReload={()=>{}} onAdd={addLog} onRetry={retryLog} onCancel={cancelLog} onUpdate={updateLog} onDelete={id=>setEvents(rows=>rows.filter(event=>event.id!==id))} onUndo={undoLog} onQuickDetailsSettled={id=>setMutation(current=>current?.kind==='add'&&current.id===id?{...current,detailsHandled:true}:current)}/>:null}
 {page==='health'?<HealthScreen onBack={()=>go('more')} records={empty?[]:weights} loadState="ready" historyRecords={records} historyLoadState={historyError?'error':state==='empty'?'ready':state} plannedRecords={empty?[]:plans} plannedLoadState={state==='empty'?'ready':state} onRetryHistory={()=>setHistoryError(false)} onSave={async()=>true} onSaveHistory={async()=>true} onOpenPlannedHealth={()=>go('planned')}/>:null}
 {page==='planned'?<PlannedHealthScreen onBack={()=>go('health')} records={empty?[]:plans} loadState={state==='empty'?'ready':state} onRetry={()=>{}} onResolveConflict={()=>{}} onSave={async(id,type,dueOn,note,reminderEnabled,reminderMinutes,dueTime)=>{setPlans(rows=>id?rows.map(row=>row.id===id?{...row,due_on:dueOn,due_time:dueTime,description:note,reminder_enabled:reminderEnabled,reminder_minutes:reminderMinutes}:row):[{id:'new-plan',dog_id:dog.id,event_type:type,due_on:dueOn,due_time:dueTime,description:note,reminder_enabled:reminderEnabled,reminder_minutes:reminderMinutes,created_at:today},...rows]);return true;}} onDelete={async id=>{setPlans(rows=>rows.filter(row=>row.id!==id));return true;}}/>:null}
 {page==='knowledge'?<KnowledgeScreen items={empty?[]:content} contentState={state==='empty'?'ready':state} focusedContentId={focused} onSelectContent={setFocused} onBack={()=>{setFocused(null);go('more')}}/>:null}
 {page==='training'?<PublishedTrainingScreen programs={empty?[]:[program]} paused={[]} error={state==='error'?'Programmet kunde inte hämtas':''} busyStepKey={null} onCompleteStep={async(p,id)=>{setProgram({...program,completedStepIds:[...program.completedStepIds,id]});return true;}} onContinue={()=>{}} onResetProgram={()=>setProgram({...program,completedStepIds:[]})} onRetry={()=>{}}/>:null}
 {page==='passport'?<PassportScreen client={client} dog={dog} weights={weights} history={history} weightLoadState="ready" historyLoadState="ready" onBack={()=>go('more')}/>:null}
 {page==='more'?<><AppBar mode="Title" title="Mer"/><ListRow category="training" title="Kunskap" onPress={()=>{setFocused(null);go('knowledge')}}/><ListRow category="veterinary" title="Tassla-pass" onPress={()=>go('passport')}/></>:null}
 </ScreenTransition></AppScreen>
}
createRoot(document.getElementById('root')).render(<App/>);
