(function(){
  const inferredRole = (() => {
    const p = String(location.pathname || '');
    if (p.includes('doctor-login')) return 'doctor';
    if (p.includes('secretary-login')) return 'secretary';
    if (p.includes('patient-login')) return 'patient';
    return null;
  })();

  const role = window.__ROLE__ || inferredRole || 'doctor';
  const form = document.getElementById('form');
  const err = document.getElementById('err');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';

    try {
      const payload = { role };
      if (role === 'patient') {
        payload.displayId = document.getElementById('displayId').value;
        payload.password = document.getElementById('password').value;
      } else {
        payload.username = document.getElementById('username').value;
        payload.password = document.getElementById('password').value;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');

      localStorage.setItem('denthive_token', data.token);
      localStorage.setItem('denthive_role', data.role);
      if (data.user?.displayId) localStorage.setItem('denthive_displayId', data.user.displayId);

      // Basic redirect to role dashboard (scaffold pages can be extended later)
      if (role === 'doctor') location.href = '/doctor-dashboard.html';
      else if (role === 'secretary') location.href = '/secretary-dashboard.html';
      else location.href = '/patient-portal.html';
    } catch (e) {
      err.textContent = e.message;
    }
  });
})();


