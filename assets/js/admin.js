// Admin validation page.
(async () => {
  const $ = s => document.querySelector(s);
  if (!Auth.mount("admin")) return;

  const list = $("#admin-list");
  const dialog = $("#detail-dialog");
  let tab = "pending";

  try {
    await Traffic.load();
  } catch (err) {
    list.innerHTML = `<p class="empty">${err.message}</p>`;
    console.error(err);
    icons();
    return;
  }

  const ACTIONS = [["approved", "Setujui", "ok"], ["rejected", "Tolak", "no"]];

  function render() {
    const counts = Traffic.countBy("status");
    document.querySelectorAll("[data-tab]").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === tab);
      b.querySelector(".count").textContent = counts[b.dataset.tab] || 0;
    });

    const rows = Traffic.all().filter(i => i.status === tab);
    list.innerHTML = rows.length ? rows.map(i => {
      const cat = Traffic.CATEGORIES[i.type];
      return `
      <article class="card">
        <span class="card-icon" style="--c:${cat.color}"><i data-lucide="${cat.icon}"></i></span>
        <div class="card-body">
          <small>${cat.label}</small>
          <h3>${esc(i.name)}</h3>
          <p>Lokasi: ${esc(i.location || "-")}</p>
          ${i.reportedBy ? `<p>Dilaporkan oleh: <b>@${esc(i.reportedBy)}</b></p>` : ""}
          <p>Status: <span class="status status--${i.status}">${Traffic.VALIDATION[i.status]}</span> · ${Traffic.formatTime(i.updatedAt)}</p>
        </div>
        <div class="card-actions">
          <button class="btn" data-act="detail" data-id="${i.id}">Lihat Detail</button>
          ${ACTIONS.filter(([s]) => s !== i.status).map(([s, label, kind]) =>
            `<button class="btn btn--${kind}" data-act="${s}" data-id="${i.id}">${label}</button>`).join("")}
        </div>
      </article>`;
    }).join("") : `<p class="empty">Tidak ada informasi dengan status "${Traffic.VALIDATION[tab]}".</p>`;
    icons();
  }

  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });

  list.addEventListener("click", e => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const item = Traffic.byId(+b.dataset.id);
    if (b.dataset.act === "detail") {
      $("#detail-dialog .detail-body").innerHTML = TrafficDetail.html(item);
      icons();
      dialog.showModal();
    } else {
      Traffic.setStatus(item.id, b.dataset.act);
      render();
    }
  });

  $("#dialog-close").onclick = () => dialog.close();
  $("#reset").onclick = () => { Traffic.reset(); render(); };

  render();
})();
