"use strict";

/*
  RESUME BUILDER — simple version
  --------------------------------
  This file is written so that each feature (skills, education, experience,
  projects, certificates) has its own small, obvious set of functions:

      addX()     -> reads the form, checks it, pushes it into an array
      renderX()  -> redraws the list on the screen from that array
      editX()    -> puts an existing item back into the form so it can change
      deleteX()  -> removes an item from the array

  It repeats the same pattern five times instead of building one "clever"
  reusable system. That repetition is on purpose — it means you can read
  just ONE section (say, Education) top to bottom and understand the whole
  pattern, then recognize it everywhere else.
*/

/* ============================================================
   1. SMALL HELPER FUNCTIONS
   These are used everywhere below, so we define them first.
   ============================================================ */

// Shortcut for document.getElementById, just to save typing.
function $(id) {
  return document.getElementById(id);
}

// Turns text like  <script>  into  &lt;script&gt;
// We MUST do this before putting any user-typed text into innerHTML,
// otherwise someone could type HTML/JavaScript into a form field and
// have it run on the page. This is called an "XSS" security bug.
function escapeHTML(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Turns "2024-05" (what an <input type="month"> gives us) into "May 2024".
function formatMonthYear(value) {
  if (!value) return "";
  const parts = value.split("-"); // ["2024", "05"]
  const year = parts[0];
  const month = parts[1];
  if (!year || !month) return value;

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthName = monthNames[Number(month) - 1] || month;
  return monthName + " " + year;
}

// Shows a little pop-up message in the corner instead of a blocking alert().
function showToast(message, type) {
  // type is "success", "error", or left blank for a plain message
  const box = document.createElement("div");
  box.className = "toast " + (type || "");
  box.textContent = message;

  $("toastContainer").appendChild(box);

  // Remove the toast after a few seconds so they don't pile up.
  setTimeout(function () {
    box.remove();
  }, 3200);
}

// Adds a red outline to a field for a second, so the user notices
// which field the error message is talking about.
function flashInvalid(inputEl) {
  inputEl.classList.add("field-invalid");
  inputEl.addEventListener(
    "input",
    function () {
      inputEl.classList.remove("field-invalid");
    },
    { once: true }
  );
}

/* Runs everything after the page's HTML has fully loaded. */
document.addEventListener("DOMContentLoaded", function () {
  /* ============================================================
     2. GRAB ALL THE ELEMENTS WE NEED, ONCE, AT THE TOP
     ============================================================ */

  // Personal info inputs
  const nameInput = $("name");
  const jobTitleInput = $("jobTitle");
  const phoneInput = $("phone");
  const emailInput = $("email");
  const linkedinInput = $("linkedin");
  const githubInput = $("github");
  const locationInput = $("location");
  const summaryInput = $("summary");
  const summaryCount = $("summaryCount");

  // Template switcher
  const templateSwitcher = $("templateSwitcher");
  const templateCards = Array.from(templateSwitcher.querySelectorAll(".template-card"));
  let selectedTemplate = "template1";

  // Skills
  const skillInput = $("skill");
  const skillAddBtn = $("skill-btn");
  const skillListEl = $("skillList");
  const skillCount = $("skillCount");

  // Education
  const degreeInput = $("degree");
  const instituteInput = $("institute");
  const startYearInput = $("startYear");
  const endYearInput = $("endYear");
  const cgpaInput = $("cgpa");
  const educationAddBtn = $("education-btn");
  const educationCancelBtn = $("education-cancel");
  const educationListEl = $("educationList");
  const educationCount = $("educationCount");

  // Experience
  const companyNameInput = $("companyName");
  const jobRoleInput = $("jobRole");
  const startDateInput = $("startDate");
  const endDateInput = $("endDate");
  const currentJobInput = $("currentJob");
  const workDescriptionsInput = $("workDescriptions");
  const experienceAddBtn = $("experience-btn");
  const experienceCancelBtn = $("experience-cancel");
  const experienceListEl = $("experienceList");
  const experienceCount = $("experienceCount");

  // Projects
  const projectNameInput = $("projectName");
  const technologiesInput = $("technologies");
  const projectDescriptionInput = $("projectDescription");
  const gitLinkInput = $("gitLink");
  const projectAddBtn = $("project-btn");
  const projectCancelBtn = $("project-cancel");
  const projectListEl = $("projectList");
  const projectCount = $("projectCount");

  // Certificates
  const certificateNameInput = $("certificateName");
  const issuedByInput = $("issuedBy");
  const issuedDateInput = $("issuedDate");
  const certificateAddBtn = $("certificate-btn");
  const certificateCancelBtn = $("certificate-cancel");
  const certificateListEl = $("certificateList");
  const certificateCount = $("certificateCount");

  // Preview + top-level buttons
  const previewContainer = $("previewContainer");
  const resumeForm = $("resumeForm");
  const updatePreviewBtn = $("updatePreview-btn");
  const saveResumeBtn = $("saveResume-btn");
  const resetFormBtn = $("resetForm-btn");
  const downloadResumeBtn = $("downloadResume-btn");
  const themeToggleBtn = $("themeToggle");

  /* ============================================================
     3. DATA
     One array per repeatable section. Each item is a plain object.
     The "EditIndex" variables track which item (if any) is currently
     being edited: -1 means "not editing, we're adding a new one".
     ============================================================ */

  let skills = [];

  let educations = [];
  let educationEditIndex = -1;

  let experiences = [];
  let experienceEditIndex = -1;

  let projects = [];
  let projectEditIndex = -1;

  let certificates = [];
  let certificateEditIndex = -1;

  /* ============================================================
     4. PERSONAL INFO


  function getPersonalInfo() {
    return {
      name: nameInput.value.trim(),
      jobTitle: jobTitleInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      linkedin: linkedinInput.value.trim(),
      github: githubInput.value.trim(),
      location: locationInput.value.trim(),
      summary: summaryInput.value.trim(),
    };
  }

  function setPersonalInfo(data) {
    data = data || {};
    nameInput.value = data.name || "";
    jobTitleInput.value = data.jobTitle || "";
    phoneInput.value = data.phone || "";
    emailInput.value = data.email || "";
    linkedinInput.value = data.linkedin || "";
    githubInput.value = data.github || "";
    locationInput.value = data.location || "";
    summaryInput.value = data.summary || "";
    summaryCount.textContent = summaryInput.value.length;
  }

  // Every personal-info field updates the preview as soon as you type.
  const personalInputs = [
    nameInput, jobTitleInput, phoneInput, emailInput,
    linkedinInput, githubInput, locationInput, summaryInput,
  ];
  personalInputs.forEach(function (input) {
    input.addEventListener("input", function () {
      summaryCount.textContent = summaryInput.value.length;
      afterChange();
    });
  });

  /* ============================================================
     5. TEMPLATE SWITCHER
     ============================================================ */

  templateSwitcher.addEventListener("click", function (event) {
    const card = event.target.closest(".template-card");
    if (!card) return;

    templateCards.forEach(function (c) {
      c.classList.remove("active");
    });
    card.classList.add("active");
    selectedTemplate = card.dataset.template;

    afterChange();
  });

  function setSelectedTemplate(name) {
    selectedTemplate = name || "template1";
    templateCards.forEach(function (card) {
      const isActive = card.dataset.template === selectedTemplate;
      card.classList.toggle("active", isActive);
    });
  }


    //  SKILLS
    //  Skills are just plain text, so this section is the simplest —
    //  no "edit", just add and remove.
  function renderSkills() {
    skillCount.textContent = skills.length;

    if (skills.length === 0) {
      skillListEl.innerHTML = '<p class="empty-hint">No skills added yet.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      html +=
        '<span class="chip" data-index="' + i + '">' +
        escapeHTML(skill) +
        '<button type="button" data-action="delete-skill" aria-label="Remove ' + escapeHTML(skill) + '">✕</button>' +
        "</span>";
    }
    skillListEl.innerHTML = html;
  }

  function addSkill() {
    const value = skillInput.value.trim();
    if (!value) {
      flashInvalid(skillInput);
      showToast("Type a skill before adding it.", "error");
      return;
    }
    skills.push(value);
    skillInput.value = "";
    renderSkills();
    afterChange();
  }

  skillAddBtn.addEventListener("click", addSkill);

  // Pressing Enter in the skill box also adds it.
  skillInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  });

  // Clicking the ✕ on a chip removes that skill.
  skillListEl.addEventListener("click", function (event) {
    const button = event.target.closest('[data-action="delete-skill"]');
    if (!button) return;

    const chip = button.closest(".chip");
    const index = Number(chip.dataset.index);
    skills.splice(index, 1);

    renderSkills();
    afterChange();
  });


// EDUCATION
  function renderEducationList() {
    educationCount.textContent = educations.length;

    if (educations.length === 0) {
      educationListEl.innerHTML = '<p class="empty-hint">No education added yet.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < educations.length; i++) {
      const item = educations[i];
      html +=
        '<div class="item-card" data-index="' + i + '">' +
          '<div class="item-body">' +
            "<h4>" + escapeHTML(item.degree) + "</h4>" +
            "<p>" + escapeHTML(item.institute) + "</p>" +
            "<p>" + escapeHTML(item.startYear) + "–" + escapeHTML(item.endYear) +
              " · CGPA " + escapeHTML(item.cgpa) + "</p>" +
          "</div>" +
          '<div class="item-actions">' +
            '<button type="button" data-action="edit">Edit</button>' +
            '<button type="button" class="danger" data-action="delete">Remove</button>' +
          "</div>" +
        "</div>";
    }
    educationListEl.innerHTML = html;
  }

  function clearEducationForm() {
    degreeInput.value = "";
    instituteInput.value = "";
    startYearInput.value = "";
    endYearInput.value = "";
    cgpaInput.value = "";
  }

  function addOrUpdateEducation() {
    const degree = degreeInput.value.trim();
    const institute = instituteInput.value.trim();
    const startYear = startYearInput.value.trim();
    const endYear = endYearInput.value.trim();
    const cgpa = cgpaInput.value.trim();

    if (!degree || !institute || !startYear || !endYear || !cgpa) {
      showToast("Fill in every education field before adding.", "error");
      return;
    }
    if (Number(startYear) > Number(endYear)) {
      flashInvalid(startYearInput);
      flashInvalid(endYearInput);
      showToast("Start year can't be after end year.", "error");
      return;
    }

    const education = { degree, institute, startYear, endYear, cgpa };

    if (educationEditIndex === -1) {
      educations.push(education);
    } else {
      educations[educationEditIndex] = education;
      educationEditIndex = -1;
      educationAddBtn.textContent = "Add education";
      educationCancelBtn.hidden = true;
    }

    clearEducationForm();
    renderEducationList();
    afterChange();
  }

  function editEducation(index) {
    const item = educations[index];
    degreeInput.value = item.degree;
    instituteInput.value = item.institute;
    startYearInput.value = item.startYear;
    endYearInput.value = item.endYear;
    cgpaInput.value = item.cgpa;

    educationEditIndex = index;
    educationAddBtn.textContent = "Update education";
    educationCancelBtn.hidden = false;
  }

  function deleteEducation(index) {
    educations.splice(index, 1);
    if (educationEditIndex === index) {
      educationEditIndex = -1;
      clearEducationForm();
      educationAddBtn.textContent = "Add education";
      educationCancelBtn.hidden = true;
    }
    renderEducationList();
    afterChange();
  }

  educationAddBtn.addEventListener("click", addOrUpdateEducation);

  educationCancelBtn.addEventListener("click", function () {
    educationEditIndex = -1;
    clearEducationForm();
    educationAddBtn.textContent = "Add education";
    educationCancelBtn.hidden = true;
  });

  educationListEl.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = Number(button.closest(".item-card").dataset.index);

    if (button.dataset.action === "edit") editEducation(index);
    if (button.dataset.action === "delete") deleteEducation(index);
  });


    //  EXPERIENCE
  currentJobInput.addEventListener("change", function () {
    endDateInput.disabled = currentJobInput.checked;
    if (currentJobInput.checked) endDateInput.value = "";
  });

  function renderExperienceList() {
    experienceCount.textContent = experiences.length;

    if (experiences.length === 0) {
      experienceListEl.innerHTML = '<p class="empty-hint">No experience added yet.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < experiences.length; i++) {
      const item = experiences[i];
      const endLabel = item.current ? "Present" : formatMonthYear(item.endDate);
      html +=
        '<div class="item-card" data-index="' + i + '">' +
          '<div class="item-body">' +
            "<h4>" + escapeHTML(item.jobRole) + "</h4>" +
            "<p>" + escapeHTML(item.companyName) + "</p>" +
            "<p>" + formatMonthYear(item.startDate) + " – " + endLabel + "</p>" +
          "</div>" +
          '<div class="item-actions">' +
            '<button type="button" data-action="edit">Edit</button>' +
            '<button type="button" class="danger" data-action="delete">Remove</button>' +
          "</div>" +
        "</div>";
    }
    experienceListEl.innerHTML = html;
  }

  function clearExperienceForm() {
    companyNameInput.value = "";
    jobRoleInput.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    endDateInput.disabled = false;
    currentJobInput.checked = false;
    workDescriptionsInput.value = "";
  }

  function addOrUpdateExperience() {
    const companyName = companyNameInput.value.trim();
    const jobRole = jobRoleInput.value.trim();
    const startDate = startDateInput.value;
    const current = currentJobInput.checked;
    const endDate = current ? "" : endDateInput.value;
    const workDescriptions = workDescriptionsInput.value.trim();

    if (!companyName || !jobRole || !startDate || !workDescriptions || (!current && !endDate)) {
      showToast("Fill in every experience field before adding.", "error");
      return;
    }

    const experience = { companyName, jobRole, startDate, endDate, workDescriptions, current };

    if (experienceEditIndex === -1) {
      experiences.push(experience);
    } else {
      experiences[experienceEditIndex] = experience;
      experienceEditIndex = -1;
      experienceAddBtn.textContent = "Add experience";
      experienceCancelBtn.hidden = true;
    }

    clearExperienceForm();
    renderExperienceList();
    afterChange();
  }

  function editExperience(index) {
    const item = experiences[index];
    companyNameInput.value = item.companyName;
    jobRoleInput.value = item.jobRole;
    startDateInput.value = item.startDate;
    currentJobInput.checked = item.current;
    endDateInput.disabled = item.current;
    endDateInput.value = item.current ? "" : item.endDate;
    workDescriptionsInput.value = item.workDescriptions;

    experienceEditIndex = index;
    experienceAddBtn.textContent = "Update experience";
    experienceCancelBtn.hidden = false;
  }

  function deleteExperience(index) {
    experiences.splice(index, 1);
    if (experienceEditIndex === index) {
      experienceEditIndex = -1;
      clearExperienceForm();
      experienceAddBtn.textContent = "Add experience";
      experienceCancelBtn.hidden = true;
    }
    renderExperienceList();
    afterChange();
  }

  experienceAddBtn.addEventListener("click", addOrUpdateExperience);

  experienceCancelBtn.addEventListener("click", function () {
    experienceEditIndex = -1;
    clearExperienceForm();
    experienceAddBtn.textContent = "Add experience";
    experienceCancelBtn.hidden = true;
  });

  experienceListEl.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = Number(button.closest(".item-card").dataset.index);

    if (button.dataset.action === "edit") editExperience(index);
    if (button.dataset.action === "delete") deleteExperience(index);
  });


    // PROJECTS
  function renderProjectList() {
    projectCount.textContent = projects.length;

    if (projects.length === 0) {
      projectListEl.innerHTML = '<p class="empty-hint">No projects added yet.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < projects.length; i++) {
      const item = projects[i];
      html +=
        '<div class="item-card" data-index="' + i + '">' +
          '<div class="item-body">' +
            "<h4>" + escapeHTML(item.projectName) + "</h4>" +
            "<p><strong>Tech:</strong> " + escapeHTML(item.technologies) + "</p>" +
            (item.gitLink
              ? '<a href="' + escapeHTML(item.gitLink) + '" target="_blank" rel="noopener noreferrer">' +
                escapeHTML(item.gitLink) + "</a>"
              : "") +
          "</div>" +
          '<div class="item-actions">' +
            '<button type="button" data-action="edit">Edit</button>' +
            '<button type="button" class="danger" data-action="delete">Remove</button>' +
          "</div>" +
        "</div>";
    }
    projectListEl.innerHTML = html;
  }

  function clearProjectForm() {
    projectNameInput.value = "";
    technologiesInput.value = "";
    projectDescriptionInput.value = "";
    gitLinkInput.value = "";
  }

  function addOrUpdateProject() {
    const projectName = projectNameInput.value.trim();
    const technologies = technologiesInput.value.trim();
    const projectDescription = projectDescriptionInput.value.trim();
    const gitLink = gitLinkInput.value.trim();

    if (!projectName || !technologies || !projectDescription) {
      showToast("Fill in the project name, technologies, and description.", "error");
      return;
    }

    const project = { projectName, technologies, projectDescription, gitLink };

    if (projectEditIndex === -1) {
      projects.push(project);
    } else {
      projects[projectEditIndex] = project;
      projectEditIndex = -1;
      projectAddBtn.textContent = "Add project";
      projectCancelBtn.hidden = true;
    }

    clearProjectForm();
    renderProjectList();
    afterChange();
  }

  function editProject(index) {
    const item = projects[index];
    projectNameInput.value = item.projectName;
    technologiesInput.value = item.technologies;
    projectDescriptionInput.value = item.projectDescription;
    gitLinkInput.value = item.gitLink;

    projectEditIndex = index;
    projectAddBtn.textContent = "Update project";
    projectCancelBtn.hidden = false;
  }

  function deleteProject(index) {
    projects.splice(index, 1);
    if (projectEditIndex === index) {
      projectEditIndex = -1;
      clearProjectForm();
      projectAddBtn.textContent = "Add project";
      projectCancelBtn.hidden = true;
    }
    renderProjectList();
    afterChange();
  }

  projectAddBtn.addEventListener("click", addOrUpdateProject);

  projectCancelBtn.addEventListener("click", function () {
    projectEditIndex = -1;
    clearProjectForm();
    projectAddBtn.textContent = "Add project";
    projectCancelBtn.hidden = true;
  });

  projectListEl.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = Number(button.closest(".item-card").dataset.index);

    if (button.dataset.action === "edit") editProject(index);
    if (button.dataset.action === "delete") deleteProject(index);
  });

    // CERTIFICATES
  function renderCertificateList() {
    certificateCount.textContent = certificates.length;

    if (certificates.length === 0) {
      certificateListEl.innerHTML = '<p class="empty-hint">No certificates added yet.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < certificates.length; i++) {
      const item = certificates[i];
      html +=
        '<div class="item-card" data-index="' + i + '">' +
          '<div class="item-body">' +
            "<h4>" + escapeHTML(item.certificateName) + "</h4>" +
            "<p>" + escapeHTML(item.issuedBy) + " · " + formatMonthYear(item.issuedDate) + "</p>" +
          "</div>" +
          '<div class="item-actions">' +
            '<button type="button" data-action="edit">Edit</button>' +
            '<button type="button" class="danger" data-action="delete">Remove</button>' +
          "</div>" +
        "</div>";
    }
    certificateListEl.innerHTML = html;
  }

  function clearCertificateForm() {
    certificateNameInput.value = "";
    issuedByInput.value = "";
    issuedDateInput.value = "";
  }

  function addOrUpdateCertificate() {
    const certificateName = certificateNameInput.value.trim();
    const issuedBy = issuedByInput.value.trim();
    const issuedDate = issuedDateInput.value;

    if (!certificateName || !issuedBy || !issuedDate) {
      showToast("Fill in every certificate field before adding.", "error");
      return;
    }

    const certificate = { certificateName, issuedBy, issuedDate };

    if (certificateEditIndex === -1) {
      certificates.push(certificate);
    } else {
      certificates[certificateEditIndex] = certificate;
      certificateEditIndex = -1;
      certificateAddBtn.textContent = "Add certificate";
      certificateCancelBtn.hidden = true;
    }

    clearCertificateForm();
    renderCertificateList();
    afterChange();
  }

  function editCertificate(index) {
    const item = certificates[index];
    certificateNameInput.value = item.certificateName;
    issuedByInput.value = item.issuedBy;
    issuedDateInput.value = item.issuedDate;

    certificateEditIndex = index;
    certificateAddBtn.textContent = "Update certificate";
    certificateCancelBtn.hidden = false;
  }

  function deleteCertificate(index) {
    certificates.splice(index, 1);
    if (certificateEditIndex === index) {
      certificateEditIndex = -1;
      clearCertificateForm();
      certificateAddBtn.textContent = "Add certificate";
      certificateCancelBtn.hidden = true;
    }
    renderCertificateList();
    afterChange();
  }

  certificateAddBtn.addEventListener("click", addOrUpdateCertificate);

  certificateCancelBtn.addEventListener("click", function () {
    certificateEditIndex = -1;
    clearCertificateForm();
    certificateAddBtn.textContent = "Add certificate";
    certificateCancelBtn.hidden = true;
  });

  certificateListEl.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = Number(button.closest(".item-card").dataset.index);

    if (button.dataset.action === "edit") editCertificate(index);
    if (button.dataset.action === "delete") deleteCertificate(index);
  });


    // BUILDING THE RESUME PREVIEW
    // Small helper functions build one section of HTML each, and
    // generateResume() glues them together. Every value coming from
    // the user goes through escapeHTML() first.

  function buildSkillsHTML() {
    if (skills.length === 0) return "";
    let chips = "";
    for (let i = 0; i < skills.length; i++) {
      chips += "<span>" + escapeHTML(skills[i]) + "</span>";
    }
    return "<section><h2>Skills</h2><div class='skills-row'>" + chips + "</div></section>";
  }

  function buildEducationHTML() {
    if (educations.length === 0) return "";
    let items = "";
    for (let i = 0; i < educations.length; i++) {
      const e = educations[i];
      items +=
        "<div class='entry'>" +
          "<div class='entry-title'>" + escapeHTML(e.degree) + "</div>" +
          "<div class='entry-sub'>" + escapeHTML(e.institute) + "</div>" +
          "<div class='entry-meta'>" + escapeHTML(e.startYear) + " – " + escapeHTML(e.endYear) +
            " · CGPA " + escapeHTML(e.cgpa) + "</div>" +
        "</div>";
    }
    return "<section><h2>Education</h2>" + items + "</section>";
  }

  function buildExperienceHTML() {
    if (experiences.length === 0) return "";
    let items = "";
    for (let i = 0; i < experiences.length; i++) {
      const e = experiences[i];
      const endLabel = e.current ? "Present" : formatMonthYear(e.endDate);
      items +=
        "<div class='entry'>" +
          "<div class='entry-title'>" + escapeHTML(e.jobRole) + "</div>" +
          "<div class='entry-sub'>" + escapeHTML(e.companyName) + "</div>" +
          "<div class='entry-meta'>" + formatMonthYear(e.startDate) + " – " + endLabel + "</div>" +
          "<div class='entry-desc'>" + escapeHTML(e.workDescriptions) + "</div>" +
        "</div>";
    }
    return "<section><h2>Experience</h2>" + items + "</section>";
  }

  function buildProjectsHTML() {
    if (projects.length === 0) return "";
    let items = "";
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      items +=
        "<div class='entry'>" +
          "<div class='entry-title'>" + escapeHTML(p.projectName) + "</div>" +
          "<div class='entry-sub'>" + escapeHTML(p.technologies) + "</div>" +
          "<div class='entry-desc'>" + escapeHTML(p.projectDescription) + "</div>" +
          (p.gitLink
            ? "<a class='entry-link' href='" + escapeHTML(p.gitLink) + "' target='_blank' rel='noopener noreferrer'>" +
              escapeHTML(p.gitLink) + "</a>"
            : "") +
        "</div>";
    }
    return "<section><h2>Projects</h2>" + items + "</section>";
  }

  function buildCertificatesHTML() {
    if (certificates.length === 0) return "";
    let items = "";
    for (let i = 0; i < certificates.length; i++) {
      const c = certificates[i];
      items +=
        "<div class='entry'>" +
          "<div class='entry-title'>" + escapeHTML(c.certificateName) + "</div>" +
          "<div class='entry-meta'>" + escapeHTML(c.issuedBy) + " · " + formatMonthYear(c.issuedDate) + "</div>" +
        "</div>";
    }
    return "<section><h2>Certificates</h2>" + items + "</section>";
  }

  function buildContactLinesHTML(personal) {
    const contactParts = [personal.phone, personal.email, personal.location].filter(Boolean);
    const linkParts = [personal.linkedin, personal.github].filter(Boolean);

    let html = "<p class='contact-line'>" + contactParts.map(escapeHTML).join(" · ") + "</p>";
    if (linkParts.length > 0) {
      html += "<p class='contact-line'>" + linkParts.map(escapeHTML).join(" · ") + "</p>";
    }
    return html;
  }

  function buildTemplate1(personal) {
    return (
      "<div class='resume template1'>" +
        "<div class='resume-header'>" +
          "<h1>" + (escapeHTML(personal.name) || "Your Name") + "</h1>" +
          (personal.jobTitle ? "<h3 class='role'>" + escapeHTML(personal.jobTitle) + "</h3>" : "") +
          buildContactLinesHTML(personal) +
        "</div>" +
        (personal.summary
          ? "<section><h2>Summary</h2><p class='entry-desc'>" + escapeHTML(personal.summary) + "</p></section>"
          : "") +
        buildSkillsHTML() +
        buildEducationHTML() +
        buildExperienceHTML() +
        buildProjectsHTML() +
        buildCertificatesHTML() +
      "</div>"
    );
  }

  function buildTemplate2(personal) {
    const sideContact = [personal.phone, personal.email, personal.location, personal.linkedin, personal.github]
      .filter(Boolean)
      .map(function (value) {
        return "<div>" + escapeHTML(value) + "</div>";
      })
      .join("");

    return (
      "<div class='resume template2'>" +
        "<div class='t2-side'>" +
          "<h1>" + (escapeHTML(personal.name) || "Your Name") + "</h1>" +
          (personal.jobTitle ? "<h3 class='role'>" + escapeHTML(personal.jobTitle) + "</h3>" : "") +
          "<div class='contact-line'>" + sideContact + "</div>" +
          buildSkillsHTML() +
        "</div>" +
        "<div class='t2-main'>" +
          (personal.summary
            ? "<section><h2>Profile</h2><p class='entry-desc'>" + escapeHTML(personal.summary) + "</p></section>"
            : "") +
          buildEducationHTML() +
          buildExperienceHTML() +
          buildProjectsHTML() +
          buildCertificatesHTML() +
        "</div>" +
      "</div>"
    );
  }

  function isEverythingEmpty(personal) {
    const personalHasSomething = Object.values(personal).some(Boolean);
    return (
      !personalHasSomething &&
      skills.length === 0 &&
      educations.length === 0 &&
      experiences.length === 0 &&
      projects.length === 0 &&
      certificates.length === 0
    );
  }

  function generateResume() {
    const personal = getPersonalInfo();

    if (isEverythingEmpty(personal)) {
      previewContainer.innerHTML =
        "<div class='preview-placeholder'>" +
          "<strong>Your resume preview appears here</strong>" +
          "Fill in your details on the left — the preview updates automatically as you type." +
        "</div>";
      return;
    }

    if (selectedTemplate === "template2") {
      previewContainer.innerHTML = buildTemplate2(personal);
    } else {
      previewContainer.innerHTML = buildTemplate1(personal);
    }
  }


