import { API_BASE_URL } from "./config.js";

async function request(path, method = "GET", body) {
  const options = { method };

  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error("Network error: could not reach the backend server.");
  }

  if (response.status === 204) {
    return null;
  }

  const rawText = await response.text();
  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!response.ok) {
        throw new Error(`Server returned an unexpected response (${response.status}).`);
      }
      throw new Error("Server returned invalid JSON instead of expected data.");
    }
  }

  if (!response.ok) {
    throw new Error((data && data.message) || `The request failed (${response.status}).`);
  }

  return data;
}

function cleanRecordPayload(record) {
  return {
    title: record.title,
    category: record.category,
    description: record.description,
    status: record.status,
  };
}

export const recordService = {
  list() {
    return request("/api/records");
  },

  get(id) {
    return request(`/api/records/${id}`);
  },

  create(record) {
    return request("/api/records", "POST", cleanRecordPayload(record));
  },

  update(id, record) {
    return request(`/api/records/${id}`, "PUT", cleanRecordPayload(record));
  },

  remove(id) {
    return request(`/api/records/${id}`, "DELETE");
  },
};