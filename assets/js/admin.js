// Halaman admin: validasi (setujui/tolak), edit, dan hapus laporan
(() => {
  const $ = s => document.querySelector(s);
  const list = $("#admin-list");
  const dialog = $("#detail-dialog");
  // Tab aktif diambil dari URL (?status=...), default "pending"
  let tab = new URLSearchParams(location.search).get("status") || "pending";

  // [status tujuan, label tombol, gaya tombol]
  const ACTIONS = [["approved", "Setujui", "ok"], ["rejected", "Tolak", "no"]];

  // Form POST ke admin.php; confirmText diisi jika butuh konfirmasi
  const actionForm = (i, aksi, label, kind, confirmText = "") => `
    <form method="post" action="admin.php" data-confirm="${esc(confirmText)}">
      <input type="hidden" name="id" value="${i.id}">
      <input type="hidden" name="aksi" value="${aksi}">
      <input type="hidden" name="status" value="${tab}">
      <button class="btn btn--${kind}">${label}</button>
    </form>`;

  // Gambar ulang jumlah di tab dan daftar kartu sesuai tab aktif
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
          <button class="btn" data-detail="${i.id}">Lihat Detail</button>
          <a class="btn" href="edit.php?id=${i.id}">Edit</a>
          ${ACTIONS.filter(([s]) => s !== i.status).map(([s, label, kind]) => actionForm(i, s, label, kind)).join("")}
          ${actionForm(i, "hapus", "Hapus", "no", `Hapus "${i.name}"? Data dan fotonya akan dihapus permanen.`)}
        </div>
      </article>`;
    }).join("") : `<p class="empty">Tidak ada informasi dengan status "${Traffic.VALIDATION[tab]}".</p>`;
    icons();
  }

  // Ganti tab tanpa reload halaman
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    tab = b.dataset.tab;
    history.replaceState(null, "", `?status=${tab}`);
    render();
  });

  // Tombol "Lihat Detail" membuka dialog
  list.addEventListener("click", e => {
    const b = e.target.closest("[data-detail]");
    if (!b) return;
    $("#detail-dialog .detail-body").innerHTML = TrafficDetail.html(Traffic.byId(+b.dataset.detail));
    icons();
    dialog.showModal();
  });

  // Batalkan submit jika konfirmasi ditolak
  list.addEventListener("submit", e => {
    const text = e.target.dataset.confirm;
    if (text && !confirm(text)) e.preventDefault();
  });

  $("#dialog-close").onclick = () => dialog.close();

  render();
})();
