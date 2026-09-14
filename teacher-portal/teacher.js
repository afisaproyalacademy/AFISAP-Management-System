const AFISAP_TEACHER_UI_BUILD="20260912-DATA-READY-PROGRESS-FINAL";
console.info("AFISAP Teacher Portal UI build",AFISAP_TEACHER_UI_BUILD);
const API="https://script.google.com/macros/s/AKfycbxHtxKgKlw8bfGHWmeLsBTl7fFIRLSTHLPjSmjfS1S7WIF4puoIzGKOdnw8HBHRHdCN/exec";

const TEACHER_TOKEN_KEY="afisap_teacher_session_token_v2";
const TEACHER_SESSION_CACHE_KEY="afisap_teacher_session_cache_v1";
function teacherReadSessionCache(){
 try{
  const raw=localStorage.getItem(TEACHER_SESSION_CACHE_KEY);
  if(!raw)return null;
  const cached=JSON.parse(raw);
  return cached&&cached.teacher?cached:null;
 }catch(e){return null}
}
function teacherWriteSessionCache(){
 if(!state.teacher)return;
 try{
  localStorage.setItem(TEACHER_SESSION_CACHE_KEY,JSON.stringify({
   teacher:{
     staffId:String(state.teacher.staffId||""),
     name:String(state.teacher.name||"Teacher"),
     classes:Array.isArray(state.teacher.classes)?state.teacher.classes:[],
     subjects:Array.isArray(state.teacher.subjects)?state.teacher.subjects:[]
   },
   school:{name:String(state.school.name||"AFISAP ROYAL ACADEMY"),academicYear:String(state.school.academicYear||""),term:String(state.school.term||"")},
   savedAt:Date.now()
  }));
 }catch(e){}
}
function teacherClearSessionCache(){
 try{localStorage.removeItem(TEACHER_SESSION_CACHE_KEY)}catch(e){}
 try{sessionStorage.removeItem(TEACHER_SESSION_CACHE_KEY)}catch(e){}
}
// Keep the authenticated teacher session across an ordinary page refresh.
// localStorage is used as the durable browser-side holder; sessionStorage is
// retained only as a compatibility fallback/migration path for older builds.
function teacherToken(){
 try{
   const persistent=localStorage.getItem(TEACHER_TOKEN_KEY);
   if(persistent)return persistent;
 }catch(e){}
 try{
   const legacy=sessionStorage.getItem(TEACHER_TOKEN_KEY)||"";
   if(legacy){
     try{localStorage.setItem(TEACHER_TOKEN_KEY,legacy)}catch(e){}
   }
   return legacy;
 }catch(e){return""}
}
function setTeacherToken(v){
 const value=v?String(v):"";
 try{value?localStorage.setItem(TEACHER_TOKEN_KEY,value):localStorage.removeItem(TEACHER_TOKEN_KEY)}catch(e){}
 try{value?sessionStorage.setItem(TEACHER_TOKEN_KEY,value):sessionStorage.removeItem(TEACHER_TOKEN_KEY)}catch(e){}
}
async function securePost(body){
 const r=await fetch(API,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},body:JSON.stringify(body||{}),cache:"no-store",credentials:"omit"});
 if(!r.ok)throw new Error("School data request failed ("+r.status+").");
 const text=await r.text();try{return JSON.parse(text)}catch(e){throw new Error("School data returned an unreadable response.")}
}

const state={school:{academicYear:"2026/2027",term:"Term 1"},teachers:[],teacher:null,profile:null,profilePhoto:"",students:[],results:[],attendance:[],fees:[],reportFees:[],posts:[],schoolSubjects:[],schoolClasses:[],reportCardDates:{},view:"dashboard",photos:{}};
const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>new Date().toISOString().slice(0,10);
function jsonp(action,params={}){
 return new Promise((resolve,reject)=>{const cb="afisapT_"+Date.now()+"_"+Math.floor(Math.random()*1e6),script=document.createElement("script"),q=new URLSearchParams({...params,action,callback:cb});const timer=setTimeout(()=>done(new Error("School data request timed out.")),45000);
 function done(err,data){clearTimeout(timer);try{delete window[cb]}catch(e){}script.remove();err?reject(err):resolve(data)}window[cb]=d=>done(null,d);script.onerror=()=>done(new Error("Could not reach the school data service."));q.set("_ts",String(Date.now()));script.src=API+"?"+q;document.head.appendChild(script)})
}
function api(type,extra={}){return securePost({action:"teacherPortalGet",type,...extra,authToken:teacherToken()})}
function write(type,data){return securePost({action:"teacherPortalWrite",type,data,authToken:teacherToken()})}
function writePayload(type,data){return securePost({action:"teacherPortalWrite",type,data,authToken:teacherToken()})}
const OFFICIAL_REPORT_SUBJECTS=["Computing","Creative Arts","English","French","History","Mathematics","R M E","Science","TWI","Other"];
const AFISAP_TEACHER_PROMOTION_CLASSES=["Nursery 1","Nursery 2","KG 1","KG 2","Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","JHS 1","JHS 2","JHS 3"];
function classes(){return state.teacher?.classes||[]}
function subjects(){const assigned=state.teacher?.subjects||[];return assigned.length?assigned:(state.schoolSubjects.length?state.schoolSubjects:OFFICIAL_REPORT_SUBJECTS)}
function teacherCanonicalSubject(v){
 const raw=String(v||"").trim(),key=raw.toLowerCase().replace(/[^a-z0-9]/g,"");
 const aliases={maths:"Mathematics",mathematics:"Mathematics",rme:"R M E",religiousandmoraleducation:"R M E"};
 if(aliases[key])return aliases[key];
 const official=OFFICIAL_REPORT_SUBJECTS.find(s=>s.toLowerCase().replace(/[^a-z0-9]/g,"")===key);
 // A value not in the fixed list is the actual custom subject entered through Other.
 return official||raw;
}

function teacherSelectedResultSubject(){
 const selected=String(window.trSubject||"").trim();
 if(teacherResultKey(selected)==="other"){
   return String(window.trOtherSubject||"").trim();
 }
 return teacherCanonicalSubject(selected);
}

function teacherReportSubjectsForStudent(sid,year,term){
 const fixed=OFFICIAL_REPORT_SUBJECTS.filter(subject=>teacherResultKey(subject)!=="other");
 const customSubjects=[];
 state.results.forEach(result=>{
   if(String(result["Student ID"]||"").trim()!==String(sid||"").trim())return;
   if(!teacherPeriodMatches(result,year,term))return;
   const subject=teacherCanonicalSubject(result["Subject"]);
   if(!subject)return;
   const key=teacherSubjectKey(subject);
   if(fixed.some(item=>teacherSubjectKey(item)===key))return;
   if(teacherResultKey(subject)==="other")return;
   if(!customSubjects.some(item=>teacherSubjectKey(item)===key))customSubjects.push(subject);
 });
 return [...fixed,...(customSubjects.length?customSubjects:["Other"])];
}

function resultSubjects(){return [...OFFICIAL_REPORT_SUBJECTS]}
function studentById(id){return state.students.find(s=>s.studentId===String(id))}
function opts(items,current=""){return items.map(x=>`<option value="${esc(x)}"${String(x)===String(current)?" selected":""}>${esc(x)}</option>`).join("")}
function academicYears(){const current=state.school.academicYear||"2026/2027",y=Number(current.slice(0,4))||2026;return [...new Set([current,...Array.from({length:6},(_,i)=>`${y-1+i}/${y+i}`)])]}
function termOptions(){return ["Term 1","Term 2","Term 3"]}
function setStatus(msg="",error=false){const el=$("#status");el.textContent=msg;el.className=msg?"status"+(error?" error":""):"status ok"}
function teacherRole(){if(!state.teacher)return"";return classes().length&&subjects().length?"Class / Subject Teacher":classes().length?"Class Teacher":subjects().length?"Subject Teacher":state.teacher.position||"Teacher"}
function pills(arr){return arr.length?`<div class="pills">${arr.map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div>`:`<p class="muted">None assigned.</p>`}
function photoCell(s){return state.photos[s.studentId]?`<img class="student-photo" src="${state.photos[s.studentId]}" alt="">`:`<div class="photo-placeholder" data-photo="${esc(s.studentId)}">👤</div>`}
async function hydratePhotos(){
 const visible=[...document.querySelectorAll("[data-photo]")].map(x=>x.dataset.photo).filter(id=>!state.photos[id]).slice(0,30);
 await Promise.all(visible.map(async id=>{try{const r=await api("studentphoto",{studentId:id});if(r?.success&&r.fileData)state.photos[id]=`data:${r.mimeType||"image/jpeg"};base64,${r.fileData}`}catch(e){}}));
 visible.forEach(id=>{const el=document.querySelector(`[data-photo="${CSS.escape(id)}"]`);if(el&&state.photos[id]){const photoClass=el.classList.contains("attendance-photo-placeholder")?"attendance-student-photo":"student-photo";el.outerHTML=`<img class="${photoClass}" src="${state.photos[id]}" alt="">`}})
}
function teacherResultKey(v){return String(v||"").trim().toLowerCase().replace(/\s+/g," ")}
function teacherSubjectKey(v){const canonical=teacherCanonicalSubject(v);return (canonical||String(v||"")).trim().toLowerCase().replace(/[^a-z0-9]/g,"")}
function teacherTermKey(v){const k=teacherResultKey(v).replace(/\s+/g,"");const m=k.match(/(?:term)?([123])/);return m?"term"+m[1]:k}
function teacherPeriodMatches(r,year,term){
 const ry=String(r?.["Academic Year"]||"").trim(),rt=String(r?.["Term"]||"").trim();
 return (!ry||!year||teacherResultKey(ry)===teacherResultKey(year))&&(!rt||!term||teacherTermKey(rt)===teacherTermKey(term));
}
function teacherPreferCanonicalResult(current,candidate){
 if(!current)return candidate;
 const cName=teacherCanonicalSubject(candidate?.Subject),oldName=teacherCanonicalSubject(current?.Subject);
 const cExact=cName&&teacherResultKey(candidate?.Subject)===teacherResultKey(cName),oldExact=oldName&&teacherResultKey(current?.Subject)===teacherResultKey(oldName);
 if(cExact&&!oldExact)return candidate;
 const cUpdated=Date.parse(candidate?.["Last Updated"]||candidate?.["Date Created"]||"")||0,oldUpdated=Date.parse(current?.["Last Updated"]||current?.["Date Created"]||"")||0;
 return cUpdated>oldUpdated?candidate:current;
}
function resultFor(sid,subject,year,term){
 const key=teacherSubjectKey(subject),matches=state.results.filter(r=>String(r["Student ID"]||"").trim()===String(sid||"").trim()&&teacherSubjectKey(r["Subject"])===key&&teacherPeriodMatches(r,year,term));
 return matches.reduce((best,r)=>teacherPreferCanonicalResult(best,r),null);
}
function canonicalResultsForStudent(sid,year,term){
 const bySubject=new Map();
 state.results.filter(r=>String(r["Student ID"]||"").trim()===String(sid||"").trim()&&teacherPeriodMatches(r,year,term)).forEach(r=>{
   const canonical=teacherCanonicalSubject(r.Subject);if(!canonical||teacherResultKey(canonical)==="other")return;
   const key=teacherSubjectKey(canonical),current=bySubject.get(key);bySubject.set(key,teacherPreferCanonicalResult(current,r));
 });
 // Keep every real saved subject, including a custom subject entered through Other.
 return [...bySubject.values()];
}
function canonicalClassResults(cls,year,term){
 const allowed=new Map(state.students.filter(s=>s.className===cls).map(s=>[s.studentId,s]));
 const byKey=new Map();
 state.results.forEach(r=>{
   const sid=String(r["Student ID"]||"").trim(),student=allowed.get(sid),canonical=teacherCanonicalSubject(r.Subject);
   if(!student||!canonical||!teacherPeriodMatches(r,year,term))return;
   const key=sid+"|"+teacherSubjectKey(canonical),current=byKey.get(key);byKey.set(key,teacherPreferCanonicalResult(current,r));
 });
 return [...byKey.values()].sort((a,b)=>{
   const sa=allowed.get(String(a["Student ID"]||"").trim()),sb=allowed.get(String(b["Student ID"]||"").trim());
   const nameCompare=String(sa?.name||"").localeCompare(String(sb?.name||""));if(nameCompare)return nameCompare;
   return resultSubjects().indexOf(teacherCanonicalSubject(a.Subject))-resultSubjects().indexOf(teacherCanonicalSubject(b.Subject));
 });
}
function attendanceFor(sid,date){return state.attendance.find(r=>String(r["Student ID"]||"")===sid&&String(r["Attendance Date"]||r["Date"]||"")===date)}
function ordinalRank(rows){
 const sorted=[...rows].sort((a,b)=>b.total-a.total);let last=null,rank=0;const map=new Map();
 sorted.forEach((x,i)=>{if(last===null||x.total!==last)rank=i+1;const m=rank%100,s=(m>=11&&m<=13)?"th":({1:"st",2:"nd",3:"rd"}[rank%10]||"th");map.set(x.sid,rank+s);last=x.total});return map
}
function academicRankMap(cls,year,term){
 const list=state.students.filter(s=>s.className===cls);
 const rows=list.map(s=>{
   const rs=canonicalResultsForStudent(s.studentId,year,term);
   return {sid:s.studentId,total:rs.reduce((sum,r)=>sum+Number(r["Total Marks"]??(Number(r["Class Score"]||0)+Number(r["Exam Score"]||0))),0),has:rs.length>0};
 }).filter(x=>x.has);
 return ordinalRank(rows);
}

