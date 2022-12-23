// let map = L.map('cc-map').setView([51.505, -0.09], 13);
// let map = L.map("cc-map").setView([47.4, -122.3, 11], 7);
let map = L.map("cc-map").setView([9.589014927025342, 8.09294083307367], 7);
let tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
});
tiles.addTo(map);

async function getMap() {
  const response = await fetch("/classify_nigeria"); // change the route
  json_response = await response.json();
  // mapid, centroid = await response.json()
  // console.log(json_response.mapid)
  border_id = json_response.border_id;
  centroid = json_response.centroid;
  map.setView(centroid, 7);
  roi_id = json_response.roi_id;
  trainingPts_id = json_response.classifiedCart_id;

  let tiles = L.tileLayer(border_id.urlFormat, {
    maxZoom: 19,
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  });
  tiles.addTo(map);
  let roi = L.tileLayer(roi_id.urlFormat, {
    maxZoom: 19,
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  });
  roi.addTo(map);
  let trainingPts = L.tileLayer(trainingPts_id.urlFormat, {
    maxZoom: 19,
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  });
  trainingPts.addTo(map);

  // return mapid.urlFormat;
}

// getMap();
map.setView([9.589014927025342, 8.09294083307367], 7);
// map.setView(centroid, 9)

// async function loadMapItem() {

// }

// async function parseJsonFile(file) {
//   return new Promise((resolve, reject) => {
//     var fileReader = new FileReader();
//     fileReader.onload = (event) => resolve(event.target.result);
//     fileReader.onerror = (error) => reject(error);
//     console.log(file);
//     fileReader.readAsText(file);
//   });
// }

// async function sendLoadRequest(file, label) {
//   var requestBody = {};
//   requestBody.label = label;
//   console.log(file);

//   const fileData = await parseJsonFile(file);
//   // console.log(JSON.parse(fileData));
//   const data = await JSON.parse(fileData);
//   requestBody.data = await data;

//   // console.log(requestBody)

//   const options = {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(requestBody),
//   };
//   const response = await fetch("/load", options);
//   const json = await response.json();
//   console.log(json.urlFormat);
// }

const roi_button = document.getElementById("roi_submit");
roi_button.addEventListener("click", async function () {
  var file = document.getElementById("roi_file").files[0];
  var label = document.getElementById("roi").textContent;

  async function parseJsonFile(file) {
    return new Promise((resolve, reject) => {
      var fileReader = new FileReader();
      fileReader.onload = (event) => resolve(event.target.result);
      fileReader.onerror = (error) => reject(error);
      // console.log(file);
      fileReader.readAsText(file);
    });
  }

  var requestBody = {};
  requestBody.label = label;
  // console.log(file);

  const fileData = await parseJsonFile(file);
  // console.log(JSON.parse(fileData));
  const data = await JSON.parse(fileData);
  requestBody.data = await data;

  // console.log(requestBody)

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  };
  const response = await fetch("/load", options);
  const json = await response.json();
  console.log(json.urlFormat);
  let tiles = L.tileLayer(json.urlFormat, {
    maxZoom: 19,
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  });
  tiles.addTo(map);
  map.panTo(json.centroid);
});

const tp_button = document.getElementById("tp_submit");
tp_button.addEventListener("click", async function () {
  var file = document.getElementById("tp_file").files[0];
  var label = document.getElementById("tp").textContent;

  async function parseJsonFile2(file) {
    return new Promise((resolve, reject) => {
      var fileReader = new FileReader();
      fileReader.onload = (event) => resolve(event.target.result);
      fileReader.onerror = (error) => reject(error);
      // console.log(file);
      fileReader.readAsText(file);
    });
  }

  var requestBody = {};
  requestBody.label = label;
  // console.log(file);

  const fileData = await parseJsonFile2(file);
  // console.log(JSON.parse(fileData));
  const data = await JSON.parse(fileData);
  requestBody.data = await data;

  // console.log(requestBody)

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  };
  const response = await fetch("/load", options);
  const json = await response.json();
  console.log(json.urlFormat);
  let tiles = L.tileLayer(json.urlFormat, {
    maxZoom: 19,
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  });
  tiles.addTo(map);
  map.panTo(json.centroid);
});

const vp_button = document.getElementById("vp_submit");
vp_button.addEventListener("click", async function () {
  var file = document.getElementById("vp_file").files[0];
  var label = document.getElementById("vp").textContent;

  async function parseJsonFile1(file) {
    return new Promise((resolve, reject) => {
      var fileReader = new FileReader();
      fileReader.onload = (event) => resolve(event.target.result);
      fileReader.onerror = (error) => reject(error);
      // console.log(file);
      fileReader.readAsText(file);
    });
  }

  var requestBody = {};
  requestBody.label = label;
  // console.log(file);

  const fileData = await parseJsonFile1(file);
  // console.log(JSON.parse(fileData));
  const data = await JSON.parse(fileData);
  requestBody.data = await data;

  // console.log(requestBody)

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  };
  const response = await fetch("/load", options);
  const json = await response.json();
  console.log(json.urlFormat);
  let tiles = L.tileLayer(json.urlFormat, {
    maxZoom: 19,
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  });
  tiles.addTo(map);
  map.panTo(json.centroid);
});

const classify_button = document.getElementById("classify");
classify_button.addEventListener("click", async function () {
  // var file = document.getElementById("tp_file").files[0];
  // var label = document.getElementById("tp").textContent;

  // async function parseJsonFile2(file) {
  //   return new Promise((resolve, reject) => {
  //     var fileReader = new FileReader();
  //     fileReader.onload = (event) => resolve(event.target.result);
  //     fileReader.onerror = (error) => reject(error);
  //     // console.log(file);
  //     fileReader.readAsText(file);
  //   });
  // }

  // var requestBody = {};
  // requestBody.label = label;
  // // console.log(file);

  // const fileData = await parseJsonFile2(file);
  // // console.log(JSON.parse(fileData));
  // const data = await JSON.parse(fileData);
  // requestBody.data = await data;

  // // console.log(requestBody)

  // const options = {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(requestBody),
  // };
  const response = await fetch("/classify");
  const json = await response.json();
  // console.log(json)
  console.log(json.urlFormat);
  let tiles = L.tileLayer(json.urlFormat, {
    maxZoom: 19,
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  });
  tiles.addTo(map);
  map.panTo(json.centroid);
});
