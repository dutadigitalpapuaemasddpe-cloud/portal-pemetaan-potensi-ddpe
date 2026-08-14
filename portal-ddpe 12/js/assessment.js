/* =========================================================
   DDPE Assessment Engine
   ========================================================= */

const state = {
  currentStep: 1,
  currentQ: 0,
  answers: {},          // qid -> optionId
  scores: {},           // dimension -> total weight
  personal: {},
  fotoDataUrl: null
};

const TOTAL_STEPS = 4; // data, questions, reflection, result

/* Waktu pengumuman hasil — SAMA untuk semua peserta (bukan 24 jam per orang).
   Ubah nilai ini sesuai jadwal resmi DDPE. Format: ISO dengan zona WIT (+09:00) */
const DDPE_ANNOUNCE_AT = '2026-08-16T18:00:00+09:00';
const QUESTIONS = window.DDPE_QUESTIONS || [];
const DIMENSIONS = window.DDPE_DIMENSIONS || {};

// Initialize scores
Object.keys(DIMENSIONS).forEach(k => state.scores[k] = 0);

/* ---------- Navigation ---------- */
function goToStep(step) {
  if (step === 2 && !validateStep1()) return;
  if (step === 3 && Object.keys(state.answers).length < QUESTIONS.length) {
    alert('Selesaikan semua pernyataan terlebih dahulu.');
    return;
  }

  document.querySelectorAll('[id^="step"]').forEach(el => el.style.display = 'none');
  const el = document.getElementById('step' + step);
  if (el) el.style.display = 'block';

  state.currentStep = step;
  updateProgress();

  if (step === 2) renderQuestion();
}

function updateProgress() {
  let pct = 0;
  if (state.currentStep === 1) pct = 5;
  else if (state.currentStep === 2) {
    pct = 10 + Math.round((state.currentQ / QUESTIONS.length) * 70);
  } else if (state.currentStep === 3) pct = 85;
  else pct = 100;

  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPct').textContent = pct + '%';

  if (state.currentStep === 2) {
    document.getElementById('progressText').textContent =
      `Pernyataan ${state.currentQ + 1} dari ${QUESTIONS.length}`;
  } else if (state.currentStep === 1) {
    document.getElementById('progressText').textContent = 'Langkah 1 dari 4 · Data diri';
  } else if (state.currentStep === 3) {
    document.getElementById('progressText').textContent = 'Langkah 3 dari 4 · Refleksi & Twibbon';
  }
}

/* ---------- Step 1 Validation ---------- */
function validateStep1() {
  const required = ['nama', 'email', 'wa', 'usia', 'gender', 'sekolah', 'minatPilar'];
  for (const id of required) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      alert('Lengkapi semua field yang wajib (*).');
      el?.focus();
      return false;
    }
  }
  state.personal = {
    nama: document.getElementById('nama').value.trim(),
    panggilan: document.getElementById('panggilan').value.trim(),
    email: document.getElementById('email').value.trim(),
    wa: document.getElementById('wa').value.trim(),
    usia: document.getElementById('usia').value,
    gender: document.getElementById('gender').value,
    sekolah: document.getElementById('sekolah').value.trim(),
    kelas: document.getElementById('kelas').value.trim(),
    minatPilar: document.getElementById('minatPilar').value
  };
  return true;
}

/* ---------- Questions ---------- */
function renderQuestion() {
  const q = QUESTIONS[state.currentQ];
  if (!q) return;

  const container = document.getElementById('questionContainer');
  const selected = state.answers[q.id] || null;

  container.innerHTML = `
    <div class="question-context">${q.context}</div>
    <div class="question-prompt">${q.prompt}</div>
    <div class="option-list">
      ${q.options.map(o => `
        <div class="option-item ${selected === o.id ? 'selected' : ''}"
             onclick="selectOption('${q.id}', '${o.id}')">
          <div class="option-letter">${o.id.toUpperCase()}</div>
          <div class="option-text">${o.text}</div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('btnPrevQ').style.visibility =
    state.currentQ === 0 ? 'hidden' : 'visible';
  document.getElementById('btnNextQ').textContent =
    state.currentQ === QUESTIONS.length - 1 ? 'Selesai pernyataan →' : 'Berikutnya →';

  updateProgress();
}

function selectOption(qid, oid) {
  state.answers[qid] = oid;
  renderQuestion();
}

function nextQuestion() {
  const q = QUESTIONS[state.currentQ];
  if (!state.answers[q.id]) {
    alert('Pilih salah satu opsi terlebih dahulu.');
    return;
  }
  if (state.currentQ < QUESTIONS.length - 1) {
    state.currentQ++;
    renderQuestion();
  } else {
    goToStep(3);
  }
}

