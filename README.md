# GlobeNews Real-Time 🌍

Versi ini memakai **GNews API** melalui backend Node.js/Express agar API key tidak ditaruh di browser.

## Penting tentang "real-time"

GNews menyatakan paket berbayarnya menyediakan artikel secara real-time, sedangkan paket Free memiliki delay 12 jam dan ditujukan untuk pengembangan/pengujian. Jadi aplikasi ini siap untuk feed live, tetapi untuk benar-benar real-time Anda harus menggunakan paket/API yang memberikan akses real-time.

## 1. Siapkan API key

Buat akun di https://gnews.io/ lalu ambil API key.

Salin `.env.example` menjadi `.env`, kemudian isi:

GNEWS_API_KEY=API_KEY_ANDA

Jangan upload `.env` ke GitHub.

## 2. Jalankan

```bash
npm install
npm start
```

Buka `http://localhost:3000`.

## 3. Deploy

GitHub Pages hanya cocok untuk frontend statis dan tidak menjalankan server Node.js. Backend GlobeNews harus diletakkan di hosting yang mendukung Node.js (misalnya Render, Railway, VPS, atau layanan serverless), lalu frontend diarahkan ke URL backend.

Untuk penggunaan produksi:
- gunakan HTTPS
- simpan API key sebagai environment variable
- jangan commit `.env`
- tambahkan database untuk komentar, akun, like, bookmark, dan notifikasi multi-user
- hormati lisensi, atribusi, copyright, dan ketentuan API setiap sumber berita

## Fitur

- Negara
- Kategori
- Pencarian judul
- Auto-refresh 30 detik
- Status LIVE
- Waktu publikasi
- Link ke sumber asli
- Like lokal di browser
- Fallback demo saat API belum diisi
