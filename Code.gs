const AFISAP_FEES_BACKEND_VERSION='AFISAP_FEES_FAST_V5_20260912';
const SPREADSHEET_ID = '1GAPZT7dvzZ8hW1nrKiQHs-L6XjNbAQDT20Oy819ZUEI';

const ALLOWED_SHEETS = [
  'Students',
  'Teachers',
  'Classes',
  'Subjects',
  'Student Attendance',
  'Teacher Attendance',
  'Results',
  'Fees',
  'Academic Settings',
  'System Settings',
  'Announcements & Assignments'
];

function afisapFeesBackendStatus(){
  // Public compatibility probe: reveal only the backend version required by
  // the Admin frontend, not workbook dimensions or financial record counts.
  return {success:true,version:AFISAP_FEES_BACKEND_VERSION};
}


function afisapParseRequestFromGet_(e){
  const p=(e&&e.parameter)||{};
  let request={};
  if(p.payload){
    try{request=JSON.parse(p.payload)}catch(err){return {__error:'Invalid payload JSON: '+err.message,__callback:p.callback};}
  }else{
    request=Object.assign({},p);
    delete request.callback;
    delete request.payload;
  }
  return request;
}

function afisapPublicParentType_(type){
  return ['school','announcements','classes','subjects','attachment'].indexOf(String(type||'').trim().toLowerCase())!==-1;
}

function doGet(e) {
  try {
    const p=(e&&e.parameter)||{};
    if(!p.action){
      return jsonOrJsonp({
        success:true,
        system:'AFISAP Royal Academy School Management System',
        status:'online',
        timestamp:new Date().toISOString()
      },p.callback);
    }

    const request=afisapParseRequestFromGet_(e);
    if(request.__error)return jsonOrJsonp({success:false,error:request.__error},request.__callback);

    // GET/JSONP is deliberately limited to information intended to be public.
    // Authentication credentials, session tokens, private school records,
    // teacher data and all mutations must use POST.
    if(request.action==='feesBackendStatus'){
      return jsonOrJsonp(afisapFeesBackendStatus(),p.callback);
    }
    if(request.action==='parentPortalGet' && afisapPublicParentType_(request.type)){
      return jsonOrJsonp(parentPortalGet(request),p.callback);
    }
    if(request.action==='teacherPortalGet' && String(request.type||'').toLowerCase()==='school'){
      return jsonOrJsonp({success:true,school:teacherPortalSchoolInfo()},p.callback);
    }

    return jsonOrJsonp({
      success:false,
      error:'This operation requires a secure POST request and server-side authorization.'
    },p.callback);
  } catch (error) {
    return jsonOrJsonp({success:false,error:error.message},e&&e.parameter&&e.parameter.callback);
  }
}

function afisapDispatchPost_(request){
  const action=String(request&&request.action||'').trim();

  // Public/credential-exchange actions. Credentials are accepted only in POST bodies.
  if(action==='authLogin')return authLogin(request);
  if(action==='authRequestReset')return authRequestReset(request);
  if(action==='authResetPassword')return authResetPassword(request);
  if(action==='authSessionStatus')return authSessionStatus(request);
  if(action==='authLogout')return authLogout(request);

  if(action==='teacherAuthLogin')return teacherAuthLogin(request);
  if(action==='teacherAuthSessionStatus')return teacherAuthSessionStatus(request);
  if(action==='teacherAuthLogout')return teacherAuthLogout(request);

  if(action==='parentAuthLogin')return parentAuthLogin(request);
  if(action==='parentAuthSessionStatus')return parentAuthSessionStatus(request);
  if(action==='parentAuthLogout')return parentAuthLogout(request);

  if(action==='parentPortalGet'){
    if(String(request.authToken||'').trim()){
      const parentSession=afisapRequireSession_(request,'parent');
      if(!parentSession.success)return parentSession;
      request._session=parentSession.session;
      request.studentId=String(parentSession.session.principal.studentId||'');
      return parentPortalGet(request);
    }
    if(afisapPublicParentType_(request.type))return parentPortalGet(request);
    return {success:false,error:'Parent authentication is required.'};
  }

  if(action==='teacherPortalGet' || action==='teacherPortalWrite'){
    const teacherSession=afisapRequireSession_(request,'teacher');
    if(!teacherSession.success)return teacherSession;
    const authenticatedStaffId=String(teacherSession.session.principal.staffId||'').trim();
    const authenticatedTeacher=afisapTeacherRowById_(authenticatedStaffId);
    if(!authenticatedTeacher)return {success:false,error:'Teacher account is unavailable.'};
    // Teacher Portal credentials are stored in Script Properties because the
    // workbook is at the Google Sheets cell limit. Do not read portal-enabled
    // state from nonexistent Teachers-sheet security columns here.
    const authenticatedLogin=afisapReadTeacherLogin_(authenticatedStaffId);
    if(!authenticatedLogin || !afisapTeacherLoginIsEnabled_(authenticatedLogin) || !afisapTeacherEmploymentActive_(authenticatedTeacher)){
      afisapInvalidateTeacherSessions_(authenticatedStaffId);
      return {success:false,error:'This Teacher Portal account is currently disabled. Please contact the administrator.'};
    }
    request._session=teacherSession.session;
    request.staffId=authenticatedStaffId;
    return action==='teacherPortalGet' ? teacherPortalGet(request) : teacherPortalWrite(request);
  }

  const adminOnly=[
    'read','search','count','create','createFeeRecordFast','update','delete',
    'bulkCreateFees','bulkPromoteStudents','adminGetPendingPromotions','adminCancelPromotion','adminApplyPromotionRollover','saveResult','recalculatePositions','saveTeacherAttendanceBatch','saveStudentAttendanceBatch',
    'configGet','configSet','adminProfileGet','adminProfileSet',
    'driveUpload','driveGet','driveDelete','driveList',
    'adminGetTeacherLogin','adminSetTeacherCredentials','adminResetTeacherPassword','adminSetTeacherLoginStatus',
    'feesCommunicationDiagnostic'
  ];
  if(adminOnly.indexOf(action)!==-1){
    const adminSession=afisapRequireSession_(request,'admin');
    if(!adminSession.success)return adminSession;
    request._session=adminSession.session;

    switch(action){
      case 'read': return readRecords(request);
      case 'search': return searchRecords(request);
      case 'count': return countRecords(request);
      case 'create': return createRecord(request);
      case 'createFeeRecordFast': return createFeeRecordFast(request);
      case 'bulkCreateFees': return bulkCreateFees(request);
      case 'bulkPromoteStudents': return bulkPromoteStudents(request);
      case 'adminGetPendingPromotions': return adminGetPendingPromotions(request);
      case 'adminCancelPromotion': return adminCancelPromotion(request);
      case 'adminApplyPromotionRollover': return adminApplyPromotionRollover(request);
      case 'saveResult': return adminSaveResult(request);
      case 'recalculatePositions': return adminRecalculatePositions(request);
      case 'saveTeacherAttendanceBatch': return saveTeacherAttendanceBatch(request);
      case 'saveStudentAttendanceBatch': return saveStudentAttendanceBatch(request);
      case 'update': return updateRecord(request);
      case 'delete': return deleteRecord(request);
      case 'configGet': return configGet(request);
      case 'configSet': return configSet(request);
      case 'adminProfileGet': return adminProfileGet(request);
      case 'adminProfileSet': return adminProfileSet(request);
      case 'driveUpload': return driveUpload(request);
      case 'driveGet': return driveGet(request);
      case 'driveDelete': return driveDelete(request);
      case 'driveList': return driveList(request);
      case 'adminGetTeacherLogin': return adminGetTeacherLogin(request);
      case 'adminSetTeacherCredentials': return adminSetTeacherCredentials(request);
      case 'adminResetTeacherPassword': return adminResetTeacherPassword(request);
      case 'adminSetTeacherLoginStatus': return adminSetTeacherLoginStatus(request);
      case 'feesCommunicationDiagnostic': return afisapFeesCommunicationDiagnostic(request);
    }
  }

  // Old credential endpoints are intentionally disabled.
  if(['authStatus','authVerify','authSetPassword'].indexOf(action)!==-1){
    return {success:false,error:'Legacy authentication endpoint disabled. Use the secure POST authentication flow.'};
  }

  return {success:false,error:'Unknown or unauthorized API action: '+action};
}

function doPost(e) {
  try {
    if(!e||!e.postData||!e.postData.contents){
      return jsonResponse({success:false,error:'No request data received.'});
    }
    let request;
    try{request=JSON.parse(e.postData.contents)}catch(parseError){
      return jsonResponse({success:false,error:'Invalid request JSON.'});
    }
    if(!request.action)return jsonResponse({success:false,error:'No action specified.'});
    return jsonResponse(afisapDispatchPost_(request));
  } catch (error) {
    return jsonResponse({success:false,error:error.message});
  }
}





/* ============================================================
 * AFISAP SERVER-SIDE SECURITY / AUTHORIZATION
 * ============================================================ */
const AFISAP_SESSION_TTL_MS=30*60*1000;
const AFISAP_TEACHER_SESSION_TTL_MS=30*24*60*60*1000; // 30-day sliding teacher session; explicit Sign Out still revokes immediately.
const AFISAP_PASSWORD_ITERATIONS=3500;
const AFISAP_AUTH_RATE_WINDOW_MS=15*60*1000;
const AFISAP_AUTH_RATE_MAX=8;

function afisapSha256Hex_(value){
  const bytes=Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value||''),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b){const v=(b<0?b+256:b).toString(16);return v.length===1?'0'+v:v;}).join('');
}
function afisapRandomToken_(){
  return Utilities.getUuid().replace(/-/g,'')+
    Utilities.getUuid().replace(/-/g,'')+
    Utilities.getUuid().replace(/-/g,'');
}
function afisapCleanupExpiredSessions_(){
  const props=PropertiesService.getScriptProperties();
  const all=props.getProperties();
  const now=Date.now();
  Object.keys(all).forEach(function(key){
    if(key.indexOf('AFISAP_SESSION_')!==0)return;
    try{
      const session=JSON.parse(all[key]||'null');
      if(!session || Number(session.expiresAt||0)<=now)props.deleteProperty(key);
    }catch(e){
      props.deleteProperty(key);
    }
  });
}
function afisapSessionKey_(token){return 'AFISAP_SESSION_'+afisapSha256Hex_(token);}
function afisapIssueSession_(role,principal){
  // Do not scan every Script Property on each login. Session expiry is checked
  // against the requested session key; stale sessions can be cleaned lazily.
  const token=afisapRandomToken_();
  const now=Date.now();
  const ttlMs=String(role)==='teacher'?AFISAP_TEACHER_SESSION_TTL_MS:AFISAP_SESSION_TTL_MS;
  const expiresAt=now+ttlMs;
  PropertiesService.getScriptProperties().setProperty(
    afisapSessionKey_(token),
    JSON.stringify({role:String(role),principal:principal||{},issuedAt:now,expiresAt:expiresAt})
  );
  return {token:token,expiresAt:new Date(expiresAt).toISOString(),expiresInSeconds:Math.floor(ttlMs/1000)};
}
function afisapRequireSession_(request,expectedRole){
  // Validate only the requested session key. Scanning every Script Property
  // on every Teacher/Parent/Admin request creates unnecessary latency as the
  // workbook and session/property store grow. Expired sessions are harmless
  // until their own key is accessed and are cleaned up lazily there.
  const token=String(request&&request.authToken||'').trim();
  if(!token)return {success:false,error:'Authentication required.'};
  const props=PropertiesService.getScriptProperties();
  const key=afisapSessionKey_(token),raw=props.getProperty(key);
  if(!raw)return {success:false,error:'Authentication session is invalid or expired.'};
  let session;
  try{session=JSON.parse(raw)}catch(e){props.deleteProperty(key);return {success:false,error:'Authentication session is invalid.'};}
  if(Number(session.expiresAt||0)<=Date.now()){
    props.deleteProperty(key);
    return {success:false,error:'Authentication session has expired. Please sign in again.'};
  }
  if(expectedRole && String(session.role)!==String(expectedRole)){
    return {success:false,error:'You are not authorized for this operation.'};
  }
  // Sliding renewal. Teacher sessions persist across normal mobile/desktop refreshes;
  // explicit Sign Out still revokes the exact token immediately.
  const renewalTtl=String(session.role)==='teacher'?AFISAP_TEACHER_SESSION_TTL_MS:AFISAP_SESSION_TTL_MS;
  session.expiresAt=Date.now()+renewalTtl;
  props.setProperty(key,JSON.stringify(session));
  return {success:true,session:session};
}
function afisapDestroySession_(request,role){
  const token=String(request&&request.authToken||'').trim();
  if(!token)return {success:true};

  // Logout must be lightweight. The client has already removed its local
  // session token, so only revoke this exact server-side session key.
  // Do not run afisapRequireSession_() here because it performs cleanup and
  // sliding-session work that can add unnecessary latency to sign-out.
  try{
    PropertiesService.getScriptProperties().deleteProperty(afisapSessionKey_(token));
  }catch(e){}
  return {success:true};
}
function afisapRequireBroadAuthThrottle_(bucket){
  return afisapRateLimit_('broad-auth|'+String(bucket||''));
}
function afisapRateLimit_(key){
  const props=PropertiesService.getScriptProperties();
  const prop='AFISAP_RATE_'+afisapSha256Hex_(key);
  const now=Date.now();
  let item={count:0,start:now};
  try{item=JSON.parse(props.getProperty(prop)||'null')||item}catch(e){}
  if(now-Number(item.start||0)>AFISAP_AUTH_RATE_WINDOW_MS)item={count:0,start:now};
  item.count++;
  props.setProperty(prop,JSON.stringify(item));
  return item.count<=AFISAP_AUTH_RATE_MAX;
}
function afisapPasswordRecord_(password){
  const salt=afisapRandomToken_().slice(0,48);
  let hash=String(password||'')+'|'+salt;
  for(let i=0;i<AFISAP_PASSWORD_ITERATIONS;i++)hash=afisapSha256Hex_(hash);
  return JSON.stringify({v:2,salt:salt,iterations:AFISAP_PASSWORD_ITERATIONS,hash:hash});
}
function afisapVerifyPasswordRecord_(password,stored){
  if(!stored)return false;
  let record=null;
  try{record=JSON.parse(stored)}catch(e){}
  if(record&&record.v===2&&record.salt&&record.hash){
    let hash=String(password||'')+'|'+String(record.salt);
    const iterations=Math.max(1000,Math.min(10000,Number(record.iterations)||AFISAP_PASSWORD_ITERATIONS));
    for(let i=0;i<iterations;i++)hash=afisapSha256Hex_(hash);
    return hash===String(record.hash);
  }
  // Compatibility with the old unsalted SHA-256 record. A successful login
  // automatically upgrades the stored credential.
  return afisapSha256Hex_(password)===String(stored);
}
function afisapSetPasswordProperty_(propertyKey,password){
  if(String(password||'').length<8)throw new Error('Password must contain at least 8 characters.');
  PropertiesService.getScriptProperties().setProperty(propertyKey,afisapPasswordRecord_(password));
}
function afisapNormalizePhone_(value){
  let d=String(value||'').replace(/\D/g,'');
  if(d.indexOf('233')===0)d='0'+d.slice(3);
  return d;
}
function afisapTeacherPasswordKey_(staffId){return 'AFISAP_TEACHER_AUTH_'+String(staffId||'').trim().toLowerCase();}
function afisapTeacherRowById_(staffId){
  const id=String(staffId||'').trim();
  if(!id)return null;
  const rows=teacherPortalReadUsedRows('Teachers');
  return rows.find(r=>String(r['Staff ID']||r['StaffID']||'').trim().toLowerCase()===id.toLowerCase())||null;
}
function afisapStudentRowById_(studentId){
  const id=String(studentId||'').trim();
  if(!id)return null;
  const sheet=getAllowedSheet('Students'),lastRow=sheet.getLastRow(),lastColumn=sheet.getLastColumn();
  if(lastRow<2||lastColumn<1)return null;
  const data=sheet.getRange(1,1,lastRow,lastColumn).getValues(),headers=data[0].map(String);
  const idx=headers.indexOf('Student ID');
  if(idx<0)return null;
  const row=data.slice(1).find(r=>String(r[idx]||'').trim().toLowerCase()===id.toLowerCase());
  return row?rowToObject(headers,row):null;
}
function afisapGuardianContact_(student){
  return String(
    student['Guardian Contact']||
    student['Guardian Phone']||
    student['Parent Contact']||
    student['Contact']||''
  ).trim();
}

const AFISAP_WORKBOOK_CELL_LIMIT=10000000;

