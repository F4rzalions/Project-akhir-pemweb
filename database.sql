-- Smart Traffic: import file ini lewat phpMyAdmin (tab Import).
-- Database smart_traffic akan dibuat ulang (data lama terhapus).

DROP DATABASE IF EXISTS smart_traffic;
CREATE DATABASE smart_traffic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_traffic;

CREATE TABLE users (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20)  NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,          -- hasil password_hash()
  name     VARCHAR(60)  NOT NULL,
  role     ENUM('admin','user') NOT NULL DEFAULT 'user'
);

CREATE TABLE traffic_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        VARCHAR(30)  NOT NULL,       -- traffic_light, road_damage, road_construction, traffic_congestion, road_closure
  name        VARCHAR(80)  NOT NULL,
  location    VARCHAR(120) NOT NULL,
  latitude    DECIMAL(9,6) NOT NULL,
  longitude   DECIMAL(9,6) NOT NULL,
  light       VARCHAR(10)  NULL,           -- red / yellow / green (khusus lampu)
  level       VARCHAR(10)  NULL,           -- smooth / slow / heavy / congested (khusus kemacetan)
  path        TEXT         NULL,           -- garis jalan, JSON [[lat,lng], ...]
  description TEXT         NULL,
  photo       VARCHAR(255) NULL,           -- mis. uploads/foto_ab12cd.jpg
  status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reported_by INT NULL,                    -- NULL = data simulasi
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Akun demo: admin / admin123 dan user / user123
INSERT INTO users (username, password, name, role) VALUES
('admin', '$2y$10$3yvWBjQK62gYITB4YJhlQeKtDwov2eX55Qs4Sd3ZuENIU1ChGARfS', 'Administrator', 'admin'),
('user',  '$2y$10$mEbD2pM8/K7xMar7jIHl5uCEaRR9lqDiDZLICJsQ.N7jFaMa2JKbq', 'Pengguna', 'user');

