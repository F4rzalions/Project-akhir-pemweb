// Detail panel (sidebar on desktop, bottom sheet on mobile). Shared with admin page.
const TrafficDetail = (() => {
  function html(item) {
    const cat = Traffic.CATEGORIES[item.type];
    let badge = "";
    if (item.type === "traffic_light") {
      badge = `<div class="light-badge">${Object.entries(Traffic.LIGHTS).map(([k, l]) =>
        `<span class="bulb ${k === item.light ? "on" : ""}" style="--b:${l.color}"></span>`).join("")}
        <strong>${Traffic.LIGHTS[item.light]?.label || "-"}</strong></div>`;
    } else if (item.type === "traffic_congestion" && Traffic.LEVELS[item.level]) {
      const lv = Traffic.LEVELS[item.level];
      badge = `<span class="level-chip" style="--c:${lv.style.color}">${lv.label}</span>`;
    }
    return `
      <div class="detail-head">
        <span class="detail-icon" style="--c:${cat.color}"><i data-lucide="${cat.icon}"></i></span>
        <div><small>${cat.title}</small><h3>${esc(item.name)}</h3></div>
      </div>
      ${badge}
      <dl class="detail-list">
        <dt>Lokasi</dt><dd>${esc(item.location || "-")}</dd>
        <dt>Status</dt><dd>${esc(Traffic.statusText(item))}</dd>
        <dt>Keterangan</dt><dd>${esc(item.description || "-")}</dd>
        <dt>Waktu informasi</dt><dd>${Traffic.formatTime(item.updatedAt)}</dd>
        <dt>Koordinat</dt><dd>${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}</dd>
        <dt>Sumber</dt><dd>${item.reportedBy
          ? `Laporan pengguna <b>@${esc(item.reportedBy)}</b>`
          : `<span class="sim-tag">Data simulasi</span>`}</dd>
      </dl>`;
  }

  function open(panel, item) {
    panel.querySelector(".detail-body").innerHTML = html(item);
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    icons();
  }

  function close(panel) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  return { html, open, close };
})();