function teacherPortalSplitAssignments(value){
  return String(value||'').split(/[,;|\n]+/).map(v=>String(v||'').trim()).filter(Boolean);
}
function teacherPortalTeacherName(r){
  return String(r['Full Name']||r['Name']||
    [r['First Name'],r['Middle Name'],r['Last Name']||r['Surname']]
      .map(v=>String(v||'').trim()).filter(Boolean).join(' ')).trim();
}
function teacherPortalPublicTeacher(r){
  return {
    staffId:String(r['Staff ID']||r['StaffID']||'').trim(),
    name:teacherPortalTeacherName(r),
    position:String(r['Position']||'Teacher').trim(),
    classes:teacherPortalSplitAssignments(r['Class']),
    subjects:teacherPortalSplitAssignments(r['Subject']),
    status:String(r['Status']||'Active').trim(),
    photoFileId:String(r['Passport Photo']||r['Profile Photo Drive File ID']||'').trim()
  };
}
function teacherPortalSchoolInfo(){
  let config={};
  try{config=configGet().config||{}}catch(e){const raw=PropertiesService.getScriptProperties().getProperty('AFISAP_CONFIG');if(raw){try{config=JSON.parse(raw)}catch(ignore){}}}
  const school=(config&&config.school&&typeof config.school==='object')?config.school:{};
  return {name:String(school.name||'AFISAP ROYAL ACADEMY'),motto:String(school.motto||'LEARNING TO LEARN'),academicYear:String(school.year||'2026/2027'),term:String(school.term||'Term 1'),head:String(school.head||'HEAD OF SCHOOL'),phone:String(school.phone||school.phones||'055 610 4186 / 024 272 7685 / 024 874 3558'),email:String(school.email||'afisaproyalacademy@gmail.com'),website:String(school.website||'www.afisaproyalacademy.com'),address:String(school.address||'')};
}
function teacherPortalReportCardDates(){
  const rows=teacherPortalReadUsedRows('Academic Settings');
  const out={};
  rows.forEach(r=>{
    const year=String(r['Academic Year']||'').trim();
    const term=String(r['Term']||'').trim();
    if(!year||!term)return;
    out[year+'|'+term]={
      vacationDate:String(r['Vacation Date']||'').trim(),
      openingDate:String(r['Opening Date']||'').trim()
    };
  });
  return out;
}
function teacherPortalExistingSheet(sheetName){
  if(!ALLOWED_SHEETS.includes(sheetName)) throw new Error('Unauthorized or invalid sheet: '+sheetName);
  const spreadsheet=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet=spreadsheet.getSheetByName(sheetName);
  if(!sheet && sheetName==='Announcements & Assignments'){
    const norm=v=>String(v||'').trim().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
    const wanted=norm(sheetName);
    sheet=spreadsheet.getSheets().find(s=>norm(s.getName())===wanted)||null;
  }
  if(!sheet) throw new Error('Required existing sheet does not exist: '+sheetName);
  return sheet;
}
function teacherPortalReadUsedRows(sheetName){
  const sheet=sheetName==='Fees' ? ensureFeesFields() : teacherPortalExistingSheet(sheetName);
  const lastRow=sheet.getLastRow(),lastColumn=sheet.getLastColumn();
  if(lastRow<2||lastColumn<1) return [];
  const data=sheet.getRange(1,1,lastRow,lastColumn).getValues();
  const headers=data[0].map(String);
  return data.slice(1).filter(row=>row.some(v=>v!==''&&v!==null)).map(row=>sheetName==='Fees'?afisapFeeCanonicalObject(headers,row):rowToObject(headers,row));
}
function teacherPortalWorkbookDiagnostics(){
  const spreadsheet=SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets=spreadsheet.getSheets().map(sheet=>{
    const maxRows=sheet.getMaxRows(),maxColumns=sheet.getMaxColumns();
    return {
      sheetName:sheet.getName(),
      maxRows:maxRows,
      maxColumns:maxColumns,
      approximateCells:maxRows*maxColumns,
      lastUsedRow:sheet.getLastRow(),
      lastUsedColumn:sheet.getLastColumn()
    };
  });
  const totalAllocatedCells=sheets.reduce((sum,s)=>sum+s.approximateCells,0);
  sheets.sort((a,b)=>b.approximateCells-a.approximateCells);
  return {
    success:true,
    workbookCellLimit:AFISAP_WORKBOOK_CELL_LIMIT,
    totalAllocatedCells:totalAllocatedCells,
    remainingAllocatedCapacity:Math.max(0,AFISAP_WORKBOOK_CELL_LIMIT-totalAllocatedCells),
    sheets:sheets
  };
}
function teacherPortalCellPreflight(sheet,extraRows,extraColumns,operation){
  const spreadsheet=sheet.getParent();
  const currentTotal=spreadsheet.getSheets().reduce((sum,s)=>sum+(s.getMaxRows()*s.getMaxColumns()),0);
  const addedRows=Math.max(0,Number(extraRows)||0);
  const addedColumns=Math.max(0,Number(extraColumns)||0);
  const projectedIncrease=addedRows*sheet.getMaxColumns()+addedColumns*sheet.getMaxRows()+addedRows*addedColumns;
  const projectedTotal=currentTotal+projectedIncrease;
  if(projectedTotal>AFISAP_WORKBOOK_CELL_LIMIT){
    throw new Error(
      'Workbook cell-limit safety stopped '+String(operation||'this write')+
      ' on "'+sheet.getName()+'". Current allocated cells: '+currentTotal+
      '; projected allocated cells: '+projectedTotal+
      '; Google Sheets limit: '+AFISAP_WORKBOOK_CELL_LIMIT+'. No rows or columns were added.'
    );
  }
}
function teacherPortalAllTeachers(){
  return teacherPortalReadUsedRows('Teachers').map(teacherPortalPublicTeacher)
    .filter(t=>t.staffId&&t.name&&String(t.status||'Active').toLowerCase()!=='inactive');
}
function teacherPortalResolveTeacher(staffId){
  const id=String(staffId||'').trim();
  return teacherPortalAllTeachers().find(t=>t.staffId===id)||null;
}
function teacherPortalStudentRows(teacher){
  const classKeys=new Set((teacher.classes||[]).map(x=>String(x).trim().toLowerCase()).filter(Boolean));
  return teacherPortalReadUsedRows('Students').filter(r=>
    String(r['Status']||'Active').trim().toLowerCase()!=='inactive' &&
    classKeys.has(String(r['Class']||'').trim().toLowerCase())
  );
}
function teacherPortalStudentPublic(r){
  r=afisapMergePromotionIntoStudent_(Object.assign({},r||{}));
  const directName=String(r['Student Name']||r['Full Name']||'').trim();
  const lastName=String(r['Last Name']||r['Surname']||'').trim();
  const builtName=[r['First Name'],r['Middle Name'],lastName].map(v=>String(v||'').trim()).filter(Boolean).join(' ');
  return {
    studentId:String(r['Student ID']||'').trim(),
    admissionNumber:String(r['Admission Number']||r['Admission No']||'').trim(),
    name:directName||builtName,
    className:String(r['Class']||'').trim(),
    gender:String(r['Gender']||'').trim(),
    dateOfBirth:String(r['Date of Birth']||'').trim(),
    admissionDate:String(r['Admission Date']||'').trim(),
    guardian:String(r['Guardian Name']||r['Guardian']||'').trim(),
    guardianContact:String(r['Guardian Contact']||'').trim(),
    guardianEmail:String(r['Guardian Email']||'').trim(),
    address:String(r['Address']||'').trim(),
    promotedTo:String(r['Promoted To']||r['Promotion Class']||'').trim(),
    previousClass:String(r['Previous Class']||'').trim(),
    promotionStatus:String(r['Promotion Status']||'').trim(),
    promotionAcademicYear:String(r['Promotion Academic Year']||'').trim(),
    promotionEffectiveAcademicYear:String(r['Promotion Effective Academic Year']||'').trim(),
    promotionAppliedAt:String(r['Promotion Applied At']||r['Promotion Date']||'').trim(),
    teacherRemarks:String(r["Teacher's Remarks"]||r['Teacher Remarks']||r['Report Remarks']||'').trim(),
    rollNo:String(r['Roll No.']||'').trim(),
    noOnRoll:String(r['No. on Roll']||'').trim(),
    photoFileId:String(r['Passport Photo']||r['Passport Photo URL']||'').trim()
  };
}
function teacherPortalPublicStudentsForTeacher(teacher){
  const rows=teacherPortalStudentRows(teacher);
  const groups=new Map();
  rows.forEach(r=>{
    const key=String(r['Class']||'').trim().toLowerCase();
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(r);
  });
  const out=[];
  groups.forEach(classRows=>{
    const total=classRows.length;
    classRows.forEach((r,index)=>{
      const s=teacherPortalStudentPublic(r);
      // Preserve physical Roll fields when present. If the production sheet
      // does not contain them, provide a non-destructive display fallback
      // from the current class roster; no sheet columns are created.
      if(!s.rollNo)s.rollNo=String(index+1).padStart(2,'0');
      if(!s.noOnRoll)s.noOnRoll=String(total);
      out.push(s);
    });
  });
  return out;
}
function teacherPortalAllowedClass(teacher,className){
  const wanted=teacherPortalClassKey_(className);
  return !!wanted&&(teacher.classes||[]).some(c=>teacherPortalClassKey_(c)===wanted);
}
function teacherPortalOfficialSubjects(){
  return ['Computing','Creative Arts','English','French','History','Mathematics','R M E','Science','TWI','Other'];
}
function teacherPortalSubjectKey(value){
  return String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
}
function teacherPortalCanonicalSubject(value){
  const raw=String(value||'').trim(),key=teacherPortalSubjectKey(raw);
  if(key==='maths'||key==='mathematics')return 'Mathematics';
  if(key==='rme'||key==='religiousandmoraleducation')return 'R M E';
  const official=teacherPortalOfficialSubjects();
  for(let i=0;i<official.length;i++)if(teacherPortalSubjectKey(official[i])===key)return official[i];
  return raw;
}
function teacherPortalAllowedResultSubject(subject){
  const canonical=teacherPortalCanonicalSubject(subject);
  return !!canonical&&teacherPortalSubjectKey(canonical)!=='other';
}
function teacherPortalAllowedSubject(teacher,subject){
  const wanted=teacherPortalCanonicalSubject(subject);
  if(!wanted)return false;
  const assigned=(teacher.subjects||[]).map(teacherPortalCanonicalSubject).filter(Boolean);
  return assigned.some(s=>teacherPortalSubjectKey(s)===teacherPortalSubjectKey(wanted));
}
function teacherPortalRankOrdinal(n){
  n=Number(n); if(!n||n<1)return '';
  const m=n%100,s=(m>=11&&m<=13)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');
  return String(n)+s;
}
function teacherPortalRecalculatePositions(className,subject,year,term){
  // Recalculate the affected class/academic period in memory, then write the
  // complete Position column once. The previous implementation called
  // setValue() separately for every changed result row, which is slow in
  // Apps Script and becomes increasingly expensive as the Results sheet grows.
  const sheet=teacherPortalExistingSheet('Results');
  const lastRow=sheet.getLastRow(),lastColumn=sheet.getLastColumn();
  if(lastRow<2||lastColumn<1)return {success:true,updated:0,positions:{}};

  const data=sheet.getRange(1,1,lastRow,lastColumn).getValues();
  const h=data[0].map(String),idx={};
  ['Student ID','Class','Subject','Academic Year','Term','Total Marks','Class Score','Exam Score','Position']
    .forEach(k=>idx[k]=h.indexOf(k));
  if(idx['Student ID']<0||idx['Class']<0||idx['Subject']<0||idx['Position']<0)
    return {success:false,error:'Results sheet is missing Student ID, Class, Subject or Position.'};

  const wantedClass=String(className||'').trim().toLowerCase();
  const wantedYear=String(year||'').trim();
  const wantedTerm=String(term||'').trim();
  const rowsByStudent=new Map(),subjectsByStudent=new Map();

  for(let i=1;i<data.length;i++){
    if(String(data[i][idx['Class']]||'').trim().toLowerCase()!==wantedClass)continue;
    const rowYear=idx['Academic Year']>=0?String(data[i][idx['Academic Year']]||'').trim():'';
    const rowTerm=idx['Term']>=0?String(data[i][idx['Term']]||'').trim():'';
    if(rowYear&&wantedYear&&rowYear!==wantedYear)continue;
    if(rowTerm&&wantedTerm&&rowTerm!==wantedTerm)continue;

    const sid=String(data[i][idx['Student ID']]||'').trim();
    const rawSubject=String(data[i][idx['Subject']]||'').trim();
    const canonical=teacherPortalCanonicalSubject(rawSubject);
    if(!sid||!canonical)continue;

    let total=NaN;
    if(idx['Total Marks']>=0&&String(data[i][idx['Total Marks']]??'').trim()!=='')total=Number(data[i][idx['Total Marks']]);
    if(!Number.isFinite(total)){
      const cs=idx['Class Score']>=0?Number(data[i][idx['Class Score']]||0):0;
      const es=idx['Exam Score']>=0?Number(data[i][idx['Exam Score']]||0):0;
      total=(Number.isFinite(cs)?cs:0)+(Number.isFinite(es)?es:0);
    }

    if(!rowsByStudent.has(sid))rowsByStudent.set(sid,[]);
    rowsByStudent.get(sid).push(i+1);
    if(!subjectsByStudent.has(sid))subjectsByStudent.set(sid,new Map());
    const subjectMap=subjectsByStudent.get(sid),key=teacherPortalSubjectKey(canonical),existing=subjectMap.get(key);
    const exact=teacherPortalSubjectKey(rawSubject)===teacherPortalSubjectKey(canonical)&&String(rawSubject).trim().toLowerCase()===canonical.toLowerCase();
    if(!existing||(!existing.exact&&exact))subjectMap.set(key,{total:total,exact:exact});
  }

  const totals=new Map();
  subjectsByStudent.forEach((subjectMap,sid)=>{
    let sum=0;subjectMap.forEach(entry=>sum+=Number(entry.total||0));totals.set(sid,sum);
  });
  const ranked=[...totals.entries()].map(([sid,total])=>({sid,total})).sort((a,b)=>b.total-a.total);
  const positions=new Map();let previousTotal=null,previousRank=0;
  ranked.forEach((x,index)=>{
    if(previousTotal===null||x.total!==previousTotal)previousRank=index+1;
    positions.set(x.sid,teacherPortalRankOrdinal(previousRank));
    previousTotal=x.total;
  });

  let updated=0;
  const positionValues=data.slice(1).map(row=>[row[idx['Position']]]);
  rowsByStudent.forEach((rows,sid)=>{
    const next=positions.get(sid)||'';
    rows.forEach(rowNumber=>{
      const arrayIndex=rowNumber-2;
      if(arrayIndex>=0&&String(data[rowNumber-1][idx['Position']]||'')!==next){
        positionValues[arrayIndex][0]=next;
        updated++;
      }
    });
  });

  if(positionValues.length){
    sheet.getRange(2,idx['Position']+1,positionValues.length,1).setValues(positionValues);
  }

  const positionObject={};
  positions.forEach((value,key)=>{positionObject[String(key)]=value;});
  return {success:true,updated:updated,positions:positionObject};
}
function teacherPortalSafeUpsert(sheetName,idField,idValue,data){
  const sheet=teacherPortalExistingSheet(sheetName);
  const headers=getHeaders(sheet);
  const idIndex=headers.indexOf(idField);
  if(idIndex<0)return {success:false,error:'Required field not found: '+idField};

  const found=findRowByField(sheet,idField,String(idValue));
  if(found){
    headers.forEach((header,index)=>{
      if(data[header]!==undefined&&header!==idField){
        sheet.getRange(found.rowNumber,index+1).setValue(data[header]);
      }
    });
    return {success:true,message:'Record updated successfully.'};
  }

  const nextRow=sheet.getLastRow()+1;
  if(nextRow>sheet.getMaxRows()){
    teacherPortalCellPreflight(sheet,1,0,'adding one record row');
    sheet.insertRowsAfter(sheet.getMaxRows(),1);
  }
  const row=headers.map(header=>data[header]!==undefined&&data[header]!==null?data[header]:'');
  sheet.getRange(nextRow,1,1,headers.length).setValues([row]);
  return {success:true,message:'Record created successfully.'};
}
function teacherPortalSaveResult(request,teacher){
  const d=request.data||{},className=String(d.className||'').trim(),subject=teacherPortalCanonicalSubject(d.subject);
  if(!teacherPortalAllowedClass(teacher,className))return {success:false,error:'This class is not assigned to this teacher.'};
  if(!teacherPortalAllowedResultSubject(subject))return {success:false,error:'When Subject is Other, specify the actual subject name (for example ICT).'};
  const subjectSync=afisapSyncSubjectsToSheet_([subject]);
  if(!subjectSync.success)return {success:false,error:'The subject could not be synchronized to the Subjects Google Sheet. '+String(subjectSync.error||'')};
  // Results & Marks is class-authorized: a teacher assigned to this class may enter
  // any official report subject, or a real custom subject typed through Other.
  // Other teacher-portal modules keep their existing subject-assignment checks.

  const studentId=String(d.studentId||'').trim();
  const student=teacherPortalStudentRows(teacher).find(r=>
    String(r['Student ID']||'').trim()===studentId &&
    String(r['Class']||'').trim().toLowerCase()===className.toLowerCase()
  );
  if(!student)return {success:false,error:'Student is outside this teacher assignment.'};

  const cs=Number(d.classScore),es=Number(d.examScore);
  if(!Number.isFinite(cs)||cs<0||cs>50||!Number.isFinite(es)||es<0||es>50)
    return {success:false,error:'Class Score and Exam Score must each be from 0 to 50.'};

  const year=String(d.academicYear||'').trim(),term=String(d.term||'').trim();
  if(!year||!term)return {success:false,error:'Academic Year and Term are required.'};

  // Update an existing official result for the same Student ID + Subject +
  // Academic Year + Term even if the frontend did not supply its Result ID.
  // This prevents a Teacher result from duplicating an Admin-created result.
  let resultId=String(d.resultId||'').trim();
  if(!resultId){
    const candidates=teacherPortalReadUsedRows('Results').filter(r=>
      String(r['Student ID']||'').trim()===studentId &&
      teacherPortalSubjectKey(teacherPortalCanonicalSubject(r['Subject']))===teacherPortalSubjectKey(subject) &&
      String(r['Academic Year']||'').trim()===year &&
      String(r['Term']||'').trim()===term
    );
    // Prefer an already-canonical row. If only a legacy Maths row exists, reuse
    // its Result ID and update that same row to Mathematics without deleting data.
    const existing=candidates.find(r=>String(r['Subject']||'').trim().toLowerCase()===subject.toLowerCase())||candidates[0];
    resultId=String(existing?.['Result ID']||['TR',studentId,subject,year,term].join('|')).trim();
  }
  const now=new Date().toISOString();
  const record={
    'Result ID':resultId,'Student ID':studentId,
    'Student Name':[student['First Name'],student['Middle Name'],student['Last Name']].map(v=>String(v||'').trim()).filter(Boolean).join(' '),
    'Subject':subject,'Class':className,'Class Score':cs,'Exam Score':es,'Total Marks':cs+es,'Position':'',
    'Remarks':String(d.remarks||'').trim(),'Academic Year':year,'Term':term,
    'Recorded By':teacher.name+' ('+teacher.staffId+')','Staff ID':teacher.staffId,'Role':'Teacher',
    'Entered By':teacher.name+' | '+teacher.staffId+' | Teacher',
    'Date Created':String(d.dateCreated||now),'Last Updated':now
  };
  const saved=teacherPortalSafeUpsert('Results','Result ID',resultId,record);
  if(saved&&saved.success){
    const ranked=teacherPortalRecalculatePositions(className,subject,year,term);
    if(!ranked||ranked.success!==true)return {success:false,error:'Result was saved, but position recalculation was not completed. Refresh Results from Google Sheets. '+String(ranked&&ranked.error||'')};
    record.Position=String(ranked.positions&&ranked.positions[studentId]||'');
    return {success:true,message:saved.message||'Result saved successfully.',result:record,positions:ranked.positions||{}};
  }
  return saved;
}
function teacherPortalDeleteResult(request,teacher){
  const d=request.data||{},resultId=String(d.resultId||d.id||'').trim();
  if(!resultId)return {success:false,error:'Result ID is required.'};
  const sheet=teacherPortalExistingSheet('Results');
  const found=findRowByField(sheet,'Result ID',resultId);
  if(!found)return {success:true,message:'Result is already deleted.',resultId:resultId,positions:{}};
  const headers=getHeaders(sheet),row=rowToObject(headers,found.row);
  const className=String(row['Class']||'').trim(),studentId=String(row['Student ID']||'').trim();
  if(!teacherPortalAllowedClass(teacher,className))return {success:false,error:'This result is outside your assigned class.'};
  const allowedStudent=teacherPortalStudentRows(teacher).some(r=>String(r['Student ID']||'').trim()===studentId&&teacherPortalClassKey_(r['Class'])===teacherPortalClassKey_(className));
  if(!allowedStudent)return {success:false,error:'This result is outside your teacher assignment.'};
  const subject=teacherPortalCanonicalSubject(row['Subject']),year=String(row['Academic Year']||'').trim(),term=String(row['Term']||'').trim();
  sheet.deleteRow(found.rowNumber);
  const ranked=teacherPortalRecalculatePositions(className,subject,year,term);
  return {success:true,message:'Result deleted from the official Results Google Sheet.',resultId:resultId,positions:(ranked&&ranked.positions)||{}};
}

function adminSaveResult(request){
  const d=request&&request.data||{};
  const className=String(d['Class']||d.className||'').trim();
  const year=String(d['Academic Year']||d.academicYear||'').trim();
  const term=String(d['Term']||d.term||'').trim();
  const studentId=String(d['Student ID']||d.studentId||'').trim();
  const subject=String(d['Subject']||d.subject||'').trim();

  if(!studentId)return {success:false,error:'Student ID is required.'};
  if(!className)return {success:false,error:'Class is required.'};
  if(!year)return {success:false,error:'Academic Year is required.'};
  if(!term)return {success:false,error:'Term is required.'};
  if(!subject)return {success:false,error:'Subject is required.'};

  // Perform the official write and position recalculation inside one Apps
  // Script request. This removes one complete HTTP round trip from Results &
  // Marks and keeps the saved result + positions synchronized server-side.
  const saved=createRecord({
    sheet:'Results',
    data:{
      'Result ID':String(d['Result ID']||d.resultId||Date.now()),
      'Student ID':studentId,
      'Student Name':String(d['Student Name']||d.studentName||'').trim(),
      'Subject':subject,
      'Class':className,
      'Class Score':d['Class Score']!==undefined?d['Class Score']:d.classScore,
      'Exam Score':d['Exam Score']!==undefined?d['Exam Score']:d.examScore,
      'Total Marks':d['Total Marks']!==undefined?d['Total Marks']:d.totalMarks,
      'Position':'',
      'Remarks':String(d['Remarks']||d.remarks||'').trim(),
      'Academic Year':year,
      'Term':term,
      'Date Created':String(d['Date Created']||d.dateCreated||new Date().toISOString()),
      'Last Updated':new Date().toISOString()
    }
  });
  if(!saved||saved.success!==true)return saved||{success:false,error:'Result could not be saved.'};

  const ranked=teacherPortalRecalculatePositions(className,'',year,term);
  if(!ranked||ranked.success!==true){
    return {
      success:false,
      saved:true,
      record:saved.record||null,
      error:'Result was saved, but academic position synchronization was incomplete. '+String(ranked&&ranked.error||'Position recalculation failed.')
    };
  }
  return {
    success:true,
    message:'Result saved and academic positions synchronized successfully.',
    record:saved.record||null,
    positions:ranked.positions||{},
    updatedPositions:Number(ranked.updated||0)
  };
}

function adminRecalculatePositions(request){
  const className=String(request&&request.className||'').trim();
  const year=String(request&&request.academicYear||'').trim();
  const term=String(request&&request.term||'').trim();
  if(!className||!year||!term)return {success:false,error:'Class, Academic Year and Term are required.'};
  return teacherPortalRecalculatePositions(className,'',year,term);
}

function teacherPortalSaveAttendance(request,teacher){
  const d=request.data||{},className=String(d.className||'').trim(),date=String(d.date||'').trim();
  if(!teacherPortalAllowedClass(teacher,className))return {success:false,error:'This class is not assigned to this teacher.'};
  if(!date)return {success:false,error:'Attendance date is required.'};

  const studentMap=new Map(
    teacherPortalStudentRows(teacher)
      .filter(r=>String(r['Class']||'').trim().toLowerCase()===className.toLowerCase())
      .map(r=>[String(r['Student ID']||'').trim(),r])
  );
  const entries=Array.isArray(d.records)?d.records:[];
  if(!entries.length)return {success:false,error:'No attendance records supplied.'};

  const now=new Date().toISOString(),results=[];
  entries.forEach(item=>{
    const sid=String(item.studentId||'').trim(),student=studentMap.get(sid);
    if(!student){results.push({success:false,studentId:sid,error:'Student outside assigned class.'});return;}
    const present=!!item.present,attendanceId=sid+'_'+date;
    const record={
      'Attendance ID':attendanceId,'Student ID':sid,
      'Student Name':[student['First Name'],student['Middle Name'],student['Last Name']].map(v=>String(v||'').trim()).filter(Boolean).join(' '),
      'Class':className,'Date':date,'Attendance Date':date,'Present':present?'YES':'NO','Status':present?'PRESENT':'ABSENT',
      'Academic Year':String(d.academicYear||'').trim(),'Term':String(d.term||'').trim(),
      'Recorded By':teacher.name+' ('+teacher.staffId+')','Date Created':now,'Last Updated':now
    };
    results.push(teacherPortalSafeUpsert('Student Attendance','Attendance ID',attendanceId,record));
  });
  return {success:results.every(x=>x&&x.success),results:results,count:results.length};
}
function teacherPortalSaveAttendanceReportDays(request,teacher){
  const d=request.data||{},studentId=String(d.studentId||'').trim(),className=String(d.className||'').trim();
  if(!teacherPortalAllowedClass(teacher,className))return {success:false,error:'This class is not assigned to this teacher.'};
  const student=teacherPortalStudentRows(teacher).find(r=>String(r['Student ID']||'').trim()===studentId&&String(r['Class']||'').trim().toLowerCase()===className.toLowerCase());
  if(!student)return {success:false,error:'Student is outside this teacher assignment.'};
  const days=Number(d.days);if(!Number.isInteger(days)||days<0)return {success:false,error:'Report Days must be a non-negative whole number.'};
  const year=String(d.academicYear||'').trim(),term=String(d.term||'').trim();
  if(!year||!term)return {success:false,error:'Academic Year and Term are required.'};
  const attendanceId=['REPORT_DAYS',studentId,year,term].join('|'),now=new Date().toISOString();
  const record={'Attendance ID':attendanceId,'Student ID':studentId,'Student Name':[student['First Name'],student['Middle Name'],student['Last Name']].map(v=>String(v||'').trim()).filter(Boolean).join(' '),'Class':className,'Date':'','Attendance Date':'','Present':'REPORT_DAYS:'+days+'|'+year+'|'+term,'Status':'REPORT_DAYS:'+days+'|'+year+'|'+term,'Academic Year':year,'Term':term,'Recorded By':teacher.name+' ('+teacher.staffId+')','Date Created':now,'Last Updated':now};
  return teacherPortalSafeUpsert('Student Attendance','Attendance ID',attendanceId,record);
}
function teacherPortalSaveAttendanceOutOfDays(request,teacher){
  const d=request.data||{},studentId=String(d.studentId||'').trim(),className=String(d.className||'').trim();
  if(!teacherPortalAllowedClass(teacher,className))return {success:false,error:'This class is not assigned to this teacher.'};
  const student=teacherPortalStudentRows(teacher).find(r=>String(r['Student ID']||'').trim()===studentId&&String(r['Class']||'').trim().toLowerCase()===className.toLowerCase());
  if(!student)return {success:false,error:'Student is outside this teacher assignment.'};
  const days=Number(d.days);if(!Number.isInteger(days)||days<0)return {success:false,error:'OUT OF Days must be a non-negative whole number.'};
  const year=String(d.academicYear||'').trim(),term=String(d.term||'').trim();
  if(!year||!term)return {success:false,error:'Academic Year and Term are required.'};
  const attendanceId=['OUT_OF_DAYS',studentId,year,term].join('|'),now=new Date().toISOString();
  const marker='OUT_OF_DAYS:'+days+'|'+year+'|'+term;
  const record={'Attendance ID':attendanceId,'Student ID':studentId,'Student Name':[student['First Name'],student['Middle Name'],student['Last Name']].map(v=>String(v||'').trim()).filter(Boolean).join(' '),'Class':className,'Date':'','Attendance Date':'','Present':marker,'Status':marker,'Academic Year':year,'Term':term,'Recorded By':teacher.name+' ('+teacher.staffId+')','Date Created':now,'Last Updated':now};
  return teacherPortalSafeUpsert('Student Attendance','Attendance ID',attendanceId,record);
}
function teacherPortalSavePost(request,teacher){
  const d=request.data||{},className=String(d.className||'').trim(),subject=String(d.subject||'').trim(),type=String(d.type||'Announcement').trim();
  if(!teacherPortalAllowedClass(teacher,className))return {success:false,error:'This target class is not assigned to this teacher.'};
  // Announcements & Assignments is class-authorized for subject selection: a teacher
  // assigned to the target class may publish for any official subject or a real
  // custom subject entered through Other. A bare "Other" is not stored.
  if(type.toLowerCase()==='assignment'&&!teacherPortalAllowedResultSubject(subject))
    return {success:false,error:'Please select a valid subject. If you choose Other, type the actual subject name.'};
  if(type.toLowerCase()==='assignment'&&subject){
    const subjectSync=afisapSyncSubjectsToSheet_([subject]);
    if(!subjectSync.success)return {success:false,error:'The assignment subject could not be synchronized to the Subjects Google Sheet. '+String(subjectSync.error||'')};
  }

  const now=new Date().toISOString(),id=String(d.id||('TP-'+teacher.staffId+'-'+Date.now())).trim();

  // IDOR protection: a Teacher may update only a post that already belongs
  // to that same Staff ID. Supplying another teacher's Announcement ID cannot
  // overwrite their record.
  const existingPost=teacherPortalReadUsedRows('Announcements & Assignments')
    .find(r=>String(r['Announcement ID']||'').trim()===id);
  if(existingPost){
    const ownerId=String(existingPost['Posted By Staff ID']||'').trim();
    const createdBy=String(existingPost['Created By']||'');
    if((ownerId&&ownerId!==teacher.staffId)||(!ownerId&&createdBy.indexOf(teacher.staffId)===-1)){
      return {success:false,error:'You are not authorized to update this announcement or assignment.'};
    }
  }

  const attachmentId=String(d.attachmentFileId||'').trim();
  if(attachmentId){
    try{
      const file=afisapRequireManagedFile_(attachmentId);
      const expectedFolder=getAfisapDriveFolder('announcements','');
      let allowed=false,parents=file.getParents();
      while(parents.hasNext()){if(parents.next().getId()===expectedFolder.getId()){allowed=true;break;}}
      if(!allowed)return {success:false,error:'The selected attachment is not an authorized Announcements & Assignments file.'};
    }catch(e){return {success:false,error:'The selected attachment is unavailable or unauthorized.'};}
  }

  const record={
    'Announcement ID':id,'Type':type,'Title':String(d.title||'').trim(),'Message':String(d.message||'').trim(),
    'Class':className,'Subject':subject,'Target Audience':'Specific Class','Date Posted':String(d.datePosted||now.slice(0,10)),
    'Due Date':String(d.dueDate||'').trim(),'Attachment':attachmentId,'Attachment Name':String(d.attachmentName||'').trim(),
    'Status':'Published','Created By':teacher.name+' | '+teacher.staffId+' | Teacher',
    'Posted By Staff ID':teacher.staffId,'Posted By Role':'Teacher',
    'Academic Year':String(d.academicYear||'').trim(),'Term':String(d.term||'').trim(),'Last Updated':now
  };
  if(!record['Title']||!record['Message'])return {success:false,error:'Title and message/instructions are required.'};
  return teacherPortalSafeUpsert('Announcements & Assignments','Announcement ID',id,record);
}
function teacherPortalDeletePost(request,teacher){
  const d=request.data||{},id=String(d.id||d.postId||'').trim();
  if(!id)return {success:false,error:'Announcement ID is required.'};
  const sheet=teacherPortalExistingSheet('Announcements & Assignments');
  const found=findRowByField(sheet,'Announcement ID',id);
  if(!found)return {success:true,message:'Post is already deleted.',id:id};

  const headers=getHeaders(sheet),row=rowToObject(headers,found.row);
  const ownerId=String(row['Posted By Staff ID']||'').trim();
  const createdBy=String(row['Created By']||'').trim();
  const staffId=String(teacher.staffId||'').trim();
  const escaped=staffId.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const legacyOwned=escaped?new RegExp('(^|[^A-Za-z0-9_-])'+escaped+'([^A-Za-z0-9_-]|$)').test(createdBy):false;
  if((ownerId&&ownerId!==staffId)||(!ownerId&&!legacyOwned)){
    return {success:false,error:'You are not authorized to delete this announcement or assignment.'};
  }

  // Delete the exact shared communication row.  If Google Sheets temporarily
  // refuses a structural row deletion, fall back to changing Status so the
  // record immediately disappears from Parent Portal and Teacher Portal feeds.
  try{
    sheet.deleteRow(found.rowNumber);
    SpreadsheetApp.flush();
    const stillThere=findRowByField(sheet,'Announcement ID',id);
    if(!stillThere)return {success:true,message:'Post deleted from the shared communication Google Sheet.',id:id};
  }catch(ignore){}

  const fallback=findRowByField(sheet,'Announcement ID',id);
  if(!fallback)return {success:true,message:'Post deleted from the shared communication Google Sheet.',id:id};
  const statusIndex=headers.indexOf('Status');
  if(statusIndex<0)return {success:false,error:'The post could not be deleted because the communication sheet has no Status field.'};
  sheet.getRange(fallback.rowNumber,statusIndex+1).setValue('Deleted');
  const updatedIndex=headers.indexOf('Last Updated');
  if(updatedIndex>=0)sheet.getRange(fallback.rowNumber,updatedIndex+1).setValue(new Date().toISOString());
  SpreadsheetApp.flush();
  return {success:true,message:'Post removed from all published communication feeds.',id:id};
}

