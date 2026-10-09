import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppScreen} from '../../src/components/AppPrimitives';
import {BottomNav, ListRow, AppBar} from '../../src/components/ui';
import {ScreenTransition} from '../../src/components/ui/Motion';
import {HomeScreen} from '../../src/features/home/HomeScreen';
import {LogScreen} from '../../src/features/puppy-log/LogScreen';
import {HealthScreen} from '../../src/features/health/HealthScreen';
import {KnowledgeScreen} from '../../src/features/knowledge/KnowledgeScreen';
import {PublishedTrainingScreen} from '../../src/features/training/PublishedTrainingScreen';
import {PassportScreen} from '../../src/features/passport/PassportScreen';
const today=new Date().toISOString().slice(0,10);
const dog={id:'test-dog',name:'Luna',breed_id:'golden',birth_date:new Date(Date.now()-77*86400000).toISOString().slice(0,10)};
const initialEvents=['food','pee','poop','walk','sleep'].map((type,i)=>({id:'event-'+i,dogId:dog.id,type,occurredAt:today+'T'+['12:05','10:30','08:20','07:15','06:50'][i]+':00',note:['Åt allt',null,null,'20 minuter',null][i],origin:'owner'}));
const content=[{id:'guide1',title:'En trygg start hemma',body:'Så skapar du lugn, rutin och trygghet de första veckorna.\n\n## En plats att landa\n\nGör plats för valpens saker och låt vardagen ta form i er takt.\n\n- En egen sovplats\n- Tid tillsammans',contentType:'guide'},{id:'guide2',title:'Hantera din valp',body:'Lär känna varandra i lugn och ro.',contentType:'article'},{id:'guide3',title:'Inför hemkomsten',body:'En lista över vad du behöver förbereda.',contentType:'checklist'}].map(x=>({...x,version:1,contentId:x.id,sources:['Syntetiskt innehåll för UI-prov, inte publicerat råd.']}));
const history=[{id:'h1',dog_id:dog.id,event_type:'vaccination',occurred_on:'2026-09-28',description:'Vaccination valp 1'},{id:'h2',dog_id:dog.id,event_type:'vet_visit',occurred_on:'2026-09-12',description:'Första besöket'}];
const weights=[{id:'w1',dog_id:dog.id,occurred_on:'2026-10-07',weight_kg:5.2}];
const plan=[{id:'overdue',dog_id:dog.id,event_type:'vet_visit',due_on:new Date(Date.now()-86400000).toISOString().slice(0,10),description:'Uppföljning',reminder_enabled:false,reminder_minutes:null,created_at:today},{id:'p1',dog_id:dog.id,event_type:'vaccination',due_on:new Date(Date.now()+12*86400000).toISOString().slice(0,10),description:'Vaccination valp 2',reminder_enabled:false,reminder_minutes:null,created_at:today}];
const initialProgram={id:'t1',content_id:'t1',version:1,title:'Vecka 11',body:'Trygghet och vardagsliv.',sources:['Syntetiskt program för interaktionstest.'],completedStepIds:['s0'],steps:['Hantering (tassar, öron, mun)','Miljöträning – nya ljud','Ensamhet – korta stunder','Inkallning – grunder','Möte med andra hundar'].map((title,i)=>({id:'s'+i,position:i,title,instruction:'Testinstruktion för att kontrollera läsning och sparflöde. Inget publicerat träningsråd.'}))};
const client={from:()=>({select:()=>({order:()=>({abortSignal:async()=>({data:[{id:'golden',name:'Golden retriever'}],error:null})})})})};
function App(){
 const [page,setPage]=useState(new URLSearchParams(location.search).get('screen')||'home');
 const [events,setEvents]=useState(initialEvents);const [mutation,setMutation]=useState(null);const [program,setProgram]=useState(initialProgram);const [focused,setFocused]=useState(null);
 const state=new URLSearchParams(location.search).get('state')||'ready';
 const empty=state==='empty';const records=empty?[]:history;
 const main=['home','log','training','health'].includes(page)?page:'more';
 const go=(p)=>setPage(p==='profile'?'passport':p==='notification-settings'?'more':p==='planned-health'?'health':p);
 return <AppScreen scrollKey={page} footer={<BottomNav active={main} onChange={go}/>}><ScreenTransition transitionKey={page}>
 {page==='home'?<HomeScreen dog={dog} breed="Golden retriever" events={empty?[]:events} plans={empty?[]:plan} content={empty?[]:content} contentState={state==='empty'?'ready':state} logState={state==='empty'?'ready':state} planState={state==='empty'?'ready':state} nextStep="Hantering av tassar" onGo={go} onOpenContent={id=>{setFocused(id);go('knowledge')}} onRetryContent={()=>{}}/>:null}
 {page==='log'?<LogScreen mode="cloud" events={empty?[]:events} mutation={mutation} loading={state==='loading'} loadError={state==='error'} onReload={()=>{}} onAdd={type=>{const event={id:crypto.randomUUID(),dogId:dog.id,type,occurredAt:new Date().toISOString(),note:null,origin:'owner'};setEvents([event,...events]);setMutation({kind:'add',mutationId:event.id,...event,status:'saved'});}} onRetry={()=>{setMutation({...mutation,status:'saved'});return true;}} onCancel={()=>setMutation(null)} onUpdate={(id,changes)=>{if(new URLSearchParams(location.search).get('mutation')){setMutation({kind:'update',id,mutationId:id,type:'food',occurredAt:new Date().toISOString(),status:new URLSearchParams(location.search).get('mutation')});return false;}setEvents(events.map(e=>e.id===id?{...e,...changes}:e));return true;}} onDelete={id=>setEvents(events.filter(e=>e.id!==id))} onUndo={id=>{setEvents(events.filter(e=>e.id!==id));setMutation(null);}}/>:null}
 {page==='health'?<HealthScreen onBack={()=>go('more')} records={empty?[]:weights} loadState="ready" historyRecords={records} historyLoadState={state==='empty'?'ready':state} plannedRecords={empty?[]:plan} plannedLoadState={state==='empty'?'ready':state} onSave={async()=>true} onSaveHistory={async()=>true} onOpenPlannedHealth={()=>{}}/>:null}
 {page==='knowledge'?<KnowledgeScreen items={empty?[]:content} contentState={state==='empty'?'ready':state} focusedContentId={focused} onSelectContent={setFocused} onBack={()=>{setFocused(null);go('more')}}/>:null}
 {page==='training'?<PublishedTrainingScreen programs={empty?[]:[program]} paused={[]} error={state==='error'?'Programmet kunde inte hämtas':''} busyStepKey={null} onCompleteStep={async(p,id)=>{setProgram({...program,completedStepIds:[...program.completedStepIds,id]});return true;}} onContinue={()=>{}} onResetProgram={()=>setProgram({...program,completedStepIds:[]})} onRetry={()=>{}}/>:null}
 {page==='passport'?<PassportScreen client={client} dog={dog} weights={weights} history={history} weightLoadState="ready" historyLoadState="ready" onBack={()=>go('more')}/>:null}
 {page==='more'?<><AppBar mode="Title" title="Mer"/><ListRow category="training" title="Kunskap" onPress={()=>{setFocused(null);go('knowledge')}}/><ListRow category="veterinary" title="Tassla-pass" onPress={()=>go('passport')}/></>:null}
 </ScreenTransition></AppScreen>
}
createRoot(document.getElementById('root')).render(<App/>);
