# Smart Traffic Information System

Peta informasi lalu lintas wilayah D.I. Yogyakarta (Leaflet + OpenStreetMap) dengan PHP native + MySQL.
Data, akun, dan laporan disimpan di database; admin memvalidasi laporan sebelum tampil di peta.

## Cara menjalankan (XAMPP)

1. Salin folder project ke `C:\xampp\htdocs\smart-traffic`.
2. Buka **XAMPP Control Panel**, jalankan **Apache** dan **MySQL**.
3. Buka `http://localhost/phpmyadmin` → tab **Import** → pilih file `database.sql` → **Import**.
   File ini membuat database `smart_traffic` (beserta tabel dan data awal). Import ulang akan mereset semua data.
4. Buka `http://localhost/smart-traffic/` di browser.

Koneksi database ada di `koneksi.php` (default XAMPP: user `root`, tanpa password).
Butuh internet untuk tile peta, Leaflet, dan ikon Lucide (CDN).

## Akun demo

| Role | Username / Password | Hak akses |
|------|---------------------|-----------|
| Admin | `admin` / `admin123` | Lihat peta, kirim laporan, validasi & kelola data (CRUD) |
| Pengguna | `user` / `user123` | Lihat peta, kirim laporan (status *pending* sampai disetujui admin) |

Pendaftaran lewat halaman login selalu membuat akun **Pengguna**.

## Struktur folder

```
smart-traffic/
├── database.sql      struktur tabel + data awal (import di phpMyAdmin)
├── koneksi.php       koneksi mysqli, session, fungsi bantu (cek login, upload foto)
├── login.php         form masuk & daftar
├── logout.php        hapus session -> login.php
├── index.php         peta + simpan laporan (form Lapor)
├── admin.php         daftar data per status + aksi Setujui / Tolak / Hapus
├── tambah.php        tambah data (memakai form di edit.php)
├── edit.php          form tambah / ubah data
├── uploads/          foto laporan (.htaccess mencegah file PHP dijalankan)
└── assets/
    ├── css/          style.css, auth.css, admin.css
    └── js/           util.js, traffic.js, map.js, detail.js, app.js, admin.js
```

## Alur data

- PHP mengambil data dari database lalu mengirimnya ke JavaScript lewat `json_encode` di tag `<script>` (variabel `APP`).
  `index.php` hanya mengirim data berstatus `approved`; `admin.php` mengirim semua data.
- Form **Lapor** dikirim (POST) ke `index.php`, disimpan dengan status `pending`. Boleh melampirkan 1 foto JPG/PNG maks. 2 MB.
- Aksi admin memakai form POST biasa lalu redirect kembali ke `admin.php`.
- Kolom `path` berisi garis jalan (JSON `[[lat, lng], ...]`) untuk kemacetan/penutupan jalan.

Seluruh data adalah **simulasi** dan bukan kondisi lalu lintas aktual.