function teacherPortalEnsureProfileHeaders(){
  // IMPORTANT: the production workbook is already extremely close to the
  // Google Sheets 10,000,000-cell limit. Teacher profile saving must therefore
  // NEVER add columns to the Teachers sheet. Existing columns are used when
  // present; profile-only fields that do not have a current Teachers header are
  // persisted in Script Properties instead of expanding the workbook schema.
  return getHeaders(teacherPortalExistingSheet('Teachers'));
}
function teacherPortalProfilePropertyKey_(staffId){
  return 'AFISAP_TEACHER_PROFILE_V2_'+String(staffId||'').trim();
}
function teacherPortalProfileExtras_(staffId){
  const id=String(staffId||'').trim();if(!id)return {};
  try{return JSON.parse(PropertiesService.getScriptProperties().getProperty(teacherPortalProfilePropertyKey_(id))||'{}')||{}}catch(e){return {}}
}
function teacherPortalSaveProfileExtras_(staffId,values){
  const id=String(staffId||'').trim();if(!id)return;
  PropertiesService.getScriptProperties().setProperty(teacherPortalProfilePropertyKey_(id),JSON.stringify(values||{}));
}
function teacherPortalProfileFromRow(r){
  const staffId=String(r['Staff ID']||r['StaffID']||'').trim(),x=teacherPortalProfileExtras_(staffId);
  const pick=(sheetValue,extraKey)=>String(sheetValue!==undefined&&sheetValue!==null&&String(sheetValue).trim()!==''?sheetValue:(x[extraKey]??'')).trim();
  const first=pick(r['First Name'],'firstName'),middle=pick(r['Middle Name'],'middleName'),surname=pick(r['Last Name']!==undefined?r['Last Name']:r['Surname'],'surname');
  const rowName=teacherPortalTeacherName(r),extraName=[first,middle,surname].filter(Boolean).join(' ');
  return {
    staffId:staffId,
    firstName:first, middleName:middle,
    surname:surname, name:extraName||rowName,
    gender:pick(r['Gender'],'gender'), dateOfBirth:pick(r['Date of Birth'],'dateOfBirth'),
    maritalStatus:pick(r['Marital Status'],'maritalStatus'), numberOfChildren:pick(r['Number of Children'],'numberOfChildren'), nationality:pick(r['Nationality'],'nationality'),
    phone:pick(r['Phone']!==undefined?r['Phone']:r['Contact'],'phone'), email:pick(r['Email Address']!==undefined?r['Email Address']:r['Email'],'email'),
    residentialAddress:pick(r['Address'],'residentialAddress'), addressLine:pick(r['Address Line'],'addressLine'), city:pick(r['City'],'city'), region:pick(r['Region'],'region'), postOfficeAddress:pick(r['Post Office Address'],'postOfficeAddress'),
    ghanaCard:pick(r['Ghana Card Number']!==undefined?r['Ghana Card Number']:r['Ghana Card'],'ghanaCard'),
    emergencyName:pick(r['Emergency Contact Name'],'emergencyName'), emergencyPhone:pick(r['Emergency Contact Phone'],'emergencyPhone'), emergencyRelationship:pick(r['Emergency Contact Relationship'],'emergencyRelationship'),
    nextKinName:pick(r['Next of Kin Name'],'nextKinName'), nextKinContact:pick(r['Next of Kin Contact'],'nextKinContact'), nextKinRelationship:pick(r['Next of Kin Relationship'],'nextKinRelationship'),
    position:String(r['Position']||'Teacher').trim(), department:pick(r['Department'],'department'), assignedClass:String(r['Class']||'').trim(), assignedSubject:String(r['Subject']||'').trim(),
    dateJoined:String(r['Appointment Date']||r['Date Joined']||'').trim(), employmentType:pick(r['Employment Type'],'employmentType'), status:String(r['Status']||'Active').trim(),
    photoFileId:String(r['Passport Photo']||r['Profile Photo Drive File ID']||'').trim(), lastProfileUpdated:pick(r['Last Profile Updated']!==undefined?r['Last Profile Updated']:r['Last Updated'],'lastProfileUpdated')
  };
}
function teacherPortalGetProfile(teacher){
  const row=teacherPortalReadUsedRows('Teachers').find(r=>String(r['Staff ID']||r['StaffID']||'').trim()===teacher.staffId);
  if(!row)return {success:false,error:'Teacher profile record not found.'};
  return {success:true,profile:teacherPortalProfileFromRow(row)};
}
function teacherPortalGetProfilePhoto(teacher){
  const profileResult=teacherPortalGetProfile(teacher);if(!profileResult.success)return profileResult;
  const raw=String(profileResult.profile.photoFileId||'').trim(),match=raw.match(/[-\w]{20,}/),fileId=match?match[0]:'';
  if(!fileId)return {success:true,fileData:'',mimeType:'',fileId:''};
  const file=afisapRequireManagedFile_(fileId),blob=file.getBlob();
  return {success:true,fileId:fileId,mimeType:blob.getContentType(),fileData:Utilities.base64Encode(blob.getBytes())};
}
function teacherPortalSaveProfile(request,teacher){
  const d=request.data||{};
  const first=String(d.firstName||'').trim(),surname=String(d.surname||'').trim();
  if(!first||!surname)return {success:false,error:'First Name and Surname are required.'};
  const email=String(d.email||'').trim();if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {success:false,error:'Enter a valid email address.'};
  const children=String(d.numberOfChildren??'').trim();if(children!==''&&(!/^\d+$/.test(children)||Number(children)<0))return {success:false,error:'Number of Children must be zero or a positive whole number.'};
  const dob=String(d.dateOfBirth||'').trim();if(dob&&isNaN(new Date(dob).getTime()))return {success:false,error:'Enter a valid Date of Birth.'};
  const sheet=teacherPortalExistingSheet('Teachers');
  const match=findRowByField(sheet,'Staff ID',teacher.staffId);if(!match)return {success:false,error:'Teacher profile record not found.'};
  const headers=getHeaders(sheet),now=new Date().toISOString();
  const values={
    'First Name':first,'Middle Name':String(d.middleName||'').trim(),'Last Name':surname,'Full Name':[first,String(d.middleName||'').trim(),surname].filter(Boolean).join(' '),
    'Gender':String(d.gender||'').trim(),'Date of Birth':dob,'Marital Status':String(d.maritalStatus||'').trim(),'Number of Children':children,'Nationality':String(d.nationality||'').trim(),
    'Phone':String(d.phone||'').trim(),'Email':email,'Email Address':email,'Address':String(d.residentialAddress||'').trim(),'Address Line':String(d.addressLine||'').trim(),'City':String(d.city||'').trim(),'Region':String(d.region||'').trim(),'Post Office Address':String(d.postOfficeAddress||'').trim(),
    'Ghana Card':String(d.ghanaCard||'').trim(),'Ghana Card Number':String(d.ghanaCard||'').trim(),
    'Emergency Contact Name':String(d.emergencyName||'').trim(),'Emergency Contact Phone':String(d.emergencyPhone||'').trim(),'Emergency Contact Relationship':String(d.emergencyRelationship||'').trim(),
    'Next of Kin Name':String(d.nextKinName||'').trim(),'Next of Kin Contact':String(d.nextKinContact||'').trim(),'Next of Kin Relationship':String(d.nextKinRelationship||'').trim(),
    'Last Profile Updated':now,'Last Updated':now
  };
  // Store the complete editable profile without adding a single workbook cell.
  // This is the cell-limit-safe store for fields whose columns do not already
  // exist on the Teachers sheet.
  const profileExtras={
    firstName:first,middleName:String(d.middleName||'').trim(),surname:surname,
    gender:String(d.gender||'').trim(),dateOfBirth:dob,maritalStatus:String(d.maritalStatus||'').trim(),numberOfChildren:children,nationality:String(d.nationality||'').trim(),
    phone:String(d.phone||'').trim(),email:email,residentialAddress:String(d.residentialAddress||'').trim(),addressLine:String(d.addressLine||'').trim(),city:String(d.city||'').trim(),region:String(d.region||'').trim(),postOfficeAddress:String(d.postOfficeAddress||'').trim(),
    ghanaCard:String(d.ghanaCard||'').trim(),emergencyName:String(d.emergencyName||'').trim(),emergencyPhone:String(d.emergencyPhone||'').trim(),emergencyRelationship:String(d.emergencyRelationship||'').trim(),
    nextKinName:String(d.nextKinName||'').trim(),nextKinContact:String(d.nextKinContact||'').trim(),nextKinRelationship:String(d.nextKinRelationship||'').trim(),lastProfileUpdated:now
  };
  teacherPortalSaveProfileExtras_(teacher.staffId,profileExtras);

  // Update only columns that ALREADY exist. No insertColumnsAfter call is made,
  // so the near-10M-cell workbook is not expanded. One row write keeps this fast.
  const row=match.row.slice();
  headers.forEach((h,i)=>{if(values[h]!==undefined)row[i]=values[h]});
  sheet.getRange(match.rowNumber,1,1,headers.length).setValues([row]);
  return {success:true,profile:teacherPortalProfileFromRow(rowToObject(headers,row)),message:'Profile updated successfully.'};
}
function teacherPortalFinancialBundle(teacher){
  const students=teacherPortalPublicStudentsForTeacher(teacher).filter(s=>s.studentId);
  const normalizedId=v=>String(v||'').trim().toLowerCase();
  const ids=new Set(students.map(s=>normalizedId(s.studentId))),fees=[];
  const allFeeRows=teacherPortalReadUsedRows('Fees');

  // Build a conservative amount -> configured fee-name map. This repairs old
  // student fee rows that were saved before the exact Fee Item field was
  // preserved, but only when one configured fee name uniquely matches that
  // amount. We never guess when two configured fees share the same amount.
  const configuredNamesByAmount={};
  allFeeRows.forEach(r=>{
    const feeId=String(r['Fee ID']||'').trim();
    if(!/^FEE_ITEM\|/i.test(feeId))return;
    const name=String(r['Fee Item']||'').trim();
    const amount=Number(r['Amount Due']);
    if(!name||!Number.isFinite(amount))return;
    const key=amount.toFixed(2);
    if(!configuredNamesByAmount[key])configuredNamesByAmount[key]=new Set();
    configuredNamesByAmount[key].add(name);
  });

  allFeeRows.forEach(r=>{
    const feeId=String(r['Fee ID']||'').trim();
    if(/^FEE_ITEM\|/i.test(feeId))return;

    let sid=String(r['Student ID']||'').trim();
    if(sid){
      if(!ids.has(normalizedId(sid)))return;
    }else{
      sid=afisapFeeStudentLink(r,students);
      if(!sid || !ids.has(normalizedId(sid)))return;
    }

    r['Student ID']=sid;

    if(!String(r['Fee Item']||'').trim()){
      const amount=Number(r['Amount Due']);
      if(Number.isFinite(amount)){
        const names=configuredNamesByAmount[amount.toFixed(2)];
        if(names&&names.size===1)r['Fee Item']=Array.from(names)[0];
      }
    }

    fees.push(r);
  });
  return {students:students,fees:fees};
}


function afisapFeesCommunicationDiagnostic(request){
  const staffId=String(request.staffId||'').trim();
  if(!staffId)return {success:false,error:'Staff ID is required for the Fees communication diagnostic.'};
  const teacherRow=afisapTeacherRowById_(staffId);
  if(!teacherRow)return {success:false,error:'Teacher record not found.'};
  const teacher=teacherPortalPublicTeacher(teacherRow);
  const students=teacherPortalPublicStudentsForTeacher(teacher).filter(s=>s.studentId);
  const idKey=v=>String(v||'').trim().toLowerCase();
  const authorizedIds=new Set(students.map(s=>idKey(s.studentId)));
  let sheetRecords=0,withStudentId=0,matched=0,rejectedStudentId=0,rejectedUnresolved=0;
  teacherPortalReadUsedRows('Fees').forEach(r=>{
    const feeId=String(r['Fee ID']||'').trim();
    if(/^FEE_ITEM\|/i.test(feeId))return;
    sheetRecords++;
    const storedId=String(r['Student ID']||'').trim();
    if(storedId)withStudentId++;
    if(storedId&&authorizedIds.has(idKey(storedId))){matched++;return;}
    const resolved=afisapFeeStudentLink(r,students);
    if(resolved&&authorizedIds.has(idKey(resolved))){matched++;return;}
    if(storedId)rejectedStudentId++;else rejectedUnresolved++;
  });
  return {success:true,diagnostic:{
    feesRecordsFoundInSheet:sheetRecords,
    authorizedStudents:students.length,
    feesWithStudentId:withStudentId,
    feesSuccessfullyMatched:matched,
    feesRejectedBecauseStudentIdDidNotMatch:rejectedStudentId,
    feesRejectedBecauseNoStudentCouldBeResolved:rejectedUnresolved
  }};
}

