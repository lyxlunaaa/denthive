import { apiFetch } from './api.js';

async function load() {
  const el = document.getElementById('queueView');
  try {
    const data = await apiFetch('/api/queues/status');
    el.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    el.textContent = `Error: ${e.message}`;
  }
}

document.getElementById('refreshBtn').addEventListener('click', load);
load();
setInterval(load, 5000);