function render(){
 document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===state.view));
 if(!state.teacher){$("#app").innerHTML=`<div class="empty">Sign in to access your assigned Teacher Portal records.</div>`;return}
 $("#welcomeText").textContent=`Welcome, ${state.teacher.name} · ${teacherRole()} · ${state.teacher.staffId}`;
 $("#teacherChip").textContent=state.teacher.name;
 const fn={dashboard:renderDashboard,students:renderStudents,results:renderResults,attendance:renderAttendance,classes:renderClasses,fees:renderFees,posts:renderPosts,reports:renderReports}[state.view];fn?.();hydratePhotos()
}
function profileValue(v){return esc(String(v||"—"))}
function teacherProfilePhotoMarkup(){return state.profilePhoto?`<img class="teacher-profile-photo" src="${state.profilePhoto}" alt="Teacher profile photograph">`:`<div class="teacher-profile-photo teacher-profile-photo-empty">👤</div>`}
async function loadTeacherProfile(){
 if(!state.teacher)return;
 const r=await api("profile",{staffId:state.teacher.staffId});if(!r?.success)throw new Error(r?.error||"Teacher profile unavailable.");state.profile=r.profile||null;
 await loadTeacherProfilePhoto();
}
async function loadTeacherProfilePhoto(){
 if(!state.teacher)return;
 try{
   const ph=await api("profilephoto",{staffId:state.teacher.staffId});
   state.profilePhoto=ph?.success&&ph.fileData?`data:${ph.mimeType||"image/jpeg"};base64,${ph.fileData}`:"";
 }catch(e){state.profilePhoto=""}
}
function renderTeacherProfileCard(){
 const p=state.profile||{},assignedClass=p.assignedClass||classes().join(", "),assignedSubject=p.assignedSubject||subjects().join(", ");
 return `<section class="panel teacher-profile-panel"><div class="teacher-profile-heading"><div><span class="eyebrow">MY PERSONAL PROFILE</span><h3>${profileValue(p.name||state.teacher.name)}</h3></div><button class="btn primary" id="updateTeacherProfile">UPDATE PROFILE</button></div><div class="teacher-profile-grid"><div class="teacher-profile-photo-col">${teacherProfilePhotoMarkup()}<button class="btn secondary" id="changeTeacherPhoto">Change Photograph</button></div><div class="teacher-profile-details"><div><b>Staff ID</b><span>${profileValue(p.staffId||state.teacher.staffId)}</span></div><div><b>Position</b><span>${profileValue(p.position||state.teacher.position)}</span></div><div><b>Assigned Class</b><span>${profileValue(assignedClass)}</span></div><div><b>Assigned Subject(s)</b><span>${profileValue(assignedSubject)}</span></div><div><b>Gender</b><span>${profileValue(p.gender)}</span></div><div><b>Date of Birth</b><span>${profileValue(p.dateOfBirth)}</span></div><div><b>Marital Status</b><span>${profileValue(p.maritalStatus)}</span></div><div><b>Children</b><span>${profileValue(p.numberOfChildren)}</span></div><div><b>Phone</b><span>${profileValue(p.phone)}</span></div><div><b>Email</b><span>${profileValue(p.email)}</span></div></div></div></section>`
}
function openTeacherProfileEditor(){
 const p=state.profile||{};const host=document.createElement("div");host.className="teacher-profile-modal";host.innerHTML=`<div class="teacher-profile-dialog"><div class="teacher-profile-dialog-head"><h2>Update Personal Profile</h2><button type="button" class="btn secondary" data-close>Close</button></div><form id="teacherProfileForm"><h3>Basic Information</h3><div class="profile-form-grid"><label>First Name<input name="firstName" required value="${esc(p.firstName||"")}"></label><label>Middle / Other Name<input name="middleName" value="${esc(p.middleName||"")}"></label><label>Surname / Last Name<input name="surname" required value="${esc(p.surname||"")}"></label><label>Gender<select name="gender"><option value="">Select</option>${["Male","Female","Other"].map(v=>`<option${p.gender===v?" selected":""}>${v}</option>`).join("")}</select></label><label>Date of Birth<input type="date" name="dateOfBirth" value="${esc(p.dateOfBirth||"")}"></label><label>Marital Status<select name="maritalStatus"><option value="">Select</option>${["Single","Married","Divorced","Widowed","Separated"].map(v=>`<option${p.maritalStatus===v?" selected":""}>${v}</option>`).join("")}</select></label><label>Number of Children<input type="number" min="0" step="1" name="numberOfChildren" value="${esc(p.numberOfChildren||"")}"></label><label>Nationality<input name="nationality" value="${esc(p.nationality||"")}"></label></div><h3>Contact Information</h3><div class="profile-form-grid"><label>Phone / Contact Number<input name="phone" value="${esc(p.phone||"")}"></label><label>Email Address<input type="email" name="email" value="${esc(p.email||"")}"></label><label>Residential Address<input name="residentialAddress" value="${esc(p.residentialAddress||"")}"></label><label>Address Line<input name="addressLine" value="${esc(p.addressLine||"")}"></label><label>City / Town<input name="city" value="${esc(p.city||"")}"></label><label>Region<input name="region" value="${esc(p.region||"")}"></label><label>Post Office Address<input name="postOfficeAddress" value="${esc(p.postOfficeAddress||"")}"></label></div><h3>Identification</h3><div class="profile-form-grid"><label>Ghana Card / National ID<input name="ghanaCard" value="${esc(p.ghanaCard||"")}"></label><label>Staff ID<input readonly value="${esc(p.staffId||state.teacher.staffId)}"></label></div><h3>Emergency / Next of Kin</h3><div class="profile-form-grid"><label>Emergency Contact Name<input name="emergencyName" value="${esc(p.emergencyName||"")}"></label><label>Emergency Contact Phone<input name="emergencyPhone" value="${esc(p.emergencyPhone||"")}"></label><label>Emergency Relationship<input name="emergencyRelationship" value="${esc(p.emergencyRelationship||"")}"></label><label>Next of Kin Name<input name="nextKinName" value="${esc(p.nextKinName||"")}"></label><label>Next of Kin Contact<input name="nextKinContact" value="${esc(p.nextKinContact||"")}"></label><label>Next of Kin Relationship<input name="nextKinRelationship" value="${esc(p.nextKinRelationship||"")}"></label></div><h3>Employment / Profile Information</h3><div class="profile-form-grid"><label>Position<input readonly value="${esc(p.position||state.teacher.position||"")}"></label><label>Assigned Class<input readonly value="${esc(p.assignedClass||classes().join(", "))}"></label><label>Assigned Subject(s)<input readonly value="${esc(p.assignedSubject||subjects().join(", "))}"></label><label>Date Joined<input readonly value="${esc(p.dateJoined||"")}"></label><label>Department<input readonly value="${esc(p.department||"")}"></label><label>Employment Type<input readonly value="${esc(p.employmentType||"")}"></label></div><div class="actions"><button class="btn primary" type="submit">SAVE PROFILE</button><span id="profileSaveStatus"></span></div></form></div>`;document.body.appendChild(host);host.querySelector("[data-close]").onclick=()=>host.remove();
 const form=host.querySelector("#teacherProfileForm");form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form),data=Object.fromEntries(fd.entries()),status=host.querySelector("#profileSaveStatus"),saveBtn=form.querySelector('button[type="submit"]');status.textContent="Saving profile...";if(saveBtn)saveBtn.disabled=true;teacherShowProfileSaveLoader("Saving your profile…");try{const r=await write("profile",data);if(!r?.success)throw new Error(r?.error||"Unable to save profile. Please try again.");if(r.profile)state.profile=r.profile;else state.profile={...(state.profile||{}),...data,name:[data.firstName,data.middleName,data.surname].filter(Boolean).join(" ")};state.teacher.name=state.profile.name||state.teacher.name;status.textContent="Profile updated successfully.";await teacherFinishProfileSaveLoader();host.remove();render()}catch(err){teacherHideProfileSaveLoader();if(saveBtn)saveBtn.disabled=false;status.textContent="Unable to save profile. Please try again.";setStatus(err.message,true)}}
}
function openTeacherPhotoEditor(){
 const host=document.createElement("div");host.className="teacher-profile-modal";host.innerHTML=`<div class="teacher-profile-dialog teacher-photo-dialog"><div class="teacher-profile-dialog-head"><h2>Update Profile Photograph</h2><button type="button" class="btn secondary" data-close>Close</button></div><div class="teacher-photo-preview" id="teacherPhotoPreview">${teacherProfilePhotoMarkup()}</div><input id="teacherProfilePhotoFile" type="file" accept="image/jpeg,image/png,image/webp"><div class="actions"><button class="btn secondary" data-cancel>Cancel</button><button class="btn primary" id="uploadTeacherProfilePhoto" disabled>Upload Photo</button><span id="teacherPhotoStatus"></span></div></div>`;document.body.appendChild(host);host.querySelectorAll("[data-close],[data-cancel]").forEach(x=>x.onclick=()=>host.remove());const input=host.querySelector("#teacherProfilePhotoFile"),preview=host.querySelector("#teacherPhotoPreview"),upload=host.querySelector("#uploadTeacherProfilePhoto");let file=null;input.onchange=()=>{file=input.files?.[0]||null;if(!file)return;const url=URL.createObjectURL(file);preview.innerHTML=`<img class="teacher-profile-photo" src="${url}" alt="Photo Preview"><p>Photo Preview</p>`;upload.disabled=false};upload.onclick=async()=>{if(!file)return;const status=host.querySelector("#teacherPhotoStatus");status.textContent="Uploading photograph...";upload.disabled=true;try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||""));r.onerror=reject;r.readAsDataURL(file)});const uploadResult=await writePayload("profilephoto",{fileName:file.name,mimeType:file.type||"image/jpeg",fileData:data});if(!uploadResult?.success)throw new Error(uploadResult?.error||"Photo upload was not confirmed.");await loadTeacherProfile();if(!state.profile?.photoFileId)throw new Error("Photo reference was not confirmed.");status.textContent="Photograph updated successfully.";setTimeout(()=>{host.remove();render()},500)}catch(e){status.textContent="Unable to upload photograph. Please try again.";upload.disabled=false}}
}
let teacherProfileSaveProgressTimer=null;
function teacherShowProfileSaveLoader(message){
 teacherHideProfileSaveLoader();
 const overlay=document.createElement("div");overlay.id="teacherProfileSaveLoader";overlay.className="teacher-fee-print-loader";
 overlay.innerHTML=`<div class="teacher-fee-print-loader-card" role="status" aria-live="polite"><div class="teacher-fee-print-loader-logo"><img src="../afisap_royal_academy_logo.png" alt="AFISAP Royal Academy"></div><strong>${esc(message||"Saving your profile…")}</strong><div class="teacher-fee-print-progress-track"><span id="teacherProfileSaveProgressBar"></span></div><div id="teacherProfileSaveProgressText" class="teacher-fee-print-progress-text">10%</div><small>Please wait while your profile is securely saved.</small></div>`;
 document.body.appendChild(overlay);teacherSetProfileSaveProgress(10);let progress=10;
 teacherProfileSaveProgressTimer=setInterval(()=>{if(progress<90){progress+=10;teacherSetProfileSaveProgress(progress)}},220);
}
function teacherSetProfileSaveProgress(value){
 const n=Math.max(0,Math.min(100,Number(value)||0)),bar=$("#teacherProfileSaveProgressBar"),label=$("#teacherProfileSaveProgressText");
 if(bar)bar.style.width=n+"%";if(label)label.textContent=n+"%";
}
function teacherHideProfileSaveLoader(){
 if(teacherProfileSaveProgressTimer){clearInterval(teacherProfileSaveProgressTimer);teacherProfileSaveProgressTimer=null}
 document.getElementById("teacherProfileSaveLoader")?.remove();
}
async function teacherFinishProfileSaveLoader(){
 if(teacherProfileSaveProgressTimer){clearInterval(teacherProfileSaveProgressTimer);teacherProfileSaveProgressTimer=null}
 teacherSetProfileSaveProgress(100);await new Promise(r=>setTimeout(r,180));teacherHideProfileSaveLoader();
}

function renderDashboard(){
 const activePosts=state.posts.filter(p=>String(p.Status||"Published").toLowerCase()==="published").length;
 $("#app").innerHTML=`${renderTeacherProfileCard()}<section class="welcome"><h2>Welcome, ${esc(state.teacher.name)}</h2><p>${esc(teacherRole())} · Staff ID: ${esc(state.teacher.staffId)}</p></section><div class="cards"><div class="metric"><span>My Students</span><strong>${state.students.length}</strong></div><div class="metric"><span>Assigned Classes</span><strong>${classes().length}</strong></div><div class="metric"><span>Assigned Subjects</span><strong>${subjects().length}</strong></div><div class="metric"><span>My Posts</span><strong>${state.posts.length?activePosts:"—"}</strong></div><div class="metric"><span>Results Records</span><strong>${state.results.length||"—"}</strong></div></div><section class="panel"><h3>My Classes</h3>${pills(classes())}<h3 style="margin-top:16px">My Subjects</h3>${pills(subjects())}</section>`;
 $("#updateTeacherProfile")?.addEventListener("click",openTeacherProfileEditor);$("#changeTeacherPhoto")?.addEventListener("click",openTeacherPhotoEditor)
}
function renderStudents(){
 $("#app").innerHTML=`<section class="welcome"><h2>👨‍🎓 My Students</h2><p>Existing Admin student records filtered by your assigned classes.</p></section><section class="panel"><div class="table-wrap"><table><thead><tr><th>Photo</th><th>Student</th><th>Student ID</th><th>Class</th><th>Status</th><th>Gender</th><th>Roll No.</th></tr></thead><tbody>${state.students.map(s=>{const newly=String(s.promotionStatus||"").toLowerCase()==="applied"&&String(s.promotionEffectiveAcademicYear||"").trim()===String(state.school.academicYear||"").trim();return `<tr><td>${photoCell(s)}</td><td><strong>${esc(s.name)}</strong>${newly?`<div style="margin-top:4px"><span class="chip">NEWLY PROMOTED</span></div>`:""}</td><td>${esc(s.studentId)}</td><td>${esc(s.className)}</td><td>${newly?`Promoted from ${esc(s.previousClass||"Previous Class")}`:(String(s.promotionStatus||"").toLowerCase()==="pending"?`Pending promotion to ${esc(s.promotedTo||"")}`:"Active")}</td><td>${esc(s.gender||"—")}</td><td>${esc(s.rollNo||"—")}</td></tr>`}).join("")}</tbody></table></div></section>`
 hydratePhotos()
}
function renderResults(){
 const cls=window.trClass||classes()[0]||"";
 const selectedSubject=String(window.trSubject||"").trim(),sub=teacherSelectedResultSubject();
 const otherSubjectSelected=teacherResultKey(selectedSubject)==="other";
 const canEnterMarks=Boolean(selectedSubject);
 const year=window.trYear||state.school.academicYear||"2026/2027";
 const term=window.trTerm||state.school.term||"Term 1";
 const list=state.students.filter(s=>s.className===cls);
 let sid=String(window.trStudent||"");
 if(!list.some(s=>s.studentId===sid))sid=list[0]?.studentId||"";
 window.trStudent=sid;
 const student=studentById(sid);
 const r=student&&sub?resultFor(sid,sub,year,term):null;
 const cs=r?Number(r?.["Class Score"]||0):0,es=r?Number(r?.["Exam Score"]||0):0;
 const ranks=academicRankMap(cls,year,term);
 const position=String(r?.Position||ranks.get(sid)||"");
 const studentOptions=list.map(s=>`<option value="${esc(s.studentId)}"${s.studentId===sid?" selected":""}>${esc(s.name)} — ${esc(s.studentId)}</option>`).join("");
 const classRows=canonicalClassResults(cls,year,term);

 $("#app").innerHTML=`<section class="welcome"><h2>📝 Results &amp; Marks</h2><p>Official Results records. Access is restricted to your assigned class/students; all official report subjects are available for mark entry.</p></section>
 <section class="panel"><div class="filters">
  <div class="control"><label>Assigned Class</label><select id="rClass">${opts(classes(),cls)}</select></div>
  <div class="control"><label>Subject</label><select id="rSubject"><option value="">Select Subject</option>${opts(resultSubjects(),selectedSubject)}</select></div>${teacherResultKey(selectedSubject)==="other"?`<div class="control"><label>Specify Other Subject</label><input id="rOtherSubject" value="${esc(window.trOtherSubject||"")}" placeholder="e.g. ICT"></div>`:""}
  <div class="control"><label>Academic Year</label><select id="rYear">${opts(academicYears(),year)}</select></div>
  <div class="control"><label>Term</label><select id="rTerm">${opts(termOptions(),term)}</select></div>
  <div class="control"><label>Select Student</label><select id="rStudent">${studentOptions||'<option value="">No assigned students</option>'}</select></div>
 </div></section>
 ${student?`<section class="panel result-student-card">
   <div class="result-student-photo">${photoCell(student)}</div>
   <div class="result-student-info">
    <h3>${esc(student.name)}</h3>
    <div class="student-facts">
      <span><b>Student ID:</b> ${esc(student.studentId)}</span>
      <span><b>Class:</b> ${esc(student.className)}</span>
      <span><b>Gender:</b> ${esc(student.gender||"—")}</span>
      <span><b>Roll No.:</b> ${esc(student.rollNo||"—")}</span>
      <span><b>No. on Roll:</b> ${esc(student.noOnRoll||list.length)}</span>
      <span><b>Position:</b> ${esc(position||ranks.get(sid)||"—")}</span>
    </div>
   </div>
 </section>
 <section class="panel">
  <h3 id="resultEntryTitle">${sub?esc(sub)+" — Mark Entry":otherSubjectSelected?"Other — Mark Entry":"Select a Subject — Mark Entry"}</h3>
  <div class="result-entry-grid" data-result-row="${esc(sid)}">
   <div class="control"><label>Class Score (0–50)</label><input id="rClassScore" class="score cs" type="number" min="0" max="50" value="${r?cs:""}" ${canEnterMarks?"":"disabled"}></div>
   <div class="control"><label>Exam Score (0–50)</label><input id="rExamScore" class="score es" type="number" min="0" max="50" value="${r?es:""}" ${canEnterMarks?"":"disabled"}></div>
   <div class="control"><label>Total</label><input id="rTotal" value="${r?cs+es:""}" readonly></div>
   <div class="control"><label>Position</label><input value="${esc(position||ranks.get(sid)||"")}" readonly></div>
   <div class="control result-remarks"><label>Remarks</label><input id="rRemarks" value="${esc(r?.Remarks||"")}" ${canEnterMarks?"":"disabled"}></div>
  </div>
  <div class="actions">
   <button id="saveSelectedResult" class="btn primary" ${canEnterMarks?"":"disabled"}>Save Result</button>
   <button id="printTeacherResults" class="btn secondary">Print Official Report Card</button>
  </div>
  <p class="muted">Recorded by: ${esc(state.teacher.name)} · Staff ID: ${esc(state.teacher.staffId)} · Teacher</p>
 </section>
 <section class="panel"><h3>My Class Results</h3><div class="table-wrap"><table><thead><tr><th>Photo</th><th>Student</th><th>Student ID</th><th>Subject</th><th>Class</th><th>Class Score</th><th>Exam Score</th><th>Total</th><th>Position</th><th>Remarks</th><th>Edit</th><th>Delete</th></tr></thead><tbody>${classRows.map(rr=>{const rowSid=String(rr["Student ID"]||"").trim(),s=studentById(rowSid);if(!s)return"";const c=Number(rr["Class Score"]||0),e=Number(rr["Exam Score"]||0),canonical=teacherCanonicalSubject(rr.Subject),rid=String(rr["Result ID"]||"").trim();return`<tr><td>${photoCell(s)}</td><td>${esc(s.name)}</td><td>${esc(s.studentId)}</td><td>${esc(canonical)}</td><td>${esc(s.className)}</td><td>${c}</td><td>${e}</td><td>${Number(rr["Total Marks"]??(c+e))}</td><td>${esc(rr.Position||ranks.get(s.studentId)||"")}</td><td>${esc(rr.Remarks||"")}</td><td><button type="button" class="btn secondary result-edit-btn" data-result-id="${esc(rid)}">Edit</button></td><td><button type="button" class="btn danger result-delete-btn" data-result-id="${esc(rid)}">Delete</button></td></tr>`}).join("")||'<tr><td colspan="12" class="empty">No results saved for this class, academic year and term yet.</td></tr>'}</tbody></table></div></section>`:
 `<section class="panel"><div class="empty">No students are available in this assigned class.</div></section>`}`;

 [["rClass","trClass"],["rSubject","trSubject"],["rYear","trYear"],["rTerm","trTerm"],["rStudent","trStudent"]].forEach(([id,k])=>{
   const el=$("#"+id); if(el)el.onchange=async e=>{
     window[k]=e.target.value;
     if(id==="rClass")window.trStudent="";
     if(id==="rSubject"&&teacherResultKey(e.target.value)!=="other")window.trOtherSubject="";
     if(id==="rClass"||id==="rYear"||id==="rTerm"){
       delete teacherViewLoadPromises.results;
       try{await loadTeacherViewData("results")}catch(err){setStatus(err.message,true)}
     }
     renderResults();
   };
 });
 if($("#rOtherSubject"))$("#rOtherSubject").oninput=e=>{
   window.trOtherSubject=e.target.value;
   const typed=String(e.target.value||"").trim();
   const title=$("#resultEntryTitle");
   if(title)title.textContent=(typed||"Other")+" — Mark Entry";
 };
 const updateTotal=()=>{const c=Number($("#rClassScore")?.value||0),e=Number($("#rExamScore")?.value||0);if($("#rTotal"))$("#rTotal").value=c+e};
 if($("#rClassScore"))$("#rClassScore").oninput=updateTotal;
 if($("#rExamScore"))$("#rExamScore").oninput=updateTotal;
 if($("#saveSelectedResult"))$("#saveSelectedResult").onclick=()=>{
   const liveSubject=teacherSelectedResultSubject();
   saveResult(sid,cls,liveSubject,year,term);
 };
 document.querySelectorAll(".result-edit-btn").forEach(btn=>btn.onclick=()=>{
   const rid=String(btn.dataset.resultId||"").trim();
   const rr=state.results.find(x=>String(x["Result ID"]||"").trim()===rid);
   if(!rr)return;
   const editSubject=teacherCanonicalSubject(rr.Subject),official=resultSubjects().some(x=>teacherSubjectKey(x)===teacherSubjectKey(editSubject)&&teacherResultKey(x)!=="other");
   window.trClass=String(rr.Class||cls).trim();
   window.trStudent=String(rr["Student ID"]||"").trim();
   window.trYear=String(rr["Academic Year"]||year).trim();
   window.trTerm=String(rr.Term||term).trim();
   if(official){window.trSubject=editSubject;window.trOtherSubject=""}else{window.trSubject="Other";window.trOtherSubject=editSubject}
   renderResults();
   document.getElementById("resultEntryTitle")?.scrollIntoView({behavior:"smooth",block:"center"});
 });
 document.querySelectorAll(".result-delete-btn").forEach(btn=>btn.onclick=()=>deleteTeacherResult(String(btn.dataset.resultId||"").trim()));
 if($("#printTeacherResults"))$("#printTeacherResults").onclick=()=>printTeacherResults(sid,year,term);
}
let teacherResultSaveProgressTimer=null;
function teacherSetResultSaveProgress(value){
 const pct=Math.max(0,Math.min(100,Number(value)||0));
 const bar=document.getElementById("teacherResultSaveProgressBar"),text=document.getElementById("teacherResultSaveProgressText");
 if(bar)bar.style.width=pct+"%";if(text)text.textContent=pct+"%";
}
function teacherShowResultSaveLoader(message){
 teacherHideResultSaveLoader();
 const overlay=document.createElement("div");overlay.id="teacherResultSaveOverlay";overlay.className="teacher-fee-print-loader";
 overlay.innerHTML=`<div class="teacher-fee-print-loader-card" role="status" aria-live="polite"><div class="teacher-fee-print-loader-logo"><img src="../afisap_royal_academy_logo.png" alt="AFISAP Royal Academy"></div><strong>${esc(message||"Saving official result…")}</strong><div class="teacher-fee-print-progress-track"><span id="teacherResultSaveProgressBar"></span></div><div id="teacherResultSaveProgressText" class="teacher-fee-print-progress-text">10%</div><small>Please wait while the official Results record is saved.</small></div>`;
 document.body.appendChild(overlay);teacherSetResultSaveProgress(10);let progress=10;
 teacherResultSaveProgressTimer=setInterval(()=>{if(progress<90){progress+=10;teacherSetResultSaveProgress(progress)}},220);
}
function teacherHideResultSaveLoader(){
 if(teacherResultSaveProgressTimer){clearInterval(teacherResultSaveProgressTimer);teacherResultSaveProgressTimer=null}
 document.getElementById("teacherResultSaveOverlay")?.remove();
}
async function teacherFinishResultSaveLoader(){
 if(teacherResultSaveProgressTimer){clearInterval(teacherResultSaveProgressTimer);teacherResultSaveProgressTimer=null}
 teacherSetResultSaveProgress(100);await new Promise(r=>setTimeout(r,180));teacherHideResultSaveLoader();
}
function teacherMergeSavedResult(saved,positions){
 if(!saved||!saved["Result ID"])return;
 const id=String(saved["Result ID"]||"").trim();
 const next={...saved};
 const sid=String(next["Student ID"]||"").trim();
 if(positions&&positions[sid])next.Position=positions[sid];
 const index=state.results.findIndex(r=>String(r["Result ID"]||"").trim()===id);
 if(index>=0)state.results[index]=next;else state.results.push(next);
 if(positions){
   state.results=state.results.map(r=>{const rsid=String(r["Student ID"]||"").trim();return positions[rsid]?{...r,Position:positions[rsid]}:r});
 }
}
async function saveResult(sid,cls,sub,year,term){
 // If "Other" is selected, always use the latest text currently typed by the teacher.
 const liveSubject=teacherResultKey(window.trSubject)==="other"
   ? String($("#rOtherSubject")?.value||window.trOtherSubject||"").trim()
   : String(sub||"").trim();
 if(teacherResultKey(window.trSubject)==="other")window.trOtherSubject=liveSubject;
 const student=studentById(sid),canonicalSubject=teacherCanonicalSubject(liveSubject);
 if(!student||student.className!==cls){setStatus("Unauthorized student access.",true);return}
 if(!canonicalSubject||teacherResultKey(canonicalSubject)==="other"){alert("When Subject is Other, please specify the actual subject name (for example ICT).");return}
 sub=canonicalSubject;
 const cs=Number($("#rClassScore")?.value),es=Number($("#rExamScore")?.value),remarks=$("#rRemarks")?.value||"",r=resultFor(sid,sub,year,term);
 if(!Number.isFinite(cs)||!Number.isFinite(es)||cs<0||cs>50||es<0||es>50){alert("Class Score and Exam Score must each be between 0 and 50.");return}
 setStatus("Saving result to the official Results records…");
 teacherShowResultSaveLoader("Saving result to Google Sheets…");
 try{
   const res=await writePayload("result",{studentId:sid,className:cls,subject:sub,academicYear:year,term,classScore:cs,examScore:es,remarks,resultId:r?.["Result ID"]||"",dateCreated:r?.["Date Created"]||""});
   if(!res?.success)throw new Error(res?.error||"Result save failed.");

   // The write response is authoritative: Google Sheets has already accepted
   // this exact record. Merge it immediately so My Class Results updates without
   // waiting for another slow Apps Script round trip.
   teacherMergeSavedResult(res.result||null,res.positions||null);
   await teacherFinishResultSaveLoader();
   renderResults();setStatus("");
   alert("Result saved successfully to the official Results records.");

   // Quietly reconcile with Google Sheets after the teacher can already see the
   // saved row. A slow refresh must not block or erase the confirmed save.
   delete teacherViewLoadPromises.results;
   loadTeacherViewData("results").then(()=>{if(state.view==="results")renderResults()}).catch(()=>{});
 }catch(e){
   teacherHideResultSaveLoader();
   setStatus(e.message,true);
 }
}
async function deleteTeacherResult(resultId){
 const id=String(resultId||"").trim();
 if(!id)return;
 const rr=state.results.find(x=>String(x["Result ID"]||"").trim()===id);
 if(!rr){setStatus("Result record could not be found.",true);return}
 const studentName=studentById(String(rr["Student ID"]||"").trim())?.name||String(rr["Student Name"]||"this student");
 const subject=teacherCanonicalSubject(rr.Subject)||"this subject";
 if(!confirm(`Delete ${subject} result for ${studentName}? This will also delete the official result from Google Sheets.`))return;
 teacherShowResultSaveLoader("Deleting result from Google Sheets…");
 try{
   const res=await writePayload("deleteresult",{resultId:id});
   if(!res?.success)throw new Error(res?.error||"Result delete failed.");
   state.results=state.results.filter(x=>String(x["Result ID"]||"").trim()!==id);
   const positions=res.positions||{};
   if(positions&&typeof positions==="object")state.results=state.results.map(x=>{const xsid=String(x["Student ID"]||"").trim();return positions[xsid]?{...x,Position:positions[xsid]}:x});
   await teacherFinishResultSaveLoader();
   renderResults();setStatus("");
   delete teacherViewLoadPromises.results;
   loadTeacherViewData("results").then(()=>{if(state.view==="results")renderResults()}).catch(()=>{});
 }catch(e){teacherHideResultSaveLoader();setStatus(e.message||"Unable to delete result.",true)}
}

