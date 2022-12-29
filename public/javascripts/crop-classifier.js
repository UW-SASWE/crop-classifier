// let map = L.map("cc-map").setView([9.589014927025342, 8.09294083307367], 7);
// let tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   maxZoom: 19,
//   attribution:
//     '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
// });
// tiles.addTo(map);

// initialize the map
var map = L.map('map').setView([42.35, -71.08], 13);

// load a tile layer
L.tileLayer('http://tiles.mapc.org/basemap/{z}/{x}/{y}.png',
  {
    attribution: 'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
    maxZoom: 17,
    minZoom: 9
  }).addTo(map);