function teacherPortalPeriodKey_(value){
  const raw=String(value||'').trim().toLowerCase().replace(/\s+/g,'');
  const m=raw.match(/(?:term)?([123])/);
  return m?'term'+m[1]:raw;
}
function teacherPortalAcademicYearKey_(value){
  const raw=String(value||'').trim().toLowerCase();
  const years=raw.match(/\d{4}/g);
  if(years&&years.length>=2)return years[0]+'/'+years[1];
  return raw.replace(/\s+/g,'').replace(/[-–—]/g,'/');
}
function teacherPortalClassKey_(value){
  return String(value||'').trim().toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'');
}
function teacherPortalGet(request){
  try{
    const type=String(request.type||'teachers').trim().toLowerCase();
    if(type==='school')return {success:true,school:teacherPortalSchoolInfo()};
    if(type==='diagnostics')return {success:false,error:'Diagnostics are restricted to administrators.'};
    if(type==='teachers')return {success:false,error:'Teacher directory access is not permitted from the Teacher Portal.'};

    // Resolve the authenticated teacher once. Do not build the entire teacher
    // directory for every Teacher Portal request.
    const staffId=String(request._session?.principal?.staffId||request.staffId||'').trim();
    const teacherRow=afisapTeacherRowById_(staffId);
    if(!teacherRow)return {success:false,error:'Teacher record not found.'};
    const teacher=teacherPortalPublicTeacher(teacherRow);
    if(!teacher.staffId)return {success:false,error:'Teacher record not found.'};

    if(type==='profile'){
      return {success:true,profile:teacherPortalProfileFromRow(teacherRow)};
    }

    if(type==='profilephoto'){
      const raw=String(teacherRow['Passport Photo']||teacherRow['Profile Photo Drive File ID']||'').trim();
      const match=raw.match(/[-\w]{20,}/),fileId=match?match[0]:'';
      if(!fileId)return {success:true,fileData:'',mimeType:'',fileId:''};
      const file=afisapRequireManagedFile_(fileId),blob=file.getBlob();
      return {success:true,fileId:fileId,mimeType:blob.getContentType(),fileData:Utilities.base64Encode(blob.getBytes())};
    }

    if(type==='initial'){
      // Initial login payload: only identity/profile + authorized roster.
      // Results, attendance, fees, reports and posts are deliberately excluded.
      const students=teacherPortalPublicStudentsForTeacher(teacher)
        .filter(s=>s.studentId&&s.name)
        .sort((a,b)=>a.name.localeCompare(b.name));
      return {
        success:true,
        teacher:{
          staffId:teacher.staffId,
          name:teacher.name,
          position:teacher.position,
          classes:teacher.classes,
          subjects:teacher.subjects
        },
        profile:teacherPortalProfileFromRow(teacherRow),
        students:students,
        school:teacherPortalSchoolInfo(),
        schoolClasses:teacherPortalCentralClassNames()
      };
    }

    // Backward-compatible teacher endpoint for any existing caller. It is
    // intentionally limited to identity + roster and does not preload large
    // academic/financial datasets.
    if(type==='teacher'){
      const students=teacherPortalPublicStudentsForTeacher(teacher)
        .filter(s=>s.studentId&&s.name)
        .sort((a,b)=>a.name.localeCompare(b.name));
      return {
        success:true,
        teacher:{
          staffId:teacher.staffId,
          name:teacher.name,
          position:teacher.position,
          classes:teacher.classes,
          subjects:teacher.subjects
        },
        students:students
      };
    }

    const requestedClass=String(request.className||'').trim();
    if(requestedClass && !teacherPortalAllowedClass(teacher,requestedClass)){
      return {success:false,error:'Unauthorized class request.'};
    }

    const allStudents=teacherPortalPublicStudentsForTeacher(teacher).filter(s=>s.studentId&&s.name);
    const students=requestedClass
      ? allStudents.filter(s=>teacherPortalClassKey_(s.className)===teacherPortalClassKey_(requestedClass))
      : allStudents;
    const ids=new Set(students.map(s=>String(s.studentId||'').trim()));

    if(type==='results'){
      const year=String(request.academicYear||'').trim();
      const term=String(request.term||'').trim();
      const results=teacherPortalReadUsedRows('Results').filter(r=>{
        const sid=String(r['Student ID']||'').trim();
        if(!ids.has(sid))return false;
        // Results & Marks is class-authorized. Show every official/custom subject
        // saved for students in the teacher's assigned class, matching the same
        // authorization rule used by teacherPortalSaveResult().
        const ry=String(r['Academic Year']||'').trim(),rt=String(r['Term']||'').trim();
        if(year&&ry&&ry!==year)return false;
        if(term&&rt&&teacherPortalPeriodKey_(rt)!==teacherPortalPeriodKey_(term))return false;
        return true;
      });
      return {success:true,results:results};
    }

    if(type==='attendance'){
      const year=String(request.academicYear||'').trim();
      const term=String(request.term||'').trim();
      const attendance=teacherPortalReadUsedRows('Student Attendance').filter(r=>{
        if(!ids.has(String(r['Student ID']||'').trim()))return false;
        const ry=String(r['Academic Year']||'').trim(),rt=String(r['Term']||'').trim();
        if(year&&ry&&ry!==year)return false;
        if(term&&rt&&teacherPortalPeriodKey_(rt)!==teacherPortalPeriodKey_(term))return false;
        return true;
      });
      return {success:true,attendance:attendance};
    }

    if(type==='studentfees'){
      // Read-only fee statement for one explicitly selected, authorized student.
      // IMPORTANT: use the SAME canonical fee bundle used by Report Cards.
      // Report Cards were already proving that the Fees sheet row was readable;
      // the former student-fees endpoint duplicated its own matching logic and
      // could therefore disagree with the working report-card path.
      const sid=String(request.studentId||'').trim();
      if(!sid)return {success:false,error:'Student ID is required.'};
      const target=allStudents.find(s=>String(s.studentId||'').trim()===sid);
      if(!target)return {success:false,error:'Student is outside this teacher assignment.'};
      if(requestedClass&&teacherPortalClassKey_(target.className)!==teacherPortalClassKey_(requestedClass)){
        return {success:false,error:'Student is outside the selected class.'};
      }

      const year=String(request.academicYear||'').trim();
      const term=String(request.term||'').trim();
      const financial=teacherPortalFinancialBundle(teacher);
      const wantedId=String(target.studentId||'').trim().toLowerCase();
      const fees=financial.fees.filter(r=>{
        if(String(r['Student ID']||'').trim().toLowerCase()!==wantedId)return false;
        const fy=String(r['Academic Year']||'').trim();
        const ft=String(r['Term']||'').trim();
        if(year&&fy&&teacherPortalAcademicYearKey_(fy)!==teacherPortalAcademicYearKey_(year))return false;
        if(term&&ft&&teacherPortalPeriodKey_(ft)!==teacherPortalPeriodKey_(term))return false;
        return true;
      });

      return {
        success:true,
        student:target,
        fees:fees,
        school:teacherPortalSchoolInfo(),
        diagnostic:{
          requestedStudentId:sid,
          requestedAcademicYear:year,
          requestedTerm:term,
          canonicalTeacherFeeRows:financial.fees.length,
          matchedStudentFeeRows:fees.length
        }
      };
    }

    if(type==='fees'){
      // Financial access remains read-only and is still restricted to the
      // authenticated teacher's students.
      const financial=teacherPortalFinancialBundle(teacher);
      const feeStudents=requestedClass
        ? financial.students.filter(s=>teacherPortalClassKey_(s.className)===teacherPortalClassKey_(requestedClass))
        : financial.students;
      const feeIds=new Set(feeStudents.map(s=>String(s.studentId||'').trim().toLowerCase()));
      const year=String(request.academicYear||'').trim();
      const term=String(request.term||'').trim();
      const fees=financial.fees.filter(f=>{
        if(!feeIds.has(String(f['Student ID']||'').trim().toLowerCase()))return false;
        const fy=String(f['Academic Year']||'').trim(),ft=String(f['Term']||'').trim();
        if(year&&fy&&teacherPortalAcademicYearKey_(fy)!==teacherPortalAcademicYearKey_(year))return false;
        if(term&&ft&&teacherPortalPeriodKey_(ft)!==teacherPortalPeriodKey_(term))return false;
        return true;
      });
      return {
        success:true,
        students:feeStudents,
        fees:fees,
        financialSummary:{
          authorizedStudents:feeStudents.length,
          matchedFeeRecords:fees.length,
          serverTime:new Date().toISOString()
        }
      };
    }

    if(type==='posts'){
      const posts=teacherPortalReadUsedRows('Announcements & Assignments').filter(r=>{
        if(String(r['Status']||'Published').trim().toLowerCase()!=='published')return false;
        const postedBy=String(r['Posted By Staff ID']||'').trim();
        if(postedBy)return postedBy===String(teacher.staffId||'').trim();
        const creator=String(r['Created By']||'').trim();
        const escaped=String(teacher.staffId||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        return escaped?new RegExp('(^|[^A-Za-z0-9_-])'+escaped+'([^A-Za-z0-9_-]|$)').test(creator):false;
      });
      return {success:true,posts:posts};
    }

    if(type==='reports'){
      const year=String(request.academicYear||'').trim();
      const term=String(request.term||'').trim();
      const results=teacherPortalReadUsedRows('Results').filter(r=>{
        const sid=String(r['Student ID']||'').trim();
        if(!ids.has(sid))return false;
        const ry=String(r['Academic Year']||'').trim(),rt=String(r['Term']||'').trim();
        if(year&&ry&&ry!==year)return false;
        if(term&&rt&&teacherPortalPeriodKey_(rt)!==teacherPortalPeriodKey_(term))return false;
        return true;
      });
      const attendance=teacherPortalReadUsedRows('Student Attendance').filter(r=>{
        if(!ids.has(String(r['Student ID']||'').trim()))return false;
        const ry=String(r['Academic Year']||'').trim(),rt=String(r['Term']||'').trim();
        if(year&&ry&&ry!==year)return false;
        if(term&&rt&&teacherPortalPeriodKey_(rt)!==teacherPortalPeriodKey_(term))return false;
        return true;
      });
      const financial=teacherPortalFinancialBundle(teacher);
      const feeIds=new Set(financial.students
        .filter(s=>!requestedClass||String(s.className||'').trim().toLowerCase()===requestedClass.toLowerCase())
        .map(s=>String(s.studentId||'').trim().toLowerCase()));
      const fees=financial.fees.filter(f=>{
        if(!feeIds.has(String(f['Student ID']||'').trim().toLowerCase()))return false;
        const fy=String(f['Academic Year']||'').trim(),ft=String(f['Term']||'').trim();
        if(year&&fy&&fy!==year)return false;
        if(term&&ft&&teacherPortalPeriodKey_(ft)!==teacherPortalPeriodKey_(term))return false;
        return true;
      });
      return {
        success:true,
        results:results,
        attendance:attendance,
        fees:fees,
        reportCardDates:teacherPortalReportCardDates()
      };
    }

    if(type==='studentphoto'){
      const sid=String(request.studentId||'').trim();
      const row=teacherPortalStudentRows(teacher).find(r=>String(r['Student ID']||'').trim()===sid);
      if(!row)return {success:false,error:'Student is outside this teacher assignment.'};
      const raw=String(row['Passport Photo']||row['Passport Photo URL']||'').trim();
      const match=raw.match(/[-\w]{20,}/),fileId=match?match[0]:'';
      if(!fileId)return {success:true,fileData:'',mimeType:''};
      const file=afisapRequireManagedFile_(fileId),blob=file.getBlob();
      return {success:true,mimeType:blob.getContentType(),fileData:Utilities.base64Encode(blob.getBytes())};
    }

    return {success:false,error:'Unsupported Teacher Portal request.'};
  }catch(e){
    return {success:false,error:'Teacher Portal data is temporarily unavailable: '+e.message};
  }
}
function teacherPortalCentralClassNames(){
  const defaults=['Creche','Nursery 1','Nursery 2','KG 1','KG 2','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','JHS 1','JHS 2','JHS 3'];
  const created=teacherPortalReadUsedRows('Classes').map(r=>String(r['Class Name']||'').trim()).filter(Boolean);
  const source=created.length?created:defaults;
  const out=[],seen={};
  source.forEach(name=>{
    const clean=String(name||'').trim(),key=clean.toLowerCase();if(clean&&!seen[key]){seen[key]=true;out.push(clean)}
  });
  return out;
}
function teacherPortalClassExists(name){
  const key=String(name||'').trim().toLowerCase();
  return !!key&&teacherPortalCentralClassNames().some(c=>c.toLowerCase()===key);
}
function teacherPortalPromotionClassOrder(){
  return ['Nursery 1','Nursery 2','KG 1','KG 2','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','JHS 1','JHS 2','JHS 3'];
}
function teacherPortalPromotionNextClass(currentClass){
  const names=teacherPortalPromotionClassOrder(),wanted=String(currentClass||'').trim().toLowerCase();
  const idx=names.findIndex(n=>n.toLowerCase()===wanted);
  return idx>=0&&idx<names.length-1?names[idx+1]:'';
}
function teacherPortalIsTerm3(value){
  const key=String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  return key==='term3'||key==='3'||key==='thirdterm';
}
function teacherPortalPromotionFastRollSync_(sheet,data,headers){
  const sidIdx=headers.indexOf('Student ID'),classIdx=headers.indexOf('Class'),rollIdx=headers.indexOf('Roll No.'),totalIdx=headers.indexOf('No. on Roll');
  if(sidIdx<0||classIdx<0||rollIdx<0||totalIdx<0)return {success:true,updated:0,skipped:true};
  const groups={};
  for(let i=1;i<data.length;i++){
    const sid=String(data[i][sidIdx]||'').trim();if(!sid)continue;
    const key=String(data[i][classIdx]||'').trim().toLowerCase();
    if(!groups[key])groups[key]=[];groups[key].push(i);
  }
  Object.keys(groups).forEach(key=>{
    const rows=groups[key],used={},assigned={};
    rows.forEach(i=>{const raw=String(data[i][rollIdx]||'').trim(),n=/^\d+$/.test(raw)?Number(raw):0;if(n>0&&!used[n]){used[n]=true;assigned[i]=n}});
    let next=1;rows.forEach(i=>{if(assigned[i])return;while(used[next])next++;assigned[i]=next;used[next]=true;next++});
    const size=rows.length;rows.forEach(i=>{data[i][rollIdx]=String(assigned[i]).padStart(2,'0');data[i][totalIdx]=size});
  });
  if(data.length>1){
    sheet.getRange(2,rollIdx+1,data.length-1,1).setValues(data.slice(1).map(r=>[r[rollIdx]]));
    sheet.getRange(2,totalIdx+1,data.length-1,1).setValues(data.slice(1).map(r=>[r[totalIdx]]));
  }
  return {success:true,updated:data.length-1,skipped:false};
}
function teacherPortalPromoteStudents(request,teacher){
  const d=request.data||{},currentClass=String(d.currentClass||'').trim(),requestedNewClass=String(d.newClass||'').trim();
  const ids=[...new Set((Array.isArray(d.studentIds)?d.studentIds:[]).map(v=>String(v||'').trim()).filter(Boolean))];
  const reviewedIds=[...new Set((Array.isArray(d.reviewedStudentIds)?d.reviewedStudentIds:ids).map(v=>String(v||'').trim()).filter(Boolean))];
  if(!teacherPortalAllowedClass(teacher,currentClass))return {success:false,error:'Unauthorized promotion request: this class is not assigned to this teacher.'};
  const school=teacherPortalSchoolInfo(),selectedTerm=String(d.term||'').trim();
  if(!teacherPortalIsTerm3(selectedTerm))return {success:false,error:'Student promotion recommendations are available only when Term 3 is selected in Results & Marks.'};
  if(!reviewedIds.length)return {success:false,error:'Review at least one student before saving promotion decisions.'};
  // The Classes sheet is the authority for promotion destinations. Standard
  // class order is used only as a suggested default; an administrator-created
  // class/stream (for example Nursery 1 A or Class 1 B) remains selectable.
  const automaticClass=teacherPortalPromotionNextClass(currentClass),newClass=requestedNewClass||automaticClass;
  if(!newClass)return {success:false,error:'Select a destination class.'};
  if(newClass.toLowerCase()===currentClass.toLowerCase())return {success:false,error:'Destination class must be different from the current class.'};
  if(!teacherPortalClassExists(newClass))return {success:false,error:'Promotion destination is not an existing class in the Classes sheet.'};
  const sheet=teacherPortalExistingSheet('Students'),lastRow=sheet.getLastRow(),lastColumn=sheet.getLastColumn();
  if(lastRow<2||lastColumn<1)return {success:false,error:'No student records were found.'};
  const data=sheet.getRange(1,1,lastRow,lastColumn).getValues(),headers=data[0].map(String),sidIdx=headers.indexOf('Student ID'),classIdx=headers.indexOf('Class');
  if(sidIdx<0||classIdx<0)return {success:false,error:'Students sheet must contain Student ID and Class columns.'};
  const wanted=new Set(reviewedIds),found=new Set();
  for(let i=1;i<data.length;i++){
    const sid=String(data[i][sidIdx]||'').trim();if(!wanted.has(sid))continue;
    const actualClass=String(data[i][classIdx]||'').trim();
    if(actualClass.toLowerCase()!==currentClass.toLowerCase())return {success:false,error:'Student ID '+sid+' is not currently in '+currentClass+'. Refresh the portal and try again.'};
    found.add(sid);
  }
  const missing=reviewedIds.filter(id=>!found.has(id));if(missing.length)return {success:false,error:'Student record(s) not found: '+missing.join(', ')};
  const year=String(d.academicYear||school.academicYear||''),selectedSet=new Set(ids),now=new Date().toISOString();
  reviewedIds.forEach(sid=>{
    if(selectedSet.has(sid)){
      afisapSavePromotionRecord_(sid,currentClass,newClass,year,selectedTerm,'pending',{decision:'promote',recommendedByStaffId:teacher.staffId,recommendedBy:teacher.name,recommendedAt:now});
    }else{
      afisapSavePromotionRecord_(sid,currentClass,currentClass,year,selectedTerm,'repeat',{decision:'repeat',recommendedByStaffId:teacher.staffId,recommendedBy:teacher.name,recommendedAt:now});
    }
  });
  return {success:true,message:'Promotion decisions saved.',promoted:ids.length,repeated:reviewedIds.length-ids.length,promotedStudentIds:ids,reviewedStudentIds:reviewedIds,currentClass:currentClass,newClass:newClass,academicYear:year,term:selectedTerm,status:'saved'};
}


function teacherPortalSaveFile(request,teacher,kind){
  const d=request.data||{};
  const fileData=String(d.fileData||'');
  if(!fileData)return {success:false,error:'No file data supplied.'};
  if(kind==='profilephoto'){
    return driveUpload({
      fileName:String(d.fileName||('teacher-'+teacher.staffId+'.jpg')),
      mimeType:String(d.mimeType||'image/jpeg'),
      fileData:fileData,
      category:'staff-passports',
      studentId:teacher.staffId
    });
  }
  if(kind==='attachmentupload'){
    return driveUpload({
      fileName:String(d.fileName||'attachment'),
      mimeType:String(d.mimeType||'application/octet-stream'),
      fileData:fileData,
      category:'announcements',
      studentId:''
    });
  }
  return {success:false,error:'Unsupported Teacher Portal file operation.'};
}

function teacherPortalWrite(request){
  try{
    const teacher=teacherPortalResolveTeacher(request&&request._session&&request._session.principal&&request._session.principal.staffId);
    if(!teacher)return {success:false,error:'Teacher record not found.'};
    const type=String(request.type||'').trim().toLowerCase();
    if(type==='profile')return teacherPortalSaveProfile(request,teacher);
    if(type==='profilephoto')return teacherPortalSaveFile(request,teacher,'profilephoto');
    if(type==='attachmentupload')return teacherPortalSaveFile(request,teacher,'attachmentupload');
    if(type==='result')return teacherPortalSaveResult(request,teacher);
    if(type==='deleteresult')return teacherPortalDeleteResult(request,teacher);
    if(type==='attendance')return teacherPortalSaveAttendance(request,teacher);
    if(type==='attendancereportdays')return teacherPortalSaveAttendanceReportDays(request,teacher);
    if(type==='attendanceoutofdays')return teacherPortalSaveAttendanceOutOfDays(request,teacher);
    if(type==='promotion')return teacherPortalPromoteStudents(request,teacher);
    if(type==='post')return teacherPortalSavePost(request,teacher);
    if(type==='deletepost')return teacherPortalDeletePost(request,teacher);
    return {success:false,error:'Unsupported Teacher Portal write.'};
  }catch(e){
    return {success:false,error:'Teacher Portal save failed: '+e.message};
  }
}


function parentPortalPublicSchoolInfo(){
  let config={};
  try{config=configGet().config||{}}catch(e){const raw=PropertiesService.getScriptProperties().getProperty('AFISAP_CONFIG');if(raw){try{config=JSON.parse(raw)}catch(ignore){}}}
  const school=(config&&config.school&&typeof config.school==='object')?config.school:{};
  return {name:String(school.name||'AFISAP ROYAL ACADEMY'),motto:String(school.motto||'LEARNING TO LEARN'),phone:String(school.phone||school.phones||''),phone2:String(school.phone2||''),phone3:String(school.phone3||''),email:String(school.email||''),website:String(school.website||''),address:String(school.address||'')};
}

function parentPortalGet(request){
  try{
    const type=String(request.type||'home').trim().toLowerCase();

    if(type==='school'){
      return {success:true,school:parentPortalPublicSchoolInfo()};
    }

    if(type==='announcements'){
      const sheet=getAllowedSheet('Announcements & Assignments');
      const data=sheet.getDataRange().getValues();
      if(data.length<=1) return {success:true,records:[]};
      const headers=data[0];
      const parentStudentId=String(request._session?.principal?.studentId||'').trim();
      let verifiedClass='';
      if(parentStudentId){
        const student=findStudentByAnyId(parentStudentId);
        verifiedClass=String(student&&student['Class']||'').trim();
      }
      const records=data.slice(1)
        .filter(row=>row.some(value=>value!==''))
        .map(row=>rowToObject(headers,row))
        .filter(r=>String(r['Status']||'Published').trim().toLowerCase()==='published')
        .filter(r=>{
          const target=String(r['Target Audience']||'Entire School').trim().toLowerCase();
          const cls=String(r['Class']||'').trim();
          const schoolWide=!cls||target==='entire school'||target==='all'||target==='school';
          return schoolWide || (!!verifiedClass&&cls.toLowerCase()===verifiedClass.toLowerCase());
        })
        .map(r=>({
          id:String(r['Announcement ID']||''),
          type:String(r['Type']||'Announcement'),
          title:String(r['Title']||''),
          message:String(r['Message']||''),
          className:String(r['Class']||''),
          subject:String(r['Subject']||''),
          targetAudience:String(r['Target Audience']||'Entire School'),
          datePosted:String(r['Date Posted']||''),
          dueDate:String(r['Due Date']||''),
          attachmentFileId:String(r['Attachment']||''),
          attachmentName:String(r['Attachment Name']||''),
          academicYear:String(r['Academic Year']||''),
          term:String(r['Term']||'')
        }));
      return {success:true,records:records};
    }

    if(type==='classes'){
      const sheet=getAllowedSheet('Classes');
      const data=sheet.getDataRange().getValues();
      if(data.length<=1) return {success:true,records:[]};
      const headers=data[0];
      const records=data.slice(1)
        .filter(row=>row.some(value=>value!==''))
        .map(row=>rowToObject(headers,row))
        .map(r=>String(r['Class Name']||r['Class']||r['Name']||'').trim())
        .filter(Boolean);
      return {success:true,records:Array.from(new Set(records))};
    }

    if(type==='subjects'){
      const sheet=getAllowedSheet('Subjects');
      const data=sheet.getDataRange().getValues();
      if(data.length<=1) return {success:true,records:[]};
      const headers=data[0];
      const records=data.slice(1)
        .filter(row=>row.some(value=>value!==''))
        .map(row=>rowToObject(headers,row))
        .map(r=>String(r['Subject Name']||r['Subject']||r['Name']||'').trim())
        .filter(Boolean);
      return {success:true,records:Array.from(new Set(records))};
    }

    if(type==='students'){
      return {success:false,error:'Student directory is not public. Verify a student before viewing private information.'};
    }

    if(type==='attendance'){
      const studentId=String(request._session?.principal?.studentId||'').trim();
      if(!studentId) return {success:false,error:'Parent authentication is required.'};

      // Verify the requested student and return only the parent-facing fields.
      const studentSheet=ensureStudentRollFields();
      const studentData=studentSheet.getDataRange().getValues();
      if(studentData.length<=1) return {success:false,error:'Student not found.'};
      const sh=studentData[0];
      const sidIndex=sh.indexOf('Student ID');
      const studentRow=studentData.slice(1).find(row=>String(row[sidIndex]||'').trim()===studentId);
      if(!studentRow) return {success:false,error:'Student not found.'};
      const student=rowToObject(sh,studentRow);

      const attendanceSheet=getAllowedSheet('Student Attendance');
      const data=attendanceSheet.getDataRange().getValues();
      const records=[];
      if(data.length>1){
        const headers=data[0];
        const studentName=[student['First Name'],student['Middle Name'],student['Last Name']]
          .map(v=>String(v||'').trim()).filter(Boolean).join(' ');
        const studentClass=String(student['Class']||'').trim();

        // Current records are matched by the persistent Student ID.
        // Older attendance rows created before this correction may contain a
        // browser-only local ID; for those rows only, use exact Name + Class
        // as a compatibility fallback so historical attendance is not lost.
        const matching=data.slice(1).map(row=>rowToObject(headers,row)).filter(r=>{
          const recordStudentId=String(r['Student ID']||'').trim();
          const recordAdmission=String(r['Admission Number']||'').trim();
          const studentAdmission=String(student['Admission Number']||'').trim();
          if(recordStudentId===studentId) return true;
          if(studentAdmission && recordAdmission===studentAdmission) return true;

          const recordName=String(r['Student Name']||'').trim();
          const recordClass=String(r['Class']||'').trim();
          return !!studentName && !!studentClass &&
            recordName.toLowerCase()===studentName.toLowerCase() &&
            recordClass.toLowerCase()===studentClass.toLowerCase();
        });

        // One attendance result per date. Prefer Student ID / Admission Number
        // matches over the legacy exact Name + Class compatibility match.
        const byDate={};
        matching.forEach(r=>{
          const date=String(r['Attendance Date']||r['Date']||'').trim();
          if(!date) return;
          const studentAdmission=String(student['Admission Number']||'').trim();
          const direct=String(r['Student ID']||'').trim()===studentId ||
            (!!studentAdmission && String(r['Admission Number']||'').trim()===studentAdmission);
          if(byDate[date] && byDate[date]._direct && !direct) return;

          const statusRaw=String(r['Status']||'').trim().toLowerCase();
          const presentRaw=String(r['Present']!==undefined?r['Present']:'').trim().toLowerCase();
          const present=statusRaw
            ? ['present','yes','true','1'].includes(statusRaw)
            : ['present','yes','true','1'].includes(presentRaw);
          byDate[date]={date:date,present:present,status:present?'PRESENT':'ABSENT',_direct:direct};
        });

        Object.keys(byDate).sort().forEach(date=>{
          const item=byDate[date];
          records.push({date:item.date,present:item.present,status:item.status});
        });
      }
      return {
        success:true,
        student:{
          studentId:studentId,
          name:[student['First Name'],student['Middle Name'],student['Last Name']]
            .map(v=>String(v||'').trim()).filter(Boolean).join(' '),
          className:String(student['Class']||'')
        },
        records:records
      };
    }

    if(type==='attachment'){
      const fileId=String(request.fileId||'').trim();
      if(!fileId) return {success:false,error:'Attachment is unavailable.'};

      // Only permit files that are actually referenced by a published
      // Announcements & Assignments row.
      const sheet=getAllowedSheet('Announcements & Assignments');
      const data=sheet.getDataRange().getValues();
      if(data.length<=1) return {success:false,error:'Attachment is unavailable.'};
      const headers=data[0];
      const records=data.slice(1).map(row=>rowToObject(headers,row));
      const parentStudentId=String(request._session?.principal?.studentId||'').trim();
      let verifiedClass='';
      if(parentStudentId){
        const student=findStudentByAnyId(parentStudentId);
        verifiedClass=String(student&&student['Class']||'').trim();
      }
      const allowed=records.some(r=>{
        if(String(r['Attachment']||'').trim()!==fileId)return false;
        if(String(r['Status']||'Published').trim().toLowerCase()!=='published')return false;
        const target=String(r['Target Audience']||'Entire School').trim().toLowerCase();
        const cls=String(r['Class']||'').trim();
        const schoolWide=!cls||target==='entire school'||target==='all'||target==='school';
        return schoolWide || (!!verifiedClass&&cls.toLowerCase()===verifiedClass.toLowerCase());
      });
      if(!allowed) return {success:false,error:'Attachment is unavailable.'};

      const file=afisapRequireManagedFile_(fileId);
      const blob=file.getBlob();
      return {
        success:true,
        fileName:file.getName(),
        mimeType:blob.getContentType(),
        fileData:Utilities.base64Encode(blob.getBytes())
      };
    }

    return {success:false,error:'Unsupported Parent Portal request.'};
  }catch(e){
    return {success:false,error:'Parent Portal data is temporarily unavailable: '+e.message};
  }
}


function afisapPromotionPropertyKey_(studentId){
  return 'AFISAP_STUDENT_PROMOTION_V1_'+String(studentId||'').trim();
}
function afisapSavePromotionRecord_(studentId,fromClass,toClass,academicYear,term,status,extra){
  const sid=String(studentId||'').trim();if(!sid)return;
  const previous=afisapPromotionRecord_(sid)||{};
  const now=new Date().toISOString();
  const record=Object.assign({},previous,extra||{}, {
    studentId:sid,
    previousClass:String(fromClass||previous.previousClass||'').trim(),
    promotedTo:String(toClass||previous.promotedTo||'').trim(),
    academicYear:String(academicYear||previous.academicYear||'').trim(),
    term:String(term||previous.term||'').trim(),
    status:String(status||'pending').trim().toLowerCase(),
    updatedAt:now
  });
  PropertiesService.getScriptProperties().setProperty(afisapPromotionPropertyKey_(sid),JSON.stringify(record));
  return record;
}
function afisapPromotionRecord_(studentId){
  const sid=String(studentId||'').trim();if(!sid)return null;
  try{return JSON.parse(PropertiesService.getScriptProperties().getProperty(afisapPromotionPropertyKey_(sid))||'null')}catch(e){return null}
}
function afisapMergePromotionIntoStudent_(record){
  if(!record||typeof record!=='object')return record;
  const sid=String(record['Student ID']||'').trim(),p=afisapPromotionRecord_(sid);
  if(!p)return record;
  if(!String(record['Promoted To']||record['Promotion Class']||'').trim())record['Promoted To']=String(p.promotedTo||'');
  if(!String(record['Previous Class']||'').trim())record['Previous Class']=String(p.previousClass||'');
  if(!String(record['Promotion Date']||'').trim())record['Promotion Date']=String(p.appliedAt||p.updatedAt||'');
  record['Promotion Status']=String(p.status||'').trim();
  record['Promotion Academic Year']=String(p.academicYear||'').trim();
  record['Promotion Effective Academic Year']=String(p.effectiveAcademicYear||'').trim();
  record['Promotion Applied At']=String(p.appliedAt||'').trim();
  return record;
}
function afisapAllPromotionRecords_(){
  const props=PropertiesService.getScriptProperties().getProperties(),prefix='AFISAP_STUDENT_PROMOTION_V1_',out=[];
  Object.keys(props).forEach(key=>{
    if(key.indexOf(prefix)!==0)return;
    try{const item=JSON.parse(props[key]||'null');if(item&&item.studentId)out.push(item)}catch(e){}
  });
  return out;
}
function afisapCurrentPromotionPeriod_(){
  const school=teacherPortalSchoolInfo();
  return {academicYear:String(school.academicYear||'').trim(),term:String(school.term||'').trim()};
}
function adminGetPendingPromotions(request){
  const period=afisapCurrentPromotionPeriod_();
  const rows=teacherPortalReadUsedRows('Students'),byId={};
  rows.forEach(r=>{const sid=String(r['Student ID']||'').trim();if(sid)byId[sid]=r});
  const promotions=afisapAllPromotionRecords_().filter(item=>
    String(item.status||'').toLowerCase()==='pending' &&
    String(item.academicYear||'').trim()===period.academicYear &&
    teacherPortalPeriodKey_(String(item.term||''))===teacherPortalPeriodKey_('Term 3')
  ).map(item=>{
    const student=byId[String(item.studentId||'')]||{};
    return {
      studentId:String(item.studentId||''),
      studentName:String(student['Student Name']||student['Full Name']||[student['First Name'],student['Middle Name'],student['Last Name']||student['Surname']].map(v=>String(v||'').trim()).filter(Boolean).join(' ')).trim(),
      currentClass:String(student['Class']||item.previousClass||'').trim(),
      previousClass:String(item.previousClass||'').trim(),
      promotedTo:String(item.promotedTo||'').trim(),
      academicYear:String(item.academicYear||'').trim(),
      term:String(item.term||'').trim(),
      updatedAt:String(item.updatedAt||'')
    };
  }).sort((a,b)=>a.currentClass.localeCompare(b.currentClass)||a.studentName.localeCompare(b.studentName));
  return {success:true,promotions:promotions,count:promotions.length,academicYear:period.academicYear,term:'Term 3'};
}
function adminCancelPromotion(request){
  const sid=String(request&&request.studentId||'').trim();
  if(!sid)return {success:false,error:'Student ID is required.'};
  const record=afisapPromotionRecord_(sid);
  if(!record)return {success:false,error:'Promotion recommendation was not found.'};
  if(String(record.status||'').toLowerCase()!=='pending')return {success:false,error:'Only pending promotion recommendations can be cancelled.'};
  const period=afisapCurrentPromotionPeriod_();
  if(String(record.academicYear||'').trim()!==period.academicYear || teacherPortalPeriodKey_(String(record.term||''))!==teacherPortalPeriodKey_('Term 3')){
    return {success:false,error:'This promotion recommendation belongs to a different academic period and cannot be changed from the current rollover screen.'};
  }
  afisapSavePromotionRecord_(sid,record.previousClass,record.promotedTo,record.academicYear,record.term,'cancelled',{cancelledAt:new Date().toISOString(),cancelledBy:'Administrator'});
  return {success:true,message:'Promotion recommendation cancelled.'};
}
function adminApplyPromotionRollover(request){
  const newAcademicYear=String(request.newAcademicYear||'').trim();
  if(!/^\d{4}\s*[\/-]\s*\d{4}$/.test(newAcademicYear))return {success:false,error:'A valid new Academic Year is required, for example 2027/2028.'};
  const period=afisapCurrentPromotionPeriod_();
  if(!teacherPortalIsTerm3(period.term))return {success:false,error:'Academic-year rollover is available only while School Setup is in Term 3.'};
  const pending=afisapAllPromotionRecords_().filter(item=>
    String(item.status||'').toLowerCase()==='pending' &&
    String(item.academicYear||'').trim()===period.academicYear &&
    teacherPortalPeriodKey_(String(item.term||''))===teacherPortalPeriodKey_('Term 3')
  );
  if(!pending.length)return {success:false,error:'There are no pending teacher promotion recommendations for '+period.academicYear+' Term 3 to apply.'};
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const sheet=teacherPortalExistingSheet('Students'),lastRow=sheet.getLastRow(),lastColumn=sheet.getLastColumn();
    if(lastRow<2||lastColumn<1)return {success:false,error:'No student records were found.'};
    const data=sheet.getRange(1,1,lastRow,lastColumn).getValues(),headers=data[0].map(String);
    const sidIdx=headers.indexOf('Student ID'),classIdx=headers.indexOf('Class'),yearIdx=headers.indexOf('Academic Year'),rollIdx=headers.indexOf('Roll No.'),updatedIdx=headers.indexOf('Last Updated');
    if(sidIdx<0||classIdx<0)return {success:false,error:'Students sheet must contain Student ID and Class columns.'};
    const rowById={};for(let i=1;i<data.length;i++){const sid=String(data[i][sidIdx]||'').trim();if(sid)rowById[sid]=i;}
    for(let k=0;k<pending.length;k++){
      const item=pending[k],sid=String(item.studentId||'').trim(),i=rowById[sid];
      if(i===undefined)return {success:false,error:'Rollover stopped because Student ID '+sid+' was not found.'};
      const actual=String(data[i][classIdx]||'').trim();
      if(actual.toLowerCase()!==String(item.previousClass||'').trim().toLowerCase())return {success:false,error:'Rollover stopped because '+sid+' is currently in '+actual+', not '+String(item.previousClass||'')+'. Refresh and review this student.'};
      if(!teacherPortalClassExists(String(item.promotedTo||'')))return {success:false,error:'Rollover stopped because destination class '+String(item.promotedTo||'')+' does not exist.'};
    }
    const now=new Date().toISOString();
    pending.forEach(item=>{
      const sid=String(item.studentId||'').trim(),i=rowById[sid];
      data[i][classIdx]=String(item.promotedTo||'').trim();
      if(yearIdx>=0)data[i][yearIdx]=newAcademicYear;
      if(rollIdx>=0)data[i][rollIdx]='';
      if(updatedIdx>=0)data[i][updatedIdx]=now;
    });
    sheet.getRange(2,classIdx+1,data.length-1,1).setValues(data.slice(1).map(r=>[r[classIdx]]));
    if(yearIdx>=0)sheet.getRange(2,yearIdx+1,data.length-1,1).setValues(data.slice(1).map(r=>[r[yearIdx]]));
    if(rollIdx>=0)sheet.getRange(2,rollIdx+1,data.length-1,1).setValues(data.slice(1).map(r=>[r[rollIdx]]));
    if(updatedIdx>=0)sheet.getRange(2,updatedIdx+1,data.length-1,1).setValues(data.slice(1).map(r=>[r[updatedIdx]]));
    teacherPortalPromotionFastRollSync_(sheet,data,headers);
    pending.forEach(item=>afisapSavePromotionRecord_(item.studentId,item.previousClass,item.promotedTo,item.academicYear,item.term,'applied',{effectiveAcademicYear:newAcademicYear,appliedAt:now}));
    SpreadsheetApp.flush();
    let schoolSetupUpdated=false,schoolSetupWarning='';
    try{
      const cfgResult=configGet(),cfg=(cfgResult&&cfgResult.config&&typeof cfgResult.config==='object')?cfgResult.config:{};
      if(!cfg.school||typeof cfg.school!=='object')cfg.school={};
      cfg.school.year=newAcademicYear;
      cfg.school.term='Term 1';
      const savedConfig=configSet({config:JSON.stringify(cfg)});
      schoolSetupUpdated=!!(savedConfig&&savedConfig.success);
      if(!schoolSetupUpdated)schoolSetupWarning=String(savedConfig&&savedConfig.error||'School Setup Academic Year/Term could not be updated automatically.');
    }catch(configError){schoolSetupWarning=String(configError&&configError.message||configError||'School Setup Academic Year/Term could not be updated automatically.')}
    return {success:true,applied:pending.length,newAcademicYear:newAcademicYear,newTerm:'Term 1',schoolSetupUpdated:schoolSetupUpdated,schoolSetupWarning:schoolSetupWarning,message:'Academic-year rollover completed successfully. School Setup is now '+newAcademicYear+' Term 1.'};
  }finally{lock.releaseLock()}
}

