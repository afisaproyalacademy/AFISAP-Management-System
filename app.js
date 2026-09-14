const K='afisap_v3_final';const D={school:{name:'AFISAP ROYAL ACADEMY',year:'2026/2027',term:'Term 1',head:'',phone:'055 610 4186 / 024 272 7685 / 024 874 3558',email:'afisaproyalacademy@gmail.com',address:'Agogo-Boaso'},students:[],staff:[],classes:[],results:[],attendance:[],teacherAttendance:{},fees:[],feeRecords:[],subjects:['Computing','Creative Arts','English','French','History','Mathematics','R M E','Science','TWI']};let d=JSON.parse(JSON.stringify(D));
const AFISAP_MANAGEMENT_CLASSES = [
  "Nursery 1","Nursery 2","KG 1","KG 2",
  "Class 1","Class 2","Class 3","Class 4","Class 5","Class 6",
  "JHS 1","JHS 2","JHS 3"
];
const AFISAP_CLASSES = [
  "Creche","Nursery 1","Nursery 2","KG 1","KG 2",
  "Class 1","Class 2","Class 3","Class 4","Class 5","Class 6",
  "JHS 1","JHS 2","JHS 3"
];

function afisapDateOnly(value){
  const raw=String(value??"").trim();
  if(!raw)return "";
  const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso)return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dte=new Date(raw);
  if(!Number.isNaN(dte.getTime())){
    const y=dte.getUTCFullYear(),m=String(dte.getUTCMonth()+1).padStart(2,"0"),day=String(dte.getUTCDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }
  return raw;
}

function afisapCentralClassNames(){
  const created=(d.classes||[]).map(c=>String(c.name||c.className||"").trim()).filter(Boolean);
  const source=created.length?created:AFISAP_CLASSES;
  const out=[],seen=new Set();
  source.forEach(name=>{
    const clean=String(name||"").trim(),key=clean.toLowerCase();
    if(clean&&!seen.has(key)){seen.add(key);out.push(clean)}
  });
  const rank=new Map(AFISAP_CLASSES.map((n,i)=>[n.toLowerCase(),i]));
  return out.sort((a,b)=>{
    const ar=rank.has(a.toLowerCase())?rank.get(a.toLowerCase()):999;
    const br=rank.has(b.toLowerCase())?rank.get(b.toLowerCase()):999;
    return ar-br || (ar===999?a.localeCompare(b):0)
  })
}


/* AFISAP PASSPORT UPLOAD LOADER */
function afisapShowUploadLoader(title, message, percent){
  let el=document.getElementById("afisapUploadLoader");
  if(!el){
    el=document.createElement("div");
    el.id="afisapUploadLoader";
    el.innerHTML=`
      <div class="afisap-upload-card">
        <div class="afisap-upload-logo">🎓</div>
        <div class="afisap-upload-title" id="afisapUploadTitle">Saving Student</div>
        <div class="afisap-upload-message" id="afisapUploadMessage">Please wait...</div>
        <div class="afisap-upload-track"><div id="afisapUploadBar" class="afisap-upload-bar"></div></div>
        <div id="afisapUploadPercent" class="afisap-upload-percent">0%</div>
      </div>`;
    document.body.appendChild(el);
    const style=document.createElement("style");
    style.id="afisapUploadLoaderStyle";
    style.textContent=`
      #afisapUploadLoader{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:20px}
      .afisap-upload-card{width:min(390px,92vw);background:#fff;border-radius:18px;padding:28px 25px;text-align:center;box-shadow:0 18px 60px rgba(0,0,0,.25);font-family:inherit}
      .afisap-upload-logo{width:58px;height:58px;margin:0 auto 12px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:29px;background:#f1f3f5}
      .afisap-upload-title{font-size:19px;font-weight:700;margin-bottom:7px}
      .afisap-upload-message{font-size:14px;opacity:.72;min-height:38px;display:flex;align-items:center;justify-content:center}
      .afisap-upload-track{height:10px;background:#e9ecef;border-radius:999px;overflow:hidden;margin:18px 0 9px}
      .afisap-upload-bar{height:100%;width:0%;border-radius:999px;background:currentColor;transition:width .35s ease}
      .afisap-upload-percent{font-size:13px;font-weight:700}
      .afisap-result-save-spinner{display:inline-block;width:13px;height:13px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:-2px;margin-right:7px;animation:afisapResultSpin .7s linear infinite}
      @keyframes afisapResultSpin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(style);
  }
  el.style.display="flex";
  document.getElementById("afisapUploadTitle").textContent=title||"Saving Student";
  document.getElementById("afisapUploadMessage").textContent=message||"Please wait...";
  const p=Math.max(0,Math.min(100,Number(percent)||0));
  document.getElementById("afisapUploadBar").style.width=p+"%";
  document.getElementById("afisapUploadPercent").textContent=Math.round(p)+"%";
}
function afisapUpdateUploadLoader(message, percent){
  const el=document.getElementById("afisapUploadLoader");
  if(!el)return;
  document.getElementById("afisapUploadMessage").textContent=message||"Please wait...";
  const p=Math.max(0,Math.min(100,Number(percent)||0));
  document.getElementById("afisapUploadBar").style.width=p+"%";
  document.getElementById("afisapUploadPercent").textContent=Math.round(p)+"%";
}
function afisapHideUploadLoader(){
  const el=document.getElementById("afisapUploadLoader");
  if(el)el.style.display="none";
}

function migrateStudentPhotos(){
  if(!Array.isArray(d.students)) d.students=[];
  d.students.forEach(s=>{if(!Object.prototype.hasOwnProperty.call(s,"photo"))s.photo="";if(!Object.prototype.hasOwnProperty.call(s,"admissionDate"))s.admissionDate="";});
}
migrateStudentPhotos();

function ensureAfisapData(){
  if(!Array.isArray(d.classes)) d.classes=[];
  if(!Array.isArray(d.staff)) d.staff=[];
  if(!Array.isArray(d.students)) d.students=[];
  if(!Array.isArray(d.results)) d.results=[];
  if(!Array.isArray(d.attendance)) d.attendance=[];
  if(!Array.isArray(d.fees)) d.fees=[];
  if(!Array.isArray(d.feeRecords)) d.feeRecords=[];
  if(!Array.isArray(d.announcementsAssignments)) d.announcementsAssignments=[];
  if(!d.teacherAttendance || typeof d.teacherAttendance!=='object' || Array.isArray(d.teacherAttendance)) d.teacherAttendance={};
  if(!d.reportCardDates || typeof d.reportCardDates!=='object' || Array.isArray(d.reportCardDates)) d.reportCardDates={};
}
ensureAfisapData();
if(!d.adminProfile || typeof d.adminProfile!=='object') d.adminProfile={photo:''};
if(typeof d.adminProfile.photo!=='string') d.adminProfile.photo='';
/* AFISAP CLOUD DATABASE INTEGRATION — STUDENTS MODULE */
const AFISAP_CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbxHtxKgKlw8bfGHWmeLsBTl7fFIRLSTHLPjSmjfS1S7WIF4puoIzGKOdnw8HBHRHdCN/exec";

const AFISAP_ADMIN_SESSION_TOKEN_KEY="afisap_admin_session_token_v2";
function afisapAdminToken(){try{return sessionStorage.getItem(AFISAP_ADMIN_SESSION_TOKEN_KEY)||""}catch(e){return""}}
function afisapSetAdminToken(token){try{token?sessionStorage.setItem(AFISAP_ADMIN_SESSION_TOKEN_KEY,String(token)):sessionStorage.removeItem(AFISAP_ADMIN_SESSION_TOKEN_KEY)}catch(e){}}
async function afisapSecurePost(payload,{includeAuth=true}={}){
  const body=Object.assign({},payload||{});
  if(includeAuth){const token=afisapAdminToken();if(token)body.authToken=token;}
  const response=await fetch(AFISAP_CLOUD_API_URL,{
    method:"POST",redirect:"follow",
    headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},
    body:JSON.stringify(body),cache:"no-store",credentials:"omit"
  });
  if(!response.ok)throw new Error("School database request failed ("+response.status+").");
  const text=await response.text();
  try{return JSON.parse(text)}catch(e){throw new Error("School database returned an unreadable response.");}
}
const AFISAP_ADMIN_SECURE_ACTIONS=new Set([
  "read","search","count","create","createFeeRecordFast","update","delete","bulkCreateFees","bulkPromoteStudents","adminGetPendingPromotions","adminApplyPromotionRollover","recalculatePositions","saveStudentAttendanceBatch",
  "configGet","configSet","adminProfileGet","adminProfileSet","driveUpload","driveGet","driveDelete","driveList",
  "adminGetTeacherLogin","adminSetTeacherCredentials","adminResetTeacherPassword","adminSetTeacherLoginStatus"
]);


async function afisapVerifyLiveFeesBackend(){
  // Compatibility no-op. Fee operations must be decided by the actual
  // authenticated write response, not by a separate deployment-version probe.
  return {success:true};
}


function afisapCloudPost(payload){
  try{
    return afisapSecurePost(payload,{includeAuth:true}).then(result=>{
      if(!result||result.success!==true){
        const message=(result&&result.error)?result.error:"Cloud database write failed.";
        console.error("AFISAP cloud write failed:",message,result);
      }
      return result;
    }).catch(error=>({success:false,error:error&&error.message?error.message:"Cloud database request failed."}));
  }catch(e){
    return Promise.resolve({success:false,error:e&&e.message?e.message:"Cloud database request failed."});
  }
}

function afisapCloudJsonp(params){
  if(AFISAP_ADMIN_SECURE_ACTIONS.has(String(params&&params.action||""))){
    return afisapSecurePost(params,{includeAuth:true});
  }
  return new Promise((resolve,reject)=>{
    const callback="afisapCloudCb_"+Date.now()+"_"+Math.floor(Math.random()*100000);
    const script=document.createElement("script");
    const query=new URLSearchParams(Object.assign({},params,{callback}));
    const timer=setTimeout(()=>{
      cleanup();
      reject(new Error("Cloud database request timed out."));
    },45000);
    function cleanup(){
      clearTimeout(timer);
      try{delete window[callback];}catch(e){window[callback]=undefined;}
      if(script.parentNode)script.parentNode.removeChild(script);
    }
    window[callback]=(data)=>{
      cleanup();
      resolve(data);
    };
    script.onerror=()=>{
      cleanup();
      reject(new Error("Cloud database request failed."));
    };
    script.src=AFISAP_CLOUD_API_URL+"?"+query.toString();
    document.head.appendChild(script);
  });
}

/* ============================================================
 * AFISAP MULTI-DEVICE CLOUD AUTH + SYNC
 * Google Sheets/Drive are the shared source of truth.
 * Browser state is temporary display/session state only; central storage remains authoritative.
 * ============================================================ */
async function afisapAuthLogin(email,password){
  return afisapSecurePost({action:"authLogin",email:String(email||"").trim().toLowerCase(),password:String(password||"")},{includeAuth:false});
}
async function afisapAuthRequestReset(email){
  return afisapSecurePost({action:"authRequestReset",email:String(email||"").trim().toLowerCase()},{includeAuth:false});
}
async function afisapAuthResetPassword(email,otp,password){
  return afisapSecurePost({action:"authResetPassword",email:String(email||"").trim().toLowerCase(),otp:String(otp||"").trim(),password:String(password||"")},{includeAuth:false});
}
async function afisapAuthSessionStatus(){
  return afisapSecurePost({action:"authSessionStatus",authToken:afisapAdminToken()},{includeAuth:false});
}
async function afisapAuthLogout(){
  const token=afisapAdminToken();
  try{return await afisapSecurePost({action:"authLogout",authToken:token},{includeAuth:false})}
  finally{afisapSetAdminToken("")}
}
async function afisapLoadCentralConfig(){
  try{
    const r=await afisapCloudJsonp({action:"configGet"});
    if(r?.success && r.config){
      if(r.config.school && typeof r.config.school==="object"){
        d.school=Object.assign({},d.school||{},r.config.school);
      }
      if(Array.isArray(r.config.subjects) && r.config.subjects.length){
        const cloudSubjects=r.config.subjects.map(x=>String(x).trim()).filter(Boolean);
        d.subjects=[...new Set([...(Array.isArray(d.subjects)?d.subjects:[]),...cloudSubjects])];
      }
      persist();
    }
  }catch(e){ console.warn("AFISAP central config unavailable:",e); }
}
async function afisapSaveCentralConfig(){
  try{
    return await afisapCloudJsonp({
      action:"configSet",
      config:JSON.stringify({
        school:d.school||{},
        subjects:Array.isArray(d.subjects)?d.subjects:[]
      })
    });
  }catch(e){
    console.warn("AFISAP central config save failed:",e);
    return {success:false,error:e.message};
  }
}
async function afisapLoadCentralAdminProfile(){
  try{
    const r=await afisapCloudJsonp({action:"adminProfileGet"});
    if(!r?.success || !r.fileId) return;
    d.adminProfile=d.adminProfile||{};
    d.adminProfile.photoFileId=String(r.fileId);

    const f=await afisapCloudJsonp({action:"driveGet",fileId:String(r.fileId)});
    if(f?.success && f.fileData){
      d.adminProfile.photo=`data:${String(f.mimeType||"image/jpeg")};base64,${f.fileData}`;
      persist();
    }
  }catch(e){ console.warn("AFISAP central administrator profile unavailable:",e); }
}

function afisapStudentFromCloudRecord(r){
  const s=typeof afisapCloudToStudent==="function"
    ? afisapCloudToStudent(r)
    : {};
  const passportPhotoFileId=afisapDriveFileId(r["Passport Photo"]||r["Passport Photo URL"]||"");
  const passportPhotoUrl=afisapStudentPhotoSource(r["Passport Photo"],r["Passport Photo URL"],s.photo);
  return Object.assign(s,{
    passportPhotoFileId:passportPhotoFileId,
    passportPhotoUrl:passportPhotoUrl,
    photo:passportPhotoUrl
  });
}
function afisapStaffFromCloudRecord(r){
  const s=typeof afisapCloudToStaff==="function"
    ? afisapCloudToStaff(r)
    : {};
  const passportPhotoFileId=afisapDriveFileId(r["Passport Photo"]||r["Passport Photo URL"]||"");
  const passportPhotoUrl=afisapStudentPhotoSource(r["Passport Photo"],r["Passport Photo URL"],s.photo);
  return Object.assign(s,{
    passportPhotoFileId:passportPhotoFileId,
    passportPhotoUrl:passportPhotoUrl,
    photo:passportPhotoUrl,
    ghanaCard:String(r["Ghana Card"]||r["Ghana Card Number"]||s.ghanaCard||"").trim(),
    dob:String(r["Date of Birth"]||s.dob||"").trim()
  });
}

async function afisapSyncAllFromCloud(){
  try{
    const results=await Promise.all([
      afisapCloudJsonp({action:"read",sheet:"Students"}),
      afisapCloudJsonp({action:"read",sheet:"Teachers"}),
      afisapCloudJsonp({action:"read",sheet:"Classes"}),
      afisapCloudJsonp({action:"read",sheet:"Student Attendance"}),
      afisapCloudJsonp({action:"read",sheet:"Teacher Attendance"}),
      afisapCloudJsonp({action:"read",sheet:"Results"}),
      afisapCloudJsonp({action:"read",sheet:"Fees"}),
      afisapCloudJsonp({action:"read",sheet:"Subjects"}),
      afisapCloudJsonp({action:"read",sheet:"Academic Settings"}),
      afisapCloudJsonp({action:"read",sheet:"Announcements & Assignments"})
    ]);

    const [stuR,staffR,classR,attR,tattR,resR,feeR,subR,academicSettingsR,announcementsR]=results;
    const ok=x=>x?.success===true && Array.isArray(x.records);

    if(ok(stuR)){
      const cachedStudents=new Map((d.students||[]).map(s=>[String(s.sid||"").trim(),s]));
      d.students=stuR.records.filter(r=>String(r["Student ID"]||"").trim())
        .map(r=>{
          const student=afisapStudentFromCloudRecord(r);
          const cached=cachedStudents.get(String(student.sid||"").trim());

          // Cloud remains authoritative. A blank cloud photo must not erase a
          // previously valid cached Drive/photo reference while sync settles.
          if(!student.photo && cached){
            const fallback=afisapStudentPhotoSource(
              cached.passportPhotoFileId,
              cached.passportPhotoUrl,
              cached.photo
            );
            if(fallback){
              student.photo=fallback;
              student.passportPhotoUrl=fallback;
              student.passportPhotoFileId=afisapDriveFileId(
                cached.passportPhotoFileId||cached.passportPhotoUrl||cached.photo
              );
            }
          }
          student._afisapPromotedTo=String(r["Promoted To"]||r["Promotion Class"]||"").trim();
          student._afisapPreviousClass=String(r["Previous Class"]||"").trim();
          student._afisapPromotionAt=String(r["Promotion Applied At"]||r["Promotion Date"]||"").trim();
          student._afisapPromotionStatus=String(r["Promotion Status"]||"").trim().toLowerCase();
          student._afisapPromotionAcademicYear=String(r["Promotion Academic Year"]||"").trim();
          student._afisapPromotionEffectiveAcademicYear=String(r["Promotion Effective Academic Year"]||"").trim();
          return student;
        });
    }
    if(ok(staffR)){
      const cloudStaff=staffR.records.filter(r=>String(r["Staff ID"]||"").trim())
        .map(afisapStaffFromCloudRecord);
      const cloudStaffIds=new Set(cloudStaff.map(s=>String(s.sid||"").trim()));

      // Keep Google Sheets authoritative, but do not let a transient/incomplete
      // Teachers read erase a staff member that this browser has just confirmed
      // as successfully created in Google Sheets. The grace marker is local only
      // and expires automatically; normal cloud reconciliation resumes after it.
      const now=Date.now();
      const recentConfirmed=(d.staff||[]).filter(s=>{
        const sid=String(s.sid||"").trim();
        const confirmedAt=Number(s._afisapStaffCloudConfirmedAt||0);
        return sid && !cloudStaffIds.has(sid) && confirmedAt && (now-confirmedAt)<120000;
      });

      d.staff=cloudStaff.concat(recentConfirmed);
    }

    // Rebuild the visible passport images from their permanent Google Drive
    // File IDs. This survives refresh, a new browser and another device because
    // the image bytes are fetched again from Drive through Apps Script.
    await Promise.all([
      afisapHydratePermanentPhotos(d.students),
      Promise.resolve() // Staff photos are displayed from Drive without storing Base64 in d.staff.
    ]);

    if(ok(classR)){
      const cloudClasses=classR.records
        .filter(r=>String(r["Class ID"]||"").trim()||String(r["Class Name"]||"").trim())
        .map(r=>typeof afisapCloudToClass==="function"?afisapCloudToClass(r):{
          id:String(r["Class ID"]||Date.now()),classId:String(r["Class ID"]||""),
          name:String(r["Class Name"]||""),teacher:String(r["Class Teacher"]||""),
          level:String(r["Level/Grade"]||""),academicYear:String(r["Academic Year"]||""),
          capacity:String(r["Capacity"]||""),status:String(r["Status"]||"Active")
        });

      const cloudClassIds=new Set(cloudClasses.map(c=>String(c.classId||c.id||"").trim()));
      const cloudClassNames=new Set(cloudClasses.map(c=>String(c.name||"").trim().toLowerCase()));
      const now=Date.now();

      // Google Sheets remains authoritative. This short grace period only
      // protects a class that the create request has already confirmed while
      // a following cloud read is still catching up.
      const recentConfirmedClasses=(d.classes||[]).filter(c=>{
        const classId=String(c.classId||c.id||"").trim();
        const className=String(c.name||"").trim().toLowerCase();
        const confirmedAt=Number(c._afisapClassCloudConfirmedAt||0);
        const alreadyInCloud=
          (classId && cloudClassIds.has(classId)) ||
          (className && cloudClassNames.has(className));
        return !alreadyInCloud && confirmedAt && (now-confirmedAt)<120000;
      });

      d.classes=cloudClasses.concat(recentConfirmedClasses);
    }

    const studentMap=new Map(d.students.map(s=>[String(s.sid||"").trim(),s]));
    const staffMap=new Map(d.staff.map(s=>[String(s.sid||"").trim(),s]));

    if(ok(attR)){
      const a={};
      attR.records.forEach(r=>{
        const aid=String(r["Attendance ID"]||Date.now()).trim();
        const sid=String(r["Student ID"]||"").trim();
        const st=studentMap.get(sid);
        const present=String(r["Present"]??r["Status"]??"").trim().toLowerCase();
        a[aid]={studentId:st?st.id:sid,studentSid:sid,date:String(r["Date"]||r["Attendance Date"]||"").trim(),
          present:["yes","true","1"].includes(present),status:String(r["Present"]||r["Status"]||"").trim(),academicYear:String(r["Academic Year"]||"").trim(),term:String(r["Term"]||"").trim(),attendanceId:aid};
      });
      d.attendance=a;
    }

    if(ok(tattR)){
      const a={};
      tattR.records.forEach(r=>{
        const aid=String(r["Attendance ID"]||Date.now()).trim();
        const sid=String(r["Staff ID"]||"").trim();
        const present=String(r["Present"]??r["Status"]??"").trim().toLowerCase();
        a[aid]={attendanceId:aid,staffId:sid,date:String(r["Date"]||"").trim(),
          present:["yes","true","1"].includes(present),status:String(r["Present"]||"").trim(),dateCreated:String(r["Date Created"]||"").trim(),lastUpdated:String(r["Last Updated"]||"").trim()};
      });
      d.teacherAttendance=a;
    }

    if(ok(resR)){
      d.results=resR.records.filter(r=>String(r["Result ID"]||"").trim()).map(r=>{
        const sid=String(r["Student ID"]||"").trim();
        const st=studentMap.get(sid);
        return {
          id:String(r["Result ID"]),resultId:String(r["Result ID"]),
          studentId:st?st.id:sid,studentSid:sid,
          studentName:String(r["Student Name"]||"").trim(),
          subject:String(r["Subject"]||"").trim(),
          className:String(r["Class"]||"").trim(),class:String(r["Class"]||"").trim(),
          cs:Number(r["Class Score"]||0),es:Number(r["Exam Score"]||0),
          position:String(r["Position"]||"").trim(),
          remarks:String(r["Remarks"]||"").trim(),
          academicYear:String(r["Academic Year"]||"").trim(),
          term:String(r["Term"]||"").trim(),
          dateCreated:String(r["Date Created"]||"").trim(),
          lastUpdated:String(r["Last Updated"]||"").trim()
        };
      });
    }

    if(ok(resR)){
      afisapRecalculateAllAcademicPositionsLocally();
    }

    if(ok(feeR)){
      const rows=feeR.records.filter(r=>String(r["Fee ID"]||"").trim());
      {
        const feeItemMap=new Map();
        rows.filter(r=>/^FEE_ITEM\|/i.test(String(r["Fee ID"]||"")))
          .map(r=>({id:String(r["Fee ID"]),sheetRow:Number(r["__SheetRow"]||0),name:String(r["Fee Item"]||"").trim(),amount:Number(r["Amount Due"]||0)}))
          .filter(x=>x.name)
          .forEach(x=>{
            const key=x.name.toLowerCase();
            if(!feeItemMap.has(key))feeItemMap.set(key,x);
          });
        d.fees=[...feeItemMap.values()];
      }
      d.feeRecords=rows.filter(r=>!/^FEE_ITEM\|/i.test(String(r["Fee ID"]||""))).map(r=>{
        let sid=String(r["Student ID"]||"").trim(),st=studentMap.get(sid);
        if(!st){
          const admission=String(r["Admission Number"]||"").trim().toLowerCase();
          const feeName=String(r["Student Name"]||"").trim().toLowerCase().replace(/\s+/g," ");
          const matches=(d.students||[]).filter(s=>{
            const sadm=String(s.admissionNumber||s["Admission Number"]||"").trim().toLowerCase();
            const sname=String(s.name||[s.firstName,s.middleName,s.surname].filter(Boolean).join(" ")).trim().toLowerCase().replace(/\s+/g," ");
            return (admission&&sadm===admission)||(!admission&&feeName&&sname===feeName);
          });
          if(matches.length===1){st=matches[0];sid=String(st.sid||st.studentId||st["Student ID"]||"").trim();}
        }
        return {
          id:String(r["Fee ID"]),feeId:String(r["Fee ID"]),
          sheetRow:Number(r["__SheetRow"]||0),
          studentId:st?st.id:sid,studentSid:sid,
          admissionNumber:String(r["Admission Number"]||"").trim(),
          studentName:String(r["Student Name"]||"").trim(),
          feeItem:String(r["Fee Item"]||"").trim(),
          amountDue:Number(r["Amount Due"]||0),amountPaid:Number(r["Amount Paid"]||0),
          balance:Number(r["Balance"]??Math.max(0,Number(r["Amount Due"]||0)-Number(r["Amount Paid"]||0))),
          date:String(r["Date"]||"").trim(),
          academicYear:String(r["Academic Year"]||"").trim(),
          term:String(r["Term"]||"").trim(),
          dateCreated:String(r["Date Created"]||"").trim(),
          lastUpdated:String(r["Last Updated"]||"").trim()
        };
      });
    }

    if(ok(subR)){
      const names=subR.records.map(r=>String(
        r["Subject Name"]||r["Subject"]||r["Name"]||""
      ).trim()).filter(Boolean);
      if(names.length){
        d.subjects=[...new Set([...(Array.isArray(d.subjects)?d.subjects:[]),...names])];
      }
    }

    if(ok(academicSettingsR)){
      const dateStore={};
      academicSettingsR.records.forEach(r=>{
        const settingId=String(r["Setting ID"]||"").trim();
        if(!settingId.toLowerCase().startsWith("report-card-dates|")) return;
        const academicYear=String(r["Academic Year"]||"").trim();
        const term=afisapNormalizeReportTerm(r["Term"]||"");
        if(!academicYear || !term) return;
        dateStore[afisapReportCardDateKey(academicYear,term)]={
          settingId,
          academicYear,
          term,
          vacationDate:String(r["Vacation Date"]||"").trim(),
          openingDate:String(r["Opening Date"]||"").trim(),
          lastUpdated:String(r["Last Updated"]||"").trim()
        };
      });
      d.reportCardDates=dateStore;
    }

    if(ok(announcementsR)){
      d.announcementsAssignments=announcementsR.records
        .filter(r=>String(r["Announcement ID"]||"").trim())
        .map(r=>({
          id:String(r["Announcement ID"]||"").trim(),
          type:String(r["Type"]||"Announcement").trim(),
          title:String(r["Title"]||"").trim(),
          message:String(r["Message"]||"").trim(),
          className:String(r["Class"]||"").trim(),
          subject:String(r["Subject"]||"").trim(),
          targetAudience:String(r["Target Audience"]||"").trim(),
          datePosted:String(r["Date Posted"]||"").trim(),
          dueDate:String(r["Due Date"]||"").trim(),
          attachmentFileId:String(r["Attachment"]||"").trim(),
          attachmentName:String(r["Attachment Name"]||"").trim(),
          status:String(r["Status"]||"Published").trim(),
          createdBy:String(r["Created By"]||"Administrator").trim(),
          academicYear:String(r["Academic Year"]||"").trim(),
          term:String(r["Term"]||"").trim(),
          lastUpdated:String(r["Last Updated"]||"").trim()
        }));
    }

    persist();
    return {success:true};
  }catch(e){
    console.warn("AFISAP full cloud sync failed:",e);
    return {success:false,error:e.message};
  }
}



function afisapNormalizeReportTerm(term){
  const raw=String(term||"").trim();
  if(!raw) return "";
  const m=raw.match(/(\d+)/);
  return m ? "Term "+m[1] : raw;
}

function afisapReportCardDateKey(year,term){
  return String(year||"").trim()+"|"+afisapNormalizeReportTerm(term);
}

function afisapGetReportCardDates(year,term){
  const store=(d.reportCardDates && typeof d.reportCardDates==="object") ? d.reportCardDates : {};
  const key=afisapReportCardDateKey(year,term);
  const found=store[key];
  if(found && typeof found==="object"){
    return {
      vacationDate:String(found.vacationDate||found["Vacation Date"]||"").trim(),
      openingDate:String(found.openingDate||found["Opening Date"]||"").trim()
    };
  }

  // Legacy compatibility only for the school's currently selected period.
  const schoolYear=String(d.school?.year||"").trim();
  const schoolTerm=afisapNormalizeReportTerm(d.school?.term||"");
  if(String(year||"").trim()===schoolYear && afisapNormalizeReportTerm(term)===schoolTerm){
    return {
      vacationDate:String(d.school?.vacationDate||"").trim(),
      openingDate:String(d.school?.openingDate||d.school?.reopeningDate||"").trim()
    };
  }
  return {vacationDate:"",openingDate:""};
}

function afisapFormatReportCardDate(value){
  const raw=String(value||"").trim();
  if(!raw) return "";
  const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return raw;
  const year=Number(m[1]), month=Number(m[2]), day=Number(m[3]);
  if(!year || month<1 || month>12 || day<1 || day>31) return "";
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const mod100=day%100;
  const suffix=(mod100>=11&&mod100<=13)?"th":({1:"st",2:"nd",3:"rd"}[day%10]||"th");
  return day+suffix+" "+months[month-1]+" "+year;
}

function afisapReportCardDateSettingId(year,term){
  return "report-card-dates|"+String(year||"").trim()+"|"+afisapNormalizeReportTerm(term);
}

async function afisapSaveReportCardDatesToCloud(year,term,vacationDate,openingDate){
  const academicYear=String(year||"").trim();
  const normalizedTerm=afisapNormalizeReportTerm(term);
  const settingId=afisapReportCardDateSettingId(academicYear,normalizedTerm);
  const now=new Date().toISOString();
  const data={
    "Setting ID":settingId,
    "Academic Year":academicYear,
    "Term":normalizedTerm,
    "Vacation Date":String(vacationDate||"").trim(),
    "Opening Date":String(openingDate||"").trim(),
    "Last Updated":now
  };

  // Update first so an existing period is edited in place. If it does not yet
  // exist, create exactly one Academic Settings row for that Year + Term.
  let result=await afisapCloudPost({
    action:"update",
    sheet:"Academic Settings",
    idField:"Setting ID",
    idValue:settingId,
    data
  });

  if(!result || result.success!==true){
    result=await afisapCloudPost({
      action:"create",
      sheet:"Academic Settings",
      data
    });
  }
  return result;
}

async function afisapResolveStudentName(student){
  const localName=String(
    student?.name ||
    [student?.firstName,student?.middleName,student?.surname,student?.lastName,student?.otherName]
      .filter(v=>String(v||"").trim())
      .map(v=>String(v).trim())
      .join(" ")
  ).trim();

  if(localName) return localName;

  const studentId=String(
    student?.sid || student?.studentId || student?.["Student ID"] || ""
  ).trim();

  if(!studentId) return "";

  try{
    const cloud=await afisapCloudJsonp({
      action:"search",
      sheet:"Students",
      field:"Student ID",
      value:studentId
    });

    if(cloud && cloud.success && Array.isArray(cloud.records) && cloud.records.length){
      const r=cloud.records[0];
      return String(
        r["Student Name"] ||
        r["Full Name"] ||
        [r["First Name"],r["Middle Name"],r["Last Name"]]
          .filter(v=>String(v||"").trim())
          .map(v=>String(v).trim())
          .join(" ")
      ).trim();
    }
  }catch(error){
    console.warn("AFISAP: could not resolve student name from cloud:",error);
  }

  return "";
}

/* AFISAP CLASS ROSTER — Roll No. / No. on Roll
   Roll No. is independent of academic Position. Existing valid class roll
   numbers are preserved; students without one receive the next available
   number in the current class roster. No. on Roll is always calculated from
   the student's current class. */
function afisapClassRosterInfo(student){
  const students=Array.isArray(d.students)?d.students:[];
  const className=String(student&&(student.class||student.className)||"").trim();
  if(!className) return {rollNo:"",noOnRoll:0};

  const members=students.filter(s=>
    String(s&&(s.class||s.className)||"").trim().toLowerCase()===className.toLowerCase()
  );
  const assigned=new Map();
  const used=new Set();

  // Preserve existing valid, unique roll numbers in the class.
  members.forEach(s=>{
    const raw=String(s&&(s.rollNo||s["Roll No."])||"").trim();
    const n=/^\d+$/.test(raw)?Number(raw):0;
    if(n>0&&!used.has(n)){
      used.add(n);
      assigned.set(s,n);
    }
  });

  // Assign only missing/duplicate roll numbers using the current roster order.
  let next=1;
  members.forEach(s=>{
    if(assigned.has(s)) return;
    while(used.has(next)) next++;
    assigned.set(s,next);
    used.add(next);
    next++;
  });

  const n=assigned.get(student)||0;
  return {
    rollNo:n?String(n).padStart(2,"0"):"",
    noOnRoll:members.length
  };
}

/* AFISAP GOOGLE DRIVE — Student Passport Photos */

async function afisapPreparePassportPhoto(file){
  if(!file || !String(file.type||"").startsWith("image/")) return file;

  const maxDimension=1200;
  const bitmap=await new Promise((resolve,reject)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Could not decode the passport photo."));};
    img.src=url;
  });

  const w=bitmap.naturalWidth||bitmap.width;
  const h=bitmap.naturalHeight||bitmap.height;
  const scale=Math.min(1,maxDimension/Math.max(w,h));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(w*scale));
  canvas.height=Math.max(1,Math.round(h*scale));

  const ctx=canvas.getContext("2d");
  if(!ctx) return file;
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);

  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.78));
  if(!blob) return file;
  return new File([blob],"passport-"+Date.now()+".jpg",{type:"image/jpeg"});
}

async function afisapDriveUpload(file, category, ownerId){
  if(!file)throw new Error("No file selected.");
  if(file.size>15*1024*1024)throw new Error("File is larger than 15 MB.");
  const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||""));
    reader.onerror=()=>reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
  const result=await afisapSecurePost({
    action:"driveUpload",fileName:file.name,mimeType:file.type||"application/octet-stream",
    fileData:data,category:String(category||"school-documents"),studentId:String(ownerId||"").trim()
  },{includeAuth:true});
  if(!result?.success)throw new Error(result?.error||"Google Drive upload was not confirmed.");
  return result;
}

function afisapDriveFileId(value){
  const raw=String(value||"").trim();
  if(!raw) return "";

  // A normal Drive File ID can be stored directly in the Sheet.
  if(/^[A-Za-z0-9_-]{10,}$/.test(raw)) return raw;

  // Also accept the common Google Drive URL formats already used by AFISAP.
  try{
    const url=new URL(raw);
    const queryId=String(url.searchParams.get("id")||"").trim();
    if(queryId) return queryId;

    const pathMatch=url.pathname.match(/\/(?:file\/d|d)\/([A-Za-z0-9_-]{10,})/i);
    if(pathMatch && pathMatch[1]) return pathMatch[1];
  }catch(e){}

  const looseMatch=raw.match(/(?:[?&]id=|\/file\/d\/|\/d\/)([A-Za-z0-9_-]{10,})/i);
  return looseMatch ? looseMatch[1] : "";
}

function afisapDriveFileUrl(value){
  const id=afisapDriveFileId(value);
  return id ? "https://drive.google.com/thumbnail?id="+encodeURIComponent(id)+"&sz=w800" : "";
}

function afisapStudentPhotoSource(passportPhoto,passportPhotoUrl,fallbackPhoto){
  const fileValue=String(passportPhoto||"").trim();
  const urlValue=String(passportPhotoUrl||"").trim();

  // Prefer a Drive thumbnail whenever either Sheet field contains a Drive ID/URL.
  const driveId=afisapDriveFileId(fileValue) || afisapDriveFileId(urlValue);
  if(driveId) return afisapDriveFileUrl(driveId);

  // Preserve a non-Drive HTTP(S) image URL if the backend ever supplies one.
  if(/^https?:\/\//i.test(urlValue)) return urlValue;

  // Cache-only fallback for an already-valid local image. Never use raw text.
  const fallback=String(fallbackPhoto||"").trim();
  if(/^(?:data:image\/|blob:|https?:\/\/)/i.test(fallback)) return fallback;
  return "";
}


/* AFISAP permanent Drive-photo display bridge.
   Google Drive File ID remains authoritative. The frontend asks the existing
   Apps Script driveGet action for the image bytes, exactly like the working
   Administrator photo system, instead of depending on Drive thumbnail hot-links. */
const afisapDrivePhotoDataCache=new Map();

async function afisapDrivePhotoDataUrl(value){
  const fileId=afisapDriveFileId(value);
  if(!fileId) return "";

  if(afisapDrivePhotoDataCache.has(fileId)){
    return afisapDrivePhotoDataCache.get(fileId);
  }

  try{
    const result=await afisapCloudJsonp({action:"driveGet",fileId:fileId});
    if(result && result.success===true && result.fileData){
      const dataUrl=`data:${String(result.mimeType||"image/jpeg")};base64,${String(result.fileData)}`;
      afisapDrivePhotoDataCache.set(fileId,dataUrl);
      return dataUrl;
    }
  }catch(error){
    console.warn("AFISAP Drive photo retrieval unavailable:",fileId,error);
  }

  return "";
}

async function afisapHydratePermanentPhoto(record){
  if(!record) return false;
  const fileId=afisapDriveFileId(
    record.passportPhotoFileId||
    record.passportPhotoUrl||
    record.photo||
    ""
  );
  if(!fileId) return false;

  const dataUrl=await afisapDrivePhotoDataUrl(fileId);
  if(!dataUrl) return false;

  record.passportPhotoFileId=fileId;
  record.photo=dataUrl;
  return true;
}

async function afisapHydratePermanentPhotos(records){
  const list=Array.isArray(records)?records:[];
  const jobs=[];
  list.forEach(record=>{
    const fileId=afisapDriveFileId(
      record&&(
        record.passportPhotoFileId||
        record.passportPhotoUrl||
        record.photo||
        ""
      )
    );
    if(fileId) jobs.push(afisapHydratePermanentPhoto(record));
  });
  if(jobs.length) await Promise.all(jobs);
}

function afisapPermanentPhotoRenderSrc(record){
  const photo=String(record&&record.photo||"").trim();
  const fileId=afisapDriveFileId(
    record&&(
      record.passportPhotoFileId||
      record.passportPhotoUrl||
      ""
    )
  );

  // A data URL is accepted here only when the same record also has a permanent
  // Drive File ID. This prevents a temporary pre-upload preview from becoming
  // the permanent cross-browser photo source.
  if(fileId && /^data:image\//i.test(photo)) return photo;

  if(fileId) return afisapDriveFileUrl(fileId);

  const permanentUrl=String(record&&record.passportPhotoUrl||"").trim();
  return /^https?:\/\//i.test(permanentUrl) ? permanentUrl : "";
}



/* AFISAP student cloud mapping helpers — required by Students + Drive linking */
function afisapStudentToCloud(s){
  return {
    "Student ID":String(s.sid||s.studentId||"").trim(),
    "Admission Number":String(s.admissionNumber||s.sid||s.studentId||"").trim(),
    "First Name":String(s.firstName||"").trim(),
    "Middle Name":String(s.middleName||"").trim(),
    "Last Name":String(s.surname||s.lastName||"").trim(),
    "Gender":String(s.gender||"").trim(),
    "Date of Birth":String(s.dob||s.dateOfBirth||"").trim(),
    "Admission Date":String(s.admissionDate||"").trim(),
    "Class":String(s.class||s.className||"").trim(),
    "Roll No.":String(s.rollNo||s["Roll No."]||"").trim(),
    "No. on Roll":String(s.noOnRoll||s["No. on Roll"]||"").trim(),
    "Academic Year":String((d.school&&d.school.year)||"").trim(),
    "Status":String(s.status||"Active").trim(),
    "Guardian Name":String(s.guardian||s.guardianName||"").trim(),
    "Guardian Contact":String(s.guardianContact||s.contact||s.phone||"").trim(),
    "Guardian Email":String(s.guardianEmail||s.email||"").trim(),
    "Student Phone":String(s.phone||"").trim(),
    "Address":String(s.address||"").trim(),
    "Passport Photo":afisapDriveFileId(s.passportPhotoFileId||s.photoFileId||s.passportPhotoUrl||s.photo||""),
    "Date Created":String(s.dateCreated||new Date().toISOString()),
    "Last Updated":new Date().toISOString()
  };
}

function afisapCloudToStudent(r){
  return {
    id:Date.now()+Math.floor(Math.random()*100000),
    sid:String(r["Student ID"]||"").trim(),
    admissionNumber:String(r["Admission Number"]||"").trim(),
    surname:String(r["Last Name"]||"").trim(),
    firstName:String(r["First Name"]||"").trim(),
    middleName:String(r["Middle Name"]||"").trim(),
    name:[r["First Name"],r["Middle Name"],r["Last Name"]].map(v=>String(v||"").trim()).filter(Boolean).join(" "),
    dob:String(r["Date of Birth"]||"").trim(),
    admissionDate:afisapDateOnly(r["Admission Date"]),
    gender:String(r["Gender"]||"").trim(),
    class:String(r["Class"]||"").trim(),
    rollNo:String(r["Roll No."]||"").trim(),
    noOnRoll:String(r["No. on Roll"]||"").trim(),
    guardian:String(r["Guardian Name"]||"").trim(),
    guardianContact:String(r["Guardian Contact"]||"").trim(),
    contact:String(r["Guardian Contact"]||"").trim(),
    guardianEmail:String(r["Guardian Email"]||"").trim(),
    email:String(r["Guardian Email"]||"").trim(),
    phone:String(r["Student Phone"]||"").trim(),
    address:String(r["Address"]||"").trim(),
    passportPhotoFileId:afisapDriveFileId(r["Passport Photo"]||r["Passport Photo URL"]||""),
    passportPhotoUrl:afisapStudentPhotoSource(r["Passport Photo"],r["Passport Photo URL"],""),
    photo:afisapStudentPhotoSource(r["Passport Photo"],r["Passport Photo URL"],""),
    status:String(r["Status"]||"Active").trim(),
    dateCreated:String(r["Date Created"]||"").trim()
  };
}

function afisapCloudCreateStudent(s){
  return afisapCloudPost({action:"create",sheet:"Students",data:afisapStudentToCloud(s)});
}
function afisapCloudUpdateStudent(s,originalSid){
  return afisapCloudPost({
    action:"update",
    sheet:"Students",
    idField:"Student ID",
    idValue:String(originalSid||s.sid||""),
    data:afisapStudentToCloud(s)
  });
}

function afisapCloudDeleteStudent(sid){
  const studentId=String(sid??"").trim();
  if(!studentId){
    return Promise.resolve({
      success:false,
      error:"Student ID is required for deletion."
    });
  }

  return afisapCloudPost({
    action:"delete",
    sheet:"Students",
    idField:"Student ID",
    idValue:studentId
  });
}

async function afisapSyncStudentsFromCloud(){
  try{
    const result=await afisapCloudJsonp({
      action:"read",
      sheet:"Students"
    });

    if(!result || !result.success || !Array.isArray(result.records)) return;

    const cloudRecords=result.records.filter(r=>String(r["Student ID"]||"").trim());
    if(!cloudRecords.length) return;

    let changed=false;

    cloudRecords.forEach(record=>{
      const sid=String(record["Student ID"]||"").trim();
      let local=(d.students||[]).find(s=>String(s.sid||"").trim()===sid);

      if(local){
        const oldPhoto=local.photo||"";
        const updated=afisapCloudToStudent(record);
        const cloudPhoto=String(updated.photo||updated.passportPhotoUrl||"").trim();
        Object.assign(local,updated,{
          id:local.id,
          photo:cloudPhoto||oldPhoto
        });
        changed=true;
      }else{
        d.students.push(afisapCloudToStudent(record));
        changed=true;
      }
    });

    if(changed){
      await afisapHydratePermanentPhotos(d.students);
      persist();
      if(typeof students==="function" && document.getElementById("app")) {
        try{students();}catch(e){}
      }
    }
  }catch(error){
    console.warn("AFISAP cloud student sync unavailable:",error);
  }
}

/* AFISAP Administrator Authentication — server-side session authorization. */
(function(){
  const SESSION_KEY="afisap_admin_authenticated_v1";

  function normalizeEmail(v){ return String(v||"").trim().toLowerCase(); }


  function authenticated(){
    return !!afisapAdminToken();
  }

  let authSlideTimer=null;
  let authSlideIndex=0;
  function startAuthSlideshow(){
    if(authSlideTimer) clearInterval(authSlideTimer);
    const slides=Array.from(document.querySelectorAll(".afisap-auth-slide"));
    const dots=Array.from(document.querySelectorAll(".afisap-auth-dot"));
    if(slides.length<2) return;
    authSlideIndex=0;
    authSlideTimer=setInterval(()=>{
      slides[authSlideIndex]?.classList.remove("is-active");
      dots[authSlideIndex]?.classList.remove("is-active");
      authSlideIndex=(authSlideIndex+1)%slides.length;
      slides[authSlideIndex]?.classList.add("is-active");
      dots[authSlideIndex]?.classList.add("is-active");
    },4500);
  }

  function showAuthScreen(mode="login",message=""){
    let screen=document.getElementById("afisapAuthScreen");
    if(!screen){
      screen=document.createElement("div");
      screen.id="afisapAuthScreen";
      screen.className="afisap-auth-screen";
      document.body.appendChild(screen);
    }

    const loginMode=mode==="login";
    const forgotMode=mode==="forgot";

    screen.innerHTML=`
      <div class="afisap-auth-shell">
        <section class="afisap-auth-slideshow" aria-label="AFISAP Royal Academy photo slideshow">
          <div class="afisap-auth-slides">
            <img class="afisap-auth-slide is-active afisap-auth-main-photo" src="admin_login_front.jpg" alt="AFISAP Royal Academy learning environment" loading="eager">
          </div>
          <div class="afisap-auth-slide-overlay"></div>
          <div class="afisap-auth-branding">
            <img src="afisap_royal_academy_logo.png" alt="AFISAP Royal Academy logo">
            <div>
              <div class="afisap-auth-brand-name">AFISAP ROYAL ACADEMY</div>
              <div class="afisap-auth-brand-tagline">LEARNING TO LEARN</div>
            </div>
          </div>
          <div class="afisap-auth-caption">
            <strong>Excellence in Education</strong>
            <span>Building confident, knowledgeable and responsible learners.</span>
          </div>
          <div class="afisap-auth-dots" aria-hidden="true"></div>
        </section>

        <section class="afisap-auth-panel">
          <div class="afisap-auth-panel-inner">
            <div class="afisap-auth-logo">
              <img src="afisap_royal_academy_logo.png" alt="AFISAP Royal Academy">
            </div>
            <h1>AFISAP ROYAL ACADEMY</h1>
            <h2>School Management System</h2>
            <div class="afisap-auth-title">${loginMode?"Administrator Login":"Forgot Password"}</div>
            ${message?`<div class="afisap-auth-message">${escapeAuth(message)}</div>`:""}

            ${loginMode ? `
            <form id="afisapLoginForm" autocomplete="off">
              <label>Email Address</label>
              <input id="afisapLoginEmail" type="email" placeholder="Enter administrator email" required>
              <label>Password</label>
              <input id="afisapLoginPassword" type="password" placeholder="Enter password" required>
              <button type="submit" class="afisap-auth-primary">LOG IN</button>
              <button type="button" id="afisapForgotButton" class="afisap-auth-link">Forgot Password?</button>
            </form>` : `
            <form id="afisapForgotForm" autocomplete="off">
              <p class="afisap-auth-help">Password reset is available only for the authorized administrator account.</p>
              <label>Email Address</label>
              <input id="afisapForgotEmail" type="email" placeholder="Enter administrator email" required>
              <label>Verification Code</label>
              <div style="display:flex;gap:8px;align-items:end">
                <input id="afisapResetOtp" inputmode="numeric" maxlength="6" placeholder="6-digit code" required style="flex:1">
                <button type="button" id="afisapSendResetCode" class="afisap-auth-link" style="white-space:nowrap">Send Code</button>
              </div>
              <label>New Password</label>
              <input id="afisapNewPassword" type="password" placeholder="Create a new password" minlength="8" required>
              <label>Confirm New Password</label>
              <input id="afisapConfirmPassword" type="password" placeholder="Confirm new password" minlength="8" required>
              <button type="submit" class="afisap-auth-primary">RESET PASSWORD</button>
              <button type="button" id="afisapBackLogin" class="afisap-auth-link">Back to Login</button>
            </form>`}
            <div class="afisap-login-credit" style="margin-top:18px;text-align:center;line-height:1.5;">
              <div>
                System built by
                <a href="https://mr-chael-it-department.appiatusr.chatgpt.site/"
                   target="_blank"
                   rel="noopener noreferrer"
                   style="text-decoration:none;font-weight:700;">
                  Mr Chael I.T Department
                </a>
              </div>
              <div style="font-size:.88rem;opacity:.75;margin-top:4px;">
                © 2026 Afisap Royal Academy Management System
              </div>
            </div>


            <div class="afisap-auth-footer">Authorized Administrator Access</div>
          </div>
        </section>

        <div id="afisapAdminSignInLoader" class="afisap-admin-signin-loader" hidden>
          <div class="afisap-admin-signin-loader-card">
            <img src="afisap_royal_academy_logo.png" alt="AFISAP Royal Academy">
            <div class="afisap-admin-signin-title">Signing in...</div>
            <div class="afisap-admin-signin-subtitle">Please wait while your administrator session is verified.</div>
          </div>
        </div>
      </div>`;

    screen.style.display="flex";
    startAuthSlideshow();

    if(loginMode){
      const form=document.getElementById("afisapLoginForm");
      form?.addEventListener("submit",async function(e){
        e.preventDefault();
        const email=normalizeEmail(document.getElementById("afisapLoginEmail")?.value);
        const password=document.getElementById("afisapLoginPassword")?.value||"";

        const submitButton=form.querySelector('button[type="submit"]');
        if(submitButton?.disabled) return;
        if(submitButton){
          submitButton.disabled=true;
          submitButton.dataset.originalText=submitButton.textContent;
          submitButton.textContent="LOGGING IN…";
        }

        const signInLoader=document.getElementById("afisapAdminSignInLoader");
        if(signInLoader) signInLoader.hidden=false;

        try{
          // One cloud request only. The previous implementation first called
          // authStatus() and then authVerify(); because each request can wait
          // up to 15 seconds, a normal login could take ~30 seconds.
          const verified=await afisapAuthLogin(email,password);

          if(!verified?.success){
            throw new Error(verified?.error||"Central authentication failed.");
          }

          if(!verified.authenticated||!verified.authToken){
            showAuthScreen("login","Incorrect email address or password.");
            return;
          }
          afisapSetAdminToken(verified.authToken);
          sessionStorage.setItem(SESSION_KEY,"server-validated");
          sessionStorage.setItem("afisap_admin_logged_in","server-validated");

          // Authentication succeeded: open immediately. All cloud hydration
          // continues in the background and cannot block the dashboard.
          screen.style.display="none";
          revealDashboard();

          Promise.all([
            afisapLoadCentralConfig(),
            afisapSyncAllFromCloud(),
            afisapLoadCentralAdminProfile()
          ]).catch(error=>{
            console.warn("AFISAP background cloud hydration failed:",error);
          });
        }catch(error){
          if(signInLoader) signInLoader.hidden=true;
          console.error("AFISAP central login failed:",error);
          showAuthScreen("login","The central AFISAP service could not be reached. Please check your internet connection and try again.");
          return;
        }finally{
          // showAuthScreen() recreates the form on errors, so only restore the
          // old button if this exact form is still mounted.
          if(form.isConnected && submitButton){
            submitButton.disabled=false;
            submitButton.textContent=submitButton.dataset.originalText||"LOG IN";
          }
        }
      });
      document.getElementById("afisapForgotButton")?.addEventListener("click",()=>showAuthScreen("forgot"));
    }else{
      const form=document.getElementById("afisapForgotForm");
      document.getElementById("afisapSendResetCode")?.addEventListener("click",async()=>{
        const email=normalizeEmail(document.getElementById("afisapForgotEmail")?.value);
        const sendButton=document.getElementById("afisapSendResetCode");
        if(sendButton?.disabled)return;
        if(!email){
          showAuthScreen("forgot","Enter the administrator email address first.");
          return;
        }

        const loader=document.getElementById("afisapAdminSignInLoader");
        const loaderTitle=loader?.querySelector(".afisap-admin-signin-title");
        const loaderSub=loader?.querySelector(".afisap-admin-signin-subtitle");
        let progress=10;
        let progressTimer=null;

        if(sendButton){
          sendButton.disabled=true;
          sendButton.dataset.originalText=sendButton.textContent;
          sendButton.textContent="Preparing…";
        }

        if(loader){
          if(loaderTitle)loaderTitle.textContent="Preparing verification code…";
          if(loaderSub)loaderSub.innerHTML='Sending code to the authorized administrator email.<br><strong id="afisapResetCodeProgress">10%</strong>';
          loader.hidden=false;
          progressTimer=setInterval(()=>{
            progress=Math.min(90,progress+10);
            const p=document.getElementById("afisapResetCodeProgress");
            if(p)p.textContent=progress+"%";
            if(progress>=90&&progressTimer){clearInterval(progressTimer);progressTimer=null;}
          },180);
        }

        try{
          const r=await afisapAuthRequestReset(email);
          if(progressTimer){clearInterval(progressTimer);progressTimer=null;}
          const p=document.getElementById("afisapResetCodeProgress");
          if(p)p.textContent="100%";
          if(loaderSub)loaderSub.innerHTML=r?.success
            ? 'Verification code prepared successfully.<br><strong>100%</strong>'
            : 'The verification code could not be sent.<br><strong>100%</strong>';
          await new Promise(resolve=>setTimeout(resolve,180));

          if(!r?.success){
            showAuthScreen("forgot",r?.error||"The verification code could not be sent. Please try again.");
          }else{
            showAuthScreen("forgot",r?.message||"If the account is authorized, a verification code has been sent.");
          }
          const f=document.getElementById("afisapForgotEmail");if(f)f.value=email;
        }catch(e){
          if(progressTimer){clearInterval(progressTimer);progressTimer=null;}
          showAuthScreen("forgot","The reset request could not be completed. Please try again.");
          const f=document.getElementById("afisapForgotEmail");if(f)f.value=email;
        }finally{
          if(loader)loader.hidden=true;
          if(sendButton?.isConnected){
            sendButton.disabled=false;
            sendButton.textContent=sendButton.dataset.originalText||"Send Code";
          }
        }
      });
      form?.addEventListener("submit",async function(e){
        e.preventDefault();
        const email=normalizeEmail(document.getElementById("afisapForgotEmail")?.value);
        const otp=document.getElementById("afisapResetOtp")?.value||"";
        const p1=document.getElementById("afisapNewPassword")?.value||"";
        const p2=document.getElementById("afisapConfirmPassword")?.value||"";
        if(!/^\d{6}$/.test(String(otp).trim())){showAuthScreen("forgot","Enter the 6-digit verification code sent to the administrator email.");return;}
        if(p1.length<8){showAuthScreen("forgot","Password must contain at least 8 characters.");return;}
        if(p1!==p2){showAuthScreen("forgot","The two passwords do not match.");return;}
        try{
          const result=await afisapAuthResetPassword(email,otp,p1);
          if(!result?.success){showAuthScreen("forgot",result?.error||"Password could not be reset.");return;}
          showAuthScreen("login","Password reset successfully. Sign in with the new password.");
          const f=document.getElementById("afisapLoginEmail");if(f)f.value=email;
        }catch(e){showAuthScreen("forgot","Password reset could not be completed. Please try again.");}
      });
      document.getElementById("afisapBackLogin")?.addEventListener("click",()=>showAuthScreen("login"));
    }
  }

  function escapeAuth(v){
    return String(v||"").replace(/[&<>"']/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function revealDashboard(){
    document.body.classList.remove("admin-is-signed-out");
    document.body.classList.remove("afisap-auth-locked");
    const aside=document.querySelector("body > aside");
    const main=document.querySelector("body > main");
    if(aside) aside.style.display="";
    if(main) main.style.display="";
    const app=document.getElementById("app");
    if(app) app.style.display="";
  }

  function lockDashboard(){
    document.body.classList.add("afisap-auth-locked");
    const aside=document.querySelector("body > aside");
    const main=document.querySelector("body > main");
    if(aside) aside.style.display="none";
    if(main) main.style.display="none";
  }

  window.afisapShowLogin=function(){
    // Fast local-first sign-out: clear the browser session immediately so the
    // administrator never waits for the Google Apps Script logout request.
    const token=afisapAdminToken();
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("afisap_admin_logged_in");
    afisapSetAdminToken("");
    lockDashboard();

    const currentScreen=document.getElementById("afisapAuthScreen");
    const loader=document.getElementById("afisapAdminSignInLoader");
    if(currentScreen) currentScreen.style.display="flex";
    if(loader){
      const title=loader.querySelector(".afisap-admin-signin-title");
      const sub=loader.querySelector(".afisap-admin-signin-subtitle");
      if(title) title.textContent="Signing out...";
      if(sub) sub.textContent="Please wait while your administrator session is closed.";
      loader.hidden=false;
    }

    // Revoke the server token in the background. The interface does not wait.
    if(token){
      afisapSecurePost({action:"authLogout",authToken:token},{includeAuth:false}).catch(()=>null);
    }

    // Keep the professional sign-out animation visible only briefly.
    setTimeout(()=>{
      showAuthScreen("login");
    },450);
  };

  // Expose for logout integration.
  window.afisapIsAuthenticated=authenticated;

  // Wait until the document shell exists.
  async function initAuth(){
    lockDashboard();
    if(authenticated()){
      try{
        const status=await afisapAuthSessionStatus();
        if(status?.success&&status.authenticated){
          revealDashboard();
          Promise.all([afisapLoadCentralConfig(),afisapSyncAllFromCloud(),afisapLoadCentralAdminProfile()]).catch(()=>{});
          return;
        }
      }catch(e){}
      afisapSetAdminToken("");
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem("afisap_admin_logged_in");
    }
    showAuthScreen("login");
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",initAuth);
  }else{
    initAuth();
  }
})();

const $=s=>document.querySelector(s);
function getFeeNotifications(){
  const notes=[];
  (d.feeRecords||[]).forEach(r=>{
    const s=(d.students||[]).find(x=>String(x.id)===String(r.studentId));
    const name=s?.name||"Student";
    const due=Number(r.amountDue||0), paid=Number(r.amountPaid||0), balance=Math.max(0,due-paid);
    if(paid>0) notes.push({kind:"paid",title:"Fee payment received",text:`${name} paid GHS ${paid.toFixed(2)} for ${r.feeItem||"fees"}.`,date:r.date||""});
    if(balance>0) notes.push({kind:"due",title:"Fee balance outstanding",text:`${name} owes GHS ${balance.toFixed(2)} for ${r.feeItem||"fees"}.`,date:r.date||""});
  });
  return notes.slice(-30).reverse();
}
function renderNotificationCount(){
  const el=document.getElementById("notificationCount");
  if(el) el.textContent=String(getFeeNotifications().length);
}const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));function persist(){/* UI memory only. Permanent school data is reloaded from Apps Script/Google Sheets. */}
function save(){persist();render()}function nav(v){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.v===v));$('#title').textContent={dashboard:'Dashboard',students:'Students',staff:'Teachers & Staff',classes:'Classes & Subjects',attendance:'Attendance',teacherAttendance:'Teacher Attendance',results:'Results & Marks',reports:'Report Cards',fees:'Fees & Textbooks',announcements:'Announcements & Assignments',settings:'School Setup'}[v];window.view=v;render()}document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>nav(b.dataset.v));
function render(){renderNotificationCount();let v=window.view||'dashboard';let a=$('#app');if(v==='dashboard')a.innerHTML=`
<div class='dashboard-welcome'>
   <div class='dashboard-welcome-content'>
     <small>WELCOME TO AFISAP ROYAL ACADEMY</small><h2>School Management Dashboard</h2>
     <p>Manage students, staff, academics, attendance, results and finances from one central system.</p>
   </div>
   <div class='dashboard-branding'>
     <img class='dashboard-watermark-logo' src='afisap_royal_academy_logo.png' alt='AFISAP Royal Academy logo'>
     <div class='welcome-buttons'><button class='light-btn' onclick='openStudent()'>+ Add Student</button><button class='light-btn' onclick='openStaff()'>+ Add Teacher</button></div>
   </div>
 </div>

<div class='metric-grid'>
  <div class='metric-card red'><div class='metric-icon'>👨‍🎓</div><div><span>Total Students</span><strong>${d.students.length}</strong><small>Registered students</small></div></div>
  <div class='metric-card blue'><div class='metric-icon'>👩‍🏫</div><div><span>Teachers & Staff</span><strong>${d.staff.length}</strong><small>School personnel</small></div></div>
  <div class='metric-card green'><div class='metric-icon'>🏫</div><div><span>Classes</span><strong>${d.classes.length}</strong><small>Configured classes</small></div></div>
  <div class='metric-card cyan'><div class='metric-icon'>₵</div><div><span>Fee Items</span><strong>${d.fees.length}</strong><small>Configured fee records</small></div></div>
</div>

<div class='dashboard-grid'>
  <div class='panel dashboard-panel'>
    <div class='panel-title'><h3>Quick Actions</h3><span>Manage</span></div>
    <div class='quick-actions'>
      <button onclick='openStudent()'><b>+ Student</b><span>Add a student record</span></button>
      <button onclick='openStaff()'><b>+ Teacher</b><span>Add school personnel</span></button>
      <button onclick='openClass()'><b>+ Class</b><span>Create a class</span></button>
      <button onclick="nav('attendance')"><b>✓ Attendance</b><span>Record attendance</span></button>
      <button onclick="nav('results')"><b>▤ Results</b><span>Enter student marks</span></button>
      <button onclick="nav('reports')"><b>📄 Report</b><span>Generate report card</span></button>
    </div>
  </div>

  <div class='panel dashboard-panel'>
    <div class='panel-title'><h3>Notification Board</h3><span>Fees & School</span></div>
    ${(getFeeNotifications().map(n=>`<div class='notice-item ${n.kind==='paid'?'paid-note':'due-note'}'><time>${esc(n.date||"")}</time><strong>${esc(n.title)}</strong><p>${esc(n.text)}</p></div>`).join('')) || '<div class="empty">No fee notifications yet. When a student pays or has an outstanding fee balance, the notice will appear here.</div>'}
  </div>
</div>

<div class='dashboard-grid bottom'>
  <div class='panel dashboard-panel'>
    <div class='panel-title'><h3>Recent Students</h3><button onclick="nav('students')">View All</button></div>
    <div class='mini-list'>
      ${d.students.slice(-5).reverse().map(s=>`<div class='mini-row'><span class='mini-avatar'>${s.photo?`<img class='mini-avatar-img' src='${s.photo}' alt=''>`:esc(((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' '))||'?').charAt(0).toUpperCase())}</span><div><b>${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}</b><small>${esc(s.class)} · ${esc(s.sid)}</small></div><span class='status'>Active</span></div>`).join('') || '<div class="empty">No students have been added yet.</div>'}
    </div>
  </div>

  <div class='panel dashboard-panel'>
    <div class='panel-title'><h3>School Overview</h3><button onclick="nav('settings')">Settings</button></div>
    <div class='overview-grid'>
      <div><span>Academic Year</span><b>${esc(d.school.year)}</b></div>
      <div><span>Current Term</span><b>${esc(d.school.term)}</b></div>
      <div><span>Subjects</span><b>${d.subjects.length}</b></div>
      <div><span>Attendance Records</span><b>${d.attendance.length}</b></div>
    </div>
  </div>
</div>
`;else if(v==='students')students();else if(v==='staff')staff();else if(v==='classes')classes();else if(v==='attendance')attendance();else if(v==='teacherAttendance')teacherAttendance();else if(v==='results')results();else if(v==='reports')reports();else if(v==='fees')fees();else if(v==='announcements')announcementsAssignments();else settings()}
function getNameParts(person){
  if(person.surname || person.firstName || person.middleName){
    return {surname:person.surname||'',firstName:person.firstName||'',middleName:person.middleName||''};
  }
  const parts=String(person.name||'').trim().split(/\\s+/).filter(Boolean);
  return {surname:parts.length?parts[parts.length-1]:'',firstName:parts.length>1?parts[0]:(parts[0]||''),middleName:parts.length>2?parts.slice(1,-1).join(' '):''};
}

function editStudent(studentId){
  const wanted=String(studentId??"").trim();
  const s=d.students.find(x=>String(x.id)===wanted || String(x.sid||x.studentId||"").trim()===wanted); if(!s)return;
  const np=getNameParts(s);
  modal('Edit Student',`<form id="editStudentForm" class="form">
    <label>Student Passport Photo<input id="editStudentPhoto" type="file" accept="image/jpeg,image/png,image/webp">
      <div id="editStudentPhotoPreview" class="photo-upload-preview student-photo-preview">${s.photo?`<img src="${s.photo}" alt="${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}"><div class="photo-preview-ok">✓ Current photo</div>`:`<span class="photo-preview-placeholder">📷 No passport photo</span>`}</div></label>
<div id="afisapEditDriveUpload" style="margin-top:10px;padding:10px;border:1px solid #ddd;border-radius:8px;">
  <button type="button" class="primary" id="afisapEditUploadPassportDrive">Upload/Replace Passport Photo in Google Drive</button>
  <div id="afisapEditPassportDriveStatus" style="margin-top:7px;font-size:.9rem;"></div>
</div>

    <label>Student ID<input name="sid" value="${esc(s.sid||'')}" required></label>
    <label>Surname<input name="surname" value="${esc(np.surname)}" required></label>
    <label>First Name<input name="firstName" value="${esc(np.firstName)}" required></label>
    <label>Middle/Other Name<input name="middleName" value="${esc(np.middleName)}"></label>
    <label>Date of Birth<input name="dob" type="date" value="${esc(afisapDateOnly(s.dob||''))}"></label>
    <label>Admission Date<input name="admissionDate" type="date" value="${esc(afisapDateOnly(s.admissionDate||''))}"></label>
    <label>Gender<select name="gender"><option value="">Select Gender</option><option ${s.gender==='Male'?'selected':''}>Male</option><option ${s.gender==='Female'?'selected':''}>Female</option></select></label>
    <label>Class<select name="class" required><option value="">Select Class</option>${afisapCentralClassNames().map(c=>`<option value="${esc(c)}" ${s.class===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
    <label>Guardian<input name="guardian" value="${esc(s.guardian||'')}"></label>
    <label>Guardian Contact<input name="guardianContact" value="${esc(s.guardianContact||'')}"></label>
    <label>Guardian Email<input name="guardianEmail" type="email" value="${esc(s.guardianEmail||'')}"></label>
    <label>Address<textarea name="address">${esc(s.address||'')}</textarea></label>
    <div class="wide"><button class="primary" type="submit">Save Changes</button></div>
  </form>`);
  let photo=s.photo||'';
  $('#editStudentPhoto').addEventListener('change',e=>{
    const f=e.target.files&&e.target.files[0]; if(!f)return;
    if(!f.type.startsWith('image/')){e.target.value='';alert('Please select a JPG, PNG or WebP image.');return;}
    const r=new FileReader(); r.onload=()=>{photo=r.result;$('#editStudentPhotoPreview').innerHTML=`<img src="${photo}" alt="Student passport photo"><div class="photo-preview-name">${esc(f.name)}</div><div class="photo-preview-ok">✓ New photo selected</div>`}; r.readAsDataURL(f);
  });
  $('#editStudentForm').addEventListener('submit',async e=>{
    e.preventDefault(); const f=new FormData(e.target);
    const candidate=Object.assign({},s,{
      sid:String(f.get('sid')||'').trim(),surname:String(f.get('surname')||'').trim(),
      firstName:String(f.get('firstName')||'').trim(),middleName:String(f.get('middleName')||'').trim(),
      name:[String(f.get('firstName')||'').trim(),String(f.get('middleName')||'').trim(),String(f.get('surname')||'').trim()].filter(Boolean).join(' '),
      dob:afisapDateOnly(f.get('dob')),admissionDate:afisapDateOnly(f.get('admissionDate')),gender:String(f.get('gender')||''),class:String(f.get('class')||''),
      guardian:String(f.get('guardian')||'').trim(),guardianContact:String(f.get('guardianContact')||'').trim(),
      guardianEmail:String(f.get('guardianEmail')||'').trim(),address:String(f.get('address')||'').trim(),photo
    });
    const originalSid=String(s.sid||"").trim();
    afisapShowUploadLoader("Updating Student","Saving student information to Google Sheets...",15);
    try{
      afisapUpdateUploadLoader("Updating the official student record...",55);
      const cloudResult=await afisapCloudUpdateStudent(candidate,originalSid);
      if(!cloudResult || cloudResult.success!==true){
        throw new Error(String(cloudResult?.error||"Google Sheets did not confirm the update."));
      }
      Object.assign(s,candidate,{admissionDate:afisapDateOnly(candidate.admissionDate)});
      afisapUpdateUploadLoader("Student information updated successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,250));
      afisapHideUploadLoader();
      $('#modal').classList.remove('show');
      nav('students');
      alert('Student information updated successfully and confirmed in Google Sheets.');
    }catch(error){
      afisapUpdateUploadLoader("Student update could not be completed.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert('Student changes were not saved because Google Sheets did not confirm the update.\n\nReason: '+String(error?.message||error||"Unknown error"));
    }
  });

  const editDriveBtn=document.getElementById("afisapEditUploadPassportDrive");
  const editDriveStatus=document.getElementById("afisapEditPassportDriveStatus");
  if(editDriveBtn){
    editDriveBtn.addEventListener("click",async()=>{
      const sid=String(s.sid||"").trim();
      if(!sid){ if(editDriveStatus) editDriveStatus.textContent="Student ID is missing."; return; }
      const picker=document.getElementById("editStudentPhoto")||document.createElement("input");
      if(!picker.parentNode){
        picker.type="file"; picker.accept="image/jpeg,image/png,image/webp"; picker.style.display="none";
        document.body.appendChild(picker);
      }
      picker.value="";
      picker.onchange=async()=>{
        const file=picker.files&&picker.files[0]; if(!file)return;
        try{
          if(editDriveStatus) editDriveStatus.textContent="Uploading...";
          const uploadFile=await afisapPreparePassportPhoto(file);
          const result=await afisapDriveUpload(uploadFile,"student-passports",sid);
          if(!result || !result.fileId) throw new Error("Google Drive upload returned no File ID.");
s.passportPhotoFileId=result.fileId;
          s.passportPhotoUrl=afisapDriveFileUrl(result.fileId);
          s.photo=(await afisapDrivePhotoDataUrl(result.fileId))||s.passportPhotoUrl;
          save();
          const cloudData=afisapStudentToCloud(s);
          cloudData["Passport Photo"]=result.fileId;
          cloudData["Passport Photo URL"]=s.passportPhotoUrl;
          const updated=await afisapCloudPost({action:"update",sheet:"Students",idField:"Student ID",idValue:sid,data:cloudData});
          if(!updated || updated.success!==true) throw new Error(updated&&updated.error||"Student Sheet update failed.");
          if(editDriveStatus) editDriveStatus.textContent="Passport photo uploaded and linked successfully.";
        }catch(error){
          if(editDriveStatus) editDriveStatus.textContent="Upload failed: "+String(error.message||error);
        }
      };
      picker.click();
    });
  }
}
function students(){
  function attendanceRecordsFor(studentId){
    const records=[];
    if(!d.attendance) return records;
    if(Array.isArray(d.attendance)){
      d.attendance.forEach(r=>{
        if(r && String(r.studentId)===String(studentId) && r.date) records.push(r);
      });
    }else if(typeof d.attendance==='object'){
      Object.values(d.attendance).forEach(r=>{
        if(r && String(r.studentId)===String(studentId) && r.date) records.push(r);
      });
    }
    return records;
  }
  function attendanceDaysFor(studentId){
    return [...new Set(attendanceRecordsFor(studentId).filter(r=>r.present===true).map(r=>r.date))].length;
  }
  function presentDatesFor(studentId){
    return [...new Set(attendanceRecordsFor(studentId).filter(r=>r.present===true).map(r=>r.date))].sort();
  }


  let q=window.q||'';
  $('#app').innerHTML=`<div class='panel'>
    <button class='primary' onclick='openStudent()'>+ Add Student</button>
    <div class='toolbar'>
      <input placeholder='Search student...' value='${esc(q)}' oninput='window.q=this.value;students()'>
    </div>
    <div class='table'>
      <table>
        <tr>
          <th>Passport Photo</th><th>Student ID</th><th>Name</th><th>Class</th><th>Attendance</th><th>Present Dates</th>
          <th>Gender</th><th>Guardian</th><th>Contact</th><th>Admission Date</th><th></th>
        </tr>
        ${d.students.filter(s=>((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' '))+' '+s.sid+' '+s.class).toLowerCase().includes(q.toLowerCase())).map(s=>`
          <tr>
            <td>
              ${afisapPermanentPhotoRenderSrc(s)
                ? `<img class='student-thumb' src='${esc(afisapPermanentPhotoRenderSrc(s))}' alt='${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}' onclick='viewStudentPhoto("${s.id}")' title='View passport photo'>`
                : `<button class='photo-placeholder' onclick='viewStudentPhoto("${s.id}")' title='No passport photo'>📷</button>`}
            </td>
            <td>${esc(s.sid)}</td>
            <td><strong>${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}</strong></td>
            <td>${esc(s.class)}</td><td><strong>${attendanceDaysFor(s.id)} days</strong></td>
            <td>${esc(presentDatesFor(s.id).join(', '))}</td>
            <td>${esc(s.gender)}</td>
            <td>${esc(s.guardian)}</td>
            <td>${esc(s.contact||s.guardianContact||'')}</td>
            <td>${esc(afisapDateOnly(s.admissionDate||''))}</td>
            <td><button class='secondary edit-btn' onclick='editStudent("${esc(s.sid||s.id)}")'>Edit</button>
            <button class='danger' onclick='del("students","${esc(s.sid||s.id)}")'>Delete</button></td>
          </tr>`).join('')||`<tr><td colspan='9' class='empty'>No students yet. The Headmaster/authorized administrator can add them here.</td></tr>`}
      </table>
    </div>
  </div>`;
}

function viewStudentPhoto(studentId){
  const s=d.students.find(x=>String(x.id)===String(studentId));
  if(!s) return;
  if(!s.photo){
    alert("No passport photo has been added for this student.");
    return;
  }
  modal('Student Passport Photo',`
    <div class='student-photo-modal'>
      <img src='${esc(afisapPermanentPhotoRenderSrc(s))}' alt='${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}'>
      <h3>${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}</h3>
      <p>${esc(s.sid)} • ${esc(s.class)}</p>
    </div>`);
}

async function editStaff(staffId){
  const wanted=String(staffId??"").trim();
  const s=(d.staff||[]).find(x=>
    String(x.id??"").trim()===wanted ||
    String(x.sid||x.staffId||x["Staff ID"]||"").trim()===wanted
  );
  if(!s){
    alert("Teacher / staff record not found. Refresh the Teachers & Staff page and try again.");
    return;
  }

  if(!confirm("Do you want to edit this staff?")) return;

  afisapShowUploadLoader("Opening Staff Record","Preparing the teacher / staff record for editing...",20);
  afisapUpdateUploadLoader("Loading the staff information...",70);
  await new Promise(resolve=>setTimeout(resolve,180));
  afisapUpdateUploadLoader("Staff record ready.",100);
  await new Promise(resolve=>setTimeout(resolve,120));
  afisapHideUploadLoader();
  const known=['Teacher','Headteacher','Head of School','Administrator','Accountant','Admissions Officer'];
  const isOther=!known.includes(s.position);
  modal('Edit Teacher / Staff',`<form id="editStaffForm" class="form">
    <label>Teacher / Staff Passport Photo<input id="editStaffPhoto" type="file" accept="image/jpeg,image/png,image/webp">
      <div id="editStaffPhotoPreview" class="photo-upload-preview staff-photo-preview">${afisapStaffPhotoSrc(s)?`<img src="${esc(afisapStaffPhotoSrc(s))}" alt="${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}"><div class="photo-preview-ok">✓ Current photo</div>`:`<span class="photo-preview-placeholder">📷 No passport photo</span>`}</div></label>
    <label>Staff ID<input name="sid" value="${esc(s.sid||'')}" required></label>
    <label>Surname<input name="surname" value="${esc((getNameParts(s)).surname)}" required></label>
    <label>First Name<input name="firstName" value="${esc((getNameParts(s)).firstName)}" required></label>
    <label>Middle/Other Name<input name="middleName" value="${esc((getNameParts(s)).middleName)}"></label>
    <label>Position<select name="position" id="editStaffPosition"><option value="">Select Position</option>${known.map(p=>`<option ${s.position===p?'selected':''}>${p}</option>`).join('')}<option value="Other" ${isOther?'selected':''}>Other</option></select></label>
    <label id="editOtherPositionWrap" style="display:${isOther?'block':'none'}">Other Position<input name="otherPosition" id="editOtherPosition" value="${isOther?esc(s.position):''}" placeholder="Type the position"></label>
    <label>Assigned Class(es) <small style="display:block;color:#64748b;margin:4px 0">Select 1, 2 or 3 classes. Hold Ctrl while selecting multiple classes on a computer.</small><select name="class" multiple size="6">${afisapStaffClassOptions(s.class)}</select></label>
    <label>Subject<input name="subject" value="${esc(s.subject||'')}"></label>
    <label>Telephone<input name="phone" value="${esc(s.phone||'')}"></label>
    <label>Appointment Date<input name="appointmentDate" type="date" value="${esc(afisapDateOnly(s.appointmentDate||''))}"></label>
    <label>Email<input name="email" type="email" value="${esc(s.email||'')}"></label>
    <div class="wide"><button class="primary" type="submit">Save Changes</button></div>
    <div class="wide" style="border-top:1px solid #dbe3ec;padding-top:12px">
      <strong>🔐 Teacher Portal Login</strong>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <label style="grid-column:1/-1">Portal Username<input id="teacherPortalUsername" autocomplete="off" placeholder="e.g. Ama.Kwaku1"></label>
        <label>Portal Password<input id="teacherPortalPassword" type="password" autocomplete="new-password" placeholder="New password"></label>
        <label>Confirm Password<input id="teacherPortalPasswordConfirm" type="password" autocomplete="new-password" placeholder="Confirm password"></label>
      </div>
      <label style="display:flex;gap:7px;align-items:center;margin-top:6px"><input type="checkbox" id="showTeacherPortalPasswords" style="width:auto"> Show / Hide Password</label>
      <div style="margin:10px 0"><strong>Portal Login:</strong> <span id="teacherPortalLoginStatus">Checking…</span><span id="teacherPortalLastLogin" style="display:block;font-size:12px;color:#64748b;margin-top:4px"></span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="secondary" id="saveTeacherPortalCredentials">Create / Update Login Credentials</button>
        <button type="button" class="secondary" id="resetTeacherPortalPassword">Reset Password</button>
        <button type="button" class="secondary" id="toggleTeacherPortalLogin">Disable Portal Login</button>
      </div>
      <small><strong>Username rule:</strong> 6–40 characters with uppercase, lowercase, a number and one special character (. _ - @). Example: <strong>Ama.Kwaku1</strong><br><strong>Password rule:</strong> minimum 8 characters with uppercase, lowercase, a number and a special character.<br>Teacher Portal credentials are controlled by the Administrator. Teachers cannot reset or change their portal password.</small>
    </div>
  </form>`);
  let photo=s.photo||''; const pi=$('#editStaffPhoto'),pv=$('#editStaffPhotoPreview');
  $('#editStaffPosition').addEventListener('change',e=>{$('#editOtherPositionWrap').style.display=e.target.value==='Other'?'block':'none';});
  pi.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){e.target.value='';alert('Please select a JPG, PNG or WebP image.');return;}const r=new FileReader();r.onload=()=>{photo=r.result;pv.innerHTML=`<img src="${photo}" alt="Teacher passport photo"><div class="photo-preview-name">${esc(f.name)}</div><div class="photo-preview-ok">✓ New photo selected</div>`};r.readAsDataURL(f);});
  let teacherPortalLoginState={configured:false,enabled:false,username:''};
  const teacherPortalStaffId=()=>String(document.querySelector("#editStaffForm [name='sid']")?.value||s.sid||"").trim();
  const refreshTeacherPortalLogin=async()=>{
    const result=await afisapSecurePost({action:"adminGetTeacherLogin",staffId:teacherPortalStaffId()},{includeAuth:true}).catch(e=>({success:false,error:e.message}));
    const status=document.getElementById('teacherPortalLoginStatus'),last=document.getElementById('teacherPortalLastLogin');
    if(!result?.success){if(status)status.textContent='Unable to load';return;}
    teacherPortalLoginState=result.login||{};
    const u=document.getElementById('teacherPortalUsername');if(u&&!u.value)u.value=teacherPortalLoginState.username||'';
    if(status)status.textContent=teacherPortalLoginState.configured?(teacherPortalLoginState.enabled?'Active':'Disabled'):'Not Set';
    if(last)last.textContent=teacherPortalLoginState.lastLoginAt?'Last Login: '+teacherPortalLoginState.lastLoginAt:'';
    const toggle=document.getElementById('toggleTeacherPortalLogin');if(toggle)toggle.textContent=teacherPortalLoginState.enabled?'Disable Portal Login':'Enable Portal Login';
  };
  document.getElementById('showTeacherPortalPasswords')?.addEventListener('change',e=>{
    ['teacherPortalPassword','teacherPortalPasswordConfirm'].forEach(id=>{const el=document.getElementById(id);if(el)el.type=e.target.checked?'text':'password'});
  });
  const setTeacherPortalCredentialBusy=async(title,stepText,work)=>{
    const formEl=document.getElementById('editStaffForm');
    const buttons=[document.getElementById('saveTeacherPortalCredentials'),document.getElementById('resetTeacherPortalPassword'),document.getElementById('toggleTeacherPortalLogin')].filter(Boolean);
    const controls=formEl?Array.from(formEl.querySelectorAll('input,select,button,textarea')):[];
    controls.forEach(el=>el.disabled=true);
    buttons.forEach(el=>{el.dataset.originalText=el.textContent;el.textContent='Please wait…';});
    afisapShowUploadLoader(title,stepText,15);
    try{
      afisapUpdateUploadLoader(stepText,35);
      const result=await work();
      if(!result?.success) throw new Error(String(result?.error||'Unknown error'));
      afisapUpdateUploadLoader(title+' completed successfully.',100);
      await new Promise(resolve=>setTimeout(resolve,450));
      afisapHideUploadLoader();
      if(typeof $('#modal') !== 'undefined' && $('#modal')) $('#modal').classList.remove('show');
      nav('staff');
      return result;
    }catch(error){
      afisapUpdateUploadLoader(title+' could not be completed.',100);
      setTimeout(()=>afisapHideUploadLoader(),700);
      controls.forEach(el=>el.disabled=false);
      buttons.forEach(el=>{if(el.dataset.originalText)el.textContent=el.dataset.originalText;});
      throw error;
    }
  };
  const teacherPortalPasswordOk=password=>password.length>=8&&/[A-Z]/.test(password)&&/[a-z]/.test(password)&&/\d/.test(password)&&/[^A-Za-z0-9\s]/.test(password);
  document.getElementById('saveTeacherPortalCredentials')?.addEventListener('click',async()=>{
    const username=String(document.getElementById('teacherPortalUsername')?.value||'').trim(),password=String(document.getElementById('teacherPortalPassword')?.value||''),confirmPassword=String(document.getElementById('teacherPortalPasswordConfirm')?.value||'');
    const usernameOk=username.length>=6&&username.length<=40&&/^[A-Za-z0-9._@-]+$/.test(username)&&/[A-Z]/.test(username)&&/[a-z]/.test(username)&&/\d/.test(username)&&/[._@-]/.test(username);
    if(!usernameOk){alert('Username must contain uppercase and lowercase letters, a number, and one special character (. _ - @), with no spaces.\n\nExample: Ama.Kwaku1');return;}
    if(!teacherPortalPasswordOk(password)){alert('Password must be at least 8 characters and contain uppercase, lowercase, a number, and a special character.');return;}
    if(password!==confirmPassword){alert('Passwords do not match.');return;}
    try{
      await setTeacherPortalCredentialBusy('Creating Teacher Portal Login','Creating username and password and enabling Teacher Portal access...',()=>afisapSecurePost({action:'adminSetTeacherCredentials',staffId:teacherPortalStaffId(),username,password},{includeAuth:true}));
      alert('Password created successfully. Teacher Portal login is now Active.');
    }catch(error){alert('Login credentials were not saved.\n\nReason: '+String(error?.message||error||'Unknown error'));}
  });
  document.getElementById('resetTeacherPortalPassword')?.addEventListener('click',async()=>{
    const password=String(document.getElementById('teacherPortalPassword')?.value||''),confirmPassword=String(document.getElementById('teacherPortalPasswordConfirm')?.value||'');
    if(!teacherPortalPasswordOk(password)){alert('Password must be at least 8 characters and contain uppercase, lowercase, a number, and a special character.');return;}
    if(password!==confirmPassword){alert('Passwords do not match.');return;}
    try{
      await setTeacherPortalCredentialBusy('Resetting Teacher Portal Password','Saving the new password securely...',()=>afisapSecurePost({action:'adminResetTeacherPassword',staffId:teacherPortalStaffId(),password},{includeAuth:true}));
      alert('Teacher Portal password reset successfully.');
    }catch(error){alert('Password was not reset.\n\nReason: '+String(error?.message||error||'Unknown error'));}
  });
  document.getElementById('toggleTeacherPortalLogin')?.addEventListener('click',async()=>{
    const enabled=!teacherPortalLoginState.enabled;
    try{
      await setTeacherPortalCredentialBusy(enabled?'Enabling Teacher Portal Login':'Disabling Teacher Portal Login',enabled?'Enabling the teacher account...':'Disabling the teacher account...',()=>afisapSecurePost({action:'adminSetTeacherLoginStatus',staffId:teacherPortalStaffId(),enabled},{includeAuth:true}));
      alert(enabled?'Teacher Portal login enabled successfully.':'Teacher Portal login disabled successfully.');
    }catch(error){alert('Portal login status was not changed.\n\nReason: '+String(error?.message||error||'Unknown error'));}
  });
  // Open the edit form immediately. Teacher Portal credential status is non-blocking
  // and must never delay the Quick Edit form from becoming usable.
  setTimeout(()=>{ refreshTeacherPortalLogin().catch(()=>{}); },0);
  requestAnimationFrame(()=>{
    const firstEditable=document.querySelector('#editStaffForm [name="sid"]');
    if(firstEditable) firstEditable.focus();
  });
  $('#editStaffForm').addEventListener('submit',async e=>{
    e.preventDefault();const f=new FormData(e.target);const pos=String(f.get('position')||'');
    const oldSid=String(s.sid||'').trim(),newSid=String(f.get('sid')||'').trim();
    let assignedClasses=[];
    try{assignedClasses=afisapSelectedStaffClasses(e.target)}catch(err){alert(err.message);return;}
    if(d.staff.some(x=>x!==s && String(x.sid||'').trim().toLowerCase()===newSid.toLowerCase())){
      alert('That Staff ID already exists. Please use a different Staff ID.');return;
    }
    const candidate=Object.assign({},s,{
      sid:newSid,surname:String(f.get('surname')||'').trim(),firstName:String(f.get('firstName')||'').trim(),
      middleName:String(f.get('middleName')||'').trim(),
      name:[String(f.get('firstName')||'').trim(),String(f.get('middleName')||'').trim(),String(f.get('surname')||'').trim()].filter(Boolean).join(' '),
      position:pos==='Other'?String(f.get('otherPosition')||'').trim():pos,class:assignedClasses.join(', '),
      subject:String(f.get('subject')||'').trim(),phone:String(f.get('phone')||'').trim(),
      email:String(f.get('email')||'').trim(),appointmentDate:String(f.get('appointmentDate')||'').trim(),
      photo,status:String(s.status||"Active"),dateCreated:s.dateCreated||new Date().toISOString()
    });
    afisapShowUploadLoader("Updating Teacher / Staff","Saving teacher / staff information to Google Sheets...",15);
    try{
      const selectedPhoto=pi?.files?.[0]||null;
      if(selectedPhoto){
        afisapUpdateUploadLoader("Preparing passport photo...",35);
        const uploadFile=await afisapPreparePassportPhoto(selectedPhoto);
        afisapUpdateUploadLoader("Uploading passport photo to Google Drive...",55);
        const driveResult=await afisapDriveUpload(uploadFile,"staff-passports",newSid||oldSid);
        if(!driveResult?.fileId)throw new Error("Google Drive did not return a passport photo File ID.");
        candidate.passportPhotoFileId=String(driveResult.fileId);
        candidate.passportPhotoUrl=afisapDriveFileUrl(String(driveResult.fileId));
        candidate.photo=candidate.passportPhotoUrl;
      }
      afisapUpdateUploadLoader("Updating the official Teachers record...",75);
      const cloudResult=await afisapCloudUpdateStaff(candidate,oldSid);
      if(!cloudResult||cloudResult.success!==true)throw new Error(String(cloudResult?.error||"Google Sheets did not confirm the update."));
      Object.assign(s,candidate,{appointmentDate:afisapDateOnly(candidate.appointmentDate)});
      afisapUpdateUploadLoader("Teacher / staff updated successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,250));
      afisapHideUploadLoader();
      $('#modal').classList.remove('show');
      nav('staff');
      alert('Teacher / staff information updated successfully and confirmed in Google Sheets.');
    }catch(error){
      afisapUpdateUploadLoader("Teacher / staff update could not be completed.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert('Teacher / staff changes were not saved.\n\nReason: '+String(error?.message||error||"Unknown error"));
    }
  });
}
function afisapStaffPhotoFileId(staff){
  return afisapDriveFileId(
    staff && (staff.passportPhotoFileId||staff.passportPhotoUrl||staff.photo||"")
  );
}
function afisapStaffPhotoSrc(staff){
  const id=afisapStaffPhotoFileId(staff);
  if(id) return afisapDriveFileUrl(id);
  const raw=String((staff&&staff.passportPhotoUrl)||(staff&&staff.photo)||"").trim();
  return /^https?:\/\//i.test(raw) ? raw : "";
}
async function afisapHydrateStaffPhotoElements(){
  const nodes=Array.from(document.querySelectorAll("img[data-staff-drive-file-id]"));
  await Promise.all(nodes.map(async img=>{
    const fileId=String(img.getAttribute("data-staff-drive-file-id")||"").trim();
    if(!fileId) return;
    try{
      const dataUrl=await afisapDrivePhotoDataUrl(fileId);
      if(dataUrl && img.isConnected) img.src=dataUrl;
    }catch(error){
      console.warn("AFISAP staff passport display unavailable:",fileId,error);
    }
  }));
}

function staff(){
  const staffList=Array.isArray(d.staff)?d.staff:[];

  const staffName=s=>{
    return String(
      s.name ||
      [s.firstName,s.middleName,s.surname,lastNameSafe(s)].filter(Boolean).join(" ")
    ).trim();
  };

  function lastNameSafe(s){ return s.surname||s.lastName||""; }

  function dobValue(s){
    return String(s.dob||s.dateOfBirth||s["Date of Birth"]||"").trim();
  }

  function ghanaCardValue(s){
    return String(
      s.ghanaCard||
      s.ghanaCardNumber||
      s["Ghana Card"]||
      ""
    ).trim();
  }

  function displayDate(value){
    const raw=String(value||"").trim();
    if(!raw) return "";
    if(typeof formatDate==="function"){
      try{return formatDate(raw);}catch(e){}
    }
    const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    return raw;
  }

  $('#app').innerHTML=`
    <div class='panel'>
      <div class='staff-actions'>
        <button class='primary' onclick='openStaff()'>+ Add Teacher / Staff</button>
        <button class='teacher-attendance-btn' onclick="nav('teacherAttendance')">✓ Teacher Attendance</button>
      </div>

      <div class='table' style='margin-top:15px;overflow-x:auto'>
        <table>
          <thead>
            <tr>
              <th>Passport Photo</th>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Ghana Card</th>
              <th>Position</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Phone</th>
              <th>Appointment Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${staffList.map(s=>{
              const nm=staffName(s);
              const dob=dobValue(s);
              const card=ghanaCardValue(s);
              return `
                <tr>
                  <td>
                    ${afisapStaffPhotoSrc(s)
                      ? `<img class='staff-thumb' src='${afisapStaffPhotoSrc(s).replace(/'/g,"&#39;")}' alt='' data-staff-drive-file-id='${afisapStaffPhotoFileId(s)}' onclick='viewStaffPhoto("${s.id}")' title='View passport photo'>`
                      : `<button class='staff-photo-placeholder' onclick='viewStaffPhoto("${s.id}")' title='No passport photo'>📷</button>`}
                  </td>
                  <td>${esc(s.sid||"")}</td>
                  <td><strong>${esc(nm)}</strong></td>
                  <td>${esc(displayDate(dob))}</td>
                  <td>${esc(card)}</td>
                  <td>${esc(s.position||"")}</td>
                  <td>${esc(s.class||"")}</td>
                  <td>${esc(s.subject||"")}</td>
                  <td>${esc(s.phone||"")}</td>
                  <td>${esc(displayDate(s.appointmentDate||""))}</td>
                  <td>
                    <button class='secondary edit-btn' onclick='editStaff("${esc(s.sid||s.staffId||s.id||"")}")'>Edit</button>
                    <button class='danger' onclick='del("staff","${esc(s.sid||s.staffId||s.id||"")}")'>Delete</button>
                  </td>
                </tr>`;
            }).join("") || `
              <tr><td colspan='11' class='empty'>No staff records yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>`;

  // Fetch the actual staff passport into the rendered image only.
  // Never persist the full Base64 image in d.staff/localStorage.
  setTimeout(()=>{afisapHydrateStaffPhotoElements().catch(()=>{});},0);
}


async function viewStaffPhoto(staffId){
  const s=d.staff.find(x=>String(x.id)===String(staffId));
  if(!s) return;
  const fileId=afisapStaffPhotoFileId(s);
  let photoSrc="";
  if(fileId) photoSrc=await afisapDrivePhotoDataUrl(fileId);
  if(!photoSrc) photoSrc=afisapStaffPhotoSrc(s);
  if(!photoSrc){
    alert("No passport photo has been added for this teacher/staff member.");
    return;
  }
  modal('Teacher / Staff Passport Photo',`
    <div class='student-photo-modal'>
      <img src='${photoSrc.replace(/'/g,"&#39;")}' alt='${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}'>
      <h3>${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}</h3>
      <p>${esc(s.sid)} • ${esc(s.position)}${s.class ? " • "+esc(s.class):""}</p>
    </div>`);
}

function teacherAttendance(){
  if(!d.teacherAttendance || typeof d.teacherAttendance!=="object" || Array.isArray(d.teacherAttendance)) d.teacherAttendance={};
  const teachers=Array.isArray(d.staff)?d.staff:[];
  const today=new Date().toISOString().slice(0,10);

  function teacherName(t){
    return t.name || [t.firstName,t.middleName,t.surname].filter(Boolean).join(" ") || "Unnamed Teacher";
  }
  function recordsFor(staffId){
    return Object.values(d.teacherAttendance||{}).filter(r=>r && String(r.staffId)===String(staffId) && r.date);
  }
  function attendanceDays(staffId){
    return new Set(recordsFor(staffId).filter(r=>r.present===true || r.status==="YES").map(r=>String(r.date))).size;
  }
  function presentDates(staffId){
    return [...new Set(recordsFor(staffId).filter(r=>r.present===true || r.status==="YES").map(r=>String(r.date)))].sort();
  }

  function render(){
    const selectedDate=window.teacherAttendanceDate||today;
    $('#app').innerHTML=`
      <div class="panel">
        <div class="panel-title">
          <div><h3>Teacher Attendance</h3><span>Select a date, then mark each registered teacher YES or NO.</span></div>
          <button class="teacher-attendance-btn" onclick="nav('staff')">← Teachers & Staff</button>
        </div>
        <div class="teacher-attendance-controls">
          <label>Date
            <input id="teacherAttendanceDate" type="date" value="${esc(selectedDate)}" required>
          </label>
          <div class="teacher-attendance-summary"><strong>${teachers.length}</strong><span>Registered Teachers / Staff</span></div>
        </div>
      </div>

      <div class="panel" style="margin-top:16px">
        <div class="panel-title">
          <h3>Mark Teacher Attendance</h3>
          <span>Attendance is saved using Staff ID + Date.</span>
        </div>
        <div id="teacherAttendanceList"></div>
        ${teachers.length ? `<button id="saveTeacherAttendance" class="primary" type="button" style="margin-top:16px">Save Teacher Attendance</button>` : ''}
      </div>

      <div class="panel" style="margin-top:16px">
        <div class="panel-title">
          <div><h3>Teacher Attendance Totals</h3><span>Present days are calculated automatically.</span></div>
          <button class="primary teacher-print-preview-btn" type="button" onclick="window.printTeacherAttendancePreview()" aria-label="Open teacher attendance print preview" title="Print Preview">
            <span class="printer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6zM17 12h.01"/></svg>
            </span>
            <span>PRINT PREVIEW</span>
          </button>
        </div>
        <div class="table" style="overflow-x:auto">
          <table>
            <thead><tr>
              <th>Passport Photo</th><th>Staff ID</th><th>Name</th><th>Position</th><th>Class</th><th>Subject</th><th>Phone</th><th>Total Attendance</th><th>Present Dates</th>
            </tr></thead>
            <tbody>
              ${teachers.map(t=>`
                <tr>
                  <td>${afisapStaffPhotoSrc(t)?`<img class="staff-attendance-thumb" src="${esc(afisapStaffPhotoSrc(t))}" data-staff-drive-file-id="${esc(afisapStaffPhotoFileId(t))}" alt="${esc(teacherName(t))}">`:`<div class="staff-attendance-placeholder">👤</div>`}</td>
                  <td>${esc(t.sid||"")}</td>
                  <td><strong>${esc(teacherName(t))}</strong></td>
                  <td>${esc(t.position||"")}</td>
                  <td>${esc(t.class||"")}</td>
                  <td>${esc(t.subject||"")}</td>
                  <td>${esc(t.phone||"")}</td>
                  <td><strong>${attendanceDays(t.sid)} day${attendanceDays(t.sid)===1?"":"s"}</strong></td>
                  <td>${presentDates(t.sid).map(x=>typeof formatDate==="function"?formatDate(x):x).join(", ")||"—"}</td>
                </tr>`).join("") || `<tr><td colspan="9" class="empty">No teachers or staff have been registered yet. Add them in Teachers & Staff first.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    renderTeachersForDate();
    $('#teacherAttendanceDate')?.addEventListener('change',e=>{
      window.teacherAttendanceDate=e.target.value;
      renderTeachersForDate();
    });
    $('#saveTeacherAttendance')?.addEventListener('click',saveTeacherAttendance);
  }

  function renderTeachersForDate(){
    const date=$('#teacherAttendanceDate')?.value;
    const box=$('#teacherAttendanceList');
    if(!box)return;
    if(!date){box.innerHTML='<div class="empty">Please select a date.</div>';return;}
    if(!teachers.length){box.innerHTML='<div class="empty">No teachers or staff have been registered yet.</div>';return;}

    box.innerHTML=teachers.map(t=>{
      const previous=Object.values(d.teacherAttendance||{}).find(r=>r && String(r.staffId)===String(t.sid) && String(r.date)===String(date));
      const state=previous ? (previous.present===true || previous.status==="YES") : null;
      const nm=teacherName(t);
      const radioId=String(t.id||t.sid).replace(/[^a-zA-Z0-9_-]/g,"_");
      return `
        <div class="teacher-attendance-row">
          <div class="teacher-attendance-person">
            ${afisapStaffPhotoSrc(t)?`<img class="staff-attendance-photo" src="${esc(afisapStaffPhotoSrc(t))}" data-staff-drive-file-id="${esc(afisapStaffPhotoFileId(t))}" alt="${esc(nm)}" onclick='viewStaffPhoto("${t.id}")'>`:`<div class="staff-attendance-photo-placeholder">👤</div>`}
            <div class="teacher-attendance-info">
              <strong>${esc(nm)}</strong>
              <div><b>Staff ID:</b> ${esc(t.sid||"")}</div>
              <div><span>${esc(t.position||"Not assigned")}</span>${t.class?` · <span>${esc(t.class)}</span>`:""}${t.subject?` · <span>${esc(t.subject)}</span>`:""}${t.phone?` · <span>${esc(t.phone)}</span>`:""}</div>
            </div>
          </div>
          <div class="teacher-attendance-choice">
            <strong>Did he/she come to school?</strong>
            <div>
              <label><input type="radio" name="teacherAttendance_${esc(radioId)}" value="YES" ${state===true?"checked":""}> <b>YES</b></label>
              <label><input type="radio" name="teacherAttendance_${esc(radioId)}" value="NO" ${state===false?"checked":""}> <b>NO</b></label>
            </div>
            <small>${state===true?"Saved: 1 day":state===false?"Saved: 0 days":"Not yet recorded for this date"}</small>${previous?`<button type="button" class="danger delete-teacher-attendance" data-attendance-id="${esc(previous.attendanceId||previous.id||((t.sid||t.id)+"_"+date))}" style="margin-top:8px">Delete Attendance</button>`:""}
          </div>
        </div>`;
    }).join("");
    box.querySelectorAll(".delete-teacher-attendance").forEach(btn=>{
      btn.addEventListener("click",()=>deleteTeacherAttendanceRecord(btn.dataset.attendanceId));
    });
    setTimeout(()=>{afisapHydrateStaffPhotoElements().catch(()=>{});},0);
  }

  window.printTeacherAttendancePreview=async function(){
    const list=Array.isArray(d.staff)?d.staff:[];
    if(!list.length){alert("No teachers or staff have been registered yet.");return;}

    const escPrint=(value)=>String(value??"")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");

    const nameOf=(t)=>t.name || [t.firstName,t.middleName,t.surname].filter(Boolean).join(" ") || "Unnamed Teacher";
    const formatPrintDate=(value)=>{
      const s=String(value||"");
      if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
        const [y,m,day]=s.split("-");
        return `${day}/${m}/${y}`;
      }
      return s;
    };
    const allTeacherAttendanceRecords=()=>{
      const source=d.teacherAttendance||{};
      if(Array.isArray(source)) return source.filter(Boolean);
      if(source && typeof source==="object") return Object.values(source).filter(Boolean);
      return [];
    };

    const isPresentRecord=(r)=>{
      const value=r?.present;
      const status=String(r?.status??"").trim().toLowerCase();
      return value===true ||
        value===1 ||
        value==="1" ||
        String(value??"").trim().toLowerCase()==="yes" ||
        status==="yes" ||
        status==="present" ||
        status==="true" ||
        status==="1";
    };

    const recordsForPrint=(teacher)=>{
      const sid=String(teacher?.sid??"").trim();
      const id=String(teacher?.id??"").trim();
      return allTeacherAttendanceRecords().filter(r=>{
        if(!r || !r.date) return false;
        const rid=String(r.staffId??r.teacherId??r.sid??r.id??"").trim();
        return rid===sid || (id && rid===id);
      });
    };

    const datesForPrint=(teacher)=>[...new Set(
      recordsForPrint(teacher)
        .filter(isPresentRecord)
        .map(r=>String(r.date))
        .filter(Boolean)
    )].sort();

    const totalForPrint=(teacher)=>datesForPrint(teacher).length;

    // Resolve each passport from the permanent Google Drive File ID before
    // building the print table. Never print a raw name/text value as a photo.
    await Promise.all(list.map(async t=>{
      const fileId=afisapStaffPhotoFileId(t);
      if(!fileId)return;
      const dataUrl=await afisapDrivePhotoDataUrl(fileId).catch(()=> "");
      if(dataUrl)t._afisapPrintPhoto=dataUrl;
    }));

    const rows=list.map(t=>{
      const dates=datesForPrint(t);
      const printPhoto=String(t._afisapPrintPhoto||afisapStaffPhotoSrc(t)||"").trim();
      const photo=/^(?:data:image\/|https?:\/\/)/i.test(printPhoto)
        ? `<img src="${escPrint(printPhoto)}" class="teacher-print-photo" alt="${escPrint(nameOf(t))}">`
        : `<div class="teacher-print-photo teacher-print-photo-empty">No Photo</div>`;
      return `<tr>
        <td>${photo}</td>
        <td><strong>${escPrint(t.sid||"")}</strong></td>
        <td>${escPrint(nameOf(t))}${t.email?`<small class="teacher-print-subinfo">Email: ${escPrint(t.email)}</small>`:""}</td>
        <td>${escPrint(t.position||"")}${t.appointmentDate?`<small class="teacher-print-subinfo">Appointment: ${escPrint(formatPrintDate(t.appointmentDate))}</small>`:""}</td>
        <td>${escPrint(t.class||"")}</td>
        <td>${escPrint(t.subject||"")}</td>
        <td>${escPrint(t.phone||"")}</td>
        <td class="teacher-print-total"><strong>${totalForPrint(t)} day${totalForPrint(t)===1?"":"s"}</strong></td>
        <td class="teacher-print-dates">${dates.length ? dates.map(formatPrintDate).join("<br>") : "—"}</td>
      </tr>`;
    }).join("");

    const preview=document.createElement("div");
    preview.className="teacher-print-preview";
    preview.innerHTML=`
      <img src="afisap_royal_academy_logo.png" alt="" aria-hidden="true" class="teacher-print-watermark">
      <div class="teacher-print-preview-head">
        <img src="afisap_royal_academy_logo.png" alt="AFISAP Royal Academy" class="teacher-print-logo">
        <div class="teacher-print-school-details">
          <h2>AFISAP ROYAL ACADEMY</h2>
          <h3>TEACHER ATTENDANCE SHEET</h3>
          <p>Complete attendance record for registered teachers and staff</p>
          <p class="teacher-print-contact">
            <span><b>Website:</b> www.afisaproyalacademy.com</span>
            <span><b>Email:</b> afisaproyalacademy@gmail.com</span>
            <span><b>Phone:</b> 0556104186 / 0242727685 / 0248743558</span>
          </p>
        </div>
      </div>
      <div class="teacher-print-meta">
        <span><b>School:</b> AFISAP Royal Academy</span>
        <span><b>Report:</b> Teacher Attendance Totals</span>
        <span><b>Printed:</b> ${escPrint(new Date().toLocaleDateString("en-GB"))}</span>
      </div>
      <div class="table teacher-print-table-wrap">
        <table class="teacher-print-table">
          <thead><tr>
            <th>Passport Photo</th>
            <th>Staff ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Class</th>
            <th>Subject</th>
            <th>Phone</th>
            <th>Total Attendance</th>
            <th>Present Dates</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="teacher-print-footer">
        <p><b>Note:</b> Total Attendance counts each date on which the teacher was marked YES. Present Dates lists every recorded date the teacher attended school.</p>
        <div class="teacher-print-signatures">
          <span>Administrator's Signature: ______________________________</span>
          <span>Head of School: _________________________________________</span>
        </div>
      </div>
      <div class="teacher-print-actions">
        <button class="primary" type="button" id="closeTeacherPrintPreview">Close Preview</button>
        <button class="primary teacher-print-action-btn" type="button" id="doPrintTeacherAttendance" aria-label="Print teacher attendance sheet" title="Print Attendance Sheet">
          <span class="printer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6zM17 12h.01"/></svg>
          </span>
          <span>PRINT ATTENDANCE SHEET</span>
        </button>
      </div>
    `;

    const modal=$('#modal');
    modal.innerHTML="";
    const box=document.createElement("div");
    box.className="modalbox teacher-print-modalbox";
    box.appendChild(preview);
    modal.appendChild(box);
    modal.classList.add("show");

    $('#closeTeacherPrintPreview').addEventListener("click",()=>modal.classList.remove("show"));
    $('#doPrintTeacherAttendance').addEventListener("click",()=>{
      const printWindow=window.open("", "_blank", "width=1280,height=900");
      if(!printWindow){
        alert("The browser blocked the print window. Please allow pop-ups for this school management system, then click Print Attendance Sheet again.");
        return;
      }

      // Build a completely independent print document. It contains the already-rendered
      // attendance report, so the application's modal/CSS cannot make the browser preview blank.
      const reportHTML=preview.outerHTML;
      const stylesheetLinks=Array.from(document.querySelectorAll("link[rel='stylesheet']"))
        .map(link=>`<link rel="stylesheet" href="${escPrint(link.href)}">`).join("\n");

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<base href="${escPrint(document.baseURI)}">
<title>AFISAP Royal Academy - Teacher Attendance Sheet</title>
${stylesheetLinks}
<style>
@page{size:A4 landscape;margin:8mm}
html,body{margin:0!important;padding:0!important;background:#fff!important}
body{font-family:Arial,Helvetica,sans-serif;color:#17243b}
.teacher-print-preview{
  display:block!important;
  position:relative!important;
  width:100%!important;
  box-sizing:border-box!important;
  padding:0!important;
  margin:0!important;
  background:#fff!important;
  color:#17243b!important;
  overflow:visible!important;
}
.teacher-print-preview-head{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:18px!important;
  padding:0 0 12px!important;
  border-bottom:3px solid #d7aa08!important;
  text-align:center!important;
}
.teacher-print-logo{
  display:block!important;
  flex:0 0 78px!important;
  width:78px!important;
  height:78px!important;
  object-fit:contain!important;
}
.teacher-print-school-details{flex:1!important;text-align:center!important}
.teacher-print-school-details h2{margin:0 0 3px!important;font-size:21px!important}
.teacher-print-school-details h3{margin:2px 0!important;font-size:15px!important}
.teacher-print-school-details p{margin:3px 0!important}
.teacher-print-contact{
  display:flex!important;
  flex-wrap:wrap!important;
  justify-content:center!important;
  gap:4px 14px!important;
  font-size:9px!important;
}
.teacher-print-contact span{white-space:nowrap!important}
.teacher-print-meta{
  display:flex!important;
  justify-content:space-between!important;
  gap:12px!important;
  padding:9px 0!important;
  font-size:10px!important;
}
.teacher-print-table-wrap{overflow:visible!important}
.teacher-print-table{
  width:100%!important;
  border-collapse:collapse!important;
  table-layout:auto!important;
  font-size:8.5px!important;
}
.teacher-print-table th,.teacher-print-table td{
  border:1px solid #aeb6c2!important;
  padding:5px!important;
  vertical-align:middle!important;
}
.teacher-print-table th{
  background:#0b3a71!important;
  color:#fff!important;
  text-align:center!important;
}
.teacher-print-photo{
  width:44px!important;
  height:54px!important;
  object-fit:cover!important;
  display:block!important;
  margin:auto!important;
}
.teacher-print-photo-empty{
  width:44px!important;
  height:54px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid #bbb!important;
  font-size:7px!important;
}
.teacher-print-dates{line-height:1.35!important}
.teacher-print-subinfo{display:block!important;font-size:7px!important;margin-top:2px!important}
.teacher-print-footer{margin-top:12px!important;font-size:9px!important}
.teacher-print-signatures{
  display:flex!important;
  justify-content:space-between!important;
  gap:20px!important;
  margin-top:22px!important;
}
.teacher-print-actions{display:none!important}
.teacher-print-watermark{
  display:block!important;
  position:absolute!important;
  left:50%!important;
  top:55%!important;
  width:270px!important;
  height:270px!important;
  transform:translate(-50%,-50%)!important;
  object-fit:contain!important;
  opacity:.075!important;
  z-index:0!important;
}
.teacher-print-preview > *:not(.teacher-print-watermark){
  position:relative!important;
  z-index:2!important;
}
</style>
</head>
<body>
${reportHTML}
<script>
(function(){
  const images=Array.from(document.images);
  let remaining=images.length;
  const done=()=>{
    setTimeout(function(){
      window.focus();
      window.print();
    },150);
  };
  if(!remaining){ done(); return; }
  const one=()=>{ remaining--; if(remaining<=0) done(); };
  images.forEach(function(img){
    if(img.complete) one();
    else { img.addEventListener("load",one,{once:true}); img.addEventListener("error",one,{once:true}); }
  });
  setTimeout(done,2500);
  window.addEventListener("afterprint",function(){
    setTimeout(function(){ window.close(); },500);
  });
})();
<\/script>
</body>
</html>`);
      printWindow.document.close();
    });
  };

  async function saveTeacherAttendance(){
    const date=$('#teacherAttendanceDate')?.value;
    if(!date){alert("Please select a date.");return;}
    if(!d.teacherAttendance || typeof d.teacherAttendance!=="object" || Array.isArray(d.teacherAttendance)) d.teacherAttendance={};

    for(const t of teachers){
      const radioId=String(t.id||t.sid).replace(/[^a-zA-Z0-9_-]/g,"_");
      const chosen=document.querySelector(`input[name="teacherAttendance_${CSS.escape(radioId)}"]:checked`);
      if(!chosen){alert("Please mark YES or NO for every teacher before saving.");return;}
    }

    const now=new Date().toISOString();
    const teacherAttendanceRecords=teachers.map(t=>{
      const radioId=String(t.id||t.sid).replace(/[^a-zA-Z0-9_-]/g,"_");
      const chosen=document.querySelector(`input[name="teacherAttendance_${CSS.escape(radioId)}"]:checked`);
      const staffId=String(t.sid||t.id||"").trim();
      const present=chosen.value==="YES";
      const key=staffId+"_"+String(date);
      return {
        "Attendance ID":key,
        "Staff ID":staffId,
        "Date":String(date),
        "Present":present?"YES":"NO",
        "Teacher Name":String(teacherName(t)||"").trim(),
        "Status":String(t.status||"").trim(),
        "Date Created":String((d.teacherAttendance[key]&&d.teacherAttendance[key].dateCreated)||now),
        "Last Updated":now
      };
    });

    afisapShowUploadLoader("Saving Teacher Attendance","Saving attendance to Google Sheets...",15);
    try{
      afisapUpdateUploadLoader("Updating the official Teacher Attendance sheet...",55);
      const result=await afisapCloudPost({
        action:"saveTeacherAttendanceBatch",
        records:teacherAttendanceRecords
      });
      if(!result||result.success!==true)throw new Error(String(result?.error||"Google Sheets did not confirm the attendance save."));

      teacherAttendanceRecords.forEach(record=>{
        const key=String(record["Attendance ID"]);
        d.teacherAttendance[key]={
          attendanceId:key,
          staffId:String(record["Staff ID"]),
          date:String(record["Date"]),
          present:String(record["Present"]).toUpperCase()==="YES",
          status:String(record["Present"]),
          dateCreated:String(record["Date Created"]||""),
          lastUpdated:String(record["Last Updated"]||"")
        };
      });

      afisapUpdateUploadLoader("Teacher attendance saved successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,250));
      afisapHideUploadLoader();
      render();
      alert("Teacher attendance saved successfully to Google Sheets.");
    }catch(error){
      afisapUpdateUploadLoader("Teacher attendance could not be saved.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert("Teacher attendance was not saved.\n\nReason: "+String(error?.message||error||"Unknown error"));
    }
  }

  async function deleteTeacherAttendanceRecord(attendanceId){
    const id=String(attendanceId||"").trim();
    if(!id)return;
    if(!confirm("Do you want to delete this teacher attendance record from Google Sheets?"))return;
    afisapShowUploadLoader("Deleting Teacher Attendance","Deleting attendance from Google Sheets...",15);
    try{
      afisapUpdateUploadLoader("Removing the official attendance record...",60);
      const result=await afisapCloudPost({
        action:"delete",
        sheet:"Teacher Attendance",
        idField:"Attendance ID",
        idValue:id
      });
      if(!result||result.success!==true)throw new Error(String(result?.error||"Google Sheets did not confirm deletion."));
      delete d.teacherAttendance[id];
      afisapUpdateUploadLoader("Teacher attendance deleted successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,250));
      afisapHideUploadLoader();
      render();
      alert("Teacher attendance deleted successfully from Google Sheets.");
    }catch(error){
      afisapUpdateUploadLoader("Teacher attendance could not be deleted.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert("Attendance was not deleted.\n\nReason: "+String(error?.message||error||"Unknown error"));
    }
  }

  render();
}

function afisapPromotionClassNames(){return afisapCentralClassNames()}
function afisapStaffClassAssignments(value){
  return [...new Set(String(value||"").split(/[,;|\n]+/).map(v=>String(v||"").trim()).filter(Boolean))];
}
function afisapSelectedStaffClasses(form){
  const selected=[...new Set((new FormData(form).getAll("class")||[]).map(v=>String(v||"").trim()).filter(Boolean))];
  if(selected.length>3)throw new Error("A teacher can be assigned to a maximum of 3 classes.");
  return selected;
}
function afisapStaffClassOptions(selectedValue){
  const selected=new Set(afisapStaffClassAssignments(selectedValue).map(v=>v.toLowerCase()));
  return afisapCentralClassNames().map(c=>`<option value="${esc(c)}" ${selected.has(String(c).toLowerCase())?"selected":""}>${esc(c)}</option>`).join("");
}
function afisapNextAcademicYear(value){
  const m=String(value||"").match(/(\d{4})\D+(\d{4})/);
  if(!m)return String(value||"");
  return `${Number(m[1])+1}/${Number(m[2])+1}`;
}
function afisapPromotionNextClass(current){
  const wanted=String(current||"").trim().toLowerCase();
  const idx=AFISAP_MANAGEMENT_CLASSES.findIndex(n=>n.toLowerCase()===wanted);
  return idx>=0&&idx<AFISAP_MANAGEMENT_CLASSES.length-1?AFISAP_MANAGEMENT_CLASSES[idx+1]:"";
}
function afisapPromotionStudentName(s){return String(s.name||[s.firstName,s.middleName,s.surname].filter(Boolean).join(" ")||s.sid||"").trim()}
function classes(){
  const names=afisapPromotionClassNames();
  const nextYear=afisapNextAcademicYear(String(d.school&&d.school.year||''));
  $('#app').innerHTML=`<div class='grid'><div class='panel'><button class='primary' onclick='openClass()'>+ Add Class</button>${d.classes.map(c=>`<div class='card' style='margin-top:10px'><b>${esc(c.name)}</b><br><small>Teacher: ${esc(c.teacher||'Not assigned')}</small><br><button class='danger' onclick='del("classes","${c.id}")'>Delete</button></div>`).join('')||'<div class="empty">No classes created.</div>'}</div><div class='panel'><h3>Report Subjects</h3><div class='chips' style='margin-top:15px'>${d.subjects.map(s=>`<span class='chip'>${esc(s)}</span>`).join('')}</div><p>Subjects follow the supplied school report sample.</p></div></div>
  <div class='panel afisap-promotion-panel' style='margin-top:18px'>
    <div class='panel-title'><div><h3>Academic Year Promotion</h3><span>Teachers recommend promotions during Term 3. Students remain in their current classes until the Administrator activates the new academic-year rollover.</span></div></div>
    <div id='afisapPendingPromotionSummary' class='notice' style='margin:12px 0'>Loading pending teacher promotion recommendations...</div>
    <div class='afisap-promotion-controls'>
      <label>New Academic Year<input id='afisapRolloverAcademicYear' value='${esc(nextYear)}' placeholder='e.g. 2027/2028'></label>
      <div class='afisap-promotion-next'><strong>Current Academic Year:</strong> ${esc(String(d.school&&d.school.year||''))}</div>
    </div>
    <div id='afisapPendingPromotionList'></div>
    <div class='afisap-promotion-actions' style='margin-top:14px'><button type='button' class='primary' id='afisapApplyRollover'>REVIEW & APPLY NEW ACADEMIC YEAR ROLLOVER</button></div>
    <p style='margin-top:12px;color:#64748b'><small>The rollover moves all pending teacher-approved students together. Existing students in destination classes should first have their own promotion decisions recorded. Manual individual class correction remains available below.</small></p>
  </div>
  <div class='panel afisap-promotion-panel' style='margin-top:18px'>
    <div class='panel-title'><div><h3>Manual Student Class Correction</h3><span>Use this only for correcting an individual student's active class outside the normal academic-year promotion process.</span></div></div>
    <div class='afisap-promotion-controls'><label>Select Current Class<select id='promotionClass'><option value=''>Select Class</option>${names.map(n=>`<option value='${esc(n)}'>${esc(n)}</option>`).join('')}</select></label><div id='promotionNext' class='afisap-promotion-next'>Select a class to view students.</div></div>
    <div id='promotionWorkspace'></div>
  </div>`;
  const sel=document.getElementById('promotionClass'); if(sel) sel.onchange=()=>{window.afisapCustomPromotionDestination='';afisapRenderPromotionWorkspace(sel.value)};
  document.getElementById('afisapApplyRollover')?.addEventListener('click',afisapApplyAcademicYearRollover);
  afisapLoadPendingPromotions();
}

async function afisapLoadPendingPromotions(){
  const summary=document.getElementById('afisapPendingPromotionSummary'),list=document.getElementById('afisapPendingPromotionList');
  if(!summary||!list)return;
  try{
    const r=await afisapCloudPost({action:'adminGetPendingPromotions'});
    if(!r?.success)throw new Error(r?.error||'Pending promotions could not be loaded.');
    const rows=Array.isArray(r.promotions)?r.promotions:[];
    summary.innerHTML=`<strong>${rows.length}</strong> pending promotion recommendation${rows.length===1?'':'s'} waiting for academic-year rollover.`;
    list.innerHTML=rows.length?`<div class='table-wrap'><table><thead><tr><th>Student</th><th>Student ID</th><th>Current Class</th><th>Promoted To</th><th>Academic Year</th><th>Term</th><th>Action</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.studentName||'')}</td><td>${esc(p.studentId||'')}</td><td>${esc(p.currentClass||p.previousClass||'')}</td><td><strong>${esc(p.promotedTo||'')}</strong></td><td>${esc(p.academicYear||'')}</td><td>${esc(p.term||'')}</td><td><button type='button' class='danger afisap-cancel-promotion' data-sid='${esc(p.studentId||'')}'>Cancel</button></td></tr>`).join('')}</tbody></table></div>`:`<div class='empty'>No pending teacher promotion recommendations for the current Academic Year / Term 3.</div>`;
    list.querySelectorAll('.afisap-cancel-promotion').forEach(btn=>btn.addEventListener('click',async()=>{
      const sid=String(btn.dataset.sid||'').trim();if(!sid)return;
      if(!confirm('Cancel this pending promotion recommendation? The student will remain in the current class.'))return;
      btn.disabled=true;btn.textContent='Cancelling...';
      try{const res=await afisapCloudPost({action:'adminCancelPromotion',studentId:sid});if(!res?.success)throw new Error(res?.error||'Promotion recommendation could not be cancelled.');await afisapLoadPendingPromotions();await afisapSyncStudentsFromCloud();}
      catch(err){btn.disabled=false;btn.textContent='Cancel';alert('Promotion recommendation was not cancelled.\n\n'+String(err?.message||err));}
    }));
  }catch(e){summary.textContent='Pending promotions could not be loaded: '+String(e?.message||e);list.innerHTML='';}
}

async function afisapApplyAcademicYearRollover(){
  const newYear=String(document.getElementById('afisapRolloverAcademicYear')?.value||'').trim();
  if(!/^\d{4}\s*[\/-]\s*\d{4}$/.test(newYear)){alert('Enter the new Academic Year, for example 2027/2028.');return;}
  const preview=await afisapCloudPost({action:'adminGetPendingPromotions'});
  if(!preview?.success){alert('Unable to review pending promotions.\n\n'+String(preview?.error||''));return;}
  const rows=Array.isArray(preview.promotions)?preview.promotions:[];
  if(!rows.length){alert('There are no pending teacher promotion recommendations to apply.');return;}
  const byMove={};rows.forEach(p=>{const key=`${p.currentClass||p.previousClass||''} → ${p.promotedTo||''}`;byMove[key]=(byMove[key]||0)+1;});
  const summary=Object.entries(byMove).map(([move,count])=>`${move}: ${count} student${count===1?'':'s'}`).join('\n');
  if(!confirm(`Apply the new academic-year rollover to ${rows.length} student${rows.length===1?'':'s'}?\n\nNew Academic Year: ${newYear}\n\n${summary}\n\nThis will change their active classes together.`))return;
  afisapShowUploadLoader('Applying Academic Year Rollover','Validating pending promotions before moving students...',15);
  try{
    afisapUpdateUploadLoader('Updating student classes in Google Sheets...',55);
    const r=await afisapCloudPost({action:'adminApplyPromotionRollover',newAcademicYear:newYear});
    if(!r?.success)throw new Error(r?.error||'Academic-year rollover was not completed.');
    afisapUpdateUploadLoader('Refreshing student and class records...',85);
    await Promise.all([afisapSyncStudentsFromCloud(),afisapLoadCentralConfig().catch(()=>null)]);
    if(d.school&&typeof d.school==='object'){d.school.year=newYear;d.school.term='Term 1';}
    afisapUpdateUploadLoader('Academic-year rollover completed successfully.',100);
    await new Promise(resolve=>setTimeout(resolve,350));
    afisapHideUploadLoader();
    classes();
    alert(`Academic-year rollover completed successfully.\n\n${r.applied||0} student${Number(r.applied||0)===1?' has':'s have'} moved to the approved destination classes.\nNew Academic Year: ${newYear}\nNew Term: Term 1${r.schoolSetupWarning?'\n\nNote: '+r.schoolSetupWarning:''}`);
  }catch(e){afisapUpdateUploadLoader('Academic-year rollover could not be completed.',100);setTimeout(()=>afisapHideUploadLoader(),700);alert('Rollover was not completed.\n\n'+String(e?.message||e));}
}

function afisapRenderPromotionWorkspace(className){
  const box=document.getElementById('promotionWorkspace'),nextBox=document.getElementById('promotionNext'); if(!box)return;
  if(!className){box.innerHTML='';if(nextBox)nextBox.textContent='Select a class to view students.';return;}
  const students=(d.students||[]).filter(s=>String(s.class||'').trim().toLowerCase()===String(className).trim().toLowerCase());
  if(nextBox)nextBox.innerHTML=`<strong>${students.length}</strong> active student${students.length===1?'':'s'} in ${esc(className)}`;
  box.innerHTML=`<div class='afisap-promotion-list'>${students.map(s=>`<div class='afisap-promotion-student'><span><b>${esc(afisapPromotionStudentName(s))}</b><small>${esc(s.sid||'')} · Current Class: ${esc(className)}</small></span><em>${s._afisapPromotionStatus==='pending'?`Pending promotion to ${esc(s._afisapPromotedTo||'')}`:'Active class record'}</em><button type='button' class='secondary afisap-individual-class' data-sid='${esc(s.sid||'')}' data-current='${esc(className)}'>Change Class</button></div>`).join('')||`<div class='empty'>No students are currently registered in ${esc(className)}.</div>`}</div>`;
  box.querySelectorAll('.afisap-individual-class').forEach(b=>b.onclick=()=>afisapOpenIndividualClassChange(b.dataset.sid,b.dataset.current));
}

async function afisapPromotionUpdateStudentClass(student,newClass){
  const sid=String(student&&student.sid||'').trim();
  if(!sid) return {success:false,error:'Student ID is required for promotion.'};
  return afisapCloudPost({
    action:'update',
    sheet:'Students',
    idField:'Student ID',
    idValue:sid,
    data:{
      'Class':String(newClass||'').trim(),
      'Academic Year':String(d.school&&d.school.year||'').trim(),
      'Last Updated':new Date().toISOString()
    }
  });
}

function afisapOpenIndividualClassChange(sid,currentClass){
  const student=(d.students||[]).find(s=>String(s.sid||'')===String(sid));
  if(!student)return;
  const names=afisapPromotionClassNames();
  modal('Change Student Class',`<form id='individualClassForm' class='form'><div class='wide'><b>${esc(afisapPromotionStudentName(student))}</b><br><small>Student ID: ${esc(student.sid)} · Current Class: ${esc(currentClass)}</small></div><label class='wide'>New Class<select name='newClass' required>${names.map(n=>`<option value='${esc(n)}' ${n===currentClass?'selected':''}>${esc(n)}</option>`).join('')}</select></label><div class='wide'><button class='primary' type='submit'>Save</button></div></form>`);
  document.getElementById('individualClassForm').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const newClass=String(f.get('newClass')||'');
    if(!newClass||newClass===currentClass){
      document.getElementById('modal').classList.remove('show');
      return;
    }
    const r=await afisapPromotionUpdateStudentClass(student,newClass);
    if(!r||r.success!==true){
      alert('Class change failed: '+(r&&r.error||'Google Sheets synchronization failed.'));
      return;
    }
    student._afisapPreviousClass=String(currentClass||'').trim();
    student._afisapPromotedTo=String(newClass||'').trim();
    student._afisapPromotionAt=new Date().toISOString();
    student.class=newClass;
    student.rollNo="";
    student.noOnRoll="";
    persist();
    document.getElementById('modal').classList.remove('show');
    classes();
    alert('Student class updated successfully in Google Sheets.');
  };
}




function getStudentAttendanceDays(studentId){
  if(!d.attendance || typeof d.attendance !== 'object') return 0;
  return Object.values(d.attendance).filter(r =>
    String(r.studentId) === String(studentId) && r.present === true
  ).length;
}


function getStudentAttendanceRecords(studentId){
  const out=[], a=d.attendance;
  if(!a) return out;
  if(Array.isArray(a)){
    a.forEach(r=>{ if(r && String(r.studentId)===String(studentId) && r.date) out.push(r); });
  }else if(typeof a==="object"){
    Object.values(a).forEach(r=>{ if(r && String(r.studentId)===String(studentId) && r.date) out.push(r); });
  }
  return out;
}
function getStudentAttendanceDays(studentId){
  return new Set(getStudentAttendanceRecords(studentId)
    .filter(r=>r.present===true || r.status==="present" || r.status==="YES")
    .map(r=>String(r.date))).size;
}
function getStudentPresentDates(studentId){
  return [...new Set(getStudentAttendanceRecords(studentId)
    .filter(r=>r.present===true || r.status==="present" || r.status==="YES")
    .map(r=>String(r.date)))].sort();
}

function afisapAttendanceReportOverride(student,year,term){
  const ids=new Set([student?.id,student?.sid,student?.studentId,student?.["Student ID"]].filter(Boolean).map(v=>String(v).trim()));
  let found=null;
  Object.entries(d.attendance||{}).forEach(([key,r])=>{
    if(!r)return;const rid=String(r.studentSid||r.studentId||"").trim();if(!ids.has(rid))return;
    const raw=String(r.status||"").trim(),m=raw.match(/^REPORT_DAYS:(\d+)\|([^|]*)\|(.+)$/i);if(!m)return;
    if(String(m[2]||"").trim()===String(year||"").trim()&&afisapNormalizeReportTerm(m[3])===afisapNormalizeReportTerm(term))found=Number(m[1]);
  });
  return Number.isInteger(found)&&found>=0?found:null;
}
function afisapAttendanceOutOfOverride(student,year,term){
  const ids=new Set([student?.id,student?.sid,student?.studentId,student?.["Student ID"]].filter(Boolean).map(v=>String(v).trim()));
  let found=null;
  Object.entries(d.attendance||{}).forEach(([key,r])=>{
    if(!r)return;const rid=String(r.studentSid||r.studentId||"").trim();if(!ids.has(rid))return;
    const raw=String(r.status||"").trim(),m=raw.match(/^OUT_OF_DAYS:(\d+)\|([^|]*)\|(.+)$/i);if(!m)return;
    if(String(m[2]||"").trim()===String(year||"").trim()&&afisapNormalizeReportTerm(m[3])===afisapNormalizeReportTerm(term))found=Number(m[1]);
  });
  return Number.isInteger(found)&&found>=0?found:null;
}
async function afisapSaveAttendanceReportOverride(student,year,term,days){
  const sid=String(student?.sid||student?.studentId||student?.["Student ID"]||student?.id||"").trim();
  if(!sid)throw new Error("Student ID is required.");
  const id=["REPORT_DAYS",sid,String(year||"").trim(),afisapNormalizeReportTerm(term)].join("|");
  const marker=`REPORT_DAYS:${days}|${String(year||"").trim()}|${afisapNormalizeReportTerm(term)}`,now=new Date().toISOString();
  const data={"Attendance ID":id,"Student ID":sid,"Student Name":student.name||[student.firstName,student.middleName,student.surname].filter(Boolean).join(" "),"Class":student.class||"","Date":"","Attendance Date":"","Present":marker,"Status":marker,"Academic Year":String(year||"").trim(),"Term":afisapNormalizeReportTerm(term),"Recorded By":"Administrator","Date Created":now,"Last Updated":now};
  let r=await afisapCloudPost({action:"update",sheet:"Student Attendance",idField:"Attendance ID",idValue:id,data});
  if(!r||r.success!==true)r=await afisapCloudPost({action:"create",sheet:"Student Attendance",data});
  if(!r||r.success!==true)throw new Error(r?.error||"Unable to save Report Days.");
  d.attendance=d.attendance||{};
  d.attendance[id]={
    attendanceId:id,
    studentId:String(student?.id||sid),
    studentSid:sid,
    date:"",
    present:false,
    status:marker,
    academicYear:String(year||"").trim(),
    term:afisapNormalizeReportTerm(term)
  };
  persist();
  return r;
}
function attendance(){
  if(!d.attendance || typeof d.attendance!=="object" || Array.isArray(d.attendance)) d.attendance={};
  const students=Array.isArray(d.students)?d.students:[];

  function nameOf(s){
    return s.name || [s.surname,s.firstName,s.middleName,s.otherName].filter(Boolean).join(" ");
  }

  function allRecords(studentId){
    const result=[];
    const source=d.attendance || {};
    const records=Array.isArray(source)?source:Object.values(source);
    records.forEach(r=>{
      if(r && typeof r==="object" && String(r.studentId)===String(studentId) && r.date) result.push(r);
    });
    return result;
  }

  function isPresent(r){
    const present=String(r?.present??"").trim().toLowerCase();
    const status=String(r?.status??"").trim().toLowerCase();
    return r?.present===true || present==="true" || present==="1" || present==="yes" ||
      status==="present" || status==="yes" || status==="true" || status==="1";
  }

  function presentDates(studentId){
    return [...new Set(
      allRecords(studentId)
        .filter(isPresent)
        .map(r=>String(r.date))
        .filter(Boolean)
    )].sort();
  }

  function guardianOf(s){
    return s.guardian || s.guardianName || s.parentGuardian || "";
  }

  function contactOf(s){
    return s.guardianContact || s.contact || s.guardianPhone || s.phone || "";
  }

  function render(){
    $('#app').innerHTML=`
      <div class="panel">
        <div class="panel-title"><h3>Attendance</h3></div>

        <div class="form-grid">
          <label>Class
            <select id="attendanceClass">
              <option value="">Select Class</option>
              ${[...new Set(students.map(s=>s.class).filter(Boolean))]
                .map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}
            </select>
          </label>

          <label>Date
            <input id="attendanceDate" type="date" value="${new Date().toISOString().slice(0,10)}">
          </label>
        </div>
      </div>

      <div class="panel" style="margin-top:16px">
        <div class="panel-title" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <h3>Mark Attendance</h3>
            <span>Select a class and date. You can mark the whole class PRESENT, then remove/uncheck students who did not come.</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="markAllPresent" class="secondary" type="button">✓ MARK ALL PRESENT</button>
            <button id="clearAllPresent" class="secondary" type="button">CLEAR ALL</button>
          </div>
        </div>
        <div id="attendanceBulkSummary" class="report-help-text" style="margin:10px 0 12px"></div>
        <div id="attendanceStudents"></div>
        <button id="saveAttendance" class="primary" type="button" style="margin-top:16px">
          Save Attendance
        </button>
      </div>

      <div class="panel" style="margin-top:16px">
        <div class="panel-title" style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <h3>Attendance Records</h3>
          <button id="printStudentAttendance" class="primary student-attendance-print-btn"
                  type="button" title="Print Student Attendance Sheet"
                  aria-label="Print Student Attendance Sheet">
            <span class="printer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6zM17 12h.01"/>
              </svg>
            </span>
            <span>PRINT ATTENDANCE</span>
          </button>
        </div>

        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr>
                <th>Passport Photo</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Recorded Days</th>
                <th>Report Days</th>
                <th>Present Dates</th>
                <th>Gender</th>
                <th>Guardian</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody id="attendanceRecords"></tbody>
          </table>
        </div>
      </div>
    `;

    renderStudentsForMarking();
    renderRecords();

    $("#attendanceClass").addEventListener("change",renderStudentsForMarking);
    $("#attendanceDate").addEventListener("change",renderStudentsForMarking);
    $("#saveAttendance").addEventListener("click",saveAttendance);
    $("#printStudentAttendance").addEventListener("click",printStudentAttendance);
    $("#markAllPresent").addEventListener("click",()=>setAllAttendanceState(true));
    $("#clearAllPresent").addEventListener("click",()=>setAllAttendanceState(false));
  }

  function updateAttendanceSummary(){
    const total=document.querySelectorAll(".attendance-present-check").length;
    const present=document.querySelectorAll(".attendance-present-check:checked").length;
    const absent=total-present;
    const box=$("#attendanceBulkSummary");
    if(box) box.innerHTML=`<b>${present}</b> Present &nbsp; | &nbsp; <b>${absent}</b> Absent &nbsp; | &nbsp; <b>${total}</b> Students in selected class`;
  }

  function setAllAttendanceState(present){
    document.querySelectorAll(".attendance-present-check").forEach(cb=>{ cb.checked=present; });
    updateAttendanceSummary();
  }

  function renderStudentsForMarking(){
    const cls=$("#attendanceClass").value;
    const date=$("#attendanceDate").value;
    const list=students.filter(s=>!cls || s.class===cls);
    const box=$("#attendanceStudents");

    if(!list.length){
      box.innerHTML='<div class="empty">No students found.</div>';
      updateAttendanceSummary();
      return;
    }

    box.innerHTML=list.map(s=>{
      const previous=allRecords(s.id).find(r=>String(r.date)===String(date));
      const state=previous ? isPresent(previous) : true;
      const nm=nameOf(s);

      return `
        <div class="attendance-student-row" style="display:flex;align-items:center;justify-content:space-between;gap:15px;padding:12px 0;border-bottom:1px solid #eee">
          <label style="display:flex;align-items:center;gap:12px;flex:1;cursor:pointer">
            <input class="attendance-present-check" type="checkbox"
                   data-student-id="${esc(String(s.id))}"
                   ${state===true?"checked":""}
                   aria-label="Mark ${esc(nm)} present">
            ${
              s.photo
              ? `<img src="${s.photo}" alt="${esc(nm)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
              : `<div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center">👤</div>`
            }
            <span>
              <strong>${esc(nm)}</strong>
              <small style="display:block">${esc(s.id||"")} · ${esc(s.class||"")}</small>
            </span>
          </label>
          <span class="attendance-status-label">${state===true?"PRESENT":"ABSENT"}</span>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".attendance-present-check").forEach(cb=>{
      cb.addEventListener("change",e=>{
        const row=e.target.closest(".attendance-student-row");
        const label=row?.querySelector(".attendance-status-label");
        if(label) label.textContent=e.target.checked?"PRESENT":"ABSENT";
        updateAttendanceSummary();
      });
    });
    updateAttendanceSummary();
  }

  async function saveAttendance(){
    const date=$("#attendanceDate").value;
    const cls=$("#attendanceClass").value;

    if(!date){
      alert("Please select a date.");
      return;
    }

    const list=students.filter(s=>!cls || s.class===cls);

    const attendanceRecords = list.map(s=>{
      const checkbox=document.querySelector(`.attendance-present-check[data-student-id="${CSS.escape(String(s.id))}"]`);
      const studentId=String(s.id||"").trim();
      const cloudStudentId=String(s.sid||s.studentId||s["Student ID"]||s.id||"").trim();
      const present=!!checkbox?.checked;
      const key=studentId+"_"+String(date);
      const cloudKey=cloudStudentId+"_"+String(date);

      // Google Sheets must use the student's persistent school Student ID,
      // not the browser-only local object ID. This lets Parent Portal match
      // the same student across refreshes, browsers and devices.
      return {
        "Attendance ID": cloudKey,
        "Student ID": cloudStudentId,
        "Date": String(date),
        "Present": present ? "YES" : "NO",
        "Class": String(s.class||"").trim(),
        "Student Name": String(nameOf(s)||"").trim(),
        "Gender": String(s.gender||"").trim(),
        "Guardian": String(guardianOf(s)||"").trim(),
        "Contact": String(contactOf(s)||"").trim(),
        "Date Created": new Date().toISOString(),
        "Last Updated": new Date().toISOString()
      };
    });

    afisapShowUploadLoader("Saving Student Attendance","Saving attendance to Google Sheets...",15);
    try{
      afisapUpdateUploadLoader("Updating the official Student Attendance sheet...",55);
      const result=await afisapCloudPost({
        action:"saveStudentAttendanceBatch",
        records:attendanceRecords
      });
      if(!result||result.success!==true)throw new Error(String(result?.error||"Google Sheets did not confirm the attendance save."));

      attendanceRecords.forEach(record=>{
        const cloudId=String(record["Attendance ID"]||"").trim();
        const student=students.find(s=>String(s.sid||s.studentId||s["Student ID"]||s.id||"").trim()===String(record["Student ID"]||"").trim());
        d.attendance[cloudId]={
          attendanceId:cloudId,
          studentId:String(student?.id||record["Student ID"]||""),
          studentSid:String(record["Student ID"]||""),
          date:String(record["Date"]||""),
          present:String(record["Present"]||"").toUpperCase()==="YES",
          status:String(record["Present"]||""),
          academicYear:String(d.school?.year||"").trim(),
          term:String(d.school?.term||"").trim()
        };
      });
      persist();
      renderRecords();
      const presentCount=attendanceRecords.filter(r=>r["Present"]==="YES").length;
      const absentCount=attendanceRecords.length-presentCount;
      afisapUpdateUploadLoader("Attendance saved successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,220));
      afisapHideUploadLoader();
      alert(`Attendance saved successfully to Google Sheets.\n\nPresent: ${presentCount}\nAbsent: ${absentCount}`);
    }catch(error){
      console.error("Student attendance cloud sync error:",error);
      afisapUpdateUploadLoader("Attendance could not be saved.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert("Attendance was not saved because Google Sheets could not confirm the records.\n\nReason: "+String(error?.message||error||"Unknown error"));
      return;
    }
  }

  function renderRecords(){
    const body=$("#attendanceRecords");
    if(!body) return;

    body.innerHTML=students.map(s=>{
      const dates=presentDates(s.id);
      const nm=nameOf(s);

      return `
        <tr>
          <td>
            ${
              s.photo
              ? `<img src="${s.photo}" alt="${esc(nm)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
              : `<div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center">👤</div>`
            }
          </td>
          <td>${esc(s.id||"")}</td>
          <td><strong>${esc(nm)}</strong></td>
          <td>${esc(s.class||"")}</td>
          <td><strong>${dates.length} day${dates.length===1?"":"s"}</strong></td>
          <td><strong>${afisapAttendanceReportOverride(s,d.school?.year,d.school?.term)??dates.length} day${(afisapAttendanceReportOverride(s,d.school?.year,d.school?.term)??dates.length)===1?"":"s"}</strong><br><button class="secondary admin-edit-report-days" data-student-id="${esc(String(s.id||""))}" type="button">Edit Attendance Days</button></td>
          <td>${dates.length ? dates.map(x=>typeof formatDate==="function"?formatDate(x):x).join(", ") : "—"}</td>
          <td>${esc(s.gender||"")}</td>
          <td>${esc(guardianOf(s))}</td>
          <td>${esc(contactOf(s))}</td>
        </tr>
      `;
    }).join("");
    document.querySelectorAll(".admin-edit-report-days").forEach(btn=>btn.addEventListener("click",async()=>{
      const student=students.find(s=>String(s.id)===String(btn.dataset.studentId));if(!student)return;
      const recorded=presentDates(student.id).length,current=afisapAttendanceReportOverride(student,d.school?.year,d.school?.term)??recorded;
      const entered=prompt(`Recorded Days: ${recorded}\n\nReport Days (whole number 0 or greater):`,String(current));if(entered===null)return;
      if(!/^\d+$/.test(String(entered).trim()))return alert("Report Days must be a non-negative whole number (0, 1, 2, 3...).");
      afisapShowUploadLoader("Updating Attendance Days","Saving Report Attendance Days to Google Sheets...",15);
      try{
        afisapUpdateUploadLoader("Updating the official Student Attendance sheet...",60);
        await afisapSaveAttendanceReportOverride(student,d.school?.year,d.school?.term,Number(entered));
        renderRecords();
        afisapUpdateUploadLoader("Attendance Days updated successfully.",100);
        await new Promise(resolve=>setTimeout(resolve,220));
        afisapHideUploadLoader();
        alert("Report Attendance Days saved to Google Sheets.");
      }catch(e){
        afisapUpdateUploadLoader("Attendance Days could not be updated.",100);
        setTimeout(()=>afisapHideUploadLoader(),650);
        alert(e.message||e);
      }
    }));
  }

  function printStudentAttendance(){
    window.printStudentAttendancePreview();
  }

  window.printStudentAttendancePreview=function(){
    const list=Array.isArray(d.students)?d.students:[];
    if(!list.length){alert("No students have been registered yet.");return;}

    const escPrint=(value)=>String(value??"")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");

    const formatPrintDate=(value)=>{
      const s=String(value||"");
      if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
        const [y,m,day]=s.split("-");
        return `${day}/${m}/${y}`;
      }
      return s;
    };

    const allStudentAttendanceRecords=()=>{
      const source=d.attendance||{};
      if(Array.isArray(source)) return source.filter(Boolean);
      if(source && typeof source==="object") return Object.values(source).filter(Boolean);
      return [];
    };

    const isPresentRecord=(r)=>{
      const value=r?.present;
      const status=String(r?.status??"").trim().toLowerCase();
      return value===true ||
        value===1 ||
        value==="1" ||
        String(value??"").trim().toLowerCase()==="yes" ||
        status==="yes" ||
        status==="present" ||
        status==="true" ||
        status==="1";
    };

    const recordsForPrint=(student)=>{
      const sid=String(student?.id??"").trim();
      const studentId=String(student?.studentId??student?.sid??"").trim();
      return allStudentAttendanceRecords().filter(r=>{
        if(!r || !r.date) return false;
        const rid=String(r.studentId??r.sid??r.id??"").trim();
        return rid===sid || (studentId && rid===studentId);
      });
    };

    const datesForPrint=(student)=>[...new Set(
      recordsForPrint(student)
        .filter(isPresentRecord)
        .map(r=>String(r.date))
        .filter(Boolean)
    )].sort();

    const totalForPrint=(student)=>datesForPrint(student).length;

    const studentName=(s)=>
      s.name ||
      [s.firstName,s.middleName,s.surname,s.otherName].filter(Boolean).join(" ") ||
      "Unnamed Student";

    const rows=list.map(s=>{
      const dates=datesForPrint(s);
      const photo=s.photo
        ? `<img src="${escPrint(s.photo)}" class="student-print-photo" alt="${escPrint(studentName(s))}">`
        : `<div class="student-print-photo student-print-photo-empty">No Photo</div>`;

      const guardian=s.guardian||s.guardianName||s.parentGuardian||"";
      const contact=s.guardianContact||s.contact||s.guardianPhone||s.phone||"";

      return `<tr>
        <td>${photo}</td>
        <td><strong>${escPrint(s.id||s.sid||s.studentId||"")}</strong></td>
        <td>${escPrint(studentName(s))}</td>
        <td>${escPrint(s.class||s.className||"")}</td>
        <td class="student-print-total"><strong>${totalForPrint(s)} day${totalForPrint(s)===1?"":"s"}</strong></td>
        <td class="student-print-dates">${dates.length ? dates.map(formatPrintDate).join("<br>") : "—"}</td>
        <td>${escPrint(s.gender||"")}</td>
        <td>${escPrint(guardian)}</td>
        <td>${escPrint(contact)}</td>
      </tr>`;
    }).join("");

    const preview=document.createElement("div");
    preview.className="student-print-preview";
    preview.innerHTML=`
      <img src="afisap_royal_academy_logo.png" alt="" aria-hidden="true" class="student-print-watermark">

      <div class="student-print-preview-head">
        <img src="afisap_royal_academy_logo.png" alt="AFISAP Royal Academy" class="student-print-logo">
        <div class="student-print-school-details">
          <h2>AFISAP ROYAL ACADEMY</h2>
          <h3>STUDENT ATTENDANCE SHEET</h3>
          <p>Complete attendance record for registered students</p>
          <p class="student-print-contact">
            <span><b>Website:</b> www.afisaproyalacademy.com</span>
            <span><b>Email:</b> afisaproyalacademy@gmail.com</span>
            <span><b>Phone:</b> 0556104186 / 0242727685 / 0248743558</span>
          </p>
        </div>
      </div>

      <div class="student-print-meta">
        <span><b>School:</b> AFISAP Royal Academy</span>
        <span><b>Report:</b> Student Attendance Totals</span>
        <span><b>Printed:</b> ${escPrint(new Date().toLocaleDateString("en-GB"))}</span>
      </div>

      <div class="table student-print-table-wrap">
        <table class="student-print-table">
          <thead><tr>
            <th>Passport Photo</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Class</th>
            <th>Total Attendance</th>
            <th>Present Dates</th>
            <th>Gender</th>
            <th>Guardian</th>
            <th>Contact</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="9" class="empty">No student attendance records available.</td></tr>`}</tbody>
        </table>
      </div>

      <div class="student-print-footer">
        <p><b>Note:</b> Total Attendance counts each date on which the student was marked YES. Present Dates lists every recorded date the student attended school.</p>
        <div class="student-print-signatures">
          <span>Administrator's Signature: ______________________________</span>
          <span>Head of School: _________________________________________</span>
        </div>
      </div>

      <div class="student-print-actions">
        <button class="primary" type="button" id="closeStudentPrintPreview">Close Preview</button>
        <button class="primary student-print-action-btn" type="button" id="doPrintStudentAttendance"
                aria-label="Print student attendance sheet" title="Print Attendance Sheet">
          <span class="printer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v5h-2M6 14h12v7H6zM17 12h.01"/>
            </svg>
          </span>
          <span>PRINT ATTENDANCE SHEET</span>
        </button>
      </div>
    `;

    const modal=$('#modal');
    modal.innerHTML="";
    const box=document.createElement("div");
    box.className="modalbox student-print-modalbox";
    box.appendChild(preview);
    modal.appendChild(box);
    modal.classList.add("show");

    $('#closeStudentPrintPreview').addEventListener("click",()=>modal.classList.remove("show"));

    $('#doPrintStudentAttendance').addEventListener("click",()=>{
      const printWindow=window.open("", "_blank", "width=1280,height=900");
      if(!printWindow){
        alert("The browser blocked the print window. Please allow pop-ups for this school management system, then click Print Attendance Sheet again.");
        return;
      }

      // IMPORTANT: This is intentionally the same independent browser-print
      // mechanism used by the working Teacher Attendance print preview.
      const reportHTML=preview.outerHTML;
      const stylesheetLinks=Array.from(document.querySelectorAll("link[rel='stylesheet']"))
        .map(link=>`<link rel="stylesheet" href="${escPrint(link.href)}">`).join("\n");

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<base href="${escPrint(document.baseURI)}">
<title>AFISAP Royal Academy - Student Attendance Sheet</title>
${stylesheetLinks}
<style>
@page{size:A4 landscape;margin:8mm}
html,body{margin:0!important;padding:0!important;background:#fff!important}
body{font-family:Arial,Helvetica,sans-serif;color:#17243b}
.student-print-preview{
  display:block!important;
  position:relative!important;
  width:100%!important;
  box-sizing:border-box!important;
  padding:0!important;
  margin:0!important;
  background:#fff!important;
  color:#17243b!important;
  overflow:visible!important;
}
.student-print-preview-head{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:18px!important;
  padding:0 0 12px!important;
  border-bottom:3px solid #d7aa08!important;
  text-align:center!important;
}
.student-print-logo{
  display:block!important;
  flex:0 0 78px!important;
  width:78px!important;
  height:78px!important;
  object-fit:contain!important;
}
.student-print-school-details{flex:1!important;text-align:center!important}
.student-print-school-details h2{margin:0 0 3px!important;font-size:21px!important}
.student-print-school-details h3{margin:2px 0!important;font-size:15px!important}
.student-print-school-details p{margin:3px 0!important}
.student-print-contact{
  display:flex!important;
  flex-wrap:wrap!important;
  justify-content:center!important;
  gap:4px 14px!important;
  font-size:9px!important;
}
.student-print-contact span{white-space:nowrap!important}
.student-print-meta{
  display:flex!important;
  justify-content:space-between!important;
  gap:12px!important;
  padding:9px 0!important;
  font-size:10px!important;
}
.student-print-table-wrap{overflow:visible!important}
.student-print-table{
  width:100%!important;
  border-collapse:collapse!important;
  table-layout:auto!important;
  font-size:8.5px!important;
}
.student-print-table th,.student-print-table td{
  border:1px solid #aeb6c2!important;
  padding:5px!important;
  vertical-align:middle!important;
}
.student-print-table th{
  background:#0b3a71!important;
  color:#fff!important;
  text-align:center!important;
}
.student-print-photo{
  width:44px!important;
  height:54px!important;
  object-fit:cover!important;
  display:block!important;
  margin:auto!important;
}
.student-print-photo-empty{
  width:44px!important;
  height:54px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid #bbb!important;
  font-size:7px!important;
}
.student-print-dates{line-height:1.35!important}
.student-print-total{text-align:center!important;white-space:nowrap!important}
.student-print-footer{margin-top:12px!important;font-size:9px!important}
.student-print-signatures{
  display:flex!important;
  justify-content:space-between!important;
  gap:20px!important;
  margin-top:22px!important;
}
.student-print-actions{display:none!important}
.student-print-watermark{
  display:block!important;
  position:absolute!important;
  left:50%!important;
  top:55%!important;
  width:270px!important;
  height:270px!important;
  transform:translate(-50%,-50%)!important;
  object-fit:contain!important;
  opacity:.075!important;
  z-index:0!important;
}
.student-print-preview > *:not(.student-print-watermark){
  position:relative!important;
  z-index:2!important;
}
</style>
</head>
<body>
${reportHTML}
<script>
(function(){
  const images=Array.from(document.images);
  let remaining=images.length;
  const done=()=>{
    setTimeout(function(){
      window.focus();
      window.print();
    },150);
  };
  if(!remaining){done();return;}
  const one=()=>{remaining--;if(remaining<=0)done();};
  images.forEach(function(img){
    if(img.complete)one();
    else{
      img.addEventListener("load",one,{once:true});
      img.addEventListener("error",one,{once:true});
    }
  });
  setTimeout(done,2500);
  window.addEventListener("afterprint",function(){
    setTimeout(function(){window.close();},500);
  });
})();
<\/script>
</body>
</html>`);
      printWindow.document.close();
    });
  };

  render();
}


/* ============================================================
 * RESULTS & MARKS — STABLE STUDENT PHOTO BRIDGE
 * ============================================================
 * Results must use the persistent Student ID for selection/photo identity.
 * d.students is periodically rebuilt from Google Sheets every 30 seconds and
 * its browser-only local `id` can change. A valid photo is cached by Student ID
 * so a temporary/incomplete refresh can never replace it with the camera icon.
 */
const afisapResultsPhotoCache=new Map();

function afisapResultsStudentPersistentId(student){
  return String(
    student&&(
      student.sid||student.studentId||student['Student ID']||
      student.admissionNumber||student['Admission Number']||student.id||''
    )
  ).trim();
}

function afisapResultsFindStudent(value){
  const wanted=String(value||'').trim();
  if(!wanted) return null;
  return (d.students||[]).find(student=>{
    const ids=[
      student&&student.sid,
      student&&student.studentId,
      student&&student['Student ID'],
      student&&student.admissionNumber,
      student&&student['Admission Number'],
      student&&student.id
    ].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=='').map(v=>String(v).trim());
    return ids.includes(wanted);
  })||null;
}

function afisapResultsPhotoSource(student){
  if(!student) return '';
  const studentId=afisapResultsStudentPersistentId(student);

  // Use the same permanent-photo normalization already used by Student
  // Management/reporting. Prefer a confirmed current source.
  const current=typeof afisapPermanentPhotoRenderSrc==='function'
    ? String(afisapPermanentPhotoRenderSrc(student)||'').trim()
    : String(student.photo||student.passportPhotoUrl||'').trim();

  if(current && /^(?:data:image\/|blob:|https?:\/\/)/i.test(current)){
    if(studentId) afisapResultsPhotoCache.set(studentId,current);
    return current;
  }

  // A temporary empty photo value from a 30-second cloud refresh must not
  // erase a photograph that was already confirmed for this Student ID.
  return studentId && afisapResultsPhotoCache.has(studentId)
    ? afisapResultsPhotoCache.get(studentId)
    : '';
}

async function afisapResultsHydrateSelectedPhoto(studentId){
  const wanted=String(studentId||'').trim();
  const student=afisapResultsFindStudent(wanted);
  if(!student) return;

  // If the record has a Drive File ID, retrieve through the existing Drive
  // bridge. No upload and no duplicate photo is created.
  try{
    if(typeof afisapHydratePermanentPhoto==='function'){
      await afisapHydratePermanentPhoto(student);
    }
  }catch(error){
    console.warn('AFISAP Results photo hydration unavailable:',wanted,error);
  }

  const src=afisapResultsPhotoSource(student);
  if(!src) return;

  // Update only if Results is still showing the same persistent Student ID.
  const select=document.getElementById('rs');
  const box=document.getElementById('resultStudentPhoto');
  if(!select||!box||String(select.value)!==wanted) return;
  const name=student.name||[student.firstName,student.middleName,student.surname].filter(Boolean).join(' ');
  box.innerHTML=`<img src='${src.replace(/'/g,"&#39;")}' alt='${esc(name)}'>`;
}

function results(){
  const previouslySelected=String(window.afisapResultsSelectedStudentId||'').trim();
  const studentOptions=d.students.map(s=>{
    const stableId=afisapResultsStudentPersistentId(s);
    const selected=previouslySelected && stableId===previouslySelected ? ' selected' : '';
    return `<option value='${esc(stableId)}'${selected}>${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))} — ${esc(s.class)}</option>`;
  }).join('');
  const subjectOptions=d.subjects.map(s=>`<option value='${esc(s)}'>${esc(s)}</option>`).join('');

  $('#app').innerHTML=`
    <div class='panel'>
      <div class='result-student-card'>
        <div id='resultStudentPhoto' class='result-student-photo'>
          <span>📷</span>
        </div>
        <div class='result-student-info'>
          <span class='result-label'>SELECT STUDENT</span>
          <select id='rs'>${studentOptions || "<option value=''>No students yet</option>"}</select>
          <div id='resultStudentMeta' class='result-meta'>Choose a student to display the passport photo and details.</div>
        </div>
      </div>

      <div class='form' style='margin-top:18px'>
        <label>Subject
          <select id='sub'>
            ${subjectOptions}
            <option value='__OTHER__'>Other</option>
          </select>
        </label>

        <label id='otherSubjectWrap' style='display:none'>Other Subject
          <input id='otherSubject' type='text' placeholder='Type the subject name'>
        </label>

        <label>Class Score (0–50)
          <input id='cs' type='number' min='0' max='50'>
        </label>
        <label>Exam Score (0–50)
          <input id='es' type='number' min='0' max='50'>
        </label>

        <label>Position
          <input id='pos' type='text' readonly value='' placeholder='Calculated automatically'>
        </label>

        <label>Remarks
          <input id='rem' type='text' placeholder='Enter subject remark'>
        </label>
      </div>

      <button class='primary' onclick='addResult()' style='margin-top:15px'>Save Result</button>
    </div>

    <div class='table' style='margin-top:18px'>
      <table>
        <tr><th>Photo</th><th>Student</th><th>Subject</th><th>Class</th><th>Exam</th><th>Total</th><th>Position</th><th>Remarks</th><th></th></tr>
        ${d.results.map(r=>{
          const resultStudentId=String(r.studentSid||r['Student ID']||r.studentId||'').trim();
          let s=afisapResultsFindStudent(resultStudentId);
          const src=afisapResultsPhotoSource(s);
          return `<tr>
            <td>${src?`<img class='result-thumb' src='${src.replace(/'/g,"&#39;")}' alt='${esc(s?.name||"Student")}'>`:'<span class="result-no-photo">—</span>'}</td>
            <td>${esc(s?.name || r.studentName || [s?.firstName,s?.middleName,s?.surname].filter(Boolean).join(' '))}</td>
            <td>${esc(r.subject)}</td><td>${r.cs}</td><td>${r.es}</td>
            <td><b>${r.cs+r.es}</b></td>
            <td>${esc(r.position||'')}</td>
            <td>${esc(r.remarks||'')}</td>
            <td><button class='danger' onclick='del("results","${r.id}")'>Delete</button></td>
          </tr>`;
        }).join('')||'<tr><td colspan=9 class=empty>No results yet.</td></tr>'}
      </table>
    </div>`;

  // If the previous Student ID is no longer present, use the current option.
  if($('#rs') && !$('#rs').value && $('#rs').options.length){
    $('#rs').selectedIndex=0;
  }

  function refreshResultStudent(){
    const selectedId=String($('#rs')?.value||'').trim();
    window.afisapResultsSelectedStudentId=selectedId;
    const s=afisapResultsFindStudent(selectedId);
    const box=$('#resultStudentPhoto'), meta=$('#resultStudentMeta');
    if(!s){
      box.innerHTML='<span>📷</span>';
      meta.textContent='Choose a student to display the passport photo and details.';
      return;
    }

    const src=afisapResultsPhotoSource(s);
    if(src){
      box.innerHTML=`<img src='${src.replace(/'/g,"&#39;")}' alt='${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}'>`;
    }else{
      // Do not decide "no photo" until the existing Drive reference has had
      // a chance to resolve. The camera icon is only the final no-photo state.
      box.innerHTML='<span class="result-photo-loading" aria-label="Loading student photograph">…</span>';
    }

    const roster=afisapClassRosterInfo(s);
    const currentTerm=String((d.settings&&d.settings.term)||"").trim();
    const currentYear=String((d.settings&&d.settings.academicYear)||d.school?.year||"").trim();
    const academicPosition=afisapAcademicPositionInfo(s,currentTerm,currentYear);
    meta.innerHTML=`<strong>${esc((s.name || [s.firstName,s.middleName,s.surname].filter(Boolean).join(' ')))}</strong><span>${esc(s.sid||s.studentId||'')} • ${esc(s.class||'')} • ${esc(s.gender||'')}</span><span><b>Roll No.:</b> ${esc(roster.rollNo||'—')} &nbsp; • &nbsp; <b>No. on Roll:</b> ${esc(roster.noOnRoll)} &nbsp; • &nbsp; <b>Position:</b> ${esc(academicPosition.ordinal||'—')}</span>`;
    const pos=document.getElementById("pos");
    if(pos) pos.value=academicPosition.ordinal||"";

    // Resolve from the existing permanent Drive reference asynchronously.
    // If it fails and no cached/confirmed photo exists, only then show camera.
    afisapResultsHydrateSelectedPhoto(selectedId).then(()=>{
      const current=afisapResultsFindStudent(selectedId);
      const resolved=afisapResultsPhotoSource(current);
      const currentBox=document.getElementById('resultStudentPhoto');
      const currentSelect=document.getElementById('rs');
      if(!currentBox||!currentSelect||String(currentSelect.value)!==selectedId) return;
      if(!resolved){
        currentBox.innerHTML='<span>📷</span>';
      }
    });
  }

  $('#rs')?.addEventListener('change',refreshResultStudent);
  $('#sub')?.addEventListener('change',()=>{
    $('#otherSubjectWrap').style.display=$('#sub').value==='__OTHER__'?'block':'none';
    if($('#sub').value!=='__OTHER__') $('#otherSubject').value='';
  });
  refreshResultStudent();
}

window.addResult=async()=>{
  let cs=+$('#cs').value,es=+$('#es').value;
  const localStudent=afisapResultsFindStudent(String($('#rs').value||'').trim());
  if(!localStudent)return alert('Please select a student.');
  if(!Number.isFinite(cs)||!Number.isFinite(es)||cs<0||cs>50||es<0||es>50)return alert('Scores must be between 0 and 50.');

  let subject=$('#sub').value;
  if(subject==='__OTHER__'){
    subject=String($('#otherSubject').value||'').trim();
    if(!subject)return alert('Please type the subject name.');
  }

  const remarks=String($('#rem').value||'').trim();
  // Results & Marks uses the central school settings. Keep d.school as the
  // authoritative fallback because this build does not always have d.settings.
  const academicYear=String((d.settings&&d.settings.academicYear)||d.school?.year||"").trim();
  const term=String((d.settings&&d.settings.term)||d.school?.term||"").trim();
  if(!academicYear||!term){
    alert("Academic Year and Term are required. Please set them in School Setup before saving results.");
    return;
  }
  const resultId=String(Date.now());
  const total=cs+es,now=new Date().toISOString();

  // Persist a new custom subject centrally before using it in a Result record.
  if(!d.subjects.includes(subject)){
    const nextSubjects=[...(d.subjects||[]),subject];
    const cfg=await afisapSecurePost({
      action:"configSet",
      config:JSON.stringify({school:d.school||{},subjects:nextSubjects})
    },{includeAuth:true}).catch(e=>({success:false,error:e.message}));
    if(!cfg?.success){
      alert("The custom subject was not saved centrally, so the result was not created."+(cfg?.error?"\n\nReason: "+cfg.error:""));
      return;
    }
    d.subjects=nextSubjects;
  }

  const resolvedStudentName=await afisapResolveStudentName(localStudent);
  if(!resolvedStudentName){
    alert("The student's name could not be resolved. Nothing was saved.");
    return;
  }

  const className=String(localStudent.class||localStudent.className||"");
  const cloudRecord={
    "Result ID":resultId,
    "Student ID":String(localStudent.sid||localStudent.studentId||localStudent.id||""),
    "Student Name":resolvedStudentName,
    "Subject":subject,"Class":className,
    "Class Score":cs,"Exam Score":es,"Total Marks":total,"Position":"",
    "Remarks":remarks,"Academic Year":academicYear,"Term":term,
    "Date Created":now,"Last Updated":now
  };

  const saveButton=document.querySelector("button[onclick='addResult()']");
  try{
    if(saveButton){
      saveButton.disabled=true;
      saveButton.setAttribute("aria-busy","true");
      saveButton.dataset.originalText=saveButton.textContent;
      saveButton.innerHTML='<span class="afisap-result-save-spinner" aria-hidden="true"></span> Saving Result...';
    }
    afisapShowUploadLoader("Saving Result","Writing the result to Google Sheets...",25);

    afisapUpdateUploadLoader("Saving and calculating positions...",55);
    // One server request now performs both the official Results write and
    // academic-position synchronization. This replaces the old create +
    // recalculate + full-school-sync sequence.
    const result=await afisapCloudPost({action:"saveResult",data:cloudRecord});
    if(!result?.success){
      if(result?.saved){
        throw new Error("The result was saved, but academic position synchronization was incomplete. "+String(result?.error||"Position recalculation failed."));
      }
      throw new Error("Result was not saved to Google Sheets."+(result?.error?" Reason: "+result.error:""));
    }

    afisapUpdateUploadLoader("Updating the screen...",90);

    // Reconcile only the local Results collection from the authoritative
    // server response. Avoid the old 10-sheet full synchronization here.
    const savedRecord=result.record||cloudRecord;
    const savedId=String(savedRecord["Result ID"]||resultId);
    const localRecord={
      id:savedId,
      studentId:String(savedRecord["Student ID"]||cloudRecord["Student ID"]),
      studentName:String(savedRecord["Student Name"]||cloudRecord["Student Name"]),
      subject:String(savedRecord["Subject"]||subject),
      className:String(savedRecord["Class"]||className),
      cs:Number(savedRecord["Class Score"]??cs),
      es:Number(savedRecord["Exam Score"]??es),
      totalMarks:Number(savedRecord["Total Marks"]??total),
      position:"",
      remarks:String(savedRecord["Remarks"]??remarks),
      academicYear:String(savedRecord["Academic Year"]??academicYear),
      term:String(savedRecord["Term"]??term)
    };
    const existingIndex=(d.results||[]).findIndex(r=>String(r.id||r.resultId||r["Result ID"]||"")===savedId);
    if(existingIndex>=0)d.results[existingIndex]=Object.assign({},d.results[existingIndex],localRecord);
    else d.results.push(localRecord);

    // The optimized backend returns the authoritative positions for the
    // affected class/period. Apply them locally without another cloud read.
    if(result.positions&&typeof result.positions==="object"){
      const positionMap=result.positions;
      (d.results||[]).forEach(r=>{
        const rid=String(r.studentId||r["Student ID"]||"").trim();
        const rclass=String(r.className||r.class||r["Class"]||"").trim().toLowerCase();
        const ry=String(r.academicYear||r["Academic Year"]||"").trim();
        const rt=String(r.term||r["Term"]||"").trim();
        if(rclass===className.toLowerCase()&&(!ry||ry===academicYear)&&(!rt||rt===term)&&positionMap[rid]!==undefined){
          r.position=positionMap[rid]||"";
        }
      });
    }
    persist();
    afisapUpdateUploadLoader("Result saved successfully.",100);
    await new Promise(resolve=>setTimeout(resolve,250));
    afisapHideUploadLoader();
    render();
  }catch(error){
    afisapHideUploadLoader();
    alert(String(error?.message||error));
    render();
  }finally{
    if(saveButton){
      saveButton.disabled=false;
      saveButton.removeAttribute("aria-busy");
      saveButton.textContent=saveButton.dataset.originalText||"Save Result";
      delete saveButton.dataset.originalText;
    }
  }
}

function afisapStudentKey(s){
  if(!s) return "";
  const candidates=[s.id,s.sid,s.studentId,s["Student ID"],s.indexNumber,s["Index Number"]];
  for(const v of candidates){
    if(v!==undefined && v!==null && String(v).trim()!=="") return String(v).trim();
  }
  // Last-resort deterministic key for legacy records that have no ID field.
  const name=String(s.name||[s.firstName,s.middleName,s.surname,s.otherName].filter(Boolean).join(" ")||"").trim().toLowerCase();
  const cls=String(s.class||s.className||"").trim().toLowerCase();
  return name+"|"+cls;
}


function afisapOrdinalPosition(value){
  const n=Number(value);
  if(!Number.isFinite(n) || n<=0) return "";
  const mod100=n%100;
  const suffix=(mod100>=11 && mod100<=13)?"th":({1:"st",2:"nd",3:"rd"}[n%10]||"th");
  return String(n)+suffix;
}

function afisapResultTotalValue(r){
  if(!r) return 0;
  const explicit=(r.totalMarks!==undefined && r.totalMarks!==null && String(r.totalMarks).trim()!=="")
    ? Number(r.totalMarks) : NaN;
  if(Number.isFinite(explicit)) return explicit;
  return (Number(r.cs??r.classScore??r["Class Score"]??0)||0)
       + (Number(r.es??r.examScore??r["Exam Score"]??0)||0);
}

function afisapResultMatchesAcademicPeriod(r,term,year){
  const rt=String(r?.term||r?.Term||"").trim();
  const ry=String(r?.academicYear||r?.["Academic Year"]||r?.year||"").trim();
  const wantedTerm=String(term||"").trim();
  const wantedYear=String(year||"").trim();

  // Preserve compatibility with older AFISAP result rows that pre-date
  // period fields, while keeping all newly saved results period-specific.
  return (!rt || !wantedTerm || rt===wantedTerm) &&
         (!ry || !wantedYear || ry===wantedYear);
}

function afisapAcademicRankMap(className,term,year){
  const cls=String(className||"").trim();
  const students=(d.students||[]).filter(s=>
    String(s.class||s.className||"").trim()===cls
  );

  const summaries=students.map(s=>{
    const key=afisapStudentKey(s);
    const rs=(d.results||[]).filter(r=>
      String(r.studentId||"").trim()===key &&
      afisapResultMatchesAcademicPeriod(r,term,year)
    );
    return {
      key,
      total:rs.reduce((sum,r)=>sum+afisapResultTotalValue(r),0),
      hasResults:rs.length>0
    };
  }).filter(x=>x.hasResults)
    .sort((a,b)=>b.total-a.total);

  const map=new Map();
  let previousTotal=null;
  let previousRank=0;

  // Competition ranking: 450,450,440 => 1st,1st,3rd.
  summaries.forEach((x,index)=>{
    if(previousTotal===null || x.total!==previousTotal) previousRank=index+1;
    map.set(x.key,{
      rank:previousRank,
      ordinal:afisapOrdinalPosition(previousRank),
      total:x.total
    });
    previousTotal=x.total;
  });
  return map;
}

function afisapAcademicPositionInfo(student,term,year){
  if(!student) return {rank:"",ordinal:"",total:0};
  const cls=String(student.class||student.className||"").trim();
  return afisapAcademicRankMap(cls,term,year).get(afisapStudentKey(student))||
    {rank:"",ordinal:"",total:0};
}

function afisapApplyAcademicPositionsLocally(className,term,year){
  const cls=String(className||"").trim();
  const rankMap=afisapAcademicRankMap(cls,term,year);
  const studentsByKey=new Map(
    (d.students||[])
      .filter(s=>String(s.class||s.className||"").trim()===cls)
      .map(s=>[afisapStudentKey(s),s])
  );

  const changed=[];
  (d.results||[]).forEach(r=>{
    const key=String(r.studentId||"").trim();
    if(!studentsByKey.has(key) || !afisapResultMatchesAcademicPeriod(r,term,year)) return;
    const next=rankMap.get(key)?.ordinal||"";
    if(String(r.position||"")!==next){
      r.position=next;
      changed.push(r);
    }
  });
  return changed;
}

async function afisapRecalculateAcademicPositions(className,term,year,syncCloud){
  if(syncCloud){
    const result=await afisapCloudPost({action:"recalculatePositions",className,academicYear:year,term});
    await afisapSyncAllFromCloud().catch(()=>{});
    if(!result?.success)throw new Error(result?.error||"Position recalculation was not completed.");
    return result;
  }
  return afisapApplyAcademicPositionsLocally(className,term,year);
}

function afisapRecalculateAllAcademicPositionsLocally(){
  const periods=new Set();
  (d.results||[]).forEach(r=>{
    const student=(d.students||[]).find(s=>afisapStudentKey(s)===String(r.studentId||"").trim());
    if(!student) return;
    const cls=String(student.class||student.className||"").trim();
    const term=String(r.term||r.Term||"").trim();
    const year=String(r.academicYear||r["Academic Year"]||r.year||"").trim();
    periods.add(JSON.stringify([cls,term,year]));
  });
  periods.forEach(item=>{
    const [cls,term,year]=JSON.parse(item);
    afisapApplyAcademicPositionsLocally(cls,term,year);
  });
}

function reports(){
  const classes=[...new Set((d.students||[]).map(s=>s.class).filter(Boolean))];
  const years=[...new Set((d.results||[]).map(r=>r.academicYear||r.year).filter(Boolean))];
  const selectedYear=years[0]||d.school?.year||'';

  $('#app').innerHTML=`
    <div class='panel'>
      <div class='panel-title'>
        <div><h3>Academic Reports</h3><span>Generate individual student reports, bulk report cards, or complete class results.</span></div>
      </div>

      <div class='report-mode-tabs' role='tablist' aria-label='Academic report type'>
        <button id='studentReportTab' class='primary' type='button'>Individual Report Card</button>
        <button id='bulkReportTab' class='secondary' type='button'>Bulk Report Cards</button>
        <button id='classResultsTab' class='secondary' type='button'>Class Results</button>
      </div>

      <div class='panel' style='margin-top:16px;padding:16px'>
        <div class='panel-title' style='margin-bottom:10px'>
          <div><h3 style='margin:0'>Report Card Dates</h3><span>Set these once for each Academic Year and Term. They will appear on every report card for that period.</span></div>
        </div>
        <div class='form'>
          <label>Academic Year
            <input id='reportDatesYear' value='${esc(selectedYear)}' placeholder='e.g. 2025/2026'>
          </label>
          <label>Term
            <select id='reportDatesTerm'>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </label>
          <label>Vacation Date
            <input id='reportVacationDate' type='date'>
          </label>
          <label>Opening Date
            <input id='reportOpeningDate' type='date'>
          </label>
        </div>
        <div id='reportDatesStatus' class='report-help-text' style='margin-top:8px'></div>
        <button class='primary' id='saveReportCardDates' type='button' style='margin-top:10px'>Save Report Card Dates</button>
      </div>

      <div id='studentReportPanel' style='margin-top:16px'>
        <div class='form'>
          <label>Student
            <select id='repStu'>
              ${(d.students||[]).map(s=>`<option value='${esc(afisapStudentKey(s))}'>${esc((s.name||[s.firstName,s.middleName,s.surname,s.otherName].filter(Boolean).join(' ')))} — ${esc(s.class||s.className||'')}</option>`).join('')||"<option value=''>No students yet</option>"}
            </select>
          </label>
          <label>Term
            <select id='repTerm'>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </label>
          <label>Academic Year
            <input id='repYear' value='${esc(selectedYear)}' placeholder='e.g. 2026/2027'>
          </label>
        </div>
        <button class='primary' onclick='makeReport()' style='margin-top:15px'>Preview / Print Report</button>
      </div>

      <div id='bulkReportPanel' style='display:none;margin-top:16px'>
        <div class='report-help-text'>
          Select <b>All Students</b>, an entire class, or individual students. The system generates each student's existing report-card design as a separate page in one combined print document.
        </div>
        <div class='form' style='margin-top:12px'>
          <label>Academic Year
            <input id='bulkReportYear' value='${esc(selectedYear)}' placeholder='e.g. 2026/2027'>
          </label>
          <label>Term
            <select id='bulkReportTerm'>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </label>
          <label>Class Filter
            <select id='bulkReportClass'>
              <option value=''>All Classes / All Students</option>
              ${classes.map(c=>`<option value='${esc(c)}'>${esc(c)}</option>`).join('')}
            </select>
          </label>
        </div>

        <div class='bulk-report-toolbar' style='margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center'>
          <button class='secondary' id='bulkSelectAll' type='button'>Select All</button>
          <button class='secondary' id='bulkClearAll' type='button'>Clear All</button>
          <span id='bulkReportCount' class='report-help-text' style='margin:0;padding:8px 12px'>0 students selected</span>
        </div>

        <div id='bulkStudentList' class='bulk-student-list' style='margin-top:12px'></div>

        <div class='bulk-report-actions' style='margin-top:15px;display:flex;gap:10px;flex-wrap:wrap'>
          <button class='primary' id='bulkPreviewReports' type='button'>Preview Selected Reports</button>
          <button class='primary' id='bulkPrintReports' type='button'>Print Selected Reports</button>
          <button class='secondary' id='bulkPrintClassReports' type='button'>Print Entire Selected Class</button>
        </div>
      </div>

      <div id='classResultsPanel' style='display:none;margin-top:16px'>
        <div class='form'>
          <label>Class
            <select id='classResultsClass'>
              <option value=''>Select Class</option>
              ${classes.map(c=>`<option value='${esc(c)}'>${esc(c)}</option>`).join('')}
            </select>
          </label>
          <label>Term
            <select id='classResultsTerm'>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </label>
          <label>Academic Year
            <input id='classResultsYear' value='${esc(selectedYear)}' placeholder='e.g. 2026/2027'>
          </label>
        </div>
        <div class='report-help-text'>Select a class and term to generate a printable performance summary from the saved Results records.</div>
        <button class='primary' id='generateClassResults' type='button' style='margin-top:15px'>Generate / Print Class Results</button>
      </div>
    </div>
    <div id='report' class='report' style='display:none'></div>
    <div id='bulkReport' class='report bulk-report-document' style='display:none'></div>
    <div id='classResultsReport' class='report' style='display:none'></div>`;

  const setTab=(which)=>{
    const individual=which==='individual', bulk=which==='bulk';
    $('#studentReportPanel').style.display=individual?'block':'none';
    $('#bulkReportPanel').style.display=bulk?'block':'none';
    $('#classResultsPanel').style.display=(!individual&&!bulk)?'block':'none';
    $('#studentReportTab').className=individual?'primary':'secondary';
    $('#bulkReportTab').className=bulk?'primary':'secondary';
    $('#classResultsTab').className=(!individual&&!bulk)?'primary':'secondary';
    if(which!=='individual') $('#report').style.display='none';
    if(which!=='bulk') $('#bulkReport').style.display='none';
    if(which!=='class') $('#classResultsReport').style.display='none';
  };

  $('#studentReportTab').addEventListener('click',()=>setTab('individual'));
  $('#bulkReportTab').addEventListener('click',()=>setTab('bulk'));
  $('#classResultsTab').addEventListener('click',()=>setTab('class'));

  const refreshReportDateFields=()=>{
    const year=String($('#reportDatesYear')?.value||'').trim();
    const term=String($('#reportDatesTerm')?.value||'').trim();
    const dates=afisapGetReportCardDates(year,term);
    if($('#reportVacationDate')) $('#reportVacationDate').value=/^\d{4}-\d{2}-\d{2}$/.test(dates.vacationDate)?dates.vacationDate:'';
    if($('#reportOpeningDate')) $('#reportOpeningDate').value=/^\d{4}-\d{2}-\d{2}$/.test(dates.openingDate)?dates.openingDate:'';
    const status=$('#reportDatesStatus');
    if(status){
      const vacation=afisapFormatReportCardDate(dates.vacationDate)||'Not set';
      const opening=afisapFormatReportCardDate(dates.openingDate)||'Not set';
      status.textContent=`Saved for ${year||'—'} / ${afisapNormalizeReportTerm(term)||'—'}: Vacation ${vacation} • Opening ${opening}`;
    }
  };

  $('#reportDatesYear')?.addEventListener('change',refreshReportDateFields);
  $('#reportDatesYear')?.addEventListener('blur',refreshReportDateFields);
  $('#reportDatesTerm')?.addEventListener('change',refreshReportDateFields);

  $('#saveReportCardDates')?.addEventListener('click',async()=>{
    const year=String($('#reportDatesYear')?.value||'').trim();
    const term=afisapNormalizeReportTerm($('#reportDatesTerm')?.value||'');
    const vacationDate=String($('#reportVacationDate')?.value||'').trim();
    const openingDate=String($('#reportOpeningDate')?.value||'').trim();

    if(!year){alert('Please enter the Academic Year.');return;}
    if(!term){alert('Please select the Term.');return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(vacationDate)){alert('Please select a valid Vacation Date.');return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(openingDate)){alert('Please select a valid Opening Date.');return;}

    const button=$('#saveReportCardDates');
    const status=$('#reportDatesStatus');
    if(button){button.disabled=true;button.textContent='Saving...';}
    if(status) status.textContent='Saving Report Card Dates to Google Sheets...';
    afisapShowUploadLoader("Saving Report Card Dates","Saving vacation and opening dates to Google Sheets...",15);

    try{
      afisapUpdateUploadLoader("Updating the official Academic Settings sheet...",55);
      const result=await afisapSaveReportCardDatesToCloud(year,term,vacationDate,openingDate);
      if(!result || result.success!==true){
        throw new Error(result?.error||'Google Sheets did not confirm the save.');
      }

      d.reportCardDates=d.reportCardDates||{};
      d.reportCardDates[afisapReportCardDateKey(year,term)]={
        settingId:afisapReportCardDateSettingId(year,term),
        academicYear:year,
        term,
        vacationDate,
        openingDate,
        lastUpdated:new Date().toISOString()
      };
      save();
      refreshReportDateFields();
      afisapUpdateUploadLoader("Report Card Dates saved successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,220));
      afisapHideUploadLoader();
      alert('Report Card Dates saved successfully for '+year+' / '+term+'.');
    }catch(error){
      console.error('AFISAP Report Card Dates save failed:',error);
      if(status) status.textContent='Report Card Dates were not saved. '+(error?.message||'Cloud request failed.');
      afisapUpdateUploadLoader("Report Card Dates could not be saved.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert('Report Card Dates were not saved to Google Sheets.\n\nReason: '+(error?.message||'Cloud request failed.'));
    }finally{
      if(button){button.disabled=false;button.textContent='Save Report Card Dates';}
    }
  });

  // Default the date-setting term to the school's current term when available.
  const currentSchoolTerm=afisapNormalizeReportTerm(d.school?.term||'');
  if(currentSchoolTerm && $('#reportDatesTerm')) $('#reportDatesTerm').value=currentSchoolTerm;
  refreshReportDateFields();

  const studentName=(s)=>String(s.name||[s.firstName,s.middleName,s.surname,s.otherName].filter(Boolean).join(' ')||s.fullName||'Unnamed Student').trim();

  const renderBulkStudents=()=>{
    const cls=String($('#bulkReportClass')?.value||'').trim();
    const students=(d.students||[]).filter(s=>!cls||String(s.class||s.className||'').trim()===cls);
    const list=$('#bulkStudentList');
    if(!list) return;
    list.innerHTML=students.length ? students.map(s=>{
      const bulkIndex=(d.students||[]).indexOf(s);
      return `
      <label class='bulk-student-row'>
        <input type='checkbox' class='bulk-student-check' data-student-index='${bulkIndex}' value='${esc(afisapStudentKey(s))}'>
        <span><b>${esc(studentName(s))}</b><small>${esc(s.sid||s.studentId||s["Student ID"]||s.id||'')} · ${esc(s.class||s.className||'')}</small></span>
      </label>`;
    }).join('') : `<div class='empty'>No students found for the selected class.</div>`;
    list.querySelectorAll('.bulk-student-check').forEach(cb=>cb.addEventListener('change',updateBulkCount));
    updateBulkCount();
  };

  const updateBulkCount=()=>{
    const count=document.querySelectorAll('.bulk-student-check:checked').length;
    const total=document.querySelectorAll('.bulk-student-check').length;
    const el=$('#bulkReportCount');
    if(el) el.textContent=`${count} of ${total} students selected`;
  };

  const selectedBulkStudents=()=>{
    const checked=[...document.querySelectorAll('#bulkStudentList .bulk-student-check:checked')];
    if(!checked.length) return [];

    // Primary path: each checkbox points directly to the same student record
    // in d.students that was used to render the Bulk Report list.
    const selected=[];
    const seen=new Set();
    checked.forEach(cb=>{
      const index=Number(cb.dataset.studentIndex);
      if(Number.isInteger(index) && index>=0 && index<(d.students||[]).length){
        const student=d.students[index];
        if(student && !seen.has(student)){
          seen.add(student);
          selected.push(student);
        }
      }
    });

    if(selected.length===checked.length) return selected;

    // Compatibility fallback for any legacy checkbox already present in the DOM.
    const ids=new Set(checked.map(cb=>String(cb.value||'').trim()).filter(Boolean));
    (d.students||[]).forEach(s=>{
      if(seen.has(s)) return;
      const candidates=[
        afisapStudentKey(s),s.id,s.sid,s.studentId,s["Student ID"],
        s.indexNumber,s["Index Number"]
      ].map(v=>String(v||'').trim()).filter(Boolean);
      if(candidates.some(v=>ids.has(v))){
        seen.add(s);
        selected.push(s);
      }
    });
    return selected;
  };

  const buildBulkDocument=(students)=>{
    const term=String($('#bulkReportTerm')?.value||'Term 1').trim();
    const year=String($('#bulkReportYear')?.value||d.school?.year||'').trim();
    if(!students.length){alert('Please select at least one student.');return false;}
    const html=students.map(s=>buildStudentReportCardHTML(s,term,year)).join("<div class='bulk-report-page-break'></div>");
    $('#bulkReport').innerHTML=html;
    $('#bulkReport').style.display='block';
    $('#report').style.display='none';
    $('#classResultsReport').style.display='none';
    return true;
  };

  const previewBulk=()=>{
    const students=selectedBulkStudents();
    if(!buildBulkDocument(students)) return;
    setTimeout(()=>document.getElementById('bulkReport')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
  };

  const printBulk=()=>{
    const students=selectedBulkStudents();
    if(!buildBulkDocument(students)) return;

    // Keep the native Print command inside the original button click.
    // Some browsers suppress/delay window.print() when it is launched later
    // from a timer. The report is already fully built synchronously above,
    // so force layout once and open Print Preview immediately.
    document.body.classList.add('printing-bulk-report-cards');
    const cleanup=()=>document.body.classList.remove('printing-bulk-report-cards');
    window.addEventListener('afterprint',cleanup,{once:true});

    const bulkReport=document.getElementById('bulkReport');
    if(bulkReport){
      bulkReport.style.display='block';
      // Force the browser to finish laying out all student pages before print.
      void bulkReport.offsetHeight;
    }

    try{
      window.focus();
      window.print();
    }catch(error){
      cleanup();
      console.error('AFISAP bulk report printing failed:',error);
      alert('Unable to open the browser Print Preview. Please try again.');
    }
  };

  $('#bulkReportClass').addEventListener('change',renderBulkStudents);
  $('#bulkSelectAll').addEventListener('click',()=>{
    document.querySelectorAll('.bulk-student-check').forEach(cb=>cb.checked=true);
    updateBulkCount();
  });
  $('#bulkClearAll').addEventListener('click',()=>{
    document.querySelectorAll('.bulk-student-check').forEach(cb=>cb.checked=false);
    updateBulkCount();
  });
  $('#bulkPreviewReports').addEventListener('click',previewBulk);
  $('#bulkPrintReports').addEventListener('click',printBulk);
  $('#bulkPrintClassReports').addEventListener('click',()=>{
    const cls=String($('#bulkReportClass')?.value||'').trim();
    if(!cls){alert('Please select a class first.');return;}
    document.querySelectorAll('.bulk-student-check').forEach(cb=>cb.checked=true);
    updateBulkCount();
    printBulk();
  });

  renderBulkStudents();
  $('#generateClassResults').addEventListener('click',window.generateClassResults);
}

window.generateClassResults=()=>{
  const cls=String($('#classResultsClass')?.value||'').trim();
  const term=String($('#classResultsTerm')?.value||'').trim();
  const year=String($('#classResultsYear')?.value||'').trim();

  if(!cls){alert('Please select a class.');return;}

  const students=(d.students||[]).filter(s=>String(s.class||'').trim()===cls);
  if(!students.length){alert('No students found in the selected class.');return;}

  const studentById=new Map(students.map(s=>[afisapStudentKey(s),s]));
  const results=(d.results||[]).filter(r=>{
    if(!studentById.has(String(r.studentId).trim())) return false;
    const rt=String(r.term||r.Term||'').trim();
    const ry=String(r.academicYear||r['Academic Year']||r.year||'').trim();
    return (!rt || rt===term) && (!year || !ry || ry===year);
  });

  if(!results.length){
    alert('No results have been recorded for this class for the selected term/year.');
    return;
  }

  const studentName=(s)=>{
    return String(s.name||[s.firstName,s.middleName,s.surname,s.otherName].filter(Boolean).join(' ')||s.fullName||'').trim();
  };
  const score=(r,keys)=>{
    for(const k of keys){
      if(r[k]!==undefined && r[k]!==null && String(r[k]).trim()!=='') return Number(r[k])||0;
    }
    return 0;
  };
  const grade=(v)=>v>=80?'A':v>=70?'B':v>=60?'C':v>=50?'D':v>=40?'E':'F';
  const remark=(v)=>v>=80?'Excellent':v>=70?'Very Good':v>=60?'Good':v>=50?'Credit':v>=40?'Pass':'Needs Improvement';

  const grouped=new Map();
  students.forEach(s=>grouped.set(String(s.id),[]));
  results.forEach(r=>{
    const key=String(r.studentId).trim();
    if(grouped.has(key)) grouped.get(key).push(r);
  });

  const summaries=students.map(s=>{
    const rs=grouped.get(String(s.id))||[];
    const total=rs.reduce((sum,r)=>{
      const explicit=(r.totalMarks!==undefined&&r.totalMarks!=='')?Number(r.totalMarks):NaN;
      return sum+(Number.isFinite(explicit)?explicit:score(r,['cs','classScore','Class Score'])+score(r,['es','examScore','Exam Score']));
    },0);
    const subjects=rs.length;
    const average=subjects?total/subjects:0;
    return {s,rs,total,subjects,average};
  }).sort((a,b)=>b.total-a.total);

  let previousTotal=null, previousRank=0;
  summaries.forEach((x,i)=>{
    if(x.total!==previousTotal) previousRank=i+1;
    x.rank=x.total?previousRank:'';
    previousTotal=x.total;
  });

  const rows=summaries.map(x=>{
    const subjectScores=x.rs.map(r=>{
      const subject=r.subject||r.Subject||'';
      const total=(r.totalMarks!==undefined&&r.totalMarks!=='')?Number(r.totalMarks)||0:
        score(r,['cs','classScore','Class Score'])+score(r,['es','examScore','Exam Score']);
      return `${esc(subject)}: ${esc(total)}`;
    }).join('<br>')||'—';

    const roster=afisapClassRosterInfo(x.s);
    return `<tr>
      <td>${esc(x.rank||'—')}</td>
      <td>${esc(studentName(x.s))}<br><small>Roll No.: ${esc(roster.rollNo||'—')} · No. on Roll: ${esc(roster.noOnRoll)}</small></td>
      <td>${esc(x.s.sid||x.s.studentId||x.s.id||'')}</td>
      <td>${subjectScores}</td>
      <td>${esc(x.total)}</td>
      <td>${esc(x.average.toFixed(1))}</td>
      <td>${esc(x.rank?grade(x.average):'')}</td>
      <td>${esc(x.rank?remark(x.average):'No result')}</td>
    </tr>`;
  }).join('');

  const classTotal=summaries.reduce((a,x)=>a+x.total,0);
  const withResults=summaries.filter(x=>x.subjects>0);
  const classAverage=withResults.length
    ? withResults.reduce((a,x)=>a+x.average,0)/withResults.length : 0;

  $('#classResultsReport').innerHTML=`
    <div class='report-print-sheet'>
      <div class='report-attendance-style-header'>
        <img class='report-attendance-style-logo' src='afisap_royal_academy_logo.png' alt='AFISAP Royal Academy'>
        <div class='report-attendance-style-school'>
          <h2>${esc(d.school.name)}</h2>
          <h3>CLASS RESULTS & ACADEMIC PERFORMANCE</h3>
          <p><b>Class:</b> ${esc(cls)} &nbsp; | &nbsp; <b>Term:</b> ${esc(term)} &nbsp; | &nbsp; <b>Academic Year:</b> ${esc(year)}</p>
          <div class='report-attendance-style-contact'>
            <span>Website: www.afisaproyalacademy.com</span>
            <span>Email: afisaproyalacademy@gmail.com</span>
            <span>Phone: 0556104186 / 0242727685 / 0248743558</span>
          </div>
        </div>
      </div>

      <div class='report-summary-grid'>
        <div><b>Students</b><strong>${students.length}</strong></div>
        <div><b>Students With Results</b><strong>${withResults.length}</strong></div>
        <div><b>Class Average</b><strong>${classAverage.toFixed(1)}</strong></div>
        <div><b>Total Marks Recorded</b><strong>${classTotal}</strong></div>
      </div>

      <h3>STUDENT PERFORMANCE</h3>
      <table>
        <tr><th>Position</th><th>Student Name</th><th>Student ID</th><th>Subject Scores</th><th>Total</th><th>Average</th><th>Grade</th><th>Remarks</th></tr>
        ${rows}
      </table>

      <p style='margin-top:18px'><b>Class Teacher's Remarks:</b> ________________________________________________________________</p>
      <p><b>Class Teacher's Signature:</b> __________________________ &nbsp;&nbsp;&nbsp; <b>Head of School:</b> __________________________</p>

      <div class='report-actions'>
        <button class='primary' onclick='window.print()'>Print Class Results</button>
        <button class='secondary' onclick="document.getElementById('classResultsReport').style.display='none'">Close</button>
      </div>
    </div>`;

  $('#classResultsReport').style.display='block';
  const studentReport=document.getElementById('report');
  if(studentReport) studentReport.style.display='none';
  setTimeout(()=>window.print(),250);
};

function afisapFormatStudentReportDate(value){
  const raw=String(value||"").trim();
  if(!raw) return "";
  const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(!iso) return raw;
  const year=Number(iso[1]), month=Number(iso[2]), day=Number(iso[3]);
  if(!year || month<1 || month>12 || day<1 || day>31) return "";
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const mod100=day%100;
  const suffix=(mod100>=11&&mod100<=13)?"th":({1:"st",2:"nd",3:"rd"}[day%10]||"th");
  return day+suffix+" "+months[month-1]+" "+year;
}

function buildStudentReportCardHTML(s, term, year){

  const studentName=s.name||[s.firstName,s.middleName,s.surname,s.otherName].filter(Boolean).join(' ');
  const studentId=s.sid||s.studentId||s.id||'';
  const studentClass=s.class||s.className||'';
  const roster=afisapClassRosterInfo(s);
  term=term||'Term 1';
  year=year||String(d.school?.year||'').trim();
  const academicPosition=afisapAcademicPositionInfo(s,term,year);
  const overallPosition=academicPosition.ordinal||'—';
  const positionWatermark=academicPosition.rank||'';

  // Results: use every saved subject, including subjects created through "Other".
  const rr=(d.results||[]).filter(x=>{
    if(String(x.studentId).trim()!==afisapStudentKey(s)) return false;
    const rt=String(x.term||x.Term||'').trim();
    const ry=String(x.academicYear||x['Academic Year']||x.year||'').trim();
    return (!rt || rt===term) && (!ry || !year || ry===year);
  });
  const historicalClass=rr.map(x=>String(x.className||x.class||"").trim()).find(Boolean)||"";
  const promotionYearMatch=String(s._afisapPromotionAcademicYear||"").trim()===String(year||"").trim();
  const reportStudentClass=historicalClass||(promotionYearMatch?String(s._afisapPreviousClass||"").trim():"")||studentClass;
  const reportClassStudentIds=new Set((d.results||[]).filter(x=>{const ry=String(x.academicYear||x['Academic Year']||x.year||'').trim(),rt=String(x.term||x.Term||'').trim(),rc=String(x.className||x.class||'').trim();return (!year||!ry||ry===year)&&(!term||!rt||rt===term)&&rc.toLowerCase()===String(reportStudentClass||'').toLowerCase();}).map(x=>String(x.studentSid||x.studentId||'').trim()).filter(Boolean));
  const reportNoOnRoll=reportClassStudentIds.size||roster.noOnRoll;
  const subjectList=Array.from(new Set([...(d.subjects||[]),...rr.map(x=>x.subject).filter(Boolean)]));
  const total=rr.reduce((a,x)=>a+Number(x.cs||0)+Number(x.es||0),0);
  const max=subjectList.length*100;

  const rows=subjectList.map(sub=>{
    const r=rr.find(x=>x.subject===sub);
    const cs=r?.cs??'';
    const es=r?.es??'';
    const t=r?(Number(r.cs||0)+Number(r.es||0)):'';
    const position=r?overallPosition:'';
    const remark=r?.remarks||'';
    return `<tr>
      <td>${esc(sub)}</td><td>${esc(cs)}</td><td>${esc(es)}</td>
      <td>${esc(t)}</td><td>${esc(position)}</td><td>${esc(remark)}</td>
    </tr>`;
  }).join('')||`<tr><td colspan='6'>No results entered for this student.</td></tr>`;

  // Attendance: current V3 stores records as an object keyed by studentId_date.
  const attRaw=d.attendance||{};
  const attValues=Array.isArray(attRaw)
    ? attRaw.filter(x=>String(x.studentId)===String(s.id))
    : Object.values(attRaw).filter(x=>x&&String(x.studentId).trim()===afisapStudentKey(s));
  const actualAttendance=attValues.filter(x=>String(x.date||'').trim());
  const calculatedMarkedDays=[...new Set(actualAttendance.map(x=>String(x.date||'').trim()).filter(Boolean))].length;
  const calculatedPresentDays=[...new Set(actualAttendance.filter(x=>x.present===true||x.present==='YES').map(x=>String(x.date||'').trim()).filter(Boolean))].length;
  const presentDays=afisapAttendanceReportOverride(s,year,term)??calculatedPresentDays;
  const markedDays=afisapAttendanceOutOfOverride(s,year,term)??calculatedMarkedDays;
  const absentDays=Math.max(0,calculatedMarkedDays-calculatedPresentDays);

  // Fees & Textbooks shown on the Report Card only.
  // Use this student's actual assigned Fee Item names and assessed Amount Due.
  // No generic category mapping is used here, and no fee/payment records are changed.
  const reportYear=String(year||d.school?.year||'').trim();
  const reportStudentFeeKeys=new Set([
    s.id,s.sid,s.studentId,s["Student ID"],s.studentID,s.indexNumber,s["Index Number"]
  ].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").map(v=>String(v).trim()));

  const feeRecords=(d.feeRecords||[]).filter(x=>{
    const recordKeys=[
      x.studentId,x.studentSid,x.sid,x.studentID,x["Student ID"],x.indexNumber,x["Index Number"]
    ].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").map(v=>String(v).trim());
    if(!recordKeys.some(k=>reportStudentFeeKeys.has(k))) return false;

    const ry=String(x.academicYear||x.year||x["Academic Year"]||'').trim();
    const rt=String(x.term||x.Term||'').trim();
    return (!ry || !reportYear || ry===reportYear) && (!rt || !term || rt===term);
  });

  const reportFeeRows=feeRecords.map(r=>{
    const rawFeeItem=String(r.feeItem||r["Fee Item"]||r["Fee Name"]||r["Fee Type"]||r["Fee Description"]||r.Fees||r.Fee||r.Description||r.Particulars||r.Item||'').trim();
    let item=rawFeeItem;
    if(!item){
      const feeId=String(r.feeId||r["Fee ID"]||r.id||'').trim();
      const match=feeId.match(/^FEE\|([^|]+)\|/i);
      if(match){try{item=decodeURIComponent(match[1])}catch(e){item=match[1]}}
    }
    item=item||'Unspecified Fee Item';
    const amount=Number(r.amountDue??r["Amount Due"]??0);
    const safeAmount=Number.isFinite(amount)?amount:0;
    return `<tr><td>${esc(item)}</td><td>GHS ${safeAmount.toFixed(2)}</td></tr>`;
  }).join('');
  const reportFeeTotal=feeRecords.reduce((sum,r)=>{
    const amount=Number(r.amountDue??r["Amount Due"]??0);
    return sum+(Number.isFinite(amount)?amount:0);
  },0);

  // Student information stored in the Student section.
  const guardian=s.guardian||s.guardianName||'';
  const guardianContact=s.guardianContact||s.contact||s.phone||'';
  const guardianEmail=s.guardianEmail||s.email||'';
  const address=s.address||'';
  const gender=String(s.gender||'').trim();
  const dateOfBirth=afisapFormatStudentReportDate(s.dob||s.dateOfBirth||s['Date of Birth']||'');
  const admissionDate=afisapFormatStudentReportDate(s.admissionDate||s['Admission Date']||'');
  const ghanaCard=String(s.ghanaCard||s.ghanaCardNumber||s['Ghana Card']||s['Ghana Card Number']||'').trim();
  const photo=s.photo||'';

  // Class teacher information from the Classes & Subjects assignment.
  const classRecord=(d.classes||[]).find(c=>String(c.name||'')===String(reportStudentClass));
  const teacherId=classRecord?.teacherId;
  const teacher=(d.staff||[]).find(t=>String(t.sid||t.staffId||t.id||t.email||'')===String(teacherId||''));
  const teacherName=teacher
    ? ([teacher.surname,teacher.firstName,teacher.middleName,teacher.otherName].filter(Boolean).join(' ')||teacher.name||teacher.fullName||'')
    : (classRecord?.teacher||'');
  const head=d.school.head||'HEAD OF SCHOOL';

  const overallRemark=max?(
    total/max>=.8?'Very Good (2)':total/max>=.7?'Good (3)':'Needs Improvement'
  ):'Needs Improvement';

  // Official report-card display values. These read existing system data only;
  // no database/storage fields or calculations are changed here.
  const termDisplay=String(term||'').replace(/^Term\s*/i,'').trim()||String(term||'');
  const schoolWebsite=String(d.school?.website||'www.afisaproyalacademy.com').trim();
  const schoolPhone=String(d.school?.phone||'055 610 4186 / 024 272 7685 / 024 874 3558').trim();
  const schoolEmail=String(d.school?.email||'afisaproyalacademy@gmail.com').trim();
  const reportCardDates=afisapGetReportCardDates(year,term);
  const vacationDate=afisapFormatReportCardDate(reportCardDates.vacationDate);
  const openingDate=afisapFormatReportCardDate(reportCardDates.openingDate);
  const promotionStatus=String(s._afisapPromotionStatus||'').trim().toLowerCase();
  const promotionTerm3=/^(term\s*3|3|third\s*term)$/i.test(String(term||'').trim());
  const promotedTo=(promotionYearMatch&&promotionTerm3&&['pending','applied'].includes(promotionStatus))?String(s._afisapPromotedTo||'').trim():"";
  const teacherRemarks=String(s.teacherRemarks||s.reportRemarks||'').trim();

  const reportHtml=`
    <div class='report-print-sheet afisap-official-report-card'>
      <img class='report-card-watermark' src='afisap_royal_academy_logo.png' alt='' aria-hidden='true'>
      ${positionWatermark?`<div class='report-position-watermark' aria-hidden='true'>${esc(positionWatermark)}</div>`:''}

      <div class='official-report-header'>
        <img class='official-report-logo' src='afisap_royal_academy_logo.png' alt='AFISAP Royal Academy'>
        <div class='official-report-school'>
          <h1>${esc(d.school.name||'AFISAP ROYAL ACADEMY')}</h1>
          <div class='official-report-motto'>LEARNING TO LEARN</div>
          <div class='official-report-phones'>${esc(schoolPhone)}</div>
          <div class='official-report-contact'>${esc(schoolEmail)}${schoolWebsite?` &nbsp; | &nbsp; ${esc(schoolWebsite)}`:''}</div>
        </div>
        <div class='official-report-student-photo report-photo'>
          ${photo?`<img src='${esc(photo)}' alt='Student Passport Photo'>`:'<span>No Photo</span>'}
        </div>
      </div>

      <table class='official-report-period-table'>
        <tr>
          <th>Academic Year: <strong>${esc(year||d.school.year||'')}</strong></th>
          <th>Term: <strong>${esc(termDisplay)}</strong></th>
        </tr>
        <tr>
          <td>Vacation Date: <strong>${esc(vacationDate||'—')}</strong></td>
          <td>Opening Date: <strong>${esc(openingDate||'—')}</strong></td>
        </tr>
      </table>

      <table class='official-report-student-info'>
        <tr><th colspan='4'>Student &amp; Class Information</th></tr>
        <tr>
          <td class='official-label'>Name:</td><td class='official-value official-student-name'>${esc(studentName)}</td>
          <td class='official-label'>Roll No.:</td><td class='official-value'>${esc(roster.rollNo||'—')}</td>
        </tr>
        <tr>
          <td class='official-label'>Class:</td><td class='official-value'>${esc(reportStudentClass)}</td>
          <td class='official-label'>No. on Roll:</td><td class='official-value'>${esc(reportNoOnRoll)}</td>
        </tr>
        <tr>
          <td class='official-label'>Student ID:</td><td class='official-value'>${esc(studentId)}</td>
          <td class='official-label'>Gender:</td><td class='official-value'>${esc(gender||'—')}</td>
        </tr>
        <tr>
          <td class='official-label'>Date of Birth:</td><td class='official-value'>${esc(dateOfBirth||'—')}</td>
          <td class='official-label'>Admission Date:</td><td class='official-value'>${esc(admissionDate||'—')}</td>
        </tr>
        <tr>
          <td class='official-label'>Guardian:</td><td class='official-value'>${esc(guardian||'—')}</td>
          <td class='official-label'>Guardian Contact:</td><td class='official-value'>${esc(guardianContact||'—')}</td>
        </tr>
        ${(guardianEmail||ghanaCard||address)?`<tr>
          <td class='official-label'>${ghanaCard?'Ghana Card:':guardianEmail?'Guardian Email:':'Address:'}</td>
          <td class='official-value'>${esc(ghanaCard||guardianEmail||address)}</td>
          <td class='official-label'>${ghanaCard&&guardianEmail?'Guardian Email:':(ghanaCard||guardianEmail)&&address?'Address:':''}</td>
          <td class='official-value'>${esc(ghanaCard&&guardianEmail?guardianEmail:(ghanaCard||guardianEmail)&&address?address:'')}</td>
        </tr>`:''}
      </table>

      <table class='official-report-results'>
        <thead><tr><th>Subject</th><th>Class Score</th><th>Exam Score</th><th>Total Marks</th><th>Position</th><th>Remarks</th></tr></thead>
        <tbody>
          ${rows}
          <tr class='official-overall-row'><th>OVERALL</th><td></td><td></td><th>${total}/${max}</th><th>Position: ${esc(overallPosition)}</th><th>${esc(overallRemark)}</th></tr>
        </tbody>
      </table>

      <div class='official-report-attendance-line'>
        <span><b>ATTENDANCE MADE:</b> ${presentDays}</span>
        <span><b>OUT OF:</b> ${markedDays}</span>
        <span><b>PROMOTED TO:</b> ${esc(promotedTo||'________________')}</span>
      </div>

      <div class='official-report-remarks'>
        <b>TEACHER'S REMARKS</b>
        <div class='official-remark-line'>${teacherRemarks?esc(teacherRemarks):'&nbsp;'}</div>
        <div class='official-remark-line'>&nbsp;</div>
      </div>

      <table class='official-report-fees'>
        <thead>
          <tr><th colspan='2'>FEES &amp; TEXTBOOKS</th></tr>
          <tr><th>Fee Item</th><th>Amount</th></tr>
        </thead>
        <tbody>
          ${reportFeeRows || `<tr><td colspan='2'>No outstanding fee items.</td></tr>`}
          ${feeRecords.length?`<tr><th>TOTAL</th><th>GHS ${reportFeeTotal.toFixed(2)}</th></tr>`:''}
        </tbody>
      </table>

      <div class='official-report-position-line'>
        <b>Position:</b> ${esc(overallPosition)} &nbsp;&nbsp; <b>No. on Roll:</b> ${esc(reportNoOnRoll)}
      </div>

      <div class='official-report-signatures'>
        <div class='official-class-teacher-signature'>
          <div class='official-signature-space'></div>
          <div class='official-signature-line'></div>
          <b>CLASS TEACHER'S SIGNATURE</b>
          <div class='official-signature-name'>${esc(teacherName||'')}</div>
        </div>
        <div class='headmaster-signature-block'>
          <img class='headmaster-signature-image' src='afisap_headmaster_signature.png' alt='Headmaster Signature'>
          <div class='headmaster-signature-line'></div>
          <p class='headmaster-signature-title'><b>${esc(head||'HEAD OF SCHOOL')}</b><br>Head Of School</p>
        </div>
      </div>

      <div class='official-report-footer'>AFISAP ROYAL ACADEMY &nbsp; • &nbsp; LEARNING TO LEARN</div>

      <div class='report-actions'>
        <button class='primary' onclick='window.print()'>Print Report</button>
      </div>
    </div>`;

  return reportHtml;

}

async function afisapRefreshStudentClassForReport(student){
  if(!student) return student;
  const sid=String(student.sid||student.studentId||student.id||'').trim();
  if(!sid) return student;

  try{
    // Read the authoritative Students sheet before building the print preview.
    // This guarantees that a just-promoted student's current class is used.
    const result=await afisapCloudJsonp({action:'read',sheet:'Students'});
    if(result&&result.success===true&&Array.isArray(result.records)){
      const record=result.records.find(r=>String(r['Student ID']||'').trim()===sid);
      const cloudClass=String(record&&record['Class']||'').trim();
      if(cloudClass){
        student.class=cloudClass;
        student.className=cloudClass;
        persist();
      }
    }
  }catch(error){
    console.warn('AFISAP report-card class refresh unavailable; using current local class.',error);
  }
  return student;
}

window.makeReport=async()=>{
  const classResultsReport=document.getElementById('classResultsReport');
  if(classResultsReport) classResultsReport.style.display='none';
  const selectedKey=String($('#repStu')?.value||'').trim();
  const s=d.students.find(x=>afisapStudentKey(x)===selectedKey);
  if(!s){alert('Please select a student.');return;}
  const term=String($('#repTerm')?.value||'Term 1').trim();
  const year=String($('#repYear')?.value||d.school?.year||'').trim();
  if(String(year||'').trim()===String(d.school?.year||'').trim())await afisapRefreshStudentClassForReport(s);
  $('#report').innerHTML=buildStudentReportCardHTML(s,term,year);
  $('#report').style.display='block';
  setTimeout(()=>window.print(),250);
};




async function afisapUploadAnnouncementAttachment(file,postId){
  if(!file) return {fileId:"",fileName:""};
  if(file.size>15*1024*1024) throw new Error("Attachment is larger than 15 MB.");

  const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||""));
    reader.onerror=()=>reject(new Error("Could not read the selected attachment."));
    reader.readAsDataURL(file);
  });

  const safeOriginal=String(file.name||"attachment").replace(/[\\/:*?"<>|#%{}~&]/g,"_");
  const uploadName="AA-"+String(postId||Date.now())+"-"+safeOriginal;

  const result=await afisapSecurePost({
    action:"driveUpload",
    fileName:uploadName,
    mimeType:file.type||"application/octet-stream",
    fileData:data,
    category:"announcements",
    studentId:""
  },{includeAuth:true});
  if(!result?.success||!result.fileId)throw new Error(result?.error||"The attachment upload was not confirmed by Google Drive.");
  return {fileId:String(result.fileId),fileName:safeOriginal};
}

function afisapAnnouncementRecordToSheet(item){
  return {
    "Announcement ID":String(item.id||""),
    "Type":String(item.type||"Announcement"),
    "Title":String(item.title||""),
    "Message":String(item.message||""),
    "Class":String(item.className||""),
    "Subject":String(item.subject||""),
    "Target Audience":String(item.targetAudience||""),
    "Date Posted":String(item.datePosted||""),
    "Due Date":String(item.dueDate||""),
    "Attachment":String(item.attachmentFileId||""),
    "Attachment Name":String(item.attachmentName||""),
    "Status":String(item.status||"Published"),
    "Created By":String(item.createdBy||"Administrator"),
    "Academic Year":String(item.academicYear||""),
    "Term":String(item.term||""),
    "Last Updated":String(item.lastUpdated||new Date().toISOString())
  };
}

function afisapAnnouncementsLoadingStyle(){
  if(document.getElementById('afisapAnnouncementsLoadingStyle')) return;
  const style=document.createElement('style');
  style.id='afisapAnnouncementsLoadingStyle';
  style.textContent=`.afisap-publish-spinner{display:inline-block;width:13px;height:13px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:-2px;animation:afisapPublishSpin .7s linear infinite}@keyframes afisapPublishSpin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
}

function announcementsAssignments(){
  afisapAnnouncementsLoadingStyle();
  const records=Array.isArray(d.announcementsAssignments)?d.announcementsAssignments:[];
  let activeTab=window.afisapAnnouncementsTab||"Announcement";
  let editingId=window.afisapAnnouncementsEditingId||"";
  const editing=records.find(x=>String(x.id)===String(editingId))||null;
  if(editing) activeTab=editing.type||activeTab;

  const classNames=afisapCentralClassNames();
  const subjects=[...new Set((d.subjects||[]).map(x=>String(x||"").trim()).filter(Boolean))];
  const today=new Date().toISOString().slice(0,10);
  const formType=editing?.type||window.afisapAnnouncementsNewType||activeTab||"Announcement";
  const isAssignment=formType==="Assignment";
  const isPost=formType==="Post";
  const targetValue=editing?.targetAudience||((isAssignment)?"Specific Class":"Entire School");
  const selectedClass=editing?.className||"";

  const filtered=records.filter(r=>String(r.type||"Announcement")===activeTab)
    .sort((a,b)=>String(b.datePosted||"").localeCompare(String(a.datePosted||"")) || String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));

  $('#app').innerHTML=`
    <div class='panel'>
      <div class='panel-title'>
        <div><h3>Announcements & Assignments</h3><span>School-wide notices, class announcements and home assignments stored in Google Sheets.</span></div>
        <div style='display:flex;gap:8px;flex-wrap:wrap'>
          <button class='primary' id='newAnnouncementBtn' type='button'>+ New Announcement</button>
          <button class='primary' id='newAssignmentBtn' type='button'>+ New Assignment</button>
          <button class='secondary' id='newPostBtn' type='button'>+ New Post</button>
        </div>
      </div>

      <div class='report-mode-tabs' style='margin-top:14px'>
        <button type='button' class='${activeTab==="Announcement"?"primary":"secondary"}' data-aa-tab='Announcement'>Announcements</button>
        <button type='button' class='${activeTab==="Assignment"?"primary":"secondary"}' data-aa-tab='Assignment'>Home Assignments</button>
        <button type='button' class='${activeTab==="Post"?"primary":"secondary"}' data-aa-tab='Post'>Posts</button>
      </div>
    </div>

    <div class='grid' style='margin-top:16px;align-items:start'>
      <div class='panel'>
        <h3>${editing?'Edit '+esc(formType):(formType==='Assignment'?'New Home Assignment':formType==='Post'?'New General Post':'New School Announcement')}</h3>
        <form id='aaForm' class='form' style='margin-top:12px'>
          <input type='hidden' name='recordId' value='${esc(editing?.id||"")}'>
          <input type='hidden' name='type' value='${esc(formType)}'>
          <label>${isAssignment?'Assignment Title':'Title'}
            <input name='title' value='${esc(editing?.title||"")}' required>
          </label>
          ${isAssignment?`<label>Subject
            <select name='subject' required><option value=''>Select Subject</option>${subjects.map(s=>`<option value='${esc(s)}' ${String(editing?.subject||"")===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
          </label>`:''}
          ${isAssignment?`<label>Class
            <select name='className' required><option value=''>Select Class</option>${classNames.map(c=>`<option value='${esc(c)}' ${selectedClass===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
          </label>`:`<label>Target Audience
            <select name='targetAudience' id='aaTargetAudience'>
              <option value='Entire School' ${targetValue==='Entire School'?'selected':''}>Entire School</option>
              <option value='Specific Class' ${targetValue==='Specific Class'?'selected':''}>Specific Class</option>
            </select>
          </label>
          <label id='aaClassWrap' style='display:${targetValue==='Specific Class'?'block':'none'}'>Specific Class
            <select name='className'><option value=''>Select Class</option>${classNames.map(c=>`<option value='${esc(c)}' ${selectedClass===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
          </label>`}
          <label>${isAssignment?'Instructions':'Message'}
            <textarea name='message' rows='5' required>${esc(editing?.message||"")}</textarea>
          </label>
          <label>Date Posted
            <input name='datePosted' type='date' value='${esc(editing?.datePosted||today)}' required>
          </label>
          ${isAssignment?`<label>Due Date
            <input name='dueDate' type='date' value='${esc(editing?.dueDate||"")}' required>
          </label>`:''}
          <label>Status
            <select name='status'>
              <option ${String(editing?.status||'Published')==='Published'?'selected':''}>Published</option>
              <option ${String(editing?.status||'Published')==='Draft'?'selected':''}>Draft</option>
              <option ${String(editing?.status||'Published')==='Archived'?'selected':''}>Archived</option>
            </select>
          </label>
          <label class='wide'>Optional Attachment
            <input name='attachment' type='file'>
            ${editing?.attachmentFileId?`<small>Current attachment: ${esc(editing.attachmentName||'Attached file')}</small>`:''}
          </label>
          <div class='wide' style='display:flex;gap:8px;flex-wrap:wrap'>
            <button class='primary' type='submit'>${editing?'Save Changes':'Publish'}</button>
            ${editing?`<button class='secondary' type='button' id='aaCancelEdit'>Cancel</button>`:''}
          </div>
        </form>
      </div>

      <div class='panel'>
        <div class='panel-title'><h3>${activeTab==='Assignment'?'Home Assignments':activeTab==='Post'?'General Posts / Notices':'School Announcements'}</h3><span>${filtered.length} item${filtered.length===1?'':'s'}</span></div>
        <div style='overflow:auto'>
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Audience / Class</th><th>Subject</th><th>Date Posted</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${filtered.map(r=>`<tr>
                <td><b>${esc(r.title)}</b>${r.message?`<br><small>${esc(String(r.message).slice(0,90))}${String(r.message).length>90?'…':''}</small>`:''}${r.attachmentFileId?`<br><small>📎 ${esc(r.attachmentName||'Attachment')}</small>`:''}</td>
                <td>${esc(r.type)}</td>
                <td>${esc(r.type==='Assignment'?(r.className||'—'):(r.targetAudience==='Specific Class'?(r.className||'Specific Class'):(r.targetAudience||'Entire School')))}</td>
                <td>${esc(r.subject||'—')}</td>
                <td>${esc(r.datePosted||'—')}</td>
                <td>${esc(r.dueDate||'—')}</td>
                <td><span class='status'>${esc(r.status||'Published')}</span></td>
                <td><button class='secondary aa-edit' data-id='${esc(r.id)}' type='button'>Edit</button> <button class='danger aa-delete' data-id='${esc(r.id)}' type='button'>Delete</button></td>
              </tr>`).join('')||`<tr><td colspan='8'><div class='empty'>No ${activeTab==='Assignment'?'home assignments':activeTab==='Post'?'posts':'announcements'} have been created yet.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  const setNewType=(type)=>{window.afisapAnnouncementsEditingId="";window.afisapAnnouncementsNewType=type;window.afisapAnnouncementsTab=type;announcementsAssignments();};
  $('#newAnnouncementBtn').onclick=()=>setNewType('Announcement');
  $('#newAssignmentBtn').onclick=()=>setNewType('Assignment');
  $('#newPostBtn').onclick=()=>setNewType('Post');
  document.querySelectorAll('[data-aa-tab]').forEach(btn=>btn.onclick=()=>{window.afisapAnnouncementsTab=btn.dataset.aaTab;window.afisapAnnouncementsNewType=btn.dataset.aaTab;window.afisapAnnouncementsEditingId="";announcementsAssignments();});
  $('#aaTargetAudience')?.addEventListener('change',e=>{const wrap=$('#aaClassWrap');if(wrap)wrap.style.display=e.target.value==='Specific Class'?'block':'none';});
  $('#aaCancelEdit')?.addEventListener('click',()=>{window.afisapAnnouncementsEditingId="";announcementsAssignments();});

  document.querySelectorAll('.aa-edit').forEach(btn=>btn.onclick=()=>{window.afisapAnnouncementsEditingId=btn.dataset.id;const item=records.find(x=>String(x.id)===String(btn.dataset.id));if(item){window.afisapAnnouncementsTab=item.type;window.afisapAnnouncementsNewType=item.type;}announcementsAssignments();});
  document.querySelectorAll('.aa-delete').forEach(btn=>btn.onclick=async()=>{
    const item=records.find(x=>String(x.id)===String(btn.dataset.id));
    if(!item || !confirm('Delete this '+String(item.type||'item').toLowerCase()+'?')) return;
    const result=await afisapCloudPost({action:'delete',sheet:'Announcements & Assignments',idField:'Announcement ID',idValue:item.id});
    if(!result?.success){alert('Delete failed: '+String(result?.error||'Cloud database error.'));return;}
    d.announcementsAssignments=records.filter(x=>String(x.id)!==String(item.id));
    persist();
    announcementsAssignments();
  });

  $('#aaForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const form=new FormData(e.target);
    const existingId=String(form.get('recordId')||'').trim();
    const type=String(form.get('type')||'Announcement').trim();
    const targetAudience=type==='Assignment'?'Specific Class':String(form.get('targetAudience')||'Entire School').trim();
    const className=String(form.get('className')||'').trim();
    if((type==='Assignment'||targetAudience==='Specific Class')&&!className){alert('Please select the target class.');return;}

    const id=existingId||('AA-'+Date.now()+'-'+Math.floor(Math.random()*10000));
    const old=records.find(x=>String(x.id)===existingId)||{};
    let attachmentFileId=String(old.attachmentFileId||'');
    let attachmentName=String(old.attachmentName||'');
    const file=form.get('attachment');
    const submit=e.target.querySelector('button[type="submit"]');
    const formButtons=e.target.querySelectorAll('button');
    const originalSubmitText=existingId?'Save Changes':'Publish';
    const setSubmitProgress=(label,percent)=>{
      if(!submit) return;
      submit.disabled=true;
      submit.innerHTML=`<span class="afisap-publish-spinner" aria-hidden="true"></span> ${esc(label)}${percent!==null?` <span style="opacity:.9">(${percent}%)</span>`:''}`;
    };
    if(submit) setSubmitProgress(existingId?'Saving...':'Publishing...',0);
    formButtons.forEach(btn=>{ if(btn!==submit) btn.disabled=true; });

    try{
      // IMPORTANT: Save the announcement/assignment to Google Sheets FIRST.
      // A Drive attachment must never block or prevent the main record from
      // being created. Large base64 uploads can take much longer than a Sheet
      // write and may fail independently.
      const item={
        id,
        type,
        title:String(form.get('title')||'').trim(),
        message:String(form.get('message')||'').trim(),
        className,
        subject:type==='Assignment'?String(form.get('subject')||'').trim():'',
        targetAudience,
        datePosted:String(form.get('datePosted')||'').trim(),
        dueDate:type==='Assignment'?String(form.get('dueDate')||'').trim():'',
        attachmentFileId,
        attachmentName,
        status:String(form.get('status')||'Published').trim(),
        createdBy:String(old.createdBy||'Administrator'),
        academicYear:String(d.school?.year||'').trim(),
        term:String(d.school?.term||'').trim(),
        lastUpdated:new Date().toISOString()
      };

      const payload={action:existingId?'update':'create',sheet:'Announcements & Assignments',data:afisapAnnouncementRecordToSheet(item)};
      if(existingId){payload.idField='Announcement ID';payload.idValue=id;}

      setSubmitProgress(existingId?'Updating Google Sheet...':'Saving to Google Sheet...',file && file.size ? 30 : 45);
      const result=await afisapCloudPost(payload);
      if(!result?.success) throw new Error(String(result?.error||'Google Sheets did not confirm the save.'));

      // Update the local state immediately after the Sheet confirms.
      // This guarantees that the main record is preserved even if Drive is slow.
      const next=records.filter(x=>String(x.id)!==id);
      next.push(item);
      d.announcementsAssignments=next;
      persist();

      // Upload the optional attachment only AFTER the Sheet record exists.
      // If Drive fails, keep the Sheet record and report the attachment issue
      // separately instead of treating the whole publication as failed.
      let attachmentWarning='';
      if(file && file.size){
        try{
          setSubmitProgress('Uploading attachment...',60);
          const uploaded=await afisapUploadAnnouncementAttachment(file,id);
          attachmentFileId=uploaded.fileId;
          attachmentName=uploaded.fileName;

          const attachmentItem=Object.assign({},item,{
            attachmentFileId,
            attachmentName,
            lastUpdated:new Date().toISOString()
          });
          const attachmentPayload={
            action:'update',
            sheet:'Announcements & Assignments',
            data:afisapAnnouncementRecordToSheet(attachmentItem),
            idField:'Announcement ID',
            idValue:id
          };
          setSubmitProgress('Confirming attachment...',85);
          const attachmentSave=await afisapCloudPost(attachmentPayload);
          if(!attachmentSave?.success){
            throw new Error(String(attachmentSave?.error||'Google Sheets did not confirm the attachment reference.'));
          }

          d.announcementsAssignments=d.announcementsAssignments.map(x=>
            String(x.id)===id ? attachmentItem : x
          );
          persist();
        }catch(attachmentError){
          console.error('AFISAP announcement attachment save failed:',attachmentError);
          attachmentWarning='\\n\\nThe announcement was saved to Google Sheets, but the attachment could not be confirmed in Google Drive. You can edit the item and try the attachment again.';
        }
      }

      setSubmitProgress(attachmentWarning?'Saved to Google Sheets (attachment issue)':'Published successfully',100);
      window.afisapAnnouncementsEditingId="";
      window.afisapAnnouncementsNewType=type;
      window.afisapAnnouncementsTab=type;
      announcementsAssignments();
      if(attachmentWarning) alert('Saved successfully to Google Sheets.'+attachmentWarning);
    }catch(error){
      console.error('AFISAP Announcements & Assignments save failed:',error);
      alert('Could not save this item.\n\n'+String(error?.message||error));
      if(submit){submit.disabled=false;submit.textContent=originalSubmitText;}
      formButtons.forEach(btn=>{ if(btn!==submit) btn.disabled=false; });
    }
  });
}

function fees(){

  window.printStudentFeePreview=function(id){
    const records=Array.isArray(d.feeRecords)?d.feeRecords:[];
    const r=records.find(x=>String(x.id)===String(id));
    if(!r){alert("Student fee record not found.");return;}

    const students=Array.isArray(d.students)?d.students:[];
    const sid=String(r.studentId||r.sid||r.studentID||"");
    const s=students.find(x=>{
      const ids=[x.studentId,x.sid,x.id,x.studentID,x.indexNumber]
        .filter(v=>v!==undefined&&v!==null&&v!=="").map(String);
      return ids.includes(sid);
    })||{};

    const name=[s.surname,s.firstName,s.middleName,s.otherName].filter(Boolean).join(" ")
      ||s.fullName||s.name||r.studentName||"";
    const studentClass=s.className||s.class||s.classLevel||r.className||r.class||"";
    const gender=s.gender||r.gender||"";
    const due=Number(r.amountDue||0);
    const paid=Number(r.amountPaid||0);
    const balance=Math.max(0,due-paid);
    const status=balance===0&&paid>0?"Paid":paid>0?"Part Paid":"Due";
    const photo=s.photo||r.photo||"";

    const w=window.open("","_blank","width=950,height=850");
    if(!w){alert("Please allow pop-ups for the print preview.");return;}

    const escHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

    const letterhead="data:image/jpeg;base64,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AAAAAAAAAD+AAAA4QklNBA0AAAAAAAQAAAAeOEJJTQQZAAAAAAAEAAAAHjhCSU0D8wAAAAAACQAAAAAAAAAAAQA4QklNJxAAAAAAAAoAAQAAAAAAAAABOEJJTQP1AAAAAABIAC9mZgABAGxmZgAGAAAAAAABAC9mZgABAKGZmgAGAAAAAAABADIAAAABAFoAAAAGAAAAAAABADUAAAABAC0AAAAGAAAAAAABOEJJTQP4AAAAAABwAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAADhCSU0EAAAAAAAAAgACOEJJTQQCAAAAAAAGAAAAAAAAOEJJTQQwAAAAAAADAQEBADhCSU0ELQAAAAAAAgAAOEJJTQQIAAAAAAAQAAAAAQAAAkAAAAJAAAAAADhCSU0EHgAAAAAABAAAAAA4QklNBBoAAAAAA4MAAAAGAAAAAAAAAAAAAAZAAAAEawAAACcAVwBoAGEAdABzAEEAcABwACAASQBtAGEAZwBlACAAMgAwADIANgAtADAAOAAtADEAOQAgAGEAdAAgADYALgAwADEALgA1ADYAIABQAE0AAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAABGsAAAZAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxsAAAAAgAAAAZib3VuZHNPYmpjAAAAAQAAAAAAAFJjdDEAAAAEAAAAAFRvcCBsb25nAAAAAAAAAABMZWZ0bG9uZwAAAAAAAAAAQnRvbWxvbmcAAAZAAAAAAFJnaHRsb25nAAAEawAAAAZzbGljZXNWbExzAAAAAU9iamMAAAABAAAAAAAFc2xpY2UAAAASAAAAB3NsaWNlSURsb25nAAAAAAAAAAdncm91cElEbG9uZwAAAAAAAAAGb3JpZ2luZW51bQAAAAxFU2xpY2VPcmlnaW4AAAANYXV0b0dlbmVyYXRlZAAAAABUeXBlZW51bQAAAApFU2xpY2VUeXBlAAAAAEltZyAAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAA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3yfvx/xP/Q1vux7H7X//2QA4QklNBCEAAAAAAFcAAAABAQAAAA8AQQBkAG8AYgBlACAAUABoAG8AdABvAHMAaABvAHAAAAAUAEEAZABvAGIAZQAgAFAAaABvAHQAbwBzAGgAbwBwACAAMgAwADIAMQAAAAEAOEJJTQQGAAAAAAAH//8BAQABAQD/4Q5PaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA3LjEtYzAwMCA3OS43YTdhMjM2LCAyMDIxLzA4LzEyLTAwOjI1OjIwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk0MGYyMTE5LTBjNTItMzc0Mi1hY2ExLTZmNjNjNzgyOTZmNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2MDA3ZGI1ZS0zZDQwLWIzNDItYTVkOC01NDM1OWNlODgwNTAiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iQ0MxNUM0N0JGREIxM0E1MEFFQjQ4ODI4MkFEQjREODUiIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IiIHhtcDpDcmVhdGVEYXRlPSIyMDI2LTA4LTI0VDE4OjMxOjI1WiIgeG1wOk1vZGlmeURhdGU9IjIwMjYtMDgtMjRUMTg6MzM6MTFaIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI2LTA4LTI0VDE4OjMzOjExWiI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmRmY2ZiYzU2LTcxZjItYWY0Mi04NWNmLTYxOTVkZWI2YTI5ZSIgc3RFdnQ6d2hlbj0iMjAyNi0wOC0yNFQxODozMzoxMVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi41IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NjAwN2RiNWUtM2Q0MC1iMzQyLWE1ZDgtNTQzNTljZTg4MDUwIiBzdEV2dDp3aGVuPSIyMDI2LTA4LTI0VDE4OjMzOjExWiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjUgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8cGhvdG9zaG9wOlRleHRMYXllcnM+IDxyZGY6QmFnPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IlN0dWRlbnQgRmVlIFN0YXRlbWVudCIgcGhvdG9zaG9wOkxheWVyVGV4dD0iU3R1ZGVudCBGZWUgU3RhdGVtZW50Ii8+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6VGV4dExheWVycz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";

    w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Student Fee Statement - ${escHtml(name)}</title>
<style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111;background:#fff}
  .page{position:relative;min-height:297mm;padding-bottom:95px;overflow:hidden}
  .letterhead-top{height:265px;overflow:hidden;position:relative}
  .letterhead-top img{display:block;width:100%;height:auto}
  .content{position:relative;padding:22px 48px 30px;z-index:2}
  .watermark{position:absolute;z-index:0;left:50%;top:500px;transform:translateX(-50%);width:230px;height:230px;
    background-image:url(${letterhead});background-repeat:no-repeat;background-position:0 0;background-size:1131px 1600px;
    opacity:.055;pointer-events:none}
  .statement-title{display:inline-block;background:#09265d;color:#fff;padding:10px 28px;font-size:20px;font-weight:700;margin-bottom:18px}
  .student{display:flex;gap:20px;align-items:center;border:1px solid #ddd;padding:15px;border-radius:6px;background:rgba(255,255,255,.93)}
  .student img{width:92px;height:105px;object-fit:cover;border:1px solid #aaa}
  .info{line-height:1.9;font-size:14px}
  table{width:100%;border-collapse:collapse;margin-top:22px;background:rgba(255,255,255,.94)}
  th,td{border:1px solid #999;padding:11px 10px;text-align:left;font-size:13px}
  th{background:#09265d;color:#fff}
  .status{font-weight:700}
  .letterhead-bottom{position:absolute;left:0;right:0;bottom:0;height:92px;overflow:hidden}
  .letterhead-bottom img{position:absolute;left:0;bottom:0;width:100%;height:auto}
  .actions{text-align:center;margin:15px 0 25px}
  .actions button{padding:10px 26px;font-size:15px;cursor:pointer}
  @media print{
    .actions{display:none}
    .page{min-height:297mm}
  }
</style></head><body>
<div class="page">
  <div class="letterhead-top"><img src="${letterhead}" alt="AFISAP Royal Academy Letterhead"></div>
  <div class="watermark" aria-hidden="true"></div>
  <div class="content">
    <div class="statement-title">Student Fee Statement</div>
    <div class="student">
      ${photo?`<img src="${photo}" alt="Student Passport Photo">`:""}
      <div class="info">
        <div><b>Student:</b> ${escHtml(name)}</div>
        <div><b>Student ID:</b> ${escHtml(sid)}</div>
        <div><b>Class:</b> ${escHtml(studentClass)}</div>
        <div><b>Gender:</b> ${escHtml(gender)}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Fee Item</th><th>Amount Due</th><th>Amount Paid</th><th>Balance</th><th>Status</th></tr></thead>
      <tbody><tr>
        <td>${escHtml(r.feeItem||"")}</td>
        <td>GHS ${due.toFixed(2)}</td>
        <td>GHS ${paid.toFixed(2)}</td>
        <td>GHS ${balance.toFixed(2)}</td>
        <td class="status">${status}</td>
      </tr></tbody>
    </table>
  </div>
  <div class="letterhead-bottom"><img src="${letterhead}" alt=""></div>
</div>
<div class="actions"><button onclick="window.print()">Print</button></div>
</body></html>`);
    w.document.close();
  };



  function editFeeRecord(id){
    const records=Array.isArray(d.feeRecords)?d.feeRecords:[];
    const r=records.find(x=>String(x.id)===String(id));
    if(!r){alert("Fee record not found.");return;}

    const existing=document.getElementById("feeEditPanel");
    if(existing) existing.remove();

    const panel=document.createElement("div");
    panel.id="feeEditPanel";
    panel.className="panel";
    panel.style.cssText="margin:18px 0;border:2px solid #ddd;padding:18px;background:#fff;";
    panel.innerHTML=`
      <div class="panel-title">
        <h3>Edit Student Fee Record</h3>
        <button type="button" class="danger" id="cancelFeeEdit">Cancel</button>
      </div>
      <form id="feeEditForm" class="form" style="margin-top:12px">
        <label>Fee Item
          <input name="feeItem" type="text" value="${esc(r.feeItem||"")}" required>
        </label>
        <label>Amount Due (GHS)
          <input name="amountDue" type="number" min="0" step=".01" value="${Number(r.amountDue||0).toFixed(2)}" required>
        </label>
        <label>Amount Paid (GHS)
          <input name="amountPaid" type="number" min="0" step=".01" value="${Number(r.amountPaid||0).toFixed(2)}" required>
        </label>
        <div class="wide">
          <div style="font-weight:600;margin-bottom:10px">Balance: <span id="feeEditBalance">GHS 0.00</span></div>
          <div style="font-weight:600;margin-bottom:10px">Status: <span id="feeEditStatus">Due</span></div>
          <button type="submit" class="primary">Save Changes</button>
        </div>
      </form>`;

    const recordsPanel=[...document.querySelectorAll("#app .panel")].find(p=>p.innerText.includes("Student Fee Records"));
    if(recordsPanel) recordsPanel.parentNode.insertBefore(panel,recordsPanel);
    else document.getElementById("app").prepend(panel);

    const form=panel.querySelector("#feeEditForm");
    const dueInput=form.querySelector("[name=amountDue]");
    const paidInput=form.querySelector("[name=amountPaid]");
    const balanceEl=panel.querySelector("#feeEditBalance");
    const statusEl=panel.querySelector("#feeEditStatus");

    const refreshCalc=()=>{
      const due=Number(dueInput.value||0), paid=Number(paidInput.value||0);
      const bal=Math.max(0,due-paid);
      const status=bal===0 && paid>0 ? "Paid" : paid>0 ? "Part Paid" : "Due";
      balanceEl.textContent="GHS "+bal.toFixed(2);
      statusEl.textContent=status;
    };
    dueInput.addEventListener("input",refreshCalc);
    paidInput.addEventListener("input",refreshCalc);
    refreshCalc();

    panel.querySelector("#cancelFeeEdit").addEventListener("click",()=>panel.remove());

    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const item=String(new FormData(form).get("feeItem")||"").trim();
      const due=Number(dueInput.value||0);
      const paid=Number(paidInput.value||0);

      if(!item){alert("Please enter a Fee Item.");return;}
      if(!Number.isFinite(due)||due<0){alert("Please enter a valid Amount Due.");return;}
      if(!Number.isFinite(paid)||paid<0){alert("Please enter a valid Amount Paid.");return;}
      if(paid>due){alert("Amount Paid cannot be greater than Amount Due.");return;}

      const student=(d.students||[]).find(s=>{
        const localId=String(s.id||"").trim();
        const stableId=String(s.sid||s.studentId||s["Student ID"]||"").trim();
        return localId===String(r.studentId||"").trim() || stableId===String(r.studentSid||r.studentId||"").trim();
      })||{};
      const submitButton=form.querySelector('button[type="submit"]');
      const originalSubmitText=submitButton?submitButton.textContent:'Save Changes';
      let saveStatus=form.querySelector('.afisap-fee-save-status');
      if(!saveStatus){saveStatus=document.createElement('div');saveStatus.className='afisap-fee-save-status';form.appendChild(saveStatus);}
      saveStatus.innerHTML='<span class="afisap-fee-spinner" aria-hidden="true"></span><span>Saving Changes...</span>';
      if(submitButton){submitButton.disabled=true;submitButton.textContent='Saving Changes...';}
      const finishFeeSaveState=(message,isError=false)=>{if(saveStatus){saveStatus.textContent=message;saveStatus.style.color=isError?'#a51d1d':''}if(submitButton){submitButton.disabled=false;submitButton.textContent=originalSubmitText}};

    const cloudRecord={
        "Fee ID":String(r.id),
        "Student ID":String(student.sid||student.studentId||student["Student ID"]||student.id||r.studentId||""),
        "Admission Number":String(student.admissionNumber||student["Admission Number"]||""),
        "Student Name":String(student.name||student.fullName||""),
        "Fee Item":item,
        "Amount Due":due,
        "Amount Paid":paid,
        "Balance":Math.max(0,due-paid),
        "Date":String(r.date||""),
        "Academic Year":String(r.academicYear||(d.school&&d.school.year)||""),
        "Term":String(r.term||(d.school&&d.school.term)||""),
        "Last Updated":new Date().toISOString()
      };

      afisapCloudPost({
        action:"update",
        sheet:"Fees",
        idField:"Fee ID",
        idValue:String(r.id),
        sheetRow:Number(r.sheetRow||0),
        data:cloudRecord
      }).then(async result=>{
        if(!result || result.success!==true){
          const notFound=/record not found|not found|does not exist/i.test(
            String(result&&result.error||"")
          );

          /* If this is a local-only fee, create its cloud row now. */
          if(notFound){
            const created=await afisapCloudPost({
              action:"create",
              sheet:"Fees",
              data:cloudRecord
            });
            if(created && created.success===true){
              const refreshed=await afisapSyncAllFromCloud();
              if(!refreshed||refreshed.success!==true){finishFeeSaveState('Saved, but refresh failed.',true);alert('Google Sheets confirmed the save, but the Fees page could not refresh. Please refresh the page.');return;}
              finishFeeSaveState('Fee record saved successfully.');nav("fees");
              alert("Student fee record was saved to Google Sheets successfully.");
              return;
            }
          }

          console.error("Fee update cloud sync failed:",result);
          finishFeeSaveState('Unable to save changes.',true);
          alert("Fee was not updated because Google Sheets did not confirm the change."+(result&&result.error?"\n\nReason: "+result.error:""));
          return;
        }
        const refreshed=await afisapSyncAllFromCloud();
        if(!refreshed||refreshed.success!==true){finishFeeSaveState('Updated, but refresh failed.',true);alert('Google Sheets confirmed the update, but the Fees page could not refresh. Please refresh the page.');return;}
        finishFeeSaveState('Fee record updated successfully.');nav("fees");
        alert("Fee record updated successfully.");
      }).catch(async error=>{
        console.error("Fee update cloud sync error:",error);
        finishFeeSaveState('Unable to save changes.',true);
        alert("Fee was not updated because Google Sheets could not be reached.");
      });
    });
  }

  function editConfiguredFeeItem(id){
    const items=Array.isArray(d.fees)?d.fees:[],item=items.find(x=>String(x.id||x.name)===String(id));
    if(!item){alert("Fee item not found.");return;}
    const existing=document.getElementById("configuredFeeEditPanel");if(existing)existing.remove();
    const panel=document.createElement("div");panel.id="configuredFeeEditPanel";panel.className="panel";
    panel.style.cssText="margin:18px 0;border:2px solid #ddd;padding:18px;background:#fff;";
    panel.innerHTML=`<div class="panel-title"><h3>Edit Fee Item</h3><button type="button" class="danger" id="cancelConfiguredFeeEdit">Cancel</button></div>
      <form id="configuredFeeEditForm" class="form" style="margin-top:12px">
        <label>Fee Item<input name="name" type="text" value="${esc(item.name||"")}" required></label>
        <label>Amount (GHS)<input name="amount" type="number" min="0" step=".01" value="${Number(item.amount||0).toFixed(2)}" required></label>
        <div class="wide"><button type="submit" class="primary">Save Changes</button></div></form>`;
    const firstPanel=document.querySelector("#app .grid");if(firstPanel)firstPanel.parentNode.insertBefore(panel,firstPanel);else document.getElementById("app").prepend(panel);
    panel.querySelector("#cancelConfiguredFeeEdit").addEventListener("click",()=>panel.remove());
    panel.querySelector("#configuredFeeEditForm").addEventListener("submit",async e=>{
      e.preventDefault();const f=new FormData(e.target),name=String(f.get("name")||"").trim(),amount=Number(f.get("amount")||0);
      if(!name){alert("Please enter a Fee Item.");return;}if(!Number.isFinite(amount)||amount<0){alert("Please enter a valid Amount.");return;}
      const duplicate=items.some(x=>String(x.id||x.name)!==String(item.id||item.name)&&String(x.name||"").trim().toLowerCase()===name.toLowerCase());
      if(duplicate){alert("That fee item already exists.");return;}
      const btn=e.target.querySelector('button[type="submit"]'),oldText=btn?.textContent||'Save Changes';
      let status=e.target.querySelector('.afisap-fee-save-status');if(!status){status=document.createElement('div');status.className='afisap-fee-save-status';e.target.appendChild(status);}
      status.innerHTML='<span class="afisap-fee-spinner" aria-hidden="true"></span><span>Saving Changes...</span>';
      if(btn){btn.disabled=true;btn.textContent='Saving Changes...';}
      let feeId=String(item.id||"").trim(),result=null;
      if(/^FEE_ITEM\|/i.test(feeId)){
        result=await afisapCloudPost({action:'update',sheet:'Fees',idField:'Fee ID',idValue:feeId,sheetRow:Number(item.sheetRow||0),data:{
          'Fee ID':feeId,'Fee Item':name,'Amount Due':amount,'Last Updated':new Date().toISOString()
        }}).catch(()=>null);
      }else{
        feeId='FEE_ITEM|'+encodeURIComponent(name)+'|'+Date.now();
        result=await afisapCloudPost({action:'create',sheet:'Fees',data:{
          'Fee ID':feeId,'Student ID':'','Student Name':'','Fee Item':name,'Amount Due':amount,'Amount Paid':0,
          'Balance':amount,'Date':'','Academic Year':'','Term':'','Date Created':new Date().toISOString(),'Last Updated':new Date().toISOString()
        }}).catch(()=>null);
      }
      if(!result||result.success!==true){status.textContent='Unable to save changes.';status.style.color='#a51d1d';if(btn){btn.disabled=false;btn.textContent=oldText;}alert("Fee item was not updated in Google Sheets."+(result?.error?"\n\nReason: "+result.error:""));return;}
      const refreshed=await afisapSyncAllFromCloud();
      if(!refreshed||refreshed.success!==true){status.textContent='Updated, but refresh failed.';status.style.color='#a51d1d';if(btn){btn.disabled=false;btn.textContent=oldText;}alert('Google Sheets confirmed the update, but Fee Items could not refresh.');return;}
      status.textContent='Fee item updated successfully.';nav("fees");alert("Fee item updated successfully in Google Sheets.");
    });
  }

  window.editFeeRecord=editFeeRecord;
  window.editConfiguredFeeItem=editConfiguredFeeItem;


  const studentOptions=(d.students||[]).map(s=>`<option value='${esc(s.id)}'>${esc((s.name || [s.firstName,s.middleName,s.surname,s.otherName].filter(Boolean).join(' ')))} — ${esc(s.class||'')}</option>`).join('');

  // Official school fee names are available for assignment even if the
  // administrator has not manually configured them first. Configured items
  // still take priority for their custom amount.
  const officialFixedFeeAmounts={
    'Admission Fee':200,
    'Tuition Fee':400,
    'School T-Shirt':80,
    'Sanitary Fee':50,
    'First Aid Fee':50,
    'PTA Dues':50,
    'Textbook Fee':550
  };
  const officialFeeNames=[
    'Admission Fee','Tuition Fee','School Uniform','School T-Shirt',
    'Sanitary Fee','First Aid Fee','PTA Dues','Daily Canteen',
    'Daily T&T (Transport)','Textbook Fee'
  ];
  const configuredFeeMap=new Map((d.fees||[]).map(f=>[String(f.name||'').trim().toLowerCase(),f]));
  const feeNameList=[...new Set([
    ...officialFeeNames,
    ...(d.fees||[]).map(f=>String(f.name||'').trim()).filter(Boolean)
  ])];
  const itemOptions=feeNameList.map(name=>{
    const configured=configuredFeeMap.get(name.toLowerCase());
    const amount=configured ? Number(configured.amount||0) : Number(officialFixedFeeAmounts[name]||0);
    const suffix=amount>0 ? ` — GHS ${amount.toFixed(2)}` : '';
    return `<option value='${esc(name)}' data-amount='${amount}'>${esc(name)}${esc(suffix)}</option>`;
  }).join('');
  const feeRows=(d.feeRecords||[]).map(r=>{
    const s=(d.students||[]).find(x=>String(x.id)===String(r.studentId));
    const due=Number(r.amountDue||0),paid=Number(r.amountPaid||0),bal=Math.max(0,due-paid);
    const status=bal===0 && paid>0?'Paid':paid>0?'Part Paid':'Due';
    return `<tr><td>${s?.photo?`<img src="${s.photo}" alt="Student Photo" style="width:46px;height:46px;border-radius:50%;object-fit:cover">`:`<div style="width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#f1f1f1">👤</div>`}</td><td>${esc(s?.name||[s?.surname,s?.firstName,s?.middleName,s?.otherName].filter(Boolean).join(' ')||'Unknown')}</td><td>${esc(r.feeItem||'Fees')}</td><td>GHS ${due.toFixed(2)}</td><td>GHS ${paid.toFixed(2)}</td><td>GHS ${bal.toFixed(2)}</td><td><span class='status ${status.toLowerCase().replace(' ','-')}'>${status}</span></td><td><button class='secondary' onclick='window.editFeeRecord("${r.id}")'>Edit</button><button class='secondary' onclick='window.printStudentFeePreview("${r.id}")'>Print Preview</button> <button class='danger' data-fee-delete-type='feeRecords' data-fee-delete-id='${esc(r.id)}' onclick='del("feeRecords","${r.id}")'>Delete</button></td></tr>`;
  }).join('');

  const classOptions=[...new Set((d.students||[]).map(s=>String(s.class||s.className||s.classLevel||'').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b))
    .map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');

  $('#app').innerHTML=`<div class='grid'>
    <div class='panel'>
      <div class='panel-title'><h3>Fee Items</h3><span>${d.fees.length} configured</span></div>
      <form id='configuredFeeItemForm' class='form' style='margin-top:12px'>
        <label>Fee Item
          <select name='name' id='configuredFeeItem' required>
            <option value=''>Select Fee Item</option>
            <option value='Admission Fee'>Admission Fee</option>
            <option value='Tuition Fee'>Tuition Fee</option>
            <option value='School Uniform'>School Uniform</option>
            <option value='School T-Shirt'>School T-Shirt</option>
            <option value='Sanitary Fee'>Sanitary Fee</option>
            <option value='First Aid Fee'>First Aid Fee</option>
            <option value='PTA Dues'>PTA Dues</option>
            <option value='Daily Canteen'>Daily Canteen</option>
            <option value='Daily T&amp;T (Transport)'>Daily T&amp;T (Transport)</option>
            <option value='Textbook Fee'>Textbook Fee</option>
            <option value='Other'>Other</option>
          </select>
        </label>
        <label id='otherFeeItemLabel' style='display:none'>Other Fee Item
          <input name='otherName' id='otherFeeItemInput' type='text' placeholder='Type other fee item'>
        </label>
        <label>Amount (GHS)
          <input name='amount' type='number' min='0' step='.01' required>
        </label>
        <div class='wide'><button type='submit' class='primary'>Save Fee Item</button></div>
      </form>
      <div class='table' style='margin-top:15px'><table><tr><th>Fee Item</th><th>Amount</th><th>Actions</th></tr>
      ${d.fees.map(f=>`<tr><td>${esc(f.name)}</td><td>GHS ${Number(f.amount||0).toFixed(2)}</td><td><button class='secondary' onclick='window.editConfiguredFeeItem("${f.id||f.name}")'>Edit</button> <button class='danger' data-fee-delete-type='fees' data-fee-delete-id='${esc(f.id||f.name)}' onclick='del("fees","${f.id||f.name}")'>Delete</button></td></tr>`).join('') || '<tr><td colspan="3" class="empty">No fee items have been added.</td></tr>'}</table></div>
    </div>

    <div class='panel'>
      <div class='panel-title'><h3>Bulk Fee Assignment</h3><span>Assign fees without entering students one by one</span></div>
      <p class='muted'>Set a standard amount once, choose a class or the whole school, review the student list, and apply the fee. Every student receives an individual fee account record so their own Due, Paid and Balance can appear automatically on report cards. You only change the amount for students who have a special fee arrangement.</p>
      <form id='bulkFeeAssignmentForm' class='form'>
        <label>Apply To
          <select name='scope' id='bulkFeeScope' required>
            <option value='class'>A Whole Class</option>
            <option value='all'>All Students</option>
          </select>
        </label>
        <label id='bulkFeeClassLabel'>Class
          <select name='className' id='bulkFeeClass' required>
            <option value=''>Select Class</option>${classOptions}
          </select>
        </label>
        <label>Fee Item
          <select name='feeItem' id='bulkFeeItem' required>
            <option value=''>Select Fee Item</option>${itemOptions}
          </select>
        </label>
        <label>Standard Amount Due Per Student (GHS)
          <input name='amountDue' id='bulkFeeAmount' type='number' min='0' step='.01' required>
          <small id='bulkFeeAmountHelp' class='upload-help'>This amount is applied to everyone first. You can adjust exceptions on the review screen.</small>
        </label>
        <label>Academic Year
          <input name='academicYear' id='bulkFeeYear' value='${esc(d.school?.year||'')}' placeholder='e.g. 2026/2027' required>
        </label>
        <label>Term
          <select name='term' id='bulkFeeTerm' required>
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
        </label>
        <label class='wide' style='display:flex;align-items:center;gap:10px'>
          <input type='checkbox' name='skipExisting' id='bulkFeeSkipExisting' checked style='width:auto'>
          <span>Skip students who already have this fee for the selected year and term</span>
        </label>
        <div class='wide'>
          <button class='primary' type='submit' id='bulkFeeApplyBtn'>Review Students &amp; Apply Fee</button>
        </div>
      </form>
      <div id='bulkFeeProgress' class='report-help-text' style='display:none;margin-top:12px'></div>
    </div>



  <div class='panel' style='margin-top:18px'><div class='panel-title'><h3>Student Fee Records</h3><span>Recent</span></div><div class='table'><table><tr><th>Passport Photo</th><th>Student</th><th>Fee Item</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr>${feeRows||'<tr><td colspan="8" class="empty">No student fee records yet.</td></tr>'}</table></div></div>
  </div>`;





  const configuredFeeForm=$('#configuredFeeItemForm');
  const configuredFeeSelect=$('#configuredFeeItem');
  const otherFeeLabel=$('#otherFeeItemLabel');
  const otherFeeInput=$('#otherFeeItemInput');

  configuredFeeSelect?.addEventListener('change',()=>{
    const isOther=configuredFeeSelect.value==='Other';
    if(otherFeeLabel) otherFeeLabel.style.display=isOther?'':'none';
    if(otherFeeInput){
      otherFeeInput.required=isOther;
      if(!isOther) otherFeeInput.value='';
    }
    const chosen=(d.fees||[]).find(f=>String(f.name)===String(configuredFeeSelect.value));
    const amountInput=configuredFeeForm?.querySelector("[name=amount]");
    if(chosen && amountInput) amountInput.value=Number(chosen.amount||0).toFixed(2);
  });

  configuredFeeForm?.addEventListener('submit',async e=>{
    e.preventDefault();
    const f=new FormData(configuredFeeForm),selected=String(f.get('name')||'').trim(),other=String(f.get('otherName')||'').trim();
    const name=selected==='Other'?other:selected,amount=Number(f.get('amount')||0);
    if(!name){alert('Please select a fee item or type the Other fee item.');return;}
    if(d.fees.some(x=>String(x.name).toLowerCase()===name.toLowerCase())){alert('That fee item has already been configured.');return;}
    const btn=configuredFeeForm.querySelector('button[type="submit"]'),oldText=btn?.textContent||'Save Fee Item';
    if(btn){btn.disabled=true;btn.textContent='Saving Fee Item...';}
    let itemStatus=configuredFeeForm.querySelector('.afisap-fee-save-status');if(!itemStatus){itemStatus=document.createElement('div');itemStatus.className='afisap-fee-save-status';configuredFeeForm.appendChild(itemStatus);}
    itemStatus.innerHTML='<span class="afisap-fee-spinner" aria-hidden="true"></span><span>Saving Fee Item...</span>';
    const feeId='FEE_ITEM|'+encodeURIComponent(name)+'|'+Date.now(),now=new Date().toISOString();
    const backendCheck=await afisapVerifyLiveFeesBackend();
    if(!backendCheck.success){if(btn){btn.disabled=false;btn.textContent=oldText;}alert(backendCheck.error);return;}
    const result=await afisapCloudPost({action:'create',sheet:'Fees',data:{
      'Fee ID':feeId,'Student ID':'','Student Name':'','Fee Item':name,'Amount Due':amount,'Amount Paid':0,
      'Balance':amount,'Date':'','Academic Year':'','Term':'','Date Created':now,'Last Updated':now
    }}).catch(()=>null);
    if(!result||result.success!==true){
      if(btn){btn.disabled=false;btn.textContent=oldText;}
      itemStatus.textContent='Unable to save fee item.';itemStatus.style.color='#a51d1d';
      alert('Fee item was not saved to Google Sheets.'+(result?.error?'\n\nReason: '+result.error:''));
      return;
    }
    const saved=result.record||{};
    const localItem={
      id:String(saved['Fee ID']||feeId),
      name:String(saved['Fee Item']||name),
      amount:Number(saved['Amount Due']??amount)
    };
    d.fees=[...(d.fees||[]).filter(x=>String(x.name||'').toLowerCase()!==name.toLowerCase()),localItem];
    persist();
    if(btn){btn.disabled=false;btn.textContent=oldText;}
    itemStatus.textContent='Fee item saved successfully.';
    nav('fees');
    alert('Fee item saved successfully to Google Sheets.');
  });

  const bulkScope=$('#bulkFeeScope');
  const bulkClass=$('#bulkFeeClass');
  const bulkClassLabel=$('#bulkFeeClassLabel');
  const bulkItem=$('#bulkFeeItem');
  const bulkAmount=$('#bulkFeeAmount');
  const bulkTerm=$('#bulkFeeTerm');
  const bulkProgress=$('#bulkFeeProgress');
  const bulkButton=$('#bulkFeeApplyBtn');

  const refreshBulkFeeScope=()=>{
    const all=bulkScope?.value==='all';
    if(bulkClassLabel) bulkClassLabel.style.display=all?'none':'';
    if(bulkClass) bulkClass.disabled=all;
    if(bulkClass) bulkClass.required=!all;
  };
  bulkScope?.addEventListener('change',refreshBulkFeeScope);
  refreshBulkFeeScope();

  const getOfficialBulkAmount=(feeItem,className)=>{
    const name=String(feeItem||'').trim();
    const configured=(d.fees||[]).find(f=>String(f.name||'').trim().toLowerCase()===name.toLowerCase());
    if(configured && Number.isFinite(Number(configured.amount))) {
      return {amount:Number(configured.amount),source:'Configured fee amount'};
    }
    if(Object.prototype.hasOwnProperty.call(officialFixedFeeAmounts,name)) {
      return {amount:Number(officialFixedFeeAmounts[name]),source:'Official school fee reference'};
    }
    if(name==='Textbook Fee' && className) {
      const textbookClasses=['BS 1','BS 2','BS 3','BS 4','BS 5','BS 6','NS 1','NS 2','KG 1','KG 2'];
      if(textbookClasses.includes(String(className).trim())) {
        return {amount:550,source:'Official textbook fee for this class'};
      }
    }
    return {amount:null,source:'Enter the actual amount due'};
  };

  const refreshBulkFeeAmount=()=>{
    const info=getOfficialBulkAmount(bulkItem?.value,bulkClass?.value);
    if(bulkAmount && info.amount!==null) bulkAmount.value=Number(info.amount).toFixed(2);
    const helper=document.getElementById('bulkFeeAmountHelp');
    if(helper){
      const item=String(bulkItem?.value||'').trim();
      if(!item) helper.textContent='This amount is applied to everyone first. You can adjust exceptions on the review screen.';
      else if(info.amount!==null) helper.textContent=`${info.source}. This amount is applied to everyone first; special students can be adjusted on the review screen.`;
      else helper.textContent='This fee has a variable/range or daily charge. Enter the actual amount due; special students can be adjusted on the review screen.';
    }
  };

  bulkItem?.addEventListener('change',refreshBulkFeeAmount);
  bulkClass?.addEventListener('change',refreshBulkFeeAmount);

  bulkTerm.value=String(d.school?.term||'').trim() || 'Term 1';

  $('#bulkFeeAssignmentForm')?.addEventListener('submit',async e=>{
    e.preventDefault();

    const f=new FormData(e.target);
    const scope=String(f.get('scope')||'class');
    const className=String(f.get('className')||'').trim();
    const feeItem=String(f.get('feeItem')||'').trim();
    const amountDue=Number(f.get('amountDue')||0);
    const academicYear=String(f.get('academicYear')||'').trim();
    const term=String(f.get('term')||'').trim();
    const skipExisting=f.get('skipExisting')==='on';

    if(scope!=='all' && !className){alert('Please select a class.');return;}
    if(!feeItem){alert('Please select a Fee Item.');return;}
    if(!Number.isFinite(amountDue)||amountDue<0){alert('Please enter a valid Amount Due.');return;}
    if(!academicYear){alert('Please enter the Academic Year.');return;}
    if(!term){alert('Please select the Term.');return;}

    const targets=(d.students||[]).filter(s=>{
      if(scope==='all') return true;
      const cls=String(s.class||s.className||s.classLevel||'').trim();
      return cls===className;
    });

    if(!targets.length){
      alert(scope==='all'?'No students are registered yet.':'No students were found in the selected class.');
      return;
    }

    const existing=(d.feeRecords||[]);
    const samePeriod=(r)=>String(r.academicYear||r.year||'').trim()===academicYear &&
      String(r.term||'').trim()===term &&
      String(r.feeItem||'').trim().toLowerCase()===feeItem.toLowerCase();

    const hasExisting=(s)=>existing.some(r=>{
      if(!samePeriod(r)) return false;
      const sidCandidates=[s.id,s.sid,s.studentId,s["Student ID"]]
        .filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").map(String);
      const recordIds=[r.studentId,r.studentSid,r.sid,r["Student ID"]]
        .filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").map(String);
      return sidCandidates.some(id=>recordIds.includes(id));
    });

    // Students already carrying the exact fee/period can be skipped, while
    // new students are presented with a review table. The standard amount is
    // prefilled, so the administrator only edits exceptional students.
    const candidates=targets.filter(s=>!(skipExisting && hasExisting(s)));
    const skipped=targets.length-candidates.length;

    if(!candidates.length){
      alert(`No new fee records were created. ${skipped} student(s) already have this fee for ${academicYear} / ${term}.`);
      return;
    }

    const nameOf=(student)=>String(
      student.name ||
      student.fullName ||
      [student.firstName,student.middleName,student.surname,student.otherName].filter(Boolean).join(' ') ||
      'Unnamed Student'
    ).trim();

    const reviewHtml=`
      <div class='panel' style='margin:0;border:1px solid #ddd;padding:14px;background:#fff'>
        <div class='panel-title'>
          <div>
            <h3>Review Student Fee Assignment</h3>
            <span>${esc(feeItem)} · ${esc(academicYear)} · ${esc(term)}</span>
          </div>
        </div>
        <p class='muted'>
          Standard amount: <b>GHS ${amountDue.toFixed(2)}</b>.
          The system has prefilled this amount for every new student.
          <b>Only change the students whose actual amount is different.</b>
        </p>

        <div style='display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0'>
          <button type='button' class='secondary' id='bulkFeeReviewReset'>Reset All to GHS ${amountDue.toFixed(2)}</button>
          <span class='muted'>Students to assign: <b>${candidates.length}</b>${skipped?` · Already existing/skipped: <b>${skipped}</b>`:''}</span>
        </div>

        <div class='table' style='max-height:55vh;overflow:auto'>
          <table>
            <tr><th>#</th><th>Student</th><th>Class</th><th>Amount Due (GHS)</th></tr>
            ${candidates.map((s,i)=>{
              const cls=String(s.class||s.className||s.classLevel||'').trim();
              return `<tr>
                <td>${i+1}</td>
                <td><b>${esc(nameOf(s))}</b><br><small>${esc(s.sid||s.studentId||s["Student ID"]||s.id||'')}</small></td>
                <td>${esc(cls)}</td>
                <td><input class='bulk-fee-review-amount' data-index='${i}' type='number' min='0' step='.01' value='${amountDue.toFixed(2)}' style='width:140px'></td>
              </tr>`;
            }).join('')}
          </table>
        </div>

        <div class='panel' style='margin-top:14px;background:#f8fafc;border:1px solid #e5e7eb'>
          <b>How this works</b>
          <p class='muted' style='margin:6px 0 0'>
            For example, if the standard fee is GHS 200, you can leave all students at GHS 200,
            change Kwaku to GHS 60 and Ama to GHS 200, then apply once.
            Each student receives a separate fee account record.
          </p>
        </div>

        <div style='display:flex;gap:10px;flex-wrap:wrap;margin-top:15px'>
          <button type='button' class='primary' id='confirmBulkFeeAssignment'>Apply ${candidates.length} Student Fee Records</button>
          <button type='button' class='secondary' id='cancelBulkFeeReview'>Cancel</button>
        </div>
        <div id='bulkFeeReviewProgress' class='report-help-text afisap-fee-bulk-progress' style='display:none;margin-top:10px'>
          <div class='afisap-fee-loading-logo' aria-hidden='true'>
            <img src='afisap_royal_academy_logo.png' alt=''>
          </div>
          <div class='afisap-fee-progress-copy'></div>
        </div>
      </div>`;

    modal('Bulk Fee Assignment — Review Before Saving',reviewHtml);

    const reviewModal=document.getElementById('modal');
    const reviewAmounts=()=>Array.from(reviewModal?.querySelectorAll('.bulk-fee-review-amount')||[]);

    reviewModal?.querySelector('#bulkFeeReviewReset')?.addEventListener('click',()=>{
      reviewAmounts().forEach(input=>{input.value=amountDue.toFixed(2);});
    });

    reviewModal?.querySelector('#cancelBulkFeeReview')?.addEventListener('click',()=>{
      reviewModal.classList.remove('show');
    });

    reviewModal?.querySelector('#confirmBulkFeeAssignment')?.addEventListener('click',async()=>{
      const inputs=reviewAmounts();
      if(inputs.length!==candidates.length){
        alert('The student fee review could not be completed. Please close and try again.');
        return;
      }

      const amounts=inputs.map(input=>Number(input.value||0));
      if(amounts.some(v=>!Number.isFinite(v)||v<0)){
        alert('Please enter a valid non-negative amount for every student.');
        return;
      }

      const confirmed=confirm(
        `You are about to assign "${feeItem}" to ${candidates.length} student(s).`+
        `\n\nAcademic Year: ${academicYear}\nTerm: ${term}`+
        (skipped?`\n\n${skipped} existing record(s) will remain unchanged.`:'')+
        `\n\nContinue?`
      );
      if(!confirmed) return;

      const now=new Date().toISOString();
      const date=now.slice(0,10);
      const records=candidates.map((student,i)=>{
        const sid=String(student.sid||student.studentId||student["Student ID"]||student.id||'');
        const studentName=nameOf(student);
        const due=Number(amounts[i]||0);
        const feeId=`FEE|${encodeURIComponent(feeItem)}|${Date.now()}-${i}-${Math.random().toString(36).slice(2,7)}`;
        return {
          local:{
            id:feeId,
            feeId:feeId,
            studentId:String(student.id),
            studentSid:sid,
            admissionNumber:String(student.admissionNumber||student["Admission Number"]||''),
            studentName,
            feeItem,
            amountDue:due,
            amountPaid:0,
            balance:due,
            date,
            academicYear,
            term,
            dateCreated:now,
            lastUpdated:now
          },
          cloud:{
            "Fee ID":feeId,
            "Student ID":sid,
            "Admission Number":String(student.admissionNumber||student["Admission Number"]||''),
            "Student Name":studentName,
            "Fee Item":feeItem,
            "Amount Due":due,
            "Amount Paid":0,
            "Balance":due,
            "Date":date,
            "Academic Year":academicYear,
            "Term":term,
            "Date Created":now,
            "Last Updated":now
          }
        };
      });

      const button=reviewModal.querySelector('#confirmBulkFeeAssignment');
      const cancel=reviewModal.querySelector('#cancelBulkFeeReview');
      const progress=reviewModal.querySelector('#bulkFeeReviewProgress');
      const setBulkFeeProgress=(message)=>{
        if(!progress)return;
        progress.style.display='';
        const copy=progress.querySelector('.afisap-fee-progress-copy');
        if(copy)copy.textContent=message;
        else progress.textContent=message;
      };
      if(button) button.disabled=true;
      if(cancel) cancel.disabled=true;
      if(progress){
        progress.style.display='';
        setBulkFeeProgress(`Preparing ${records.length} fee records...`);
      }

      try{
        const backendCheck=await afisapVerifyLiveFeesBackend();
        if(!backendCheck.success)throw new Error(backendCheck.error);
        let result=await afisapCloudPost({
          action:'bulkCreateFees',
          sheet:'Fees',
          records:records.map(x=>x.cloud)
        });

        if(!result || result.success!==true){
          setBulkFeeProgress('Bulk cloud save unavailable; using the existing verified save method...');
          let created=0;
          for(let i=0;i<records.length;i++){
            const one=await afisapCloudPost({action:'create',sheet:'Fees',data:records[i].cloud});
            if(!one || one.success!==true) throw new Error(one?.error||`Failed to save ${nameOf(candidates[i])}.`);
            created++;
            setBulkFeeProgress(`Saving fee records to Google Sheets: ${created}/${records.length}`);
          }
          result={success:true,created};
        }

        const createdCount=Number(result.created||0);
        const savedRecords=Array.isArray(result.records)?result.records:[];
        setBulkFeeProgress(`Saved ${createdCount} fee record(s) to Google Sheets. Updating this screen...`);

        // The backend already returned the exact rows it wrote. Update the
        // current browser state from that authoritative response instead of
        // downloading every school sheet again.
        const studentBySid=new Map((d.students||[]).map(s=>[
          String(s.sid||s.studentId||s["Student ID"]||s.id||'').trim(),s
        ]));
        const localSaved=savedRecords.map(r=>{
          const sid=String(r["Student ID"]||'').trim();
          const student=studentBySid.get(sid);
          return {
            id:String(r["Fee ID"]||''),
            feeId:String(r["Fee ID"]||''),
            sheetRow:Number(r["__SheetRow"]||0),
            studentId:student?String(student.id):sid,
            studentSid:sid,
            admissionNumber:String(r["Admission Number"]||'').trim(),
            studentName:String(r["Student Name"]||'').trim(),
            feeItem:String(r["Fee Item"]||feeItem).trim(),
            amountDue:Number(r["Amount Due"]||0),
            amountPaid:Number(r["Amount Paid"]||0),
            balance:Number(r["Balance"]??Math.max(0,Number(r["Amount Due"]||0)-Number(r["Amount Paid"]||0))),
            date:String(r["Date"]||date).trim(),
            academicYear:String(r["Academic Year"]||academicYear).trim(),
            term:String(r["Term"]||term).trim(),
            dateCreated:String(r["Date Created"]||now).trim(),
            lastUpdated:String(r["Last Updated"]||now).trim()
          };
        });
        if(localSaved.length){
          const newIds=new Set(localSaved.map(r=>r.id));
          d.feeRecords=[...(d.feeRecords||[]).filter(r=>!newIds.has(String(r.feeId||r.id||''))),...localSaved];
        }
        persist();

        setBulkFeeProgress(`Completed: ${createdCount} fee record(s) saved.`);

        setTimeout(()=>{
          reviewModal.classList.remove('show');
          nav('fees');
          alert(
            `Bulk fee assignment completed.\n\n`+
            `Fee: ${feeItem}\n`+
            `Students assigned: ${createdCount}\n`+
            `Skipped existing: ${skipped}\n`+
            `Academic Year: ${academicYear}\n`+
            `Term: ${term}`
          );
        },250);
      }catch(error){
        console.error('AFISAP bulk fee assignment error:',error);
        setBulkFeeProgress('The assignment failed; nothing was saved locally.');
        alert(
          'The bulk fee assignment was not completed.\n\n'+
          'Reason: '+(error&&error.message?error.message:'Cloud database request failed.')+
          '\n\nNothing was saved locally. Google Sheets remains the source of truth.'
        );
        if(button) button.disabled=false;
        if(cancel) cancel.disabled=false;
      }
    });
  });


}
function settings(){
  $('#app').innerHTML=`<form class='panel form' id='schoolSettingsForm'>
    <label>School Name
      <input id='n' value='${esc(d.school.name)}' required>
    </label>

    <label>Academic Year
      <input id='y' list='academicYearOptions' value='${esc(d.school.year)}'
             placeholder='Type an academic year, e.g. 2026/2027'
             autocomplete='off' required>
      <datalist id='academicYearOptions'>
        <option value='2025/2026'></option>
        <option value='2026/2027'></option>
        <option value='2027/2028'></option>
        <option value='2028/2029'></option>
        <option value='2029/2030'></option>
        <option value='2030/2031'></option>
      </datalist>
    </label>

    <label>Current Term
      <select id='t' required>
        <option value='Term 1' ${d.school.term==='Term 1'?'selected':''}>Term 1</option>
        <option value='Term 2' ${d.school.term==='Term 2'?'selected':''}>Term 2</option>
        <option value='Term 3' ${d.school.term==='Term 3'?'selected':''}>Term 3</option>
      </select>
    </label>

    <label>Head of School<input id='h' value='${esc(d.school.head)}'></label>
    <label>Telephone<input id='p' value='${esc(d.school.phone)}'></label>
    <label>Email<input id='e' value='${esc(d.school.email)}' type='email'></label>
    <label class='wide'>Address<textarea id='a'>${esc(d.school.address)}</textarea></label>

    <div class='wide'>
      <button class='primary' type='submit'>Save School Details</button>
    </div>
  </form>`;

  $('#schoolSettingsForm').addEventListener('submit',async function(e){
    e.preventDefault();
    const academicYear=$('#y').value.trim();
    if(!academicYear){alert('Please enter or choose an Academic Year.');return;}
    const previous=d.school;
    const candidate={
      name:$('#n').value.trim(),year:academicYear,term:$('#t').value,
      head:$('#h').value.trim(),phone:$('#p').value.trim(),email:$('#e').value.trim(),address:$('#a').value.trim()
    };
    const button=this.querySelector('button[type="submit"]');
    const oldText=button?.textContent||'Save School Details';
    if(button){button.disabled=true;button.textContent='Saving...';}
    afisapShowUploadLoader("Saving School Details","Saving school information to Google Sheets...",15);
    d.school=candidate;
    try{
      afisapUpdateUploadLoader("Updating the official System Settings sheet...",55);
      const result=await afisapSaveCentralConfig();
      if(!result||result.success!==true)throw new Error(String(result?.error||"Google Sheets did not confirm the update."));
      afisapUpdateUploadLoader("School details saved successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,220));
      afisapHideUploadLoader();
      alert('School details saved successfully to Google Sheets.');
    }catch(error){
      d.school=previous;
      afisapUpdateUploadLoader("School details could not be saved.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert('School details were not saved to Google Sheets.\n\nReason: '+String(error?.message||error||'Unknown error'));
    }finally{
      if(button){button.disabled=false;button.textContent=oldText;}
    }
  });
}
function modal(title,body){$('#modal').innerHTML=`<div class='modalbox'><h3>${title}</h3>${body}<br><button onclick="$('#modal').classList.remove('show')">Cancel</button></div>`;$('#modal').classList.add('show')};function openStudent(){
  modal('Add New Student',`
    <form id="studentEntryForm" class="form">
      <label>Student ID
        <input name="sid" required placeholder="AF-001">
      </label>
      <label>Surname
        <input name="surname" required>
      </label>
      <label>First Name
        <input name="firstName" required>
      </label>
      <label>Middle/Other Name
        <input name="middleName">
      </label>
      <label>Date of Birth
        <input name="dob" type="date">
      </label>
      <label>Admission Date
        <input name="admissionDate" type="date">
      </label>
      <label>Gender
        <select name="gender">
          <option>Male</option><option>Female</option>
        </select>
      </label>

      <label class="wide student-photo-field">
        <strong>Student Passport Photo</strong>
        <div style="margin-top:8px">
          <button type="button" class="primary" id="afisapDriveChoosePassport">
            Choose Passport Photo
          </button>
          <input name="photoFile" id="afisapDrivePassportInput"
                 type="file" accept="image/jpeg,image/png,image/webp"
                 style="display:none">
        </div>
        <small class="upload-help" style="display:block;margin-top:7px">
          The selected photo will be previewed here and automatically uploaded to Google Drive when you save the student.
        </small>

        <div id="afisapDrivePassportPreview"
             style="margin-top:12px;min-height:180px;display:flex;align-items:center;justify-content:center;border:1px dashed #ccc;border-radius:10px;padding:12px;background:#fafafa">
          <span style="opacity:.65">📷 Google Drive passport photo preview</span>
        </div>

        <div id="studentDriveStatus" style="margin-top:8px;font-size:.9rem;min-height:20px"></div>
      </label>

      <label class="wide">Class
        <select name="class" id="studentClassSelect" required>
          <option value="">Select Class</option>
          ${afisapCentralClassNames().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
        </select>
      </label>

      <label>Guardian
        <input name="guardian">
      </label>
      <label>Guardian Contact
        <input name="contact">
      </label>
      <label>Guardian Email
        <input name="email" type="email">
      </label>
      <label class="wide">Address
        <textarea name="address"></textarea>
      </label>

      <div class="wide">
        <button type="submit" class="primary">Save Student</button>
      </div>
    </form>`);

  const form=document.getElementById("studentEntryForm");
  const photoInput=document.getElementById("afisapDrivePassportInput");
  const chooseBtn=document.getElementById("afisapDriveChoosePassport");
  const preview=document.getElementById("afisapDrivePassportPreview");
  const driveStatus=document.getElementById("studentDriveStatus");
  let photoData="";

  chooseBtn?.addEventListener("click",()=>photoInput?.click());

  photoInput?.addEventListener("change",function(){
    const file=this.files?.[0];
    if(!file){
      photoData="";
      preview.innerHTML='<span style="opacity:.65">📷 Google Drive passport photo preview</span>';
      return;
    }

    if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){
      this.value="";
      photoData="";
      preview.innerHTML='<span style="color:#b00020">Please select a JPG, PNG or WebP image.</span>';
      return;
    }

    const reader=new FileReader();
    reader.onload=()=>{
      photoData=String(reader.result||"");
      preview.innerHTML=`
        <img src="${photoData}" alt="Passport photo preview"
             style="max-width:170px;max-height:190px;width:auto;height:auto;object-fit:cover;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12)">
        <div style="margin-top:7px;font-size:.85rem;opacity:.7">${esc(file.name)}</div>
      `;
      if(driveStatus) driveStatus.textContent="Photo selected. It will be uploaded automatically when you save the student.";
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit",async function(e){
    e.preventDefault();

    const f=new FormData(form);
    const student={
      id:Date.now(),
      sid:String(f.get("sid")||"").trim(),
      surname:String(f.get("surname")||"").trim(),
      firstName:String(f.get("firstName")||"").trim(),
      middleName:String(f.get("middleName")||"").trim(),
      name:[String(f.get("firstName")||"").trim(),String(f.get("middleName")||"").trim(),String(f.get("surname")||"").trim()].filter(Boolean).join(" "),
      dob:f.get("dob")||"",
      admissionDate:f.get("admissionDate")||"",
      gender:f.get("gender")||"",
      class:String(f.get("class")||"").trim(),
      guardian:String(f.get("guardian")||"").trim(),
      contact:String(f.get("contact")||"").trim(),
      email:String(f.get("email")||"").trim(),
      address:String(f.get("address")||"").trim(),
      photo:photoData
    };

    if(!student.sid||!student.surname||!student.firstName||!student.class){
      alert("Please enter Student ID, Surname, First Name and select a Class.");
      return;
    }

    if(!student.photo){
      alert("Please choose the student's passport photo.");
      return;
    }

    if(d.students.some(s=>String(s.sid).toLowerCase()===student.sid.toLowerCase())){
      alert("That Student ID already exists. Please use a different Student ID.");
      return;
    }

    try{
      afisapShowUploadLoader("Saving Student","Saving student information to Google Sheets...",15);
      if(driveStatus) driveStatus.textContent="Saving student to Google Sheets...";

      const cloudResult=await afisapCloudCreateStudent(student);
      if(!cloudResult||cloudResult.success!==true){
        const idx=d.students.findIndex(x=>String(x.id)===String(student.id));
        if(idx!==-1)d.students.splice(idx,1);
        save();
        if(driveStatus) driveStatus.textContent="Google Sheets save failed.";
        alert("Student could not be saved to Google Sheets."+((cloudResult&&cloudResult.error)?"\n\nReason: "+cloudResult.error:"\n\nPlease check the Apps Script deployment and try again."));
        afisapHideUploadLoader();
        return;
      }

      afisapUpdateUploadLoader("Uploading passport photo to Google Drive...",35);
      if(driveStatus) driveStatus.textContent="Uploading passport photo to Google Drive...";

      const selectedFile=photoInput?.files?.[0];
      if(!selectedFile) throw new Error("The selected passport photo is unavailable.");

      const uploadFile=await afisapPreparePassportPhoto(selectedFile);
      const driveResult=await afisapDriveUpload(uploadFile,"student-passports",student.sid);
      if(!driveResult||!driveResult.fileId) throw new Error("Google Drive returned no File ID.");
      afisapUpdateUploadLoader("Passport photo uploaded. Confirming and linking it to the student...",85);

      // Google Sheets/Drive are authoritative. Reload the confirmed student
      // and Drive reference instead of committing a browser-created copy.
      afisapUpdateUploadLoader("Student and passport photo saved successfully.",100);
      await afisapSyncAllFromCloud();
      await new Promise(resolve=>setTimeout(resolve,250));
      if(driveStatus) driveStatus.textContent="✓ Student and passport photo saved successfully.";

      $('#modal').classList.remove('show');
      nav('students');
      alert("Student added successfully. Passport photo saved to Google Drive.");
      afisapHideUploadLoader();
    }catch(error){
      console.error("AFISAP single Drive passport workflow:",error);
      if(driveStatus) driveStatus.textContent="Student saved, but the passport photo upload failed.";
      await afisapSyncAllFromCloud().catch(()=>{});
      alert("Student was saved to Google Sheets, but the passport photo could not be saved to Google Drive. The screen has been reconciled from the central database.\n\nReason: "+String(error.message||error));
      afisapHideUploadLoader();
    }
  });
}

/* AFISAP CLOUD DATABASE INTEGRATION — TEACHERS MODULE */
function afisapStaffToCloud(s){
  const created=s.dateCreated||new Date().toISOString();
  return {
    "Staff ID":String(s.sid||"").trim(),
    "First Name":String(s.firstName||"").trim(),
    "Middle Name":String(s.middleName||"").trim(),
    "Last Name":String(s.surname||"").trim(),
    "Full Name":String(s.name||[s.firstName,s.middleName,s.surname].filter(Boolean).join(" ")).trim(),
    "Gender":String(s.gender||"").trim(),
    "Date of Birth":String(s.dob||s.dateOfBirth||"").trim(),
    "Position":String(s.position||"").trim(),
    "Class":String(s.class||"").trim(),
    "Subject":String(s.subject||"").trim(),
    "Phone":String(s.phone||"").trim(),
    "Ghana Card":String(s.ghanaCard||s.ghanaCardNumber||"").trim(),
    "Ghana Card Number":String(s.ghanaCard||s.ghanaCardNumber||"").trim(),
    "Email":String(s.email||"").trim(),
    "Appointment Date":afisapDateOnly(s.appointmentDate||""),
    "Address":String(s.address||"").trim(),
    "Passport Photo":String(s.passportPhotoFileId||"").trim(),
    "Status":String(s.status||"Active").trim(),
    "Date Created":created,
    "Last Updated":new Date().toISOString()
  };
}

function afisapCloudToStaff(r){
  return {
    id:Date.now()+Math.floor(Math.random()*100000),
    sid:String(r["Staff ID"]||r["StaffID"]||"").trim(),
    firstName:String(r["First Name"]||"").trim(),
    middleName:String(r["Middle Name"]||"").trim(),
    surname:String(r["Last Name"]||r["Surname"]||"").trim(),
    name:String(r["Full Name"]||r["Name"]||[r["First Name"],r["Middle Name"],r["Last Name"]].filter(Boolean).join(" ")).trim(),
    gender:String(r["Gender"]||"").trim(),
    dob:String(r["Date of Birth"]||r["DOB"]||"").trim(),
    dateOfBirth:String(r["Date of Birth"]||r["DOB"]||"").trim(),
    position:String(r["Position"]||"").trim(),
    class:String(r["Class"]||"").trim(),
    subject:String(r["Subject"]||"").trim(),
    phone:String(r["Phone"]||"").trim(),
    ghanaCard:String(r["Ghana Card"]||r["Ghana Card Number"]||"").trim(),
    ghanaCardNumber:String(r["Ghana Card"]||r["Ghana Card Number"]||"").trim(),
    email:String(r["Email"]||"").trim(),
    appointmentDate:afisapDateOnly(r["Appointment Date"]),
    address:String(r["Address"]||"").trim(),
    status:String(r["Status"]||"Active").trim(),
    dateCreated:String(r["Date Created"]||"").trim(),
    passportPhotoFileId:afisapDriveFileId(r["Passport Photo"]||r["Passport Photo URL"]||""),
    passportPhotoUrl:afisapStudentPhotoSource(r["Passport Photo"],r["Passport Photo URL"],""),
    photo:afisapStudentPhotoSource(r["Passport Photo"],r["Passport Photo URL"],"")
  };
}

async function afisapCloudCreateStaff(s){
  const payload={
    action:"create",
    sheet:"Teachers",
    data:afisapStaffToCloud(s)
  };

  // First attempt.
  let result=await afisapCloudPost(payload);
  if(result && result.success===true) return result;

  // A transient Apps Script/JSONP request can fail even though the record
  // has been accepted. Check the actual Teachers sheet before retrying.
  try{
    const existing=await afisapCloudJsonp({
      action:"search",
      sheet:"Teachers",
      field:"Staff ID",
      value:String(s.sid||"").trim()
    });
    if(existing && existing.success===true &&
       Array.isArray(existing.records) && existing.records.length){
      return {success:true,alreadyExists:true,record:existing.records[existing.records.length-1]};
    }
  }catch(e){
    console.warn("AFISAP teacher cloud verification failed:",e);
  }

  // Retry once with the same payload.
  result=await afisapCloudPost(payload);
  if(result && result.success===true) return result;

  return result || {
    success:false,
    error:"Teacher record could not be saved to Google Sheets."
  };
}
function afisapCloudUpdateStaff(s,originalSid){
  return afisapCloudPost({action:"update",sheet:"Teachers",idField:"Staff ID",idValue:String(originalSid||s.sid||""),data:afisapStaffToCloud(s)});
}
function afisapCloudDeleteStaff(sid){
  return afisapCloudPost({action:"delete",sheet:"Teachers",idField:"Staff ID",idValue:String(sid||"")});
}
async function afisapSyncStaffFromCloud(){
  try{
    const result=await afisapCloudJsonp({action:"read",sheet:"Teachers"});
    if(!result || !result.success || !Array.isArray(result.records)) return;
    const records=result.records.filter(r=>String(r["Staff ID"]||"").trim());
    if(!records.length) return;
    let changed=false;
    records.forEach(record=>{
      const sid=String(record["Staff ID"]||"").trim();
      const local=(d.staff||[]).find(s=>String(s.sid||"").trim()===sid);
      if(local){
        const oldPhoto=local.photo||"", oldPhotoFileId=local.passportPhotoFileId||"", oldPhotoUrl=local.passportPhotoUrl||"", oldId=local.id;
        const cloudStaff=afisapCloudToStaff(record);
        Object.assign(local,cloudStaff,{id:oldId});
        if(!local.photo && (oldPhotoFileId||oldPhotoUrl||oldPhoto)){
          local.passportPhotoFileId=afisapDriveFileId(oldPhotoFileId||oldPhotoUrl||oldPhoto);
          local.passportPhotoUrl=afisapStudentPhotoSource(oldPhotoFileId,oldPhotoUrl,oldPhoto);
          local.photo=local.passportPhotoUrl;
        }
        changed=true;
      }else{
        d.staff.push(afisapCloudToStaff(record)); changed=true;
      }
    });
    if(changed){
      save();
      if(typeof staff==="function" && document.getElementById("app")){try{staff();}catch(e){}}
    }
  }catch(error){ console.warn("AFISAP cloud teacher sync unavailable:",error); }
}

function openStaff(){
  modal('Add Teacher / Staff',`
    <form id="staffEntryForm" class="form">
      <label>Staff ID
        <input name="sid" required placeholder="STAFF-001">
      </label>
      <label>Surname
        <input name="surname" required>
      </label>
      <label>First Name
        <input name="firstName" required>
      </label>
      <label>Middle/Other Name
        <input name="middleName">
      </label>

      <label>Date of Birth
        <input name="dob" type="date">
      </label>

      <label>Position
        <select name="position" id="staffPosition" required>
          <option value="">Select Position</option>
          <option>Teacher</option>
          <option>Headteacher</option>
          <option>Head of School</option>
          <option>Administrator</option>
          <option>Accountant</option>
          <option>Admissions Officer</option>
          <option>Other</option>
        </select>
      </label>

      <label id="otherPositionWrap" style="display:none">Other Position
        <input name="otherPosition" id="otherPosition" placeholder="Type the position">
      </label>

      <label class="wide">Teacher / Staff Passport Photo
        <input name="photoFile" id="staffPhotoFile" type="file"
               accept="image/jpeg,image/png,image/webp" required>
        <small class="upload-help">Select the teacher/staff passport photograph.</small>
        <div id="staffPhotoPreview" class="photo-upload-preview staff-photo-preview">
          <span class="photo-preview-placeholder">📷 Teacher/staff photo preview will appear here</span>
        </div>
        <div id="staff-passport-upload-drive" style="margin-top:7px;font-size:.9rem;min-height:20px"></div>
      </label>

      <label>Assigned Class(es)
        <small style="display:block;color:#64748b;margin:4px 0">Select 1, 2 or 3 classes. Hold Ctrl while selecting multiple classes on a computer.</small>
        <select name="class" multiple size="6">
          ${afisapStaffClassOptions("")}
        </select>
      </label>

      <label>Subject
        <input name="subject">
      </label>


      <label>Ghana Card Number
        <input name="ghanaCard" type="text" placeholder="GHA-XXXXXXXXX-X">
      </label>

      <label>Telephone
        <input name="phone">
      </label>

      <label>Appointment Date
        <input name="appointmentDate" type="date">
      </label>

      <label>Email
        <input name="email" type="email">
      </label>

      <div class="wide">
        <button type="submit" class="primary">Save Teacher / Staff</button>
      </div>
    </form>`);

  const form = document.getElementById("staffEntryForm");
  const position = document.getElementById("staffPosition");
  const otherWrap = document.getElementById("otherPositionWrap");
  const otherInput = document.getElementById("otherPosition");

  position.addEventListener("change",()=>{
    const isOther = position.value === "Other";
    otherWrap.style.display = isOther ? "block" : "none";
    otherInput.required = isOther;
    if(!isOther) otherInput.value = "";
  });

  const photoInput = document.getElementById("staffPhotoFile");
  const preview = document.getElementById("staffPhotoPreview");
  let photoData = "";

  photoInput.addEventListener("change", function(){
    const file = this.files && this.files[0];

    if(!file){
      photoData = "";
      preview.innerHTML = '<span class="photo-preview-placeholder">📷 Teacher/staff photo preview will appear here</span>';
      return;
    }

    if(!file.type.startsWith("image/")){
      this.value = "";
      photoData = "";
      preview.innerHTML = '<span class="photo-error">Please select a JPG, PNG or WebP image.</span>';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(){
      photoData = reader.result;
      preview.innerHTML = `
        <img src="${photoData}" alt="Teacher/staff passport photo preview">
        <div class="photo-preview-name">${esc(file.name)}</div>
        <div class="photo-preview-ok">✓ Photo selected</div>
      `;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async function(e){
    e.preventDefault();

    const f = new FormData(form);

    const sid = String(f.get("sid") || "").trim();
    const surname = String(f.get("surname") || "").trim();
    const firstName = String(f.get("firstName") || "").trim();
    const middleName = String(f.get("middleName") || "").trim();
    const position = String(f.get("position") || "").trim();
    const otherPosition = String(f.get("otherPosition") || "").trim();
    const finalPosition = position === "Other" ? otherPosition : position;

    if (!sid || !surname || !firstName || !finalPosition) {
      alert("Please enter Staff ID, Surname, First Name and select a Position.");
      return;
    }

    if(d.staff.some(x=>String(x.sid||"").trim().toLowerCase()===sid.toLowerCase())){
      alert("That Staff ID already exists. Please use a different Staff ID.");
      return;
    }

    if(!photoData){
      alert("Please select the teacher/staff passport photo.");
      return;
    }

    let assignedClasses=[];
    try{assignedClasses=afisapSelectedStaffClasses(form)}catch(err){alert(err.message);return;}

    const person = {
      id: Date.now(),
      sid: sid,
      surname: surname,
      firstName: firstName,
      middleName: middleName,
      name: [firstName, middleName, surname].filter(Boolean).join(" "),
      position: finalPosition,
      class: assignedClasses.join(", "),
      subject: String(f.get("subject") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      ghanaCard: String(f.get("ghanaCard") || "").trim(),
      email: String(f.get("email") || "").trim(),
      appointmentDate: String(f.get("appointmentDate") || "").trim(),
      dob: String(f.get("dob") || "").trim(),
      photo: photoData,
      status: "Active",
      dateCreated: new Date().toISOString()
    };

    // Use the SAME AFISAP loading mechanism already used by the working
    // student and administrator photo uploads. Do not alter the save/upload
    // architecture; this only makes the existing Teacher/Staff operation visible.
    afisapShowUploadLoader(
      "Saving Teacher / Staff",
      "Saving teacher / staff information to Google Sheets...",
      15
    );

    try{
      const selectedFile=photoInput && photoInput.files && photoInput.files[0];
      if(!selectedFile)throw new Error("The selected teacher/staff passport photo file is unavailable.");

      afisapUpdateUploadLoader("Preparing teacher / staff passport photo...",35);
      const uploadFile=await afisapPreparePassportPhoto(selectedFile);

      afisapUpdateUploadLoader("Uploading teacher / staff passport photo to Google Drive...",55);
      const driveResult=await afisapDriveUpload(uploadFile,"staff-passports",person.sid);
      if(!driveResult || !driveResult.fileId)throw new Error("Google Drive did not return a File ID.");

      person.passportPhotoFileId=String(driveResult.fileId);
      person.passportPhotoUrl=afisapDriveFileUrl(person.passportPhotoFileId);
      person.photo=person.passportPhotoUrl;

      afisapUpdateUploadLoader("Saving teacher / staff information to Google Sheets...",80);
      const cloudResult=await afisapCloudCreateStaff(person);
      if(!cloudResult || cloudResult.success!==true){
        throw new Error(String(cloudResult&&cloudResult.error||"Unknown Google Sheets error."));
      }

      d.staff.push(person);
      afisapUpdateUploadLoader("Teacher / Staff and passport photo saved successfully.",100);
      console.log("AFISAP: Staff passport photo saved to Google Drive and linked in Teachers sheet.",person.sid,person.passportPhotoFileId);

      await new Promise(resolve=>setTimeout(resolve,250));
      afisapHideUploadLoader();
      if(typeof $('#modal') !== "undefined" && $('#modal')) $('#modal').classList.remove('show');
      nav('staff');

    }catch(error){
      console.error("AFISAP: Teacher / Staff save or passport upload failed:",error);
      const message=String(error&&error.message||error||"Unknown error");
      afisapUpdateUploadLoader("Teacher / Staff operation could not be completed.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert("Teacher / staff operation was not fully completed.\n\nReason: "+message);
    }
  });
}

/* AFISAP CLOUD DATABASE INTEGRATION — CLASSES MODULE */
function afisapClassToCloud(c){
  const now=new Date().toISOString();
  return {
    "Class ID":String(c.classId||c.id||"").trim(),
    "Class Name":String(c.name||"").trim(),
    "Level/Grade":String(c.level||"").trim(),
    "Academic Year":String(c.academicYear||d.school?.year||"").trim(),
    "Class Teacher":String(c.teacher||"").trim(),
    "Capacity":String(c.capacity??"").trim(),
    "Status":String(c.status||"Active").trim(),
    "Date Created":String(c.dateCreated||now).trim(),
    "Last Updated":now
  };
}
function afisapCloudToClass(r){
  return {
    id:String(r["Class ID"]||Date.now()),
    classId:String(r["Class ID"]||"").trim(),
    name:String(r["Class Name"]||"").trim(),
    level:String(r["Level/Grade"]||"").trim(),
    academicYear:String(r["Academic Year"]||"").trim(),
    teacher:String(r["Class Teacher"]||"").trim(),
    capacity:String(r["Capacity"]||"").trim(),
    status:String(r["Status"]||"Active").trim(),
    dateCreated:String(r["Date Created"]||"").trim()
  };
}
function afisapCloudCreateClass(c){
  return afisapCloudPost({action:"create",sheet:"Classes",data:afisapClassToCloud(c)});
}
function afisapCloudUpdateClass(c){
  return afisapCloudPost({
    action:"update",
    sheet:"Classes",
    idField:"Class ID",
    idValue:String(c.classId||c.id||""),
    data:afisapClassToCloud(c)
  });
}
function afisapCloudDeleteClass(classId){
  return afisapCloudPost({
    action:"delete",
    sheet:"Classes",
    idField:"Class ID",
    idValue:String(classId||"")
  });
}
function afisapCloudDeleteResult(resultId){
  const id=String(resultId??"").trim();
  if(!id){
    return Promise.resolve({
      success:false,
      error:"Result ID is required for deletion."
    });
  }
  return afisapCloudPost({
    action:"delete",
    sheet:"Results",
    idField:"Result ID",
    idValue:id
  });
}
async function afisapSyncClassesFromCloud(){
  try{
    const result=await afisapCloudJsonp({action:"read",sheet:"Classes"});
    if(!result || !result.success || !Array.isArray(result.records)) return;
    const records=result.records.filter(r=>String(r["Class ID"]||"").trim());
    if(!records.length) return;
    let changed=false;
    records.forEach(record=>{
      const classId=String(record["Class ID"]||"").trim();
      const className=String(record["Class Name"]||"").trim();
      let local=(d.classes||[]).find(c=>String(c.classId||"")===classId);
      if(!local && className){
        local=(d.classes||[]).find(c=>String(c.name||"").trim().toLowerCase()===className.toLowerCase());
      }
      if(local){
        const oldId=local.id;
        Object.assign(local,afisapCloudToClass(record),{id:oldId,classId:classId});
        changed=true;
      }else{
        d.classes.push(afisapCloudToClass(record));
        changed=true;
      }
    });
    if(changed){
      save();
      if(typeof classes==="function" && document.getElementById("app")){
        try{classes();}catch(e){}
      }
    }
  }catch(error){
    console.warn("AFISAP cloud class sync unavailable:",error);
  }
}

async function openClass(){
  modal('Create Class',`
    <form id="classEntryForm" class="form">
      <label>Class Name
        <select name="name" id="afisapClassNameSelect" required>
          <option value="">Select Class</option>
          ${AFISAP_MANAGEMENT_CLASSES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          <option value="__OTHER_CUSTOM_CLASS__">Other / Custom Class</option>
        </select>
      </label>
      <label id="afisapCustomClassWrap" style="display:none">Custom Class Name
        <input name="customClassName" id="afisapCustomClassName" placeholder="e.g. Nursery 1A">
      </label>
      <label>Class Teacher
        <input name="teacher" type="text" placeholder="Type class teacher's full name">
      </label>
      <div class="wide"><button type="submit" class="primary">Create Class</button></div>
    </form>`);
  const form=document.getElementById("classEntryForm"),select=document.getElementById("afisapClassNameSelect"),wrap=document.getElementById("afisapCustomClassWrap"),custom=document.getElementById("afisapCustomClassName");
  select.onchange=()=>{const other=select.value==="__OTHER_CUSTOM_CLASS__";wrap.style.display=other?"block":"none";if(other)custom.focus()};
  form.addEventListener("submit",async e=>{
    e.preventDefault();const f=new FormData(form),choice=String(f.get("name")||"").trim();
    const className=choice==="__OTHER_CUSTOM_CLASS__"?String(f.get("customClassName")||"").trim():choice;
    const teacher=String(f.get("teacher")||"").trim();
    if(choice==="__OTHER_CUSTOM_CLASS__"&&!className){alert("Please enter a class name.");return}
    if(!className){alert("Please choose a class.");return}
    const classKey=className.toLowerCase();
    const classAlreadySaved=(d.classes||[]).some(c=>
      String(c&& (c.name||c.className)||"").trim().toLowerCase()===classKey
    );
    if(classAlreadySaved){
      alert("This class already exists.");return
    }
    const now=Date.now(),classRecord={id:now,classId:"CLASS-"+now,name:className,level:"",academicYear:String(d.school?.year||"").trim(),teacher,capacity:"",status:"Active",dateCreated:new Date().toISOString()};
    const submitButton=form.querySelector('button[type="submit"]');
    const originalButtonText=submitButton?.textContent||"Create Class";
    if(submitButton){submitButton.disabled=true;submitButton.textContent="Please wait…";}
    afisapShowUploadLoader("Adding Class","Preparing class information…",10);
    try{
      // Keep the loader lightweight and truthful: each percentage marks a real stage.
      afisapUpdateUploadLoader("Checking class details…",20);
      await new Promise(resolve=>setTimeout(resolve,80));

      afisapUpdateUploadLoader("Saving class to Google Sheets…",30);
      const cloudResult=await afisapCloudCreateClass(classRecord);
      if(!cloudResult||cloudResult.success!==true){
        throw new Error(String(cloudResult?.error||"Google Sheets did not confirm the class."));
      }

      afisapUpdateUploadLoader("Google Sheets confirmed the class…",60);
      await new Promise(resolve=>setTimeout(resolve,80));

      afisapUpdateUploadLoader("Refreshing Classes & Subjects…",80);
      const syncResult=await afisapSyncAllFromCloud();
      if(syncResult && syncResult.success===false){
        throw new Error(String(syncResult.error||"The class was saved, but the page could not refresh."));
      }

      afisapUpdateUploadLoader("Class added successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,300));
      $('#modal').classList.remove('show');
      nav('classes');
      afisapHideUploadLoader();
      alert("Class added successfully and confirmed in Google Sheets.");
    }catch(error){
      afisapUpdateUploadLoader("Class could not be completed.",100);
      setTimeout(()=>afisapHideUploadLoader(),700);
      if(submitButton){submitButton.disabled=false;submitButton.textContent=originalButtonText;}
      alert("Class could not be confirmed in Google Sheets. Nothing was saved locally. Please check your internet connection and try again."+(error?.message?"\n\nReason: "+error.message:""));
      return;
    }
  })
}
function openFee(){
  modal('Add Fee Item',`<form id='feeItemForm' class='form'><label>Fee Item<input name='name' required></label><label>Amount (GHS)<input name='amount' type='number' min='0' step='.01' required></label><div class='wide'><button type='submit' class='primary'>Save Fee Item</button></div></form>`);
  const form=$('#feeItemForm');
  form.addEventListener('submit',async e=>{
    e.preventDefault();const f=new FormData(form),name=String(f.get('name')||'').trim(),amount=Number(f.get('amount')||0);
    if(!name){alert('Please enter a fee item.');return;}
    const btn=form.querySelector('button[type="submit"]'),oldText=btn?.textContent||'Save Fee Item';if(btn){btn.disabled=true;btn.textContent='Saving...';}
    const feeId='FEE_ITEM|'+encodeURIComponent(name)+'|'+Date.now(),now=new Date().toISOString();
    const result=await afisapCloudPost({action:'create',sheet:'Fees',data:{
      'Fee ID':feeId,'Student ID':'','Student Name':'','Fee Item':name,'Amount Due':amount,'Amount Paid':0,
      'Balance':amount,'Date':'','Academic Year':'','Term':'','Date Created':now,'Last Updated':now
    }}).catch(()=>null);
    if(!result||result.success!==true){if(btn){btn.disabled=false;btn.textContent=oldText;}alert('Fee item was not saved to Google Sheets.'+(result?.error?'\n\nReason: '+result.error:''));return;}
    await afisapSyncAllFromCloud();$('#modal').classList.remove('show');nav('fees');alert('Fee item saved successfully to Google Sheets.');
  });
}
async function del(type,id){
  if(type==="feeRecords"||type==="fees"){
    const label=type==="fees"?'fee item':'fee record';
    if(!confirm(`Are you sure you want to delete this ${label}?`))return;
    const deleteButton=document.querySelector(`[data-fee-delete-type="${type}"][data-fee-delete-id="${CSS.escape(String(id))}"]`);
    const oldDeleteText=deleteButton?.textContent||'Delete';
    if(deleteButton){deleteButton.disabled=true;deleteButton.textContent='Deleting...';}
    const list=d[type]||[],record=list.find(x=>String(x.id||x.name)===String(id));
    if(!record){if(deleteButton){deleteButton.disabled=false;deleteButton.textContent=oldDeleteText;}alert("Record not found.");return;}
    const feeId=String(record.id||record.feeId||record["Fee ID"]||"").trim();
    if(type==="fees"&&!/^FEE_ITEM\|/i.test(feeId)){if(deleteButton){deleteButton.disabled=false;deleteButton.textContent=oldDeleteText;}alert("This fee item is not yet stored in Google Sheets. Re-save it first.");return;}
    if(!feeId){if(deleteButton){deleteButton.disabled=false;deleteButton.textContent=oldDeleteText;}alert("The record has no Google Sheets Fee ID.");return;}
    const result=await afisapCloudPost({
      action:"delete",sheet:"Fees",idField:"Fee ID",idValue:feeId,
      sheetRow:Number(record.sheetRow||0)
    }).catch(()=>null);
    if(!result||result.success!==true){
      if(deleteButton){deleteButton.disabled=false;deleteButton.textContent=oldDeleteText;}
      alert("Deletion failed. The Google Sheets record was not confirmed as deleted."+(result?.error?"\n\nReason: "+result.error:""));return;
    }
    const syncAfterDelete=await afisapSyncAllFromCloud();
    if(!syncAfterDelete || syncAfterDelete.success!==true){
      alert("Google Sheets confirmed the deletion, but the Fees page could not refresh. Please refresh the page.");return;
    }
    const stillThere=(type==="fees"?d.fees:d.feeRecords).some(x=>String(x.id||x.feeId||"")===feeId);
    if(stillThere){
      alert("The fee still appears in the Google Sheets response, so the system will not claim it was deleted. Refresh and try again.");return;
    }
    nav("fees");
    alert(type==="fees"?"Fee item deleted from Google Sheets.":"Fee record deleted from Google Sheets.");return;
  }
  if(type==="students"){
    const wanted=String(id??"").trim();
    const record=(d.students||[]).find(x=>String(x.id)===wanted || String(x.sid||x.studentId||"").trim()===wanted);
    if(!record){alert("Student record not found. Refresh the Students page and try again.");return;}
    const cloudStudentId=String(record.sid||record.studentId||record["Student ID"]||record.admissionNumber||"").trim();
    if(!cloudStudentId){alert("Student was not deleted because the Student ID is missing.");return;}
    if(!confirm(`Are you sure you want to delete ${String(record.name||record.firstName||"this student")} from the official Students record?`))return;
    afisapShowUploadLoader("Deleting Student","Deleting the student from Google Sheets...",15);
    try{
      afisapUpdateUploadLoader("Removing the official student record...",60);
      const result=await afisapCloudDeleteStudent(cloudStudentId);
      if(!result || result.success!==true)throw new Error(String(result?.error||"Google Sheets did not confirm deletion."));
      d.students=(d.students||[]).filter(x=>x!==record);
      afisapUpdateUploadLoader("Student deleted successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,250));
      afisapHideUploadLoader();
      nav("students");
      alert("Student deleted successfully from Google Sheets.");
    }catch(error){
      afisapUpdateUploadLoader("Student deletion could not be completed.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert("Student was not deleted.\n\nReason: "+String(error?.message||error||"Unknown error"));
    }
    return;
  }

  if(type==="staff"){
    const wanted=String(id??"").trim();
    const record=(d.staff||[]).find(x=>
      String(x.id??"").trim()===wanted ||
      String(x.sid||x.staffId||x["Staff ID"]||"").trim()===wanted
    );
    if(!record){
      alert("Teacher / staff record not found. Refresh the Teachers & Staff page and try again.");
      return;
    }

    if(!confirm("Do you want to delete this staff?")) return;

    const staffId=String(record.sid||record.staffId||record["Staff ID"]||"").trim();
    if(!staffId){
      alert("Teacher / staff was not deleted because the Staff ID is missing.");
      return;
    }

    afisapShowUploadLoader("Deleting Staff","Deleting the teacher / staff record from Google Sheets...",15);
    try{
      afisapUpdateUploadLoader("Removing the official Teachers record...",55);
      const result=await afisapCloudDeleteStaff(staffId);
      if(!result || result.success!==true){
        throw new Error(String(result?.error||"Google Sheets did not confirm the deletion."));
      }

      // Remove from the current Admin view only AFTER Google Sheets confirms it.
      d.staff=(d.staff||[]).filter(x=>x!==record);
      afisapUpdateUploadLoader("Staff deleted successfully.",100);
      await new Promise(resolve=>setTimeout(resolve,220));
      afisapHideUploadLoader();
      nav("staff");
      alert("Teacher / staff deleted successfully from Google Sheets.");
    }catch(error){
      afisapUpdateUploadLoader("Staff deletion could not be completed.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert("Teacher / staff was not deleted.\n\nReason: "+String(error?.message||error||"Unknown error"));
    }
    return;
  }

  if(type==="classes"){
    const wanted=String(id??"").trim(),record=(d.classes||[]).find(x=>String(x.id??x.classId??"").trim()===wanted);
    if(!record){alert("Class record not found. Refresh Classes & Subjects and try again.");return;}
    const className=String(record.name||record.className||"").trim(),key=className.toLowerCase();
    if((d.students||[]).some(s=>String(s.class||s.className||"").trim().toLowerCase()===key)){alert("This class contains students. Please move the students before deleting the class.");return;}
    const assignedTeachers=(d.staff||[]).filter(t=>afisapStaffClassAssignments(t.class||t.className||t["Class"]).some(c=>c.toLowerCase()===key));
    if(assignedTeachers.length){alert("This class is still assigned to "+assignedTeachers.length+" teacher/staff record"+(assignedTeachers.length===1?"":"s")+". Remove the class from those teacher assignments before deleting it.");return;}
    try{const pending=await afisapCloudPost({action:'adminGetPendingPromotions'}),rows=Array.isArray(pending?.promotions)?pending.promotions:[];if(rows.some(p=>String(p.previousClass||p.currentClass||"").trim().toLowerCase()===key||String(p.promotedTo||"").trim().toLowerCase()===key)){alert("This class is referenced by a pending promotion recommendation. Cancel or change that recommendation before deleting the class.");return;}}
    catch(e){alert("The class dependency check could not be completed. Please try again.");return;}
    if(!confirm(`Delete ${className} from the official Classes record?`))return;
    afisapShowUploadLoader("Deleting Class","Checking dependencies and deleting from Google Sheets...",20);
    try{const result=await afisapCloudDeleteClass(String(record.classId||record.id||"").trim());if(!result?.success)throw new Error(result?.error||"Google Sheets did not confirm class deletion.");await afisapSyncAllFromCloud();afisapUpdateUploadLoader("Class deleted successfully.",100);await new Promise(resolve=>setTimeout(resolve,220));afisapHideUploadLoader();nav("classes");alert("Class deleted successfully from Google Sheets.");}
    catch(error){afisapUpdateUploadLoader("Class deletion could not be completed.",100);setTimeout(()=>afisapHideUploadLoader(),650);alert("Class was not deleted.\n\nReason: "+String(error?.message||error));}
    return;
  }

  const list=d[type]||[];
  const removedIndex=list.findIndex(x=>String(x.id)===String(id));
  const removed=removedIndex>=0 ? list[removedIndex] : null;
  d[type]=list.filter(x=>String(x.id)!==String(id)&&String(x.name)!==String(id));
  save();

  if(type==="students" && removed){
    const candidateIds=[
      removed.sid,
      removed.studentId,
      removed["Student ID"],
      removed.admissionNumber,
      removed["Admission Number"]
    ].filter(v=>v!==undefined && v!==null && String(v).trim()!=="")
     .map(v=>String(v).trim());

    const cloudStudentId=candidateIds[0] || "";

    if(!cloudStudentId){
      d.students.splice(Math.max(0,removedIndex),0,removed);
      save();
      alert("Student was not deleted because the Student ID is missing.");
      return;
    }

    const result=await afisapCloudDeleteStudent(cloudStudentId);

    /*
     * Older students may exist only in AFISAP local storage and have no
     * corresponding row in Google Sheets. In that case Apps Script returns
     * "Record not found". The local student should still be allowed to be
     * deleted because there is no cloud record to delete.
     */
    const cloudRecordMissing =
      result &&
      result.success!==true &&
      /record not found|not found/i.test(String(result.error||""));

    if(!result || (result.success!==true && !cloudRecordMissing)){
      d.students.splice(Math.max(0,removedIndex),0,removed);
      save();
      alert(
        "Student was not deleted from Google Sheets. The local record has been restored."+
        (result && result.error ? "\n\nReason: "+result.error : "")
      );
      return;
    }

    if(cloudRecordMissing){
      d.students.splice(Math.max(0,removedIndex),0,removed);
      alert("Student was not deleted because no matching Google Sheets record was found. Refresh from the central database and try again.");
      return;
    }
  }

  if(type==="staff" && removed){
    const staffId=String(
      removed.sid ??
      removed.staffId ??
      removed["Staff ID"] ??
      removed.id ??
      ""
    ).trim();

    if(!staffId){
      d.staff.splice(Math.max(0,removedIndex),0,removed);
      save();
      alert("Teacher / staff was not deleted because the Staff ID is missing.");
      return;
    }

    const result=await afisapCloudDeleteStaff(staffId);

    if(!result || result.success!==true){
      const errorText=String(result && result.error || "").toLowerCase();
      const notFound =
        errorText.includes("record not found") ||
        errorText.includes("not found") ||
        errorText.includes("does not exist");

      if(!notFound){
        d.staff.splice(Math.max(0,removedIndex),0,removed);
        save();
        alert(
          "Teacher / staff was not deleted from Google Sheets. The local record has been restored."+
          (result && result.error ? "\n\nReason: "+result.error : "")
        );
        return;
      }
      if(notFound){
        d.staff.splice(Math.max(0,removedIndex),0,removed);
        alert("Teacher / staff was not deleted because no matching Google Sheets record was found.");
        return;
      }
    }
  }

  if(type==="classes" && removed){
    const className=String(removed.name||removed.className||"").trim();
    const classHasStudents=(d.students||[]).some(s=>String(s.class||"").trim().toLowerCase()===className.toLowerCase());
    if(classHasStudents){
      d.classes.splice(Math.max(0,removedIndex),0,removed);save();
      alert("This class contains students. Please move the students before deleting the class.");
      return;
    }
    const classId=String(
      removed.classId ??
      removed.id ??
      removed["Class ID"] ??
      ""
    ).trim();

    if(!classId){
      d.classes.splice(Math.max(0,removedIndex),0,removed);
      save();
      alert("Class was not deleted because the Class ID is missing.");
      return;
    }

    const result=await afisapCloudDeleteClass(classId);

    if(!result || result.success!==true){
      const errorText=String(result && result.error || "").toLowerCase();
      const notFound =
        errorText.includes("record not found") ||
        errorText.includes("not found") ||
        errorText.includes("does not exist");

      // Older classes may exist only in the local AFISAP data.
      // If Google Sheets confirms there is no matching cloud record,
      // it is safe to remove the local class.
      if(!notFound){
        d.classes.splice(Math.max(0,removedIndex),0,removed);
        save();
        alert(
          "Class was not deleted from Google Sheets. The local record has been restored."+
          (result && result.error ? "\n\nReason: "+result.error : "")
        );
        return;
      }
    }
  }  if(type==="feeRecords" && removed){
    const feeId=String(
      removed.id ??
      removed.feeId ??
      removed["Fee ID"] ??
      ""
    ).trim();

    if(!feeId){
      d.feeRecords.splice(Math.max(0,removedIndex),0,removed);
      save();
      alert("Fee record was not deleted because the Fee ID is missing.");
      return;
    }

    const result=await afisapCloudPost({
      action:"delete",
      sheet:"Fees",
      idField:"Fee ID",
      idValue:feeId,
      sheetRow:Number(removed.sheetRow||0)
    });

    if(!result || result.success!==true){
      const errorText=String(result&&result.error||"").toLowerCase();
      const notFound=
        errorText.includes("record not found") ||
        errorText.includes("not found") ||
        errorText.includes("does not exist");

      if(!notFound){
        d.feeRecords.splice(Math.max(0,removedIndex),0,removed);
        save();
        alert(
          "Fee record was not deleted from Google Sheets. The local record has been restored."+
          (result&&result.error?"\\n\\nReason: "+result.error:"")
        );
        return;
      }
    }
  }

  if(type==="results" && removed){
    afisapShowUploadLoader("Deleting Result","Deleting the official result from Google Sheets...",15);
    const resultId=String(
      removed.id ??
      removed.resultId ??
      removed["Result ID"] ??
      ""
    ).trim();

    if(!resultId){
      d.results.splice(Math.max(0,removedIndex),0,removed);
      save();
      afisapUpdateUploadLoader("Result deletion could not be completed.",100);
      setTimeout(()=>afisapHideUploadLoader(),650);
      alert("Result was not deleted because the Result ID is missing.");
      return;
    }

    afisapUpdateUploadLoader("Removing the official Results record...",55);
    const result=await afisapCloudDeleteResult(resultId);

    if(!result || result.success!==true){
      const errorText=String(result && result.error || "").toLowerCase();
      const notFound =
        errorText.includes("record not found") ||
        errorText.includes("not found") ||
        errorText.includes("does not exist");

      // Older results may exist only in local AFISAP storage. If there is
      // no corresponding Google Sheets row, the local deletion is safe.
      if(!notFound){
        d.results.splice(Math.max(0,removedIndex),0,removed);
        save();
        afisapUpdateUploadLoader("Result deletion could not be completed.",100);
        setTimeout(()=>afisapHideUploadLoader(),650);
        alert(
          "Result was not deleted from Google Sheets. The local record has been restored."+
          (result && result.error ? "\n\nReason: "+result.error : "")
        );
        return;
      }

      console.info("AFISAP: result had no matching Google Sheets record; deleting local record only.");
    }

    const deletedStudent=(d.students||[]).find(s=>afisapStudentKey(s)===String(removed.studentId||"").trim());
    if(deletedStudent){
      await afisapRecalculateAcademicPositions(
        String(deletedStudent.class||deletedStudent.className||""),
        String(removed.term||removed.Term||"").trim(),
        String(removed.academicYear||removed["Academic Year"]||removed.year||"").trim(),
        true
      );
    }
    afisapUpdateUploadLoader("Result deleted successfully.",100);
    await new Promise(resolve=>setTimeout(resolve,220));
    afisapHideUploadLoader();
  }
}async function afisapRepairLocalFeeRecordsToCloud(){
  const records=Array.isArray(d.feeRecords)?d.feeRecords:[];
  for(const r of records){
    const feeId=String(r.id||r.feeId||r["Fee ID"]||"").trim();
    if(!feeId) continue;

    try{
      const found=await afisapCloudJsonp({
        action:"search",
        sheet:"Fees",
        field:"Fee ID",
        value:feeId
      });

      if(found && found.success===true &&
         Array.isArray(found.records) && found.records.length){
        continue;
      }

      const student=(d.students||[]).find(s=>{
        const ids=[s.id,s.sid,s.studentId,s["Student ID"]]
          .filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="")
          .map(String);
        return ids.includes(String(r.studentId||""));
      })||{};

      const due=Number(r.amountDue||0);
      const paid=Number(r.amountPaid||0);

      await afisapCloudPost({
        action:"create",
        sheet:"Fees",
        data:{
          "Fee ID":feeId,
          "Student ID":String(student.sid||student.studentId||student["Student ID"]||student.id||r.studentId||""),
          "Admission Number":String(student.admissionNumber||student["Admission Number"]||""),
          "Student Name":String(student.name||student.fullName||""),
          "Fee Item":String(r.feeItem||""),
          "Amount Due":due,
          "Amount Paid":paid,
          "Balance":Math.max(0,due-paid),
          "Date":String(r.date||""),
          "Academic Year":String(d.school?.year||""),
          "Term":String(d.school?.term||""),
          "Date Created":String(r.dateCreated||new Date().toISOString()),
          "Last Updated":new Date().toISOString()
        }
      });
    }catch(error){
      console.warn("AFISAP: could not repair fee record",feeId,error);
    }
  }
}

ensureAfisapData();
document.getElementById('menuToggle')?.addEventListener('click',()=>document.body.classList.toggle('sidebar-open'));
nav('dashboard');
let afisapBackgroundSyncRunning=false;
setInterval(()=>{
  if(window.afisapIsAuthenticated && window.afisapIsAuthenticated() && !afisapBackgroundSyncRunning){
    afisapBackgroundSyncRunning=true;
    afisapSyncAllFromCloud().catch(()=>{}).finally(()=>{afisapBackgroundSyncRunning=false;});
  }
},120000);


(function(){
  const searchInput = document.getElementById("globalSearch");
  const searchBtn = document.getElementById("globalSearchBtn");
  let resultsBox = document.getElementById("globalSearchResults");
  if(!resultsBox && searchInput){
    resultsBox=document.createElement("div");
    resultsBox.id="globalSearchResults";
    resultsBox.className="global-search-results";
    searchInput.parentElement.appendChild(resultsBox);
  }
  const mailButton = document.getElementById("mailButton");
  const msgCount = document.getElementById("msgCount");

  const text = v => String(v ?? "").trim();
  const lower = v => text(v).toLowerCase();

  function studentName(s){
    return s?.name || [s?.firstName,s?.middleName,s?.surname,s?.otherName].filter(Boolean).join(" ") || "Unnamed Student";
  }
  function staffName(s){
    return s?.name || [s?.firstName,s?.middleName,s?.surname,s?.otherName].filter(Boolean).join(" ") || "Unnamed Staff";
  }
  function studentById(id){
    return (d.students||[]).find(s=>{
      const ids=[s.id,s.sid,s.studentId,s.studentID,s.indexNumber].filter(v=>v!==undefined&&v!==null).map(String);
      return ids.includes(String(id));
    });
  }
  function staffById(id){
    return (d.staff||[]).find(s=>{
      const ids=[s.id,s.sid,s.staffId,s.staffID].filter(v=>v!==undefined&&v!==null).map(String);
      return ids.includes(String(id));
    });
  }

  function add(items,type,title,detail,target,recordId){
    const cleanTitle=text(title)||type;
    const cleanDetail=text(detail);
    const searchText=lower([type,cleanTitle,cleanDetail].join(" "));
    items.push({type,title:cleanTitle,detail:cleanDetail,target,recordId,searchText});
  }

  function valuesForRecord(obj, skip){
    const out=[];
    if(!obj || typeof obj!=="object") return out;
    Object.entries(obj).forEach(([k,v])=>{
      if(skip && skip.has(k)) return;
      if(v===null || v===undefined || typeof v==="function") return;
      if(typeof v==="object"){
        if(Array.isArray(v)) out.push(v.join(" "));
        return;
      }
      const str=text(v);
      if(str) out.push(`${k}: ${str}`);
    });
    return out.join(" • ");
  }

  function collectSearchItems(){
    const items=[];

    /* STUDENTS — all useful student fields */
    (d.students||[]).forEach(s=>{
      add(items,"Student",studentName(s),
        valuesForRecord(s,new Set(["photo","name","id"])),
        "students",s.id);
    });

    /* TEACHERS / STAFF — all useful staff fields */
    (d.staff||[]).forEach(s=>{
      add(items,"Teacher / Staff",staffName(s),
        valuesForRecord(s,new Set(["photo","name","id"])),
        "staff",s.id);
    });

    /* CLASSES */
    (d.classes||[]).forEach(c=>{
      add(items,"Class",c.name||"Unnamed Class",
        valuesForRecord(c,new Set(["id","name"])),
        "classes",c.id);
    });

    /* SUBJECTS — search by subject name */
    (d.subjects||[]).forEach((subject,i)=>{
      add(items,"Subject",subject,"Classes & Subjects","classes",`subject-${i}`);
    });

    /* RESULTS / MARKS — linked to the actual student */
    (d.results||[]).forEach(r=>{
      const s=studentById(r.studentId);
      const total=Number(r.cs||0)+Number(r.es||0);
      add(items,"Result / Mark",
        `${studentName(s)} — ${r.subject||"Subject"}`,
        [
          `Student ID: ${s?.sid||r.studentId||""}`,
          `Class: ${s?.class||r.class||""}`,
          `Class Score: ${r.cs??""}`,
          `Exam Score: ${r.es??""}`,
          `Total: ${total}`,
          `Position: ${r.position||""}`,
          `Remarks: ${r.remarks||""}`
        ].filter(Boolean).join(" • "),
        "results",r.id);
    });

    /* FEE ITEMS */
    (d.fees||[]).forEach(f=>{
      add(items,"Fee Item",f.name||"Fee Item",
        `Amount: GHS ${Number(f.amount||0).toFixed(2)}`,
        "fees",f.id);
    });

    /* INDIVIDUAL STUDENT FEE RECORDS / PAYMENTS / BALANCES */
    (d.feeRecords||[]).forEach(r=>{
      const s=studentById(r.studentId);
      const due=Number(r.amountDue||0);
      const paid=Number(r.amountPaid||0);
      const balance=Math.max(0,due-paid);
      const status=balance===0 && paid>0 ? "Paid" : paid>0 ? "Part Paid" : "Due";
      add(items,"Fee / Payment",
        `${studentName(s)} — ${r.feeItem||"Fee Record"}`,
        [
          `Student ID: ${s?.sid||r.studentId||""}`,
          `Class: ${s?.class||r.class||""}`,
          `Date: ${r.date||""}`,
          `Amount Due: GHS ${due.toFixed(2)}`,
          `Amount Paid: GHS ${paid.toFixed(2)}`,
          `Balance: GHS ${balance.toFixed(2)}`,
          `Status: ${status}`,
          `Receipt: ${r.receiptNo||r.receipt||""}`
        ].filter(Boolean).join(" • "),
        "fees",r.id);
    });

    /* STUDENT ATTENDANCE — searchable by student, ID, date, class and status */
    const attSource=d.attendance||{};
    const attRecords=Array.isArray(attSource)
      ? attSource.filter(Boolean)
      : Object.values(attSource).filter(Boolean);

    attRecords.forEach(r=>{
      const s=studentById(r.studentId);
      const present = r.present===true || r.present===1 ||
        lower(r.present)==="yes" || lower(r.status)==="present" ||
        lower(r.status)==="yes" || lower(r.status)==="true" || r.status===1;
      add(items,"Student Attendance",
        `${studentName(s)} — ${r.date||"No Date"}`,
        [
          `Student ID: ${s?.sid||r.studentId||""}`,
          `Class: ${s?.class||r.class||""}`,
          `Date: ${r.date||""}`,
          `Attendance: ${present?"Present (1 day)":"Absent (0 days)"}`
        ].filter(Boolean).join(" • "),
        "attendance",r.studentId);
    });

    /* TEACHER ATTENDANCE — searchable by staff ID, date, teacher and status */
    const taSource=d.teacherAttendance||{};
    const taRecords=Array.isArray(taSource)
      ? taSource.filter(Boolean)
      : Object.values(taSource).filter(Boolean);

    taRecords.forEach(r=>{
      const t=staffById(r.staffId||r.teacherId||r.sid||r.id);
      const present = r.present===true || r.present===1 ||
        lower(r.present)==="yes" || lower(r.status)==="present" ||
        lower(r.status)==="yes" || lower(r.status)==="true" || r.status===1;
      add(items,"Teacher Attendance",
        `${staffName(t)} — ${r.date||"No Date"}`,
        [
          `Staff ID: ${t?.sid||r.staffId||r.teacherId||""}`,
          `Position: ${t?.position||""}`,
          `Class: ${t?.class||""}`,
          `Subject: ${t?.subject||""}`,
          `Date: ${r.date||""}`,
          `Attendance: ${present?"Present (1 day)":"Absent (0 days)"}`
        ].filter(Boolean).join(" • "),
        "teacherAttendance",t?.id||r.staffId||r.teacherId);
    });

    /* SCHOOL SETUP / CONTACT INFORMATION */
    if(d.school){
      add(items,"School Information",d.school.name||"AFISAP ROYAL ACADEMY",
        valuesForRecord(d.school,new Set(["logo","watermark"])),
        "settings","school");
    }

    /* Catch any additional top-level system data not already represented.
       This makes the search future-proof when new modules/fields are added. */
    const known=["students","staff","classes","subjects","results","fees","feeRecords","attendance","teacherAttendance","school"];
    Object.keys(d||{}).forEach(key=>{
      if(known.includes(key)) return;
      const value=d[key];
      if(Array.isArray(value)){
        value.forEach((record,i)=>{
          if(record && typeof record==="object"){
            add(items,key,record.name||record.title||record.id||`${key} ${i+1}`,
              valuesForRecord(record,new Set(["photo","image","id","name","title"])),
              key,record.id||i);
          }else if(value!==null && value!==undefined){
            add(items,key,String(record),"",key,i);
          }
        });
      }else if(value && typeof value==="object"){
        add(items,key,key,valuesForRecord(value),key,key);
      }else if(value!==undefined && value!==null && text(value)){
        add(items,key,key,String(value),key,key);
      }
    });

    return items;
  }

  let lastResults=[];
  function runGlobalSearch(query){
    const raw=text(query);
    const q=lower(raw);

    if(!q){
      lastResults=[];
      resultsBox.classList.remove("show");
      resultsBox.innerHTML="";
      return;
    }

    const all=collectSearchItems();
    const words=q.split(/\s+/).filter(Boolean);

    /* Match the whole query OR all individual search words. */
    lastResults=all.filter(item=>{
      if(item.searchText.includes(q)) return true;
      return words.every(word=>item.searchText.includes(word));
    }).slice(0,60);

    let html=`<div class="search-result-head">
      Search results for “${esc(raw)}”
      <span class="search-result-count">${lastResults.length}${lastResults.length===60?"+":""}</span>
    </div>`;

    if(!lastResults.length){
      html+=`<div class="search-empty">
        No matching information was found in Students, Teachers & Staff, Classes & Subjects,
        Attendance, Teacher Attendance, Results & Marks, Fees & Textbooks or School Setup.
      </div>`;
    }else{
      html+=lastResults.map((x,i)=>`
        <div class="search-result" data-result-index="${i}" role="button" tabindex="0">
          <b>${esc(x.title)}</b>
          <small><strong>${esc(x.type)}</strong>${x.detail?" • "+esc(x.detail):""}</small>
        </div>`).join("");
    }

    resultsBox.innerHTML=html;
    resultsBox.classList.add("show");

    resultsBox.querySelectorAll(".search-result").forEach(el=>{
      const openResult=()=>{
        const item=lastResults[Number(el.dataset.resultIndex)];
        if(!item) return;
        resultsBox.classList.remove("show");
        if(searchInput) searchInput.value="";
        if(item.target && ["students","staff","classes","attendance","teacherAttendance","results","reports","fees","settings"].includes(item.target)){
          nav(item.target);
        }
      };
      el.addEventListener("click",openResult);
      el.addEventListener("keydown",e=>{
        if(e.key==="Enter" || e.key===" "){e.preventDefault();openResult();}
      });
    });
  }

  searchInput?.addEventListener("input",e=>runGlobalSearch(e.target.value));
  searchInput?.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();
      runGlobalSearch(e.target.value);
    }
    if(e.key==="Escape"){
      resultsBox.classList.remove("show");
      searchInput.value="";
    }
  });
  searchBtn?.addEventListener("click",()=>runGlobalSearch(searchInput?.value||""));

  document.addEventListener("click",e=>{
    if(resultsBox && !resultsBox.contains(e.target) && !e.target.closest(".global-search-wrap")){
      resultsBox.classList.remove("show");
    }
  });

  const SCHOOL_EMAIL="afisaproyalacademy@gmail.com";
  mailButton?.addEventListener("click",()=>{
    window.open("https://mail.google.com/mail/u/0/#search/"+encodeURIComponent("to:"+SCHOOL_EMAIL),"_blank","noopener");
  });

  msgCount.textContent="↗";
  msgCount.title="Open school Gmail";
})();
document.getElementById('notificationButton')?.addEventListener('click',()=>{nav('dashboard');window.scrollTo({top:180,behavior:'smooth'});});


(function(){var s=document.createElement('style');s.id='afisap-report-print-css';s.textContent=`
.report-print-sheet{
  position:relative;
  width:210mm;
  min-height:297mm;
  margin:0 auto;
  padding:14mm 12mm 12mm;
  box-sizing:border-box;
  color:#17243b;
  background:#fff;
  overflow:hidden;
}
.report-print-sheet .report-header{display:none}
.report-card-watermark{
  position:absolute!important;
  left:50%!important;
  top:55%!important;
  width:230px!important;
  height:230px!important;
  object-fit:contain!important;
  transform:translate(-50%,-50%)!important;
  opacity:.075!important;
  z-index:0!important;
  pointer-events:none!important;
}
.report-attendance-style-header{
  display:flex;
  align-items:center;
  gap:18px;
  border-bottom:3px solid #d7aa08;
  padding-bottom:12px;
  position:relative;
  z-index:2;
  text-align:center;
}
.report-attendance-style-logo{
  width:78px;
  height:78px;
  flex:0 0 78px;
  object-fit:contain;
}
.report-attendance-style-school{
  flex:1;
  min-width:0;
}
.report-attendance-style-school h2{margin:0;font-size:22px}
.report-attendance-style-school h3{margin:2px 0;font-size:17px}
.report-attendance-style-school p{margin:2px 0;font-size:11px;color:#667085}
.report-attendance-style-contact{
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  gap:4px 14px;
  font-size:8.5px;
  color:#334155;
  margin-top:5px;
}
.student-report-profile{
  display:flex;
  gap:12px;
  align-items:flex-start;
  border:1px solid #cfd5dd;
  background:rgba(255,255,255,.94);
  padding:9px;
  margin:12px 0 10px;
  position:relative;
  z-index:2;
}
.report-photo{width:78px;height:92px;border:1px solid #888;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;background:#fff}
.report-photo img{width:100%;height:100%;object-fit:cover}
.student-report-details{flex:1;line-height:1.3;font-size:11px}
.student-report-details p{margin:2px 0}
.report-print-sheet h3{
  margin:8px 0 4px;
  padding:5px 6px;
  font-size:13px;
  border:1px solid #0b3a71;
  background:#0b3a71;
  color:#fff;
  position:relative;
  z-index:2;
}
.report-print-sheet table{
  width:100%;
  border-collapse:collapse;
  margin:4px 0 8px;
  background:rgba(255,255,255,.95);
  font-size:9.5px;
  position:relative;
  z-index:2;
}
.report-print-sheet th,.report-print-sheet td{
  border:1px solid #aeb6c2;
  padding:5px;
  text-align:left;
}
.report-print-sheet th{background:#eef2f6;color:#17243b}
.report-print-sheet h3 + table th{background:#0b3a71;color:#fff}
.report-print-sheet p{font-size:10px;margin:5px 0;position:relative;z-index:2}
.report-actions{text-align:center;margin-top:10px;position:relative;z-index:3}
.report-actions button{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 18px;
  font-size:13px;
  cursor:pointer;
}
@page{
  size:A4 portrait;
  margin:0;
}
@media print{
  html,body{
    width:210mm!important;
    min-height:297mm!important;
    height:auto!important;
    margin:0!important;
    padding:0!important;
    background:#fff!important;
    overflow:visible!important;
  }

  body *{visibility:hidden!important}
  .report-print-sheet,
  .report-print-sheet *{visibility:visible!important}

  #app{
    display:block!important;
    position:static!important;
    width:210mm!important;
    height:auto!important;
    min-height:0!important;
    margin:0!important;
    padding:0!important;
    background:#fff!important;
  }

  #report,
  #classResultsReport{
    position:static!important;
    width:210mm!important;
    height:auto!important;
    min-height:0!important;
    margin:0!important;
    padding:0!important;
    background:#fff!important;
    overflow:visible!important;
  }

  /* Only the currently selected report is printable. */
  #report[style*="display: none"],
  #classResultsReport[style*="display: none"]{
    display:none!important;
  }

  #report:not([style*="display: none"]),
  #classResultsReport:not([style*="display: none"]){
    display:block!important;
  }

  .report-print-sheet{
    position:relative!important;
    left:auto!important;
    top:auto!important;
    width:210mm!important;
    max-width:210mm!important;
    min-width:0!important;
    min-height:0!important;
    height:auto!important;
    margin:0!important;
    padding:8mm 10mm 10mm!important;
    box-sizing:border-box!important;
    background:#fff!important;
    overflow:visible!important;
    page-break-inside:auto!important;
  }

  .report-print-sheet table{
    width:100%!important;
    max-width:100%!important;
    page-break-inside:auto!important;
  }

  .report-print-sheet tr{
    page-break-inside:avoid!important;
    page-break-after:auto!important;
  }

  .report-actions{display:none!important}

  .report-card-watermark{
    display:block!important;
    visibility:visible!important;
    position:absolute!important;
    opacity:.075!important;
  }
}
`;document.head.appendChild(s);})();

/* Administrator passport profile */
(function(){
  function refreshAdminAvatar(){
    const el=document.getElementById("adminAvatar");
    if(!el) return;
    if(d.adminProfile && d.adminProfile.photo){
      el.classList.add("admin-avatar-image");
      el.innerHTML='<img src="'+d.adminProfile.photo+'" alt="Administrator passport photo">';
    }else{
      el.classList.remove("admin-avatar-image");
      el.textContent="A";
    }
  }

  window.openAdminProfileUpload=function(){
    const current=d.adminProfile?.photo||"";
    modal("Administrator Profile",`
      <div class="admin-profile-modal">
        <div class="admin-profile-upload">
          <div class="admin-profile-upload-preview" id="adminProfilePreview">
            ${current?`<img src="${current}" alt="Administrator passport photo">`:"A"}
          </div>
          <h3>Administrator Passport Photo</h3>
          <p>Upload a passport-size image. It will be stored in Google Drive and used for the administrator profile.</p>
          <input id="adminProfilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp">
          <div class="form-actions" style="margin-top:16px">
            <button type="button" class="primary" id="saveAdminProfilePhoto">Save Photo</button>
            <button type="button" class="secondary" id="removeAdminProfilePhoto">Remove Photo</button>
          </div>
        </div>
      </div>`);

    const input=document.getElementById("adminProfilePhotoInput");
    const preview=document.getElementById("adminProfilePreview");
    let selected=current;

    input?.addEventListener("change",e=>{
      const file=e.target.files?.[0];
      if(!file)return;
      if(!file.type.match(/^image\/(jpeg|png|webp)$/)){
        alert("Please select a JPG, PNG or WEBP image.");
        return;
      }
      if(file.size>3*1024*1024){
        alert("Please choose an image smaller than 3 MB.");
        return;
      }
      const reader=new FileReader();
      reader.onload=()=>{
        selected=reader.result;
        preview.innerHTML='<img src="'+selected+'" alt="Administrator passport photo">';
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("saveAdminProfilePhoto")?.addEventListener("click",async()=>{
      if(!selected){
        alert("Please select an administrator passport photo first.");
        return;
      }
      try{
        afisapShowUploadLoader("Saving Administrator Photo","Preparing administrator photo upload...",15);
        const response=await fetch(selected);
        const blob=await response.blob();
        afisapUpdateUploadLoader("Uploading administrator photo to Google Drive...",35);
        const file=new File([blob],"administrator-passport-"+Date.now()+".jpg",
          {type:blob.type||"image/jpeg"});

        const upload=await afisapDriveUpload(file,"admin-profile","administrator");
        if(!upload?.fileId) throw new Error("Google Drive did not return a File ID.");
        afisapUpdateUploadLoader("Administrator photo uploaded. Saving the central reference...",85);

        const central=await afisapCloudJsonp({
          action:"adminProfileSet",
          fileId:String(upload.fileId)
        });
        if(!central?.success) throw new Error(central?.error||"Could not save central profile reference.");

        d.adminProfile=d.adminProfile||{};
        d.adminProfile.photo=selected;
        d.adminProfile.photoFileId=String(upload.fileId);
        persist();
        refreshAdminAvatar();
        afisapUpdateUploadLoader("Administrator photo saved successfully.",100);
        await new Promise(resolve=>setTimeout(resolve,450));
        document.getElementById("modal")?.classList.remove("show");
        afisapHideUploadLoader();
        alert("Administrator photo saved successfully. It will be available on all devices.");
      }catch(error){
        console.error("AFISAP administrator profile save failed:",error);
        afisapHideUploadLoader();
        alert("Administrator photo could not be saved centrally.\n\nReason: "+String(error.message||error));
      }
    });

    document.getElementById("removeAdminProfilePhoto")?.addEventListener("click",async()=>{
      const result=await afisapCloudJsonp({action:"adminProfileSet",fileId:"",clear:"1"}).catch(()=>null);
      if(!result?.success){alert("Administrator photo was not removed because the central system did not confirm the change.");return;}
      d.adminProfile=d.adminProfile||{};
      d.adminProfile.photo="";
      d.adminProfile.photoFileId="";
      refreshAdminAvatar();
      document.getElementById("modal")?.classList.remove("show");
    });
  };

  document.addEventListener("DOMContentLoaded",()=>{
    refreshAdminAvatar();
    document.getElementById("adminProfilePill")?.addEventListener("click",openAdminProfileUpload);
  });

  // The app script is loaded at the end of body, so initialize immediately as well.
  refreshAdminAvatar();
  document.getElementById("adminProfilePill")?.addEventListener("click",openAdminProfileUpload);
})();


/* Administrator sign-out */
(function(){
  function performAdminLogout(){
    const ok=confirm("Are you sure you want to log out of the Administrator account?");
    if(!ok) return;
    if(typeof window.afisapShowLogin==="function"){
      window.afisapShowLogin();
    }
  }

  document.addEventListener("DOMContentLoaded",function(){
    document.getElementById("adminLogoutButton")?.addEventListener("click",performAdminLogout);
  });
  document.getElementById("adminLogoutButton")?.addEventListener("click",performAdminLogout);
})();


/* AFISAP Class Results final styling */
(function(){
  const id="afisap-class-results-final-style";
  function add(){
    if(document.getElementById(id)) return;
    const s=document.createElement("style");
    s.id=id;
    s.textContent=`
      .report-mode-tabs{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      .report-mode-tabs button{border-radius:8px}
      .report-help-text{margin-top:12px;padding:10px 12px;border-radius:8px;background:#f6f7f9;font-size:.92rem}
      .report-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
      .report-summary-grid>div{border:1px solid #ddd;border-radius:10px;padding:12px;text-align:center}
      .report-summary-grid b{display:block;font-size:.78rem}
      .report-summary-grid strong{display:block;font-size:1.3rem;margin-top:5px}
      @media(max-width:800px){.report-summary-grid{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(s);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",add,{once:true});
  else add();
})();