function teacherReportFormatDate(value){
 const raw=String(value||"").trim();if(!raw)return"";
 let y=0,mo=0,d=0;
 const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(iso){
   y=Number(iso[1]);mo=Number(iso[2]);d=Number(iso[3]);
 }else{
   const parsed=new Date(raw);
   if(Number.isNaN(parsed.getTime()))return raw
     .replace(/\s*00:00:00\s*GMT[+-]\d{4}\s*\([^)]*\)\s*/gi,"")
     .trim();
   y=parsed.getUTCFullYear();mo=parsed.getUTCMonth()+1;d=parsed.getUTCDate();
 }
 if(!y||mo<1||mo>12||d<1||d>31)return"";
 const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
 const mod=d%100,suf=(mod>=11&&mod<=13)?"th":({1:"st",2:"nd",3:"rd"}[d%10]||"th");
 return d+suf+" "+months[mo-1]+" "+y
}
function teacherReportNoOnRoll(student){
 const raw=String(student?.noOnRoll??"").trim();
 const n=Number(raw);
 if(Number.isInteger(n)&&n>=0&&n<=10000)return String(n);
 return String(state.students.filter(s=>s.className===student.className).length);
}
function teacherReportDateStorageKey(year,term){
 const staffId=String(state.teacher?.staffId||"").trim();
 return "afisapTeacherReportDates:"+staffId+":"+String(year||"").trim()+"|"+String(term||"").trim();
}
function teacherReportDates(year,term){
 const key=String(year||"").trim()+"|"+String(term||"").trim();
 const adminDates=state.reportCardDates?.[key]||{vacationDate:"",openingDate:""};
 return {vacationDate:String(adminDates.vacationDate||"").trim(),openingDate:String(adminDates.openingDate||"").trim()};
}
function teacherSaveReportDates(year,term,vacationDate,openingDate){
 return teacherReportDates(year,term);
}
function teacherReportOverallRemark(total,max){return max?(total/max>=.8?"Very Good (2)":total/max>=.7?"Good (3)":"Needs Improvement"):"Needs Improvement"}
async function ensureTeacherReportPhoto(student){
 if(!student)return"";const sid=String(student.studentId||"");if(state.photos[sid])return state.photos[sid];
 try{const r=await api("studentphoto",{staffId:state.teacher.staffId,studentId:sid});if(r?.success&&r.fileData){state.photos[sid]=`data:${r.mimeType||"image/jpeg"};base64,${r.fileData}`;return state.photos[sid]}}catch(e){}
 return""
}
function teacherWaitForPrintImages(doc,timeout=12000){
 const images=[...doc.images];
 return Promise.race([
   Promise.all(images.map(img=>img.complete&&img.naturalWidth>0?Promise.resolve():new Promise(resolve=>{img.addEventListener("load",resolve,{once:true});img.addEventListener("error",resolve,{once:true})}))),
   new Promise(resolve=>setTimeout(resolve,timeout))
 ]);
}
async function teacherBuildOfficialReportHtml(student,year,term){
 if(!student)return"";
 if(!classes().some(c=>String(c).trim().toLowerCase()===String(student.className||"").trim().toLowerCase()))throw new Error("Unauthorized student access.");

 const subjectList=teacherReportSubjectsForStudent(student.studentId,year,term),canonicalResults=canonicalResultsForStudent(student.studentId,year,term);
 const historicalClass=canonicalResults.map(r=>String(r.Class||r["Class"]||"").trim()).find(Boolean)||"";
 const promotionYearMatch=String(student.promotionAcademicYear||"").trim()===String(year||"").trim();
 const cls=historicalClass||(promotionYearMatch?String(student.previousClass||"").trim():"")||student.className;
 const ranks=academicRankMap(cls,year,term),overallPosition=ranks.get(student.studentId)||canonicalResults.find(r=>r.Position)?.Position||"—";
 const numericRank=String(overallPosition).match(/\d+/)?.[0]||"";
 const total=canonicalResults.reduce((sum,r)=>sum+Number(r["Total Marks"]??(Number(r["Class Score"]||0)+Number(r["Exam Score"]||0))),0),max=subjectList.filter(subject=>teacherResultKey(subject)!=="other").length*100;
 const rows=subjectList.map(sub=>{
   const r=resultFor(student.studentId,sub,year,term),cs=r?.["Class Score"]??"",es=r?.["Exam Score"]??"",t=r?Number(r["Total Marks"]??(Number(cs||0)+Number(es||0))):"";
   return `<tr><td>${esc(sub)}</td><td>${esc(cs)}</td><td>${esc(es)}</td><td>${esc(t)}</td><td>${r?esc(overallPosition):""}</td><td>${esc(r?.Remarks||"")}</td></tr>`
 }).join("");

 const att=state.attendance.filter(a=>String(a["Student ID"]||"")===student.studentId&&String(a["Attendance Date"]||a.Date||"").trim()),recordedPresentDays=teacherAttendancePresentDates(student.studentId).length,presentDays=teacherAttendanceReportOverride(student.studentId,year,term)??recordedPresentDays,markedDays=teacherAttendanceFinalOutOf(student.studentId,year,term);
 const fees=state.reportFees.filter(f=>teacherFeeIdKey(teacherFeeStudentId(f))===teacherFeeIdKey(student.studentId)&&teacherFeePeriodMatches(f,year,term));
 const feeRows=fees.map(f=>{
   const amount=Number(f["Amount Due"]||f["Fee Amount"]||f.Amount||0);
   const exactFeeItem=teacherFeeItemName(f);
   return `<tr><td>${esc(exactFeeItem||"Unspecified Fee Item")}</td><td>GHS ${(Number.isFinite(amount)?amount:0).toFixed(2)}</td></tr>`;
 }).join("");
 const feeTotal=fees.reduce((s,f)=>s+(Number.isFinite(Number(f["Amount Due"]||0))?Number(f["Amount Due"]||0):0),0);
 const photo=await ensureTeacherReportPhoto(student),dates=teacherReportDates(year,term),termDisplay=String(term||"").replace(/^Term\s*/i,"").trim()||String(term||"");
 const logo=new URL("../afisap_royal_academy_logo.png",window.location.href).href,signature=new URL("../afisap_headmaster_signature.png",window.location.href).href,masterCss=new URL("../styles.css",window.location.href).href;
 const teacherRemarks=String(student.teacherRemarks||"").trim();
 const promotionStatus=String(student.promotionStatus||"").trim().toLowerCase(),promotionTerm3=/^(term\s*3|3|third\s*term)$/i.test(String(term||"").trim());
 const reportPromotedTo=(promotionYearMatch&&promotionTerm3&&["pending","applied"].includes(promotionStatus))?String(student.promotedTo||"").trim():"";
 const reportNoOnRoll=historicalClass?new Set((state.results||[]).filter(r=>String(r["Academic Year"]||"").trim()===String(year||"").trim()&&String(r.Term||r["Term"]||"").trim().toLowerCase().replace(/\s+/g,"")===String(term||"").trim().toLowerCase().replace(/\s+/g,"")&&String(r.Class||r["Class"]||"").trim().toLowerCase()===String(cls||"").toLowerCase()).map(r=>String(r["Student ID"]||"").trim()).filter(Boolean)).size:teacherReportNoOnRoll(student);
 const html=`<div class="report-print-sheet afisap-official-report-card">
   <img class="report-card-watermark" src="${logo}" alt="" aria-hidden="true">${numericRank?`<div class="report-position-watermark" aria-hidden="true">${esc(numericRank)}</div>`:""}
   <div class="official-report-header"><img class="official-report-logo" src="${logo}" alt="AFISAP Royal Academy"><div class="official-report-school"><h1>${esc(state.school.name||"AFISAP ROYAL ACADEMY")}</h1><div class="official-report-motto">${esc(state.school.motto||"LEARNING TO LEARN")}</div><div class="official-report-phones">${esc(state.school.phone||"055 610 4186 / 024 272 7685 / 024 874 3558")}</div><div class="official-report-contact">${esc(state.school.email||"afisaproyalacademy@gmail.com")} &nbsp; | &nbsp; ${esc(state.school.website||"www.afisaproyalacademy.com")}</div></div><div class="official-report-student-photo report-photo">${photo?`<img src="${photo}" alt="Student Passport Photo">`:'<span>No Photo</span>'}</div></div>
   <table class="official-report-period-table"><tr><th>Academic Year: <strong>${esc(year||state.school.academicYear||"")}</strong></th><th>Term: <strong>${esc(termDisplay)}</strong></th></tr><tr><td>Vacation Date: <strong>${esc(teacherReportFormatDate(dates.vacationDate)||"—")}</strong></td><td>Opening Date: <strong>${esc(teacherReportFormatDate(dates.openingDate)||"—")}</strong></td></tr></table>
   <table class="official-report-student-info"><tr><th colspan="4">Student &amp; Class Information</th></tr><tr><td class="official-label">Name:</td><td class="official-value official-student-name">${esc(student.name)}</td><td class="official-label">Roll No.:</td><td class="official-value">${esc(student.rollNo||"—")}</td></tr><tr><td class="official-label">Class:</td><td class="official-value">${esc(cls)}</td><td class="official-label">No. on Roll:</td><td class="official-value">${esc(reportNoOnRoll)}</td></tr><tr><td class="official-label">Student ID:</td><td class="official-value">${esc(student.studentId)}</td><td class="official-label">Gender:</td><td class="official-value">${esc(student.gender||"—")}</td></tr><tr><td class="official-label">Date of Birth:</td><td class="official-value">${esc(teacherReportFormatDate(student.dateOfBirth)||"—")}</td><td class="official-label">Admission Date:</td><td class="official-value">${esc(teacherReportFormatDate(student.admissionDate)||"—")}</td></tr><tr><td class="official-label">Guardian:</td><td class="official-value">${esc(student.guardian||"—")}</td><td class="official-label">Guardian Contact:</td><td class="official-value">${esc(student.guardianContact||"—")}</td></tr>${student.guardianEmail||student.address?`<tr><td class="official-label">${student.guardianEmail?'Guardian Email:':'Address:'}</td><td class="official-value">${esc(student.guardianEmail||student.address)}</td><td class="official-label">${student.guardianEmail&&student.address?'Address:':''}</td><td class="official-value">${esc(student.guardianEmail&&student.address?student.address:'')}</td></tr>`:""}</table>
   <table class="official-report-results"><thead><tr><th>Subject</th><th>Class Score</th><th>Exam Score</th><th>Total Marks</th><th>Position</th><th>Remarks</th></tr></thead><tbody>${rows}<tr class="official-overall-row"><th>OVERALL</th><td></td><td></td><th>${total}/${max}</th><th>Position: ${esc(overallPosition)}</th><th>${esc(teacherReportOverallRemark(total,max))}</th></tr></tbody></table>
   <div class="official-report-attendance-line"><span><b>ATTENDANCE MADE:</b> ${presentDays}</span><span><b>OUT OF:</b> ${markedDays}</span><span><b>PROMOTED TO:</b> ${esc(reportPromotedTo||"________________")}</span></div>
   <div class="official-report-remarks"><b>TEACHER'S REMARKS</b><div class="official-remark-line">${teacherRemarks?esc(teacherRemarks):'&nbsp;'}</div><div class="official-remark-line">&nbsp;</div></div>
   <table class="official-report-fees"><thead><tr><th colspan="2">FEES &amp; TEXTBOOKS</th></tr><tr><th>Fee Item</th><th>Amount</th></tr></thead><tbody>${feeRows||'<tr><td colspan="2">No outstanding fee items.</td></tr>'}${fees.length?`<tr><th>TOTAL</th><th>GHS ${feeTotal.toFixed(2)}</th></tr>`:""}</tbody></table>
   <div class="official-report-signatures"><div class="official-class-teacher-signature"><div class="official-signature-space"></div><div class="official-signature-line"></div><b>CLASS TEACHER'S SIGNATURE</b><div class="official-signature-name">${esc(state.teacher.name||"")}</div></div><div class="headmaster-signature-block"><img class="headmaster-signature-image" src="${signature}" alt="Headmaster Signature"><div class="headmaster-signature-line"></div><p class="headmaster-signature-title"><b>${esc(state.school.head||"HEAD OF SCHOOL")}</b><br>Head Of School</p></div></div>
   <div class="official-report-footer">AFISAP ROYAL ACADEMY &nbsp; • &nbsp; LEARNING TO LEARN</div><div class="report-actions"><button onclick="window.print()">Print Report</button></div>
 </div>`;
 return html;
}

