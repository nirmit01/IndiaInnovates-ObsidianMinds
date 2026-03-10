import { useState, useEffect, useRef, useCallback } from "react";

/* ════════════════════════════════════════════════
   GLOBAL STYLES
════════════════════════════════════════════════ */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
.dark ::-webkit-scrollbar-thumb{background:#1e3a5f}
body{font-family:'Outfit',sans-serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideInRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideInLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes ripple{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastSlide{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
@keyframes newRow{0%{background:rgba(59,130,246,.15)}100%{background:transparent}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes progressFill{from{width:0}to{width:var(--target)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 20px currentColor}}
.fu{animation:fadeUp .38s ease both}
.fr{animation:slideInRight .35s ease both}
.fl{animation:slideInLeft .35s ease both}
.spin{animation:spin .7s linear infinite}
.pulse-dot{animation:pulse 1.2s infinite}
.shim{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
input,select,textarea{outline:none;font-family:'Outfit',sans-serif}
button{font-family:'Outfit',sans-serif;cursor:pointer}
`;

/* ════════════════════════════════════════════════
   SEED DATA
════════════════════════════════════════════════ */
const STATUS_STEPS = ["Submitted","Assigned","In Progress","Resolved"];
const STATUS_COLOR  = {Submitted:"#f59e0b",Assigned:"#3b82f6","In Progress":"#8b5cf6",Resolved:"#10b981"};
const STATUS_BG     = {Submitted:"#fef3c7",Assigned:"#dbeafe","In Progress":"#ede9fe",Resolved:"#d1fae5"};
const PRI_COLOR     = {High:"#ef4444",Medium:"#f59e0b",Low:"#22c55e"};
const PRI_BG        = {High:"#fee2e2",Medium:"#fef3c7",Low:"#dcfce7"};

const DEPT_MAP = {
  "Waste Management":"Sanitation Dept.",
  "Road Repair":"Public Works",
  "Water Supply":"Water Authority",
  "Electricity":"Power Dept.",
  "Parks & Rec":"Civic Works",
  "Drainage":"Sanitation Dept.",
};

const NLP_RULES = [
  {kw:["garbage","trash","waste","dump","litter","collection","bin"],cat:"Waste Management",pri:"Medium",icon:"🗑️"},
  {kw:["pothole","road","asphalt","pavement","crack","sign","tarmac"],cat:"Road Repair",pri:"High",icon:"🚧"},
  {kw:["water","pipe","leak","leakage","flood","drain","sewer"],cat:"Water Supply",pri:"High",icon:"💧"},
  {kw:["light","electricity","power","electric","lamp","traffic","streetlight"],cat:"Electricity",pri:"Low",icon:"💡"},
  {kw:["park","bench","tree","garden","grass","playground"],cat:"Parks & Rec",pri:"Low",icon:"🌳"},
  {kw:["drain","overflow","storm","clog","blocked"],cat:"Drainage",pri:"High",icon:"🌊"},
];

function classify(text){
  const lo=text.toLowerCase();
  for(const r of NLP_RULES) if(r.kw.some(k=>lo.includes(k))) return r;
  return {cat:"General Civic",pri:"Medium",icon:"🏛️"};
}

let _id=42;
function makeId(){return `CMP-${String(_id++).padStart(4,"0")}`;}

const SEED_COMPLAINTS = [
  {id:"CMP-0041",title:"Garbage not collected for 3 days",ward:"Ward 12",category:"Waste Management",dept:"Sanitation Dept.",priority:"Medium",status:"In Progress",ts:"2025-03-07 09:12",progress:60,citizen:"Rahul Sharma",phone:"9876543210"},
  {id:"CMP-0040",title:"Large pothole near school entrance",ward:"Ward 7",category:"Road Repair",dept:"Public Works",priority:"High",status:"Assigned",ts:"2025-03-07 08:45",progress:25,citizen:"Priya Singh",phone:"9988776655"},
  {id:"CMP-0039",title:"Street light out on Main Ave",ward:"Ward 3",category:"Electricity",dept:"Power Dept.",priority:"Low",status:"Resolved",ts:"2025-03-06 17:30",progress:100,citizen:"Amit Kumar",phone:"9123456789"},
  {id:"CMP-0038",title:"Water leakage from pipe junction",ward:"Ward 15",category:"Water Supply",dept:"Water Authority",priority:"High",status:"In Progress",ts:"2025-03-06 14:22",progress:70,citizen:"Sunita Patel",phone:"9654321098"},
  {id:"CMP-0037",title:"Broken park bench near playground",ward:"Ward 9",category:"Parks & Rec",dept:"Civic Works",priority:"Low",status:"Submitted",ts:"2025-03-06 11:05",progress:5,citizen:"Deepak Nair",phone:"9807654321"},
  {id:"CMP-0036",title:"Overflowing storm drain after rain",ward:"Ward 12",category:"Drainage",dept:"Sanitation Dept.",priority:"High",status:"Resolved",ts:"2025-03-05 20:00",progress:100,citizen:"Meera Joshi",phone:"9012345678"},
  {id:"CMP-0035",title:"Illegal dumping behind market",ward:"Ward 4",category:"Waste Management",dept:"Sanitation Dept.",priority:"Medium",status:"Assigned",ts:"2025-03-05 13:10",progress:20,citizen:"Vikram Das",phone:"9765432109"},
  {id:"CMP-0034",title:"Missing road sign at intersection",ward:"Ward 10",category:"Road Repair",dept:"Public Works",priority:"Medium",status:"In Progress",ts:"2025-03-04 10:00",progress:50,citizen:"Kavita Reddy",phone:"9543210987"},
];

const DEPT_PERF=[
  {name:"Sanitation Dept.", resolved:34,pending:8, avg:"2.1d",color:"#f59e0b"},
  {name:"Public Works",     resolved:21,pending:12,avg:"3.4d",color:"#3b82f6"},
  {name:"Water Authority",  resolved:17,pending:5, avg:"1.8d",color:"#06b6d4"},
  {name:"Power Dept.",      resolved:29,pending:3, avg:"0.9d",color:"#eab308"},
  {name:"Civic Works",      resolved:11,pending:7, avg:"4.2d",color:"#10b981"},
];

const WARDS=[
  {id:"W12",label:"Ward 12",x:265,y:130,count:18,top:"Waste"},
  {id:"W15",label:"Ward 15",x:375,y:195,count:14,top:"Water"},
  {id:"W7", label:"Ward 7", x:155,y:215,count:11,top:"Roads"},
  {id:"W10",label:"Ward 10",x:310,y:275,count:9, top:"Roads"},
  {id:"W4", label:"Ward 4", x:100,y:305,count:7, top:"Waste"},
  {id:"W3", label:"Ward 3", x:215,y:348,count:5, top:"Power"},
  {id:"W9", label:"Ward 9", x:435,y:318,count:4, top:"Parks"},
  {id:"W5", label:"Ward 5", x:465,y:148,count:3, top:"Drainage"},
];

const LIVE_POOL=[
  {ward:"Ward 6", title:"Stray dogs near bus stop",       category:"Waste Management",priority:"Medium"},
  {ward:"Ward 11",title:"Sewage overflow on Church St",   category:"Water Supply",    priority:"High"},
  {ward:"Ward 2", title:"Broken traffic light at square", category:"Electricity",     priority:"High"},
  {ward:"Ward 8", title:"Graffiti on public walls",       category:"Parks & Rec",     priority:"Low"},
  {ward:"Ward 14",title:"Tree fallen blocking main road", category:"Road Repair",     priority:"High"},
  {ward:"Ward 5", title:"Garbage bins full at park",      category:"Waste Management",priority:"Medium"},
];

/* ════════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════════ */
function Counter({target,dur=900,dec=0,pre="",suf=""}){
  const [v,setV]=useState(0);
  useEffect(()=>{
    let cur=0; const step=target/(dur/16);
    const t=setInterval(()=>{cur=Math.min(cur+step,target);setV(+cur.toFixed(dec));if(cur>=target)clearInterval(t);},16);
    return()=>clearInterval(t);
  },[target]);
  return <>{pre}{v.toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec})}{suf}</>;
}

function useToast(){
  const [list,set]=useState([]);
  const add=useCallback(t=>{const id=Date.now()+Math.random();set(p=>[...p,{id,...t}]);setTimeout(()=>set(p=>p.filter(x=>x.id!==id)),4200);},[]);
  return{list,add};
}

function Toasts({items}){
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10,pointerEvents:"none"}}>
      {items.map(t=>(
        <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"13px 18px",minWidth:280,boxShadow:"0 12px 48px rgba(0,0,0,.14)",borderLeft:`4px solid ${t.color||"#3b82f6"}`,animation:"toastSlide .35s ease",pointerEvents:"all"}}>
          <span style={{fontSize:20}}>{t.icon}</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{t.title}</div>
            {t.msg&&<div style={{fontSize:12,color:"#64748b",marginTop:2}}>{t.msg}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════════ */
export default function App(){
  const [view,setView]=useState(null); // null=landing | "public" | "admin"
  const [complaints,setComplaints]=useState(SEED_COMPLAINTS);
  const [liveFeed,setLiveFeed]=useState([]);
  const toast=useToast();

  useEffect(()=>{
    const t=setInterval(()=>{
      const item=LIVE_POOL[Math.floor(Math.random()*LIVE_POOL.length)];
      const id=makeId();
      const classified=classify(item.title);
      const entry={
        ...item,id,
        category:classified.cat,
        dept:DEPT_MAP[classified.cat]||"Municipal Corp.",
        priority:item.priority,
        status:"Submitted",
        ts:new Date().toLocaleTimeString(),
        progress:0,
        citizen:"Anonymous",
        _live:true,
      };
      setLiveFeed(p=>[entry,...p].slice(0,8));
      setComplaints(p=>[entry,...p]);
    },9000);
    return()=>clearInterval(t);
  },[]);

  const advanceStatus=useCallback((id)=>{
    setComplaints(prev=>prev.map(c=>{
      if(c.id!==id)return c;
      const idx=STATUS_STEPS.indexOf(c.status);
      if(idx>=STATUS_STEPS.length-1)return c;
      const next=STATUS_STEPS[idx+1];
      const prog=[5,25,65,100][idx+1];
      toast.add({title:"Status Updated",msg:`${c.id} → ${next}`,icon:"⚙️",color:STATUS_COLOR[next]});
      return{...c,status:next,progress:prog};
    }));
  },[toast]);

  const addComplaint=useCallback((c)=>{
    setComplaints(p=>[c,...p]);
    toast.add({title:"Complaint Submitted!",msg:`${c.id} → ${c.dept}`,icon:"✅",color:"#10b981"});
  },[toast]);

  if(!view) return <Landing onSelect={setView} toast={toast}/>;

  return(
    <div className={view==="admin"?"dark":""}>
      <style>{GLOBAL_CSS}</style>
      {view==="public"
        ? <PublicPortal complaints={complaints} addComplaint={addComplaint} toast={toast} onSwitch={()=>setView("admin")}/>
        : <AdminPortal complaints={complaints} setComplaints={setComplaints} advanceStatus={advanceStatus} liveFeed={liveFeed} toast={toast} onSwitch={()=>setView("public")}/>
      }
      <Toasts items={toast.list}/>
    </div>
  );
}

/* ════════════════════════════════════════════════
   LANDING
════════════════════════════════════════════════ */
function Landing({onSelect,toast}){
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#f0fdf4 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      {/* BG circles */}
      <div style={{position:"absolute",top:-120,right:-120,width:400,height:400,background:"radial-gradient(circle,rgba(59,130,246,.08),transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-80,left:-80,width:320,height:320,background:"radial-gradient(circle,rgba(16,185,129,.08),transparent 70%)",pointerEvents:"none"}}/>

      <div className="fu" style={{textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:16}}>
          <div style={{width:60,height:60,background:"linear-gradient(135deg,#2563eb,#3b82f6)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,boxShadow:"0 8px 32px rgba(37,99,235,.3)"}}>🏛️</div>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:36,fontWeight:900,color:"#0f172a",letterSpacing:"-1px",lineHeight:1}}>Smart PS-CRM</div>
            <div style={{fontSize:13,color:"#64748b",fontWeight:500,marginTop:2}}>Public Service Management Platform</div>
          </div>
        </div>

        <p style={{color:"#94a3b8",fontSize:15,marginBottom:52,fontWeight:400}}>AI-powered civic complaint management · Real-time tracking · Full transparency</p>

        <div style={{display:"flex",gap:24,justifyContent:"center"}}>
          {[
            {role:"public",  icon:"👤",label:"Citizen Portal",    sub:"Report issues, track your complaints in real time",   c1:"#2563eb",c2:"#3b82f6",bg:"#eff6ff",border:"#bfdbfe"},
            {role:"admin",   icon:"🛡️",label:"Admin Dashboard",   sub:"Manage complaints, advance statuses, view analytics", c1:"#059669",c2:"#10b981",bg:"#f0fdf4",border:"#a7f3d0"},
          ].map(r=>(
            <div key={r.role} onClick={()=>onSelect(r.role)}
              style={{background:"#fff",border:`1.5px solid ${r.border}`,borderRadius:24,padding:"36px 32px",width:260,cursor:"pointer",transition:"all .25s",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,.06)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow=`0 20px 60px rgba(0,0,0,.12)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,.06)";}}>
              <div style={{fontSize:48,marginBottom:16}}>{r.icon}</div>
              <div style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:8}}>{r.label}</div>
              <div style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:24}}>{r.sub}</div>
              <div style={{background:`linear-gradient(135deg,${r.c1},${r.c2})`,color:"#fff",borderRadius:12,padding:"11px",fontSize:14,fontWeight:700}}>Enter Portal →</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:40,justifyContent:"center",marginTop:52}}>
          {[["1,240+","Complaints Resolved"],["94%","Satisfaction Rate"],["2.4 days","Avg Resolution"],["15 Wards","Covered"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:"#2563eb"}}>{v}</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PUBLIC PORTAL
════════════════════════════════════════════════ */
function PublicPortal({complaints,addComplaint,toast,onSwitch}){
  const [tab,setTab]=useState("home");
  const [myComplaints,setMy]=useState(["CMP-0041","CMP-0038"]);

  const TABS=[
    {id:"home",  label:"Home",    icon:"🏠"},
    {id:"submit",label:"Report",  icon:"📝"},
    {id:"track", label:"Track",   icon:"📡"},
    {id:"status",label:"My Status",icon:"📋"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Outfit',sans-serif"}}>
      {/* TOPBAR */}
      <header style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 8px rgba(0,0,0,.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#2563eb,#3b82f6)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏛️</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",lineHeight:1}}>PS-CRM</div>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:500}}>Citizen Portal</div>
          </div>
        </div>
        <nav style={{display:"flex",gap:4}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"none",background:tab===t.id?"#eff6ff":"transparent",color:tab===t.id?"#2563eb":"#64748b",fontSize:13,fontWeight:tab===t.id?700:500,cursor:"pointer",transition:"all .15s"}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <button onClick={onSwitch} style={{display:"flex",alignItems:"center",gap:6,background:"#0f172a",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          🛡️ Admin View
        </button>
      </header>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"28px 20px"}}>
        {tab==="home"   && <PublicHome setTab={setTab} complaints={complaints} myComplaints={myComplaints}/>}
        {tab==="submit" && <PublicSubmit addComplaint={addComplaint} setMy={setMy} toast={toast}/>}
        {tab==="track"  && <PublicTrack complaints={complaints}/>}
        {tab==="status" && <PublicMyStatus complaints={complaints} myComplaints={myComplaints}/>}
      </main>
    </div>
  );
}

/* ── PUBLIC HOME ── */
function PublicHome({setTab,complaints,myComplaints}){
  const resolved=complaints.filter(c=>c.status==="Resolved").length;
  const active=complaints.filter(c=>c.status!=="Resolved").length;
  const mine=complaints.filter(c=>myComplaints.includes(c.id));

  return(
    <div className="fu">
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#1e40af 0%,#2563eb 50%,#3b82f6 100%)",borderRadius:24,padding:"44px 40px",marginBottom:24,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:280,height:280,background:"rgba(255,255,255,.06)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,right:80,width:180,height:180,background:"rgba(255,255,255,.04)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.15)",borderRadius:20,padding:"5px 16px",marginBottom:18}}>
            <div style={{width:7,height:7,background:"#4ade80",borderRadius:"50%"}} className="pulse-dot"/>
            <span style={{fontSize:12,color:"#fff",fontWeight:600}}>AI-Powered Civic Management</span>
          </div>
          <h1 style={{fontSize:38,fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:14,letterSpacing:"-1px"}}>
            Report Civic Issues,<br/>Track Real-Time Resolution
          </h1>
          <p style={{color:"rgba(255,255,255,.75)",fontSize:15,lineHeight:1.7,maxWidth:480,marginBottom:28}}>
            AI classifies your complaint instantly and routes it to the right department. Stay updated every step of the way.
          </p>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>setTab("submit")} style={{background:"#fff",color:"#2563eb",border:"none",borderRadius:12,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              + Report an Issue
            </button>
            <button onClick={()=>setTab("track")} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:12,padding:"12px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
              Track Complaint
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[
          {icon:"📋",label:"Total Complaints",val:complaints.length,color:"#3b82f6",bg:"#eff6ff"},
          {icon:"✅",label:"Resolved",val:resolved,color:"#10b981",bg:"#f0fdf4"},
          {icon:"⚙️",label:"Active Cases",val:active,color:"#8b5cf6",bg:"#f5f3ff"},
          {icon:"⏱️",label:"Avg Resolution",val:"2.4d",color:"#f59e0b",bg:"#fffbeb",raw:true},
        ].map(s=>(
          <div key={s.label} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
            <div style={{width:40,height:40,background:s.bg,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:12}}>{s.icon}</div>
            <div style={{fontSize:28,fontWeight:800,color:s.color}}>
              {s.raw?s.val:<Counter target={s.val}/>}
            </div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:4,fontWeight:500}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>
        {/* My Complaints */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>My Recent Complaints</h3>
            <button onClick={()=>setTab("status")} style={{background:"none",border:"none",color:"#2563eb",fontSize:12,fontWeight:600,cursor:"pointer"}}>View All →</button>
          </div>
          {mine.length===0?(
            <div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8",fontSize:14}}>No complaints yet.<br/>Report your first issue!</div>
          ):mine.map(c=>(
            <ComplaintRow key={c.id} c={c} onClick={()=>setTab("track")}/>
          ))}
        </div>

        {/* How it works */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:18}}>How It Works</h3>
          {[
            {n:1,icon:"📝",t:"Submit Issue",d:"Describe your civic problem"},
            {n:2,icon:"🤖",t:"AI Classifies",d:"Auto-routed to the right dept."},
            {n:3,icon:"⚙️",t:"Team Assigned",d:"Department starts working"},
            {n:4,icon:"✅",t:"Issue Resolved",d:"You're notified on completion"},
          ].map((s,i)=>(
            <div key={s.n} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:i<3?16:0}}>
              <div style={{width:36,height:36,background:"#eff6ff",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{s.t}</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{s.d}</div>
              </div>
              {i<3&&<div style={{width:2,height:20,background:"#e2e8f0",position:"absolute",marginLeft:17,marginTop:36}}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── COMPLAINT ROW ── */
function ComplaintRow({c,onClick,adminMode,onAdvance}){
  const s=STATUS_COLOR[c.status], bg=STATUS_BG[c.status];
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0",marginBottom:8,cursor:"pointer",transition:"all .15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#bfdbfe";e.currentTarget.style.background="#eff6ff";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#f8fafc";}}>
      <div style={{width:10,height:10,background:s,borderRadius:"50%",flexShrink:0,boxShadow:`0 0 6px ${s}`}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{c.id} · {c.ward}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {adminMode&&c.status!=="Resolved"&&(
          <button onClick={e=>{e.stopPropagation();onAdvance(c.id);}}
            style={{display:"flex",alignItems:"center",gap:4,background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700}}>
            ▶ Advance
          </button>
        )}
        <span style={{fontSize:11,fontWeight:700,background:bg,color:s,padding:"3px 10px",borderRadius:20}}>{c.status}</span>
      </div>
    </div>
  );
}

/* ── PUBLIC SUBMIT ── */
function PublicSubmit({addComplaint,setMy,toast}){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({title:"",desc:"",ward:"",name:"",phone:""});
  const [nlp,setNlp]=useState(null);
  const [loading,setLoading]=useState(false);
  const [doneId,setDoneId]=useState("");
  const deb=useRef(null);

  const onDesc=v=>{
    setForm(f=>({...f,desc:v}));
    clearTimeout(deb.current);
    if(v.length>8){setLoading(true);setNlp(null);deb.current=setTimeout(()=>{setNlp(classify(v));setLoading(false);},700);}
    else{setNlp(null);setLoading(false);}
  };

  const submit=()=>{
    const r=nlp||classify(form.desc);
    const id=makeId();
    const c={id,title:form.title||form.desc.slice(0,55),ward:form.ward,category:r.cat,dept:DEPT_MAP[r.cat]||"Municipal Corp.",priority:r.pri,status:"Submitted",ts:new Date().toISOString().slice(0,16).replace("T"," "),progress:0,citizen:form.name||"Anonymous",phone:form.phone||"—"};
    addComplaint(c);
    setMy(p=>[...p,id]);
    setDoneId(id);
    setStep(2);
  };

  if(step===2) return(
    <div className="fu" style={{maxWidth:480,margin:"60px auto",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>✅</div>
      <h2 style={{fontSize:26,fontWeight:900,color:"#10b981",marginBottom:8}}>Complaint Registered!</h2>
      <p style={{color:"#64748b",marginBottom:20}}>AI has classified and routed your issue to the right department.</p>
      <div style={{background:"#f0fdf4",border:"1px solid #a7f3d0",borderRadius:14,padding:"16px 28px",display:"inline-block",marginBottom:28}}>
        <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>COMPLAINT ID</div>
        <div style={{fontSize:22,fontWeight:800,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{doneId}</div>
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center"}}>
        <button onClick={()=>{setStep(0);setForm({title:"",desc:"",ward:"",name:"",phone:""});setNlp(null);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Submit Another</button>
        <button onClick={()=>navigator.clipboard?.writeText(doneId)} style={{background:"#f1f5f9",color:"#64748b",border:"1px solid #e2e8f0",borderRadius:10,padding:"11px 24px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Copy ID</button>
      </div>
    </div>
  );

  if(step===1){
    const r=nlp||classify(form.desc);
    return(
      <div className="fu" style={{maxWidth:560,margin:"0 auto"}}>
        <button onClick={()=>setStep(0)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:18,display:"flex",alignItems:"center",gap:6}}>← Edit Details</button>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:28,boxShadow:"0 2px 16px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:22}}>Review Your Complaint</h2>
          {[{k:"Title",v:form.title||form.desc.slice(0,55)},{k:"Ward",v:form.ward},{k:"Contact",v:form.name||"Anonymous"}].map(x=>(
            <div key={x.k} style={{display:"flex",gap:12,padding:"11px 14px",background:"#f8fafc",borderRadius:10,marginBottom:10}}>
              <div style={{width:70,fontSize:11,color:"#94a3b8",fontWeight:700,paddingTop:2}}>{x.k.toUpperCase()}</div>
              <div style={{fontSize:13,color:"#0f172a",fontWeight:500}}>{x.v}</div>
            </div>
          ))}
          <div style={{padding:"11px 14px",background:"#f8fafc",borderRadius:10,marginBottom:20}}>
            <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,marginBottom:6}}>DESCRIPTION</div>
            <div style={{fontSize:13,color:"#475569",lineHeight:1.6}}>{form.desc}</div>
          </div>
          <div style={{background:`${STATUS_BG.Submitted}`,border:`1px solid ${STATUS_COLOR.Submitted}30`,borderRadius:12,padding:"14px 18px",marginBottom:20}}>
            <div style={{fontSize:11,color:"#92400e",fontWeight:700,marginBottom:8}}>🤖 AI CLASSIFICATION</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[{k:"Category",v:`${r.icon} ${r.cat}`},{k:"Department",v:DEPT_MAP[r.cat]||"Municipal Corp."},{k:"Priority",v:r.pri}].map(x=>(
                <div key={x.k}><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>{x.k}</div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{x.v}</div></div>
              ))}
            </div>
          </div>
          <button onClick={submit} style={{width:"100%",background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Confirm & Submit →</button>
        </div>
      </div>
    );
  }

  return(
    <div className="fu" style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:22,alignItems:"start"}}>
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:28,boxShadow:"0 2px 16px rgba(0,0,0,.06)"}}>
        {/* Steps */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          {["Details","Review","Done"].map((s,i)=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:i===0?"#2563eb":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:i===0?"#fff":"#94a3b8",fontWeight:700}}>{i+1}</div>
              <span style={{fontSize:12,fontWeight:i===0?700:400,color:i===0?"#0f172a":"#94a3b8"}}>{s}</span>
              {i<2&&<div style={{width:24,height:1,background:"#e2e8f0"}}/>}
            </div>
          ))}
        </div>
        <h2 style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:22}}>Report a Civic Issue</h2>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6}}>ISSUE TITLE</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Short, clear title..." style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#0f172a",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6}}>DESCRIPTION <span style={{color:"#ef4444"}}>*</span></label>
            <textarea value={form.desc} onChange={e=>onDesc(e.target.value)} rows={4} placeholder="Describe the issue — AI will auto-classify it..." style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#0f172a",resize:"vertical",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6}}>WARD <span style={{color:"#ef4444"}}>*</span></label>
              <select value={form.ward} onChange={e=>setForm(f=>({...f,ward:e.target.value}))} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#0f172a",background:"#fff"}}>
                <option value="">Select ward...</option>
                {Array.from({length:15},(_,i)=><option key={i+1}>Ward {i+1}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6}}>YOUR NAME</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Optional" style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#0f172a"}}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6}}>PHONE / EMAIL</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="For status updates (optional)" style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#0f172a"}}/>
          </div>
          <button onClick={()=>setStep(1)} disabled={!form.desc||!form.ward} style={{background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:(!form.desc||!form.ward)?"not-allowed":"pointer",opacity:(!form.desc||!form.ward)?.45:1,marginTop:4}}>
            Continue to Review →
          </button>
        </div>
      </div>

      {/* AI Panel */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:28,height:28,background:"#f0f9ff",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
            <span style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>AI ANALYSIS ENGINE</span>
          </div>
          {!form.desc||form.desc.length<=8?(
            <div style={{textAlign:"center",padding:"24px 0",color:"#cbd5e1"}}>
              <div style={{fontSize:36,marginBottom:8}}>🧠</div>
              <p style={{fontSize:13}}>Start typing to see live classification</p>
            </div>
          ):loading?(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                <div className="spin" style={{width:14,height:14,border:"2px solid #3b82f6",borderTop:"2px solid transparent",borderRadius:"50%"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#3b82f6"}}>Analyzing...</span>
              </div>
              {["Category","Department","Priority"].map(l=>(
                <div key={l} style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:5}}>{l}</div>
                  <div className="shim" style={{height:28,borderRadius:8}}/>
                </div>
              ))}
            </div>
          ):nlp?(
            <div className="fu">
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                <div style={{width:8,height:8,background:"#10b981",borderRadius:"50%"}} className="pulse-dot"/>
                <span style={{fontSize:11,fontWeight:700,color:"#10b981"}}>CLASSIFIED</span>
              </div>
              {[{l:"Category",v:`${nlp.icon} ${nlp.cat}`,c:"#2563eb"},{l:"Department",v:DEPT_MAP[nlp.cat]||"Municipal Corp.",c:"#8b5cf6"},{l:"Priority",v:nlp.pri,c:PRI_COLOR[nlp.pri]}].map(x=>(
                <div key={x.l} style={{marginBottom:10,padding:"10px 12px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>{x.l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:x.c}}>{x.v}</div>
                </div>
              ))}
              <div style={{background:"#f0fdf4",border:"1px solid #a7f3d0",borderRadius:10,padding:"10px 12px",marginTop:4}}>
                <div style={{fontSize:10,color:"#059669",fontWeight:700,marginBottom:2}}>✓ AUTO-ROUTING READY</div>
                <div style={{fontSize:12,color:"#64748b"}}>Will dispatch upon submission</div>
              </div>
            </div>
          ):null}
        </div>
        {/* Quick examples */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:12}}>QUICK EXAMPLES</div>
          {["Garbage not collected for 3 days","Large pothole near school","Water pipe leaking at market","Street light broken on Main Ave"].map(ex=>(
            <button key={ex} onClick={()=>onDesc(ex)} style={{display:"block",width:"100%",textAlign:"left",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",marginBottom:6,color:"#64748b",fontSize:12,cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#3b82f6";e.currentTarget.style.color="#2563eb";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#64748b";}}>
              "{ex}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PUBLIC TRACK ── */
function PublicTrack({complaints}){
  const [q,setQ]=useState("");
  const [exp,setExp]=useState(null);
  const filtered=complaints.filter(c=>c.id.toLowerCase().includes(q.toLowerCase())||c.title.toLowerCase().includes(q.toLowerCase())||c.ward.toLowerCase().includes(q.toLowerCase()));
  return(
    <div className="fu">
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>Track Complaints</h2>
        <p style={{color:"#94a3b8",fontSize:13,marginTop:4}}>Search by complaint ID, title or ward</p>
      </div>
      <div style={{position:"relative",marginBottom:20}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16}}>🔍</span>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search complaints..." style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"12px 14px 12px 42px",fontSize:14,color:"#0f172a",background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,.04)"}} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map((c,i)=>{
          const isExp=exp===c.id;
          return(
            <div key={c.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.04)",animation:`fadeUp .3s ease ${i*30}ms both`}}>
              <div onClick={()=>setExp(isExp?null:c.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",cursor:"pointer",transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <div style={{width:10,height:10,background:STATUS_COLOR[c.status],borderRadius:"50%",flexShrink:0,boxShadow:`0 0 8px ${STATUS_COLOR[c.status]}`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{c.id}</span>
                    <span style={{fontSize:11,color:"#cbd5e1"}}>·</span>
                    <span style={{fontSize:11,color:"#94a3b8"}}>{c.ward}</span>
                  </div>
                  <div style={{fontSize:14,fontWeight:600,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:700,background:STATUS_BG[c.status],color:STATUS_COLOR[c.status],padding:"3px 10px",borderRadius:20}}>{c.status}</span>
                  <span style={{color:"#cbd5e1",transition:"transform .2s",display:"inline-block",transform:isExp?"rotate(180deg)":"none"}}>▾</span>
                </div>
              </div>
              {isExp&&(
                <div className="fu" style={{borderTop:"1px solid #f1f5f9",padding:"16px 20px",background:"#f8fafc"}}>
                  <PipelineView status={c.status} progress={c.progress}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginTop:14}}>
                    {[{k:"Category",v:c.category},{k:"Department",v:c.dept},{k:"Priority",v:c.priority,col:PRI_COLOR[c.priority]},{k:"Submitted",v:c.ts.split(" ")[0]}].map(m=>(
                      <div key={m.k} style={{background:"#fff",borderRadius:10,padding:"10px 12px",border:"1px solid #e2e8f0"}}>
                        <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>{m.k}</div>
                        <div style={{fontSize:12,fontWeight:700,color:m.col||"#0f172a"}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8"}}>🔍 No results found</div>}
      </div>
    </div>
  );
}

/* ── PIPELINE VIEW ── */
function PipelineView({status,progress}){
  const idx=STATUS_STEPS.indexOf(status);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:12,color:"#64748b"}}>Resolution Progress</span>
        <span style={{fontSize:12,fontWeight:700,color:STATUS_COLOR[status],fontFamily:"monospace"}}>{progress}%</span>
      </div>
      <div style={{height:6,background:"#e2e8f0",borderRadius:3,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${progress}%`,background:progress===100?"#10b981":"linear-gradient(90deg,#3b82f6,#8b5cf6)",borderRadius:3,transition:"width 1s ease"}}/>
      </div>
      <div style={{display:"flex",alignItems:"center"}}>
        {STATUS_STEPS.map((s,i)=>{
          const done=i<=idx,active=i===idx;
          return(
            <div key={s} style={{display:"flex",alignItems:"center",flex:i<STATUS_STEPS.length-1?1:"initial"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:done?STATUS_COLOR[s]:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:done?"#fff":"#94a3b8",fontWeight:700,border:active?`2.5px solid ${STATUS_COLOR[s]}`:"2.5px solid transparent",boxShadow:active?`0 0 12px ${STATUS_COLOR[s]}60`:"none",transition:"all .3s"}}>
                  {done&&!active?"✓":i+1}
                </div>
                <div style={{fontSize:9,fontWeight:active?700:400,color:done?"#475569":"#cbd5e1",whiteSpace:"nowrap"}}>{s}</div>
              </div>
              {i<STATUS_STEPS.length-1&&(
                <div style={{flex:1,height:2,background:i<idx?"#3b82f6":"#e2e8f0",margin:"0 4px",marginBottom:18,borderRadius:1,transition:"background .5s"}}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── PUBLIC MY STATUS ── */
function PublicMyStatus({complaints,myComplaints}){
  const mine=complaints.filter(c=>myComplaints.includes(c.id));
  const [exp,setExp]=useState(null);
  return(
    <div className="fu">
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>My Complaints</h2>
        <p style={{color:"#94a3b8",fontSize:13,marginTop:4}}>{mine.length} complaint{mine.length!==1?"s":""} submitted by you</p>
      </div>
      {mine.length===0?(
        <div style={{textAlign:"center",padding:"60px 0",color:"#94a3b8"}}>
          <div style={{fontSize:48,marginBottom:12}}>📋</div>
          <p style={{fontSize:16,fontWeight:600}}>No complaints yet</p>
        </div>
      ):mine.map(c=>{
        const isExp=exp===c.id;
        return(
          <div key={c.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
            <div onClick={()=>setExp(isExp?null:c.id)} style={{display:"flex",gap:14,padding:"18px 20px",cursor:"pointer"}}>
              <div style={{width:48,height:48,background:STATUS_BG[c.status],borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {c.category==="Waste Management"?"🗑️":c.category==="Road Repair"?"🚧":c.category==="Water Supply"?"💧":c.category==="Electricity"?"💡":"🏛️"}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:4}}>{c.title}</div>
                    <div style={{fontSize:12,color:"#94a3b8"}}>{c.id} · {c.ward} · {c.ts.split(" ")[0]}</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,background:STATUS_BG[c.status],color:STATUS_COLOR[c.status],padding:"4px 12px",borderRadius:20,flexShrink:0}}>{c.status}</span>
                </div>
              </div>
            </div>
            {isExp&&(
              <div className="fu" style={{padding:"0 20px 20px",borderTop:"1px solid #f1f5f9"}}>
                <PipelineView status={c.status} progress={c.progress}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════
   ADMIN PORTAL
════════════════════════════════════════════════ */
function AdminPortal({complaints,setComplaints,advanceStatus,liveFeed,toast,onSwitch}){
  const [tab,setTab]=useState("dashboard");

  const TABS=[
    {id:"dashboard", label:"Dashboard",   icon:"📊"},
    {id:"complaints",label:"Complaints",  icon:"📋"},
    {id:"heatmap",   label:"Heatmap",     icon:"🗺️"},
    {id:"analytics", label:"Analytics",   icon:"📈"},
  ];

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#080f1c",fontFamily:"'Outfit',sans-serif",color:"#e2e8f0"}}>
      {/* SIDEBAR */}
      <aside style={{width:220,background:"#050b15",borderRight:"1px solid #1a2d45",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid #1a2d45"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#059669,#10b981)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛡️</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#e2e8f0",lineHeight:1}}>PS-CRM</div>
              <div style={{fontSize:9,color:"#334155",letterSpacing:"2px",marginTop:1}}>ADMIN PANEL</div>
            </div>
          </div>
        </div>
        <div style={{padding:"12px 10px",borderBottom:"1px solid #1a2d45"}}>
          <div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,background:"linear-gradient(135deg,#059669,#10b981)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>A</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>Admin User</div>
              <div style={{fontSize:10,color:"#10b981",letterSpacing:".5px"}}>ADMINISTRATOR</div>
            </div>
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:4}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",background:tab===t.id?"rgba(16,185,129,.12)":"transparent",color:tab===t.id?"#e2e8f0":"#64748b",fontSize:13,fontWeight:tab===t.id?700:400,cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}
              onMouseEnter={e=>tab!==t.id&&(e.currentTarget.style.background="#1a2d45")}
              onMouseLeave={e=>tab!==t.id&&(e.currentTarget.style.background="transparent")}>
              {tab===t.id&&<div style={{width:3,height:16,background:"#10b981",borderRadius:2,marginLeft:-4}}/>}
              <span style={{fontSize:16}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 10px",borderTop:"1px solid #1a2d45"}}>
          {liveFeed.length>0&&(
            <div style={{display:"flex",alignItems:"center",gap:7,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"8px 12px",marginBottom:10}}>
              <div style={{width:7,height:7,background:"#ef4444",borderRadius:"50%"}} className="pulse-dot"/>
              <span style={{fontSize:11,color:"#f87171",fontWeight:700}}>LIVE</span>
              <span style={{fontSize:11,color:"#64748b"}}>{liveFeed.length} incoming</span>
            </div>
          )}
          <button onClick={onSwitch} style={{width:"100%",background:"transparent",border:"1px solid #1a2d45",color:"#64748b",borderRadius:8,padding:"8px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#3b82f640";e.currentTarget.style.color="#60a5fa";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1a2d45";e.currentTarget.style.color="#64748b";}}>
            👤 Citizen View
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,overflow:"auto",padding:"28px 32px"}}>
        {tab==="dashboard"  && <AdminDashboard complaints={complaints} liveFeed={liveFeed} advanceStatus={advanceStatus} toast={toast}/>}
        {tab==="complaints" && <AdminComplaints complaints={complaints} advanceStatus={advanceStatus} toast={toast}/>}
        {tab==="heatmap"    && <AdminHeatmap complaints={complaints}/>}
        {tab==="analytics"  && <AdminAnalytics complaints={complaints}/>}
      </main>
    </div>
  );
}

/* ── ADMIN DASHBOARD ── */
function AdminDashboard({complaints,liveFeed,advanceStatus,toast}){
  const total=complaints.length;
  const resolved=complaints.filter(c=>c.status==="Resolved").length;
  const inprog=complaints.filter(c=>c.status==="In Progress").length;
  const pending=complaints.filter(c=>c.status==="Submitted"||c.status==="Assigned").length;
  const high=complaints.filter(c=>c.priority==="High"&&c.status!=="Resolved").length;

  return(
    <div className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#e2e8f0",letterSpacing:"-.5px"}}>Command Center</h1>
          <p style={{color:"#334155",fontSize:13,marginTop:4}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"7px 14px"}}>
          <div style={{width:8,height:8,background:"#10b981",borderRadius:"50%"}} className="pulse-dot"/>
          <span style={{fontSize:12,color:"#10b981",fontWeight:700}}>SYSTEM LIVE</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:24}}>
        {[
          {l:"Total",v:total,c:"#3b82f6",icon:"📋"},
          {l:"Resolved",v:resolved,c:"#10b981",icon:"✅"},
          {l:"In Progress",v:inprog,c:"#8b5cf6",icon:"⚙️"},
          {l:"Pending",v:pending,c:"#f59e0b",icon:"⏳"},
          {l:"High Priority",v:high,c:"#ef4444",icon:"🔴"},
        ].map((k,i)=>(
          <div key={k.l} style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:18,animation:`fadeUp .35s ease ${i*60}ms both`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:11,color:"#334155",fontWeight:600}}>{k.l}</span>
              <span style={{fontSize:18}}>{k.icon}</span>
            </div>
            <div style={{fontSize:30,fontWeight:800,color:k.c,fontFamily:"'JetBrains Mono',monospace"}}><Counter target={k.v} dur={500+i*80}/></div>
            <div style={{height:3,background:"#1a2d45",borderRadius:2,marginTop:12}}>
              <div style={{height:"100%",width:`${(k.v/total)*100}%`,background:k.c,borderRadius:2,transition:"width 1s ease"}}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>
        <div>
          {/* Recent Complaints with Advance */}
          <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:22,marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>Recent Complaints</h3>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#64748b"}}>
                <span>Admin Mode</span>
                <div style={{width:8,height:8,background:"#10b981",borderRadius:"50%"}} className="pulse-dot"/>
              </div>
            </div>
            {complaints.slice(0,6).map(c=>(
              <ComplaintRowAdmin key={c.id} c={c} onAdvance={advanceStatus}/>
            ))}
          </div>

          {/* Dept Performance */}
          <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:22}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:18}}>Department Performance</h3>
            {DEPT_PERF.map(d=>{
              const pct=Math.round(d.resolved/(d.resolved+d.pending)*100);
              return(
                <div key={d.name} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:13,color:"#94a3b8"}}>{d.name}</span>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <span style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>avg {d.avg}</span>
                      <span style={{fontSize:13,fontWeight:700,color:d.color,fontFamily:"monospace"}}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{height:6,background:"#1a2d45",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:d.color,borderRadius:3,transition:"width 1s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Feed */}
        <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
            <div style={{width:8,height:8,background:"#ef4444",borderRadius:"50%"}} className="pulse-dot"/>
            <h3 style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>Live Incoming</h3>
            <span style={{fontSize:10,color:"#ef4444",fontWeight:700,background:"rgba(239,68,68,.1)",padding:"2px 8px",borderRadius:10,letterSpacing:"1px"}}>REAL-TIME</span>
          </div>
          {liveFeed.length===0?(
            <div style={{textAlign:"center",padding:"32px 0",color:"#334155"}}>
              <div style={{fontSize:28,marginBottom:8}}>📡</div>
              <p style={{fontSize:13}}>New complaints arrive every ~9s</p>
            </div>
          ):liveFeed.map((f,i)=>(
            <div key={f.id+i} style={{marginBottom:8,padding:"10px 12px",background:"#060f1d",borderRadius:10,border:"1px solid #1a2d45",animation:"newRow 3s ease"}}>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.title}</div>
                  <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center"}}>
                    <span style={{fontSize:10,color:"#334155"}}>{f.ward}</span>
                    <span style={{fontSize:10,fontWeight:700,background:PRI_BG[f.priority]||"#fef3c7",color:PRI_COLOR[f.priority]||"#92400e",padding:"1px 7px",borderRadius:10}}>{f.priority}</span>
                  </div>
                </div>
                <span style={{fontSize:9,color:"#334155",flexShrink:0,marginTop:2}}>{f.ts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ADMIN COMPLAINT ROW ── */
function ComplaintRowAdmin({c,onAdvance}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:"#060f1d",borderRadius:10,border:"1px solid #1a2d45",marginBottom:8,transition:"border-color .15s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor="#1e3a5f"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="#1a2d45"}>
      <div style={{width:9,height:9,background:STATUS_COLOR[c.status],borderRadius:"50%",flexShrink:0,boxShadow:`0 0 6px ${STATUS_COLOR[c.status]}`}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
        <div style={{fontSize:11,color:"#334155",marginTop:2}}>{c.id} · {c.ward}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {c.status!=="Resolved"&&(
          <button onClick={()=>onAdvance(c.id)} style={{display:"flex",alignItems:"center",gap:4,background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"#fff",border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
            onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            ▶ Advance
          </button>
        )}
        <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:`${STATUS_COLOR[c.status]}18`,color:STATUS_COLOR[c.status]}}>{c.status}</span>
      </div>
    </div>
  );
}

/* ── ADMIN COMPLAINTS PAGE ── */
function AdminComplaints({complaints,advanceStatus,toast}){
  const [q,setQ]=useState("");
  const [statusF,setStatusF]=useState("All");
  const [priF,setPriF]=useState("All");
  const [exp,setExp]=useState(null);
  const [adminMode,setAdminMode]=useState(true);

  const list=complaints.filter(c=>{
    const qm=c.id.toLowerCase().includes(q.toLowerCase())||c.title.toLowerCase().includes(q.toLowerCase())||c.ward.toLowerCase().includes(q.toLowerCase());
    const sm=statusF==="All"||c.status===statusF;
    const pm=priF==="All"||c.priority===priF;
    return qm&&sm&&pm;
  });

  return(
    <div className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#e2e8f0",letterSpacing:"-.5px"}}>Complaint Management</h1>
          <p style={{color:"#334155",fontSize:13,marginTop:4}}>{list.length} complaints · Admin mode {adminMode?"ON":"OFF"}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:"#64748b"}}>Admin Mode</span>
          <div onClick={()=>{setAdminMode(a=>!a);toast.add({title:adminMode?"Admin mode OFF":"Admin mode ON",icon:adminMode?"🔒":"🔑",color:adminMode?"#64748b":"#f59e0b"});}}
            style={{width:46,height:26,background:adminMode?"#1d4ed8":"#1a2d45",borderRadius:13,cursor:"pointer",position:"relative",transition:"background .2s",border:`1px solid ${adminMode?"#3b82f640":"#1e2d45"}`}}>
            <div style={{position:"absolute",top:3,left:adminMode?24:3,width:18,height:18,background:adminMode?"#60a5fa":"#334155",borderRadius:"50%",transition:"left .2s"}}/>
          </div>
          {adminMode&&<span style={{fontSize:10,color:"#f59e0b",fontWeight:700,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",padding:"3px 10px",borderRadius:10}}>ADMIN</span>}
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 180px"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ID, title, ward..."
            style={{width:"100%",background:"#0b1626",border:"1px solid #1a2d45",borderRadius:10,padding:"9px 14px 9px 36px",color:"#e2e8f0",fontSize:13}} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#1a2d45"}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["All",...STATUS_STEPS].map(f=>(
            <button key={f} onClick={()=>setStatusF(f)}
              style={{background:statusF===f?`${STATUS_COLOR[f]||"#3b82f6"}18`:"transparent",border:`1px solid ${statusF===f?(STATUS_COLOR[f]||"#3b82f6"):"#1a2d45"}`,color:statusF===f?(STATUS_COLOR[f]||"#60a5fa"):"#64748b",borderRadius:8,padding:"7px 13px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
              {f}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          {["All","High","Medium","Low"].map(p=>(
            <button key={p} onClick={()=>setPriF(p)}
              style={{background:priF===p?`${PRI_COLOR[p]||"#3b82f6"}18`:"transparent",border:`1px solid ${priF===p?(PRI_COLOR[p]||"#3b82f6"):"#1a2d45"}`,color:priF===p?(PRI_COLOR[p]||"#60a5fa"):"#64748b",borderRadius:8,padding:"7px 13px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {list.map((c,i)=>{
          const isExp=exp===c.id;
          const idx=STATUS_STEPS.indexOf(c.status);
          return(
            <div key={c.id} style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,overflow:"hidden",animation:`fadeUp .3s ease ${i*30}ms both`}}>
              <div onClick={()=>setExp(isExp?null:c.id)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",cursor:"pointer",transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#0f1e33"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:10,height:10,background:STATUS_COLOR[c.status],borderRadius:"50%",flexShrink:0,boxShadow:`0 0 8px ${STATUS_COLOR[c.status]}`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:8,marginBottom:2,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#334155",fontFamily:"monospace"}}>{c.id}</span>
                    <span style={{fontSize:11,color:"#1e2d45"}}>·</span>
                    <span style={{fontSize:11,color:"#334155"}}>{c.ward}</span>
                    <span style={{fontSize:10,fontWeight:700,background:PRI_BG[c.priority],color:PRI_COLOR[c.priority],padding:"1px 8px",borderRadius:10}}>{c.priority}</span>
                  </div>
                  <div style={{fontSize:13.5,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  {adminMode&&c.status!=="Resolved"&&(
                    <button onClick={e=>{e.stopPropagation();advanceStatus(c.id);}}
                      style={{display:"flex",alignItems:"center",gap:4,background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                      ▶ Advance
                    </button>
                  )}
                  <span style={{fontSize:11,fontWeight:700,background:`${STATUS_COLOR[c.status]}18`,color:STATUS_COLOR[c.status],padding:"3px 10px",borderRadius:20}}>{c.status}</span>
                  <span style={{color:"#334155",display:"inline-block",transition:"transform .2s",transform:isExp?"rotate(180deg)":"none",fontSize:12}}>▾</span>
                </div>
              </div>

              {isExp&&(
                <div className="fu" style={{borderTop:"1px solid #1a2d45",padding:"18px 20px",background:"#060f1d"}}>
                  <PipelineView status={c.status} progress={c.progress}/>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:16}}>
                    {[{k:"Category",v:c.category},{k:"Department",v:c.dept},{k:"Citizen",v:c.citizen},{k:"Phone",v:c.phone}].map(m=>(
                      <div key={m.k} style={{background:"#0b1626",borderRadius:10,padding:"10px 12px",border:"1px solid #1a2d45"}}>
                        <div style={{fontSize:10,color:"#334155",marginBottom:3}}>{m.k}</div>
                        <div style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {list.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#334155",fontSize:14}}>No complaints found</div>}
      </div>
    </div>
  );
}

/* ── ADMIN HEATMAP ── */
function AdminHeatmap({complaints}){
  const [sel,setSel]=useState(null);
  const [hov,setHov]=useState(null);
  const maxC=Math.max(...WARDS.map(w=>w.count));

  function heatCol(n){
    const r=n/maxC;
    if(r>.8)return"#ef4444";if(r>.6)return"#f97316";if(r>.4)return"#f59e0b";if(r>.2)return"#3b82f6";return"#1d4ed8";
  }

  const selWard=WARDS.find(w=>w.id===sel);
  const selComps=selWard?complaints.filter(c=>c.ward===selWard.label):[];

  return(
    <div className="fu">
      <div style={{marginBottom:22}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#e2e8f0",letterSpacing:"-.5px"}}>Geographic Heatmap</h1>
        <p style={{color:"#334155",fontSize:13,marginTop:4}}>Click a ward bubble to drill into complaints · Hover for quick stats</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
        {/* MAP */}
        <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:16,padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:"1px"}}>CITY WARD MAP</span>
            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:"#334155"}}>
              <div style={{width:60,height:5,borderRadius:3,background:"linear-gradient(90deg,#1d4ed8,#f59e0b,#ef4444)"}}/>
              <span>Low → High</span>
            </div>
          </div>
          <svg viewBox="0 0 560 400" style={{width:"100%",height:"auto",background:"#060f1d",borderRadius:12,border:"1px solid #1a2d45"}}>
            {[80,160,240,320,400,480].map(x=><line key={x} x1={x} y1={0} x2={x} y2={400} stroke="#0a1525" strokeWidth="1"/>)}
            {[80,160,240,320].map(y=><line key={y} x1={0} y1={y} x2={560} y2={y} stroke="#0a1525" strokeWidth="1"/>)}

            {WARDS.map(w=>{
              const r=16+(w.count/maxC)*30;
              const col=heatCol(w.count);
              const isSel=sel===w.id,isHov=hov===w.id;
              const tx=w.x>400?w.x-145:w.x+20;
              const ty=w.y>300?w.y-65:w.y-30;
              return(
                <g key={w.id} onMouseEnter={()=>setHov(w.id)} onMouseLeave={()=>setHov(null)} onClick={()=>setSel(isSel?null:w.id)} style={{cursor:"pointer"}}>
                  <circle cx={w.x} cy={w.y} r={r+18} fill={col} opacity={.035+(w.count/maxC)*.06}/>
                  {(isSel||isHov)&&[0,1].map(k=>(
                    <circle key={k} cx={w.x} cy={w.y} r={r+8} fill="none" stroke={col} strokeWidth="1.5"
                      style={{animation:`ripple ${1.9+k*.5}s ${k*.45}s infinite ease-out`,transformOrigin:`${w.x}px ${w.y}px`}}/>
                  ))}
                  <circle cx={w.x} cy={w.y} r={r} fill={col} opacity={isSel?.92:isHov?.76:.56} stroke={isSel?"white":isHov?col:"none"} strokeWidth={isSel?2.5:1.5} style={{transition:"opacity .18s"}}/>
                  <text x={w.x} y={w.y-1} textAnchor="middle" fill="white" fontSize={isSel?14:11} fontWeight="800" fontFamily="monospace" style={{pointerEvents:"none"}}>{w.count}</text>
                  <text x={w.x} y={w.y+14} textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize={8.5} fontFamily="sans-serif" style={{pointerEvents:"none"}}>{w.label}</text>
                  {isHov&&!isSel&&(
                    <g style={{pointerEvents:"none"}}>
                      <rect x={tx} y={ty} width={130} height={56} rx={7} fill="#0e1628" stroke="#1a2d45" strokeWidth="1"/>
                      <text x={tx+10} y={ty+18} fill="#e2e8f0" fontSize={11} fontWeight="700" fontFamily="sans-serif">{w.label}</text>
                      <text x={tx+10} y={ty+33} fill="#64748b" fontSize={10} fontFamily="sans-serif">{w.count} complaints</text>
                      <text x={tx+10} y={ty+47} fill="#334155" fontSize={10} fontFamily="sans-serif">Top: {w.top}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* SIDE */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {selWard?(
            <div className="fr" style={{background:"#0b1626",border:`1px solid ${heatCol(selWard.count)}35`,borderRadius:14,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:20,fontWeight:800,color:heatCol(selWard.count)}}>{selWard.label}</div>
                  <div style={{fontSize:11,color:"#334155"}}>{selWard.count} total · Top: {selWard.top}</div>
                </div>
                <button onClick={()=>setSel(null)} style={{background:"#1a2d45",border:"none",borderRadius:8,padding:"5px 10px",color:"#64748b",cursor:"pointer",fontSize:12}}>✕</button>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"#334155",letterSpacing:"1px",marginBottom:10}}>LINKED COMPLAINTS</div>
              {selComps.length===0?(
                <p style={{fontSize:12,color:"#334155",fontStyle:"italic"}}>No complaints in current dataset.</p>
              ):selComps.map(c=>(
                <div key={c.id} style={{marginBottom:8,padding:"9px 12px",background:"#060f1d",borderRadius:9,border:"1px solid #1a2d45"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{c.title}</div>
                  <div style={{display:"flex",gap:5}}>
                    <span style={{fontSize:10,fontWeight:700,background:`${STATUS_COLOR[c.status]}18`,color:STATUS_COLOR[c.status],padding:"1px 7px",borderRadius:10}}>{c.status}</span>
                    <span style={{fontSize:10,fontWeight:700,background:PRI_BG[c.priority],color:PRI_COLOR[c.priority],padding:"1px 7px",borderRadius:10}}>{c.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          ):(
            <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"1px",marginBottom:14}}>WARD RANKINGS</div>
              {[...WARDS].sort((a,b)=>b.count-a.count).map((w,i)=>(
                <div key={w.id} onClick={()=>setSel(w.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",background:hov===w.id?"#0f1e33":"#060f1d",borderRadius:10,border:`1px solid ${sel===w.id?"#3b82f6":hov===w.id?"#1e3a5f":"#0e1628"}`,cursor:"pointer",transition:"all .15s",marginBottom:6}}
                  onMouseEnter={()=>setHov(w.id)} onMouseLeave={()=>setHov(null)}>
                  <span style={{fontSize:11,color:"#1e2d45",width:18,fontFamily:"monospace",fontWeight:700}}>#{i+1}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{w.label}</div>
                    <div style={{fontSize:10,color:"#334155"}}>{w.top}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:heatCol(w.count),fontFamily:"monospace"}}>{w.count}</div>
                    <div style={{height:3,background:"#1a2d45",borderRadius:2,width:36,marginTop:3}}>
                      <div style={{height:"100%",width:`${(w.count/maxC)*100}%`,background:heatCol(w.count),borderRadius:2}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alert zones */}
          <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:18}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"1px",marginBottom:12}}>🚨 ALERT ZONES</div>
            {WARDS.filter(w=>w.count>=10).map(w=>(
              <div key={w.id} onClick={()=>setSel(w.id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #0f1e33",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <div style={{width:8,height:8,background:"#ef4444",borderRadius:"50%",flexShrink:0}} className="pulse-dot"/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#fca5a5"}}>{w.label}</div>
                  <div style={{fontSize:11,color:"#334155"}}>{w.count} complaints · {w.top}</div>
                </div>
                <span style={{color:"#334155",fontSize:12}}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ADMIN ANALYTICS ── */
function AdminAnalytics({complaints}){
  const [activeDept,setActiveDept]=useState(null);
  const [hovBar,setHovBar]=useState(null);

  const list=activeDept?complaints.filter(c=>c.dept===activeDept):complaints;
  const total=list.length||1;
  const res=list.filter(c=>c.status==="Resolved").length;
  const inp=list.filter(c=>c.status==="In Progress").length;
  const asgn=list.filter(c=>c.status==="Assigned").length;
  const sub=list.filter(c=>c.status==="Submitted").length;
  const rate=Math.round(res/list.length*100)||0;

  const catMap={};
  list.forEach(c=>{catMap[c.category]=(catMap[c.category]||0)+1;});
  const cats=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const maxCat=cats[0]?.[1]||1;
  const COLORS=["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4"];

  return(
    <div className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#e2e8f0",letterSpacing:"-.5px"}}>Analytics Overview</h1>
          <p style={{color:"#334155",fontSize:13,marginTop:4}}>{activeDept?`Filtered: ${activeDept}`:"All departments · real-time"}</p>
        </div>
        {activeDept&&(
          <button onClick={()=>setActiveDept(null)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"1px solid #1a2d45",color:"#64748b",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            ↺ Clear Filter
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:22}}>
        {[{l:"Total",v:list.length,c:"#3b82f6"},{l:"Resolved",v:res,c:"#10b981"},{l:"In Progress",v:inp,c:"#8b5cf6"},{l:"Assigned",v:asgn,c:"#3b82f6"},{l:"Submitted",v:sub,c:"#f59e0b"},{l:"Rate",v:rate,c:"#10b981",suf:"%"}].map((k,i)=>(
          <div key={k.l} style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:12,padding:"14px 16px",textAlign:"center",animation:`fadeUp .3s ease ${i*45}ms both`}}>
            <div style={{fontSize:24,fontWeight:800,color:k.c,fontFamily:"'JetBrains Mono',monospace"}}><Counter target={k.v} dur={450+i*70}/>{k.suf||""}</div>
            <div style={{fontSize:10,color:"#334155",marginTop:3,fontWeight:600}}>{k.l}</div>
            <div style={{height:3,background:"#1a2d45",borderRadius:2,marginTop:8}}>
              <div style={{height:"100%",width:`${(k.v/total)*100}%`,background:k.c,borderRadius:2,transition:"width 1s ease"}}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        {/* Category bars */}
        <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:22}}>
          <div style={{fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:"1px",marginBottom:18}}>COMPLAINTS BY CATEGORY</div>
          {cats.map(([cat,count],i)=>(
            <div key={cat} style={{marginBottom:14}} onMouseEnter={()=>setHovBar(cat)} onMouseLeave={()=>setHovBar(null)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length]}}/>
                  <span style={{fontSize:13,color:hovBar===cat?"#e2e8f0":"#94a3b8",transition:"color .15s"}}>{cat}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:COLORS[i%COLORS.length],fontFamily:"monospace"}}>{count}</span>
              </div>
              <div style={{height:6,background:"#1a2d45",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(count/maxCat)*100}%`,background:COLORS[i%COLORS.length],borderRadius:3,boxShadow:hovBar===cat?`0 0 8px ${COLORS[i%COLORS.length]}`:"none",transition:"width 1s,box-shadow .2s"}}/>
              </div>
            </div>
          ))}
        </div>

        {/* Status donut */}
        <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:22}}>
          <div style={{fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:"1px",marginBottom:18}}>RESOLUTION OVERVIEW</div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <svg width={120} height={120} viewBox="0 0 120 120" style={{flexShrink:0}}>
              {(()=>{
                const segs=[{v:res,c:"#10b981"},{v:inp,c:"#8b5cf6"},{v:asgn,c:"#3b82f6"},{v:sub,c:"#f59e0b"}];
                const tot=segs.reduce((a,s)=>a+s.v,0)||1;
                let off=0;
                return segs.map((s,i)=>{
                  const angle=s.v/tot*283;
                  const el=<circle key={i} cx="60" cy="60" r="45" fill="none" stroke={s.c} strokeWidth="18" strokeDasharray={`${angle} ${283-angle}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" style={{transition:"stroke-dasharray .8s"}}/>;
                  off+=angle;return el;
                });
              })()}
              <text x="60" y="56" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">{rate}%</text>
              <text x="60" y="70" textAnchor="middle" fill="#334155" fontSize="9">RESOLVED</text>
            </svg>
            <div style={{flex:1}}>
              {[{l:"Resolved",v:res,c:"#10b981"},{l:"In Progress",v:inp,c:"#8b5cf6"},{l:"Assigned",v:asgn,c:"#3b82f6"},{l:"Submitted",v:sub,c:"#f59e0b"}].map(s=>(
                <div key={s.l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:8,height:8,borderRadius:2,background:s.c,flexShrink:0}}/>
                  <span style={{fontSize:12,color:"#64748b",flex:1}}>{s.l}</span>
                  <span style={{fontSize:13,fontWeight:700,color:s.c,fontFamily:"monospace"}}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dept cards — clickable filter */}
      <div style={{background:"#0b1626",border:"1px solid #1a2d45",borderRadius:14,padding:22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:"1px"}}>DEPARTMENT PERFORMANCE</div>
          <div style={{fontSize:11,color:"#334155"}}>Click to filter all charts ↑</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          {DEPT_PERF.map(d=>{
            const pct=Math.round(d.resolved/(d.resolved+d.pending)*100);
            const isOn=activeDept===d.name;
            return(
              <div key={d.name} onClick={()=>setActiveDept(isOn?null:d.name)}
                style={{background:"#060f1d",borderRadius:12,padding:"16px 14px",border:`1.5px solid ${isOn?d.color:"#1a2d45"}`,cursor:"pointer",transition:"all .2s",transform:isOn?"scale(1.04)":"scale(1)",boxShadow:isOn?`0 0 20px ${d.color}20`:"none"}}
                onMouseEnter={e=>{if(!isOn){e.currentTarget.style.borderColor="#1e3a5f";e.currentTarget.style.transform="scale(1.02)";}}}
                onMouseLeave={e=>{if(!isOn){e.currentTarget.style.borderColor="#1a2d45";e.currentTarget.style.transform="scale(1)";}}} >
                <div style={{fontSize:12,fontWeight:700,color:isOn?d.color:"#e2e8f0",marginBottom:10}}>{d.name}</div>
                <svg width={60} height={60} viewBox="0 0 60 60" style={{display:"block",margin:"0 auto 10px"}}>
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#1a2d45" strokeWidth="9"/>
                  <circle cx="30" cy="30" r="22" fill="none" stroke={d.color} strokeWidth="9"
                    strokeDasharray={`${pct*1.38} 138`} strokeDashoffset="34.5"
                    transform="rotate(-90 30 30)" style={{transition:"stroke-dasharray .8s"}}/>
                  <text x="30" y="35" textAnchor="middle" fill={d.color} fontSize="13" fontWeight="700">{pct}%</text>
                </svg>
                <div style={{fontSize:10,color:"#334155",textAlign:"center"}}>{d.resolved} resolved · {d.pending} pending</div>
                <div style={{fontSize:10,color:"#1e2d45",textAlign:"center",marginTop:2}}>Avg {d.avg}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
