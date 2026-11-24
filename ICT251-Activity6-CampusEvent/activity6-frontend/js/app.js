import { recordService } from "./data.js";

const form = document.querySelector("#proposal-form");
const formTitleHeading = document.querySelector("#form-title");
const titleInput = document.querySelector("#title");
const categoryInput = document.querySelector("#category");
const descriptionInput = document.querySelector("#description");
const statusInput = document.querySelector("#status");
const saveButton = document.querySelector("#save-button");
const cancelEditButton = document.querySelector("#cancel-edit");
const formMessage = document.querySelector("#form-message");

const recordCount = document.querySelector("#record-count");
const searchInput = document.querySelector("#search");
const filterStatusSelect = document.querySelector("#filter-status");
const listMessage = document.querySelector("#list-message");
const recordList = document.querySelector("#record-list");

const detailsDialog = document.querySelector("#details-dialog");
const detailsContent = document.querySelector("#details-content");
const closeDialogButton = document.querySelector("#close-dialog");
const doneDialogButton = document.querySelector("#done-dialog");

let records = [];
let editingId = null;

function setMessage(element, text, isError = false) {
  if (!element) return;
  if (!text) {
    element.textContent = "";
    element.hidden = true;
    element.dataset.type = "";
    return;
  }
  element.textContent = text;
  element.hidden = false;
  element.dataset.type = isError ? "error" : "info";
}

function setSaveButtonState(isSaving) {
  if (!saveButton) return;
  saveButton.disabled = isSaving;
  if (isSaving) {
    saveButton.textContent = editingId !== null ? "Saving..." : "Submitting...";
  } else {
    saveButton.textContent = editingId !== null ? "Save changes" : "Submit proposal";
  }
}

function resetFormState() {
  editingId = null;
  form.reset();
  if (statusInput) {
    statusInput.value = "Pending";
  }
  if (formTitleHeading) {
    formTitleHeading.textContent = "New proposal";
  }
  if (cancelEditButton) {
    cancelEditButton.hidden = true;
  }
  setSaveButtonState(false);
}

function validateInputs() {
  const title = titleInput.value.trim();
  const category = categoryInput.value.trim();
  const description = descriptionInput.value.trim();
  const status = statusInput.value.trim();

  if (title.length < 3 || title.length > 80) {
    setMessage(formMessage, "Title must be between 3 and 80 characters.", true);
    return null;
  }

  if (!category) {
    setMessage(formMessage, "Please select a category.", true);
    return null;
  }

  if (description.length < 5 || description.length > 300) {
    setMessage(formMessage, "Description must be between 5 and 300 characters.", true);
    return null;
  }

  if (!["Pending", "In progress", "Completed"].includes(status)) {
    setMessage(formMessage, "Status must be Pending, In progress, or Completed.", true);
    return null;
  }

  return { title, category, description, status };
}

function getFilteredRecords() {
  const query = (searchInput?.value || "").trim().toLowerCase();
  const selectedStatus = filterStatusSelect?.value || "";

  return records.filter((item) => {
    const matchesTitle =
      !query || String(item.title || "").toLowerCase().includes(query);
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    return matchesTitle && matchesStatus;
  });
}

function getStatusClass(status) {
  if (status === "In progress") return "status-in-progress";
  if (status === "Completed") return "status-completed";
  return "status-pending";
}

