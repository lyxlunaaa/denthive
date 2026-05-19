import { apiFetch } from './api.js';

function byId(id) {
  return document.getElementById(id);
}

function setMsg(el, msg, kind) {
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? 'block' : 'none';
  if (kind === 'error') el.style.color = '#b91c1c';
  if (kind === 'success') el.style.color = 'inherit';
}

async function loadQueue() {
  const el = byId('queueView');
  if (!el) return;

  try {
    const data = await apiFetch('/api/queues/status');
    el.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    el.textContent = `Error: ${e.message}`;
  }
}

async function registerPatient(e) {
  e.preventDefault();
  const form = e.currentTarget;

  const regDisplayId = byId('regDisplayId');
  const regFullName = byId('regFullName');
  const regPhone = byId('regPhone');
  const regEmail = byId('regEmail');

  const errEl = byId('registerErr');
  const okEl = byId('registerSuccess');

  setMsg(errEl, '', 'error');
  setMsg(okEl, '', 'success');

  try {
    const payload = {
      displayId: regDisplayId.value,
      fullName: regFullName.value,
      phone: regPhone.value,
      email: regEmail.value
    };

    const data = await apiFetch('/api/patients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Backend returns { patient, tempPassword }
    setMsg(okEl, data?.tempPassword ? `Registered. Temp password: ${data.tempPassword}` : 'Registered successfully.', 'success');
    form.reset();
    await loadQueue();
  } catch (e2) {
    setMsg(errEl, e2.message || 'Registration failed', 'error');
  }
}

async function editPatient(e) {
  e.preventDefault();
  const form = e.currentTarget;

  const editPatientId = byId('editPatientId');
  const editFullName = byId('editFullName');
  const editPhone = byId('editPhone');
  const editEmail = byId('editEmail');

  const errEl = byId('editErr');
  const okEl = byId('editSuccess');

  setMsg(errEl, '', 'error');
  setMsg(okEl, '', 'success');

  try {
    const payload = {
      fullName: editFullName.value,
      phone: editPhone.value,
      email: editEmail.value
    };

    // Remove empty strings so backend keeps existing values
    for (const k of Object.keys(payload)) {
      if (payload[k] === undefined) continue;
      if (String(payload[k]).trim() === '') delete payload[k];
    }

    const data = await apiFetch(`/api/patients/${editPatientId.value}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    setMsg(okEl, data?.patient ? 'Patient updated successfully.' : 'Saved.', 'success');
    form.reset();
    await loadQueue();
  } catch (e2) {
    setMsg(errEl, e2.message || 'Update failed', 'error');
  }
}

async function enqueuePatient(e) {
  e.preventDefault();
  const form = e.currentTarget;

  const queuePatientId = byId('queuePatientId');
  const errEl = byId('queueErr');
  const okEl = byId('queueSuccess');

  setMsg(errEl, '', 'error');
  setMsg(okEl, '', 'success');

  try {
    const payload = { patientId: queuePatientId.value };
    const data = await apiFetch('/api/queues/enqueue', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setMsg(okEl, data?.queue ? `Enqueued. Queue #${data.queue.queueNumber}` : 'Enqueued successfully.', 'success');
    form.reset();
    await loadQueue();
  } catch (e2) {
    setMsg(errEl, e2.message || 'Enqueue failed', 'error');
  }
}

function wire() {
  const refreshBtn = byId('refreshBtn');
  const registerForm = byId('registerForm');
  const editForm = byId('editForm');
  const queueForm = byId('queueForm');

  if (refreshBtn) refreshBtn.addEventListener('click', loadQueue);
  if (registerForm) registerForm.addEventListener('submit', registerPatient);
  if (editForm) editForm.addEventListener('submit', editPatient);
  if (queueForm) queueForm.addEventListener('submit', enqueuePatient);

  loadQueue();
  setInterval(loadQueue, 5000);
}

wire();