function afisapRedactTeacherCredentialSecrets_(record){
  if(!record||typeof record!=='object')return record;
  ['Portal Password Hash','Portal Password Salt','Portal Password Iterations','Failed Login Attempts','Lockout Until'].forEach(k=>delete record[k]);
  return record;
}

function readRecords(request) {
  if (request.sheet === 'Students') syncStudentRolls();
  const sheet = request.sheet === 'Students'
    ? getAllowedSheet('Students')
    : request.sheet === 'Academic Settings'
      ? ensureAcademicSettingsFields()
      : request.sheet === 'Fees'
        ? ensureFeesFields()
        : getAllowedSheet(request.sheet);
  const lastRow=sheet.getLastRow();
  const lastColumn=sheet.getLastColumn();
  if(lastRow<1 || lastColumn<1) return {success:true,sheet:request.sheet,records:[],count:0};
  const data = sheet.getRange(1,1,lastRow,lastColumn).getValues();
  if (data.length <= 1) return {success:true,sheet:request.sheet,records:[]};
  const headers = data[0];
  const records = data.slice(1)
    .map((row,index)=>({row,index:index+2}))
    .filter(item => item.row.some(value => value !== ''))
    .map(item => {
      if(request.sheet!=='Fees'){
        let record=rowToObject(headers,item.row);
        if(request.sheet==='Students')record=afisapMergePromotionIntoStudent_(record);
        return request.sheet==='Teachers'?afisapRedactTeacherCredentialSecrets_(record):record;
      }
      const record=afisapFeeCanonicalObject(headers,item.row);
      record['__SheetRow']=item.index;
      return record;
    });
  return {success:true,sheet:request.sheet,records:records,count:records.length};
}

function searchRecords(request) {
  const sheet=request.sheet==='Fees'?ensureFeesFields():getAllowedSheet(request.sheet);
  const lastRow=sheet.getLastRow(),lastColumn=sheet.getLastColumn();
  if(lastRow<2||lastColumn<1)return {success:true,records:[]};
  const data=sheet.getRange(1,1,lastRow,lastColumn).getValues(),headers=data[0].map(String);
  const actualField=request.sheet==='Fees'
    ? (afisapFeeFindHeader(headers,String(request.field||''))||String(request.field||''))
    : String(request.field||'');
  const fieldIndex=headers.indexOf(actualField);
  if(fieldIndex===-1)return {success:false,error:'Field not found: '+request.field};
  const searchValue=String(request.value||'').toLowerCase();
  const records=data.slice(1)
    .map((row,index)=>({row,index:index+2}))
    .filter(item=>String(item.row[fieldIndex]||'').toLowerCase().includes(searchValue))
    .map(item=>{
      if(request.sheet!=='Fees'){const record=rowToObject(headers,item.row);return request.sheet==='Teachers'?afisapRedactTeacherCredentialSecrets_(record):record;}
      const record=afisapFeeCanonicalObject(headers,item.row);
      record['__SheetRow']=item.index;
      return record;
    });
  return {success:true,records:records,count:records.length};
}

function afisapSafeAppendExistingSheetRow(sheet,headers,data,operationName){
  const nextRow=sheet.getLastRow()+1;

  // Prefer an already-allocated blank row. This does not increase workbook cells.
  if(nextRow<=sheet.getMaxRows()){
    const row=headers.map(header =>
      data[header]!==undefined && data[header]!==null ? data[header] : ''
    );
    sheet.getRange(nextRow,1,1,headers.length).setValues([row]);
    return nextRow;
  }

  // Do not let normal Admin student creation expand a near-limit workbook.
  if(typeof teacherPortalCellPreflight==='function'){
    teacherPortalCellPreflight(sheet,1,0,operationName||'adding one student row');
  }else{
    const spreadsheet=sheet.getParent();
    const currentTotal=spreadsheet.getSheets().reduce(
      (sum,s)=>sum+(s.getMaxRows()*s.getMaxColumns()),0
    );
    const projected=currentTotal+sheet.getMaxColumns();
    if(projected>10000000){
      throw new Error(
        'Workbook cell-limit safety stopped adding a student row to "'+
        sheet.getName()+'". Current allocated cells: '+currentTotal+
        '; projected allocated cells: '+projected+
        '; Google Sheets limit: 10000000. No data was deleted.'
      );
    }
  }

  sheet.insertRowsAfter(sheet.getMaxRows(),1);
  const row=headers.map(header =>
    data[header]!==undefined && data[header]!==null ? data[header] : ''
  );
  sheet.getRange(nextRow,1,1,headers.length).setValues([row]);
  return nextRow;
}

function createRecord(request) {
  const sheet = request.sheet === 'Teachers'
    ? ensureTeachersFields()
    : request.sheet === 'Students'
      ? getAllowedSheet('Students')
      : request.sheet === 'Academic Settings'
        ? ensureAcademicSettingsFields()
        : request.sheet === 'Fees'
          ? ensureFeesFields()
          : getAllowedSheet(request.sheet);
  if (!request.data || typeof request.data !== 'object') return {success:false,error:'No record data supplied.'};

  // RESULTS: Always resolve Student Name from the Students sheet using Student ID.
  // This makes the backend authoritative and prevents a blank Student Name even
  // when the frontend uses a different local property name.
  if (request.sheet === 'Results') {
    const studentId = String(
      request.data['Student ID'] ??
      request.data['studentId'] ??
      ''
    ).trim();

    if (studentId) {
      const student = findStudentByAnyId(studentId);
      if (student) {
        const resolvedName = getStudentDisplayName(student);
        if (resolvedName) {
          request.data['Student Name'] = resolvedName;
        }

        const admission = getFirstStudentField(student, [
          'Admission Number',
          'Admission No',
          'Admission',
          'Index Number'
        ]);
        if (admission && !request.data['Admission Number']) {
          request.data['Admission Number'] = admission;
        }
      }
    }
  }

  const headers = getHeaders(sheet);
  let idField = getPrimaryIdField(request.sheet);
  if(request.sheet==='Fees'){
    idField=afisapFeeFindHeader(headers,'Fee ID');
    if(!idField)return {success:false,error:'The existing Fees sheet has no Fee ID/ID column. No fee was saved locally.'};
  }
  const requestId=request.sheet==='Fees'?request.data['Fee ID']:request.data[idField];
  if (idField && requestId) {
    const existing = findByField(sheet,idField,String(requestId));
    if (existing) return {success:false,duplicate:true,error:'Record already exists: '+requestId};
  }
  let newRow;
  if (request.sheet === 'Students') {
    const requiredStudentHeaders=['Student ID','First Name','Last Name','Class'];
    const missingStudentHeaders=requiredStudentHeaders.filter(h=>headers.indexOf(h)===-1);
    if(missingStudentHeaders.length){
      return {
        success:false,
        error:'Students sheet is missing required column(s): '+missingStudentHeaders.join(', ')+
          '. The save was stopped without adding columns or changing existing student data.'
      };
    }
    newRow=afisapSafeAppendExistingSheetRow(
      sheet,headers,request.data,'adding a new Admin student record'
    );
    const rollSync=syncStudentRolls();
    if(!rollSync || rollSync.success!==true){
      return {success:false,error:(rollSync&&rollSync.error)||'Student roll synchronization failed.'};
    }
  } else if(request.sheet==='Fees') {
    const dataByHeader={};
    headers.forEach(header=>dataByHeader[header]=afisapFeeValueForHeader(header,request.data));
    newRow=afisapSafeAppendExistingSheetRow(sheet,headers,dataByHeader,'adding one Fees record');
  } else {
    const row = headers.map(header => request.data[header] !== undefined && request.data[header] !== null ? request.data[header] : '');
    sheet.appendRow(row);
    newRow=sheet.getLastRow();
  }
  const currentHeaders = getHeaders(sheet);
  const savedRow = sheet.getRange(newRow,1,1,currentHeaders.length).getValues()[0];
  return {success:true,message:'Record created successfully.',record:request.sheet==='Fees'?afisapFeeCanonicalObject(currentHeaders,savedRow):rowToObject(currentHeaders,savedRow)};
}


/**
 * Create many Fee records in one Google Sheets write.
 * This is intentionally limited to the Fees sheet so the existing
 * create/update/delete behavior of every other module remains unchanged.
 *
 * A student cannot receive the same Fee Item twice for the same
 * Academic Year + Term. Duplicate Fee IDs and duplicate student/fee/
 * period combinations are skipped safely.
 */

function afisapCanonicalFeeStudentRecord_(record){
  const input=Object.assign({},record||{});
  const sid=String(input['Student ID']||input.StudentID||input.studentId||'').trim();
  if(!sid)throw new Error('Student ID is required for every student fee record.');
  const student=findStudentByAnyId(sid);
  if(!student)throw new Error('Student ID '+sid+' was not found in the Students sheet. No fee record was saved.');
  const canonicalId=String(student['Student ID']||student['StudentID']||student['Student Id']||student['ID']||sid).trim();
  if(!canonicalId)throw new Error('The student record has no usable Student ID. No fee record was saved.');
  input['Student ID']=canonicalId;
  const admission=String(student['Admission Number']||student['Admission No']||'').trim();
  const directName=String(student['Student Name']||student['Full Name']||student['Name']||'').trim();
  const builtName=[student['First Name'],student['Middle Name'],student['Other Name'],student['Last Name']||student['Surname']].map(v=>String(v||'').trim()).filter(Boolean).join(' ');
  if(admission)input['Admission Number']=admission;
  if(directName||builtName)input['Student Name']=directName||builtName;
  const due=Number(input['Amount Due']||0),paid=Number(input['Amount Paid']||0);
  input['Balance']=Math.max(0,(Number.isFinite(due)?due:0)-(Number.isFinite(paid)?paid:0));
  input['Status']=input['Balance']<=0&&due>0?'Paid':paid>0?'Owing':'Owing';
  return input;
}

function createFeeRecordFast(request) {
  if(request.sheet!=='Fees') return {success:false,error:'createFeeRecordFast is only available for the Fees sheet.'};
  let record=request.data;
  if(!record || typeof record!=='object') return {success:false,error:'No fee record supplied.'};
  try{record=afisapCanonicalFeeStudentRecord_(record);}catch(error){return {success:false,error:error.message};}

  const sheet=ensureFeesFields();
  const headers=getHeaders(sheet);
  const idHeader=afisapFeeFindHeader(headers,'Fee ID');
  if(!idHeader) return {success:false,error:'The existing Fees sheet has no Fee ID/ID column. No fee was saved.'};

  const feeId=String(record['Fee ID']||record.feeId||'').trim();
  if(!feeId) return {success:false,error:'Fee ID is required.'};

  // Use TextFinder for the single-ID duplicate check instead of reading the
  // entire Fees sheet. This keeps a single fee save fast even as the school grows.
  const idColumn=headers.indexOf(idHeader)+1;
  const duplicate=idColumn>0
    ? sheet.getRange(2,idColumn,Math.max(1,sheet.getLastRow()-1),1)
        .createTextFinder(feeId).matchEntireCell(true).findNext()
    : null;
  if(duplicate) return {success:false,duplicate:true,error:'Record already exists: '+feeId};

  const dataByHeader={};
  headers.forEach(header=>dataByHeader[header]=afisapFeeValueForHeader(header,record));

  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try{
    // Re-check after acquiring the lock so two simultaneous submissions cannot
    // create the same Fee ID.
    const latestLastRow=sheet.getLastRow();
    const duplicateAfterLock=idColumn>0 && latestLastRow>=2
      ? sheet.getRange(2,idColumn,latestLastRow-1,1)
          .createTextFinder(feeId).matchEntireCell(true).findNext()
      : null;
    if(duplicateAfterLock) return {success:false,duplicate:true,error:'Record already exists: '+feeId};

    const rowNumber=afisapSafeAppendExistingSheetRow(sheet,headers,dataByHeader,'adding one Fees record');
    SpreadsheetApp.flush();
    const savedRow=sheet.getRange(rowNumber,1,1,headers.length).getValues()[0];
    const saved=afisapFeeCanonicalObject(headers,savedRow);
    saved['__SheetRow']=rowNumber;
    return {success:true,message:'Fee record saved successfully to Google Sheets.',record:saved};
  }finally{
    lock.releaseLock();
  }
}

function bulkCreateFees(request) {
  if(request.sheet!=='Fees')return {success:false,error:'bulkCreateFees is only available for the Fees sheet.'};
  let records=Array.isArray(request.records)?request.records:[];
  if(!records.length)return {success:false,error:'No fee records supplied.'};
  try{records=records.map(record=>afisapCanonicalFeeStudentRecord_(record));}
  catch(error){return {success:false,error:error.message};}

  const sheet=ensureFeesFields();
  const headers=getHeaders(sheet);
  const idHeader=afisapFeeFindHeader(headers,'Fee ID');
  if(!idHeader)return {success:false,error:'The existing Fees sheet has no Fee ID/ID column. No fee records were saved.'};

  const lastRow=sheet.getLastRow(),lastColumn=sheet.getLastColumn();
  const data=(lastRow>=1&&lastColumn>=1)?sheet.getRange(1,1,lastRow,lastColumn).getValues():[headers];
  const existingIds=new Set(),existingKeys=new Set();
  for(let i=1;i<data.length;i++){
    const rec=afisapFeeCanonicalObject(headers,data[i]);
    const fid=String(rec['Fee ID']||'').trim();
    if(fid)existingIds.add(fid);
    const sid=String(rec['Student ID']||'').trim();
    const item=String(rec['Fee Item']||'').trim().toLowerCase();
    const year=String(rec['Academic Year']||'').trim();
    const term=String(rec['Term']||'').trim();
    if(sid&&item)existingKeys.add([sid,item,year,term].join('|'));
  }

  const accepted=[],skipped=[];
  records.forEach(record=>{
    if(!record||typeof record!=='object'){skipped.push({reason:'Invalid fee record.'});return;}
    const fid=String(record['Fee ID']||record.feeId||'').trim();
    if(!fid){skipped.push({reason:'Missing Fee ID.'});return;}
    if(existingIds.has(fid)){skipped.push({feeId:fid,reason:'Fee ID already exists.'});return;}
    const sid=String(record['Student ID']||'').trim();
    const item=String(record['Fee Item']||'').trim().toLowerCase();
    const year=String(record['Academic Year']||'').trim();
    const term=String(record['Term']||'').trim();
    const key=sid&&item?[sid,item,year,term].join('|'):'';
    if(key&&existingKeys.has(key)){
      skipped.push({feeId:fid,studentId:sid,reason:'Student already has this fee for the selected academic year and term.'});
      return;
    }
    accepted.push(record);
    existingIds.add(fid);
    if(key)existingKeys.add(key);
  });

  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try{
    if(!accepted.length){
      return {success:true,message:'No new fee records were created.',created:0,skipped:skipped.length,skippedRecords:skipped,records:[]};
    }

    // Keep Fee Items in the same Fees source of truth. Add the configured item
    // once, then write all student fee rows in ONE setValues call.
    const first=accepted[0];
    const wantedItem=String(first['Fee Item']||'').trim();
    const wantedKey=wantedItem.toLowerCase();
    let configured=false;
    for(let i=1;i<data.length;i++){
      const existing=afisapFeeCanonicalObject(headers,data[i]);
      const existingId=String(existing['Fee ID']||'').trim();
      const existingItem=String(existing['Fee Item']||'').trim().toLowerCase();
      if(/^FEE_ITEM\|/i.test(existingId)&&existingItem===wantedKey){configured=true;break;}
    }
    if(wantedItem&&!configured){
      const now=new Date().toISOString();
      const configRecord={
        'Fee ID':'FEE_ITEM|'+Date.now()+'|'+Math.random().toString(36).slice(2,7),
        'Student ID':'','Admission Number':'','Student Name':'',
        'Fee Item':wantedItem,
        'Amount Due':Number(first['Amount Due']||0),'Amount Paid':0,
        'Balance':Number(first['Amount Due']||0),'Date':'',
        'Academic Year':'','Term':'','Date Created':now,'Last Updated':now
      };
      const configRow=headers.map(header=>afisapFeeValueForHeader(header,configRecord));
      const configStart=sheet.getLastRow()+1;
      if(configStart>sheet.getMaxRows()){
        if(typeof teacherPortalCellPreflight==='function') teacherPortalCellPreflight(sheet,1,0,'adding a Fee Item record');
        sheet.insertRowsAfter(sheet.getMaxRows(),1);
      }
      sheet.getRange(configStart,1,1,headers.length).setValues([configRow]);
    }

    const startRow=sheet.getLastRow()+1;
    const rows=accepted.map(record=>headers.map(header=>afisapFeeValueForHeader(header,record)));

    // Allocate enough existing rows without changing the workbook schema.
    const requiredLast=startRow+rows.length-1;
    if(requiredLast>sheet.getMaxRows()){
      const extra=requiredLast-sheet.getMaxRows();
      if(typeof teacherPortalCellPreflight==='function'){
        teacherPortalCellPreflight(sheet,extra,0,'adding '+rows.length+' Fees records');
      }else{
        const spreadsheet=sheet.getParent();
        const currentTotal=spreadsheet.getSheets().reduce((sum,s)=>sum+(s.getMaxRows()*s.getMaxColumns()),0);
        const projected=currentTotal+extra*sheet.getMaxColumns();
        if(projected>10000000) throw new Error('Workbook cell-limit safety stopped adding Fees records. No data was deleted.');
      }
      sheet.insertRowsAfter(sheet.getMaxRows(),extra);
    }

    sheet.getRange(startRow,1,rows.length,headers.length).setValues(rows);
    SpreadsheetApp.flush();

    const savedRows=sheet.getRange(startRow,1,rows.length,headers.length).getValues();
    const saved=savedRows.map((row,i)=>{
      const item=afisapFeeCanonicalObject(headers,row);
      item['__SheetRow']=startRow+i;
      return item;
    });

    return {
      success:true,
      message:'Bulk fee assignment completed and written to Google Sheets in one batch.',
      created:saved.length,
      skipped:skipped.length,
      skippedRecords:skipped,
      records:saved
    };
  }finally{
    lock.releaseLock();
  }
}