-- Data simulasi (pindahan dari data/traffic-data.json)
INSERT INTO traffic_items (id, type, name, location, latitude, longitude, light, level, path, description, status, created_at) VALUES
(1, 'traffic_light', 'Simpang Empat Condongcatur', 'Ring Road Utara x Jl. Anggajaya', -7.7598, 110.3958, 'red', NULL, NULL, 'Simulasi lampu lalu lintas pada simpang Ring Road Utara.', 'approved', '2026-11-18 15:30:00'),
(2, 'traffic_light', 'Simpang Jl. Seturan Raya', 'Ring Road Utara x Jl. Seturan Raya', -7.7600, 110.4108, 'green', NULL, NULL, 'Simpang padat jam berangkat dan pulang kuliah.', 'approved', '2026-11-18 15:30:00'),
(3, 'traffic_light', 'Simpang Jl. Babarsari', 'Jl. Babarsari x Jl. Tambakbayan', -7.7765, 110.4150, 'yellow', NULL, NULL, 'Pergantian fase lampu (simulasi).', 'approved', '2026-11-18 15:30:00'),
(4, 'traffic_light', 'Simpang Jl. Gejayan', 'Ring Road Utara x Jl. Affandi (Gejayan)', -7.7605, 110.3895, 'red', NULL, NULL, 'Simpang utama menuju kawasan kampus Gejayan.', 'approved', '2026-11-18 15:30:00'),
(5, 'traffic_light', 'Simpang Jl. Padjajaran', 'Ring Road Utara x Jl. Padjajaran', -7.7602, 110.4180, 'green', NULL, NULL, 'Simulasi lampu lalu lintas sisi timur kampus.', 'approved', '2026-11-18 15:30:00'),
(6, 'traffic_light', 'Simpang Jl. Perumnas', 'Jl. Seturan Raya x Jl. Perumnas', -7.7690, 110.4110, 'red', NULL, NULL, 'Lampu lalu lintas sisi selatan Seturan.', 'pending', '2026-11-18 14:10:00'),
(10, 'road_damage', 'Jalan Berlubang Seturan', 'Jl. Seturan Raya', -7.7650, 110.4106, NULL, NULL, NULL, 'Terdapat lubang pada lajur kiri. Kurangi kecepatan.', 'approved', '2026-11-18 13:20:00'),
(11, 'road_damage', 'Aspal Bergelombang Babarsari', 'Jl. Babarsari', -7.7728, 110.4152, NULL, NULL, NULL, 'Permukaan jalan bergelombang sepanjang ±50 m.', 'approved', '2026-11-18 11:00:00'),
(12, 'road_damage', 'Jalan Retak Jl. Tambakbayan', 'Jl. Tambakbayan', -7.7745, 110.4085, NULL, NULL, NULL, 'Retakan memanjang di tengah jalan.', 'pending', '2026-11-18 15:05:00'),
(20, 'road_construction', 'Perbaikan Drainase Ring Road', 'Ring Road Utara (depan UPN)', -7.7608, 110.4060, NULL, NULL, NULL, 'Sedang berlangsung pekerjaan perbaikan saluran drainase di bahu jalan.', 'approved', '2026-11-18 08:00:00'),
(21, 'road_construction', 'Pengaspalan Jl. Kledokan', 'Jl. Kledokan', -7.7700, 110.4125, NULL, NULL, NULL, 'Pengaspalan ulang sebagian ruas jalan.', 'pending', '2026-11-18 09:30:00'),
(30, 'traffic_congestion', 'Kemacetan Ring Road Utara', 'Ring Road Utara, Condongcatur – Seturan', -7.7601, 110.4030, NULL, 'congested', '[[-7.7598,110.3958],[-7.7600,110.3990],[-7.7602,110.4030],[-7.7604,110.4070],[-7.7600,110.4108]]', 'Kepadatan tinggi, kendaraan tersendat.', 'approved', '2026-11-18 15:30:00'),
(31, 'traffic_congestion', 'Perlambatan Jl. Seturan Raya', 'Jl. Seturan Raya', -7.7640, 110.4107, NULL, 'slow', '[[-7.7600,110.4108],[-7.7630,110.4107],[-7.7660,110.4106],[-7.7690,110.4110]]', 'Perlambatan lalu lintas di sekitar kawasan kuliner.', 'approved', '2026-11-18 15:30:00'),
(32, 'traffic_congestion', 'Lalu Lintas Lancar Ring Road Timur', 'Ring Road Utara, Seturan – Padjajaran', -7.7601, 110.4145, NULL, 'smooth', '[[-7.7600,110.4108],[-7.7600,110.4145],[-7.7602,110.4180]]', 'Lalu lintas lancar.', 'approved', '2026-11-18 15:30:00'),
(33, 'traffic_congestion', 'Padat Jl. Babarsari', 'Jl. Babarsari', -7.7740, 110.4151, NULL, 'heavy', '[[-7.7700,110.4150],[-7.7728,110.4152],[-7.7765,110.4150]]', 'Lalu lintas padat, antrean kendaraan.', 'pending', '2026-11-18 15:15:00'),
(40, 'road_closure', 'Penutupan Jl. Kaliwaru', 'Jl. Kaliwaru', -7.7655, 110.4045, NULL, NULL, '[[-7.7625,110.4048],[-7.7655,110.4045],[-7.7685,110.4042]]', 'Jalan ditutup sementara untuk kegiatan warga. Gunakan jalur alternatif.', 'approved', '2026-11-18 07:00:00'),
(41, 'road_closure', 'Penutupan Sebagian Jl. Nusa Indah', 'Jl. Nusa Indah', -7.7680, 110.4170, NULL, NULL, '[[-7.7665,110.4168],[-7.7695,110.4172]]', 'Penutupan karena galian kabel.', 'pending', '2026-11-18 10:45:00');
