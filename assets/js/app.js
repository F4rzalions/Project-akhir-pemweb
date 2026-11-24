// Halaman utama (peta publik): filter, pencarian, form laporan, dan kontrol peta
(() => {
  const $ = s => document.querySelector(s);

  const panel = $("#detail");
  const filterBox = $("#filters");
  // Notifikasi singkat yang hilang otomatis setelah 3,2 detik
  const toast = msg => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 3200);
  };
  const { CATEGORIES, LEVELS } = Traffic;

  // Checkbox filter kategori + legenda level kepadatan
  filterBox.innerHTML = Object.entries(CATEGORIES).map(([type, c]) => `
    <label class="filter-item">
      <input type="checkbox" value="${type}" checked>
      <span class="filter-dot" style="--c:${c.color}"><i data-lucide="${c.icon}"></i></span>
      <span>${c.label}</span>
      <span class="filter-count" data-count="${type}">0</span>
    </label>`).join("");
  filterBox.addEventListener("change", e => TrafficMap.setCategoryVisible(e.target.value, e.target.checked));
  $("#legend").innerHTML = Object.values(LEVELS).map(l =>
    `<li><span class="${l.style.dashArray ? "dashed" : ""}" style="--c:${l.style.color}"></span>${l.label}</li>`).join("");

  // Inisialisasi peta, gambar marker, dan isi jumlah per kategori
  TrafficMap.init("map");
  const select = item => { TrafficDetail.open(panel, item); TrafficMap.focus(item); };

  const items = Traffic.visible();
  const counts = Traffic.countBy("type", items);
  TrafficMap.render(items, select); 
  filterBox.querySelectorAll("[data-count]").forEach(el => { el.textContent = counts[el.dataset.count] || 0; });

  if (APP.pesan) toast(APP.pesan);

  // Tombol kontrol peta, panel, dan shortcut Esc
  $("#zoom-in").onclick = TrafficMap.zoomIn;
  $("#zoom-out").onclick = TrafficMap.zoomOut;
  $("#home").onclick = TrafficMap.home;
  $("#overview").onclick = TrafficMap.overview;
  $("#locate").onclick = () => TrafficMap.locate(toast);
  $("#detail-close").onclick = () => TrafficDetail.close(panel);
  $("#panel-toggle").onclick = () => $("#side-panel").classList.toggle("collapsed");
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    TrafficDetail.close(panel);
    TrafficMap.cancelPick();
  });

  const info = $("#info-dialog");
  $("#info-btn").onclick = () => info.showModal();
  $("#info-close").onclick = () => info.close();

  // Form lapor: pilih titik di peta lalu isi form (foto maks 2 MB)
  const reportDialog = $("#report-dialog");
  const form = $("#report-form");
  const options = (entries) => entries.map(([v, x]) => `<option value="${v}">${x.label}</option>`).join("");
  form.type.innerHTML = options(Object.entries(CATEGORIES).filter(([t]) => t !== "traffic_light"));
  form.level.innerHTML = options(Object.entries(LEVELS).filter(([l]) => l !== "smooth" && l !== "closed"));
  $("#report-btn").onclick = () => {
    toast("Klik titik lokasi di peta (Esc untuk batal).");
    TrafficMap.pick(ll => {
      form.reset();
      form.latitude.value = ll.lat;
      form.longitude.value = ll.lng;
      $("#level-field").hidden = true;
      $("#report-point").textContent = `Titik: ${ll.lat.toFixed(4)}, ${ll.lng.toFixed(4)}`;
      reportDialog.showModal();
    }, toast);
  };
  form.type.onchange = () => { $("#level-field").hidden = form.type.value !== "traffic_congestion"; };
  $("#report-cancel").onclick = () => reportDialog.close();
  form.addEventListener("submit", e => {
    const photo = form.photo.files[0];
    if (photo && photo.size > 2 * 1024 * 1024) {
      e.preventDefault();
      alert("Ukuran foto maksimal 2 MB.");
    }
  });

  // Pencarian berdasarkan nama/lokasi (maks 6 hasil)
  const input = $("#search");
  const results = $("#search-results");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.hidden = true; return; }
    const hits = items.filter(i => `${i.name} ${i.location}`.toLowerCase().includes(q)).slice(0, 6);
    results.innerHTML = hits.length
      ? hits.map(i => `<li><button data-id="${i.id}"><span class="dot" style="background:${CATEGORIES[i.type].color}"></span>${esc(i.name)}<small>${esc(i.location)}</small></button></li>`).join("")
      : `<li class="empty">Tidak ditemukan</li>`;
    results.hidden = false;
  });
  results.addEventListener("click", e => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    select(Traffic.byId(+b.dataset.id));
    results.hidden = true;
    input.value = "";
  });
  document.addEventListener("click", e => { if (!e.target.closest(".search")) results.hidden = true; });
})();