function bulkPromoteStudents(request) {
  if (request.sheet !== 'Students') return {success:false,error:'Promotion is limited to the Students sheet.'};
  const ids=(Array.isArray(request.studentIds)?request.studentIds:[]).map(v=>String(v||'').trim()).filter(Boolean);
  const currentClass=String(request.currentClass||'').trim();
  const newClass=String(request.newClass||'').trim();
  const academicYear=String(request.academicYear||'').trim();
  if(!ids.length || !currentClass || !newClass) return {success:false,error:'Student IDs, current class and new class are required.'};
  if(currentClass===newClass) return {success:false,error:'Current class and new class cannot be the same.'};

  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{
    const sheet=ensureStudentRollFields(), data=sheet.getDataRange().getValues();
    if(data.length<2) return {success:false,error:'No student records were found.'};
    const headers=data[0], sidIdx=headers.indexOf('Student ID'), classIdx=headers.indexOf('Class'), rollIdx=headers.indexOf('Roll No.'), yearIdx=headers.indexOf('Academic Year'), updatedIdx=headers.indexOf('Last Updated');
    if(sidIdx<0 || classIdx<0) return {success:false,error:'Students sheet must contain Student ID and Class columns.'};
    const wanted=new Set(ids), found=new Set(), promoted=[];
    for(let i=1;i<data.length;i++){
      const sid=String(data[i][sidIdx]||'').trim(); if(!wanted.has(sid))continue; found.add(sid);
      const actualClass=String(data[i][classIdx]||'').trim();
      if(!request.allowAnyClass && actualClass.toLowerCase()!==currentClass.toLowerCase()){
        return {success:false,error:'Safety check stopped promotion: '+sid+' is currently in '+actualClass+', not '+currentClass+'. Refresh the system and try again.'};
      }
      // A repeated promotion request for the same source class is rejected by the
      // current-class check above, preventing accidental double promotion.
    }
    const missing=ids.filter(id=>!found.has(id)); if(missing.length) return {success:false,error:'Student record(s) not found: '+missing.join(', ')};
    for(let i=1;i<data.length;i++){
      const sid=String(data[i][sidIdx]||'').trim(); if(!wanted.has(sid))continue;
      sheet.getRange(i+1,classIdx+1).setValue(newClass);
      if(rollIdx>=0) sheet.getRange(i+1,rollIdx+1).setValue('');
      if(yearIdx>=0 && academicYear) sheet.getRange(i+1,yearIdx+1).setValue(academicYear);
      if(updatedIdx>=0) sheet.getRange(i+1,updatedIdx+1).setValue(new Date().toISOString());
      promoted.push(sid);
    }
    syncStudentRolls();
    SpreadsheetApp.flush();
    return {success:true,message:'Promotion completed successfully and synchronized to Google Sheets.',promoted:promoted.length,promotedStudentIds:promoted,currentClass:currentClass,newClass:newClass,academicYear:academicYear};
  } finally { lock.releaseLock(); }
}

function updateRecord(request) {
  const sheet = request.sheet === 'Teachers'
    ? ensureTeachersFields()
    : request.sheet === 'Students'
      ? ensureStudentRollFields()
      : request.sheet === 'Academic Settings'
        ? ensureAcademicSettingsFields()
        : request.sheet === 'Fees'
          ? ensureFeesFields()
          : getAllowedSheet(request.sheet);
  if (!request.data || typeof request.data !== 'object') return {success:false,error:'No update data supplied.'};

  // FEES: update the exact authoritative Google Sheets row whenever possible,
  // then fall back to a normalized Fee ID lookup. This avoids stale row/ID
  // mismatches and verifies the saved values before reporting success.
  if(request.sheet==='Fees'){
    const headers=getHeaders(sheet);
    const idField=afisapFeeFindHeader(headers,'Fee ID');
    const idIndex=idField?headers.indexOf(idField):-1;
    const idValue=String(request.idValue||request.data['Fee ID']||'').trim();
    const requestedRow=Number(request.sheetRow||request.rowNumber||0);
    if(!idField || idIndex<0 || !idValue)return {success:false,error:'A Fee ID is required for updating.'};

    let rowNumber=0;
    if(Number.isInteger(requestedRow)&&requestedRow>=2&&requestedRow<=sheet.getLastRow()){
      const row=sheet.getRange(requestedRow,1,1,headers.length).getValues()[0];
      const currentId=String(row[idIndex]||'').trim();
      if(currentId.toLowerCase()===idValue.toLowerCase())rowNumber=requestedRow;
    }
    if(!rowNumber){
      const lastRow=sheet.getLastRow();
      if(lastRow>=2){
        const values=sheet.getRange(2,idIndex+1,lastRow-1,1).getValues();
        const wanted=idValue.toLowerCase();
        for(let i=0;i<values.length;i++){
          if(String(values[i][0]||'').trim().toLowerCase()===wanted){rowNumber=i+2;break;}
        }
      }
    }
    if(!rowNumber)return {success:false,error:'Fee record not found in the Fees Google Sheet. Refresh the Fees page and try again.'};

    const current=sheet.getRange(rowNumber,1,1,headers.length).getValues()[0];
    const currentObj=afisapFeeCanonicalObject(headers,current);
    const merged=Object.assign({},currentObj,request.data||{});
    const due=Number(merged['Amount Due']||0),paid=Number(merged['Amount Paid']||0);
    merged['Balance']=Math.max(0,(Number.isFinite(due)?due:0)-(Number.isFinite(paid)?paid:0));
    merged['Status']=merged['Balance']<=0&&due>0?'Paid':paid>0?'Owing':'Owing';
    merged['Last Updated']=merged['Last Updated']||new Date().toISOString();

    const output=headers.map((header,index)=>{
      if(index===idIndex)return current[index];
      const norm=afisapFeeNormHeader(header),aliases=afisapFeeAliases();
      let supplied=request.data[header]!==undefined;
      if(!supplied){
        for(const canonical of Object.keys(aliases)){
          if(aliases[canonical].map(afisapFeeNormHeader).indexOf(norm)!==-1 && merged[canonical]!==undefined){supplied=true;break;}
        }
      }
      return supplied?afisapFeeValueForHeader(header,merged):current[index];
    });
    sheet.getRange(rowNumber,1,1,headers.length).setValues([output]);
    SpreadsheetApp.flush();
    const savedRow=sheet.getRange(rowNumber,1,1,headers.length).getValues()[0];
    const saved=afisapFeeCanonicalObject(headers,savedRow);
    saved['__SheetRow']=rowNumber;
    if(String(saved['Fee ID']||'').trim().toLowerCase()!==idValue.toLowerCase()){
      return {success:false,error:'Google Sheets did not confirm the requested Fee ID after update.'};
    }
    return {success:true,message:'Fee record updated successfully in Google Sheets.',record:saved};
  }

  // RESULTS: Also resolve Student Name during updates.
  if (request.sheet === 'Results') {
    const studentId = String(
      request.data['Student ID'] ??
      request.data['studentId'] ??
      ''
    ).trim();

    if (studentId) {
      const student = findStudentByAnyId(studentId);
      if (student) {
        const resolvedName = getStudentDisplayName(student);
        if (resolvedName) request.data['Student Name'] = resolvedName;

        const admission = getFirstStudentField(student, [
          'Admission Number',
          'Admission No',
          'Admission',
          'Index Number'
        ]);
        if (admission && !request.data['Admission Number']) {
          request.data['Admission Number'] = admission;
        }
      }
    }
  }

  let idField = request.idField || getPrimaryIdField(request.sheet);
  if(request.sheet==='Fees'){
    idField=afisapFeeFindHeader(getHeaders(sheet),'Fee ID');
    if(!idField)return {success:false,error:'The existing Fees sheet has no Fee ID/ID column.'};
  }
  const idValue = request.idValue || request.data[idField] || (request.sheet==='Fees'?request.data['Fee ID']:'');
  if (!idField || !idValue) return {success:false,error:'A record ID is required for updating.'};
  const result = findRowByField(sheet,idField,String(idValue));
  if (!result) return {success:false,error:'Record not found.'};
  const headers = getHeaders(sheet);
  const classIndex = request.sheet === 'Students' ? headers.indexOf('Class') : -1;
  const rollIndex = request.sheet === 'Students' ? headers.indexOf('Roll No.') : -1;
  const oldClass = classIndex >= 0 ? String(result.row[classIndex] || '').trim() : '';
  headers.forEach((header,index)=>{
    if(header===idField)return;
    if(request.sheet==='Fees'){
      const norm=afisapFeeNormHeader(header),aliases=afisapFeeAliases();
      let supplied=request.data[header]!==undefined;
      if(!supplied){
        for(const canonical of Object.keys(aliases)){
          if(aliases[canonical].map(afisapFeeNormHeader).indexOf(norm)!==-1 && request.data[canonical]!==undefined){supplied=true;break;}
        }
      }
      if(supplied)sheet.getRange(result.rowNumber,index+1).setValue(afisapFeeValueForHeader(header,request.data));
    }else if(request.data[header] !== undefined){
      sheet.getRange(result.rowNumber,index+1).setValue(request.data[header]);
    }
  });
  if (request.sheet === 'Students' && classIndex >= 0 && rollIndex >= 0 && request.data['Class'] !== undefined) {
    const newClass = String(request.data['Class'] || '').trim();
    if (newClass.toLowerCase() !== oldClass.toLowerCase()) {
      sheet.getRange(result.rowNumber,rollIndex+1).setValue('');
      afisapSavePromotionRecord_(String(idValue||''),oldClass,newClass,String(request.data['Academic Year']||''),String(request.data['Term']||''),'manual',{effectiveAcademicYear:String(request.data['Academic Year']||''),appliedAt:new Date().toISOString(),manualClassChange:true});
    }
    syncStudentRolls();
  } else if (request.sheet === 'Students') {
    syncStudentRolls();
  }
  // Make promotion/demotion updates immediately visible to subsequent reads.
  SpreadsheetApp.flush();
  const currentHeaders = getHeaders(sheet);
  const updatedRow = sheet.getRange(result.rowNumber,1,1,currentHeaders.length).getValues()[0];
  return {success:true,message:'Record updated successfully.',record:request.sheet==='Fees'?afisapFeeCanonicalObject(currentHeaders,updatedRow):rowToObject(currentHeaders,updatedRow)};
}

function saveTeacherAttendanceBatch(request) {
  const records=Array.isArray(request&&request.records)?request.records:[];
  if(!records.length)return {success:false,error:'No teacher attendance records were supplied.'};

  const sheet=getAllowedSheet('Teacher Attendance');
  const headers=getHeaders(sheet);
  const idIndex=headers.indexOf('Attendance ID');
  if(idIndex<0)return {success:false,error:'Teacher Attendance sheet is missing the Attendance ID column.'};

  const lastRow=sheet.getLastRow();
  const existing=new Map();
  if(lastRow>=2){
    const ids=sheet.getRange(2,idIndex+1,lastRow-1,1).getDisplayValues();
    ids.forEach(function(row,index){
      const id=String(row[0]||'').trim();
      if(id)existing.set(id.toLowerCase(),index+2);
    });
  }

  const now=new Date().toISOString();
  const updates=[],creates=[];
  records.forEach(function(input){
    const record=input||{};
    const id=String(record['Attendance ID']||'').trim();
    const staffId=String(record['Staff ID']||'').trim();
    const date=String(record['Date']||'').trim();
    if(!id||!staffId||!date)throw new Error('Attendance ID, Staff ID and Date are required for every teacher attendance record.');

    const row=headers.map(function(header){
      if(header==='Last Updated')return String(record[header]||now);
      if(header==='Date Created')return String(record[header]||now);
      return record[header]!==undefined&&record[header]!==null?record[header]:'';
    });
    const rowNumber=existing.get(id.toLowerCase());
    if(rowNumber)updates.push({rowNumber:rowNumber,row:row,id:id});
    else creates.push({row:row,id:id});
  });

  updates.forEach(function(item){
    sheet.getRange(item.rowNumber,1,1,headers.length).setValues([item.row]);
  });

  if(creates.length){
    const startRow=sheet.getLastRow()+1;
    const neededEnd=startRow+creates.length-1;
    if(neededEnd>sheet.getMaxRows()){
      const rowsNeeded=neededEnd-sheet.getMaxRows();
      // Use the same workbook cell-limit preflight protection already used elsewhere.
      teacherPortalCellPreflight(sheet,rowsNeeded,0,'adding teacher attendance rows');
      sheet.insertRowsAfter(sheet.getMaxRows(),rowsNeeded);
    }
    sheet.getRange(startRow,1,creates.length,headers.length).setValues(creates.map(function(item){return item.row;}));
  }

  SpreadsheetApp.flush();
  return {
    success:true,
    message:'Teacher attendance saved successfully.',
    updated:updates.length,
    created:creates.length,
    attendanceIds:records.map(function(r){return String(r['Attendance ID']||'').trim();})
  };
}

function saveStudentAttendanceBatch(request) {
  const records=Array.isArray(request&&request.records)?request.records:[];
  if(!records.length)return {success:false,error:'No student attendance records were supplied.'};

  const sheet=getAllowedSheet('Student Attendance');
  const headers=getHeaders(sheet);
  const idIndex=headers.indexOf('Attendance ID');
  if(idIndex<0)return {success:false,error:'Student Attendance sheet is missing the Attendance ID column.'};

  const lastRow=sheet.getLastRow();
  const existing=new Map();
  if(lastRow>=2){
    const ids=sheet.getRange(2,idIndex+1,lastRow-1,1).getDisplayValues();
    ids.forEach(function(row,index){
      const id=String(row[0]||'').trim();
      if(id)existing.set(id.toLowerCase(),index+2);
    });
  }

  const now=new Date().toISOString();
  const updates=[],creates=[];
  records.forEach(function(input){
    const record=input||{};
    const id=String(record['Attendance ID']||'').trim();
    const studentId=String(record['Student ID']||'').trim();
    const date=String(record['Date']||record['Attendance Date']||'').trim();
    if(!id||!studentId||!date)throw new Error('Attendance ID, Student ID and Date are required for every student attendance record.');

    const row=headers.map(function(header){
      if(header==='Last Updated')return String(record[header]||now);
      if(header==='Date Created')return String(record[header]||now);
      return record[header]!==undefined&&record[header]!==null?record[header]:'';
    });
    const rowNumber=existing.get(id.toLowerCase());
    if(rowNumber)updates.push({rowNumber:rowNumber,row:row,id:id});
    else creates.push({row:row,id:id});
  });

  // Write each existing attendance row once; new records are appended in one block.
  updates.forEach(function(item){
    sheet.getRange(item.rowNumber,1,1,headers.length).setValues([item.row]);
  });

  if(creates.length){
    const startRow=sheet.getLastRow()+1;
    const neededEnd=startRow+creates.length-1;
    if(neededEnd>sheet.getMaxRows()){
      const rowsNeeded=neededEnd-sheet.getMaxRows();
      teacherPortalCellPreflight(sheet,rowsNeeded,0,'adding student attendance rows');
      sheet.insertRowsAfter(sheet.getMaxRows(),rowsNeeded);
    }
    sheet.getRange(startRow,1,creates.length,headers.length).setValues(creates.map(function(item){return item.row;}));
  }

  SpreadsheetApp.flush();
  return {success:true,updated:updates.length,created:creates.length,total:records.length};
}

function deleteRecord(request) {
  const sheet = request.sheet === 'Students' ? ensureStudentRollFields() : request.sheet==='Fees'?ensureFeesFields():getAllowedSheet(request.sheet);

  if(request.sheet==='Fees'){
    const headers=getHeaders(sheet);
    const idField=afisapFeeFindHeader(headers,'Fee ID');
    const idIndex=idField?headers.indexOf(idField):-1;
    const idValue=String(request.idValue||'').trim();
    const requestedRow=Number(request.sheetRow||request.rowNumber||0);

    // Preferred path: delete the exact row returned by the authoritative Fees read.
    if(Number.isInteger(requestedRow) && requestedRow>=2 && requestedRow<=sheet.getLastRow()){
      const row=sheet.getRange(requestedRow,1,1,headers.length).getValues()[0];
      const currentId=idIndex>=0?String(row[idIndex]||'').trim():'';
      if(!idValue || currentId.toLowerCase()===idValue.toLowerCase()){
        sheet.deleteRow(requestedRow);
        SpreadsheetApp.flush();
        return {success:true,message:'Fee record deleted successfully from Google Sheets.',deletedRow:requestedRow};
      }
    }

    if(!idField || !idValue)return {success:false,error:'A Fee ID is required.'};

    // Compatibility path: normalized/trimmed Fee ID lookup.
    const lastRow=sheet.getLastRow();
    if(lastRow>=2){
      const values=sheet.getRange(2,idIndex+1,lastRow-1,1).getValues();
      const wanted=idValue.toLowerCase();
      for(let i=0;i<values.length;i++){
        if(String(values[i][0]||'').trim().toLowerCase()===wanted){
          const rowNumber=i+2;
          sheet.deleteRow(rowNumber);
          SpreadsheetApp.flush();
          return {success:true,message:'Fee record deleted successfully from Google Sheets.',deletedRow:rowNumber};
        }
      }
    }
    return {success:false,error:'Record not found in the Fees Google Sheet. Refresh the Fees page and try again.'};
  }

  let idField = request.idField || getPrimaryIdField(request.sheet);
  const idValue = request.idValue;
  if(!idField || !idValue) return {success:false,error:'A record ID is required.'};
  const result = findRowByField(sheet,idField,String(idValue));
  if(!result) return {success:false,error:'Record not found.'};
  if(request.sheet==='Classes'){
    const classHeaders=getHeaders(sheet),classNameIdx=classHeaders.indexOf('Class Name'),className=classNameIdx>=0?String(result.row[classNameIdx]||'').trim():'',key=className.toLowerCase();
    if(className){
      if(teacherPortalReadUsedRows('Students').some(r=>String(r['Class']||'').trim().toLowerCase()===key))return {success:false,error:'This class contains students. Move the students before deleting the class.'};
      if(teacherPortalReadUsedRows('Teachers').some(r=>teacherPortalClassList(r['Class']).some(c=>String(c||'').trim().toLowerCase()===key)))return {success:false,error:'This class is still assigned to a teacher. Remove the teacher assignment before deleting the class.'};
      const pending=afisapAllPromotionRecords_().filter(p=>String(p.status||'').toLowerCase()==='pending');
      if(pending.some(p=>String(p.previousClass||'').trim().toLowerCase()===key||String(p.promotedTo||'').trim().toLowerCase()===key))return {success:false,error:'This class is referenced by a pending promotion recommendation. Cancel or change that recommendation before deleting the class.'};
    }
  }
  sheet.deleteRow(result.rowNumber);
  if (request.sheet === 'Students'){
    try{PropertiesService.getScriptProperties().deleteProperty(afisapPromotionPropertyKey_(idValue))}catch(e){}
    syncStudentRolls();
  }
  return {success:true,message:'Record deleted successfully.'};
}

function countRecords(request) {
  const sheet = getAllowedSheet(request.sheet);
  return {success:true,sheet:request.sheet,count:Math.max(0,sheet.getLastRow()-1)};
}

function getAllowedSheet(sheetName) {
  if(!ALLOWED_SHEETS.includes(sheetName)) throw new Error('Unauthorized or invalid sheet: '+sheetName);
  const spreadsheet=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet=spreadsheet.getSheetByName(sheetName);

  // Reuse an existing equivalent announcements sheet before creating anything.
  // This prevents duplicate sheets caused only by &, "and", case, or spacing.
  if(!sheet && sheetName==='Announcements & Assignments'){
    const normalizeName=value=>String(value||'')
      .trim().toLowerCase()
      .replace(/&/g,'and')
      .replace(/[^a-z0-9]+/g,'');
    const wanted=normalizeName(sheetName);
    const existing=spreadsheet.getSheets().find(s=>normalizeName(s.getName())===wanted);
    if(existing) sheet=existing;
  }

  // Initialize the single canonical sheet only when no equivalent sheet exists.
  if(!sheet && sheetName==='Announcements & Assignments'){
    sheet=spreadsheet.insertSheet(sheetName);
    sheet.appendRow([
      'Announcement ID','Type','Title','Message','Class','Subject','Target Audience',
      'Date Posted','Due Date','Attachment','Attachment Name','Status','Created By',
      'Academic Year','Term','Last Updated'
    ]);
    sheet.setFrozenRows(1);
  }

  if(!sheet) throw new Error('Sheet does not exist: '+sheetName);
  return sheet;
}




