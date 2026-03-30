# ✦ NoteSpace — Personal Notepad

> Ruang catatan pribadimu yang bersih, cepat, dan tenang.

![NoteSpace Preview](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Offline](https://img.shields.io/badge/offline-ready-blue?style=flat-square)
![No Framework](https://img.shields.io/badge/no%20framework-vanilla%20JS-orange?style=flat-square)

---

## 📖 Tentang Proyek

**NoteSpace** adalah aplikasi notepad personal berbasis web yang dirancang untuk menjadi tempat menulis yang bersih dan nyaman. Dibangun dengan HTML, CSS, dan JavaScript murni — tanpa framework, tanpa backend, tanpa database eksternal.

Cukup buka `index.html` di browser, langsung bisa dipakai.

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 📝 Buat & Edit Catatan | Tulis catatan dengan judul dan isi |
| 💾 Auto-Save | Tersimpan otomatis saat mengetik (debounce 700ms) |
| 🗑️ Hapus Catatan | Dilengkapi konfirmasi sebelum menghapus |
| 🔍 Pencarian Real-time | Cari catatan dengan highlight hasil pencarian |
| 🕐 Sort Otomatis | Catatan diurutkan berdasarkan terakhir diubah |
| 🌙 Dark Mode | Toggle antara tema terang dan gelap |
| 📅 Timestamp | Setiap catatan menyimpan `created_at` dan `updated_at` |
| 📴 Offline Ready | Berjalan 100% tanpa koneksi internet |

---

## 🛠️ Teknologi

- **HTML5** — Struktur semantik
- **CSS3** — Custom properties, animasi, dark mode, responsive
- **JavaScript (ES6+)** — Vanilla JS, modular, tanpa framework
- **localStorage** — Penyimpanan data di browser
- **Variable Fonts** — Lora + DM Sans (disimpan lokal)

---

## 📁 Struktur Proyek

```
notespace/
├── index.html        # Struktur halaman utama
├── style.css         # Seluruh styling & tema
├── script.js         # Logic aplikasi
├── fonts/            # Font lokal (offline)
│   ├── Lora-VariableFont_wght.ttf
│   ├── Lora-Italic-VariableFont_wght.ttf
│   ├── DMSans-VariableFont_opsz_wght.ttf
│   └── DMSans-Italic-VariableFont_opsz_wght.ttf
└── README.md
```

---

## 🚀 Cara Menjalankan

Tidak perlu install apapun. Cukup:

```bash
# 1. Clone repository
git clone https://github.com/dilbar181/NoteSpace.git

# 2. Masuk ke folder
cd notespace

# 3. Buka di browser
# Double-click index.html
# atau buka via browser: File → Open File → index.html
```

---

## 🗺️ Rencana Pengembangan

Versi selanjutnya akan dikembangkan menggunakan:

- [ ] **Backend** — Laravel 11 REST API
- [ ] **Database** — MySQL dengan Eloquent ORM
- [ ] **Auth** — Sistem login & registrasi user (Laravel Sanctum)
- [ ] **Multi-device** — Catatan tersinkron antar perangkat
- [ ] **Tags / Label** — Kategorisasi catatan
- [ ] **Export** — Ekspor catatan ke PDF / Markdown
- [ ] **Rich Text** — Editor dengan formatting (bold, italic, list)
- [ ] **Share** — Bagikan catatan via link publik

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan pribadi dan portfolio.
Bebas digunakan dan dimodifikasi sesuai kebutuhan.

---

<p align="center">
  Dibuat dengan ☕ dan semangat belajar
</p>
