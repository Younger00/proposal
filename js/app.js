const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://YOUR-DEPLOYED-BACKEND-URL';

const RECORDS_URL = `${API_BASE}/api/records`;

const form = document.getElementById('proposal-form');
const formTitle = document.getElementById('form-title');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const statusInput = document.getElementById('status');
const saveButton = document.getElementById('save-button');
const cancelEditButton = document.getElementById('cancel-edit');
const formMessage = document.getElementById('form-message');

const searchInput = document.getElementById('search');
const filterStatus = document.getElementById('filter-status');
const recordCount = document.getElementById('record-count');
const listMessage = document.getElementById('list-message');
const recordList = document.getElementById('record-list');

const detailsDialog = document.getElementById('details-dialog');
const detailsContent = document.getElementById('details-content');
const closeDialogBtn = document.getElementById('close-dialog');
const doneDialogBtn = document.getElementById('done-dialog');

let records = [];
let editingId = null;

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.hidden = false;
  el.style.color = isError ? '#b91c1c' : '#15803d';
}

function hideMessage(el) {
  el.textContent = '';
  el.hidden = true;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resetFormState() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'New proposal';
  saveButton.textContent = 'Submit proposal';
  cancelEditButton.hidden = true;
}

function renderRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const statusFilter = filterStatus.value;

  const filtered = records.filter((rec) => {
    const matchesTitle = rec.title.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || rec.status === statusFilter;
    return matchesTitle && matchesStatus;
  });

  recordCount.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    recordList.innerHTML = '<p class="empty-state">No proposals match your filters.</p>';
    return;
  }

  recordList.innerHTML = filtered
    .map(
      (rec) => `
      <article class="record-card" data-id="${rec.id}">
        <div class="record-top">
          <span class="badge">${escapeHtml(rec.category)}</span>
          <span class="status">${escapeHtml(rec.status)}</span>
        </div>
        <h4>${escapeHtml(rec.title)}</h4>
        <div class="record-actions">
          <button type="button" class="button secondary" data-action="view" data-id="${rec.id}">View</button>
          <button type="button" class="button secondary" data-action="edit" data-id="${rec.id}">Edit</button>
          <button type="button" class="button secondary" data-action="delete" data-id="${rec.id}">Delete</button>
        </div>
      </article>
    `
    )
    .join('');
}

async function loadRecords() {
  hideMessage(listMessage);
  try {
    const res = await fetch(RECORDS_URL);
    if (!res.ok) throw new Error(`Failed to load records (${res.status})`);
    records = await res.json();
    renderRecords();
  } catch (err) {
    showMessage(listMessage, `Could not reach backend API: ${err.message}`, true);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage(formMessage);

  const title = titleInput.value.trim();
  const category = categoryInput.value.trim();
  const status = statusInput.value.trim() || 'Pending';

  if (title.length < 3) {
    showMessage(formMessage, 'Title must be at least 3 characters.', true);
    return;
  }
  if (!category) {
    showMessage(formMessage, 'Please select a category.', true);
    return;
  }

  try {
    const url = editingId ? `${RECORDS_URL}/${editingId}` : RECORDS_URL;
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, status }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

    showMessage(
      formMessage,
      editingId ? 'Proposal updated in database.' : 'Proposal submitted to database.'
    );
    resetFormState();
    await loadRecords();
  } catch (err) {
    showMessage(formMessage, err.message, true);
  }
});

cancelEditButton.addEventListener('click', () => {
  resetFormState();
  hideMessage(formMessage);
});

recordList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  const record = records.find((r) => r.id === id);
  if (!record) return;

  if (action === 'view') {
    const created = record.created_at
      ? new Date(record.created_at).toLocaleString()
      : 'N/A';
    detailsContent.innerHTML = `
      <p><strong>Title:</strong> ${escapeHtml(record.title)}</p>
      <p><strong>Category:</strong> ${escapeHtml(record.category)}</p>
      <p><strong>Status:</strong> ${escapeHtml(record.status)}</p>
      <p><strong>Created:</strong> ${escapeHtml(created)}</p>
    `;
    detailsDialog.showModal();
  }

  if (action === 'edit') {
    editingId = record.id;
    titleInput.value = record.title;
    categoryInput.value = record.category;
    if (descriptionInput) descriptionInput.value = record.description || 'Campus event proposal';
    statusInput.value = record.status;
    formTitle.textContent = `Edit proposal #${record.id}`;
    saveButton.textContent = 'Save changes';
    cancelEditButton.hidden = false;
    titleInput.focus();
  }

  if (action === 'delete') {
    try {
      const res = await fetch(`${RECORDS_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`);
      if (editingId === id) resetFormState();
      showMessage(listMessage, `Deleted "${record.title}".`);
      await loadRecords();
    } catch (err) {
      showMessage(listMessage, err.message, true);
    }
  }
});

searchInput.addEventListener('input', renderRecords);
filterStatus.addEventListener('change', renderRecords);

closeDialogBtn.addEventListener('click', () => detailsDialog.close());
doneDialogBtn.addEventListener('click', () => detailsDialog.close());

loadRecords();