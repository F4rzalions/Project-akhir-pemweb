// Main map page bootstrap.
(async () => {
  const $ = s => document.querySelector(s);
  const user = Auth.mount();
  if (!user) return;

  const panel = $("#detail");
  const filterBox = $("#filters");
  const toast = msg => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 3200);
  };
  const { CATEGORIES, LEVELS } = Traffic;

  $("#admin-link").hidden = user.role !== "admin";

  // Filter checkboxes and legend are generated from the category / level tables.
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

  TrafficMap.init("map");
  const select = item => { TrafficDetail.open(panel, item); TrafficMap.focus(item); };

  try {
    await Traffic.load();
  } catch (err) {
    toast(err.message);
    console.error(err);
  }
  const updatePending = () => { $("#pending-count").textContent = Traffic.countBy("status").pending || ""; };
  const items = Traffic.visible();
  const counts = Traffic.countBy("type", items);
  TrafficMap.render(items, select); // also renders every static icon on the page
  filterBox.querySelectorAll("[data-count]").forEach(el => { el.textContent = counts[el.dataset.count] || 0; });
  updatePending();

  // Controls
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

  // Info dialog
  const info = $("#info-dialog");
  $("#info-btn").onclick = () => info.showModal();
  $("#info-close").onclick = () => info.close();

  // Report: pick a point on the map, then fill the form. Enters the admin queue as pending.
  const reportDialog = $("#report-dialog");
  const form = $("#report-form");
  const options = (entries) => entries.map(([v, x]) => `<option value="${v}">${x.label}</option>`).join("");
  form.type.innerHTML = options(Object.entries(CATEGORIES).filter(([t]) => t !== "traffic_light"));
  form.level.innerHTML = options(Object.entries(LEVELS).filter(([l]) => l !== "smooth" && l !== "closed"));
  let point;
  $("#report-btn").onclick = () => {
    toast("Klik titik lokasi di peta (Esc untuk batal).");
    TrafficMap.pick(ll => {
      point = ll;
      form.reset();
      $("#level-field").hidden = true;
      $("#report-point").textContent = `Titik: ${ll.lat.toFixed(4)}, ${ll.lng.toFixed(4)}`;
      reportDialog.showModal();
    }, toast);
  };
  form.type.onchange = () => { $("#level-field").hidden = form.type.value !== "traffic_congestion"; };
  $("#report-cancel").onclick = () => reportDialog.close();
  form.addEventListener("submit", () => {
    Traffic.addReport({
      type: form.type.value,
      level: form.type.value === "traffic_congestion" ? form.level.value : undefined,
      name: form.name.value.trim(),
      location: form.location.value.trim(),
      description: form.description.value.trim(),
      latitude: point.lat,
      longitude: point.lng,
      reportedBy: user.username
    });
    updatePending(); // a new report is pending, so the map itself doesn't change
    toast("Laporan terkirim, menunggu validasi admin.");
  });

  // Search
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
