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
  'System Settings'
];

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action) {
      let request;
      if (p.payload) {
        try {
          request = JSON.parse(p.payload);
        } catch (parseError) {
          return jsonOrJsonp({success:false,error:'Invalid payload JSON: '+parseError.message}, p.callback);
        }
      } else {
        // Preserve ALL GET parameters. The frontend sends authentication
        // fields such as email/password in addition to the normal sheet
        // fields. The previous version dropped those fields here, which
        // caused authSetPassword/authVerify to receive an empty password.
        request = Object.assign({}, p);
        delete request.callback;
        delete request.payload;
      }

      let result;
      switch (request.action) {
        case 'read': result = readRecords(request); break;
        case 'search': result = searchRecords(request); break;
        case 'count': result = countRecords(request); break;
        case 'create': result = createRecord(request); break;
        case 'update': result = updateRecord(request); break;
        case 'delete': result = deleteRecord(request); break;
        case 'driveUpload': result = driveUpload(request); break;
        case 'driveGet': result = driveGet(request); break;
        case 'driveDelete': result = driveDelete(request); break;
        case 'driveList': result = driveList(request); break;
        case 'authStatus': result = authStatus(request); break;
        case 'authVerify': result = authVerify(request); break;
        case 'authSetPassword': result = authSetPassword(request); break;
        case 'configGet': result = configGet(request); break;
        case 'configSet': result = configSet(request); break;
        case 'adminProfileGet': result = adminProfileGet(request); break;
        case 'adminProfileSet': result = adminProfileSet(request); break;
        default:
          result = {success:false,error:'Unsupported GET action: '+request.action};
      }
      return jsonOrJsonp(result, p.callback);
    }

    return jsonOrJsonp({
      success:true,
      system:'AFISAP Royal Academy School Management System',
      status:'online',
      timestamp:new Date().toISOString()
    }, p.callback);
  } catch (error) {
    return jsonOrJsonp({success:false,error:error.message}, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({success:false,error:'No request data received.'});
    }
    const request = JSON.parse(e.postData.contents);
    if (!request.action) {
      return jsonResponse({success:false,error:'No action specified.'});
    }
    switch (request.action) {
      case 'read': return jsonResponse(readRecords(request));
      case 'search': return jsonResponse(searchRecords(request));
      case 'create': return jsonResponse(createRecord(request));
      case 'update': return jsonResponse(updateRecord(request));
      case 'delete': return jsonResponse(deleteRecord(request));
      case 'driveUpload': return jsonResponse(driveUpload(request));
      case 'driveGet': return jsonResponse(driveGet(request));
      case 'driveDelete': return jsonResponse(driveDelete(request));
      case 'driveList': return jsonResponse(driveList(request));
      case 'authStatus': return jsonResponse(authStatus(request));
      case 'authVerify': return jsonResponse(authVerify(request));
      case 'authSetPassword': return jsonResponse(authSetPassword(request));
      case 'configGet': return jsonResponse(configGet(request));
      case 'configSet': return jsonResponse(configSet(request));
      case 'adminProfileGet': return jsonResponse(adminProfileGet(request));
      case 'adminProfileSet': return jsonResponse(adminProfileSet(request));
      case 'count': return jsonResponse(countRecords(request));
      default: return jsonResponse({success:false,error:'Unknown API action: '+request.action});
    }
  } catch (error) {
    return jsonResponse({success:false,error:error.message,stack:error.stack});
  }
}

function readRecords(request) {
  const sheet = getAllowedSheet(request.sheet);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {success:true,sheet:request.sheet,records:[]};
  const headers = data[0];
  const records = data.slice(1)
    .filter(row => row.some(value => value !== ''))
    .map(row => rowToObject(headers,row));
  return {success:true,sheet:request.sheet,records:records,count:records.length};
}

