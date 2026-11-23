const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://YOUR-DEPLOYED-BACKEND-URL';

const RECORDS_URL = `${API_BASE}/api/records`;

async function fetchRecords() {
  const res = await fetch(RECORDS_URL);
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  return res.json();
}

async function createRecord(payload) {
  const res = await fetch(RECORDS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST failed: ${res.status}`);
  return res.json();
}

async function updateRecord(id, payload) {
  const res = await fetch(`${RECORDS_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
  return res.json();
}

async function deleteRecord(id) {
  const res = await fetch(`${RECORDS_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
  return res.json();
}