const API="https://script.google.com/macros/s/AKfycbxHtxKgKlw8bfGHWmeLsBTl7fFIRLSTHLPjSmjfS1S7WIF4puoIzGKOdnw8HBHRHdCN/exec";

const PARENT_TOKEN_KEY="afisap_parent_session_token_v2";
function parentToken(){try{return sessionStorage.getItem(PARENT_TOKEN_KEY)||""}catch(e){return""}}
function setParentToken(v){try{v?sessionStorage.setItem(PARENT_TOKEN_KEY,String(v)):sessionStorage.removeItem(PARENT_TOKEN_KEY)}catch(e){}}
async function securePost(body){
 const r=await fetch(API,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},body:JSON.stringify(body||{}),cache:"no-store",credentials:"omit"});
 if(!r.ok)throw new Error("School data request failed ("+r.status+").");
 const text=await r.text();try{return JSON.parse(text)}catch(e){throw new Error("School data returned an unreadable response.")}
}

const state={school:{},announcements:[],classes:[],subjects:[],parentStudent:null,view:"home"};
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function api(params){return new Promise((resolve,reject)=>{const cb="afisapParent_"+Date.now()+"_"+Math.floor(Math.random()*1e6);const s=document.createElement("script");const q=new URLSearchParams({...params,action:"parentPortalGet",callback:cb});const timer=setTimeout(()=>done(new Error("School data request timed out.")),15000);function done(err,data){clearTimeout(timer);try{delete window[cb]}catch(e){}s.remove();err?reject(err):resolve(data)}window[cb]=d=>done(null,d);s.onerror=()=>done(new Error("Could not reach the school data service."));s.src=API+"?"+q;document.head.appendChild(s)})}
function fmtDate(v){const raw=String(v||"").trim();if(!raw)return "—";const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return raw;const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
function published(type){return state.announcements.filter(x=>String(x.type||"").toLowerCase()===type.toLowerCase()).sort((a,b)=>String(b.datePosted||"").localeCompare(String(a.datePosted||"")))}
function card(x,kind){const cls=x.className?`<span class="badge">${esc(x.className)}</span>`:"";const sub=x.subject?`<span class="badge">${esc(x.subject)}</span>`:"";const target=x.targetAudience?`<span class="badge">${esc(x.targetAudience)}</span>`:"";const due=x.dueDate?`<span>Due: ${esc(fmtDate(x.dueDate))}</span>`:"";return `<article class="card ${kind}"><h3>${esc(x.title||"Untitled")}</h3><div class="meta">${target}${cls}${sub}</div><p>${esc(x.message||"")}</p><div class="meta"><span>Posted: ${esc(fmtDate(x.datePosted))}</span>${due}</div>${x.attachmentFileId?`<a href="#" class="attachment" data-file="${esc(x.attachmentFileId)}" data-name="${esc(x.attachmentName||"Attachment")}">📥 Download Attachment</a>`:""}</article>`}
function wireAttachments(){document.querySelectorAll(".attachment[data-file]").forEach(a=>a.onclick=async e=>{e.preventDefault();const original=a.textContent;a.textContent="Preparing download…";try{const r=await api({type:"attachment",fileId:a.dataset.file});if(!r?.success||!r.fileData)throw new Error(r?.error||"Attachment unavailable.");const bin=atob(r.fileData);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:r.mimeType||"application/octet-stream"}));const link=document.createElement("a");link.href=url;link.download=String(r.fileName||a.dataset.name||"Attachment");document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(err){alert(err.message)}finally{a.textContent=original||"📥 Download Attachment"}})}

