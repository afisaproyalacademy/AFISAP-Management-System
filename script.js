const form = document.getElementById("admissionForm");

function getToday() {
  return new Date();
}

function formatReadableDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatShortDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function getClassCode() {
  const field = form.elements["Class Applying For"];
  if (!field || !field.value) return "";

  const map = {
    "Creche": "CRECHE",
    "Nursery 1": "NURSERY1",
    "Nursery 2": "NURSERY2",
    "KG 1": "KG1",
    "KG 2": "KG2",
    "Class 1": "CLASS1",
    "Class 2": "CLASS2",
    "Class 3": "CLASS3",
    "Class 4": "CLASS4",
    "Class 5": "CLASS5",
    "Class 6": "CLASS6",
    "JHS 1": "JHS1",
    "JHS 2": "JHS2",
    "JHS 3": "JHS3"
  };

  return map[field.value] || field.value.replace(/\s+/g, "").toUpperCase();
}

function getApplicationSequence(dateKey, classCode) {
  const key = `afisap_application_sequence_${dateKey}_${classCode}`;

  if (!window.afisapApplicationSequences) {
    window.afisapApplicationSequences = {};
  }

  if (!window.afisapApplicationSequences[key]) {
    let current = Number(localStorage.getItem(key) || "0");
    if (!Number.isFinite(current) || current < 0) current = 0;

    current += 1;
    localStorage.setItem(key, String(current));
    window.afisapApplicationSequences[key] = current;
  }

  return String(window.afisapApplicationSequences[key]).padStart(3, "0");
}

function updateAutomaticDetails() {
  const today = getToday();
  const readableDate = formatReadableDate(today);
  const shortDate = formatShortDate(today);
  const classCode = getClassCode();

  // Application Date is generated internally. It is NOT an input field.
  const applicationDateInput = document.getElementById("applicationDateInput");
  if (applicationDateInput) {
    applicationDateInput.value = readableDate;
  }

  // Declaration Date is generated internally and is not editable.
  const declarationDate = document.getElementById("declarationDate");
  if (declarationDate) {
    declarationDate.textContent = readableDate;
  }

  const applicationNumber = document.getElementById("applicationNumber");
  const applicationNumberInput = document.getElementById("applicationNumberInput");

  if (!classCode) {
    const pending = `${shortDate}/AFISAP/SELECTCLASS`;
    if (applicationNumber) applicationNumber.textContent = pending;
    if (applicationNumberInput) applicationNumberInput.value = pending;
    return;
  }

  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const sequence = getApplicationSequence(dateKey, classCode);
  const number = `${shortDate}/AFISAP/${classCode}/${sequence}`;

  if (applicationNumber) applicationNumber.textContent = number;
  if (applicationNumberInput) applicationNumberInput.value = number;
}

function updateDeclarationName() {
  const parent = form.elements["Parent/Guardian Full Name"];
  const declarationName = document.getElementById("declarationName");

  if (declarationName) {
    declarationName.textContent = parent ? parent.value.trim() : "";
  }
}

const parentName = form.elements["Parent/Guardian Full Name"];
if (parentName) {
  parentName.addEventListener("input", updateDeclarationName);
  parentName.addEventListener("change", updateDeclarationName);
}

const classField = form.elements["Class Applying For"];
if (classField) {
  classField.addEventListener("change", updateAutomaticDetails);
}

const declarationCheckbox = form.elements["Declaration Accepted"];
if (declarationCheckbox) {
  declarationCheckbox.addEventListener("change", function () {
    const status = document.getElementById("declarationStatus");
    if (status) {
      status.textContent = this.checked
        ? "Accepted ✓"
        : "Pending confirmation";
    }
  });
}

function setupPreview(inputId, previewId, label) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(previewId);
  if (!input || !box) return;

  input.addEventListener("change", function () {
    box.innerHTML = "";
    const file = this.files[0];

    if (!file) {
      box.textContent = "No file selected";
      return;
    }

    const title = document.createElement("div");
    title.className = "selected-file";
    title.textContent = `${label} — Selected ✓`;
    box.appendChild(title);

    const name = document.createElement("small");
    name.textContent = file.name;
    box.appendChild(name);

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.className = "preview-image";
      img.alt = `${label} preview`;
      img.src = url;
      box.appendChild(img);
    } else if (file.type === "application/pdf") {
      const frame = document.createElement("iframe");
      frame.className = "preview-pdf";
      frame.title = `${label} preview`;
      frame.src = url;
      box.appendChild(frame);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-file";
    remove.textContent = "Remove / Choose Another";
    remove.addEventListener("click", () => {
      input.value = "";
      box.textContent = "No file selected";
    });
    box.appendChild(remove);
  });
}

setupPreview("childPhoto", "childPhotoPreview", "Child's Passport Photograph");
setupPreview("guardianPhoto", "guardianPhotoPreview", "Parent/Guardian Passport Photograph");
setupPreview("birthCertificate", "birthCertificatePreview", "Birth Certificate");
setupPreview("nhisCard", "nhisCardPreview", "NHIS Card");

document.getElementById("fillDemo")?.addEventListener("click", () => {
  const data = {
    "Child Full Name": "Ama Serwaa Mensah",
    "Date of Birth": "2018-06-14",
    "Father's Name": "Kwame Mensah",
    "Mother's Name": "Adwoa Mensah",
    "Guardian's Name": "Kwame Mensah",
    "Class Applying For": "KG 1",
    "Parent/Guardian Full Name": "Kwame Mensah",
    "Relationship to Child": "Father",
    "Parent/Guardian Contact": "024 000 0000"
  };

  Object.entries(data).forEach(([name, value]) => {
    const field = form.elements[name];
    if (field) field.value = value;
  });

  updateDeclarationName();
  updateAutomaticDetails();

  if (declarationCheckbox) {
    declarationCheckbox.checked = true;
    const status = document.getElementById("declarationStatus");
    if (status) status.textContent = "Accepted ✓";
  }
});