function prevQuestion() {
  if (state.currentQ > 0) {
    state.currentQ--;
    renderQuestion();
  }
}

/* ---------- Photo + Crop ---------- */
let cropper = null;

document.getElementById('foto')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    alert('Ukuran foto maksimal 8MB.');
    return;
  }

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  state.fotoDataUrl = null;
  const finalPreview = document.getElementById('fotoFinalPreview');
  if (finalPreview) finalPreview.style.display = 'none';

  const reader = new FileReader();
  reader.onload = function (ev) {
    const cropImage = document.getElementById('cropImage');
    cropImage.src = ev.target.result;

    document.getElementById('cropArea').classList.add('show');
    document.getElementById('cropActions').classList.add('show');

    cropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.85,
      responsive: true,
      background: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false
    });
  };
  reader.readAsDataURL(file);
});

function applyCrop() {
  if (!cropper) {
    alert('Crop foto terlebih dahulu.');
    return;
  }

  const canvas = cropper.getCroppedCanvas({
    width: 900,
    height: 900,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  });

  state.fotoDataUrl = canvas.toDataURL('image/jpeg', 0.92);

  document.getElementById('fotoImg').src = state.fotoDataUrl;
  document.getElementById('fotoFinalPreview').style.display = 'block';

  document.getElementById('cropArea').classList.remove('show');
  document.getElementById('cropActions').classList.remove('show');
  cropper.destroy();
  cropper = null;
  document.getElementById('foto').value = '';
}

function cancelCrop() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  document.getElementById('cropArea').classList.remove('show');
  document.getElementById('cropActions').classList.remove('show');
  document.getElementById('foto').value = '';
  state.fotoDataUrl = null;
  document.getElementById('fotoFinalPreview').style.display = 'none';
}

/* ---------- Scoring ---------- */
function calculateScores() {
  Object.keys(DIMENSIONS).forEach(k => state.scores[k] = 0);

  QUESTIONS.forEach(q => {
    const oid = state.answers[q.id];
    if (!oid) return;
    const opt = q.options.find(o => o.id === oid);
    if (!opt || !opt.weights) return;
    Object.entries(opt.weights).forEach(([dim, w]) => {
      state.scores[dim] = (state.scores[dim] || 0) + w;
    });
  });

  // Normalize to 0-100 roughly (max theoretical ~60)
  const maxPossible = 60;
  const normalized = {};
  Object.entries(state.scores).forEach(([k, v]) => {
    normalized[k] = Math.min(100, Math.round((v / maxPossible) * 100));
  });
  state.scoresNormalized = normalized;
}

/* ---------- Role Recommendation ---------- */
function recommendRoles() {
  const s = state.scores;
  const sorted = Object.entries(s).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 4).map(([k]) => k);

  const roles = [];

  // Core structure mapping
  if (top.includes('leadership') || top.includes('program')) {
    roles.push({
      title: 'Kepala Pilar / Koordinator Program',
      desc: 'Memimpin arah program, membagi tugas, menjaga target dan evaluasi.',
      fit: 'Kepemimpinan + Program'
    });
  }
  if (top.includes('administration') || top.includes('consistency')) {
    roles.push({
      title: 'Sekretaris / Administrasi Pilar',
      desc: 'Menjaga dokumen, notulen, arsip, dan kelengkapan laporan.',
      fit: 'Administrasi + Konsistensi'
    });
  }
  if (top.includes('finance') || top.includes('integrity')) {
    roles.push({
      title: 'Bendahara / Pengelola Keuangan Kegiatan',
      desc: 'Pencatatan, transparansi, dan pelaporan keuangan program.',
      fit: 'Keuangan + Integritas'
    });
  }
  if (top.includes('education') || top.includes('communication')) {
    roles.push({
      title: 'Edukator / Fasilitator Literasi',
      desc: 'Menyampaikan materi, memfasilitasi diskusi, dan peer education.',
      fit: 'Edukasi + Komunikasi'
    });
  }
  if (top.includes('creative') || top.includes('technology')) {
    roles.push({
      title: 'Content Creator / Desainer / Developer',
      desc: 'Membuat konten edukasi, visual, prototype, atau tools digital.',
      fit: 'Kreativitas + Teknologi'
    });
  }
  if (top.includes('research') || top.includes('partnership')) {
    roles.push({
      title: 'Researcher / Relationship Officer',
      desc: 'Riset kebutuhan, data, dan membangun jejaring mitra.',
      fit: 'Riset + Kemitraan'
    });
  }

  // Fallback
  if (roles.length === 0) {
    roles.push({
      title: 'Anggota Aktif / Kontributor Pilar',
      desc: 'Berperan sesuai kebutuhan program yang sedang berjalan.',
      fit: 'Fleksibel'
    });
  }

  // Limit to top 3
  return roles.slice(0, 3);
}

