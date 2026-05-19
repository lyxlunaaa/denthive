import { apiFetch } from './api.js';

const ID_PREFIX = "DH-";

// --- 1. ID GENERATION LOGIC ---
// This function determines what the NEXT ID should be based on current records
function getNextId(patients = []) {
  let highestNum = 1000; // Starting base number
  
  if (Array.isArray(patients)) {
    patients.forEach(p => {
      if (p.displayId && p.displayId.startsWith(ID_PREFIX)) {
        const num = parseInt(p.displayId.replace(ID_PREFIX, ''));
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    });
  }
  return `${ID_PREFIX}${highestNum + 1}`;
}

// --- 2. MAIN SYNC FUNCTION ---
const refresh = async () => {
  try {
    // 1. Set a "Safe Default" immediately if field is empty
    const idInput = document.getElementById('regDisplayId');
    if (!idInput.value) idInput.value = getNextId([]);

    // 2. Fetch data from server
    const patients = await apiFetch('/api/patients').catch(() => []);
    const queueData = await apiFetch('/api/queues/status').catch(() => ({ waiting: [], inProgress: [] }));

    // 3. Update the Auto-Increment field with the REAL next number
    idInput.value = getNextId(patients);

    // 4. Update Directory Table
    const dirBody = document.getElementById('dirTable');
    dirBody.innerHTML = patients.map(p => `
      <tr>
        <td><span class="id-badge">${p.displayId}</span></td>
        <td>${p.fullName}</td>
        <td><button class="btn btn-sm" onclick="window.copyToQ('${p.displayId}')">Enqueue</button></td>
      </tr>
    `).join('') || '<tr><td colspan="3" class="muted">No patients found.</td></tr>';

    // 5. Update Queue Table
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
    console.error("Refresh Error:", err);
  }
};

// --- 3. FORM SUBMISSION (REGISTER) ---
document.getElementById('regForm').onsubmit = async (e) => {
  e.preventDefault();
  
  const idValue = document.getElementById('regDisplayId').value;
  const status = document.getElementById('regStatus');

  // ABSOLUTE GUARD: Don't submit if ID is blank
  if (!idValue) {
    alert("Error: Auto-Increment ID failed to generate. Please refresh the page.");
    return;
  }

  status.style.display = "block";
  status.textContent = "Registering...";
  status.style.backgroundColor = "#f1f5f9";

  try {
    const payload = {
      displayId: idValue,
      fullName: document.getElementById('regFullName').value,
      phone: document.getElementById('regPhone').value,
      email: document.getElementById('regEmail').value
    };

    const res = await apiFetch('/api/patients', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    });

    status.textContent = `Registered Successfully: ${res.patient.displayId}`;
    status.style.backgroundColor = "#dcfce7";
    status.style.color = "#166534";
    
    e.target.reset();
    await refresh(); // Immediately get the next number
  } catch (err) {
    status.textContent = "Error: " + err.message;
    status.style.backgroundColor = "#fee2e2";
    status.style.color = "#b91c1c";
    alert("Registration Failed: " + err.message);
  }
};

// --- 4. OTHER FEATURES (ENQUEUE, REMOVE, SEARCH) ---
document.getElementById('qBtn').onclick = async () => {
  const idInput = document.getElementById('qIdInput');
  if (!idInput.value) return alert("Select a patient to enqueue.");
  try {
    await apiFetch('/api/queues/enqueue', { 
      method: 'POST', 
      body: JSON.stringify({ displayId: idInput.value }) 
    });
    idInput.value = '';
    refresh();
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
    refresh();
  }
};

window.filter = () => {
  const val = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('#dirTable tr').forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
  });
};

// Initial Start
refresh();
setInterval(refresh, 10000); // Sync every 10s