//   SAVING TO THE BROWSER (localStorage)

  const STORAGE_KEY = "resumeBuilderData";
  const THEME_KEY = "resumeBuilderTheme";
  const saveStatus = $("saveStatus");

  function buildSnapshot() {
    return {
      personal: getPersonalInfo(),
      skills: skills,
      educations: educations,
      experiences: experiences,
      projects: projects,
      certificates: certificates,
      template: selectedTemplate,
    };
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSnapshot()));
    if (saveStatus) {
      saveStatus.textContent = "Saved just now";
      saveStatus.classList.add("is-fresh");
      setTimeout(function () {
        saveStatus.classList.remove("is-fresh");
      }, 1500);
    }
  }

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let data;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.warn("Saved resume data was corrupted, ignoring it.", error);
      return;
    }

    setPersonalInfo(data.personal);
    skills = data.skills || [];
    educations = data.educations || [];
    experiences = data.experiences || [];
    projects = data.projects || [];
    certificates = data.certificates || [];
    setSelectedTemplate(data.template);

    renderSkills();
    renderEducationList();
    renderExperienceList();
    renderProjectList();
    renderCertificateList();
    generateResume();
  }

  
  function afterChange() {
    generateResume();
    saveToStorage();
  }


    // TOP-LEVEL BUTTONS: update preview, save, reset, download

  updatePreviewBtn.addEventListener("click", function () {
    generateResume();
    showToast("Preview updated.", "success");
  });

  saveResumeBtn.addEventListener("click", function () {
    saveToStorage();
    showToast("Resume saved to this browser.", "success");
  });

  resetFormBtn.addEventListener("click", function () {
    const confirmed = confirm("Clear the whole form? This can't be undone.");
    if (!confirmed) return;

    resumeForm.reset();

    skills = [];
    educations = [];
    educationEditIndex = -1;
    experiences = [];
    experienceEditIndex = -1;
    projects = [];
    projectEditIndex = -1;
    certificates = [];
    certificateEditIndex = -1;
    endDateInput.disabled = false;

    renderSkills();
    renderEducationList();
    renderExperienceList();
    renderProjectList();
    renderCertificateList();

    summaryCount.textContent = 0;

    localStorage.removeItem(STORAGE_KEY);
    generateResume();
    showToast("Form cleared.", "info");
  });

  downloadResumeBtn.addEventListener("click", function () {
    const resumeElement = document.querySelector(".resume");
    if (!resumeElement) {
      showToast("Add some details and generate a preview first.", "error");
      return;
    }

    const originalLabel = downloadResumeBtn.textContent;
    downloadResumeBtn.textContent = "Preparing PDF…";
    downloadResumeBtn.disabled = true;

    const fileName = (nameInput.value.trim().replace(/\s+/g, "_") || "Resume") + ".pdf";

    const options = {
      margin: 0.5,
      filename: fileName,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3, scrollY: 0, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(options)
      .from(resumeElement)
      .save()
      .then(function () {
        showToast("PDF downloaded.", "success");
      })
      .catch(function () {
        showToast("Something went wrong generating the PDF.", "error");
      })
      .finally(function () {
        downloadResumeBtn.textContent = originalLabel;
        downloadResumeBtn.disabled = false;
      });
  });


    // DARK MODE
  function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    themeToggleBtn.querySelector(".label").textContent = isDark ? "Light mode" : "Dark mode";
  }

  themeToggleBtn.addEventListener("click", function () {
    const isDark = !document.body.classList.contains("dark");
    applyTheme(isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  });

  applyTheme(localStorage.getItem(THEME_KEY) === "dark");


    // START UP


  renderSkills();
  loadFromStorage();
});