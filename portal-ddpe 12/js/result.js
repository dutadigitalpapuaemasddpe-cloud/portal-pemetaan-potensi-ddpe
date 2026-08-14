/* =========================================================
   Result + Twibbon Generator (Custom Frame)
   ========================================================= */

const DIMENSIONS = window.DDPE_DIMENSIONS || {};
/* Harus sama dengan assessment.js & wait.html */
const DDPE_ANNOUNCE_AT = '2026-08-16T18:00:00+09:00';
let resultData = null;

function init() {
  const raw = localStorage.getItem('ddpe_last_result');
  if (!raw) {
    document.getElementById('noResult').style.display = 'block';
    return;
  }

  resultData = JSON.parse(raw);

  // Pengumuman bersamaan untuk semua
  if (Date.now() < new Date(DDPE_ANNOUNCE_AT).getTime()) {
    window.location.href = 'wait.html';
    return;
  }

  document.getElementById('resultContent').style.display = 'block';
  document.getElementById('resultNama').textContent =
    resultData.personal.panggilan || resultData.personal.nama.split(' ')[0];

  renderRadar();
  renderDimensions();
  renderRoles();
  generateTwibbon();
  fillCaption();
}

function fillCaption() {
  const el = document.getElementById('igCaption');
  if (!el || !resultData) return;
  const nama = resultData.personal.nama || 'Pengurus DDPE';
  const role = (resultData.roles && resultData.roles[0] && resultData.roles[0].title) || 'kontributor aktif';
  const caption =
`Hari ini saya menyelesaikan Pemetaan Potensi Duta Digital Papua Emas 2026.

Bukan soal siapa yang paling menonjol — tapi di mana setiap potensi bisa bertumbuh. Terima kasih DDPE yang membuka ruang agar kami menemukan peran yang lebih sesuai.

Siap berkontribusi dengan lebih tepat sasaran. ✨

#dutadigitalpapuaemas #ddpe2026 #pemetaanpotensi #literasidigital #inovasidigital`;
  el.value = caption;
}

function copyCaption() {
  const el = document.getElementById('igCaption');
  if (!el) return;
  el.select();
  el.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(el.value).then(() => {
    alert('Caption berhasil disalin. Tempel di Instagram bersama twibbon Anda.');
  }).catch(() => {
    alert('Gagal menyalin otomatis. Silakan salin manual dari kotak caption.');
  });
}

