// Escape karakter HTML agar aman disisipkan ke innerHTML (cegah XSS)
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Render ulang ikon Lucide (jika library sudah dimuat)
const icons = () => window.lucide && lucide.createIcons();
