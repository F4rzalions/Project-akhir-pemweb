<?php
require_once 'koneksi.php';
$user = cek_login('admin');

$TYPES = ['traffic_light' => 'Lampu Lalu Lintas', 'road_damage' => 'Jalan Rusak', 'road_construction' => 'Perbaikan Jalan',
          'traffic_congestion' => 'Kemacetan', 'road_closure' => 'Jalan Ditutup'];
$LIGHTS = ['red' => 'Merah', 'yellow' => 'Kuning', 'green' => 'Hijau'];
$LEVELS = ['smooth' => 'Lancar', 'slow' => 'Melambat', 'heavy' => 'Padat', 'congested' => 'Kemacetan tinggi'];
$STATUSES = ['pending' => 'Menunggu', 'approved' => 'Disetujui', 'rejected' => 'Ditolak'];

$id = (int) ($_GET['id'] ?? 0);
$item = ['type' => 'road_damage', 'name' => '', 'location' => '', 'latitude' => '', 'longitude' => '', 'light' => 'red',
         'level' => 'slow', 'path' => '', 'description' => '', 'photo' => null, 'status' => 'approved'];

if ($id) {
    $stmt = mysqli_prepare($koneksi, 'SELECT * FROM traffic_items WHERE id = ?');
    mysqli_stmt_bind_param($stmt, 'i', $id);
    mysqli_stmt_execute($stmt);
    $item = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$item) {
        header('Location: admin.php');
        exit;
    }
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $foto = $item['photo'];
    $item = array_merge($item, array_map('trim', array_intersect_key($_POST, $item)));
    $item['photo'] = $foto;
    $light = $item['type'] === 'traffic_light' ? $item['light'] : null;
    $level = $item['type'] === 'traffic_congestion' ? $item['level'] : null;
    $path = $item['path'] !== '' ? $item['path'] : null;
    $lat = (float) $item['latitude'];
    $lng = (float) $item['longitude'];

    if (!isset($TYPES[$item['type']]) || !isset($STATUSES[$item['status']])) {
        $error = 'Kategori atau status tidak valid.';
    } elseif ($item['name'] === '' || $item['location'] === '') {
        $error = 'Judul dan lokasi wajib diisi.';
    } elseif ($lat < -8.21 || $lat > -7.54 || $lng < 110.0 || $lng > 110.85) {
        $error = 'Koordinat harus berada di wilayah Yogyakarta.';
    } elseif ($path !== null && !is_array(json_decode($path))) {
        $error = 'Jalur garis harus berupa JSON, contoh [[-7.76,110.39],[-7.76,110.41]].';
    } else {
        [$fotoBaru, $error] = upload_foto($_FILES['photo'] ?? null);
    }

    if ($error === '') {
        if ($fotoBaru || isset($_POST['hapus_foto'])) {
            hapus_foto($foto);
            $foto = $fotoBaru;
        }
        if ($id) {
            $stmt = mysqli_prepare($koneksi,
                'UPDATE traffic_items SET type = ?, name = ?, location = ?, latitude = ?, longitude = ?, light = ?, level = ?,
                 path = ?, description = ?, photo = ?, status = ? WHERE id = ?');
            mysqli_stmt_bind_param($stmt, 'sssddssssssi', $item['type'], $item['name'], $item['location'], $lat, $lng,
                $light, $level, $path, $item['description'], $foto, $item['status'], $id);
        } else {
            $stmt = mysqli_prepare($koneksi,
                'INSERT INTO traffic_items (type, name, location, latitude, longitude, light, level, path, description, photo, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            mysqli_stmt_bind_param($stmt, 'sssddssssss', $item['type'], $item['name'], $item['location'], $lat, $lng,
                $light, $level, $path, $item['description'], $foto, $item['status']);
        }
        mysqli_stmt_execute($stmt);
        header('Location: admin.php?status=' . urlencode($item['status']));
        exit;
    }
}
function opsi($daftar, $pilih)
{
    $html = '';
    foreach ($daftar as $nilai => $label) {
        $html .= '<option value="' . e($nilai) . '"' . ($nilai === $pilih ? ' selected' : '') . '>' . e($label) . '</option>';
    }
    return $html;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Traffic — <?= $id ? 'Edit' : 'Tambah' ?> Data</title>
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
      <a href="admin.php" class="pill"><i data-lucide="arrow-left"></i><span>Kembali</span></a>
      <span id="user-chip" class="user-chip"><?= e($user['name']) ?><small>Admin</small></span>
      <a id="logout" href="logout.php" class="icon-btn" title="Keluar"><i data-lucide="log-out"></i></a>
    </nav>
  </header>

  <main class="admin-main">
    <h1><?= $id ? 'Edit Data' : 'Tambah Data' ?></h1>
    <p class="muted">Data yang berstatus Disetujui akan tampil di peta.</p>

    <form class="form-card" method="post" enctype="multipart/form-data">
      <label class="field"><span>Kategori</span><select name="type" id="type"><?= opsi($TYPES, $item['type']) ?></select></label>
      <label class="field" data-for="traffic_light"><span>Warna lampu</span><select name="light"><?= opsi($LIGHTS, $item['light']) ?></select></label>
      <label class="field" data-for="traffic_congestion"><span>Tingkat kemacetan</span><select name="level"><?= opsi($LEVELS, $item['level']) ?></select></label>
      <label class="field"><span>Judul</span><input name="name" required maxlength="80" value="<?= e($item['name']) ?>"></label>
      <label class="field"><span>Lokasi / nama jalan</span><input name="location" required maxlength="120" value="<?= e($item['location']) ?>"></label>
      <div class="field-row">
        <label class="field"><span>Latitude</span><input name="latitude" required placeholder="-7.7626" value="<?= e($item['latitude']) ?>"></label>
        <label class="field"><span>Longitude</span><input name="longitude" required placeholder="110.4087" value="<?= e($item['longitude']) ?>"></label>
      </div>
      <label class="field"><span>Jalur garis (opsional, JSON [[lat, lng], ...])</span><textarea name="path" rows="2"><?= e($item['path']) ?></textarea></label>
      <label class="field"><span>Keterangan</span><textarea name="description" rows="3" maxlength="1000"><?= e($item['description']) ?></textarea></label>
      <label class="field"><span>Status</span><select name="status"><?= opsi($STATUSES, $item['status']) ?></select></label>
      <label class="field"><span>Foto (opsional, JPG/PNG, maks 2 MB)</span><input name="photo" type="file" accept="image/jpeg,image/png"></label>
      <?php if ($item['photo']): ?>
        <div class="photo-current">
          <img src="<?= e($item['photo']) ?>" alt="Foto saat ini">
          <label><input type="checkbox" name="hapus_foto" value="1"> Hapus foto ini</label>
        </div>
      <?php endif; ?>
      <p class="form-error" role="alert"><?= e($error) ?></p>
      <div class="dialog-actions">
        <a href="admin.php" class="btn">Batal</a>
        <button type="submit" class="btn btn--primary">Simpan</button>
      </div>
    </form>
  </main>

  <script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
  <script src="assets/js/util.js"></script>
  <script>
    const type = document.querySelector("#type");
    const toggle = () => document.querySelectorAll("[data-for]").forEach(f => { f.hidden = f.dataset.for !== type.value; });
    type.onchange = toggle;
    toggle();
    icons();
  </script>
</body>
</html>
