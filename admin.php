<?php
require 'koneksi.php';
$user = cek_login('admin');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int) ($_POST['id'] ?? 0);
    $aksi = $_POST['aksi'] ?? '';

    if ($aksi === 'approved' || $aksi === 'rejected') {
        $stmt = mysqli_prepare($koneksi, 'UPDATE traffic_items SET status = ? WHERE id = ?');
        mysqli_stmt_bind_param($stmt, 'si', $aksi, $id);
        mysqli_stmt_execute($stmt);
    } elseif ($aksi === 'hapus') {
        $stmt = mysqli_prepare($koneksi, 'SELECT photo FROM traffic_items WHERE id = ?');
        mysqli_stmt_bind_param($stmt, 'i', $id);
        mysqli_stmt_execute($stmt);
        $item = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

        $stmt = mysqli_prepare($koneksi, 'DELETE FROM traffic_items WHERE id = ?');
        mysqli_stmt_bind_param($stmt, 'i', $id);
        mysqli_stmt_execute($stmt);
        hapus_foto($item['photo'] ?? null);
    }
    header('Location: admin.php?status=' . urlencode($_POST['status'] ?? 'pending'));
    exit;
}

$items = ambil_items($koneksi);
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Traffic — Admin</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/admin.css">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="index.php">
      <span class="brand-logo"><i data-lucide="traffic-cone"></i></span>
      <span>SMART <b>TRAFFIC</b> — ADMIN</span>
    </a>
    <nav class="top-actions" style="margin-left:auto">
      <a href="index.php" class="pill"><i data-lucide="map"></i><span>Lihat Peta</span></a>
      <span id="user-chip" class="user-chip"><?= e($user['name']) ?><small>Admin</small></span>
      <a id="logout" href="logout.php" class="icon-btn" title="Keluar"><i data-lucide="log-out"></i></a>
    </nav>
  </header>

  <main class="admin-main">
    <div class="admin-head">
      <div>
        <h1>Validasi Informasi</h1>
        <p class="muted">Informasi yang disetujui akan tampil di peta.</p>
      </div>
      <a href="tambah.php" class="btn btn--primary"><i data-lucide="plus"></i>Tambah Data</a>
    </div>
    <div class="tabs" role="tablist">
      <button data-tab="pending">Menunggu <span class="count">0</span></button>
      <button data-tab="approved">Disetujui <span class="count">0</span></button>
      <button data-tab="rejected">Ditolak <span class="count">0</span></button>
    </div>
    <section id="admin-list" class="admin-list"></section>
  </main>

  <dialog id="detail-dialog" class="info-dialog">
    <div class="detail-body"></div>
    <button id="dialog-close" class="btn btn--primary">Tutup</button>
  </dialog>

  <script>
    const APP = <?= json_encode(['items' => $items], JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?>;
  </script>
  <script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
  <script src="assets/js/util.js"></script>
  <script src="assets/js/traffic.js"></script>
  <script src="assets/js/detail.js"></script>
  <script src="assets/js/admin.js"></script>
</body>
</html>
