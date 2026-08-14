# Portal Pemetaan Potensi DDPE 2026

Versi final — siap di-host di **ddpe.my.id**

## Isi folder

```
index.html          → Beranda
assessment.html     → Form pemetaan (20 soal + crop foto)
wait.html           → Halaman tunggu (countdown Minggu 16 Agu 2026, 18.00 WIT)
result.html         → Hasil + radar + twibbon + caption
dashboard.html      → Dashboard admin
css/main.css
js/...
assets/...
```

## Alur peserta

1. Beranda → Mulai pemetaan
2. Data diri → 20 pernyataan → crop foto → selesai
3. Halaman tunggu (nomor unik + PIN + countdown)
4. Minggu 16 Agustus 2026 pukul 18.00 WIT → hasil + twibbon terbuka

## Upload ke Vercel / ddpe.my.id

1. Extract zip
2. Upload **semua isi folder** ke repo GitHub (index.html di root, ada folder css/, js/, assets/)
3. Root Directory Vercel = `.` (root)
4. Domains → pastikan ddpe.my.id mengarah ke project ini
5. Hapus/ganti deployment lama yang masih bug

## Email ke Gmail

Edit js/assessment.js:
```
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
```
Ganti dengan Form ID dari formspree.io (tujuan: dutadigitalpapuaemasddpe@gmail.com)

## Tanggal pengumuman

`DDPE_ANNOUNCE_AT = '2026-08-16T18:00:00+09:00'`
ada di: js/assessment.js, js/result.js, wait.html