function afisapFeeNormHeader(value){
  return String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
}
function afisapFeeAliases(){
  return {
    'Fee ID':['Fee ID','FeeID','ID','Record ID'],
    'Student ID':['Student ID','StudentID','Student Id','Student Code','Student Number'],
    'Admission Number':['Admission Number','Admission No','Admission','Admission ID'],
    'Student Name':['Student Name','Student','Name','Full Name'],
    'Fee Item':['Fee Item','Fee','Fees','Fee Name','Fee Type','Fee Description','Description','Particulars','Item'],
    'Amount Due':['Amount Due','Due','Fee Amount','Amount'],
    'Amount Paid':['Amount Paid','Paid','Payment','Paid Amount'],
    'Balance':['Balance','Amount Balance','Outstanding','Outstanding Balance'],
    'Status':['Status','Payment Status','Fee Status'],
    'Date':['Date','Payment Date','Fee Date','Record Date'],
    'Academic Year':['Academic Year','Year','School Year'],
    'Term':['Term','Academic Term'],
    'Date Created':['Date Created','Created At','Created'],
    'Last Updated':['Last Updated','Updated At','Updated']
  };
}
function afisapFeeFindHeader(headers,canonical){
  const aliases=afisapFeeAliases()[canonical]||[canonical];
  const wanted=aliases.map(afisapFeeNormHeader);
  for(let i=0;i<headers.length;i++){
    if(wanted.indexOf(afisapFeeNormHeader(headers[i]))!==-1)return String(headers[i]);
  }
  return '';
}
function afisapFeeItemFromId_(feeId){
  const id=String(feeId||'').trim();
  // New student fee IDs: FEE|<encoded fee item>|<unique tail>
  let m=id.match(/^FEE\|([^|]+)\|/i);
  if(m){
    try{return decodeURIComponent(m[1])}catch(e){return String(m[1]||'').replace(/\+/g,' ')}
  }
  // New configured-item IDs: FEE_ITEM|<encoded fee item>|<unique tail>
  m=id.match(/^FEE_ITEM\|([^|]+)\|/i);
  if(m && !/^\d+$/.test(m[1])){
    try{return decodeURIComponent(m[1])}catch(e){return String(m[1]||'').replace(/\+/g,' ')}
  }
  return '';
}
function afisapFeeCanonicalObject(headers,row){
  const raw=rowToObject(headers,row),out={},aliases=afisapFeeAliases();
  Object.keys(aliases).forEach(canonical=>{
    const actual=afisapFeeFindHeader(headers,canonical);
    if(actual)out[canonical]=raw[actual];
  });
  Object.keys(raw).forEach(k=>{if(out[k]===undefined)out[k]=raw[k]});

  // Some production Fees sheets use a different fee-name heading, while some
  // older sheets have no dedicated fee-name column at all. For all NEW records
  // the exact fee name is therefore also embedded in Fee ID and recovered here.
  if(!String(out['Fee Item']||'').trim()){
    out['Fee Item']=afisapFeeItemFromId_(out['Fee ID']||raw['Fee ID']||raw['ID']||'');
  }

  if(out['Balance']===undefined||String(out['Balance']).trim()===''){
    const due=Number(out['Amount Due']||0),paid=Number(out['Amount Paid']||0);
    if(Number.isFinite(due)&&Number.isFinite(paid))out['Balance']=Math.max(0,due-paid);
  }
  if(out['Status']===undefined||String(out['Status']).trim()===''){
    const due=Number(out['Amount Due']||0),paid=Number(out['Amount Paid']||0),balance=Number(out['Balance']||0);
    out['Status']=balance<=0&&due>0?'Paid':due>0?'Owing':'—';
  }
  return out;
}
function afisapFeeValueForHeader(header,data){
  if(data[header]!==undefined&&data[header]!==null)return data[header];
  const aliases=afisapFeeAliases(),key=afisapFeeNormHeader(header);
  for(const canonical of Object.keys(aliases)){
    if(aliases[canonical].map(afisapFeeNormHeader).indexOf(key)!==-1){
      const value=data[canonical];
      return value!==undefined&&value!==null?value:'';
    }
  }
  return '';
}
function ensureFeesFields(){
  // The workbook is near Google's 10M-cell limit.
  // Use the existing Fees schema exactly as it is; do not add columns.
  return getAllowedSheet('Fees');
}
function afisapFeeStudentLink(record,students){
  const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const sid=String(record['Student ID']||record['StudentID']||record['Student Id']||'').trim();
  if(sid){
    // Student ID is authoritative. If an ID is present, never override it by
    // matching a different student through name/admission compatibility.
    const direct=students.find(s=>norm(s.studentId)===norm(sid));
    return direct?String(direct.studentId||'').trim():'';
  }

  // Legacy compatibility is allowed only for historical rows that genuinely
  // have no Student ID stored.
  const admission=norm(record['Admission Number']||record['Admission No']||record['Admission']);
  const name=norm(record['Student Name']||record['Student']||record['Name']||record['Full Name']);

  if(admission){
    const matches=students.filter(s=>norm(s.admissionNumber)===admission);
    if(matches.length===1)return String(matches[0].studentId||'').trim();
  }

  if(name){
    const exact=students.filter(s=>norm(s.name)===name);
    if(exact.length===1)return String(exact[0].studentId||'').trim();

    // Compatibility for historical rows saved with reordered names.
    const sorted=v=>norm(v).split(' ').filter(Boolean).sort().join(' ');
    const wanted=sorted(name);
    const tokenMatches=students.filter(s=>sorted(s.name)===wanted);
    if(tokenMatches.length===1)return String(tokenMatches[0].studentId||'').trim();
  }
  return '';
}
function afisapRepairFeeStudentLinks(){
  return {success:true,updated:0};
}

function ensureAcademicSettingsFields(){
  const sheet=getAllowedSheet('Academic Settings');
  const required=['Setting ID','Academic Year','Term','Vacation Date','Opening Date','Last Updated'];
  let headers=getHeaders(sheet);
  required.forEach(field=>{
    if(headers.indexOf(field)===-1){
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1,sheet.getLastColumn()).setValue(field);
      headers=getHeaders(sheet);
    }
  });
  return sheet;
}

function ensureTeachersFields(){
  const sheet=getAllowedSheet('Teachers');
  const required=['Date of Birth','Ghana Card'];
  let headers=getHeaders(sheet);
  required.forEach(field=>{
    if(headers.indexOf(field)===-1){
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1,sheet.getLastColumn()).setValue(field);
      headers=getHeaders(sheet);
    }
  });
  return sheet;
}

function ensureStudentRollFields(){
  // SAFE COMPATIBILITY: use the existing Students sheet exactly as it is.
  // Do not add Roll No. / No. on Roll columns during normal reading or saving.
  return getAllowedSheet('Students');
}

function syncStudentRolls(){
  const sheet=getAllowedSheet('Students');
  const lastRow=sheet.getLastRow();
  const lastColumn=sheet.getLastColumn();
  if(lastRow<=1 || lastColumn<1) return {success:true,updated:0,skipped:false};

  const data=sheet.getRange(1,1,lastRow,lastColumn).getValues();
  const headers=data[0].map(String);
  const sidIdx=headers.indexOf('Student ID');
  const classIdx=headers.indexOf('Class');
  const rollIdx=headers.indexOf('Roll No.');
  const totalIdx=headers.indexOf('No. on Roll');

  if(sidIdx<0 || classIdx<0){
    return {success:false,error:'Students sheet is missing Student ID or Class.'};
  }

  // The production Students sheet may legitimately have no Roll No. column.
  // That must not block Admin student creation or cloud synchronization.
  if(rollIdx<0 || totalIdx<0){
    return {
      success:true,
      updated:0,
      skipped:true,
      reason:'Roll No. / No. on Roll columns are not present; roll synchronization was skipped safely.'
    };
  }

  const groups={};
  for(let i=1;i<data.length;i++){
    const sid=String(data[i][sidIdx]||'').trim();
    if(!sid) continue;
    const className=String(data[i][classIdx]||'').trim();
    const key=className.toLowerCase();
    if(!groups[key]) groups[key]=[];
    groups[key].push(i);
  }

  let changed=0;
  Object.keys(groups).forEach(key=>{
    const rows=groups[key];
    const used={};
    const assigned={};

    rows.forEach(i=>{
      const raw=String(data[i][rollIdx]||'').trim();
      const n=/^\d+$/.test(raw)?Number(raw):0;
      if(n>0&&!used[n]){
        used[n]=true;
        assigned[i]=n;
      }
    });

    let next=1;
    rows.forEach(i=>{
      if(assigned[i]) return;
      while(used[next]) next++;
      assigned[i]=next;
      used[next]=true;
      next++;
    });

    const classSize=rows.length;
    rows.forEach(i=>{
      const roll=String(assigned[i]).padStart(2,'0');
      if(String(data[i][rollIdx]||'').trim()!==roll){
        sheet.getRange(i+1,rollIdx+1).setValue(roll);
        data[i][rollIdx]=roll;
        changed++;
      }
      if(String(data[i][totalIdx]||'').trim()!==String(classSize)){
        sheet.getRange(i+1,totalIdx+1).setValue(classSize);
        data[i][totalIdx]=classSize;
        changed++;
      }
    });
  });

  return {success:true,updated:changed,skipped:false};
}

function getHeaders(sheet) {
  return sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
}

function rowToObject(headers,row) {
  const object={};
  headers.forEach((header,index)=>{object[header]=row[index];});
  return object;
}

function findRowByField(sheet,field,value) {
  const data=sheet.getDataRange().getValues();
  if(data.length<=1) return null;
  const headers=data[0];
  const fieldIndex=headers.indexOf(field);
  if(fieldIndex===-1) throw new Error('Field not found: '+field);
  for(let i=1;i<data.length;i++){
    if(String(data[i][fieldIndex])===String(value)) return {rowNumber:i+1,row:data[i]};
  }
  return null;
}

function findByField(sheet,field,value) {
  const result=findRowByField(sheet,field,value);
  if(!result) return null;
  return rowToObject(getHeaders(sheet),result.row);
}

/**
 * Find a student by Student ID. The function also tolerates the ID being
 * stored under a common alternative header in the Students sheet.
 */
function findStudentByAnyId(studentId) {
  const sheet = getAllowedSheet('Students');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  const headers = data[0].map(String);
  const possibleIdFields = [
    'Student ID',
    'StudentID',
    'Student Id',
    'studentId',
    'ID'
  ];

  let idIndex = -1;
  for (const field of possibleIdFields) {
    const idx = headers.indexOf(field);
    if (idx !== -1) {
      idIndex = idx;
      break;
    }
  }

  if (idIndex === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(studentId).trim()) {
      return rowToObject(headers, data[i]);
    }
  }

  return null;
}

/**
 * Return the first non-empty value among possible student fields.
 */
function getFirstStudentField(student, fields) {
  for (const field of fields) {
    if (student[field] !== undefined && student[field] !== null) {
      const value = String(student[field]).trim();
      if (value) return value;
    }
  }
  return '';
}

/**
 * Build the Student Name regardless of whether the Students sheet stores
 * the name as one field or separate name fields.
 */
function getStudentDisplayName(student) {
  const directName = getFirstStudentField(student, [
    'Student Name',
    'Full Name',
    'Name',
    'StudentName'
  ]);
  if (directName) return directName;

  const parts = [
    getFirstStudentField(student, ['First Name', 'Firstname', 'firstName']),
    getFirstStudentField(student, ['Middle Name', 'Middlename', 'middleName']),
    getFirstStudentField(student, ['Last Name', 'Surname', 'Lastname', 'lastName']),
    getFirstStudentField(student, ['Other Name', 'Other Names', 'otherName'])
  ].filter(Boolean);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}


/* ============================================================
 * AFISAP GOOGLE DRIVE FILE STORAGE
 * ============================================================
 * Files are stored in Google Drive; Sheets stores only the file
 * reference/metadata. The main AFISAP folder is created
 * automatically in the same Google account as this script.
 *
 * Categories:
 *   student-passports
 *   student-documents
 *   staff-passports
 *   staff-documents
 *   reports
 *   school-documents
 * ============================================================ */

const AFISAP_DRIVE_ROOT = 'AFISAP ROYAL ACADEMY';

function getAfisapDriveRoot() {
  const folders = DriveApp.getFoldersByName(AFISAP_DRIVE_ROOT);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(AFISAP_DRIVE_ROOT);
}

function getAfisapDriveFolder(category, studentId) {
  const root = getAfisapDriveRoot();

  const categoryNames = {
    'student-passports': 'Students - Passport Photos',
    'student-documents': 'Students - Documents',
    'staff-passports': 'Teachers & Staff - Passport Photos',
    'staff-documents': 'Teachers & Staff - Documents',
    'reports': 'Reports',
    'school-documents': 'School Documents',
    'announcements': 'Announcements & Assignments - Attachments',
    'admin-profile': 'Administrator Profile'
  };

  const categoryName = categoryNames[category] || 'Other Files';
  let categoryFolder;

  const folders = root.getFoldersByName(categoryName);
  categoryFolder = folders.hasNext() ? folders.next() : root.createFolder(categoryName);

  // Student/staff files can optionally be grouped by ID.
  if (studentId && /^(student-passports|student-documents|staff-passports|staff-documents)$/.test(category)) {
    const folderName = String(studentId).trim();
    const subfolders = categoryFolder.getFoldersByName(folderName);
    return subfolders.hasNext() ? subfolders.next() : categoryFolder.createFolder(folderName);
  }

  return categoryFolder;
}

function cleanDriveFileName(name) {
  return String(name || 'AFISAP-file')
    .replace(/[\\\/:*?"<>|#%{}~&]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 180);
}

function driveUpload(request) {
  try {
    if (!request || !request.fileData) {
      return {success:false, error:'No file data supplied.'};
    }

    var fileName = cleanDriveFileName(request.fileName);
    var mimeType = String(request.mimeType || 'application/octet-stream');
    var category = String(request.category || 'school-documents');
    var studentId = String(request.studentId || '').trim();
    var allowedCategories=['student-passports','student-documents','staff-passports','staff-documents','reports','school-documents','announcements','admin-profile'];
    if(allowedCategories.indexOf(category)===-1)return {success:false,error:'Unauthorized Drive category.'};

    var base64 = String(request.fileData);
    var comma = base64.indexOf(',');
    if (base64.indexOf('base64,') !== -1 && comma !== -1) {
      base64 = base64.substring(comma + 1);
    }
    if (!base64) return {success:false,error:'Empty file data.'};

    var bytes = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var folder = getAfisapDriveFolder(category, studentId);
    var file = folder.createFile(blob);
    var fileId = file.getId();
    var viewUrl = 'https://drive.google.com/file/d/' + encodeURIComponent(fileId) + '/view';
    var thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId);
    // Sensitive AFISAP files remain private in Google Drive. The frontend reads
    // authorized file bytes through Apps Script instead of public link sharing.

    if (category === 'admin-profile') {
      PropertiesService.getScriptProperties()
        .setProperty('AFISAP_ADMIN_PROFILE_FILE_ID', fileId);
    }


    // For passport photos, update the Student row on the server in the same
    // request so the frontend does not need a second cloud update call.
    if (category === 'student-passports' && studentId) {
      var studentSheet = getAllowedSheet('Students');
      var match = findRowByField(studentSheet, 'Student ID', studentId);

      if (match) {
        var headers = getHeaders(studentSheet);
        var photoIndex = headers.indexOf('Passport Photo');
        if (photoIndex !== -1) {
          studentSheet.getRange(match.rowNumber, photoIndex + 1).setValue(fileId);
        }

        var urlIndex = headers.indexOf('Passport Photo URL');
        if (urlIndex !== -1) {
          studentSheet.getRange(match.rowNumber, urlIndex + 1)
            .setValue('https://drive.google.com/uc?export=view&id=' + fileId);
        }

        var updatedIndex = headers.indexOf('Last Updated');
        if (updatedIndex !== -1) {
          studentSheet.getRange(match.rowNumber, updatedIndex + 1)
            .setValue(new Date().toISOString());
        }
      }
    }


    // For staff passport/Ghana Card uploads, update the Teachers row in the
    // same backend request. The frontend then needs no second Sheet write for
    // the file reference.
    if ((category === 'staff-passports' || category === 'staff-documents') && studentId) {
      var staffSheet = getAllowedSheet('Teachers');
      var staffMatch = findRowByField(staffSheet, 'Staff ID', studentId);

      if (staffMatch) {
        var staffHeaders = getHeaders(staffSheet);
        var staffPhotoIndex = staffHeaders.indexOf('Passport Photo');
        var ghanaCardIndex = staffHeaders.indexOf('Ghana Card');
        var ghanaCardUrlIndex = staffHeaders.indexOf('Ghana Card URL');

        // If a Ghana Card column does not exist yet, append it automatically.
        if (category === 'staff-documents' && ghanaCardIndex === -1) {
          staffSheet.insertColumnAfter(staffSheet.getLastColumn());
          staffSheet.getRange(1, staffSheet.getLastColumn()).setValue('Ghana Card');
          staffHeaders = getHeaders(staffSheet);
          ghanaCardIndex = staffHeaders.indexOf('Ghana Card');
        }

        if (category === 'staff-documents' && ghanaCardUrlIndex === -1) {
          staffSheet.insertColumnAfter(staffSheet.getLastColumn());
          staffSheet.getRange(1, staffSheet.getLastColumn()).setValue('Ghana Card URL');
          staffHeaders = getHeaders(staffSheet);
          ghanaCardUrlIndex = staffHeaders.indexOf('Ghana Card URL');
        }

        if (category === 'staff-passports' && staffPhotoIndex !== -1) {
          staffSheet.getRange(staffMatch.rowNumber, staffPhotoIndex + 1).setValue(fileId);
        }
        if (category === 'staff-documents' && ghanaCardIndex !== -1) {
          staffSheet.getRange(staffMatch.rowNumber, ghanaCardIndex + 1).setValue(fileId);
        }
        if (category === 'staff-documents' && ghanaCardUrlIndex !== -1) {
          staffSheet.getRange(staffMatch.rowNumber, ghanaCardUrlIndex + 1)
            .setValue('https://drive.google.com/uc?export=view&id=' + fileId);
        }

        var staffUpdatedIndex = staffHeaders.indexOf('Last Updated');
        if (staffUpdatedIndex !== -1) {
          staffSheet.getRange(staffMatch.rowNumber, staffUpdatedIndex + 1)
            .setValue(new Date().toISOString());
        }
      }
    }

    return {
      success:true,
      fileId:fileId,
      fileName:file.getName(),
      mimeType:file.getMimeType(),
      size:file.getSize(),
      viewUrl:viewUrl,
      thumbnailUrl:thumbnailUrl,
      category:category,
      studentId:studentId
    };
  } catch (error) {
    return {success:false,error:'Google Drive upload failed: '+error.message};
  }
}



function afisapFileIsManaged_(file){
  const root=getAfisapDriveRoot(),rootId=root.getId();
  let frontier=[];
  const direct=file.getParents();
  while(direct.hasNext())frontier.push(direct.next());
  const seen={};
  for(let depth=0;depth<6&&frontier.length;depth++){
    const next=[];
    for(let i=0;i<frontier.length;i++){
      const folder=frontier[i],id=folder.getId();
      if(id===rootId)return true;
      if(seen[id])continue;
      seen[id]=true;
      const parents=folder.getParents();
      while(parents.hasNext())next.push(parents.next());
    }
    frontier=next;
  }
  return false;
}
function afisapRequireManagedFile_(fileId){
  const file=DriveApp.getFileById(fileId);
  if(!afisapFileIsManaged_(file))throw new Error('The requested file is outside AFISAP managed storage.');
  return file;
}

function driveGet(request) {
  try {
    const fileId = String(request.fileId || '').trim();
    if (!fileId) return {success:false,error:'A Drive File ID is required.'};

    const file = afisapRequireManagedFile_(fileId);
    const blob = file.getBlob();

    return {
      success:true,
      fileId:file.getId(),
      fileName:file.getName(),
      mimeType:blob.getContentType(),
      size:blob.getBytes().length,
      viewUrl:'https://drive.google.com/uc?export=view&id='+encodeURIComponent(file.getId()),
      thumbnailUrl:'https://drive.google.com/thumbnail?id='+encodeURIComponent(file.getId())+'&sz=w800',
      fileData:Utilities.base64Encode(blob.getBytes())
    };
  } catch (error) {
    return {success:false,error:'Could not read Drive file: '+error.message};
  }
}

function driveDelete(request) {
  try {
    const fileId = String(request.fileId || '').trim();
    if (!fileId) return {success:false,error:'A Drive File ID is required.'};

    const file = afisapRequireManagedFile_(fileId);
    const name = file.getName();
    file.setTrashed(true);

    return {
      success:true,
      message:'File moved to Google Drive Trash.',
      fileId:fileId,
      fileName:name
    };
  } catch (error) {
    return {success:false,error:'Could not delete Drive file: '+error.message};
  }
}

function driveList(request) {
  try {
    const category = String(request.category || '').trim();
    const studentId = String(request.studentId || '').trim();
    const allowedCategories=['student-passports','student-documents','staff-passports','staff-documents','reports','school-documents','announcements','admin-profile'];
    if(allowedCategories.indexOf(category || 'school-documents')===-1)return {success:false,error:'Unauthorized Drive category.'};
    const folder = getAfisapDriveFolder(category || 'school-documents', studentId);

    const files = folder.getFiles();
    const records = [];

    while (files.hasNext()) {
      const file = files.next();
      records.push({
        fileId:file.getId(),
        fileName:file.getName(),
        mimeType:file.getMimeType(),
        size:file.getSize(),
        dateCreated:file.getDateCreated().toISOString(),
        lastUpdated:file.getLastUpdated().toISOString()
      });
    }

    return {
      success:true,
      folderId:folder.getId(),
      folderName:folder.getName(),
      files:records,
      count:records.length
    };
  } catch (error) {
    return {success:false,error:'Could not list Drive files: '+error.message};
  }
}


/* ============================================================
 * AFISAP CENTRAL AUTHENTICATION / CONFIGURATION
 * ============================================================ */
const AFISAP_ALLOWED_ADMIN_EMAILS=[
  'afisaproyalacademy@gmail.com',
  'appiatusr@gmail.com'
];
function normalizeAdminEmail(email){return String(email||'').trim().toLowerCase();}
function isAllowedAdminEmail(email){return AFISAP_ALLOWED_ADMIN_EMAILS.indexOf(normalizeAdminEmail(email))!==-1;}

function authLogin(request){
  const email=normalizeAdminEmail(request&&request.email);
  const password=String(request&&request.password||'');
  if(!afisapRateLimit_('admin-login|'+email))return {success:false,error:'Too many login attempts. Please wait and try again.'};
  if(!isAllowedAdminEmail(email))return {success:false,error:'Invalid email address or password.'};
  const key='AFISAP_AUTH_'+email;
  const stored=PropertiesService.getScriptProperties().getProperty(key);
  if(!stored)return {success:false,error:'Administrator password has not been initialized. Use Forgot Password to receive a verification code.'};
  if(!afisapVerifyPasswordRecord_(password,stored))return {success:false,error:'Invalid email address or password.'};

  // Upgrade any legacy unsalted hash after a successful login.
  try{JSON.parse(stored)}catch(e){afisapSetPasswordProperty_(key,password);}
  const session=afisapIssueSession_('admin',{email:email});
  return {success:true,authenticated:true,authToken:session.token,expiresAt:session.expiresAt};
}
function authRequestReset(request){
  const email=normalizeAdminEmail(request&&request.email);
  const generic={success:true,message:'If the account is authorized, a verification code has been sent.'};

  // Privacy: do not reveal which addresses are authorized.
  if(!isAllowedAdminEmail(email))return generic;

  if(!afisapRateLimit_('admin-reset-request|'+email)){
    return {success:false,error:'Please wait a few minutes before requesting another verification code.'};
  }

  const otp=String(Math.floor(100000+Math.random()*900000));
  const expires=Date.now()+10*60*1000;
  const resetKey='AFISAP_ADMIN_RESET_'+afisapSha256Hex_(email);
  const subject='AFISAP Royal Academy Administrator Password Reset';
  const body=
    'AFISAP Royal Academy Administrator Password Reset\n\n'+
    'Your administrator verification code is: '+otp+'\n\n'+
    'This code expires in 10 minutes. If you did not request this reset, ignore this email.';
  const htmlBody=
    '<div style="font-family:Arial,sans-serif;line-height:1.6">'+
    '<h2 style="color:#123f73">AFISAP Royal Academy</h2>'+
    '<p>Your administrator verification code is:</p>'+
    '<div style="display:inline-block;padding:12px 18px;border-radius:10px;background:#eef5ff;color:#123f73;font-size:30px;font-weight:800;letter-spacing:6px">'+otp+'</div>'+
    '<p>This code expires in <strong>10 minutes</strong>.</p>'+
    '<p>If you did not request this password reset, you can safely ignore this email.</p>'+
    '</div>';

  let sent=false,mailError='',gmailError='';
  try{
    // Use the simplest MailApp overload first. It is the most reliable option
    // for Apps Script Web Apps and avoids optional object-field incompatibility.
    MailApp.sendEmail(email,subject,body);
    sent=true;
  }catch(e){
    mailError=String(e&&e.message||e||'');
  }

  if(!sent){
    try{
      // Fallback for deployments where Gmail service is authorized while the
      // Mail service is not. This still sends from the Apps Script owner.
      GmailApp.sendEmail(email,subject,body,{htmlBody:htmlBody,name:'AFISAP Royal Academy'});
      sent=true;
    }catch(e){
      gmailError=String(e&&e.message||e||'');
    }
  }

  if(!sent){
    const combined=(mailError+' '+gmailError).toLowerCase();
    const authProblem=/authoriz|permission|scope|access denied|not have permission/.test(combined);
    console.error('AFISAP admin reset email failed. MailApp='+mailError+' | GmailApp='+gmailError);
    return {
      success:false,
      error:authProblem
        ? 'The password-reset email service is not authorized for this Apps Script deployment. Open the Apps Script project, run the function afisapAuthorizeResetEmail once, approve the requested email permission, then deploy a NEW VERSION of the existing Web App and try again.'
        : 'The verification email could not be sent by Google Apps Script. Please try again shortly. If it still fails, open Apps Script Executions to see the email-service error.'
    };
  }

  // Store a code only after Google accepted the send request.
  PropertiesService.getScriptProperties().setProperty(
    resetKey,
    JSON.stringify({hash:afisapSha256Hex_(otp+'|'+email),expiresAt:expires,attempts:0})
  );

  return {success:true,message:'A 6-digit verification code has been sent to the authorized administrator email. The code expires in 10 minutes.'};
}


function afisapAuthorizeResetEmail(){
  // Run this ONCE manually from the Apps Script editor as the Web App owner.
  // Google will show the authorization dialog for the email service.
  const remaining=MailApp.getRemainingDailyQuota();
  return 'AFISAP password-reset email permission is authorized. Remaining daily recipient quota: '+remaining;
}

function authResetPassword(request){
  const email=normalizeAdminEmail(request&&request.email);
  const otp=String(request&&request.otp||'').trim();
  const password=String(request&&request.password||'');
  if(!afisapRateLimit_('admin-reset-verify|'+email))return {success:false,error:'Too many reset attempts. Please wait and try again.'};
  if(!isAllowedAdminEmail(email))return {success:false,error:'Unable to process password reset. Please contact the system administrator.'};
  const props=PropertiesService.getScriptProperties();
  const resetKey='AFISAP_ADMIN_RESET_'+afisapSha256Hex_(email);
  let reset;
  try{reset=JSON.parse(props.getProperty(resetKey)||'null')}catch(e){}
  if(!reset||Number(reset.expiresAt||0)<=Date.now()){
    props.deleteProperty(resetKey);
    return {success:false,error:'The verification code is invalid or expired.'};
  }
  reset.attempts=Number(reset.attempts||0)+1;
  if(reset.attempts>6){props.deleteProperty(resetKey);return {success:false,error:'The verification code is invalid or expired.'};}
  if(String(reset.hash)!==afisapSha256Hex_(otp+'|'+email)){
    props.setProperty(resetKey,JSON.stringify(reset));
    return {success:false,error:'The verification code is invalid or expired.'};
  }
  if(password.length<8)return {success:false,error:'Password must contain at least 8 characters.'};
  afisapSetPasswordProperty_('AFISAP_AUTH_'+email,password);
  props.deleteProperty(resetKey);
  return {success:true,message:'Administrator password reset successfully.'};
}
function authSessionStatus(request){
  const result=afisapRequireSession_(request,'admin');
  return result.success?{success:true,authenticated:true,email:result.session.principal.email}:{success:false,authenticated:false,error:result.error};
}
function authLogout(request){return afisapDestroySession_(request,'admin');}

// Legacy functions remain as closed compatibility stubs; the router never
// accepts passwords through GET/JSONP anymore.
function authStatus(){return {success:false,error:'Legacy authentication endpoint disabled.'};}
function authVerify(){return {success:false,error:'Legacy authentication endpoint disabled.'};}
function authSetPassword(){return {success:false,error:'Legacy authentication endpoint disabled.'};}

function afisapTeacherLoginKey_(staffId){
  return 'AFISAP_TEACHER_LOGIN_'+afisapSha256Hex_(String(staffId||'').trim().toLowerCase());
}
function afisapTeacherUsernameKey_(username){
  return 'AFISAP_TEACHER_USERNAME_'+afisapSha256Hex_(String(username||'').trim().toLowerCase());
}
function afisapReadTeacherLogin_(staffId){
  const id=String(staffId||'').trim();
  if(!id)return null;
  const raw=PropertiesService.getScriptProperties().getProperty(afisapTeacherLoginKey_(id));
  if(!raw)return null;
  try{
    const record=JSON.parse(raw);
    return record&&String(record.staffId||'').trim()?record:null;
  }catch(e){return null;}
}
function afisapWriteTeacherLogin_(record){
  const staffId=String(record&&record.staffId||'').trim();
  if(!staffId)throw new Error('Staff ID is required.');
  PropertiesService.getScriptProperties().setProperty(afisapTeacherLoginKey_(staffId),JSON.stringify(record));
  return record;
}
function afisapTeacherLoginIsEnabled_(record){
  if(!record)return false;
  const raw=record.enabled;
  if(raw===true)return true;
  if(raw===false)return false;
  const value=String(raw==null?'':raw).trim().toLowerCase();
  if(['true','1','yes','active','enabled'].indexOf(value)!==-1)return true;
  if(['false','0','no','inactive','disabled'].indexOf(value)!==-1)return false;

  // Backward-compatible default for already-created credentials that have
  // username + password hash but no explicit enabled flag.
  return !!(String(record.username||'').trim() && String(record.hash||'').trim());
}
function afisapTeacherEmploymentActive_(teacher){
  const status=String(teacher&&teacher['Status']||'Active').trim().toLowerCase();
  return ['inactive','disabled','terminated','removed'].indexOf(status)===-1;
}
function afisapTeacherLoginByUsername_(username){
  const canonical=String(username||'').trim().toLowerCase();
  if(!canonical)return null;
  const props=PropertiesService.getScriptProperties();
  const staffId=String(props.getProperty(afisapTeacherUsernameKey_(canonical))||'').trim();
  if(!staffId)return null;
  const record=afisapReadTeacherLogin_(staffId);
  if(!record)return null;
  if(String(record.canonicalUsername||record.username||'').trim().toLowerCase()!==canonical)return null;
  return record;
}
function afisapTeacherPasswordParts_(password){
  if(!afisapStrongTeacherPassword_(password))throw new Error('Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.');
  const record=JSON.parse(afisapPasswordRecord_(password));
  return {hash:String(record.hash),salt:String(record.salt),iterations:Number(record.iterations)||AFISAP_PASSWORD_ITERATIONS};
}
function afisapStrongTeacherPassword_(password){
  const p=String(password||'');
  return p.length>=8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);
}
function afisapValidTeacherUsername_(username){
  const u=String(username||'').trim();
  return u.length>=6 && u.length<=40 &&
    /^[A-Za-z0-9._@-]+$/.test(u) &&
    /[A-Z]/.test(u) &&
    /[a-z]/.test(u) &&
    /\d/.test(u) &&
    /[._@-]/.test(u);
}
function afisapVerifyTeacherLoginPassword_(password,record){
  const hash=String(record&&record.hash||''),salt=String(record&&record.salt||'');
  const iterations=Math.max(1000,Math.min(10000,Number(record&&record.iterations)||AFISAP_PASSWORD_ITERATIONS));
  if(!hash||!salt)return false;
  let value=String(password||'')+'|'+salt;
  for(let i=0;i<iterations;i++)value=afisapSha256Hex_(value);
  return value===hash;
}
function afisapInvalidateTeacherSessions_(staffId){
  const target=String(staffId||'').trim().toLowerCase(),props=PropertiesService.getScriptProperties(),all=props.getProperties();
  Object.keys(all).forEach(function(key){
    if(key.indexOf('AFISAP_SESSION_')!==0)return;
    try{
      const s=JSON.parse(all[key]||'null');
      if(s&&s.role==='teacher'&&String(s.principal&&s.principal.staffId||'').trim().toLowerCase()===target)props.deleteProperty(key);
    }catch(e){}
  });
}
function teacherAuthLogin(request){
  const enteredUsername=String(request&&request.username||'').trim();
  const canonical=enteredUsername.toLowerCase();
  const password=String(request&&request.password||'');
  if(!afisapRequireBroadAuthThrottle_('teacher-login'))return {success:false,error:'Too many Teacher Portal login attempts. Please wait and try again.'};
  if(!afisapRateLimit_('teacher-login|'+canonical))return {success:false,error:'Too many login attempts. Please wait and try again.'};

  const login=afisapTeacherLoginByUsername_(canonical);
  if(!login)return {success:false,error:'Invalid username or password.'};

  const staffId=String(login.staffId||'').trim();
  const teacher=afisapTeacherRowById_(staffId);
  if(!teacher)return {success:false,error:'Invalid username or password.'};

  if(!afisapTeacherLoginIsEnabled_(login))return {success:false,error:'This Teacher Portal account is currently disabled. Please contact the administrator.'};
  if(!afisapTeacherEmploymentActive_(teacher))return {success:false,error:'This Teacher Portal account is currently disabled because the teacher/staff record is inactive. Please contact the administrator.'};

  const lockTime=login.lockoutUntil?new Date(login.lockoutUntil).getTime():0;
  if(lockTime&&lockTime>Date.now())return {success:false,error:'Too many failed login attempts. Please wait and try again.'};

  if(!afisapVerifyTeacherLoginPassword_(password,login)){
    let failed=Number(login.failedLoginAttempts||0)+1;
    let until='';
    if(failed>=5){
      until=new Date(Date.now()+15*60*1000).toISOString();
      failed=0;
    }
    login.failedLoginAttempts=failed;
    login.lockoutUntil=until;
    afisapWriteTeacherLogin_(login);
    return {success:false,error:'Invalid username or password.'};
  }

  login.failedLoginAttempts=0;
  login.lockoutUntil='';
  login.lastLoginAt=new Date().toISOString();
  afisapWriteTeacherLogin_(login);

  const session=afisapIssueSession_('teacher',{
    staffId:staffId,
    username:String(login.username||enteredUsername)
  });

  // Return the minimum dashboard bootstrap in the authentication response.
  // This removes the second authenticated HTTP request that previously made
  // successful sign-in wait for another full Apps Script round-trip.
  const publicTeacher=teacherPortalPublicTeacher(teacher);
  const students=teacherPortalPublicStudentsForTeacher(publicTeacher)
    .filter(s=>s.studentId&&s.name)
    .sort((a,b)=>a.name.localeCompare(b.name));
  return {
    success:true,
    authenticated:true,
    authToken:session.token,
    expiresAt:session.expiresAt,
    teacher:{
      staffId:publicTeacher.staffId,
      name:publicTeacher.name,
      position:publicTeacher.position,
      classes:publicTeacher.classes,
      subjects:publicTeacher.subjects
    },
    profile:teacherPortalProfileFromRow(teacher),
    students:students,
    school:teacherPortalSchoolInfo(),
    schoolClasses:teacherPortalCentralClassNames()
  };
}
function teacherAuthSessionStatus(request){
  const result=afisapRequireSession_(request,'teacher');
  if(!result.success)return {success:false,authenticated:false,error:result.error};

  const staffId=String(result.session.principal.staffId||'').trim();
  const teacher=afisapTeacherRowById_(staffId);
  const login=afisapReadTeacherLogin_(staffId);
  if(!teacher||!login)return {success:false,authenticated:false,error:'Teacher account is unavailable.'};

  if(!afisapTeacherLoginIsEnabled_(login) || !afisapTeacherEmploymentActive_(teacher)){
    afisapInvalidateTeacherSessions_(staffId);
    return {success:false,authenticated:false,error:'This Teacher Portal account is currently disabled. Please contact the administrator.'};
  }
  return {success:true,authenticated:true,staffId:staffId,username:String(login.username||'')};
}
function teacherAuthLogout(request){return afisapDestroySession_(request,'teacher');}