function searchRecords(request) {
  const sheet = getAllowedSheet(request.sheet);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {success:true,records:[]};
  const headers = data[0];
  const fieldIndex = headers.indexOf(request.field);
  if (fieldIndex === -1) return {success:false,error:'Field not found: '+request.field};
  const searchValue = String(request.value || '').toLowerCase();
  const records = data.slice(1)
    .filter(row => String(row[fieldIndex] || '').toLowerCase().includes(searchValue))
    .map(row => rowToObject(headers,row));
  return {success:true,records:records,count:records.length};
}

function createRecord(request) {
  const sheet = request.sheet === 'Teachers' ? ensureTeachersFields() : getAllowedSheet(request.sheet);
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
  const idField = getPrimaryIdField(request.sheet);
  if (idField && request.data[idField]) {
    const existing = findByField(sheet,idField,String(request.data[idField]));
    if (existing) return {success:false,duplicate:true,error:idField+' already exists: '+request.data[idField]};
  }
  const row = headers.map(header => request.data[header] !== undefined && request.data[header] !== null ? request.data[header] : '');
  sheet.appendRow(row);
  const newRow = sheet.getLastRow();
  const savedRow = sheet.getRange(newRow,1,1,headers.length).getValues()[0];
  return {success:true,message:'Record created successfully.',record:rowToObject(headers,savedRow)};
}

function updateRecord(request) {
  const sheet = request.sheet === 'Teachers' ? ensureTeachersFields() : getAllowedSheet(request.sheet);
  if (!request.data || typeof request.data !== 'object') return {success:false,error:'No update data supplied.'};

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

  const idField = request.idField || getPrimaryIdField(request.sheet);
  const idValue = request.idValue || request.data[idField];
  if (!idField || !idValue) return {success:false,error:'A record ID is required for updating.'};
  const result = findRowByField(sheet,idField,String(idValue));
  if (!result) return {success:false,error:'Record not found.'};
  const headers = getHeaders(sheet);
  headers.forEach((header,index)=>{
    if(request.data[header] !== undefined && header !== idField){
      sheet.getRange(result.rowNumber,index+1).setValue(request.data[header]);
    }
  });
  const updatedRow = sheet.getRange(result.rowNumber,1,1,headers.length).getValues()[0];
  return {success:true,message:'Record updated successfully.',record:rowToObject(headers,updatedRow)};
}

function deleteRecord(request) {
  const sheet = getAllowedSheet(request.sheet);
  const idField = request.idField || getPrimaryIdField(request.sheet);
  const idValue = request.idValue;
  if(!idField || !idValue) return {success:false,error:'A record ID is required.'};
  const result = findRowByField(sheet,idField,String(idValue));
  if(!result) return {success:false,error:'Record not found.'};
  sheet.deleteRow(result.rowNumber);
  return {success:true,message:'Record deleted successfully.'};
}

function countRecords(request) {
  const sheet = getAllowedSheet(request.sheet);
  return {success:true,sheet:request.sheet,count:Math.max(0,sheet.getLastRow()-1)};
}

function getAllowedSheet(sheetName) {
  if(!ALLOWED_SHEETS.includes(sheetName)) throw new Error('Unauthorized or invalid sheet: '+sheetName);
  const spreadsheet=SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet=spreadsheet.getSheetByName(sheetName);
  if(!sheet) throw new Error('Sheet does not exist: '+sheetName);
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

    // Make the uploaded image displayable by the public GitHub Pages frontend.
    // If the school's Google Workspace policy prevents public link sharing,
    // the file is still stored and the File ID is returned.
    var viewUrl = 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(fileId);
    var thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w800';
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareError) {
      console.warn('AFISAP: Could not enable anyone-with-link viewing: ' + shareError.message);
    }

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
      viewUrl:viewUrl,
      thumbnailUrl:thumbnailUrl,
      message:'File uploaded successfully to Google Drive.',
      fileId:fileId,
      fileName:file.getName(),
      mimeType:file.getMimeType(),
      size:file.getSize(),
      category:category,
      folderId:folder.getId(),
      folderName:folder.getName()
    };
  } catch (error) {
    return {success:false,error:'Google Drive upload failed: '+error.message};
  }
}