function syncPrintDocument() {
  const form = document.getElementById("admissionForm");
  if (!form) return;

  // FormSubmit applicant email:
  // The visible Parent/Guardian email field is the actual reserved "email"
  // field required by FormSubmit for applicant autoresponses.
  const applicantEmailField = document.getElementById("parentGuardianEmail");
  const replyToEmail = document.getElementById("replyToEmail");
  if (applicantEmailField) {
    const syncApplicantEmail = () => {
      if (replyToEmail) replyToEmail.value = applicantEmailField.value.trim();
    };
    applicantEmailField.addEventListener("input", syncApplicantEmail);
    applicantEmailField.addEventListener("change", syncApplicantEmail);
    form.addEventListener("submit", syncApplicantEmail, true);
  }

  const get = (name) => {
    const el = form.elements.namedItem(name);
    return el ? (el.value || "").trim() : "";
  };

  document.querySelectorAll("[data-print]").forEach((el) => {
    const key = el.getAttribute("data-print");
    let value = "";
    if (key === "applicationNumber") {
      value = document.getElementById("applicationNumber")?.textContent?.trim() || "";
    } else if (key === "applicationDate") {
      value = document.getElementById("applicationDateInput")?.value || "";
    } else if (key === "declarationDate") {
      value = document.getElementById("declarationDate")?.textContent?.trim() || "";
    } else if (key === "declarationStatus") {
      value = document.getElementById("declarationStatus")?.textContent?.trim() || "";
    } else {
      value = get(key);
    }
    el.textContent = value || "—";
  });

  const copyFilePreview = (inputId, targetId) => {
    const input = document.getElementById(inputId);
    const target = document.getElementById(targetId);
    if (!input || !target) return;
    target.innerHTML = "";
    const file = input.files && input.files[0];
    if (!file) {
      target.textContent = "No document selected";
      return;
    }
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      target.appendChild(img);
    } else if (file.type === "application/pdf") {
      const iframe = document.createElement("iframe");
      iframe.src = URL.createObjectURL(file);
      iframe.title = file.name;
      target.appendChild(iframe);
    } else {
      target.textContent = file.name;
    }
  };

  copyFilePreview("childPhoto", "printChildPhoto");
  copyFilePreview("guardianPhoto", "printGuardianPhoto");
  copyFilePreview("birthCertificate", "printBirthCertificate");
  copyFilePreview("nhisCard", "printNhisCard");
}

document.getElementById("previewBtn")?.addEventListener("click", () => {
  syncPrintDocument();
  setTimeout(() => window.print(), 100);
});

// Generate everything when the page opens.
updateAutomaticDetails();
updateDeclarationName();


/* FormSubmit + post-submit print preservation.
   The form must POST to FormSubmit, but the 4-page print document lives in this page.
   Before navigation we save a complete, populated copy in IndexedDB so the success
   page can restore the applicant's actual information and print the same 4 pages. */
(function () {
  const form = document.getElementById("admissionForm");
  if (!form) return;

  form.setAttribute("method", "POST");
  form.setAttribute("enctype", "multipart/form-data");

  const next = document.getElementById("formNext");
  const successUrl = new URL("submission-success.html", window.location.href).href;

  function openPrintDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open("afisapAdmissions", 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("printSnapshots")) {
          db.createObjectStore("printSnapshots");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  async function buildPrintSnapshot() {
    syncPrintDocument();

    const source = document.querySelector(".print-document");
    if (!source) throw new Error("Print document not found");

    const clone = source.cloneNode(true);

    const fileTargets = [
      ["childPhoto", "printChildPhoto"],
      ["guardianPhoto", "printGuardianPhoto"],
      ["birthCertificate", "printBirthCertificate"],
      ["nhisCard", "printNhisCard"]
    ];

    for (const [inputId, targetId] of fileTargets) {
      const input = document.getElementById(inputId);
      const target = clone.querySelector("#" + targetId);
      const file = input && input.files && input.files[0];

      if (!target || !file) continue;

      try {
        const dataUrl = await fileToDataURL(file);
        target.innerHTML = "";

        if (file.type.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = dataUrl;
          img.alt = file.name;
          target.appendChild(img);
        } else if (file.type === "application/pdf") {
          const iframe = document.createElement("iframe");
          iframe.src = dataUrl;
          iframe.title = file.name;
          target.appendChild(iframe);
        } else {
          target.textContent = file.name;
        }
      } catch (err) {
        target.textContent = file.name;
      }
    }

    return clone.outerHTML;
  }

  async function savePrintSnapshot(html) {
    const db = await openPrintDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("printSnapshots", "readwrite");
      tx.objectStore("printSnapshots").put({
        html,
        savedAt: Date.now()
      }, "latest");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (next) next.value = successUrl;

    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText = submitButton.textContent;
      if (submitButton.tagName === "BUTTON") submitButton.textContent = "Submitting…";
    }

    try {
      const snapshot = await buildPrintSnapshot();
      await savePrintSnapshot(snapshot);
    } catch (err) {
      console.warn("Could not save print snapshot; continuing with email submission.", err);
    }

    // Bypass the submit event after the snapshot is safely saved.
    HTMLFormElement.prototype.submit.call(form);
  });
})();
