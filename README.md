# Smart Traffic Information System

Prototype peta informasi lalu lintas wilayah D.I. Yogyakarta (Leaflet + OpenStreetMap, data simulasi, validasi admin via LocalStorage). Peta dikunci ke batas DIY; area di luar Yogyakarta digelapkan dan tidak bisa digeser keluar.

## Menjalankan

Data dimuat dengan `fetch`, jadi buka lewat server lokal (bukan double-click `file://`):

```bash
npx serve .            # lalu buka http://localhost:3000
# atau: python -m http.server 8000
# atau: salin folder ke C:\xampp\htdocs dan buka http://localhost/smart-traffic-system
# atau: VS Code "Live Server"
```

Butuh koneksi internet untuk tile peta, Leaflet, dan ikon Lucide (CDN).

## Halaman

- `login.html` — masuk / daftar akun.
- `index.html` — peta, filter kategori, legenda, detail informasi, pencarian, tombol **Lapor**.
- `admin.html` — validasi informasi (Setujui / Tolak), khusus admin. Tombol ↺ mengembalikan data ke kondisi awal (laporan pengguna ikut terhapus).

## Akun & role

| Role | Akun demo | Hak akses |
|------|-----------|-----------|
| Admin | `admin` / `admin123` | Lihat peta, kirim laporan, halaman validasi |
| Pengguna | `user` / `user123` | Lihat peta, kirim laporan (status *pending* sampai disetujui admin) |

Pendaftaran lewat `login.html` selalu membuat akun **Pengguna**. Akun, sesi, dan laporan disimpan di LocalStorage browser — ini hanya simulasi login untuk prototype, **tidak aman** (password tersimpan polos dan bisa dilewati lewat DevTools). Untuk produksi, autentikasi dan otorisasi harus di server.

## Data

`data/traffic-data.json` berisi lampu lalu lintas (`light`: red/yellow/green) dan kondisi jalan.
Field `status` (pending/approved/rejected) adalah status validasi; hanya `approved` yang tampil di peta.
Item kemacetan/penutupan dapat memiliki `path` (array `[lat, lng]`) untuk digambar sebagai garis; `level` kemacetan: smooth, slow, heavy, congested.

Seluruh data adalah **simulasi** dan bukan kondisi lalu lintas aktual.