function driveGet(request) {
  try {
    const fileId = String(request.fileId || '').trim();
    if (!fileId) return {success:false,error:'A Drive File ID is required.'};

    const file = DriveApp.getFileById(fileId);
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

    const file = DriveApp.getFileById(fileId);
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

function normalizeAdminEmail(email){
  return String(email||'').trim().toLowerCase();
}
function isAllowedAdminEmail(email){
  return AFISAP_ALLOWED_ADMIN_EMAILS.indexOf(normalizeAdminEmail(email))!==-1;
}
function hashAdminPassword(password){
  const bytes=Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password||''),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b){
    const v=(b<0?b+256:b).toString(16);
    return v.length===1?'0'+v:v;
  }).join('');
}
function authStatus(request){
  const email=normalizeAdminEmail(request&&request.email);
  if(!isAllowedAdminEmail(email)) return {success:false,error:'Unauthorized administrator email.'};
  return {
    success:true,
    email:email,
    hasPassword:!!PropertiesService.getScriptProperties().getProperty('AFISAP_AUTH_'+email)
  };
}
function authVerify(request){
  const email=normalizeAdminEmail(request&&request.email);
  const password=String(request&&request.password||'');
  if(!isAllowedAdminEmail(email)) return {success:false,error:'Unauthorized administrator email.'};
  const expected=PropertiesService.getScriptProperties().getProperty('AFISAP_AUTH_'+email);
  if(!expected) return {success:true,verified:false,hasPassword:false};
  return {success:true,verified:hashAdminPassword(password)===expected,hasPassword:true};
}
function authSetPassword(request){
  const email=normalizeAdminEmail(request&&request.email);
  const password=String(request&&request.password||'');
  if(!isAllowedAdminEmail(email)) {
    return {success:false,error:'Unauthorized administrator email.'};
  }
  if(password.length<6) {
    return {success:false,error:'Password must contain at least 6 characters.'};
  }
  try {
    PropertiesService.getScriptProperties()
      .setProperty('AFISAP_AUTH_'+email,hashAdminPassword(password));
    // Read it back immediately so the caller gets confirmation that the
    // central property was actually written.
    const saved=PropertiesService.getScriptProperties()
      .getProperty('AFISAP_AUTH_'+email);
    if(!saved) {
      return {success:false,error:'Central password storage did not confirm the saved password.'};
    }
    return {success:true,message:'Administrator password saved centrally.'};
  } catch(e) {
    return {success:false,error:'Could not save the central password: '+e.message};
  }
}
function configGet(){
  const raw=PropertiesService.getScriptProperties().getProperty('AFISAP_CONFIG');
  let config={};
  if(raw){try{config=JSON.parse(raw);}catch(e){}}
  return {success:true,config:config};
}
function configSet(request){
  try{
    const config=request&&request.config?JSON.parse(String(request.config)):{};
    PropertiesService.getScriptProperties().setProperty('AFISAP_CONFIG',JSON.stringify(config));
    return {success:true};
  }catch(e){
    return {success:false,error:'Could not save central configuration: '+e.message};
  }
}
function adminProfileGet(){
  const fileId=String(PropertiesService.getScriptProperties()
    .getProperty('AFISAP_ADMIN_PROFILE_FILE_ID')||'').trim();
  if(!fileId) return {success:true,fileId:''};
  try{
    const file=DriveApp.getFileById(fileId);
    return {success:true,fileId:fileId,fileName:file.getName(),mimeType:file.getMimeType(),size:file.getSize()};
  }catch(e){
    return {success:false,error:'Could not read administrator profile: '+e.message};
  }
}
function adminProfileSet(request){
  const fileId=String(request&&request.fileId||'').trim();
  if(!fileId) return {success:false,error:'A Drive File ID is required.'};
  try{
    DriveApp.getFileById(fileId);
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
    'System Settings':'Setting ID'
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
