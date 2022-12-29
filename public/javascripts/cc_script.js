// initialize the map
var map = L.map("map", {
  center: [23.84574043942299, 90.28182335177792],
  zoom: 7.5,
});

// add basemap to the map
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 17,
  minZoom: 6,
}).addTo(map);

// invoke the startup to load the region of interest
(async function () {
  var response = await fetch("/cropclassifier/startup");
  var startupVars = await response.json();
  console.log(startupVars.center);

  map.setView(startupVars.center);
  L.tileLayer(startupVars.urlFormat, {
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
    maxZoom: 17,
    minZoom: 6,
  }).addTo(map);
})();