const CALENDAR_MIN_YEAR=2026,CALENDAR_MAX_YEAR=2030;
const calendarState={year:Math.min(CALENDAR_MAX_YEAR,Math.max(CALENDAR_MIN_YEAR,new Date().getFullYear())),month:new Date().getMonth()};
function calendarMonthName(month){return new Date(2000,month,1).toLocaleDateString("en-GB",{month:"long"})}
function renderCalendarNotices(app){
  const years=[];for(let y=CALENDAR_MIN_YEAR;y<=CALENDAR_MAX_YEAR;y++)years.push(y);
  const firstDay=new Date(calendarState.year,calendarState.month,1).getDay();
  const days=new Date(calendarState.year,calendarState.month+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push(`<div class="calendar-day muted"></div>`);
  for(let day=1;day<=days;day++)cells.push(`<div class="calendar-day"><span>${day}</span></div>`);
  while(cells.length%7)cells.push(`<div class="calendar-day muted"></div>`);
  const posts=published("Post");
  app.innerHTML=`<h2>📅 School Calendar / Notices</h2>
    <section class="card calendar-card">
      <div class="calendar-controls">
        <label>YEAR<select id="calendarYear">${years.map(y=>`<option value="${y}" ${y===calendarState.year?"selected":""}>${y}</option>`).join("")}</select></label>
        <div class="calendar-month-nav">
          <button id="calendarPrev" type="button">‹ Previous</button>
          <strong>${calendarMonthName(calendarState.month)} ${calendarState.year}</strong>
          <button id="calendarNext" type="button">Next ›</button>
        </div>
      </div>
      <div class="calendar-weekdays">${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(x=>`<div>${x}</div>`).join("")}</div>
      <div class="calendar-grid">${cells.join("")}</div>
    </section>
    <h2 class="notice-heading">School Notices</h2>
    <div class="grid">${posts.length?posts.map(x=>card(x,"notice")).join(""):`<div class="empty">No published notices.</div>`}</div>`;
  $("#calendarYear").onchange=e=>{calendarState.year=Number(e.target.value);render()};
  $("#calendarPrev").onclick=()=>{calendarState.month--;if(calendarState.month<0){calendarState.month=11;calendarState.year--}if(calendarState.year<CALENDAR_MIN_YEAR){calendarState.year=CALENDAR_MIN_YEAR;calendarState.month=0}render()};
  $("#calendarNext").onclick=()=>{calendarState.month++;if(calendarState.month>11){calendarState.month=0;calendarState.year++}if(calendarState.year>CALENDAR_MAX_YEAR){calendarState.year=CALENDAR_MAX_YEAR;calendarState.month=11}render()};
  wireAttachments();
}

function render(){
  document.querySelectorAll("nav button[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===state.view));
  const app=$("#app");
  if(state.view==="home"){const anns=published("Announcement").slice(0,3),ass=published("Assignment").slice(0,3);app.innerHTML=`<div class="grid"><section><h2>Latest Announcements</h2>${anns.length?anns.map(x=>card(x,"announcement")).join(""):`<div class="empty">No current announcements.</div>`}</section><section><h2>Latest Assignments</h2>${ass.length?ass.map(x=>card(x,"assignment")).join(""):`<div class="empty">No current assignments.</div>`}</section></div>`}
  if(state.view==="announcements"){const items=published("Announcement");app.innerHTML=`<h2>📢 School Announcements</h2><div class="grid">${items.length?items.map(x=>card(x,"announcement")).join(""):`<div class="empty">No published announcements.</div>`}</div>`}
  if(state.view==="notices"){renderCalendarNotices(app)}
  if(state.view==="assignments"){app.innerHTML=`<h2>📚 Home Assignments</h2><div class="filters"><label>Class<select id="classFilter"><option value="">All Classes</option>${state.classes.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label><label>Subject<select id="subjectFilter"><option value="">All Subjects</option>${state.subjects.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label></div><div id="assignmentList"></div>`;const draw=()=>{const c=$("#classFilter").value,s=$("#subjectFilter").value;const items=published("Assignment").filter(x=>(!c||x.className===c)&&(!s||x.subject===s));$("#assignmentList").innerHTML=`<div class="grid">${items.length?items.map(x=>card(x,"assignment")).join(""):`<div class="empty">No assignments match these filters.</div>`}</div>`;wireAttachments()};$("#classFilter").onchange=draw;$("#subjectFilter").onchange=draw;draw()}
  if(state.view==="attendance"){
    const authenticated=!!parentToken()&&!!state.parentStudent;
    app.innerHTML=`<h2>📝 Student Attendance</h2><div class="card">${authenticated?`
      <div class="filters"><div><strong>${esc(state.parentStudent.name||"Student")}</strong><div>${esc(state.parentStudent.studentId||"")} · ${esc(state.parentStudent.className||"")}</div></div><button id="parentSignOut" type="button">Sign Out</button></div>
      <div id="attendanceView" class="empty">Loading verified attendance…</div>`:`
      <p>For privacy, attendance is not available by Student ID alone. Enter the Student ID and the guardian contact number recorded by the school.</p>
      <form id="parentVerifyForm" class="filters">
        <label>Student ID<input id="parentStudentId" required></label>
        <label>Guardian Contact<input id="parentGuardianPhone" inputmode="tel" required></label>
        <button type="submit">Verify Student</button>
      </form><div id="attendanceView" class="empty">Verification is required before attendance can be viewed.</div>`}</div>`;
    if(authenticated){$("#parentSignOut").onclick=parentSignOut;loadAttendance()}
    else{$("#parentVerifyForm").onsubmit=verifyParentStudent}
  }
  if(state.view==="school"){const s=state.school;const phones=[s.phone,s.phone2,s.phone3].filter(Boolean).join(" / ")||"055 610 4186 / 024 272 7685 / 024 874 3558";const email=s.email||"afisaproyalacademy@gmail.com";const website=s.website||"www.afisaproyalacademy.com";const address=s.address||"Abuakwa Atwima Agogo Boaso Near Gaso Fueling Station, P.O Box SE 58, Suame Kumasi.";app.innerHTML=`<h2>ℹ️ About the School</h2><section class="card school-info"><h2>${esc(s.name||"AFISAP ROYAL ACADEMY")}</h2><p><strong>Motto:</strong> ${esc(s.motto||"LEARNING TO LEARN")}</p><p><strong>Phone:</strong> ${esc(phones)}</p><p><strong>Email:</strong> ${esc(email)}</p><p><strong>Website:</strong> ${esc(website)}</p><p><strong>Address:</strong> ${esc(address)}</p></section>`}
  wireAttachments();
}
async function verifyParentStudent(e){
 e.preventDefault();const box=$("#attendanceView");box.className="status";box.textContent="Verifying student…";
 try{
   const r=await securePost({action:"parentAuthLogin",studentId:$("#parentStudentId").value,guardianPhone:$("#parentGuardianPhone").value});
   if(!r?.success||!r.authToken)throw new Error(r?.error||"Student verification failed.");
   setParentToken(r.authToken);state.parentStudent=r.student||null;
   try{
     const aa=await securePost({action:"parentPortalGet",type:"announcements",authToken:parentToken()});
     if(aa?.success)state.announcements=aa.records||[];
   }catch(ignore){}
   render();
 }catch(err){box.className="status error";box.textContent=err.message}
}
async function parentSignOut(){
 const token=parentToken();
 setParentToken("");state.parentStudent=null;
 try{
   const publicFeed=await api({type:"announcements"});
   if(publicFeed?.success)state.announcements=publicFeed.records||[];
 }catch(e){state.announcements=[]}
 render();
 if(token)securePost({action:"parentAuthLogout",authToken:token}).catch(()=>null);
}
async function loadAttendance(){
 const box=$("#attendanceView");if(!box)return;box.className="status";box.textContent="Loading attendance…";
 try{
   const r=await securePost({action:"parentPortalGet",type:"attendance",authToken:parentToken()});
   if(!r?.success)throw new Error(r?.error||"Attendance unavailable.");
   state.parentStudent=r.student||state.parentStudent;
   const rows=(r.records||[]).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
   const present=rows.filter(x=>x.present).length,absent=rows.length-present,rate=rows.length?((present/rows.length)*100).toFixed(1):"0.0";
   box.className="";box.innerHTML=`<h3>${esc(r.student?.name||"Student")} · ${esc(r.student?.className||"")}</h3><div class="att-summary"><div class="metric"><strong>${present}</strong>Present days</div><div class="metric"><strong>${absent}</strong>Absent days</div><div class="metric"><strong>${rate}%</strong>Attendance rate</div></div>${rows.length?`<table><thead><tr><th>Date</th><th>Attendance</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(fmtDate(x.date))}</td><td class="${x.present?"present":"absent"}">${x.present?"PRESENT ✅":"ABSENT ❌"}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">No attendance records are available for this student.</div>`}`;
 }catch(e){box.className="status error";box.textContent=e.message}
}
async function boot(){
 try{
   const [school,aa,classes,subjects]=await Promise.all([api({type:"school"}),api({type:"announcements"}),api({type:"classes"}),api({type:"subjects"})]);
   if(!school?.success)throw new Error(school?.error||"School information unavailable.");
   state.school=school.school||{};state.announcements=aa?.success?aa.records||[]:[];state.classes=classes?.success?classes.records||[]:[];state.subjects=subjects?.success?subjects.records||[]:[];
   const token=parentToken();
   if(token){
     try{
       const s=await securePost({action:"parentAuthSessionStatus",authToken:token});
       if(s?.success&&s.authenticated){
         state.parentStudent=s.student||null;
         const privateFeed=await securePost({action:"parentPortalGet",type:"announcements",authToken:token});
         if(privateFeed?.success)state.announcements=privateFeed.records||[];
       }else setParentToken("");
     }catch(e){setParentToken("")}
   }
   $("#schoolName").textContent=state.school.name||"AFISAP ROYAL ACADEMY";$("#schoolMotto").textContent=state.school.motto||"LEARNING TO LEARN";$("#footerSchool").textContent=state.school.name||"AFISAP Royal Academy";$("#status").className="status ok";render();
 }catch(e){$("#status").className="status error";$("#status").textContent=e.message;render()}
}

async function refreshParentCommunications(){
 try{
   const token=parentToken();
   const r=token
     ? await securePost({action:"parentPortalGet",type:"announcements",authToken:token})
     : await api({type:"announcements"});
   if(!r?.success)return;
   const next=r.records||[];
   const before=JSON.stringify(state.announcements||[]),after=JSON.stringify(next);
   if(before!==after){
     state.announcements=next;
     if(["home","announcements","assignments","posts"].includes(state.view))render();
   }
 }catch(ignore){}
}

document.querySelectorAll("nav button[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;$("#nav").classList.remove("open");render()});$("#menuBtn").onclick=()=>$("#nav").classList.toggle("open");boot();
// Keep Parent Portal communication synchronized with Admin/Teacher publishing
// without requiring parents to manually refresh the page.
setInterval(refreshParentCommunications,15000);


/* Parent Portal hero slider — visual only; no API or data-sync changes. */
(function initParentPortalSlider(){
  const slides=[...document.querySelectorAll(".slider-image")];
  const dots=[...document.querySelectorAll(".slider-dot")];
  const prev=document.getElementById("sliderPrev");
  const next=document.getElementById("sliderNext");
  if(!slides.length) return;

  let current=0;
  let timer=null;
  const intervalMs=5000;

  function show(index){
    current=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>slide.classList.toggle("active",i===current));
    dots.forEach((dot,i)=>dot.classList.toggle("active",i===current));
  }
  function restart(){
    if(timer) clearInterval(timer);
    timer=setInterval(()=>show(current+1),intervalMs);
  }

  prev?.addEventListener("click",()=>{show(current-1);restart()});
  next?.addEventListener("click",()=>{show(current+1);restart()});
  dots.forEach(dot=>dot.addEventListener("click",()=>{show(Number(dot.dataset.slide||0));restart()}));

  const slider=document.getElementById("parentSlider");
  slider?.addEventListener("mouseenter",()=>{if(timer) clearInterval(timer)});
  slider?.addEventListener("mouseleave",restart);

  show(0);
  restart();
})();