function renderRadar() {
  const labels = Object.values(DIMENSIONS).map(d => d.short);
  const data = Object.keys(DIMENSIONS).map(k => resultData.scoresNormalized[k] || 0);

  const ctx = document.getElementById('radarChart').getContext('2d');
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Skor Potensi',
        data,
        fill: true,
        backgroundColor: 'rgba(124, 58, 237, 0.25)',
        borderColor: 'rgba(167, 139, 250, 0.9)',
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#fff',
        pointRadius: 4,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false, stepSize: 20 },
          grid: { color: 'rgba(255,255,255,0.08)' },
          angleLines: { color: 'rgba(255,255,255,0.08)' },
          pointLabels: {
            color: '#cbd5e1',
            font: { size: 11, family: 'Inter' }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderDimensions() {
  const list = document.getElementById('dimList');
  const sorted = Object.entries(resultData.scoresNormalized)
    .sort((a, b) => b[1] - a[1]);

  list.innerHTML = sorted.map(([key, val]) => {
    const dim = DIMENSIONS[key] || { short: key, label: key };
    return `
      <div class="dim-item glass-sm">
        <div class="dim-bar-wrap">
          <div class="dim-name">
            <span>${dim.short}</span>
            <span>${val}</span>
          </div>
          <div class="dim-track">
            <div class="dim-fill" style="width:${val}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRoles() {
  const roles = resultData.roles || [];
  const cards = document.getElementById('roleCards');
  cards.innerHTML = roles.map(r => `
    <div class="role-card glass-sm">
      <h4>${r.title}</h4>
      <p>${r.desc}</p>
      <span class="role-fit">${r.fit || ''}</span>
    </div>
  `).join('');

  // Top match highlight
  if (roles[0]) {
    const t = document.getElementById('topRoleTitle');
    const d = document.getElementById('topRoleDesc');
    if (t) t.textContent = roles[0].title;
    if (d) d.textContent = roles[0].desc || roles[0].fit || '';
  }
}

/* ---------- Custom Frame Twibbon Generator ---------- */
/*
  Frame: twibbon-frame.png (1080x1080)
  Photo slot based on green chroma region:
    approx x:163-967, y:129-909
*/
function generateTwibbon() {
  const canvas = document.getElementById('twibbonCanvas');
  const ctx = canvas.getContext('2d');
  const size = 1080;
  canvas.width = size;
  canvas.height = size;

  // Photo slot aligned to green area of provided frame
  const slot = { x: 170, y: 140, w: 790, h: 760 };

  const frame = new Image();
  frame.crossOrigin = 'anonymous';

  const finish = (photoImg) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    if (photoImg) {
      const scale = Math.max(slot.w / photoImg.width, slot.h / photoImg.height);
      const pw = photoImg.width * scale;
      const ph = photoImg.height * scale;
      const px = slot.x + (slot.w - pw) / 2;
      const py = slot.y + (slot.h - ph) / 2;

      ctx.save();
      roundRectPath(ctx, slot.x, slot.y, slot.w, slot.h, 24);
      ctx.clip();
      ctx.drawImage(photoImg, px, py, pw, ph);
      ctx.restore();
    }

    ctx.drawImage(frame, 0, 0, size, size);
  };

  frame.onload = () => {
    if (resultData.fotoDataUrl) {
      const photo = new Image();
      photo.onload = () => finish(photo);
      photo.onerror = () => finish(null);
      photo.src = resultData.fotoDataUrl;
    } else {
      finish(null);
    }
  };

  const paths = ['assets/twibbon-frame.png', './assets/twibbon-frame.png'];
  let pathIdx = 0;
  const origOnError = () => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);
    if (resultData.fotoDataUrl) {
      const photo = new Image();
      photo.onload = () => {
        const pad = 60;
        const scale = Math.min((size - pad*2) / photo.width, (size - pad*2) / photo.height);
        const pw = photo.width * scale, ph = photo.height * scale;
        ctx.save();
        roundRectPath(ctx, pad, pad, size-pad*2, size-pad*2, 32);
        ctx.clip();
        ctx.drawImage(photo, (size-pw)/2, (size-ph)/2, pw, ph);
        ctx.restore();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 14;
        roundRectPath(ctx, pad, pad, size-pad*2, size-pad*2, 32);
        ctx.stroke();
      };
      photo.src = resultData.fotoDataUrl;
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Frame gagal dimuat — buka via ddpe.my.id', size/2, size/2);
    }
  };
  frame.onerror = () => {
    pathIdx++;
    if (pathIdx < paths.length) frame.src = paths[pathIdx];
    else origOnError();
  };
  frame.src = paths[0];
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function downloadTwibbon() {
  const canvas = document.getElementById('twibbonCanvas');
  const link = document.createElement('a');
  const safeName = (resultData.personal.nama || 'peserta').replace(/\s+/g, '-');
  link.download = `Twibbon-DDPE-${safeName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function shareResult() {
  const text = `Saya baru saja menyelesaikan Pemetaan Potensi DDPE 2026!\n\nRekomendasi peran: ${(resultData.roles || []).map(r => r.title).join(', ')}\n\n#DutaDigitalPapuaEmas #DDPE2026`;
  if (navigator.share) {
    navigator.share({ title: 'Hasil Pemetaan DDPE', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => alert('Teks hasil disalin ke clipboard.'));
  }
}

init();
