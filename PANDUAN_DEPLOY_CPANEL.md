# Catatan migrasi deployment

Panduan prototipe cPanel sebelumnya sudah diganti oleh [README.md](README.md).

Deployment tujuan adalah Node.js Web App Hostinger dengan Node.js 24, Express, dan MySQL persisten. Gunakan build `npm run build` dan entry `server.js`. Jangan mengunggah hanya `dist/` sebagai situs statis.

Kredensial dan `SESSION_SECRET` wajib diisi sendiri melalui Environment Variables Hostinger. Aplikasi tidak menyediakan akun atau secret bawaan.

Database produksi menggunakan MySQL. Ekspor SQL dari aplikasi merupakan snapshot untuk pertukaran data, bukan backup lengkap tabel penyimpanan aktif. Gunakan ekspor/import JSON aplikasi atau backup database MySQL untuk pemulihan.

Pastikan backup, HTTPS, serta pengujian login dan simpan data selesai sebelum digunakan tim.
