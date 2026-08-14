/* =========================================================
   DDPE Dashboard (Shared Password)
   Password: DDPE2026!Ring1
   ========================================================= */

const DASH_PASSWORD = 'DDPE2026!Ring1';
const SESSION_KEY = 'ddpe_dash_auth';

function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function tryLogin() {
  const input = document.getElementById('dashPassword').value;
  if (input === DASH_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    showDashboard();
  } else {
    alert('Password salah. Hubungi Founder/Ketua Umum jika Anda pengurus resmi.');
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

function showDashboard() {
  document.getElementById('loginGate').style.display = 'none';
  document.getElementById('dashApp').style.display = 'block';
  switchTab('overview');
}

function getSubmissions() {
  return JSON.parse(localStorage.getItem('ddpe_submissions') || '[]');
}

function switchTab(tab) {
  document.querySelectorAll('.dash-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  const content = document.getElementById('tabContent');
  const subs = getSubmissions();

  if (tab === 'overview') {
    const total = subs.length;
    const literasi = subs.filter(s => s.minatPilar === 'literasi').length;
    const inovasi = subs.filter(s => s.minatPilar === 'inovasi').length;
    const keduanya = subs.filter(s => s.minatPilar === 'keduanya').length;

    // Average top dimension
    let avgMap = {};
    const dims = Object.keys(window.DDPE_DIMENSIONS || {});
    dims.forEach(d => avgMap[d] = 0);
    subs.forEach(s => {
      if (s.scores) {
        Object.entries(s.scores).forEach(([k, v]) => {
          avgMap[k] = (avgMap[k] || 0) + v;
        });
      }
    });
    if (total > 0) {
      Object.keys(avgMap).forEach(k => avgMap[k] = Math.round(avgMap[k] / total));
    }
    const topDim = Object.entries(avgMap).sort((a, b) => b[1] - a[1])[0];

    content.innerHTML = `
      <h2 style="margin-bottom:1.5rem">Overview Pemetaan</h2>
      <div class="stat-grid">
        <div class="stat-card glass-sm">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total Submission</div>
        </div>
        <div class="stat-card glass-sm">
          <div class="stat-value">${literasi}</div>
          <div class="stat-label">Minat Literasi</div>
        </div>
        <div class="stat-card glass-sm">
          <div class="stat-value">${inovasi}</div>
          <div class="stat-label">Minat Inovasi</div>
        </div>
        <div class="stat-card glass-sm">
          <div class="stat-value">${keduanya}</div>
          <div class="stat-label">Minat Keduanya</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
        <div class="glass-sm" style="padding:1.25rem">
          <h4 style="margin-bottom:0.75rem">Dimensi Tertinggi (Rata-rata)</h4>
          <p style="font-size:1.4rem;font-weight:700;color:var(--gold-400)">${topDim ? topDim[0] : '-'}</p>
          <p style="color:var(--text-muted);font-size:0.85rem">Skor rata-rata: ${topDim ? topDim[1] : 0}</p>
        </div>
        <div class="glass-sm" style="padding:1.25rem">
          <h4 style="margin-bottom:0.75rem">Status Data</h4>
          <p style="font-size:0.9rem;color:var(--text-secondary)">
            Data disimpan lokal di browser ini (demo).<br>
            Untuk data real lintas perangkat, hubungkan Formspree + Google Sheets.
          </p>
        </div>
      </div>

      <div style="margin-top:1.5rem">
        <h4 style="margin-bottom:0.75rem">Submission Terbaru</h4>
        ${renderTable(subs.slice(0, 5))}
      </div>
    `;
  }

  else if (tab === 'submissions') {
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <h2>Semua Submission</h2>
        <button class="btn btn-ghost" style="padding:0.4rem 0.9rem;font-size:0.85rem" onclick="exportCSV()">Export CSV</button>
      </div>
      ${renderTable(subs)}
      ${subs.length === 0 ? '<p style="color:var(--text-muted);margin-top:1rem">Belum ada data. Lakukan pemetaan dari portal untuk melihat data di sini.</p>' : ''}
    `;
  }

  else if (tab === 'analytics') {
    content.innerHTML = `
      <h2 style="margin-bottom:1.5rem">Analytics Dimensi</h2>
      <div class="glass-sm" style="padding:1.5rem;max-width:560px;margin:0 auto">
        <canvas id="avgChart" height="300"></canvas>
      </div>
      <p style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-top:1rem">
        Rata-rata skor per dimensi dari seluruh submission.
      </p>
    `;
    setTimeout(() => renderAvgChart(subs), 50);
  }

  else if (tab === 'roles') {
    const roleCount = {};
    subs.forEach(s => {
      const r = s.topRole || 'Lainnya';
      roleCount[r] = (roleCount[r] || 0) + 1;
    });
    const sortedRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]);

    content.innerHTML = `
      <h2 style="margin-bottom:1.5rem">Distribusi Rekomendasi Peran</h2>
      <div class="role-cards">
        ${sortedRoles.length ? sortedRoles.map(([role, count]) => `
          <div class="role-card glass-sm">
            <h4>${role}</h4>
            <p style="font-size:1.5rem;font-weight:700;color:var(--gold-400);margin-top:0.5rem">${count}</p>
            <p style="font-size:0.8rem;color:var(--text-muted)">orang direkomendasikan</p>
          </div>
        `).join('') : '<p style="color:var(--text-muted)">Belum ada data.</p>'}
      </div>
    `;
  }

  else if (tab === 'settings') {
    content.innerHTML = `
      <h2 style="margin-bottom:1.5rem">Settings</h2>
      <div class="glass-sm" style="padding:1.5rem;margin-bottom:1rem">
        <h4 style="margin-bottom:0.5rem">Password Dashboard</h4>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.75rem">
          Password saat ini: <code style="background:rgba(255,255,255,0.08);padding:0.15rem 0.5rem;border-radius:4px">DDPE2026!Ring1</code>
        </p>
        <p style="font-size:0.85rem;color:var(--text-secondary)">
          Ubah password dengan mengedit file <code>js/dashboard.js</code> (variabel DASH_PASSWORD) lalu deploy ulang.
        </p>
      </div>
      <div class="glass-sm" style="padding:1.5rem;margin-bottom:1rem">
        <h4 style="margin-bottom:0.5rem">Email Submission</h4>
        <p style="color:var(--text-muted);font-size:0.9rem">
          Untuk mengirim jawaban ke <strong>dutadigitalpapuaemasddpe@gmail.com</strong>:
        </p>
        <ol style="margin:0.75rem 0 0 1.25rem;font-size:0.9rem;color:var(--text-secondary);line-height:1.7">
          <li>Buat akun gratis di <a href="https://formspree.io" target="_blank" style="color:var(--purple-500)">formspree.io</a></li>
          <li>Buat form baru, set email tujuan ke email DDPE</li>
          <li>Salin Form ID, paste ke <code>js/assessment.js</code> (variabel FORMSPREE_ID)</li>
          <li>Deploy ulang</li>
        </ol>
      </div>
      <div class="glass-sm" style="padding:1.5rem">
        <h4 style="margin-bottom:0.5rem">Hapus Data Lokal</h4>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.75rem">
          Menghapus semua submission yang tersimpan di browser ini.
        </p>
        <button class="btn btn-ghost" onclick="clearData()">Hapus Semua Data Lokal</button>
      </div>
    `;
  }
}

function renderTable(subs) {
  if (!subs.length) return '<p style="color:var(--text-muted)">Tidak ada data.</p>';
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Sekolah</th>
            <th>Minat</th>
            <th>Top Role</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody>
          ${subs.map(s => `
            <tr>
              <td>${s.nama || '-'}</td>
              <td>${s.sekolah || '-'}</td>
              <td>${s.minatPilar || '-'}</td>
              <td>${s.topRole || '-'}</td>
              <td>${s.submittedAt ? new Date(s.submittedAt).toLocaleString('id-ID') : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAvgChart(subs) {
  const dims = window.DDPE_DIMENSIONS || {};
  const keys = Object.keys(dims);
  let sums = {};
  keys.forEach(k => sums[k] = 0);
  subs.forEach(s => {
    if (s.scores) keys.forEach(k => sums[k] += (s.scores[k] || 0));
  });
  const avg = keys.map(k => subs.length ? Math.round(sums[k] / subs.length) : 0);

  const ctx = document.getElementById('avgChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: keys.map(k => dims[k].short),
      datasets: [{
        label: 'Rata-rata',
        data: avg,
        backgroundColor: 'rgba(124, 58, 237, 0.55)',
        borderColor: 'rgba(167, 139, 250, 0.9)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function exportCSV() {
  const subs = getSubmissions();
  if (!subs.length) { alert('Tidak ada data.'); return; }
  const headers = ['Nama', 'Email', 'Sekolah', 'Minat', 'Top Role', 'Waktu'];
  const rows = subs.map(s => [
    s.nama, s.email, s.sekolah, s.minatPilar, s.topRole,
    s.submittedAt ? new Date(s.submittedAt).toLocaleString('id-ID') : ''
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ddpe-submissions-${Date.now()}.csv`;
  a.click();
}

function clearData() {
  if (confirm('Hapus semua data submission lokal?')) {
    localStorage.removeItem('ddpe_submissions');
    localStorage.removeItem('ddpe_last_result');
    switchTab('overview');
  }
}

// Enter key on password
document.getElementById('dashPassword')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') tryLogin();
});

// Auto show if already authed
if (isAuthenticated()) showDashboard();
