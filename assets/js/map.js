// marker, jalur, geolokasi, dan pemilihan titik
const TrafficMap = (() => {
  const HOME = [-7.7626, 110.4087]; // UPNYK
  const HOME_ZOOM = 15;
  const BOUNDS = L.latLngBounds([-8.21, 110.0], [-7.54, 110.85]); // batas wilayah Yogyakarta
  let map;
  const layers = {}; // satu layer group per kategori, untuk filter

  // Buat peta, tile OSM, mask di luar batas wilayah, dan layer per kategori
  function init(el) {
    map = L.map(el, {
      zoomControl: false,
      minZoom: 10,
      maxBounds: BOUNDS.pad(0.05),
      maxBoundsViscosity: 1
    }).setView(HOME, HOME_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      bounds: BOUNDS,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const b = BOUNDS;
    L.polygon([
      [[-90, -180], [-90, 180], [90, 180], [90, -180]],
      [b.getSouthWest(), b.getNorthWest(), b.getNorthEast(), b.getSouthEast()]
    ], { stroke: false, fillColor: "#cbd5e1", fillOpacity: 1, interactive: false }).addTo(map);
    L.rectangle(BOUNDS, { color: "#2563EB", weight: 2, dashArray: "6, 6", fill: false, interactive: false }).addTo(map);

    L.marker(HOME, {
      icon: L.divIcon({ className: "", html: '<div class="campus-pin">UPN</div>', iconSize: [44, 22], iconAnchor: [22, 11] }),
      interactive: false
    }).addTo(map);

    Object.keys(Traffic.CATEGORIES).forEach(t => { layers[t] = L.layerGroup().addTo(map); });
  }

  // Ikon marker; warna lampu mengikuti fase lampunya
  function markerIcon(item) {
    const cat = Traffic.CATEGORIES[item.type];
    const color = item.type === "traffic_light" ? Traffic.LIGHTS[item.light]?.color || cat.color : cat.color;
    return L.divIcon({
      className: "",
      html: `<div class="pin pin--${item.type}" style="--pin:${color}"><i data-lucide="${cat.icon}"></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });
  }

  // Gambar ulang marker (dan jalur jika ada) ke layer kategorinya
  function render(items, onSelect) {
    Object.values(layers).forEach(l => l.clearLayers());
    items.forEach(item => {
      const group = layers[item.type];
      if (item.path?.length > 1) {
        const level = Traffic.CATEGORIES[item.type].line || item.level || "slow";
        L.polyline(item.path, { ...Traffic.LEVELS[level].style, opacity: 0.9, lineCap: "round" })
          .on("click", () => onSelect(item))
          .addTo(group);
      }
      L.marker([item.latitude, item.longitude], { icon: markerIcon(item), title: item.name, keyboard: true })
        .on("click", () => onSelect(item))
        .addTo(group);
    });
    icons();
  }

  // Tampilkan/sembunyikan satu kategori
  function setCategoryVisible(type, show) {
    show ? map.addLayer(layers[type]) : map.removeLayer(layers[type]);
    if (show) icons();
  }

  // Kontrol navigasi peta
  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();
  const home = () => map.flyTo(HOME, HOME_ZOOM);
  const overview = () => map.flyToBounds(BOUNDS);
  const focus = item => map.flyTo([item.latitude, item.longitude], 17);

  // Tandai posisi pengguna (hanya jika di dalam wilayah)
  let userMarker;
  function locate(onError) {
    if (!navigator.geolocation) return onError("Browser tidak mendukung geolokasi.");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        if (!BOUNDS.contains(ll)) return onError("Lokasi Anda di luar wilayah Yogyakarta.");
        if (userMarker) userMarker.remove();
        userMarker = L.circleMarker(ll, { radius: 8, color: "#fff", weight: 3, fillColor: "#2563EB", fillOpacity: 1 }).addTo(map);
        map.flyTo(ll, 16);
      },
      () => onError("Izin lokasi ditolak atau tidak tersedia.")
    );
  }

  // Mode pilih titik: klik peta berikutnya dikirim ke onPick
  let pickHandler;
  function pick(onPick, onError) {
    cancelPick();
    map.getContainer().classList.add("picking");
    pickHandler = e => {
      if (!BOUNDS.contains(e.latlng)) return onError("Pilih titik di dalam wilayah Yogyakarta.");
      cancelPick();
      onPick(e.latlng);
    };
    map.on("click", pickHandler);
  }

  function cancelPick() {
    if (pickHandler) map.off("click", pickHandler);
    pickHandler = null;
    map.getContainer().classList.remove("picking");
  }

  return { init, render, setCategoryVisible, zoomIn, zoomOut, home, overview, focus, locate, pick, cancelPick };
})();
