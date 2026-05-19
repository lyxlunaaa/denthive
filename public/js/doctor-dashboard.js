import { apiFetch } from './api.js';

let activePatient = null;
let selectedProcedures = [];
let toothStates = {}; // Stores status of each tooth for the active patient

async function load() {
  const total = document.getElementById('totalPatients');
  const waitingCount = document.getElementById('waitingCount');
  const inProgressCount = document.getElementById('inProgressCount');
  const queueContainer = document.getElementById('queueView');

  try {
    const data = await apiFetch('/api/queues/status');
    const waiting = data.waiting || [];
    const inProgress = data.inProgress || [];
    const completed = data.completed || [];

    waitingCount.textContent = String(waiting.length);
    inProgressCount.textContent = String(inProgress.length);
    total.textContent = String(waiting.length + inProgress.length + completed.length);

    // Render Queue
    queueContainer.innerHTML = '';
    const all = [...inProgress.map(p => ({...p, status: 'in-progress'})), ...waiting.map(p => ({...p, status: 'waiting'}))];
    
    if(all.length === 0) queueContainer.innerHTML = '<p class="muted">Queue is empty</p>';

    all.forEach(p => {
      const div = document.createElement('div');
      div.className = `queue-item ${activePatient?.id === p.id ? 'active' : ''}`;
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between">
            <strong>${p.patientName}</strong>
            <span class="status-badge status-${p.status}">${p.status}</span>
        </div>
        <small class="muted">${p.reason || 'General Checkup'}</small>
      `;
      div.onclick = () => selectPatient(p);
      queueContainer.appendChild(div);
    });

  } catch (e) {
    queueContainer.textContent = `Error: ${e.message}`;
  }
}

function selectPatient(patient) {
  activePatient = patient;
  selectedProcedures = [];
  toothStates = patient.toothData || {}; // Assume patient data comes with existing tooth states

  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('consultationArea').classList.remove('hidden');
  document.getElementById('activePatientName').textContent = patient.patientName;
  document.getElementById('activePatientId').textContent = `ID: #${patient.id}`;
  
  renderToothChart();
  renderBill();
  load(); // Refresh queue to show active selection
}

function renderToothChart() {
  const container = document.getElementById('chartContainer');
  // Simplified Arch SVG
  let svgHtml = `<svg viewBox="0 0 500 180" class="tooth-svg">`;
  
  // Upper Arch (Teeth 1-16)
  for (let i = 1; i <= 16; i++) {
    const status = toothStates[i] || 'healthy';
    const x = 30 * i;
    svgHtml += `
      <g onclick="window.toggleTooth(${i})">
        <rect id="tooth-${i}" x="${x}" y="20" width="25" height="40" rx="5" class="tooth ${status}" />
        <text x="${x + 5}" y="75" font-size="10">${i}</text>
      </g>`;
  }

  // Lower Arch (Teeth 17-32)
  for (let i = 17; i <= 32; i++) {
    const status = toothStates[i] || 'healthy';
    const x = 30 * (i - 16);
    svgHtml += `
      <g onclick="window.toggleTooth(${i})">
        <rect id="tooth-${i}" x="${x}" y="100" width="25" height="40" rx="5" class="tooth ${status}" />
        <text x="${x + 5}" y="155" font-size="10">${i}</text>
      </g>`;
  }
  
  svgHtml += `</svg>`;
  container.innerHTML = svgHtml;
}

// Global function to be called from SVG
window.toggleTooth = (id) => {
  const current = toothStates[id] || 'healthy';
  let next = 'healthy';
  if (current === 'healthy') next = 'filling';
  else if (current === 'filling') next = 'extracted';
  
  toothStates[id] = next;
  renderToothChart();
};

document.getElementById('procedureDropdown').onchange = (e) => {
  const opt = e.target.options[e.target.selectedIndex];
  if (!opt.value) return;
  
  selectedProcedures.push({
    name: opt.value,
    price: parseFloat(opt.dataset.price)
  });
  
  e.target.selectedIndex = 0;
  renderBill();
};

function renderBill() {
  const list = document.getElementById('billItems');
  const totalEl = document.getElementById('totalPrice');
  list.innerHTML = '';
  
  let total = 0;
  selectedProcedures.forEach((item, idx) => {
    total += item.price;
    list.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:right">₱${item.price.toLocaleString()}</td>
        <td style="text-align:right; width:30px">
            <button onclick="window.removeProc(${idx})" style="border:none; background:none; cursor:pointer">❌</button>
        </td>
      </tr>`;
  });
  
  totalEl.textContent = `₱${total.toLocaleString()}`;
}

window.removeProc = (index) => {
    selectedProcedures.splice(index, 1);
    renderBill();
};

document.getElementById('doneBtn').onclick = async () => {
    if (!activePatient) return;

    const payload = {
        patientId: activePatient.id,
        notes: document.getElementById('consultNotes').value,
        procedures: selectedProcedures,
        toothData: toothStates,
        totalAmount: selectedProcedures.reduce((sum, p) => sum + p.price, 0)
    };

    try {
        await apiFetch(`/api/queues/complete/${activePatient.id}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        alert("Consultation completed and saved!");
        location.reload(); // Refresh to clear workspace
    } catch (e) {
        alert("Error saving: " + e.message);
    }
};

document.getElementById('refreshBtn').addEventListener('click', load);

// Initial Load
load();
setInterval(load, 10000); // Background refresh every 10s