async function openTeacherReportCards(studentIds,year,term,title="AFISAP Royal Academy Report Cards"){
 const ids=[...new Set((studentIds||[]).map(String).filter(Boolean))],students=ids.map(studentById).filter(Boolean);
 if(!students.length){alert("Select at least one authorized student.");return}
 const allowed=new Set(classes().map(x=>String(x).trim().toLowerCase()));
 if(students.some(s=>!allowed.has(String(s.className||"").trim().toLowerCase()))){alert("Unauthorized class report access.");return}
 setStatus(`Preparing ${students.length} official report card${students.length===1?"":"s"}…`);
 try{
  const reports=[];for(const student of students)reports.push(await teacherBuildOfficialReportHtml(student,year,term));
  const masterCss=new URL("../styles.css",window.location.href).href,w=window.open("","_blank","width=1000,height=900");
  if(!w)throw new Error("Please allow pop-ups to print report cards.");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="${masterCss}"><style>html,body{margin:0;padding:0;background:#eef2f6}body{padding:12px 0}.report-print-sheet.afisap-official-report-card{position:relative!important;overflow:hidden!important;margin:0 auto 12px!important}.report-card-watermark{position:absolute!important;left:50%!important;top:53%!important;transform:translate(-50%,-50%)!important;z-index:0!important;pointer-events:none!important}.official-report-student-photo{overflow:hidden!important;background:#f8f8f8!important}.official-report-student-photo img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important}.bulk-print-actions{text-align:center;padding:8px}.bulk-print-actions button{padding:10px 18px;border:0;border-radius:8px;background:#0b3a71;color:#fff;font-weight:700}@page{size:A4 portrait;margin:0}@media print{html,body{background:#fff!important;margin:0!important;padding:0!important}.bulk-print-actions{display:none!important}.report-print-sheet.afisap-official-report-card{margin:0!important;padding-top:3.5mm!important;break-after:page!important;page-break-after:always!important;break-inside:avoid!important;page-break-inside:avoid!important}.report-print-sheet.afisap-official-report-card:last-child{break-after:auto!important;page-break-after:auto!important}.afisap-official-report-card .official-report-header{margin-top:0!important}}</style></head><body><div class="bulk-print-actions"><button onclick="window.print()">Print Report${students.length===1?"":"s"}</button></div>${reports.join("")}</body></html>`);
  w.document.close();await teacherWaitForPrintImages(w.document,20000);if(w.document.fonts&&w.document.fonts.ready){try{await w.document.fonts.ready}catch(e){}}setStatus("");
 }catch(e){setStatus(e.message,true)}
}
async function printTeacherResults(sid,year,term){return openTeacherReportCards([sid],year,term,"AFISAP Royal Academy Report Card")}

function teacherAttendanceIsPresent(record){
 const value=record?.Present??record?.present??record?.Status??record?.status;
 const key=String(value??"").trim().toUpperCase();
 return record?.present===true||record?.Present===true||["YES","PRESENT","TRUE","1"].includes(key)
}
function teacherAttendanceRecordsForStudent(studentId){
 const sid=String(studentId||"").trim();
 return state.attendance.filter(record=>String(record?.["Student ID"]||record?.studentId||"").trim()===sid)
}
function teacherAttendancePresentDates(studentId){
 return [...new Set(
   teacherAttendanceRecordsForStudent(studentId)
     .filter(teacherAttendanceIsPresent)
     .map(record=>String(record?.["Attendance Date"]||record?.Date||record?.date||"").trim())
     .filter(Boolean)
 )].sort()
}
function teacherAttendanceReportOverride(studentId,year,term){
 const sid=String(studentId||"").trim(),wantedYear=String(year||"").trim(),wantedTerm=teacherTermKey(term);
 let value=null;
 teacherAttendanceRecordsForStudent(sid).forEach(record=>{
   const raw=String(record?.Present??record?.Status??"").trim();
   const m=raw.match(/^REPORT_DAYS:(\d+)\|([^|]*)\|(.+)$/i);
   if(!m)return;
   if(String(m[2]||"").trim()===wantedYear&&teacherTermKey(m[3])===wantedTerm)value=Number(m[1]);
 });
 return Number.isInteger(value)&&value>=0?value:null
}
function teacherAttendanceFinalDays(studentId,year,term){
 const override=teacherAttendanceReportOverride(studentId,year,term);
 return override===null?teacherAttendancePresentDates(studentId).length:override
}
function teacherAttendanceOutOfOverride(studentId,year,term){
 const sid=String(studentId||"").trim(),wantedYear=String(year||"").trim(),wantedTerm=teacherTermKey(term);
 let value=null;
 teacherAttendanceRecordsForStudent(sid).forEach(record=>{
   const raw=String(record?.Present??record?.Status??"").trim();
   const m=raw.match(/^OUT_OF_DAYS:(\d+)\|([^|]*)\|(.+)$/i);
   if(!m)return;
   if(String(m[2]||"").trim()===wantedYear&&teacherTermKey(m[3])===wantedTerm)value=Number(m[1]);
 });
 return Number.isInteger(value)&&value>=0?value:null
}
function teacherAttendanceCalculatedOutOf(studentId){
 const dates=[...new Set(
   teacherAttendanceRecordsForStudent(studentId)
     .map(record=>String(record?.["Attendance Date"]||record?.Date||record?.date||"").trim())
     .filter(Boolean)
 )];
 return dates.length;
}
function teacherAttendanceFinalOutOf(studentId,year,term){
 const override=teacherAttendanceOutOfOverride(studentId,year,term);
 return override===null?teacherAttendanceCalculatedOutOf(studentId):override
}

// Surgical attendance save loader. Reuses the same AFISAP loading appearance as Fees
// without changing attendance storage, report-card calculations, or other modules.
let teacherAttendanceSaveProgressTimer=null;
function teacherAttendanceShowSaveLoader(message){
 teacherAttendanceHideSaveLoader();
 const overlay=document.createElement("div");
 overlay.id="teacherAttendanceSaveLoader";
 overlay.className="teacher-fee-print-loader";
 overlay.innerHTML=`<div class="teacher-fee-print-loader-card" role="status" aria-live="polite"><div class="teacher-fee-print-loader-logo"><img src="../afisap_royal_academy_logo.png" alt="AFISAP Royal Academy"></div><strong>${esc(message||"Saving attendance update…")}</strong><div class="teacher-fee-print-progress-track"><span id="teacherAttendanceSaveProgressBar"></span></div><div id="teacherAttendanceSaveProgressText" class="teacher-fee-print-progress-text">10%</div><small>Please wait while the attendance record is updated.</small></div>`;
 document.body.appendChild(overlay);
 let progress=10;
 teacherAttendanceSaveProgressTimer=setInterval(()=>{
   if(progress<90){progress+=10;teacherAttendanceSetSaveProgress(progress)}
 },420);
}
function teacherAttendanceSetSaveProgress(value){
 const pct=Math.max(0,Math.min(100,Number(value)||0));
 const bar=$("#teacherAttendanceSaveProgressBar"),text=$("#teacherAttendanceSaveProgressText");
 if(bar)bar.style.width=pct+"%";
 if(text)text.textContent=pct+"%";
}
function teacherAttendanceHideSaveLoader(){
 if(teacherAttendanceSaveProgressTimer){clearInterval(teacherAttendanceSaveProgressTimer);teacherAttendanceSaveProgressTimer=null}
 $("#teacherAttendanceSaveLoader")?.remove();
}
async function teacherAttendanceCompleteSaveLoader(){
 if(teacherAttendanceSaveProgressTimer){clearInterval(teacherAttendanceSaveProgressTimer);teacherAttendanceSaveProgressTimer=null}
 teacherAttendanceSetSaveProgress(100);
 await new Promise(resolve=>setTimeout(resolve,240));
 teacherAttendanceHideSaveLoader();
}
function teacherAttendanceApplyLocalOverride(studentId,year,term,days,type){
 const sid=String(studentId||"").trim(),wantedYear=String(year||"").trim(),wantedTerm=teacherTermKey(term);
 const prefix=type==="outof"?"OUT_OF_DAYS:":"REPORT_DAYS:";
 state.attendance=(state.attendance||[]).filter(record=>{
   if(String(record?.["Student ID"]||"").trim()!==sid)return true;
   const raw=String(record?.Present??record?.Status??"").trim();
   if(!raw.toUpperCase().startsWith(prefix))return true;
   const m=raw.match(/^(?:REPORT_DAYS|OUT_OF_DAYS):(\d+)\|([^|]*)\|(.+)$/i);
   if(!m)return true;
   return !(String(m[2]||"").trim()===wantedYear&&teacherTermKey(m[3])===wantedTerm);
 });
 const marker=prefix+Number(days)+"|"+wantedYear+"|"+String(term||"").trim();
 state.attendance.push({"Student ID":sid,"Present":marker,"Status":marker,"Academic Year":wantedYear,"Term":String(term||"").trim()});
}
async function editTeacherAttendanceDays(studentId,year,term){
 const student=studentById(studentId);if(!student)return alert("Student not found.");
 const recorded=teacherAttendancePresentDates(studentId).length,current=teacherAttendanceFinalDays(studentId,year,term);
 const entered=prompt(`Recorded Days: ${recorded}\n\nReport Days (whole number 0 or greater):`,String(current));
 if(entered===null)return;
 const raw=String(entered).trim();
 if(!/^\d+$/.test(raw)){alert("Report Days must be a non-negative whole number (0, 1, 2, 3...).");return}
 const days=Number(raw);setStatus("Saving report attendance days to Google Sheets…");
 teacherAttendanceShowSaveLoader("Saving Report Days…");
 try{
   const r=await writePayload("attendanceReportDays",{studentId,className:student.className,academicYear:year,term,days});
   if(!r?.success)throw new Error(r?.error||"Unable to save Report Days.");
   // The server has already saved the authoritative Google Sheets record.
   // Reflect that successful value immediately in the current page instead of
   // re-downloading the whole Attendance section before the teacher can see it.
   teacherAttendanceApplyLocalOverride(studentId,year,term,days,"report");
   await teacherAttendanceCompleteSaveLoader();
   setStatus("");renderAttendance();
 }catch(e){teacherAttendanceHideSaveLoader();setStatus(e.message,true)}
}
async function editTeacherAttendanceOutOfDays(studentId,year,term){
 const student=studentById(studentId);if(!student)return alert("Student not found.");
 const calculated=teacherAttendanceCalculatedOutOf(studentId),current=teacherAttendanceFinalOutOf(studentId,year,term);
 const entered=prompt(`Calculated OUT OF Days: ${calculated}\n\nReport OUT OF Days (whole number 0 or greater):`,String(current));
 if(entered===null)return;
 const raw=String(entered).trim();
 if(!/^\d+$/.test(raw)){alert("OUT OF Days must be a non-negative whole number (0, 1, 2, 3...).");return}
 const days=Number(raw);setStatus("Saving report OUT OF days to Google Sheets…");
 teacherAttendanceShowSaveLoader("Saving OUT OF Days…");
 try{
   const r=await writePayload("attendanceOutOfDays",{studentId,className:student.className,academicYear:year,term,days});
   if(!r?.success)throw new Error(r?.error||"Unable to save OUT OF Days.");
   teacherAttendanceApplyLocalOverride(studentId,year,term,days,"outof");
   await teacherAttendanceCompleteSaveLoader();
   setStatus("");renderAttendance();
 }catch(e){teacherAttendanceHideSaveLoader();setStatus(e.message,true)}
}
function teacherAttendanceFormatDate(value){
 const raw=String(value||"").trim();
 const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 return match?`${match[3]}/${match[2]}/${match[1]}`:raw
}
function teacherAttendancePhotoMarkup(student,print=false){
 const photo=state.photos[String(student.studentId||"")];
 if(photo){
   return `<img class="${print?'student-print-photo':'attendance-student-photo'}" src="${photo}" alt="${esc(student.name||"Student")}">`
 }
 return print
   ? `<div class="student-print-photo student-print-photo-empty">No Photo</div>`
   : `<div class="photo-placeholder attendance-photo-placeholder" data-photo="${esc(student.studentId)}">👤</div>`
}
function renderAttendance(){
 const cls=window.taClass||classes()[0]||"",date=window.taDate||today(),year=window.taYear||state.school.academicYear||"2026/2027",term=window.taTerm||state.school.term||"Term 1";
 const list=state.students.filter(s=>s.className===cls);
 const recordRows=list.map(s=>{
   const dates=teacherAttendancePresentDates(s.studentId);
   return `<tr>
     <td>${teacherAttendancePhotoMarkup(s)}</td>
     <td>${esc(s.studentId)}</td>
     <td><strong>${esc(s.name)}</strong></td>
     <td>${esc(s.className)}</td>
     <td><strong>${dates.length} day${dates.length===1?"":"s"}</strong></td>
     <td><strong>${teacherAttendanceFinalDays(s.studentId,year,term)} day${teacherAttendanceFinalDays(s.studentId,year,term)===1?"":"s"}</strong><br><button class="btn secondary attendance-edit-days" data-sid="${esc(s.studentId)}" type="button">Edit Attendance Days</button></td>
     <td><strong>${teacherAttendanceFinalOutOf(s.studentId,year,term)} day${teacherAttendanceFinalOutOf(s.studentId,year,term)===1?"":"s"}</strong><br><button class="btn secondary attendance-edit-outof-days" data-sid="${esc(s.studentId)}" type="button">Edit OUT OF Days</button></td>
     <td>${dates.length?dates.map(teacherAttendanceFormatDate).join(", "):"—"}</td>
     <td>${esc(s.gender||"")}</td>
     <td>${esc(s.guardian||"")}</td>
     <td>${esc(s.guardianContact||"")}</td>
   </tr>`
 }).join("");

 $("#app").innerHTML=`<section class="welcome"><h2>✓ Attendance</h2><p>Uses the same Student Attendance records seen by Admin and Parent Portal.</p></section>
 <section class="panel">
   <div class="filters">
     <div class="control"><label>Assigned Class</label><select id="aClass">${opts(classes(),cls)}</select></div>
     <div class="control"><label>Date</label><input id="aDate" type="date" value="${esc(date)}"></div>
     <div class="control"><label>Academic Year</label><select id="aYear">${opts(academicYears(),year)}</select></div>
     <div class="control"><label>Term</label><select id="aTerm">${opts(termOptions(),term)}</select></div>
   </div>
   <div class="actions">
     <button id="allPresent" class="btn primary">✓ MARK ALL PRESENT</button>
     <button id="clearAll" class="btn secondary">CLEAR ALL</button>
     <button id="saveAttendance" class="btn primary">Save Attendance</button>
   </div>
 </section>

 <section class="panel">
   <h3>Mark Attendance</h3>
   <div class="table-wrap"><table>
     <thead><tr><th>Passport Photo</th><th>Student ID</th><th>Name</th><th>Class</th><th>Present</th><th>Status</th></tr></thead>
     <tbody>${list.map(s=>{const a=attendanceFor(s.studentId,date),present=a?teacherAttendanceIsPresent(a):false;return`<tr><td>${teacherAttendancePhotoMarkup(s)}</td><td>${esc(s.studentId)}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.className)}</td><td><input class="check attendance-check" data-sid="${esc(s.studentId)}" type="checkbox"${present?" checked":""}></td><td class="att-status">${present?"PRESENT":"ABSENT"}</td></tr>`}).join("")||'<tr><td colspan="6" class="empty">No students found in this assigned class.</td></tr>'}</tbody>
   </table></div>
 </section>

 <section class="panel">
   <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
     <h3 style="margin:0">Attendance Records</h3>
     <button id="printTeacherAttendance" class="btn primary" type="button" title="Print Student Attendance Sheet">
       <span aria-hidden="true" style="display:inline-flex;vertical-align:middle;margin-right:6px">
         <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
           <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6zM17 12h.01"/>
         </svg>
       </span>
       PRINT ATTENDANCE
     </button>
   </div>
   <div class="table-wrap" style="margin-top:12px"><table>
     <thead><tr><th>Passport Photo</th><th>Student ID</th><th>Name</th><th>Class</th><th>Recorded Days</th><th>Report Days</th><th>OUT OF Days</th><th>Present Dates</th><th>Gender</th><th>Guardian</th><th>Contact</th></tr></thead>
     <tbody>${recordRows||'<tr><td colspan="11" class="empty">No student records available.</td></tr>'}</tbody>
   </table></div>
 </section>`;

 [["aClass","taClass"],["aDate","taDate"],["aYear","taYear"],["aTerm","taTerm"]].forEach(([id,k])=>{
   const el=$("#"+id);if(el)el.onchange=async e=>{
     window[k]=e.target.value;
     if(id==="aClass"||id==="aYear"||id==="aTerm"){
       delete teacherViewLoadPromises.attendance;
       try{await loadTeacherViewData("attendance")}catch(err){setStatus(err.message,true)}
     }
     renderAttendance();
   }
 });
 document.querySelectorAll(".attendance-check").forEach(c=>c.onchange=e=>e.target.closest("tr").querySelector(".att-status").textContent=e.target.checked?"PRESENT":"ABSENT");
 $("#allPresent")?.addEventListener("click",()=>{document.querySelectorAll(".attendance-check").forEach(c=>{c.checked=true;c.closest("tr").querySelector(".att-status").textContent="PRESENT"})});
 $("#clearAll")?.addEventListener("click",()=>{document.querySelectorAll(".attendance-check").forEach(c=>{c.checked=false;c.closest("tr").querySelector(".att-status").textContent="ABSENT"})});
 $("#saveAttendance")?.addEventListener("click",()=>saveAttendance(cls,date,year,term));
 $("#printTeacherAttendance")?.addEventListener("click",()=>printTeacherAttendance(cls));
 document.querySelectorAll(".attendance-edit-days").forEach(btn=>btn.addEventListener("click",()=>editTeacherAttendanceDays(btn.dataset.sid,year,term)));
 document.querySelectorAll(".attendance-edit-outof-days").forEach(btn=>btn.addEventListener("click",()=>editTeacherAttendanceOutOfDays(btn.dataset.sid,year,term)));
}
async function saveAttendance(cls,date,year,term){
 const records=[...document.querySelectorAll(".attendance-check")].map(c=>({studentId:c.dataset.sid,present:c.checked}));
 if(!date){alert("Please select an attendance date.");return}
 if(!records.length){alert("No students are available in this assigned class.");return}
 setStatus("Saving attendance to Google Sheets…");
 try{
   const r=await writePayload("attendance",{className:cls,date,academicYear:year,term,records});
   if(!r?.success)throw new Error(r?.error||"Attendance save failed.");
   await refreshData();
   const present=records.filter(x=>x.present).length;
   const absent=records.length-present;
   setStatus("");
   alert(`Attendance saved successfully to the existing Student Attendance records.\n\nPresent: ${present}\nAbsent: ${absent}`);
 }catch(e){setStatus(e.message,true)}
}
async function printTeacherAttendance(cls){
 const list=state.students.filter(s=>s.className===cls);
 if(!list.length){alert("No students are available in this assigned class.");return}
 setStatus("Preparing attendance print preview…");
 try{
   await Promise.all(list.map(s=>ensureTeacherReportPhoto(s)));
   const rows=list.map(s=>{
     const dates=teacherAttendancePresentDates(s.studentId);
     return `<tr>
       <td>${teacherAttendancePhotoMarkup(s,true)}</td>
       <td><strong>${esc(s.studentId)}</strong></td>
       <td>${esc(s.name)}</td>
       <td>${esc(s.className)}</td>
       <td class="student-print-total"><strong>${dates.length} day${dates.length===1?"":"s"}</strong></td>
       <td class="student-print-dates">${dates.length?dates.map(teacherAttendanceFormatDate).join("<br>"):"—"}</td>
       <td>${esc(s.gender||"")}</td>
       <td>${esc(s.guardian||"")}</td>
       <td>${esc(s.guardianContact||"")}</td>
     </tr>`
   }).join("");
   const logo=new URL("../afisap_royal_academy_logo.png",window.location.href).href;
   const css=new URL("../styles.css",window.location.href).href;
   const printed=new Date().toLocaleDateString("en-GB");
   const w=window.open("","_blank","width=1280,height=900");
   if(!w)throw new Error("Please allow pop-ups to print the attendance sheet.");
   w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFISAP Royal Academy - Student Attendance Sheet</title><link rel="stylesheet" href="${css}">
   <style>
   @page{size:A4 landscape;margin:8mm}
   html,body{margin:0!important;padding:0!important;background:#fff!important}
   body{font-family:Arial,Helvetica,sans-serif;color:#17243b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
   .student-print-preview{display:block!important;position:relative!important;width:100%!important;box-sizing:border-box!important;padding:0!important;margin:0!important;background:#fff!important;color:#17243b!important;overflow:visible!important}
   .student-print-preview-head{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:18px!important;padding:0 0 12px!important;border-bottom:3px solid #d7aa08!important;text-align:center!important}
   .student-print-logo{display:block!important;flex:0 0 78px!important;width:78px!important;height:78px!important;object-fit:contain!important}
   .student-print-school-details{flex:1!important;text-align:center!important}
   .student-print-meta{display:flex!important;justify-content:space-between!important;gap:12px!important;padding:12px 0!important;font-size:12px!important;flex-wrap:wrap!important}
   .student-print-table{width:100%!important;border-collapse:collapse!important;font-size:10.5px!important}
   .student-print-table th,.student-print-table td{border:1px solid #cfd5dd!important;padding:6px!important;vertical-align:middle!important}
   .student-print-table th{background:#172b4d!important;color:#fff!important;text-align:center!important;white-space:nowrap!important}
   .student-print-photo{width:52px!important;height:62px!important;object-fit:cover!important;border:1px solid #cfd5dd!important;border-radius:4px!important;display:block!important;margin:auto!important}
   .student-print-photo-empty{display:flex!important;align-items:center!important;justify-content:center!important;background:#f1f3f5!important;color:#667085!important;font-size:9px!important}
   .student-print-watermark{position:absolute!important;left:50%!important;top:53%!important;width:260px!important;height:260px!important;object-fit:contain!important;transform:translate(-50%,-50%)!important;opacity:.075!important;z-index:0!important;pointer-events:none!important}
   .student-print-preview>*:not(.student-print-watermark){position:relative!important;z-index:2!important}
   .student-print-footer{margin-top:16px!important;font-size:10px!important;color:#4b5563!important}
   .student-print-signatures{display:flex!important;justify-content:space-between!important;gap:25px!important;margin-top:30px!important;color:#17243b!important}
   .print-actions{text-align:center;padding:10px}.print-actions button{padding:10px 18px;background:#0b3a71;color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer}
   @media print{.print-actions{display:none!important}}
   </style></head><body>
   <div class="print-actions"><button onclick="window.print()">PRINT ATTENDANCE SHEET</button></div>
   <div class="student-print-preview">
     <img src="${logo}" alt="" aria-hidden="true" class="student-print-watermark">
     <div class="student-print-preview-head">
       <img src="${logo}" alt="AFISAP Royal Academy" class="student-print-logo">
       <div class="student-print-school-details">
         <h2>AFISAP ROYAL ACADEMY</h2>
         <h3>STUDENT ATTENDANCE SHEET</h3>
         <p>Complete attendance record for registered students</p>
         <p class="student-print-contact">
           <span><b>Website:</b> ${esc(state.school.website||"www.afisaproyalacademy.com")}</span>
           <span><b>Email:</b> ${esc(state.school.email||"afisaproyalacademy@gmail.com")}</span>
           <span><b>Phone:</b> ${esc(state.school.phone||"0556104186 / 0242727685 / 0248743558")}</span>
         </p>
       </div>
     </div>
     <div class="student-print-meta">
       <span><b>School:</b> ${esc(state.school.name||"AFISAP Royal Academy")}</span>
       <span><b>Report:</b> Student Attendance Totals</span>
       <span><b>Class:</b> ${esc(cls)}</span>
       <span><b>Printed:</b> ${esc(printed)}</span>
     </div>
     <div class="student-print-table-wrap"><table class="student-print-table">
       <thead><tr><th>Passport Photo</th><th>Student ID</th><th>Name</th><th>Class</th><th>Total Attendance</th><th>Present Dates</th><th>Gender</th><th>Guardian</th><th>Contact</th></tr></thead>
       <tbody>${rows}</tbody>
     </table></div>
     <div class="student-print-footer">
       <p><b>Note:</b> Total Attendance counts each date on which the student was marked YES. Present Dates lists every recorded date the student attended school.</p>
       <div class="student-print-signatures"><span>Teacher's Signature: ______________________________</span><span>Head of School: _________________________________________</span></div>
     </div>
   </div></body></html>`);
   w.document.close();
   await teacherWaitForPrintImages(w.document,20000);
   if(w.document.fonts&&w.document.fonts.ready){try{await w.document.fonts.ready}catch(e){}}
   setStatus("");
 }catch(e){setStatus(e.message,true)}
}
function teacherPromotionSelectedTerm(){
 return String(window.trTerm||state.school.term||"").trim()
}
function teacherPromotionTerm3(){
 return teacherTermKey(teacherPromotionSelectedTerm())==="term3"
}
function teacherPromotionNextClass(current){
 const wanted=String(current||"").trim().toLowerCase();
 const idx=AFISAP_TEACHER_PROMOTION_CLASSES.findIndex(c=>c.toLowerCase()===wanted);
 return idx>=0&&idx<AFISAP_TEACHER_PROMOTION_CLASSES.length-1?AFISAP_TEACHER_PROMOTION_CLASSES[idx+1]:""
}
function teacherPromotionDestination(current){
 return teacherPromotionNextClass(current)||String(window.teacherPromotionCustomDestination||"").trim()
}
function teacherPromotionSelectedIds(){
 return [...document.querySelectorAll(".teacher-promotion-check:checked")].map(x=>String(x.dataset.sid||"")).filter(Boolean)
}
function teacherUpdatePromotionCounts(className){
 const all=[...document.querySelectorAll(".teacher-promotion-check")],selected=all.filter(x=>x.checked).length;
 const box=$("#teacherPromotionCounts");
 if(box)box.innerHTML=`<strong>${all.length}</strong> student${all.length===1?"":"s"} in class &nbsp; · &nbsp; <strong>${selected}</strong> recommended for promotion &nbsp; · &nbsp; <strong>${Math.max(0,all.length-selected)}</strong> will remain in ${esc(className)}`;
}
function teacherRenderPromotionWorkspace(className){
 const box=$("#teacherPromotionWorkspace"),nextBox=$("#teacherPromotionNext");if(!box)return;
 const students=state.students.filter(s=>String(s.className||"").trim().toLowerCase()===String(className||"").trim().toLowerCase());
 const automaticNext=teacherPromotionNextClass(className),availableClasses=[...new Set((state.schoolClasses||[]).map(n=>String(n||"").trim()).filter(Boolean))];
 const suggested=availableClasses.find(n=>String(n).toLowerCase()===String(automaticNext).toLowerCase())||"";
 const next=String(window.teacherPromotionCustomDestination||suggested||"").trim(),allowed=teacherPromotionTerm3();
 const destinationOptions=availableClasses.filter(n=>String(n).toLowerCase()!==String(className).toLowerCase()).map(n=>`<option value="${esc(n)}"${String(n).toLowerCase()===String(next).toLowerCase()?" selected":""}>${esc(n)}</option>`).join("");
 const destinationHint=suggested?`<small style="display:block;margin-top:5px">Suggested next class: <b>${esc(suggested)}</b>. You may select another class created by the Administrator.</small>`:`<small style="display:block;margin-top:5px">Select the correct destination from the classes created by the Administrator.</small>`;
 if(nextBox)nextBox.innerHTML=`<label><strong>Destination Class:</strong> <select id="teacherPromotionCustomDestination"><option value="">Select destination class</option>${destinationOptions}</select></label>${destinationHint}`;
 if(!allowed){
   box.innerHTML=`<div class="notice">Student promotion recommendations are available during Term 3 only. Selected Results &amp; Marks term: <strong>${esc(teacherPromotionSelectedTerm()||"Not set")}</strong>.<br><small>Go to Results &amp; Marks and select Term 3 to enable promotion recommendations.</small></div>`;
   return
 }
 if(!next){
   box.innerHTML=`<div class="notice">Select the destination class above before recommending students for promotion.</div>`;
   const dest=$("#teacherPromotionCustomDestination");if(dest)dest.onchange=e=>{window.teacherPromotionCustomDestination=e.target.value;teacherRenderPromotionWorkspace(className)};
   return
 }
 box.innerHTML=`<div class="teacher-promotion-summary"><strong>${students.length}</strong> student${students.length===1?"":"s"} in ${esc(className)}<span>Tick students to <b>PROMOTE to ${esc(next)}</b>. Any student left unticked when you save will be recorded as <b>REPEAT ${esc(className)}</b>. Active classes do not change until Admin rollover.</span></div>
 <div class="actions"><button id="teacherPromotionSelectAll" class="btn secondary" type="button">Select All</button><button id="teacherPromotionClearAll" class="btn secondary" type="button">Clear All</button><button id="teacherPromotionEntire" class="btn primary" type="button">Recommend Entire Class</button></div>
 <div id="teacherPromotionCounts" class="teacher-promotion-counts"></div>
 <div class="teacher-promotion-list">${students.map(s=>{const status=String(s.promotionStatus||"").toLowerCase(),pending=status==="pending"&&String(s.promotedTo||"").toLowerCase()===String(next||"").toLowerCase(),repeat=status==="repeat"&&String(s.promotionAcademicYear||"").trim()===String(window.trYear||state.school.academicYear||"").trim();return `<label class="teacher-promotion-student"><input type="checkbox" class="teacher-promotion-check" data-sid="${esc(s.studentId)}" ${pending?"checked":""}><span class="teacher-promotion-photo">${photoCell(s)}</span><span class="teacher-promotion-details"><b>${esc(s.name)}</b>${pending?` <span class="chip">PROMOTE • PENDING</span>`:repeat?` <span class="chip">REPEAT</span>`:""}<small>Student ID: ${esc(s.studentId)} · Current Class: ${esc(s.className)} · Roll No.: ${esc(s.rollNo||"—")}${s.gender?` · ${esc(s.gender)}`:""}</small></span></label>`}).join("")||'<div class="empty">No students are currently in this assigned class.</div>'}</div>
 ${students.length?'<div class="actions"><button id="teacherPromotionSelected" class="btn primary" type="button">SAVE PROMOTION RECOMMENDATIONS</button></div>':""}`;
 const customDest=$("#teacherPromotionCustomDestination");if(customDest)customDest.onchange=e=>{window.teacherPromotionCustomDestination=e.target.value;teacherRenderPromotionWorkspace(className)};
 document.querySelectorAll(".teacher-promotion-check").forEach(x=>x.addEventListener("change",()=>teacherUpdatePromotionCounts(className)));
 $("#teacherPromotionSelectAll")?.addEventListener("click",()=>{document.querySelectorAll(".teacher-promotion-check").forEach(x=>x.checked=true);teacherUpdatePromotionCounts(className)});
 $("#teacherPromotionClearAll")?.addEventListener("click",()=>{document.querySelectorAll(".teacher-promotion-check").forEach(x=>x.checked=false);teacherUpdatePromotionCounts(className)});
 $("#teacherPromotionEntire")?.addEventListener("click",()=>teacherConfirmPromotion(className,next,students.map(s=>s.studentId),true));
 $("#teacherPromotionSelected")?.addEventListener("click",()=>teacherConfirmPromotion(className,next,teacherPromotionSelectedIds(),false));
 teacherUpdatePromotionCounts(className);hydratePhotos()
}

let teacherPromotionProgressTimer=null;
function teacherShowPromotionLoader(message){
 teacherHidePromotionLoader();
 const overlay=document.createElement("div");overlay.id="teacherPromotionLoader";overlay.className="teacher-fee-print-loader";
 overlay.innerHTML=`<div class="teacher-fee-print-loader-card" role="status" aria-live="polite"><div class="teacher-fee-print-loader-logo"><img src="../afisap_royal_academy_logo.png" alt="AFISAP Royal Academy"></div><strong>${esc(message||"Saving promotion recommendations…")}</strong><div class="teacher-fee-print-progress-track"><span id="teacherPromotionProgressBar"></span></div><div id="teacherPromotionProgressText" class="teacher-fee-print-progress-text">10%</div><small>Please wait while the promotion recommendation is saved.</small></div>`;
 document.body.appendChild(overlay);teacherSetPromotionProgress(10);let progress=10;
 teacherPromotionProgressTimer=setInterval(()=>{if(progress<90){progress+=10;teacherSetPromotionProgress(progress)}},220);
}
function teacherSetPromotionProgress(value){const n=Math.max(0,Math.min(100,Number(value)||0)),bar=$("#teacherPromotionProgressBar"),label=$("#teacherPromotionProgressText");if(bar)bar.style.width=n+"%";if(label)label.textContent=n+"%"}
function teacherHidePromotionLoader(){if(teacherPromotionProgressTimer){clearInterval(teacherPromotionProgressTimer);teacherPromotionProgressTimer=null}document.getElementById("teacherPromotionLoader")?.remove()}
async function teacherFinishPromotionLoader(){if(teacherPromotionProgressTimer){clearInterval(teacherPromotionProgressTimer);teacherPromotionProgressTimer=null}teacherSetPromotionProgress(100);await new Promise(r=>setTimeout(r,180));teacherHidePromotionLoader()}
async function teacherConfirmPromotion(currentClass,nextClass,studentIds,entireClass){
 const ids=[...new Set((studentIds||[]).map(String).filter(Boolean))];
 const reviewedIds=(state.students||[]).filter(s=>String(s.className||"").trim().toLowerCase()===String(currentClass||"").trim().toLowerCase()).map(s=>String(s.studentId||"")).filter(Boolean);
 if(!reviewedIds.length){alert("There are no students in this class to review.");return}
 const repeatedCount=Math.max(0,reviewedIds.length-ids.length);
 const message=entireClass
   ?`Recommend all ${ids.length} ${currentClass} student${ids.length===1?"":"s"} for ${nextClass}?\n\nTheir active class will NOT change now. The Administrator will move approved students together during the new academic-year rollover.`
   :`Save the Term 3 promotion decisions for ${reviewedIds.length} student${reviewedIds.length===1?"":"s"}?\n\nPROMOTE to ${nextClass}: ${ids.length}\nREPEAT ${currentClass}: ${repeatedCount}\n\nTheir active classes will NOT change now.`;
 if(!confirm(message))return;
 setStatus("Saving promotion recommendations without changing active classes…");
 teacherShowPromotionLoader(entireClass?"Saving entire-class promotion recommendations…":"Saving promotion recommendation(s)…");
 try{
   const r=await writePayload("promotion",{currentClass,newClass:nextClass,studentIds:ids,reviewedStudentIds:reviewedIds,academicYear:window.trYear||state.school.academicYear||"",term:teacherPromotionSelectedTerm()});
   if(!r?.success)throw new Error(r?.error||"Promotion recommendations were not saved.");
   const promotedSet=new Set((r.promotedStudentIds||ids).map(String));
   const reviewedSet=new Set(reviewedIds.map(String));
   state.students=(state.students||[]).map(st=>{const sid=String(st.studentId||"");if(promotedSet.has(sid))return {...st,promotedTo:nextClass,promotionStatus:"pending",promotionAcademicYear:window.trYear||state.school.academicYear||"",previousClass:currentClass};if(reviewedSet.has(sid))return {...st,promotedTo:currentClass,promotionStatus:"repeat",promotionAcademicYear:window.trYear||state.school.academicYear||"",previousClass:currentClass};return st;});
   await teacherFinishPromotionLoader();
   setStatus("");
   renderClasses();
   alert(`Promotion decisions saved successfully.\n\nPromote to ${nextClass}: ${r.promoted??ids.length}\nRepeat ${currentClass}: ${r.repeated??repeatedCount}\n\nAll students remain active in ${currentClass} until the Administrator applies the new academic-year rollover.`);
 }catch(e){teacherHidePromotionLoader();setStatus(e.message,true);alert("Promotion recommendation was not saved.\n\n"+(e?.message||e))}
}

function renderClasses(){
 const assigned=classes(),selected=window.teacherPromotionClass&&assigned.includes(window.teacherPromotionClass)?window.teacherPromotionClass:(assigned[0]||"");
 $("#app").innerHTML=`<section class="welcome"><h2>📚 Classes &amp; Subjects</h2><p>Assignments are controlled by Admin teacher/staff records.</p></section>
 <section class="panel"><h3>My Classes</h3>${assigned.map(c=>`<div class="post-card"><h4>${esc(c)}</h4><small>Students: ${state.students.filter(s=>s.className===c).length}</small></div>`).join("")||"<div class=empty>No classes assigned.</div>"}</section>
 <section class="panel"><h3>My Subjects</h3>${pills(subjects())}</section>
 <section class="panel teacher-promotion-panel"><h3>Student Promotion Recommendation</h3><p class="muted">Promotion recommendations are enabled when <strong>Term 3</strong> is selected in Results &amp; Marks. Current selected term: <strong>${esc(teacherPromotionSelectedTerm()||"Not set")}</strong>. Recommended students remain in their current class until the Administrator applies the new academic-year rollover. Teacher assignments do not move.</p>
   ${assigned.length?`<div class="filters"><div class="control"><label>Select Class</label><select id="teacherPromotionClass">${opts(assigned,selected)}</select></div><div id="teacherPromotionNext" class="teacher-promotion-next"></div></div><div id="teacherPromotionWorkspace"></div>`:'<div class="empty">No assigned class is available for promotion.</div>'}
 </section>`;
 if($("#teacherPromotionClass")){
   $("#teacherPromotionClass").onchange=e=>{window.teacherPromotionClass=e.target.value;window.teacherPromotionCustomDestination="";teacherRenderPromotionWorkspace(e.target.value)};
   teacherRenderPromotionWorkspace(selected)
 }
}
function teacherFeeMoney(value){const n=Number(value||0);return `GHS ${(Number.isFinite(n)?n:0).toFixed(2)}`}
function teacherFeeKey(value){return String(value??"").trim()}
function teacherFeeClassKey(value){return String(value??"").trim().toLowerCase().replace(/\s+/g,"").replace(/[^a-z0-9]/g,"")}
function teacherFeeYearKey(value){const raw=String(value??"").trim().toLowerCase(),years=raw.match(/\d{4}/g);return years&&years.length>=2?`${years[0]}/${years[1]}`:raw.replace(/\s+/g,"").replace(/[-–—]/g,"/")}
function teacherFeeStudentId(f){return teacherFeeKey(f?.["Student ID"]??f?.studentId??f?.studentSid??f?.sid)}
function teacherFeeItemName(f){
 const direct=String(
   f?.["Fee Item"]??f?.["Fee Name"]??f?.["Fee Type"]??f?.["Fee Description"]??
   f?.Fees??f?.Fee??f?.Description??f?.Particulars??f?.Item??""
 ).trim();
 if(direct)return direct;
 const id=String(f?.["Fee ID"]??f?.feeId??f?.id??"").trim();
 let m=id.match(/^FEE\|([^|]+)\|/i);
 if(!m)m=id.match(/^FEE_ITEM\|([^|]+)\|/i);
 if(m && !/^\d+$/.test(String(m[1]||""))){
   try{return decodeURIComponent(m[1])}catch(e){return String(m[1]||"").replace(/\+/g," ")}
 }
 return "";
}
function teacherFeeIdKey(v){return teacherFeeKey(v).toLowerCase()}

function teacherFeeStatus(f){const stored=String(f?.Status||f?.["Payment Status"]||"").trim();if(stored)return stored;const due=Number(f?.["Amount Due"]||0),paid=Number(f?.["Amount Paid"]||0),bal=Number(f?.["Balance"]??Math.max(0,due-paid));return bal<=0&&due>0?"Paid":due>0?"Owing":"—"}
function teacherFeePeriodMatches(f,year,term){const fy=String(f?.["Academic Year"]||"").trim(),ft=String(f?.Term||"").trim();return (!fy||!year||teacherFeeYearKey(fy)===teacherFeeYearKey(year))&&(!ft||!term||teacherTermKey(ft)===teacherTermKey(term))}
let teacherFinancialRefreshToken=0;
let teacherFeesAutoSyncTimer=null;
let teacherFeesAutoSyncInFlight=false;
const TEACHER_FEES_AUTO_SYNC_MS=30000;

// IMPORTANT: do not store fee filter values on window using the same names as
// <select id="tfYear"> etc. Browsers expose element IDs as window properties,
// which caused window.tfYear/window.tfTerm to become HTMLSelectElement objects.
// Keep filter state in a dedicated plain object instead.
const teacherFeeFilters={year:"",term:"",className:"",studentId:"",printScope:"student"};
function teacherFeeSelectedFilters(){
 const year=String(teacherFeeFilters.year||state.school.academicYear||"2026/2027").trim();
 const term=String(teacherFeeFilters.term||state.school.term||"Term 1").trim();
 const className=String(teacherFeeFilters.className||classes()[0]||"").trim();
 const studentId=String(teacherFeeFilters.studentId||"").trim();
 return {year,term,className,studentId};
}

function stopTeacherFeesAutoSync(){
 if(teacherFeesAutoSyncTimer){window.clearInterval(teacherFeesAutoSyncTimer);teacherFeesAutoSyncTimer=null}
 teacherFeesAutoSyncInFlight=false;
}

function startTeacherFeesAutoSync(){
 stopTeacherFeesAutoSync();
 if(!state.teacher||String(state.view||"").toLowerCase()!=="fees")return;
 teacherFeesAutoSyncTimer=window.setInterval(async()=>{
   if(!state.teacher||String(state.view||"").toLowerCase()!=="fees"){
     stopTeacherFeesAutoSync();
     return;
   }
   if(teacherFeesAutoSyncInFlight)return;
   teacherFeesAutoSyncInFlight=true;
   try{
     await refreshTeacherFinancialData({silent:true});
   }finally{
     teacherFeesAutoSyncInFlight=false;
   }
 },TEACHER_FEES_AUTO_SYNC_MS);
}

async function refreshTeacherFinancialData(options={}){
 if(!state.teacher)return;
 const refreshToken=++teacherFinancialRefreshToken;
 const silent=Boolean(options?.silent);
 const box=$("#teacherFeeLoading");
 const refreshButton=$("#refreshTeacherFees");
 const oldRefreshText=refreshButton?.textContent||"Refresh Financial Records";
 if(!silent&&refreshButton){refreshButton.disabled=true;refreshButton.textContent="Refreshing Fees...";}
 if(!silent&&box){
   box.style.display="block";
   box.innerHTML=`<span class="teacher-fee-loading-logo" aria-hidden="true"><img src="../afisap_royal_academy_logo.png" alt=""></span><span>Updating financial records from Google Sheets...</span>`;
   box.classList.remove("error");
 }
 try{
   /*
    * Fees must use the dedicated lightweight endpoint.
    * The former refresh called type="data", which also loaded Results,
    * Attendance, Posts, report settings and other modules. On a large workbook
    * that request can take long enough to leave the Fees screen stuck on
    * "Updating financial records...".
    *
    * type="fees" reads only the authorized teacher roster + existing Fees
    * sheet and therefore keeps Admin -> Google Sheets -> Teacher communication
    * independent from the heavier Teacher dashboard data load.
    */
   // Use the exact currently selected period/class when requesting financial data.
   // IMPORTANT: the Report Cards endpoint already proves that these same fee
   // records are readable from Google Sheets. If the dedicated lightweight
   // Fees endpoint returns an empty list (for example when the live Apps Script
   // deployment is still serving an older fees handler), fall back to the same
   // read-only Reports endpoint used by Report Cards so the Fees dashboard and
   // printed report card always show the same financial records.
   const selected=teacherFeeSelectedFilters();
   const selectedClass=selected.className;
   const selectedYear=selected.year;
   const selectedTerm=selected.term;

   let r=await api("fees",{
     className:selectedClass,
     academicYear:selectedYear,
     term:selectedTerm,
     financialRefresh:Date.now()
   });
   if(!r?.success)throw new Error(r?.error||"Financial records unavailable.");

   // Surgical compatibility fallback: Report Cards already display the fee
   // correctly, so reuse that proven read path only when the Fees endpoint
   // returns no rows. No fee data is written or changed here.
   if(!Array.isArray(r.fees)||r.fees.length===0){
     try{
       const reportRead=await api("reports",{
         className:selectedClass,
         academicYear:selectedYear,
         term:selectedTerm,
         financialRefresh:Date.now()
       });
       if(reportRead?.success&&Array.isArray(reportRead.fees)&&reportRead.fees.length){
         r={...r,fees:reportRead.fees};
       }
     }catch(_fallbackError){}
   }

   if(refreshToken!==teacherFinancialRefreshToken)return;

   let nextStudents=Array.isArray(r.students)?r.students:null;
   let nextFees=Array.isArray(r.fees)?r.fees:null;

   // The backend is authoritative. An empty array is meaningful (for example,
   // after Admin deletes the last matching fee), so never retain stale rows.
   if(nextStudents)state.students=nextStudents;
   state.fees=nextFees||[];

   if(state.view==="fees"){
     // Re-render only after the fresh Google Sheets response is confirmed.
     // This makes Admin -> Sheets -> Teacher Portal synchronization visible
     // without requiring the teacher to press Refresh.
     renderFees();
     const successBox=$("#teacherFeeLoading");
     if(successBox&&!silent){
       successBox.style.display="block";
       successBox.classList.remove("error");
       successBox.textContent=`Financial records refreshed. ${state.fees.length} fee record(s) loaded.`;
     }
   }
 }catch(e){
   // A failed refresh must never erase the last confirmed Google Sheets data.
   if(box){
     box.textContent="Financial synchronization failed: "+(e?.message||"Unable to reach Google Sheets.");
     box.classList.add("error");
   }
 }finally{
   if(!silent){
     const currentButton=$("#refreshTeacherFees");if(currentButton){currentButton.disabled=false;currentButton.textContent=oldRefreshText;}
   }
 }
}
let teacherFeePrintProgressTimer=null;
function teacherFeeShowPrintLoader(message){
 teacherFeeHidePrintLoader();
 const overlay=document.createElement("div");
 overlay.id="teacherFeePrintLoader";
 overlay.className="teacher-fee-print-loader";
 const logo=new URL("../afisap_royal_academy_logo.png",window.location.href).href;
 overlay.innerHTML=`<div class="teacher-fee-print-loader-card" role="status" aria-live="polite"><div class="teacher-fee-print-loader-logo"><img src="${logo}" alt="AFISAP Royal Academy"></div><strong>${esc(message||"Preparing financial records…")}</strong><div class="teacher-fee-print-progress-track"><span id="teacherFeePrintProgressBar"></span></div><div id="teacherFeePrintProgressText" class="teacher-fee-print-progress-text">10%</div><small>Please wait while the financial records are being prepared.</small></div>`;
 document.body.appendChild(overlay);
 teacherFeeSetPrintProgress(10);
 let progress=10;
 teacherFeePrintProgressTimer=setInterval(()=>{
   if(progress<90){progress+=10;teacherFeeSetPrintProgress(progress)}
 },650);
}
function teacherFeeSetPrintProgress(value){
 const pct=Math.max(0,Math.min(100,Number(value)||0));
 const bar=$("#teacherFeePrintProgressBar");
 const text=$("#teacherFeePrintProgressText");
 if(bar)bar.style.width=pct+"%";
 if(text)text.textContent=pct+"%";
}
function teacherFeeHidePrintLoader(){
 if(teacherFeePrintProgressTimer){clearInterval(teacherFeePrintProgressTimer);teacherFeePrintProgressTimer=null}
 const overlay=$("#teacherFeePrintLoader");
 if(overlay)overlay.remove();
}
async function teacherFeeCompletePrintLoader(){
 if(teacherFeePrintProgressTimer){clearInterval(teacherFeePrintProgressTimer);teacherFeePrintProgressTimer=null}
 teacherFeeSetPrintProgress(100);
 await new Promise(resolve=>setTimeout(resolve,320));
 teacherFeeHidePrintLoader();
}

function teacherFeePrintRows(fees,year,term){
 return (fees||[]).map(f=>{
   const sid=teacherFeeStudentId(f),student=studentById(sid),due=Number(f["Amount Due"]||0),paid=Number(f["Amount Paid"]||0),bal=Number(f["Balance"]??Math.max(0,due-paid));
   return `<tr><td>${esc(student?.name||f["Student Name"]||"")}</td><td>${esc(sid)}</td><td>${esc(student?.className||f["Class"]||"")}</td><td>${esc(f["Fee Item"]||"Fee")}</td><td>${esc(f["Academic Year"]||year)}</td><td>${esc(f.Term||term)}</td><td>${teacherFeeMoney(due)}</td><td>${teacherFeeMoney(paid)}</td><td>${teacherFeeMoney(bal)}</td><td>${esc(teacherFeeStatus(f))}</td></tr>`;
 }).join("");
}
async function openTeacherStudentFeesPreview(){
 const selected=teacherFeeSelectedFilters();
 const cls=selected.className;
 const year=selected.year;
 const term=selected.term;
 const sid=selected.studentId;
 if(!sid){alert("Please select a student before printing the fee statement.");return}
 const localStudent=studentById(sid);
 if(!localStudent){alert("The selected student could not be found.");return}
 const allowed=new Set(classes().map(teacherFeeClassKey));
 if(!allowed.has(teacherFeeClassKey(localStudent.className))){alert("Unauthorized student fee access.");return}
 setStatus("Preparing student financial records…");
 teacherFeeShowPrintLoader("Preparing student financial records…");
 try{
   // Dedicated read-only statement endpoint. It resolves the selected authorized
   // student first and then reads that student's existing Google Sheets fee rows.
   let r=await api("studentfees",{studentId:sid,className:cls,academicYear:year,term,financialRefresh:Date.now()});

   // Compatibility safety net: the Report Cards endpoint is the proven working
   // read path for the same Google Sheets Fees rows. If an older live Apps
   // Script deployment does not yet support studentfees, or it returns no rows,
   // read through reports and isolate this exact student/period.
   if(!r?.success||!Array.isArray(r.fees)||r.fees.length===0){
     try{
       const reportRead=await api("reports",{className:cls,academicYear:year,term,financialRefresh:Date.now()});
       if(reportRead?.success&&Array.isArray(reportRead.fees)){
         const fallbackFees=reportRead.fees.filter(f=>teacherFeeIdKey(teacherFeeStudentId(f))===teacherFeeIdKey(sid)&&teacherFeePeriodMatches(f,year,term));
         if(fallbackFees.length){
           r={success:true,student:localStudent,fees:fallbackFees,school:r?.school||state.school,diagnostic:{fallback:"reports"}};
         }
       }
     }catch(_reportFallbackError){}
   }

   if(!r?.success)throw new Error(r?.error||"Student financial records are unavailable.");
   const student=r.student||localStudent;
   const fees=Array.isArray(r.fees)?r.fees:[];
   const rows=teacherFeePrintRows(fees,year,term);
   const school={...state.school,...(r.school||{})};
   let photo=state.photos[sid]||"";
   if(!photo){
     try{
       const ph=await api("studentphoto",{studentId:sid});
       if(ph?.success&&ph.fileData){photo=`data:${ph.mimeType||"image/jpeg"};base64,${ph.fileData}`;state.photos[sid]=photo}
     }catch(_photoError){}
   }
   const logo=new URL("../afisap_royal_academy_logo.png",window.location.href).href;
   await teacherFeeCompletePrintLoader();
   const w=window.open("","_blank","width=1400,height=900");
   if(!w)throw new Error("Please allow pop-ups to open the student fee print preview.");
   const phone=school.phone||"055 610 4186 / 024 272 7685 / 024 874 3558";
   const email=school.email||"afisaproyalacademy@gmail.com";
   const website=school.website||"www.afisaproyalacademy.com";
   w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Student Financial Records - ${esc(student.name)}</title><style>
   @page{size:A4 landscape;margin:7mm}
   *{box-sizing:border-box}html,body{margin:0;padding:0;background:#eef2f6;color:#17243b;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
   .toolbar{text-align:center;padding:10px}.toolbar button{padding:10px 18px;border:0;border-radius:7px;background:#0b3a71;color:#fff;font-weight:700;cursor:pointer}
   .sheet{position:relative;width:100%;max-width:1120px;margin:0 auto 16px;background:#fff;padding:14px 18px 20px;min-height:720px;overflow:hidden}
   .watermark{position:absolute;left:50%;top:59%;width:280px;height:280px;object-fit:contain;transform:translate(-50%,-50%);opacity:.045;pointer-events:none}
   .content{position:relative;z-index:2}.head{display:grid;grid-template-columns:90px 1fr 90px;align-items:center;gap:12px;border-bottom:3px solid #d7aa08;padding-bottom:8px}.head>img{width:82px;height:82px;object-fit:contain}.school{text-align:center}.school h1{margin:0;color:#102f5a;font-size:28px;letter-spacing:.3px}.school h2{margin:5px 0 0;background:#102f5a;color:#fff;display:inline-block;padding:6px 24px;font-size:17px}.school .motto{margin:5px 0 3px;font-size:12px;font-weight:700}.contacts{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#344054;margin-top:5px}.contacts b{color:#102f5a}
   .student-card{display:grid;grid-template-columns:105px 1fr;gap:16px;align-items:center;margin:14px 0 12px;padding:11px 14px;border:1px solid #d8dee8;border-radius:7px;background:#fbfcfe}.student-photo{width:88px;height:102px;object-fit:cover;border:1px solid #cdd5df;background:#f3f4f6}.no-photo{width:88px;height:102px;border:1px solid #cdd5df;display:flex;align-items:center;justify-content:center;color:#98a2b3;background:#f8fafc;font-size:11px}.student-details{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px 18px;font-size:12px}.student-details div{padding:3px 0}.student-details b{color:#102f5a}
   h3{margin:11px 0 7px;color:#102f5a;font-size:17px}.records{width:100%;border-collapse:collapse;font-size:10.5px}.records th,.records td{border:1px solid #b9c2ce;padding:7px 6px;vertical-align:middle}.records th{background:#102f5a;color:#fff;text-align:center;white-space:nowrap}.records td:nth-child(7),.records td:nth-child(8),.records td:nth-child(9){text-align:right;white-space:nowrap}.empty{text-align:center!important;color:#667085;padding:18px!important}.footer{margin-top:18px;padding-top:8px;border-top:1px solid #d7aa08;font-size:10px;color:#667085;text-align:center}
   @media print{html,body{background:#fff}.toolbar{display:none}.sheet{max-width:none;margin:0;padding:0;min-height:0}.head{margin-top:0}}
   </style></head><body><div class="toolbar"><button onclick="window.print()">PRINT STUDENT FEES</button></div><div class="sheet"><img class="watermark" src="${logo}" alt=""><div class="content"><div class="head"><img src="${logo}" alt="AFISAP Royal Academy"><div class="school"><h1>${esc(school.name||"AFISAP ROYAL ACADEMY")}</h1><h2>STUDENT FINANCIAL RECORDS</h2><div class="motto">${esc(school.motto||"LEARNING TO LEARN")}</div><div class="contacts"><span><b>Phone:</b> ${esc(phone)}</span><span><b>Email:</b> ${esc(email)}</span><span><b>Website:</b> ${esc(website)}</span></div></div><img src="${logo}" alt="AFISAP Royal Academy"></div><div class="student-card">${photo?`<img class="student-photo" src="${photo}" alt="Student Passport Photo">`:`<div class="no-photo">No Photo</div>`}<div class="student-details"><div><b>Student:</b> ${esc(student.name)}</div><div><b>Student ID:</b> ${esc(student.studentId)}</div><div><b>Admission No.:</b> ${esc(student.admissionNumber||"—")}</div><div><b>Class:</b> ${esc(student.className)}</div><div><b>Gender:</b> ${esc(student.gender||"—")}</div><div><b>Academic Year:</b> ${esc(year)}</div><div><b>Term:</b> ${esc(term)}</div><div><b>Guardian:</b> ${esc(student.guardian||"—")}</div></div></div><h3>Student Financial Records</h3><table class="records"><thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Fee Item</th><th>Academic Year</th><th>Term</th><th>Amount Due</th><th>Amount Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="10" class="empty">No fee records found for this student for the selected Academic Year and Term.</td></tr>'}</tbody></table><div class="footer">${esc(school.name||"AFISAP ROYAL ACADEMY")} • ${esc(school.motto||"LEARNING TO LEARN")} • ${esc(phone)} • ${esc(email)} • ${esc(website)}</div></div></div></body></html>`);
   w.document.close();
   setStatus("");
 }catch(e){teacherFeeHidePrintLoader();setStatus(e.message,true)}
}
async function openTeacherClassFeesPreview(){
 const selected=teacherFeeSelectedFilters();
 const cls=selected.className;
 const year=selected.year;
 const term=selected.term;
 if(!cls){alert("Please select a class before printing class fees.");return}
 const allowed=new Set(classes().map(teacherFeeClassKey));
 if(!allowed.has(teacherFeeClassKey(cls))){alert("Unauthorized class fee access.");return}
 setStatus("Preparing entire class financial records…");
 teacherFeeShowPrintLoader("Preparing entire class financial records…");
 try{
   // Use the same proven read-only Reports fee path already used by Report Cards.
   // No fee record is created, edited, or deleted here.
   const r=await api("reports",{className:cls,academicYear:year,term,financialRefresh:Date.now()});
   if(!r?.success)throw new Error(r?.error||"Class financial records are unavailable.");
   const classStudents=state.students.filter(st=>teacherFeeClassKey(st.className)===teacherFeeClassKey(cls));
   const classIds=new Set(classStudents.map(st=>teacherFeeIdKey(st.studentId)));
   const fees=(Array.isArray(r.fees)?r.fees:[]).filter(f=>classIds.has(teacherFeeIdKey(teacherFeeStudentId(f)))&&teacherFeePeriodMatches(f,year,term));
   const rows=teacherFeePrintRows(fees,year,term);
   const totals=fees.reduce((a,f)=>{
     const due=Number(f["Amount Due"]||0),paid=Number(f["Amount Paid"]||0),bal=Number(f["Balance"]??Math.max(0,due-paid));
     a.due+=Number.isFinite(due)?due:0;a.paid+=Number.isFinite(paid)?paid:0;a.balance+=Number.isFinite(bal)?bal:0;return a;
   },{due:0,paid:0,balance:0});
   const studentsWithFees=new Set(fees.map(f=>teacherFeeIdKey(teacherFeeStudentId(f))).filter(Boolean)).size;
   const school={...state.school};
   const logo=new URL("../afisap_royal_academy_logo.png",window.location.href).href;
   const phone=school.phone||"055 610 4186 / 024 272 7685 / 024 874 3558";
   const email=school.email||"afisaproyalacademy@gmail.com";
   const website=school.website||"www.afisaproyalacademy.com";
   await teacherFeeCompletePrintLoader();
   const w=window.open("","_blank","width=1400,height=900");
   if(!w)throw new Error("Please allow pop-ups to open the class fee print preview.");
   w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Class Financial Records - ${esc(cls)}</title><style>
   @page{size:A4 landscape;margin:7mm}
   *{box-sizing:border-box}html,body{margin:0;padding:0;background:#eef2f6;color:#17243b;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
   .toolbar{text-align:center;padding:10px}.toolbar button{padding:10px 18px;border:0;border-radius:7px;background:#0b3a71;color:#fff;font-weight:700;cursor:pointer}
   .sheet{position:relative;width:100%;max-width:1120px;margin:0 auto 16px;background:#fff;padding:14px 18px 20px;min-height:720px;overflow:hidden}.watermark{position:absolute;left:50%;top:59%;width:280px;height:280px;object-fit:contain;transform:translate(-50%,-50%);opacity:.045;pointer-events:none}.content{position:relative;z-index:2}
   .head{display:grid;grid-template-columns:90px 1fr 90px;align-items:center;gap:12px;border-bottom:3px solid #d7aa08;padding-bottom:8px}.head>img{width:82px;height:82px;object-fit:contain}.school{text-align:center}.school h1{margin:0;color:#102f5a;font-size:28px;letter-spacing:.3px}.school h2{margin:5px 0 0;background:#102f5a;color:#fff;display:inline-block;padding:6px 24px;font-size:17px}.school .motto{margin:5px 0 3px;font-size:12px;font-weight:700}.contacts{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#344054;margin-top:5px}.contacts b{color:#102f5a}
   .meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 14px;margin:14px 0 10px;padding:10px 12px;border:1px solid #d8dee8;border-radius:7px;background:#fbfcfe;font-size:11.5px}.meta b{color:#102f5a}.summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:10px 0 13px}.sum{border:1px solid #d8dee8;border-radius:6px;padding:8px;background:#fff}.sum small{display:block;color:#667085;font-size:9.5px}.sum strong{display:block;margin-top:3px;color:#102f5a;font-size:12px}
   h3{margin:11px 0 7px;color:#102f5a;font-size:17px}.records{width:100%;border-collapse:collapse;font-size:10px}.records th,.records td{border:1px solid #b9c2ce;padding:6px 5px;vertical-align:middle}.records th{background:#102f5a;color:#fff;text-align:center;white-space:nowrap}.records td:nth-child(7),.records td:nth-child(8),.records td:nth-child(9){text-align:right;white-space:nowrap}.empty{text-align:center!important;color:#667085;padding:18px!important}.footer{margin-top:18px;padding-top:8px;border-top:1px solid #d7aa08;font-size:10px;color:#667085;text-align:center}
   @media print{html,body{background:#fff}.toolbar{display:none}.sheet{max-width:none;margin:0;padding:0;min-height:0}.head{margin-top:0}}
   </style></head><body><div class="toolbar"><button onclick="window.print()">PRINT ENTIRE CLASS FEES</button></div><div class="sheet"><img class="watermark" src="${logo}" alt=""><div class="content"><div class="head"><img src="${logo}" alt="AFISAP Royal Academy"><div class="school"><h1>${esc(school.name||"AFISAP ROYAL ACADEMY")}</h1><h2>CLASS FINANCIAL RECORDS</h2><div class="motto">${esc(school.motto||"LEARNING TO LEARN")}</div><div class="contacts"><span><b>Phone:</b> ${esc(phone)}</span><span><b>Email:</b> ${esc(email)}</span><span><b>Website:</b> ${esc(website)}</span></div></div><img src="${logo}" alt="AFISAP Royal Academy"></div><div class="meta"><div><b>Class:</b> ${esc(cls)}</div><div><b>Academic Year:</b> ${esc(year)}</div><div><b>Term:</b> ${esc(term)}</div><div><b>Total Students:</b> ${classStudents.length}</div></div><div class="summary"><div class="sum"><small>Students With Fee Records</small><strong>${studentsWithFees}</strong></div><div class="sum"><small>Fee Records</small><strong>${fees.length}</strong></div><div class="sum"><small>Total Amount Due</small><strong>${teacherFeeMoney(totals.due)}</strong></div><div class="sum"><small>Total Amount Paid</small><strong>${teacherFeeMoney(totals.paid)}</strong></div><div class="sum"><small>Total Balance</small><strong>${teacherFeeMoney(totals.balance)}</strong></div></div><h3>Student Financial Records</h3><table class="records"><thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Fee Item</th><th>Academic Year</th><th>Term</th><th>Amount Due</th><th>Amount Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="10" class="empty">No fee records found for this class for the selected Academic Year and Term.</td></tr>'}</tbody></table><div class="footer">${esc(school.name||"AFISAP ROYAL ACADEMY")} • ${esc(school.motto||"LEARNING TO LEARN")} • ${esc(phone)} • ${esc(email)} • ${esc(website)}</div></div></div></body></html>`);
   w.document.close();
   setStatus("");
 }catch(e){teacherFeeHidePrintLoader();setStatus(e.message,true)}
}

function renderFees(){
 const assigned=classes(),requestedClass=String(teacherFeeFilters.className||"").trim();
 const cls=assigned.some(c=>teacherFeeClassKey(c)===teacherFeeClassKey(requestedClass))
   ?assigned.find(c=>teacherFeeClassKey(c)===teacherFeeClassKey(requestedClass))
   :(assigned[0]||"");
 teacherFeeFilters.className=cls;
 const year=teacherFeeFilters.year||state.school.academicYear||"2026/2027",term=teacherFeeFilters.term||state.school.term||"Term 1";
 const scope=teacherFeeFilters.printScope==="class"?"class":"student";
 teacherFeeFilters.printScope=scope;
 let authorized=state.students.filter(s=>teacherFeeClassKey(s.className)===teacherFeeClassKey(cls));
 if(!authorized.length&&state.students.length&&classes().length===1)authorized=[...state.students];
 const authorizedIds=new Set(authorized.map(s=>teacherFeeIdKey(s.studentId)));
 let studentChoice=teacherFeeKey(teacherFeeFilters.studentId||"");
 if(studentChoice&&!authorizedIds.has(teacherFeeIdKey(studentChoice))){studentChoice="";teacherFeeFilters.studentId=""}
 const studentControl=scope==="student"?`<div class="control"><label>Student</label><select id="tfStudent"><option value="">Select Student</option>${authorized.map(s=>`<option value="${esc(s.studentId)}"${s.studentId===studentChoice?" selected":""}>${esc(s.name)} — ${esc(s.studentId)}</option>`).join("")}</select></div>`:"";
 const printLabel=scope==="class"?"Print Entire Class Fees":"Print Student Fees";
 $("#app").innerHTML=`<section class="welcome"><h2>💰 Fees &amp; Textbooks</h2><p><strong>View and print only.</strong> Fee records remain controlled by the Admin Fees &amp; Textbooks system and Google Sheets.</p></section><div class="notice teacher-fee-warning"><strong>Teachers cannot change fee structures, payments or balances from this portal.</strong> Choose whether to print one student's fees or the entire selected class.</div>
 <section class="panel"><div class="filters"><div class="control"><label>Academic Year</label><select id="tfYear">${opts(academicYears(),year)}</select></div><div class="control"><label>Term</label><select id="tfTerm">${opts(termOptions(),term)}</select></div><div class="control"><label>Class</label><select id="tfClass">${opts(classes(),cls)}</select></div><div class="control"><label>Select Fees</label><select id="tfPrintScope"><option value="student"${scope==="student"?" selected":""}>One Student Fees</option><option value="class"${scope==="class"?" selected":""}>Entire Class Fees</option></select></div>${studentControl}</div><div class="actions"><button id="printFees" class="btn primary" type="button">${printLabel}</button></div></section>`;
 [["tfYear","year"],["tfTerm","term"],["tfClass","className"]].forEach(([id,key])=>{const el=$("#"+id);if(el)el.onchange=e=>{teacherFeeFilters[key]=String(e.target.value||"");if(id==="tfClass")teacherFeeFilters.studentId="";renderFees()}});
 const scopeEl=$("#tfPrintScope");if(scopeEl)scopeEl.onchange=e=>{teacherFeeFilters.printScope=String(e.target.value||"student")==="class"?"class":"student";renderFees()};
 const studentEl=$("#tfStudent");if(studentEl)studentEl.onchange=e=>{teacherFeeFilters.studentId=String(e.target.value||"")};
 $("#printFees")?.addEventListener("click",()=>{if(teacherFeeFilters.printScope==="class")openTeacherClassFeesPreview();else openTeacherStudentFeesPreview()});
}
function renderPosts(){
 const cls=window.tpClass||classes()[0]||"",type=window.tpType||"Announcement",year=state.school.academicYear||"2026/2027",term=state.school.term||"Term 1";
 const postSubjects=[...OFFICIAL_REPORT_SUBJECTS],selectedRaw=String(window.tpSubject||"").trim();
 const sub=selectedRaw&&postSubjects.some(x=>teacherSubjectKey(x)===teacherSubjectKey(selectedRaw))?selectedRaw:(selectedRaw?"Other":postSubjects[0]||"");
 if(selectedRaw&&sub==="Other"&&teacherSubjectKey(selectedRaw)!=="other"&&!window.tpOtherSubject)window.tpOtherSubject=selectedRaw;
 $("#app").innerHTML=`<section class="welcome"><h2>📢 Announcements &amp; Assignments</h2><p>Published into the same communication source used by Admin and Parent Portal.</p></section><div class="post-grid"><section class="panel"><h3>Create New</h3><div class="control"><label>Type</label><select id="pType">${opts(["Announcement","Assignment","Post"],type)}</select></div><div class="control"><label>Title</label><input id="pTitle"></div><div class="control"><label>Target Class</label><select id="pClass">${opts(classes(),cls)}</select></div><div class="control" id="subjectControl"><label>Subject</label><select id="pSubject"><option value="">Select subject</option>${opts(postSubjects,sub)}</select></div>${teacherSubjectKey(sub)==="other"?`<div class="control"><label>Specify Other Subject</label><input id="pOtherSubject" value="${esc(window.tpOtherSubject||"")}" placeholder="e.g. ICT"></div>`:""}<div class="control"><label>Message / Instructions</label><textarea id="pMessage" rows="5"></textarea></div><div class="control"><label>Due Date (Assignments)</label><input id="pDue" type="date"></div><div class="control"><label>Optional Attachment</label><input id="pFile" type="file"></div><div class="actions"><button id="publishPost" class="btn primary">Publish</button></div></section>
 <section class="panel"><h3>My Posts</h3>${state.posts.length?state.posts.slice().reverse().map(p=>`<div class="post-card"><h4>${esc(p.Title||"")}</h4><div>${esc(p.Type||"")} · ${esc(p.Class||"")} ${p.Subject?"· "+esc(p.Subject):""}</div><small>${esc(p.Status||"Published")} · ${esc(p["Date Posted"]||"")}</small><div class="actions"><button type="button" class="btn danger teacher-delete-post" data-post-id="${esc(p["Announcement ID"]||"")}" data-post-title="${esc(p.Title||"")}">Delete Post</button></div></div>`).join(""):`<div class="empty">You have not posted anything yet.</div>`}</section></div>`;
 $("#pType").onchange=e=>{window.tpType=e.target.value;renderPosts()};
 $("#pClass").onchange=e=>window.tpClass=e.target.value;
 $("#pSubject").onchange=e=>{window.tpSubject=e.target.value;if(teacherSubjectKey(e.target.value)!=="other")window.tpOtherSubject="";renderPosts()};
 if($("#pOtherSubject"))$("#pOtherSubject").oninput=e=>window.tpOtherSubject=e.target.value;
 $("#publishPost").onclick=()=>publishPost(year,term);
 document.querySelectorAll(".teacher-delete-post").forEach(btn=>btn.onclick=()=>deleteTeacherPost(btn.dataset.postId,btn.dataset.postTitle));
}
let teacherDeletePostProgressTimer=null;
function teacherShowDeletePostLoader(){
 teacherHideDeletePostLoader();
 const overlay=document.createElement("div");overlay.id="teacherDeletePostLoader";overlay.className="teacher-fee-print-loader";
 overlay.innerHTML=`<div class="teacher-fee-print-loader-card" role="status" aria-live="polite"><div class="teacher-fee-print-loader-logo"><img src="../afisap_royal_academy_logo.png" alt="AFISAP Royal Academy"></div><strong>Deleting post…</strong><div class="teacher-fee-print-progress-track"><span id="teacherDeletePostProgressBar"></span></div><div id="teacherDeletePostProgressText" class="teacher-fee-print-progress-text">10%</div><small>Please wait while the post is removed from Teacher Portal, Parent Portal and Google Sheets.</small></div>`;
 document.body.appendChild(overlay);teacherSetDeletePostProgress(10);let progress=10;
 teacherDeletePostProgressTimer=setInterval(()=>{if(progress<90){progress+=10;teacherSetDeletePostProgress(progress)}},220);
}
function teacherSetDeletePostProgress(value){const n=Math.max(0,Math.min(100,Number(value)||0)),bar=$("#teacherDeletePostProgressBar"),label=$("#teacherDeletePostProgressText");if(bar)bar.style.width=n+"%";if(label)label.textContent=n+"%"}
function teacherHideDeletePostLoader(){if(teacherDeletePostProgressTimer){clearInterval(teacherDeletePostProgressTimer);teacherDeletePostProgressTimer=null}document.getElementById("teacherDeletePostLoader")?.remove()}
async function teacherFinishDeletePostLoader(){if(teacherDeletePostProgressTimer){clearInterval(teacherDeletePostProgressTimer);teacherDeletePostProgressTimer=null}teacherSetDeletePostProgress(100);await new Promise(r=>setTimeout(r,180));teacherHideDeletePostLoader()}
async function deleteTeacherPost(postId,title){
 const id=String(postId||"").trim();if(!id){alert("This post does not have a valid Announcement ID.");return}
 if(!confirm(`Delete “${title||"this post"}”?\n\nIt will be removed from the Teacher Portal, Parent Portal and the Announcements & Assignments Google Sheet.`))return;
 teacherShowDeletePostLoader();setStatus("Deleting post from Google Sheets…");
 try{
   const r=await writePayload("deletepost",{id});
   if(!r?.success)throw new Error(r?.error||"Post could not be deleted.");
   state.posts=(state.posts||[]).filter(p=>String(p["Announcement ID"]||"").trim()!==id);
   await teacherFinishDeletePostLoader();setStatus("");renderPosts();
 }catch(e){teacherHideDeletePostLoader();setStatus(e.message,true);alert("Post was not deleted.\n\n"+(e?.message||e))}
}

async function uploadAttachment(file,postId){
 if(!file)return{fileId:"",fileName:""};if(file.size>15*1024*1024)throw new Error("Attachment is larger than 15 MB.");
 const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||""));r.onerror=()=>rej(new Error("Could not read attachment."));r.readAsDataURL(file)});
 const name="TP-"+postId+"-"+String(file.name||"attachment").replace(/[\\/:*?"<>|#%{}~&]/g,"_");
 const result=await writePayload("attachmentupload",{fileName:name,mimeType:file.type||"application/octet-stream",fileData:data});
 if(!result?.success||!result.fileId)throw new Error(result?.error||"Attachment upload could not be confirmed.");
 return{fileId:String(result.fileId),fileName:file.name}
}

let teacherPublishProgressTimer=null;
function teacherShowPublishLoader(message){
 teacherHidePublishLoader();
 const overlay=document.createElement("div");overlay.id="teacherPublishLoader";overlay.className="teacher-fee-print-loader";
 overlay.innerHTML=`<div class="teacher-fee-print-loader-card" role="status" aria-live="polite"><div class="teacher-fee-print-loader-logo"><img src="../afisap_royal_academy_logo.png" alt="AFISAP Royal Academy"></div><strong>${esc(message||"Publishing to Parent Portal…")}</strong><div class="teacher-fee-print-progress-track"><span id="teacherPublishProgressBar"></span></div><div id="teacherPublishProgressText" class="teacher-fee-print-progress-text">10%</div><small>Please wait while the announcement or assignment is published.</small></div>`;
 document.body.appendChild(overlay);teacherSetPublishProgress(10);let progress=10;
 teacherPublishProgressTimer=setInterval(()=>{if(progress<90){progress+=10;teacherSetPublishProgress(progress)}},260);
}
function teacherSetPublishProgress(value){
 const n=Math.max(0,Math.min(100,Number(value)||0)),bar=$("#teacherPublishProgressBar"),text=$("#teacherPublishProgressText");
 if(bar)bar.style.width=n+"%";if(text)text.textContent=n+"%";
}
function teacherHidePublishLoader(){
 if(teacherPublishProgressTimer){clearInterval(teacherPublishProgressTimer);teacherPublishProgressTimer=null}
 document.getElementById("teacherPublishLoader")?.remove();
}
async function teacherFinishPublishLoader(){
 if(teacherPublishProgressTimer){clearInterval(teacherPublishProgressTimer);teacherPublishProgressTimer=null}
 teacherSetPublishProgress(100);await new Promise(r=>setTimeout(r,180));teacherHidePublishLoader();
}
async function publishPost(year,term){
 const type=$("#pType").value,title=$("#pTitle").value.trim(),className=$("#pClass").value,selectedSubject=$("#pSubject").value,message=$("#pMessage").value.trim(),dueDate=$("#pDue").value,file=$("#pFile").files[0],id="TP-"+state.teacher.staffId+"-"+Date.now();
 const subject=teacherSubjectKey(selectedSubject)==="other"?String($("#pOtherSubject")?.value||window.tpOtherSubject||"").trim():teacherCanonicalSubject(selectedSubject);
 if(!title||!message){alert("Title and message/instructions are required.");return}
 if(type.toLowerCase()==="assignment"&&!subject){alert("Please select a subject. If you choose Other, type the actual subject name.");return}
 setStatus("Publishing…");teacherShowPublishLoader(file?"Uploading attachment and publishing…":"Publishing to Parent Portal…");
 try{
   const a=await uploadAttachment(file,id);
   const datePosted=today();
   const r=await writePayload("post",{id,type,title,className,subject,message,dueDate,datePosted,attachmentFileId:a.fileId,attachmentName:a.fileName,academicYear:year,term});
   if(!r?.success)throw new Error(r?.error||"Post could not be saved.");
   // Do not perform a second full Google Sheets reload after a confirmed save.
   // The same saved record is inserted into the local list immediately, making
   // the Teacher Portal respond as soon as the Parent/Admin source confirms it.
   state.posts.push({"Announcement ID":id,"Type":type,"Title":title,"Message":message,"Class":className,"Subject":subject,"Date Posted":datePosted,"Due Date":dueDate,"Attachment":a.fileId,"Attachment Name":a.fileName,"Status":"Published","Created By":state.teacher.name+" | "+state.teacher.staffId+" | Teacher","Posted By Staff ID":state.teacher.staffId,"Posted By Role":"Teacher","Academic Year":year,"Term":term});
   window.tpSubject=selectedSubject;window.tpOtherSubject=teacherSubjectKey(selectedSubject)==="other"?subject:"";
   await teacherFinishPublishLoader();setStatus("");renderPosts();alert(`${type} published. Admin and Parent Portal use this same communication record.`);
 }catch(e){teacherHidePublishLoader();setStatus(e.message,true)}
}
function renderReports(){
 const cls=window.rrClass||classes()[0]||"",year=window.rrYear||state.school.academicYear||"2026/2027",term=window.rrTerm||state.school.term||"Term 1",list=state.students.filter(s=>s.className===cls);
 let sid=String(window.rrStudent||"");if(!list.some(s=>s.studentId===sid))sid=list[0]?.studentId||"";window.rrStudent=sid;
 const dates=teacherReportDates(year,term),checks=list.map(s=>`<label class="report-student-check"><input class="report-bulk-check" type="checkbox" value="${esc(s.studentId)}"><span><b>${esc(s.name)}</b><small>${esc(s.studentId)} · ${esc(s.className)}</small></span></label>`).join("");
 $("#app").innerHTML=`<section class="welcome"><h2>📊 Report Cards</h2><p>Generate individual student reports, bulk report cards, or complete class reports using the official AFISAP report-card design.</p></section>
 <section class="panel"><h3>Academic Reports</h3><div class="filters"><div class="control"><label>Assigned Class</label><select id="qClass">${opts(classes(),cls)}</select></div><div class="control"><label>Academic Year</label><select id="qYear">${opts(academicYears(),year)}</select></div><div class="control"><label>Term</label><select id="qTerm">${opts(termOptions(),term)}</select></div><div class="control"><label>Vacation Date</label><input id="qVacationDate" type="date" value="${esc(dates.vacationDate||"")}" disabled></div><div class="control"><label>Opening Date</label><input id="qOpeningDate" type="date" value="${esc(dates.openingDate||"")}" disabled></div></div><p class="muted">Vacation Date and Opening Date are controlled by the Administrator and loaded from the official Google Sheets Academic Settings record.</p></section>
 <section class="panel"><h3>Individual Report Card</h3><div class="control"><label>Select Student</label><select id="qStudent">${list.map(s=>`<option value="${esc(s.studentId)}"${s.studentId===sid?" selected":""}>${esc(s.name)} — ${esc(s.studentId)}</option>`).join("")}</select></div><div class="actions"><button id="printIndividualReport" class="btn primary">Print Individual Report Card</button></div></section>
 <section class="panel"><h3>Bulk Report Cards</h3><div class="actions"><button id="selectAllReports" class="btn secondary">Select All</button><button id="clearAllReports" class="btn secondary">Clear All</button><button id="printSelectedReports" class="btn primary">Print Selected Report Cards</button></div><div class="report-student-grid">${checks||'<div class="empty">No assigned students.</div>'}</div></section>
 <section class="panel"><h3>Class Results</h3><p>Print one official report-card page for every student in ${esc(cls||"your assigned class")}.</p><div class="actions"><button id="printClassReports" class="btn primary">Print Class Reports</button></div></section>`;
 [["qClass","rrClass"],["qYear","rrYear"],["qTerm","rrTerm"],["qStudent","rrStudent"]].forEach(([id,k])=>{const el=$("#"+id);if(el)el.onchange=async e=>{
   window[k]=e.target.value;
   if(id==="qClass")window.rrStudent="";
   if(id==="qClass"||id==="qYear"||id==="qTerm"){
     delete teacherViewLoadPromises.reports;
     try{await loadTeacherViewData("reports")}catch(err){setStatus(err.message,true)}
   }
   renderReports();
 }});
 const saveSelectedDates=()=>{
   teacherSaveReportDates(year,term,$("#qVacationDate")?.value||"",$("#qOpeningDate")?.value||"");
 };
 $("#qVacationDate")?.addEventListener("change",saveSelectedDates);
 $("#qOpeningDate")?.addEventListener("change",saveSelectedDates);
 $("#selectAllReports")?.addEventListener("click",()=>document.querySelectorAll(".report-bulk-check").forEach(x=>x.checked=true));
 $("#clearAllReports")?.addEventListener("click",()=>document.querySelectorAll(".report-bulk-check").forEach(x=>x.checked=false));
 $("#printIndividualReport")?.addEventListener("click",()=>{saveSelectedDates();openTeacherReportCards([$("#qStudent").value],year,term,"Individual Report Card")});
 $("#printSelectedReports")?.addEventListener("click",()=>{saveSelectedDates();openTeacherReportCards([...document.querySelectorAll(".report-bulk-check:checked")].map(x=>x.value),year,term,"Selected Report Cards")});
 $("#printClassReports")?.addEventListener("click",()=>{saveSelectedDates();openTeacherReportCards(list.map(s=>s.studentId),year,term,`${cls} Report Cards`)});
}
const teacherViewLoadPromises={};
async function loadTeacherViewData(view){
 if(!state.teacher)return;
 const key=String(view||"").trim().toLowerCase();
 if(!key||key==="dashboard"||key==="students"||key==="classes")return;
 if(teacherViewLoadPromises[key])return teacherViewLoadPromises[key];

 teacherViewLoadPromises[key]=(async()=>{
   if(key==="results"){
     const cls=window.trClass||classes()[0]||"",year=window.trYear||state.school.academicYear||"2026/2027",term=window.trTerm||state.school.term||"Term 1";
     const r=await api("results",{className:cls,academicYear:year,term});
     if(!r?.success)throw new Error(r?.error||"Results unavailable.");
     state.results=r.results||[];
     return;
   }
   if(key==="attendance"){
     const cls=window.taClass||classes()[0]||"",year=window.taYear||state.school.academicYear||"2026/2027",term=window.taTerm||state.school.term||"Term 1";
     const r=await api("attendance",{className:cls,academicYear:year,term});
     if(!r?.success)throw new Error(r?.error||"Attendance unavailable.");
     state.attendance=r.attendance||[];
     return;
   }
   if(key==="fees"){
     // Fees page is print-only. Live Google Sheets records are fetched only
     // when the teacher opens the Student Fees print preview.
     return;
   }
   if(key==="posts"){
     const r=await api("posts");
     if(!r?.success)throw new Error(r?.error||"Announcements unavailable.");
     state.posts=r.posts||[];
     return;
   }
   if(key==="reports"){
     const cls=window.rrClass||classes()[0]||"",year=window.rrYear||state.school.academicYear||"2026/2027",term=window.rrTerm||state.school.term||"Term 1";
     const r=await api("reports",{className:cls,academicYear:year,term});
     if(!r?.success)throw new Error(r?.error||"Report-card data unavailable.");
     if(Array.isArray(r.results))state.results=r.results;
     if(Array.isArray(r.attendance))state.attendance=r.attendance;
     // Report-card fees are isolated from the live Fees & Textbooks mirror.
     // A slow report request must never erase or replace state.fees.
     if(Array.isArray(r.fees))state.reportFees=r.fees;
     if(r.reportCardDates)state.reportCardDates=r.reportCardDates;
     return;
   }
 })();
 try{await teacherViewLoadPromises[key]}finally{delete teacherViewLoadPromises[key]}
}
let teacherNavigationToken=0;
async function navigateTeacherView(view){
 const requestedView=String(view||"dashboard");
 const navigationToken=++teacherNavigationToken;
 state.view=requestedView;
 if(String(requestedView).toLowerCase()!=="fees")stopTeacherFeesAutoSync();
 document.body.classList.remove("sidebar-open");
 if(!state.teacher){render();return}
 const needsLoad=!["dashboard","students","classes"].includes(requestedView.toLowerCase());
 if(needsLoad){
   $("#app").innerHTML=`<section class="panel"><div class="loading">Loading ${esc(requestedView.replace(/^./,c=>c.toUpperCase()))}…</div></section>`;
   try{
     await loadTeacherViewData(requestedView);
   }catch(e){
     if(navigationToken!==teacherNavigationToken||state.view!==requestedView)return;
     setStatus(e.message,true);
     render();
     return;
   }
 }
 // A slower request from a previous section must never repaint or replace
 // the data belonging to the section the teacher is currently viewing.
 if(navigationToken!==teacherNavigationToken||state.view!==requestedView)return;
 render();
}
async function refreshData(){
 if(!state.teacher)return;
 const view=String(state.view||"dashboard").toLowerCase();
 if(view==="fees"){render();return}
 if(["results","attendance","posts","reports"].includes(view)){delete teacherViewLoadPromises[view];await loadTeacherViewData(view);render();return}
 const r=await api("initial");
 if(!r?.success)throw new Error(r?.error||"Teacher data unavailable.");
 state.teacher=r.teacher||state.teacher;state.profile=r.profile||state.profile;state.students=r.students||state.students;
 state.school={...state.school,...(r.school||{})};render();
}
function teacherShowLoggedOut(){
 if(!teacherToken())document.documentElement.classList.remove("teacher-has-saved-session");
 document.body.classList.remove("teacher-authenticated");document.body.classList.add("teacher-logged-out");
 document.getElementById("teacherProtectedShell")?.setAttribute("hidden","");document.getElementById("teacherLoginScreen")?.removeAttribute("hidden");
}
function teacherShowAuthenticated(){
 document.body.classList.remove("teacher-logged-out");document.body.classList.add("teacher-authenticated");
 document.getElementById("teacherLoginScreen")?.setAttribute("hidden","");document.getElementById("teacherProtectedShell")?.removeAttribute("hidden");
}
function teacherProgress(which,pct,text){
 const prefix=which==="transition"?"teacherTransition":"teacherAuthProgress";
 const bar=document.getElementById(prefix+"Bar"),percent=document.getElementById(prefix+"Percent");
 const value=Math.max(0,Math.min(100,Number(pct)||0));
 if(bar){bar.style.transition="width .25s ease";bar.style.width=value+"%";bar.setAttribute("aria-valuenow",String(value))}
 if(percent)percent.textContent=value+"%";
 if(which!=="transition"&&text){const t=document.getElementById("teacherAuthProgressText");if(t)t.textContent=text}
}
function teacherDelay(ms){return new Promise(resolve=>window.setTimeout(resolve,ms))}
function teacherStartDataReadyProgress(which,text){
 let pct=10;
 let stopped=false;
 teacherProgress(which,pct,text||"");
 const id=window.setInterval(()=>{
   if(stopped)return;
   if(pct<90){
     pct=Math.min(90,pct+10);
     teacherProgress(which,pct,text||"");
   }
 },420);
 return {
   finish:async(finalText)=>{
     stopped=true;
     window.clearInterval(id);
     let current=pct;
     while(current<100){
       current=Math.min(100,current+10);
       teacherProgress(which,current,finalText||text||"");
       if(current<100)await teacherDelay(90);
     }
   },
   stop:()=>{
     stopped=true;
     window.clearInterval(id);
   },
   value:()=>pct
 };
}
function teacherShowAuthenticated(){
 document.body.classList.remove("teacher-logged-out");document.body.classList.add("teacher-authenticated");
 document.getElementById("teacherLoginScreen")?.setAttribute("hidden","");document.getElementById("teacherProtectedShell")?.removeAttribute("hidden");
}
function teacherHydrateCachedSession(){
 const cached=teacherReadSessionCache();
 if(!cached?.teacher)return false;
 state.teacher=cached.teacher;state.profile=null;state.students=[];
 state.school={...state.school,...(cached.school||{})};
 const signedName=document.getElementById("teacherSignedInName");if(signedName)signedName.textContent=state.teacher.name||"Teacher";
 const welcome=document.getElementById("welcomeText");if(welcome)welcome.textContent=`Welcome, ${state.teacher.name||"Teacher"}`;
 const chip=document.getElementById("teacherChip");if(chip)chip.textContent=state.teacher.name||"Teacher";
 render();teacherShowAuthenticated();
 return true;
}
async function loadAuthenticatedTeacher(prefetched){
 const r=prefetched?.teacher&&Array.isArray(prefetched.students)
   ? prefetched
   : await api("initial");
 if(!r?.success)throw new Error(r?.error||"Teacher unavailable.");
 state.teacher=r.teacher;state.profile=r.profile||null;state.students=r.students||[];
 state.school={...state.school,...(r.school||{})};
 state.schoolClasses=Array.isArray(r.schoolClasses)?r.schoolClasses:state.schoolClasses;
 state.results=[];state.attendance=[];state.fees=[];state.reportFees=[];state.posts=[];state.reportCardDates=r.reportCardDates||state.reportCardDates;
 const signedName=document.getElementById("teacherSignedInName");if(signedName)signedName.textContent=state.teacher.name;
 $("#welcomeText").textContent=`Welcome, ${state.teacher.name}`;$("#teacherChip").textContent=state.teacher.name;
 setStatus("");
 render();
 teacherWriteSessionCache();
 // Teacher photo is intentionally hydrated after the dashboard is ready.
 loadTeacherProfilePhoto().then(()=>{if(state.teacher&&state.view==="dashboard")renderDashboard()}).catch(()=>{});
}
async function teacherSignOut(){
 if(!window.confirm("Do you want to log out?")) return;
 stopTeacherFeesAutoSync();
 const token=teacherToken();

 // Sign out locally first so the protected dashboard disappears immediately.
 setTeacherToken("");
 teacherClearSessionCache();
 document.documentElement.classList.remove("teacher-has-saved-session");
 state.teacher=null;state.profile=null;state.students=[];state.results=[];
 state.attendance=[];state.fees=[];state.reportFees=[];state.posts=[];state.photos={};
 teacherShowLoggedOut();
 const form=document.getElementById("teacherLoginForm");form?.reset();
 const st=document.getElementById("teacherLoginStatus");if(st)st.textContent="";
 render();
 history.replaceState(null,"",location.href);

 // Revoke the server session in the background. Do not make the UI wait for
 // Google Apps Script/PropertiesService before completing sign-out.
 if(token){
   securePost({action:"teacherAuthLogout",authToken:token}).catch(()=>null);
 }
}
async function boot(){
 const overlay=document.getElementById("teacherTransitionOverlay");
 const authProgress=document.getElementById("teacherAuthProgress");
 if(overlay)overlay.hidden=true;
 if(authProgress)authProgress.hidden=true;
 teacherProgress("transition",0);
 teacherProgress("auth",0,"Signing in...");
 const restoredToken=teacherToken();
 // Restore the last authenticated teacher shell immediately on refresh. The
 // server session is still verified below, but the login form is never flashed
 // in front of a teacher who already has a saved authenticated session.
 const restoredFromCache=restoredToken?teacherHydrateCachedSession():false;
 if(restoredToken)document.documentElement.classList.add("teacher-has-saved-session");
 if(!restoredToken)teacherShowLoggedOut();
 try{
   // Use the built-in school defaults immediately. Fetch authoritative
   // branding in the background so a slow public request cannot delay login.
   $("#schoolName").textContent=state.school.name||"AFISAP ROYAL ACADEMY";$("#schoolMotto").textContent=state.school.motto||"LEARNING TO LEARN";
   jsonp("teacherPortalGet",{type:"school"}).then(s=>{
     if(s?.school){
       state.school={...state.school,...s.school};
       $("#schoolName").textContent=state.school.name||"AFISAP ROYAL ACADEMY";
       $("#schoolMotto").textContent=state.school.motto||"LEARNING TO LEARN";
     }
   }).catch(()=>{});
   $("#teacherTogglePassword").onclick=()=>{const p=$("#teacherLoginPassword"),b=$("#teacherTogglePassword");p.type=p.type==="password"?"text":"password";b.textContent=p.type==="password"?"Show":"Hide"};
   $("#teacherLoginForm").onsubmit=async e=>{
     e.preventDefault();
     const btn=$("#teacherLoginButton"),status=$("#teacherLoginStatus"),progress=$("#teacherAuthProgress");
     btn.disabled=true;
     btn.textContent="Signing in...";
     if(status)status.textContent="";
     teacherProgress("auth",0,"Signing in...");
     if(progress)progress.hidden=false;

     const visual=teacherStartDataReadyProgress("auth","Signing in...");
     try{
       // Start the real authentication immediately while the percentage moves.
       const r=await securePost({
         action:"teacherAuthLogin",
         username:$("#teacherLoginUsername").value,
         password:$("#teacherLoginPassword").value
       });

       if(!r?.success||!r.authToken)throw new Error(r?.error||"Invalid username or password.");
       setTeacherToken(r.authToken);

       // The login response now carries the minimal dashboard payload, so do
       // not make a second authenticated round-trip just to hydrate the shell.
       teacherProgress("auth",Math.max(visual.value(),70),"Loading teacher data...");
       btn.textContent="Loading teacher data...";
       await loadAuthenticatedTeacher(r);

       // 100% now means the authenticated dashboard is genuinely ready.
       await visual.finish("Sign in successful.");
       await teacherDelay(150);

       if(progress)progress.hidden=true;
       teacherShowAuthenticated();
     }catch(err){
       visual.stop();
       setTeacherToken("");
       teacherProgress("auth",0,"Signing in...");
       if(progress)progress.hidden=true;
       if(status)status.textContent=err.message;
       teacherShowLoggedOut();
     }finally{
       btn.disabled=false;
       btn.textContent="SIGN IN";
     }
   };
   $("#teacherLogout").onclick=teacherSignOut;
   const token=restoredToken||teacherToken();
   if(token){
     try{
       const status=await securePost({action:"teacherAuthSessionStatus",authToken:token});
       if(status?.success&&status.authenticated){
         await loadAuthenticatedTeacher();
         teacherShowAuthenticated();
         return;
       }
       setTeacherToken("");
       teacherClearSessionCache();
       document.documentElement.classList.remove("teacher-has-saved-session");
     }catch(sessionError){
       // A temporary network error must not destroy or visually log out a
       // previously authenticated teacher. Keep the cached shell and token.
       if(restoredFromCache){teacherShowAuthenticated();return}
       const st=$("#teacherLoginStatus");
       if(st)st.textContent="Could not verify the saved session. Please check the connection and refresh.";
     }
   }
   if(!teacherToken()||!restoredFromCache)teacherShowLoggedOut();
 }catch(e){const st=$("#teacherLoginStatus");if(st)st.textContent=e.message;teacherShowLoggedOut()}
}
window.addEventListener("pageshow",async()=>{
 const overlay=document.getElementById("teacherTransitionOverlay");
 if(overlay)overlay.hidden=true;
 if(!teacherToken()){teacherShowLoggedOut();return}
 try{
   const s=await securePost({action:"teacherAuthSessionStatus",authToken:teacherToken()});
   if(!s?.success||!s.authenticated){setTeacherToken("");teacherClearSessionCache();document.documentElement.classList.remove("teacher-has-saved-session");teacherShowLoggedOut()}
 }catch(e){
   // Do not erase or visually revoke a saved session only because a refresh
   // verification request temporarily failed. The next request/reload retries.
   if(!teacherToken())teacherShowLoggedOut();
 }
});
$("#menuBtn").onclick=()=>document.body.classList.toggle("sidebar-open");document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>{navigateTeacherView(b.dataset.view)});boot();
