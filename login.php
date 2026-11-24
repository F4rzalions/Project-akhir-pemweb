<?php
require 'koneksi.php';

if (!empty($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}

$mode = ($_POST['mode'] ?? 'login') === 'register' ? 'register' : 'login';
$error = '';
$username = strtolower(trim($_POST['username'] ?? ''));
$password = $_POST['password'] ?? '';
$name = trim($_POST['name'] ?? '');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($mode === 'register') {
        $stmt = mysqli_prepare($koneksi, 'SELECT id FROM users WHERE username = ?');
        mysqli_stmt_bind_param($stmt, 's', $username);
        mysqli_stmt_execute($stmt);
        $sudahAda = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

        if (!preg_match('/^[a-z0-9_]{3,20}$/', $username)) {
            $error = 'Username 3–20 karakter (huruf kecil, angka, _).';
        } elseif (strlen($password) < 6) {
            $error = 'Password minimal 6 karakter.';
        } elseif ($sudahAda) {
            $error = 'Username sudah dipakai.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $nama = $name !== '' ? $name : $username;
            $stmt = mysqli_prepare($koneksi, "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, 'user')");
            mysqli_stmt_bind_param($stmt, 'sss', $username, $hash, $nama);
            mysqli_stmt_execute($stmt);
        }
    }

    if ($error === '') {
        $stmt = mysqli_prepare($koneksi, 'SELECT id, username, password, name, role FROM users WHERE username = ?');
        mysqli_stmt_bind_param($stmt, 's', $username);
        mysqli_stmt_execute($stmt);
        $user = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

        if ($user && password_verify($password, $user['password'])) {
            session_regenerate_id(true);
            unset($user['password']);
            $_SESSION['user'] = $user;
            header('Location: index.php');
            exit;
        }
        $error = 'Username atau password salah.';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Traffic — Masuk</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body class="auth">
  <main class="auth-card">
    <div class="brand">
      <span class="brand-logo"><i data-lucide="traffic-cone"></i></span>
      <span>SMART <b>TRAFFIC</b></span>
    </div>
    <p class="muted">Informasi lalu lintas wilayah Yogyakarta</p>

    <div class="auth-tabs" role="tablist">
      <button type="button" data-mode="login">Masuk</button>
      <button type="button" data-mode="register">Daftar</button>
    </div>

    <form id="auth-form" method="post" action="login.php" novalidate>
      <input type="hidden" name="mode" value="<?= e($mode) ?>">
      <label class="field" data-only="register" hidden>
        <span>Nama</span>
        <input name="name" autocomplete="name" maxlength="60" value="<?= e($name) ?>">
      </label>
      <label class="field">
        <span>Username</span>
        <input name="username" autocomplete="username" required value="<?= e($username) ?>">
      </label>
      <label class="field">
        <span>Password</span>
        <input name="password" type="password" autocomplete="current-password" required>
      </label>
      <p id="auth-error" class="auth-error" role="alert"><?= e($error) ?></p>
      <button class="btn btn--primary" type="submit">Masuk</button>
    </form>

    <div id="demo-accounts" class="demo-accounts">
      <small>AKUN DEMO</small>
      <button type="button" class="btn" data-username="admin" data-password="admin123">
        <i data-lucide="shield-check"></i><span><b>Administrator</b> admin / admin123</span>
      </button>
      <button type="button" class="btn" data-username="user" data-password="user123">
        <i data-lucide="user"></i><span><b>Pengguna</b> user / user123</span>
      </button>
    </div>
    <p class="muted fine">Akun disimpan di database MySQL.</p>
  </main>

  <script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
  <script src="assets/js/util.js"></script>
  <script>
    (() => {
      const form = document.querySelector("#auth-form");

      const setMode = m => {
        form.mode.value = m;
        document.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("active", b.dataset.mode === m));
        form.querySelector("[data-only=register]").hidden = m !== "register";
        form.querySelector("[type=submit]").textContent = m === "login" ? "Masuk" : "Daftar sebagai Pengguna";
        form.password.autocomplete = m === "login" ? "current-password" : "new-password";
      };
      document.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => {
        setMode(b.dataset.mode);
        document.querySelector("#auth-error").textContent = "";
      });
      setMode(form.mode.value);

      document.querySelectorAll("[data-username]").forEach(b => b.onclick = () => {
        setMode("login");
        form.username.value = b.dataset.username;
        form.password.value = b.dataset.password;
        form.submit();
      });

      icons();
    })();
  </script>
</body>
</html>
