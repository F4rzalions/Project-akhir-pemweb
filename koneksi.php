<?php
session_start();
date_default_timezone_set('Asia/Jakarta');

$koneksi = mysqli_connect('localhost', 'root', '', 'smart_traffic');
if (!$koneksi) {
    die('Koneksi database gagal: ' . mysqli_connect_error());
}
mysqli_set_charset($koneksi, 'utf8mb4');

function e($teks)
{
    return htmlspecialchars((string) $teks, ENT_QUOTES, 'UTF-8');
}

function cek_login($role = null)
{
    if (empty($_SESSION['user'])) {
        header('Location: login.php');
        exit;
    }
    if ($role && $_SESSION['user']['role'] !== $role) {
        header('Location: index.php');
        exit;
    }
    return $_SESSION['user'];
}
function ambil_items($koneksi, $status = '')
{
    $sql = 'SELECT t.*, u.username AS reporter FROM traffic_items t LEFT JOIN users u ON u.id = t.reported_by';
    if ($status) {
        $stmt = mysqli_prepare($koneksi, "$sql WHERE t.status = ? ORDER BY t.id");
        mysqli_stmt_bind_param($stmt, 's', $status);
    } else {
        $stmt = mysqli_prepare($koneksi, "$sql ORDER BY t.created_at DESC");
    }
    mysqli_stmt_execute($stmt);
    $hasil = mysqli_stmt_get_result($stmt);

    $items = [];
    while ($r = mysqli_fetch_assoc($hasil)) {
        $items[] = [
            'id'          => (int) $r['id'],
            'type'        => $r['type'],
            'name'        => $r['name'],
            'location'    => $r['location'],
            'latitude'    => (float) $r['latitude'],
            'longitude'   => (float) $r['longitude'],
            'light'       => $r['light'],
            'level'       => $r['level'],
            'path'        => $r['path'] ? json_decode($r['path']) : null,
            'description' => $r['description'],
            'photo'       => $r['photo'],
            'status'      => $r['status'],
            'reportedBy'  => $r['reporter'],
            'updatedAt'   => str_replace(' ', 'T', $r['created_at']),
        ];
    }
    return $items;
}
function upload_foto($file)
{
    if (empty($file) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return [null, ''];
    }
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 2 * 1024 * 1024) {
        return [null, 'Foto gagal diunggah. Ukuran maksimal 2 MB.'];
    }
    $info = @getimagesize($file['tmp_name']); // cek isi file, bukan hanya ekstensinya
    $jenis = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
    if (!$info || !isset($jenis[$info['mime']])) {
        return [null, 'Foto harus berformat JPG atau PNG.'];
    }
    $path = 'uploads/foto_' . bin2hex(random_bytes(8)) . '.' . $jenis[$info['mime']];
    if (!move_uploaded_file($file['tmp_name'], __DIR__ . '/' . $path)) {
        return [null, 'Foto gagal disimpan.'];
    }
    return [$path, ''];
}

function hapus_foto($path)
{
    if ($path && is_file(__DIR__ . '/' . $path)) {
        unlink(__DIR__ . '/' . $path);
    }
}
