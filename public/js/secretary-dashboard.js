import { apiFetch } from './api.js';

const ID_PREFIX = "DH-";
let manualIncrement = 0; // Used to skip IDs if collisions occur

/**
 * CORE LOGIC: Fetches patients and calculates the TRUE next ID.
 */
async function refreshDashboard() {
  try {
    // 1. Fetch data from server
    const patients = await apiFetch('/api/patients').catch(() => []);
    const queueData = await apiFetch('/api/queues/status').catch(() => ({ waiting: [], inProgress: [] }));

    // 2. AUTO-INCREMENT LOGIC
    let highestNum = 1000; 
    if (Array.isArray(patients) && patients.length > 0) {
      patients.forEach(p => {
        if (p.displayId && p.displayId.startsWith(ID_PREFIX)) {
          const numPart = parseInt(p.displayId.replace(ID_PREFIX, ''));
          if (!isNaN(numPart) && numPart > highestNum) {
            highestNum = numPart;
          }
        }
      });
    }
    
    // Set the ID field: Highest found + manual skips + 1
    const nextIdValue = `${ID_PREFIX}${highestNum + manualIncrement + 1}`;
    document.getElementById('regDisplayId').value = nextIdValue;

    // 3. RENDER PATIENT DIRECTORY
    const dirBody = document.getElementById('dirTable');
    if (patients.length === 0) {
        dirBody.innerHTML = '<tr><td colspan="3" class="muted">No records found. (Check MongoDB for hidden records)</td></tr>';
    } else {
        dirBody.innerHTML = patients.map(p => `
          <tr>
            <td><span class="id-badge">${p.displayId || 'N/A'}</span></td>
            <td>${p.fullName}</td>
            <td><button class="btn btn-sm" onclick="window.copyToQ('${p.displayId}')">Enqueue</button></td>
          </tr>
        `).join('');
    }

    // 4. RENDER QUEUE
    const qBody = document.getElementById('qTable');
    const allQ = [...(queueData.inProgress || []), ...(queueData.waiting || [])];
    qBody.innerHTML = allQ.map((p, i) => `
      <tr>
        <td>${i+1}</td>
        <td><span class="id-badge">${p.displayId}</span></td>
        <td>${p.patientName}</td>
        <td><button class="btn-danger" onclick="window.removeFromQ('${p.id}')">Remove</button></td>
      </tr>
    `).join('') || '<tr><td colspan="4" class="muted">Queue is empty.</td></tr>';
  } catch (err) {
    console.error("Sync Error:", err);
  }
}

/**
 * NEW FEATURE: Allows secretary to manually skip an ID if the server says it exists.
 */
window.skipId = () => {
    manualIncrement++;
    refreshDashboard();
};

/**
 * ACTION: REGISTER PATIENT
 */
document.getElementById('regForm').onsubmit = async (e) => {
  e.preventDefault();
  const status = document.getElementById('regStatus');
  const idValue = document.getElementById('regDisplayId').value;

  status.style.display = "block";
  status.textContent = "Registering...";
  status.style.backgroundColor = "#f1f5f9";

  try {
    const payload = {
      displayId: idValue,
      fullName: document.getElementById('regFullName').value.trim(),
      phone: document.getElementById('regPhone').value.trim(),
      email: document.getElementById('regEmail').value.trim()
    };

    const res = await apiFetch('/api/patients', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    });

    // Reset manual skip on success
    manualIncrement = 0;
    status.textContent = `Success! Registered: ${res.patient.displayId}`;
    status.style.backgroundColor = "#dcfce7";
    status.style.color = "#166534";
    
    e.target.reset();
    await refreshDashboard(); 
  } catch (err) {
    status.textContent = "Failed: " + err.message;
    status.style.backgroundColor = "#fee2e2";
    status.style.color = "#b91c1c";

    // If ID exists, give an easy button to fix it
    if (err.message.includes("already exists")) {
        status.innerHTML = `${err.message}. <button onclick="window.skipId()" style="background:#b91c1c; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer">Try Next ID</button>`;
    }
  }
};

/**
 * ACTIONS: ENQUEUE, REMOVE, SEARCH
 */
document.getElementById('qBtn').onclick = async () => {
  const idInput = document.getElementById('qIdInput');
  if (!idInput.value) return alert("Please enter or select a patient ID.");
  try {
    await apiFetch('/api/queues/enqueue', { 
      method: 'POST', 
      body: JSON.stringify({ displayId: idInput.value }) 
    });
    idInput.value = '';
    refreshDashboard();
  } catch (err) {
    alert(err.message);
  }
};

window.copyToQ = (id) => {
    document.getElementById('qIdInput').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.removeFromQ = async (id) => {
  if (confirm("Remove patient from queue?")) {
    await apiFetch(`/api/queues/remove/${id}`, { method: 'DELETE' });
    refreshDashboard();
  }
};

window.filter = () => {
  const val = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('#dirTable tr').forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
  });
};

refreshDashboard();
setInterval(refreshDashboard, 15000);