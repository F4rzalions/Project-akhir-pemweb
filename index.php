<?php
require 'koneksi.php';
$user = cek_login();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $type = $_POST['type'] ?? '';
    $level = $type === 'traffic_congestion' ? ($_POST['level'] ?? '') : null;
    $name = trim($_POST['name'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $lat = (float) ($_POST['latitude'] ?? 0);
    $lng = (float) ($_POST['longitude'] ?? 0);

    $boleh = ['road_damage', 'road_construction', 'traffic_congestion', 'road_closure'];
    if (!in_array($type, $boleh) || $name === '' || $location === '' || !$lat || !$lng) {
        $_SESSION['pesan'] = 'Laporan gagal: data belum lengkap.';
    } else {
        [$foto, $error] = upload_foto($_FILES['photo'] ?? null);
        if ($error) {
            $_SESSION['pesan'] = 'Laporan gagal: ' . $error;
        } else {
            $stmt = mysqli_prepare($koneksi,
                'INSERT INTO traffic_items (type, name, location, latitude, longitude, level, description, photo, reported_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            mysqli_stmt_bind_param($stmt, 'sssddsssi', $type, $name, $location, $lat, $lng, $level, $description, $foto, $user['id']);
            mysqli_stmt_execute($stmt);
            $_SESSION['pesan'] = 'Laporan terkirim, menunggu validasi admin.';
        }
    }
    header('Location: index.php');
    exit;
}

$items = ambil_items($koneksi, 'approved');
$pesan = $_SESSION['pesan'] ?? '';
unset($_SESSION['pesan']);

$pending = 0;
if ($user['role'] === 'admin') {
    $stmt = mysqli_prepare($koneksi, "SELECT COUNT(*) FROM traffic_items WHERE status = 'pending'");
    mysqli_stmt_execute($stmt);
    mysqli_stmt_bind_result($stmt, $pending);
    mysqli_stmt_fetch($stmt);
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Traffic — Yogyakarta</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="map-page">
  <header class="topbar">
    <a class="brand" href="index.php">
      <span class="brand-logo"><i data-lucide="traffic-cone"></i></span>
      <span>SMART <b>TRAFFIC</b></span>
    </a>
    <div class="search">
      <i data-lucide="search"></i>
      <input id="search" type="search" placeholder="Cari lokasi..." autocomplete="off" aria-label="Cari lokasi">
      <ul id="search-results" class="search-results" hidden></ul>
    </div>
    <nav class="top-actions">
      <button id="report-btn" class="pill" title="Laporkan kondisi jalan">
        <i data-lucide="megaphone"></i><span>Lapor</span>
      </button>
      <?php if ($user['role'] === 'admin'): ?>
      <a id="admin-link" href="admin.php" class="pill" title="Halaman admin">
        <i data-lucide="shield-check"></i><span>Admin</span><em id="pending-count"><?= $pending ?: '' ?></em>
      </a>
      <?php endif; ?>
      <button id="info-btn" class="icon-btn" title="Informasi"><i data-lucide="info"></i></button>
      <span id="user-chip" class="user-chip"><?= e($user['name']) ?><small><?= $user['role'] === 'admin' ? 'Admin' : 'Pengguna' ?></small></span>
      <a id="logout" href="logout.php" class="icon-btn" title="Keluar"><i data-lucide="log-out"></i></a>
    </nav>
  </header>

  <main class="stage">
    <div id="map" aria-label="Peta lalu lintas"></div>

    <aside id="side-panel" class="side-panel">
      <button id="panel-toggle" class="panel-head">
        <span>KONDISI LALU LINTAS</span><i data-lucide="chevron-down"></i>
      </button>
      <div class="panel-body">
        <div id="filters" class="filters"></div>
        <h4>LEGENDA RUAS JALAN</h4>
        <ul id="legend" class="legend"></ul>
      </div>
    </aside>

    <div class="map-controls">
      <button id="zoom-in" title="Perbesar"><i data-lucide="plus"></i></button>
      <button id="zoom-out" title="Perkecil"><i data-lucide="minus"></i></button>
      <button id="home" title="Kembali ke UPN"><i data-lucide="house"></i></button>
      <button id="overview" title="Seluruh Yogyakarta"><i data-lucide="map"></i></button>
      <button id="locate" title="Lokasi saya"><i data-lucide="locate-fixed"></i></button>
    </div>

    <section id="detail" class="detail" aria-hidden="true">
      <header>
        <span>INFORMASI LALU LINTAS</span>
        <button id="detail-close" class="icon-btn" title="Tutup"><i data-lucide="x"></i></button>
      </header>
      <div class="detail-body"></div>
    </section>

    <div id="toast" class="toast" role="status"></div>
  </main>

  <footer class="statusbar">
    <span class="sim-tag"><i data-lucide="flask-conical"></i>Data simulasi</span>
    <span>Wilayah D.I. Yogyakarta</span>
    <span class="muted">Bukan informasi lalu lintas aktual</span>
  </footer>

  <dialog id="info-dialog" class="info-dialog">
    <h3>Tentang Smart Traffic</h3>
    <p>Prototype sistem informasi lalu lintas wilayah Yogyakarta. Klik marker atau garis jalan untuk melihat detail, gunakan panel filter untuk memilih kategori.</p>
    <p>Tombol <strong>Lapor</strong> untuk mengirim kondisi jalan; laporan tampil di peta setelah disetujui admin.</p>
    <p><strong>Seluruh data adalah simulasi</strong> dan tidak merepresentasikan kondisi lalu lintas maupun status lampu yang sebenarnya.</p>
    <p class="muted">Peta © kontributor OpenStreetMap.</p>
    <button id="info-close" class="btn btn--primary">Mengerti</button>
  </dialog>

  <dialog id="report-dialog" class="info-dialog">
    <form id="report-form" method="post" action="index.php" enctype="multipart/form-data">
      <h3>Laporkan Kondisi Jalan</h3>
      <input type="hidden" name="latitude">
      <input type="hidden" name="longitude">
      <label class="field"><span>Kategori</span><select name="type"></select></label>
      <label class="field" id="level-field" hidden><span>Tingkat kemacetan</span><select name="level"></select></label>
      <label class="field"><span>Judul</span><input name="name" required maxlength="80" placeholder="mis. Lubang besar di Jl. Kaliurang"></label>
      <label class="field"><span>Lokasi / nama jalan</span><input name="location" required maxlength="120"></label>
      <label class="field"><span>Keterangan</span><textarea name="description" rows="3" maxlength="300"></textarea></label>
      <label class="field"><span>Foto (opsional, JPG/PNG, maks 2 MB)</span><input name="photo" type="file" accept="image/jpeg,image/png"></label>
      <p class="muted" id="report-point"></p>
      <div class="dialog-actions">
        <button type="button" id="report-cancel" class="btn">Batal</button>
        <button type="submit" class="btn btn--primary">Kirim Laporan</button>
      </div>
    </form>
  </dialog>

  <script>
    const APP = <?= json_encode([
        'user'  => ['username' => $user['username'], 'role' => $user['role']],
        'items' => $items,
        'pesan' => $pesan,
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?>;
  </script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
  <script src="assets/js/util.js"></script>
  <script src="assets/js/traffic.js"></script>
  <script src="assets/js/map.js"></script>
  <script src="assets/js/detail.js"></script>
  <script src="assets/js/app.js"></script>
</body>
</html>
