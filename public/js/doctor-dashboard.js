import { apiFetch } from './api.js';

async function load() {
  const el = document.getElementById('queueView');
  const total = document.getElementById('totalPatients');
  const waitingCount = document.getElementById('waitingCount');
  const inProgressCount = document.getElementById('inProgressCount');

  try {
    const data = await apiFetch('/api/queues/status');
    const waiting = data.waiting || [];
    const inProgress = data.inProgress || [];
    const completed = data.completed || [];

    waitingCount.textContent = String(waiting.length);
    inProgressCount.textContent = String(inProgress.length);
    total.textContent = String(waiting.length + inProgress.length + (completed.length || 0));

    el.textContent = JSON.stringify({ waiting, inProgress, completed: (data.completed || []).slice(0, 8) }, null, 2);
  } catch (e) {
    el.textContent = `Error: ${e.message}`;
  }
}

document.getElementById('refreshBtn').addEventListener('click', load);
load();
setInterval(load, 5000);

