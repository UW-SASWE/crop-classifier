// initialize the map
var map = L.map("map", { center: [23.685, 90.3563], zoom: 7 });

// load a tile layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 17,
  minZoom: 6,
}).addTo(map);
