import { apiFetch, getDisplayId } from './api.js';

async function load() {
  const el = document.getElementById('queueView');
  const eta = document.getElementById('eta');
  const myStatus = document.getElementById('myStatus');
  const queueNum = document.getElementById('queueNum');

  try {
    const displayId = getDisplayId();
    const data = await apiFetch(`/api/queues/status?displayId=${encodeURIComponent(displayId || '')}`);

    eta.textContent = data.etaMins !== null ? `${data.etaMins} min` : '—';

    // Scaffold: we don't compute exact status/queueNum yet
    myStatus.textContent = (data.waiting?.[0]?.status || data.inProgress?.[0]?.status || data.completed?.[0]?.status || '—');
    queueNum.textContent = data.waiting?.[0]?.queueNumber || data.inProgress?.[0]?.queueNumber || data.completed?.[0]?.queueNumber || '—';

    el.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    el.textContent = `Error: ${e.message}`;
  }
}

document.getElementById('refreshBtn').addEventListener('click', load);
load();
setInterval(load, 5000);

