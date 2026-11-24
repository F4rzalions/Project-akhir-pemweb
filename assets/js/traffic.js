// Modul data: konfigurasi kategori/level + helper untuk data APP.items dari server
const Traffic = (() => {
  // Kategori informasi: label, warna, ikon, dan teks status bawaan
  const CATEGORIES = {
    traffic_light:      { label: "Lampu Lalu Lintas", title: "LAMPU LALU LINTAS",     color: "#2563EB", icon: "traffic-cone" },
    road_damage:        { label: "Jalan Rusak",       title: "JALAN RUSAK",           color: "#8B5CF6", icon: "triangle-alert", status: "Jalan rusak" },
    road_construction:  { label: "Perbaikan Jalan",   title: "JALAN DALAM PERBAIKAN", color: "#F97316", icon: "construction",   status: "Sedang dalam perbaikan" },
    traffic_congestion: { label: "Kemacetan",         title: "KONDISI LALU LINTAS",   color: "#EF4444", icon: "car" },
    road_closure:       { label: "Jalan Ditutup",     title: "PENUTUPAN JALAN",       color: "#DC2626", icon: "ban",            status: "Jalan ditutup", line: "closed" }
  };

  // Fase lampu lalu lintas
  const LIGHTS = {
    red:    { label: "Merah",  text: "Kendaraan berhenti",       color: "#EF4444" },
    yellow: { label: "Kuning", text: "Pergantian fase lampu",    color: "#F59E0B" },
    green:  { label: "Hijau",  text: "Kendaraan dapat berjalan", color: "#22C55E" }
  };

  // Tingkat kepadatan + gaya garis di peta
  const LEVELS = {
    smooth:    { label: "Lancar",           style: { color: "#22C55E", weight: 6 } },
    slow:      { label: "Melambat",         style: { color: "#F59E0B", weight: 6 } },
    heavy:     { label: "Padat",            style: { color: "#F97316", weight: 7 } },
    congested: { label: "Kemacetan tinggi", style: { color: "#EF4444", weight: 7 } },
    closed:    { label: "Jalan ditutup",    style: { color: "#DC2626", weight: 7, dashArray: "10, 10" } }
  };

  // Status validasi laporan oleh admin
  const VALIDATION = { pending: "Menunggu validasi", approved: "Disetujui", rejected: "Ditolak" };

  // Buang data dengan tipe tidak dikenal atau koordinat tidak valid
  const isValid = i => CATEGORIES[i.type] && Number.isFinite(i.latitude) && Number.isFinite(i.longitude);
  const items = APP.items.filter(isValid);

  const all = () => items;
  const visible = () => items.filter(i => i.status === "approved"); // hanya yang disetujui tampil di peta
  const byId = id => items.find(i => i.id === id);
  // Hitung jumlah item per nilai field (mis. per type / status)
  const countBy = (key, list = items) => list.reduce((n, i) => (n[i[key]] = (n[i[key]] || 0) + 1, n), {});

  const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
  // Format ISO -> "24 November 2026, 10.30 WIB"
  function formatTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${dateFmt.format(d)}, ${timeFmt.format(d)} WIB`;
  }

  // Teks status yang ditampilkan sesuai tipe item
  function statusText(i) {
    if (i.type === "traffic_light") return `Lampu ${LIGHTS[i.light]?.label || "-"} — ${LIGHTS[i.light]?.text || ""}`;
    if (i.type === "traffic_congestion") return LEVELS[i.level]?.label || "Perlambatan";
    return CATEGORIES[i.type].status;
  }

  return { CATEGORIES, LIGHTS, LEVELS, VALIDATION, all, visible, byId, countBy, formatTime, statusText };
})();
