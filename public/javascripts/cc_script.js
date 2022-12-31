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

// function to load (Bangladesh) polygons
async function load_polygon(polygon_name) {
  var response = await fetch("/cropclassifier/" + polygon_name);
  var startupVars = await response.json();

  // map.setView(startupVars.center);
  // L.tileLayer(startupVars.urlFormat, {
  //   attribution:
  //     'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  //   maxZoom: 17,
  //   minZoom: 6,
  // }).addTo(map);

  L.geoJSON(startupVars).addTo(map);
  // await fetch("/cropclassifier/train")
  await fetch("/cropclassifier/classify")
}

// STARTUP: Load the initial polygons of Bangladesh
// load_polygon("bg_boundary");
// load_polygon("bg_divisions");
// load_polygon("bg_zilas");
load_polygon("bg_upazilas");
// load_polygon("bg_unions");

async function classify(){

  await fetch("/cropclassifier/train")
}

// classify()