function renderList() {
  const filtered = getFilteredRecords();
  recordList.textContent = "";

  if (recordCount) {
    const suffix = filtered.length === 1 ? "result" : "results";
    recordCount.textContent = `${filtered.length} ${suffix}`;
  }

  if (filtered.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "loading-state";
    emptyText.style.animation = "none";
    emptyText.textContent = "No proposals match your current filter.";
    recordList.appendChild(emptyText);
    return;
  }

  filtered.forEach((record) => {
    const card = document.createElement("article");
    card.className = "record-card";

    const titleEl = document.createElement("h4");
    titleEl.textContent = record.title ?? "";

    const metaEl = document.createElement("div");
    metaEl.className = "record-meta";

    const categorySpan = document.createElement("span");
    categorySpan.textContent = record.category ?? "";

    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge ${getStatusClass(record.status)}`;
    statusBadge.textContent = record.status ?? "Pending";

    metaEl.append(categorySpan, statusBadge);

    const descEl = document.createElement("p");
    descEl.textContent = record.description ?? "";

    const actions = document.createElement("div");
    actions.className = "record-actions";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "button secondary";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", () => handleView(record.id));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "button secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(record));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "button secondary";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDelete(record));

    actions.append(viewBtn, editBtn, deleteBtn);
    card.append(titleEl, metaEl, descEl, actions);
    recordList.appendChild(card);
  });
}

async function fetchAndRenderRecords() {
  recordList.textContent = "";
  const loadingEl = document.createElement("p");
  loadingEl.className = "loading-state";
  loadingEl.textContent = "Loading records";
  recordList.appendChild(loadingEl);
  setMessage(listMessage, "");

  try {
    const data = await recordService.list();
    records = Array.isArray(data) ? data : [];
    renderList();
  } catch (error) {
    recordList.textContent = "";
    if (recordCount) {
      recordCount.textContent = "0 results";
    }
    setMessage(
      listMessage,
      error.message || "Unable to load records from the server.",
      true
    );
  }
}

async function handleView(id) {
  setMessage(listMessage, "");
  try {
    const record = await recordService.get(id);
    if (!detailsContent) return;

    detailsContent.textContent = "";

    const heading = document.createElement("h3");
    heading.textContent = record.title ?? "";

    const categoryLine = document.createElement("p");
    categoryLine.textContent = `Category: ${record.category ?? ""}`;

    const statusLine = document.createElement("p");
    statusLine.textContent = `Status: ${record.status ?? ""}`;

    const descLine = document.createElement("p");
    descLine.textContent = record.description ?? "";

    detailsContent.append(heading, categoryLine, statusLine, descLine);

    if (detailsDialog && typeof detailsDialog.showModal === "function") {
      detailsDialog.showModal();
    }
  } catch (error) {
    setMessage(
      listMessage,
      error.message || "Could not load record details.",
      true
    );
  }
}

function startEdit(record) {
  editingId = record.id;
  titleInput.value = record.title ?? "";
  categoryInput.value = record.category ?? "";
  descriptionInput.value = record.description ?? "";
  statusInput.value = record.status ?? "Pending";

  if (formTitleHeading) {
    formTitleHeading.textContent = `Edit proposal #${record.id}`;
  }
  if (cancelEditButton) {
    cancelEditButton.hidden = false;
  }
  setSaveButtonState(false);
  setMessage(formMessage, `Editing "${record.title ?? ""}".`);
  titleInput.focus();
}

async function handleDelete(record) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${record.title ?? "this proposal"}"?`
  );
  if (!confirmed) return;

  setMessage(listMessage, "");
  try {
    await recordService.remove(record.id);
    if (editingId === record.id) {
      resetFormState();
      setMessage(formMessage, "");
    }
    await fetchAndRenderRecords();
    setMessage(listMessage, "Proposal deleted.");
  } catch (error) {
    setMessage(
      listMessage,
      error.message || "Could not delete proposal.",
      true
    );
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(formMessage, "");

  const payload = validateInputs();
  if (!payload) return;

  setSaveButtonState(true);
  try {
    if (editingId !== null) {
      await recordService.update(editingId, payload);
      resetFormState();
      await fetchAndRenderRecords();
      setMessage(formMessage, "Proposal updated successfully.");
    } else {
      await recordService.create(payload);
      resetFormState();
      await fetchAndRenderRecords();
      setMessage(formMessage, "Proposal submitted successfully.");
    }
  } catch (error) {
    setMessage(
      formMessage,
      error.message || "Failed to save proposal. Please try again.",
      true
    );
  } finally {
    setSaveButtonState(false);
  }
});

if (cancelEditButton) {
  cancelEditButton.addEventListener("click", () => {
    resetFormState();
    setMessage(formMessage, "Edit cancelled.");
  });
}

if (searchInput) {
  searchInput.addEventListener("input", renderList);
}

if (filterStatusSelect) {
  filterStatusSelect.addEventListener("change", renderList);
}

if (closeDialogButton && detailsDialog) {
  closeDialogButton.addEventListener("click", () => detailsDialog.close());
}

if (doneDialogButton && detailsDialog) {
  doneDialogButton.addEventListener("click", () => detailsDialog.close());
}

fetchAndRenderRecords();