/* ---------- Submit ---------- */
async function submitAssessment() {
  if (!document.getElementById('kesiapan').value) {
    alert('Pilih tingkat kesiapan waktu.');
    return;
  }
  if (!state.fotoDataUrl) {
    alert('Upload foto untuk twibbon terlebih dahulu.');
    return;
  }

  state.personal.kesiapan = document.getElementById('kesiapan').value;
  state.personal.pengalaman = document.getElementById('pengalaman').value.trim();
  state.personal.harapan = document.getElementById('harapan').value.trim();

  // Show loading
  document.querySelectorAll('[id^="step"]').forEach(el => el.style.display = 'none');
  document.getElementById('stepLoading').style.display = 'block';
  updateProgress();

  calculateScores();
  const roles = recommendRoles();

  // Prepare payload for email
  const payload = {
    ...state.personal,
    answers: state.answers,
    scores: state.scores,
    scoresNormalized: state.scoresNormalized,
    roles: roles.map(r => r.title),
    submittedAt: new Date().toISOString()
  };

  // Unique code + PIN for later access
  const uniqueCode = 'DDPE-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const submittedAt = payload.submittedAt;
  const unlockAt = DDPE_ANNOUNCE_AT; // pengumuman bersamaan untuk semua

  const resultPayload = {
    uniqueCode,
    pin,
    personal: state.personal,
    scores: state.scores,
    scoresNormalized: state.scoresNormalized,
    roles,
    fotoDataUrl: state.fotoDataUrl,
    submittedAt,
    unlockAt
  };

  localStorage.setItem('ddpe_last_result', JSON.stringify(resultPayload));
  localStorage.setItem('ddpe_active_code', uniqueCode);

  // Index by unique code for lookup
  const byCode = JSON.parse(localStorage.getItem('ddpe_results_by_code') || '{}');
  byCode[uniqueCode] = resultPayload;
  localStorage.setItem('ddpe_results_by_code', JSON.stringify(byCode));

  // Append to submissions list (demo dashboard)
  const submissions = JSON.parse(localStorage.getItem('ddpe_submissions') || '[]');
  submissions.unshift({
    id: uniqueCode,
    nama: state.personal.nama,
    email: state.personal.email,
    sekolah: state.personal.sekolah,
    minatPilar: state.personal.minatPilar,
    scores: state.scoresNormalized,
    topRole: roles[0]?.title || '-',
    submittedAt,
    unlockAt
  });
  localStorage.setItem('ddpe_submissions', JSON.stringify(submissions.slice(0, 100)));

  // Kirim jawaban ke email pengurus inti
  // FormSubmit: email aktivasi sekali ke dutadigitalpapuaemasddpe@gmail.com saat submission pertama
  try {
    const emailPayload = {
      _subject: `[DDPE Pemetaan] ${state.personal.nama || 'Peserta'} — ${uniqueCode}`,
      _template: 'table',
      _captcha: 'false',
      nama: state.personal.nama || '',
      panggilan: state.personal.panggilan || '',
      email: state.personal.email || '',
      whatsapp: state.personal.wa || state.personal.whatsapp || '',
      usia: state.personal.usia || '',
      gender: state.personal.gender || '',
      sekolah: state.personal.sekolah || '',
      kelas: state.personal.kelas || '',
      minatPilar: state.personal.minatPilar || '',
      kesiapan: state.personal.kesiapan || '',
      pengalaman: state.personal.pengalaman || '',
      harapan: state.personal.harapan || '',
      uniqueCode,
      pin,
      topRole: (roles[0] && roles[0].title) || '-',
      roles: roles.map(r => r.title).join(', '),
      submittedAt,
      scores: JSON.stringify(state.scoresNormalized || {}),
      // jawaban ringkas (hindari payload terlalu besar)
      answersCount: Object.keys(state.answers || {}).length
    };
    await fetch('https://formsubmit.co/ajax/dutadigitalpapuaemasddpe@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(emailPayload)
    });
  } catch (err) {
    console.warn('Kirim email gagal (tidak memblokir alur peserta):', err);
  }

  // Redirect to thank-you / wait page (hasil dibuka setelah 24 jam)
  setTimeout(() => {
    window.location.href = 'wait.html';
  }, 1000);
}

// Init
updateProgress();
