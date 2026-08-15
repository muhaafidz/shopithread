# 📦 Shopee Affiliate Downloader, CSV Dashboard & Threads Content Generator

[![CI/CD & Chrome Extension Release Package](https://github.com/sodikinnaa/shopee-affiliate-threads-extension/actions/workflows/ci-cd-release.yml/badge.svg)](https://github.com/sodikinnaa/shopee-affiliate-threads-extension/actions/workflows/ci-cd-release.yml)
[![Latest Release](https://img.shields.io/github/v/release/sodikinnaa/shopee-affiliate-threads-extension?color=orange&label=Release)](https://github.com/sodikinnaa/shopee-affiliate-threads-extension/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Ekstensi Google Chrome modern untuk para kreator & affiliate marketer Shopee guna mempermudah proses kurasi produk, pembuatan link affiliate resmi, manajemen database CSV produk, dan pembuatan materi konten viral untuk Meta Threads.

---

## ✨ Fitur Unggulan

### 1. 🔍 Scraper Multi-Halaman & Foto HD Shopee Affiliate
- **Auto Detect & Pagination**: Otomatis menjelajah hingga 10 halaman penawaran produk Shopee Affiliate ([https://affiliate.shopee.co.id/offer/product_offer](https://affiliate.shopee.co.id/offer/product_offer)).
- **Ekstraksi Shortlink Resmi**: Mengklik tombol *"Buat Link"*, mengambil shortlink `s.shopee.co.id` / `shope.ee`, dan menutup modal secara otomatis.
- **Pembersihan Foto HD**: Mengunduh foto asli resolusi penuh tanpa kompresi `@resize`.

### 2. 📊 Dedicated Dashboard & Manajemen CSV (RFC 4180)
- **Tabel Interaktif**: Preview foto produk, harga, komisi, total terjual, dan status link.
- **Ekspor Fleksibel**: 1-Klik ekspor ke file **CSV**, **TXT**, atau arsip **ZIP** foto produk.
- **Impor CSV**: Drag & drop file CSV produk untuk dimasukkan ke database dashboard.
- **CRUD Penuh**: Tambah, edit detail produk, salin link 1-klik, dan hapus data dengan proteksi storage anti-corrupt.

### 3. 🧵 Generator Konten Threads (Clean & Non Auto-Posting)
- **Format Teks Bersih**: Bebas dari broken icon/emoji unicode yang sering gagal di-render oleh Threads web.
- **Template Copywriting Variatif**:
  - *Gaya Santai / Racun Shopee (High Viral)*
  - *Gaya Review Jujur / Honest Review*
  - *Gaya Promo Diskon / Flash Sale Alert*
  - *Gaya Solusi Praktis & Lifehack*
  - *Gaya Singkat & To The Point*
- **Engine Spintax**: Mengacak variasi kata & hook secara otomatis (`🎲 Acak Variasi`).
- **Pembersih Simbol**: Tombol 1-klik `🧹 Bersihkan Simbol` untuk memastikan teks caption 100% kompatibel.
- **Assisted Posting**: Tombol `📋 Salin Caption Threads`, `🔗 Buka Threads.net`, dan `✍️ Isi ke Threads Tab` (tanpa klik kirim otomatis, menjaga kontrol penuh kreator).

---

## 🚀 Cara Download & Pasang Ekstensi (Siap Import)

### Metode 1: Download Versi Rilis Siap Import (Rekomendasi)
1. Buka halaman **[Releases Terbaru](https://github.com/sodikinnaa/shopee-affiliate-threads-extension/releases/latest)**.
2. Download file asset **`shopee-affiliate-threads-extension-v1.0.0.zip`**.
3. Ekstrak file ZIP tersebut di folder komputer Anda.
4. Buka Google Chrome lalu masuk ke URL: `chrome://extensions`.
5. Aktifkan **Developer mode** (Mode Pengembang) di pojok kanan atas.
6. Klik tombol **Load unpacked** (Muat yang belum dibongkar), lalu pilih folder hasil ekstrak tadi.
7. Ekstensi siap digunakan! 🎉

---

## 📁 Struktur Modul Project (Clean Architecture)

```
.
├── .github/workflows/
│   └── ci-cd-release.yml           # CI/CD pipeline & automated release zip packaging
├── libs/
│   ├── csv-service.js              # Layanan generator/parser CSV RFC 4180, TXT & ZIP
│   ├── storage-service.js          # Abstraksi chrome.storage.local dengan fallback localStorage
│   ├── shopee-scraper-service.js   # Scraper DOM multi-halaman & shortlink extractor
│   ├── threads-content-service.js  # Generator caption Threads, spintax, & text cleaner
│   └── jszip.min.js                # Library JSZip kompresi gambar
├── dashboard/
│   ├── dashboard.html              # Dedicated Dashboard UI (Tabel Produk, Threads Generator, CSV)
│   ├── dashboard.css               # Styling Glassmorphism modern
│   └── dashboard.js                # Controller & event listener dashboard
├── popup/
│   ├── popup.html                  # Toolbar mini popup
│   ├── popup.css                   # Toolbar styling
│   └── popup.js                    # Quick trigger controller
├── content.js                      # In-page orchestrator & floating UI pada Shopee
├── content.css                     # Floating panel styling
├── background.js                   # Service Worker background message router
├── manifest.json                   # Chrome Extension Manifest V3
└── test-dashboard.js               # Unit & integration test suite
```

---

## 🧪 Validasi Sintaks & Testing

Untuk menjalankan pengujian otomatis:
```bash
npm test
# atau
node -c libs/*.js content.js dashboard/dashboard.js popup/popup.js background.js && node test-dashboard.js
```

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Bebas digunakan dan dikembangkan untuk komunitas affiliate marketing.
