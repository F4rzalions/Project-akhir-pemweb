// Data manager: loads mock JSON, overlays admin decisions and user reports from LocalStorage.
const Traffic = (() => {
  const STATUS_KEY = "stis-status-v1";
  const REPORTS_KEY = "stis-reports-v1";
  const DATA_URL = "data/traffic-data.json";

  // `status`: fixed status text; `line`: forced road-line level (else item.level).
  const CATEGORIES = {
    traffic_light:      { label: "Lampu Lalu Lintas", title: "LAMPU LALU LINTAS",     color: "#2563EB", icon: "traffic-cone" },
    road_damage:        { label: "Jalan Rusak",       title: "JALAN RUSAK",           color: "#8B5CF6", icon: "triangle-alert", status: "Jalan rusak" },
    road_construction:  { label: "Perbaikan Jalan",   title: "JALAN DALAM PERBAIKAN", color: "#F97316", icon: "construction",   status: "Sedang dalam perbaikan" },
    traffic_congestion: { label: "Kemacetan",         title: "KONDISI LALU LINTAS",   color: "#EF4444", icon: "car" },
    road_closure:       { label: "Jalan Ditutup",     title: "PENUTUPAN JALAN",       color: "#DC2626", icon: "ban",            status: "Jalan ditutup", line: "closed" }
  };

  const LIGHTS = {
    red:    { label: "Merah",  text: "Kendaraan berhenti",       color: "#EF4444" },
    yellow: { label: "Kuning", text: "Pergantian fase lampu",    color: "#F59E0B" },
    green:  { label: "Hijau",  text: "Kendaraan dapat berjalan", color: "#22C55E" }
  };

  const LEVELS = {
    smooth:    { label: "Lancar",           style: { color: "#22C55E", weight: 6 } },
    slow:      { label: "Melambat",         style: { color: "#F59E0B", weight: 6 } },
    heavy:     { label: "Padat",            style: { color: "#F97316", weight: 7 } },
    congested: { label: "Kemacetan tinggi", style: { color: "#EF4444", weight: 7 } },
    closed:    { label: "Jalan ditutup",    style: { color: "#DC2626", weight: 7, dashArray: "10, 10" } }
  };

  const VALIDATION = { pending: "Menunggu validasi", approved: "Disetujui", rejected: "Ditolak" };

  let base = [];
  let items = [];

  const isValid = i => CATEGORIES[i.type] && Number.isFinite(i.latitude) && Number.isFinite(i.longitude);

  function build() {
    const overrides = Store.get(STATUS_KEY, {});
    items = [...base, ...Store.get(REPORTS_KEY, [])]
      .filter(isValid)
      .map(i => ({ ...i, status: overrides[i.id] || i.status || "pending" }));
  }

  async function load() {
    const res = await fetch(DATA_URL, { cache: "no-cache" }).catch(() => null);
    if (!res?.ok) throw new Error("Data gagal dimuat. Jalankan lewat server lokal (lihat README).");
    const data = await res.json();
    base = [...(data.trafficLights || []), ...(data.roadConditions || [])];
    build();
  }

  function setStatus(id, status) {
    Store.set(STATUS_KEY, { ...Store.get(STATUS_KEY, {}), [id]: status });
    byId(id).status = status;
  }

  // User-submitted report; always enters as pending until an admin validates it.
  function addReport(report) {
    const item = { ...report, id: Date.now(), status: "pending", source: "user", updatedAt: new Date().toISOString() };
    Store.set(REPORTS_KEY, [...Store.get(REPORTS_KEY, []), item]);
    items.push(item);
  }

  function reset() {
    Store.del(STATUS_KEY, REPORTS_KEY);
    build();
  }

  const all = () => items;
  const visible = () => items.filter(i => i.status === "approved");
  const byId = id => items.find(i => i.id === id);
  const countBy = (key, list = items) => list.reduce((n, i) => (n[i[key]] = (n[i[key]] || 0) + 1, n), {});

  const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
  function formatTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${dateFmt.format(d)}, ${timeFmt.format(d)} WIB`;
  }

  function statusText(i) {
    if (i.type === "traffic_light") return `Lampu ${LIGHTS[i.light]?.label || "-"} — ${LIGHTS[i.light]?.text || ""}`;
    if (i.type === "traffic_congestion") return LEVELS[i.level]?.label || "Perlambatan";
    return CATEGORIES[i.type].status;
  }

  return { CATEGORIES, LIGHTS, LEVELS, VALIDATION, load, setStatus, addReport, reset, all, visible, byId, countBy, formatTime, statusText };
})();