function adminGetTeacherLogin(request){
  const staffId=String(request&&request.staffId||'').trim();
  if(!afisapTeacherRowById_(staffId))return {success:false,error:'Teacher record not found.'};

  const r=afisapReadTeacherLogin_(staffId);
  if(!r)return {success:true,login:{username:'',configured:false,enabled:false,passwordUpdatedAt:'',lastLoginAt:''}};

  return {success:true,login:{
    username:String(r.username||''),
    configured:!!String(r.hash||''),
    enabled:afisapTeacherLoginIsEnabled_(r),
    passwordUpdatedAt:String(r.passwordUpdatedAt||''),
    lastLoginAt:String(r.lastLoginAt||'')
  }};
}
function adminSetTeacherCredentials(request){
  const staffId=String(request&&request.staffId||'').trim();
  const username=String(request&&request.username||'').trim();
  const canonical=username.toLowerCase();
  const password=String(request&&request.password||'');

  if(!afisapTeacherRowById_(staffId))return {success:false,error:'Teacher record not found.'};
  if(!afisapValidTeacherUsername_(username)){
    return {success:false,error:'Username must be 6–40 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character from . _ - @. Spaces are not allowed.'};
  }

  const props=PropertiesService.getScriptProperties();
  const usernameKey=afisapTeacherUsernameKey_(canonical);
  const existingStaffId=String(props.getProperty(usernameKey)||'').trim();
  if(existingStaffId&&existingStaffId.toLowerCase()!==staffId.toLowerCase()){
    return {success:false,error:'This username is already assigned to another teacher. Please choose another username.'};
  }

  let parts;
  try{parts=afisapTeacherPasswordParts_(password)}catch(e){return {success:false,error:e.message};}

  const previous=afisapReadTeacherLogin_(staffId);
  if(previous&&previous.canonicalUsername&&previous.canonicalUsername!==canonical){
    props.deleteProperty(afisapTeacherUsernameKey_(previous.canonicalUsername));
  }

  const now=new Date().toISOString();
  const record={
    staffId:staffId,
    username:username,
    canonicalUsername:canonical,
    hash:parts.hash,
    salt:parts.salt,
    iterations:parts.iterations,
    enabled:true,
    passwordUpdatedAt:now,
    lastLoginAt:previous?String(previous.lastLoginAt||''):'',
    failedLoginAttempts:0,
    lockoutUntil:''
  };

  afisapWriteTeacherLogin_(record);
  props.setProperty(usernameKey,staffId);
  afisapInvalidateTeacherSessions_(staffId);

  const confirmed=afisapReadTeacherLogin_(staffId);
  if(!confirmed || !afisapTeacherLoginIsEnabled_(confirmed) || String(confirmed.canonicalUsername||'')!==canonical){
    return {success:false,error:'Teacher Portal credentials could not be confirmed after saving. Please try again.'};
  }

  return {success:true,message:'Teacher Portal login credentials created successfully.',login:{username:username,configured:true,enabled:true}};
}
function adminResetTeacherPassword(request){
  const staffId=String(request&&request.staffId||'').trim();
  const password=String(request&&request.password||'');

  if(!afisapTeacherRowById_(staffId))return {success:false,error:'Teacher record not found.'};
  const login=afisapReadTeacherLogin_(staffId);
  if(!login||!String(login.username||'').trim())return {success:false,error:'Create the Teacher Portal username first.'};

  let parts;
  try{parts=afisapTeacherPasswordParts_(password)}catch(e){return {success:false,error:e.message};}

  login.hash=parts.hash;
  login.salt=parts.salt;
  login.iterations=parts.iterations;
  login.passwordUpdatedAt=new Date().toISOString();
  login.failedLoginAttempts=0;
  login.lockoutUntil='';
  afisapWriteTeacherLogin_(login);
  afisapInvalidateTeacherSessions_(staffId);

  return {success:true,message:'Teacher Portal password reset successfully.'};
}
function adminSetTeacherLoginStatus(request){
  const staffId=String(request&&request.staffId||'').trim();
  const rawEnabled=request&&request.enabled;
  const enabled=(rawEnabled===true || ['true','1','yes','active','enabled'].indexOf(String(rawEnabled||'').trim().toLowerCase())!==-1);

  if(!afisapTeacherRowById_(staffId))return {success:false,error:'Teacher record not found.'};
  const login=afisapReadTeacherLogin_(staffId);
  if(!login||!String(login.username||'').trim()||!String(login.hash||'').trim()){
    return {success:false,error:'Create Teacher Portal login credentials before changing portal access.'};
  }

  login.enabled=enabled;
  afisapWriteTeacherLogin_(login);
  if(!enabled)afisapInvalidateTeacherSessions_(staffId);

  return {success:true,message:enabled?'Teacher Portal login enabled.':'Teacher Portal login disabled.',enabled:enabled};
}

function parentAuthLogin(request){
  const studentId=String(request&&request.studentId||'').trim();
  const guardianPhone=afisapNormalizePhone_(request&&request.guardianPhone);
  if(!afisapRequireBroadAuthThrottle_('parent-login'))return {success:false,error:'Too many Parent Portal verification attempts. Please wait and try again.'};
  if(!afisapRateLimit_('parent-login|'+studentId.toLowerCase()))return {success:false,error:'Too many verification attempts. Please wait and try again.'};
  const student=afisapStudentRowById_(studentId);
  if(!student)return {success:false,error:'Student verification failed.'};
  const registered=afisapNormalizePhone_(afisapGuardianContact_(student));
  if(!registered||!guardianPhone||registered!==guardianPhone)return {success:false,error:'Student verification failed.'};
  const session=afisapIssueSession_('parent',{studentId:String(student['Student ID']||studentId).trim()});
  return {
    success:true,authenticated:true,authToken:session.token,expiresAt:session.expiresAt,
    student:{studentId:String(student['Student ID']||''),name:getStudentDisplayName(student),className:String(student['Class']||'')}
  };
}
function parentAuthSessionStatus(request){
  const result=afisapRequireSession_(request,'parent');
  if(!result.success)return {success:false,authenticated:false,error:result.error};
  const student=afisapStudentRowById_(result.session.principal.studentId);
  return {success:true,authenticated:true,student:student?{studentId:String(student['Student ID']||''),name:getStudentDisplayName(student),className:String(student['Class']||'')}:{studentId:result.session.principal.studentId}};
}
function parentAuthLogout(request){return afisapDestroySession_(request,'parent');}

function afisapSystemConfigColumns_(sheet){
  const headers=getHeaders(sheet);
  const pick=function(candidates){
    for(let i=0;i<candidates.length;i++){
      const idx=headers.indexOf(candidates[i]);
      if(idx>=0)return {name:candidates[i],index:idx};
    }
    return null;
  };
  return {
    headers:headers,
    id:pick(['Setting ID','ID','Key','Setting Key']),
    value:pick(['Value','Setting Value','JSON','Data','Config']),
    updated:pick(['Last Updated','Updated At','Date Updated'])
  };
}
function afisapReadSystemConfigFromSheet_(){
  const sheet=getAllowedSheet('System Settings');
  const cols=afisapSystemConfigColumns_(sheet);
  if(!cols.id||!cols.value)return null;
  const lastRow=sheet.getLastRow();
  if(lastRow<2)return null;
  const ids=sheet.getRange(2,cols.id.index+1,lastRow-1,1).getDisplayValues();
  for(let i=0;i<ids.length;i++){
    if(String(ids[i][0]||'').trim()==='AFISAP_CONFIG'){
      const raw=String(sheet.getRange(i+2,cols.value.index+1).getValue()||'').trim();
      if(!raw)return {};
      try{return JSON.parse(raw);}catch(e){return {};}
    }
  }
  return null;
}
function afisapWriteSystemConfigToSheet_(config){
  const sheet=getAllowedSheet('System Settings');
  const cols=afisapSystemConfigColumns_(sheet);
  if(!cols.id||!cols.value){
    throw new Error('System Settings sheet must contain a Setting ID (or Key) column and a Value (or JSON/Data) column. No columns were added.');
  }
  const payload=JSON.stringify(config||{});
  const lastRow=sheet.getLastRow();
  let rowNumber=0;
  if(lastRow>=2){
    const ids=sheet.getRange(2,cols.id.index+1,lastRow-1,1).getDisplayValues();
    for(let i=0;i<ids.length;i++){
      if(String(ids[i][0]||'').trim()==='AFISAP_CONFIG'){rowNumber=i+2;break;}
    }
  }
  if(!rowNumber){
    const nextRow=Math.max(2,lastRow+1);
    if(nextRow>sheet.getMaxRows()){
      teacherPortalCellPreflight(sheet,1,0,'adding the AFISAP System Settings row');
      sheet.insertRowsAfter(sheet.getMaxRows(),1);
    }
    rowNumber=nextRow;
  }
  sheet.getRange(rowNumber,cols.id.index+1).setValue('AFISAP_CONFIG');
  sheet.getRange(rowNumber,cols.value.index+1).setValue(payload);
  if(cols.updated)sheet.getRange(rowNumber,cols.updated.index+1).setValue(new Date().toISOString());
  SpreadsheetApp.flush();
  return rowNumber;
}
function configGet(){
  try{
    const sheetConfig=afisapReadSystemConfigFromSheet_();
    if(sheetConfig!==null){
      // Keep the legacy property mirrored for compatibility, but Google Sheets
      // is the authoritative source for School Setup.
      PropertiesService.getScriptProperties().setProperty('AFISAP_CONFIG',JSON.stringify(sheetConfig));
      return {success:true,config:sheetConfig,source:'Google Sheets / System Settings'};
    }
  }catch(e){}
  const raw=PropertiesService.getScriptProperties().getProperty('AFISAP_CONFIG');
  let config={};
  if(raw){try{config=JSON.parse(raw);}catch(e){}}
  return {success:true,config:config,source:'Legacy configuration fallback'};
}
function afisapSyncSubjectsToSheet_(subjects){
  const names=[...new Set((Array.isArray(subjects)?subjects:[]).map(v=>String(v||'').trim()).filter(Boolean))];
  if(!names.length)return {success:true,created:0};
  const sheet=getAllowedSheet('Subjects'),headers=getHeaders(sheet);
  const nameHeader=['Subject Name','Subject','Name'].find(h=>headers.indexOf(h)>=0);
  if(!nameHeader)return {success:false,error:'Subjects sheet has no Subject Name/Subject/Name column.'};
  const idHeader=['Subject ID','ID'].find(h=>headers.indexOf(h)>=0);
  const nameIdx=headers.indexOf(nameHeader),lastRow=sheet.getLastRow();
  const existing=new Set(lastRow>=2?sheet.getRange(2,nameIdx+1,lastRow-1,1).getDisplayValues().flat().map(v=>String(v||'').trim().toLowerCase()).filter(Boolean):[]);
  let created=0;
  names.forEach(name=>{
    if(existing.has(name.toLowerCase()))return;
    const row={};row[nameHeader]=name;if(idHeader)row[idHeader]='SUBJ-'+Utilities.getUuid();
    afisapSafeAppendExistingSheetRow(sheet,headers,row,'adding a Subject record');
    existing.add(name.toLowerCase());created++;
  });
  SpreadsheetApp.flush();
  return {success:true,created:created};
}

function configSet(request){
  try{
    const config=request&&request.config?JSON.parse(String(request.config)):{};
    const rowNumber=afisapWriteSystemConfigToSheet_(config);
    const subjectSync=afisapSyncSubjectsToSheet_(config.subjects||[]);
    if(!subjectSync.success)throw new Error(subjectSync.error||'Subjects could not be synchronized.');
    PropertiesService.getScriptProperties().setProperty('AFISAP_CONFIG',JSON.stringify(config));
    return {success:true,rowNumber:rowNumber,subjectsCreated:subjectSync.created||0,source:'Google Sheets / System Settings + Subjects'};
  }catch(e){
    return {success:false,error:'Could not save School Setup to Google Sheets: '+e.message};
  }
}
function adminProfileGet(){
  const fileId=String(PropertiesService.getScriptProperties()
    .getProperty('AFISAP_ADMIN_PROFILE_FILE_ID')||'').trim();
  if(!fileId) return {success:true,fileId:''};
  try{
    const file=afisapRequireManagedFile_(fileId);
    return {success:true,fileId:fileId,fileName:file.getName(),mimeType:file.getMimeType(),size:file.getSize()};
  }catch(e){
    return {success:false,error:'Could not read administrator profile: '+e.message};
  }
}
function adminProfileSet(request){
  const fileId=String(request&&request.fileId||'').trim();
  const clear=String(request&&request.clear||'').trim()==='1';
  if(clear && !fileId){
    PropertiesService.getScriptProperties().deleteProperty('AFISAP_ADMIN_PROFILE_FILE_ID');
    return {success:true,fileId:''};
  }
  if(!fileId) return {success:false,error:'A Drive File ID is required.'};
  try{
    afisapRequireManagedFile_(fileId);
    PropertiesService.getScriptProperties().setProperty('AFISAP_ADMIN_PROFILE_FILE_ID',fileId);
    return {success:true,fileId:fileId};
  }catch(e){
    return {success:false,error:'Could not save administrator profile reference: '+e.message};
  }
}

function getPrimaryIdField(sheetName) {
  const fields={
    'Students':'Student ID',
    'Teachers':'Staff ID',
    'Classes':'Class ID',
    'Subjects':'Subject ID',
    'Student Attendance':'Attendance ID',
    'Teacher Attendance':'Attendance ID',
    'Results':'Result ID',
    'Fees':'Fee ID',
    'Academic Settings':'Setting ID',
    'System Settings':'Setting ID',
    'Announcements & Assignments':'Announcement ID'
  };
  return fields[sheetName] || null;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function jsonOrJsonp(data,callback) {
  const json=JSON.stringify(data);
  if(callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)){
    return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
