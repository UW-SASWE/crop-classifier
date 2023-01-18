// element variables
const trainButtonSpinner = document.getElementById("trainButtonSpinner");
const trainButtonText = document.getElementById("trainButtonText");
const trainInputFile = document.getElementById("trainFile");
const trainButton = document.getElementById("trainButton");
const trainSplitRange = document.getElementById("trainSplit"),
  trainPercentInput = document.getElementById("trainPercent"),
  validationPercentInput = document.getElementById("validationPercent");
const selectedTrainYear = document.getElementById("trainYear");
const trainFileInput = document.getElementById("trainFile");

const classifyButton = document.getElementById("classifyButton");
const classifyButtonSpinner = document.getElementById("classifyButtonSpinner");
const classifyButtonText = document.getElementById("classifyButtonText");
const selectedClassificationYear =
  document.getElementById("classificationYear");
// scope selection
const scopeSelector = document.getElementById("scope");
const countrySelector = document.getElementById("countries");
const divisionSelector = document.getElementById("divisions");
const zilaSelector = document.getElementById("zilas");
const upazilaSelector = document.getElementById("upazilas");
const unionSelector = document.getElementById("unions");

// event assignments
classifyButton.addEventListener("click", classify);
trainButton.addEventListener("click", train);
trainSplitRange.addEventListener("change", () => {
  updateTrainSplit(trainSplitRange.value);
});
trainPercentInput.addEventListener("change", () => {
  updateTrainSplit(trainPercentInput.value);
});
validationPercentInput.addEventListener("change", () => {
  updateTrainSplit(validationPercentInput.value);
});
trainFileInput.addEventListener("input", () => {
  document.getElementById("trainButton").disabled = false;
});
selectedTrainYear.addEventListener("blur", () => {
  disableSeasons("train");
  disableSeasons("train");
});
selectedClassificationYear.addEventListener("blur", () => {
  disableSeasons("classification");
  disableSeasons("classification");
});
scopeSelector.addEventListener("change", () => {
  switch (scopeSelector.value) {
    case "heirachyScope":
      countrySelector.classList.remove("d-none");
      countrySelector.value = "Bangladesh";
      loadChildSelector(countrySelector);
      break;
    case "drawScope":
      resetSelector([
        divisionSelector,
        zilaSelector,
        upazilaSelector,
        unionSelector,
      ]);
      countrySelector.classList.add("d-none");
      divisionSelector.classList.add("d-none");
      zilaSelector.classList.add("d-none");
      upazilaSelector.classList.add("d-none");
      unionSelector.classList.add("d-none");
      break;
  }
});
countrySelector.addEventListener("change", () => {
  loadChildSelector(countrySelector);
});
divisionSelector.addEventListener("change", () => {
  loadChildSelector(divisionSelector);
});
zilaSelector.addEventListener("change", () => {
  loadChildSelector(zilaSelector);
});
upazilaSelector.addEventListener("change", () => {
  loadChildSelector(upazilaSelector);
});
unionSelector.addEventListener("change", () => {
  loadChildSelector(unionSelector);
});

// functions

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function classify() {
  var classifySeasonRadios = document.getElementsByName(
    "classificationSeasonRadios"
  );
  classifyButton.disabled = true;
  classifyButtonSpinner.classList.remove("d-none");
  classifyButtonText.innerHTML = "Classifying...";

  var season = getSeason(classifySeasonRadios);
  var year = document.getElementById("classificationYear").value;
  var classifierRadios = document.getElementsByName("classifierRadios");
  var classifier = getClassifier(classifierRadios);
  var scope = {};

  scope.type = scopeSelector.value;

  switch (scope.type) {
    case "heirachyScope":
      scope.tree = [
        countrySelector.value,
        divisionSelector.value,
        zilaSelector.value,
        upazilaSelector.value,
        unionSelector.value,
      ];
      break;
    case "drawScope":
      break;
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ season, year, classifier, scope }),
  };

  var response = await fetch("/cropclassifier/classify", options);
  var responseJSON = await response.json();

  L.tileLayer(responseJSON.urlFormat, {
    attribution:
      'Map Data &copy; <a href="https://earthengine.google.com">Google Earth Engine</a>',
  })
    .addTo(map)
    .bringToFront();

  classifyButton.disabled = false;
  classifyButtonSpinner.classList.add("d-none");
  classifyButtonText.innerHTML = "Classify";
}

function getClassifier(classifierRadios) {
  for (i = 0; i < classifierRadios.length; i++) {
    if (classifierRadios[i].checked) {
      return classifierRadios[i].value;
    }
  }
}

function updateTrainSplit(val) {
  document.getElementById("trainSplit").value = val;
  document.getElementById("trainPercent").value = val;
  document.getElementById("validationPercent").value = 100 - val;
}

async function readCSV(file) {
  return new Promise((resolve, reject) => {
    var fileReader = new FileReader();
    fileReader.onload = (event) => resolve(event.target.result);
    fileReader.onerror = (error) => reject(error);

    try {
      fileReader.readAsText(file);
    } catch {
      console.log("Unable to load CSV file.");
    }
  });
}

function getSeason(seasonsRadios) {
  for (i = 0; i < seasonsRadios.length; i++) {
    if (seasonsRadios[i].checked) {
      return seasonsRadios[i].value;
    }
  }
}

async function train() {
  var trainSeasonRadios = document.getElementsByName("trainSeasonRadios");
  var season = getSeason(trainSeasonRadios);
  var year = document.getElementById("trainYear").value;
  trainButton.disabled = true;
  trainButtonSpinner.classList.remove("d-none");
  trainButtonText.innerHTML = "Training...";
  var file = trainInputFile.files[0];
  var csvData = await readCSV(file);

  var roiSource = "LSIB" 

  var splitRatio = document.getElementById("trainSplit").value;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ csvData, splitRatio, season, year, roiSource }),
  };
  loadTrainPoints(options);
  var response = await fetch("/cropclassifier/train", options);
  if (response.status === 200) {
    await delay(30000); // give the server some slack time
    awaitTrain("Loading results");
    await delay(30000); // allow time to for the server to finish saving the results
    var resultsResponse = await fetch("/cropclassifier/trainresults");
    var resultsResponseJson = await resultsResponse.json();
    // console.log(resultsResponseJson);
    afterTrain(resultsResponseJson);
    awaitTrain("Saving models");
    await delay(15000); // allow some time for the server to save the models
    // console.log("waited 3 mins");

    trainButtonSpinner.classList.add("d-none");
    trainButtonSpinner.classList.replace("spinner-grow", "spinner-border");
    trainButtonText.innerHTML = "Train";
  }
}

// what happens when the training is still running but the time exceeds the browser timeout
function awaitTrain(message) {
  trainButtonSpinner.classList.replace("spinner-border", "spinner-grow");
  trainButtonText.innerHTML = `${message}...`;
}

// what happens after a successful training
function afterTrain(responseJson) {
  document.getElementById("cartTrainingAccuracy").innerHTML =
    Math.round((responseJson.trainAccuracyCart + Number.EPSILON) * 100) / 100;
  document.getElementById("rfTrainingAccuracy").innerHTML =
    Math.round((responseJson.trainAccuracyRf + Number.EPSILON) * 100) / 100;
  document.getElementById("cartValidationAccuracy").innerHTML =
    Math.round((responseJson.validationAccuracyCart + Number.EPSILON) * 100) /
    100;
  document.getElementById("rfValidationAccuracy").innerHTML =
    Math.round((responseJson.validationAccuracyRf + Number.EPSILON) * 100) /
    100;

  // console.log(await response.json());
  // trainButtonSpinner.classList.add("d-none");
  // trainButtonSpinner.classList.replace("spinner-grow", "spinner-border");
  // trainButtonText.innerHTML = "Train";
  trainInputFile.value = null;
  document.getElementById("trainButton").disabled = true;

  var accuracyResultsTable = document.getElementById("accuracyResultsTable");
  accuracyResultsTable.classList.remove("d-none");

  document.getElementById("collapseOne").classList.toggle("show");
  document.getElementById("collapseThree").classList.toggle("show");
}

// function to load the training points
async function loadTrainPoints(options) {
  var response = await fetch("/cropclassifier/displaytrainingpoints", options);
  var pointsGeojson = await response.json();
  L.geoJSON(pointsGeojson.tpGeojson, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: "#e28743",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      });
    },
  }).addTo(map);
  L.geoJSON(pointsGeojson.vpGeojson, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: "#21130d",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9,
      });
    },
  }).addTo(map);
}

// initialize the map
var map = L.map("map", {
  center: [23.84574043942299, 90.28182335177792],
  zoom: 7.5,
});

var overlays = {
  Country: L.layerGroup(),
  Division: L.layerGroup(),
  Zila: L.layerGroup(),
  Upazila: L.layerGroup(),
  Union: L.layerGroup(),
};

var layerControl = L.control.layers(null, overlays);

// function to load (Bangladesh) polygons
async function load_polygon(
  polygonType,
  parentValues = [],
  targetParentLayerGroup = null,
  targetChildrenLayerGroup = null
) {
  var response;
  if (parentValues.length) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parentValues, polygonType }),
    };

    response = await fetch("/cropclassifier/loadPolygon", options);
  } else {
    response = await fetch("/cropclassifier/loadPolygon");
  }

  var responseJSON = await response.json();

  var loadedParentLayer = L.geoJSON(responseJSON.parentGeoJSON);

  if (targetParentLayerGroup) {
    targetParentLayerGroup.clearLayers();
    targetParentLayerGroup.addLayer(loadedParentLayer);
    targetParentLayerGroup.addTo(map);
  } else {
    loadedParentLayer.addTo(map);
  }

  if (responseJSON.parentGeoJSON) {
    var loadedChildrenLayer = L.geoJSON(responseJSON.childrenGeoJSON);

    if (targetChildrenLayerGroup) {
      targetChildrenLayerGroup.clearLayers();
      targetChildrenLayerGroup.addLayer(loadedChildrenLayer);
      targetChildrenLayerGroup.addTo(map);
    } else {
      loadedChildrenLayer.addTo(map);
    }
  }
}

function resetChildLayers(childLayerKey) {
  switch (childLayerKey) {
    case "Country":
      overlays["Division"].clearLayers();
      overlays["Zila"].clearLayers();
      overlays["Upazila"].clearLayers();
      overlays["Union"].clearLayers();
      break;
    case "Division":
      overlays["Zila"].clearLayers();
      overlays["Upazila"].clearLayers();
      overlays["Union"].clearLayers();
      break;
    case "Zila":
      overlays["Upazila"].clearLayers();
      overlays["Union"].clearLayers();
      break;
    case "Upazila":
      overlays["Union"].clearLayers();
      break;
    case "Union":
      break;
  }
}

function disableSeasons(mode) {
  const currentDate = new Date();
  const selectedYear = document.getElementById(mode + "Year"),
    amanRadio = document.getElementById(mode + "AmanSeason"),
    ausRadio = document.getElementById(mode + "AusSeason"),
    boroRadio = document.getElementById(mode + "BoroSeason");
  amanRadio.disabled = false;
  ausRadio.disabled = false;
  boroRadio.disabled = false;
  boroRadio.checked = true;

  if (Number(selectedYear.value) === currentDate.getFullYear()) {
    // check if the present month is August or earlier
    if (currentDate.getMonth() <= 7) {
      amanRadio.checked = false;
      amanRadio.disabled = true;
    }
    // check if the present month is May or earlier
    if (currentDate.getMonth() <= 5) {
      ausRadio.checked = false;
      ausRadio.disabled = true;
    }

    // check if the present month is January
    if (currentDate.getMonth() === 0) {
      boroRadio.checked = false;
      boroRadio.disabled = true;
      selectedYear.value = (currentDate.getFullYear() - 1).toString();
    }
  }

  // sentinel 2 data starts from june 2015
  if (Number(selectedYear.value) === 2015) {
    boroRadio.checked = false;
    boroRadio.disabled = true;
    ausRadio.checked = false;
    ausRadio.disabled = true;
    amanRadio.checked = true;
  }
}

// when window loads
window.onload = () => {
  // add basemap to the map
  var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 17,
    minZoom: 4,
  });
  var USGS_USImageryTopo = L.tileLayer(
    "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 20,
      minZoom: 4,
      attribution:
        'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
    }
  );

  map.addLayer(osm);
  layerControl.addTo(map);

  layerControl.addBaseLayer(osm, "OpenStreetMap");
  layerControl.addBaseLayer(USGS_USImageryTopo, "Satellite (USGS)");

  // L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  //   attribution:
  //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  // }).addTo(map);

  // STARTUP: Load the initial polygons of Bangladesh
  // load_polygon("bg_boundary", overlays.Country, "Bangladesh");
  // load_polygon("bg_divisions", "Divisions");
  // load_polygon("bg_zilas", "Zilas");
  // load_polygon("bg_upazilas", "Upazilas");
  // load_polygon("bg_unions", "Unions");

  // update train-validate split
  updateTrainSplit(document.getElementById("trainSplit").value);
  // postTrain();

  disableSeasons("train");
  disableSeasons("train");
  disableSeasons("classification");
  disableSeasons("classification");

  scopeSelector.value = "heirachyScope";
  countrySelector.classList.remove("d-none");
  countrySelector.value = "Bangladesh";
  loadChildSelector(countrySelector);
};

function resetSelector(selectorElements) {
  for (j = 0, nSelectors = selectorElements.length; j < nSelectors; j++) {
    var options = selectorElements[j].options;
    for (i = options.length - 1; i >= 0; i--) {
      if (options[i].value) {
        selectorElements[j].remove(i);
      }
    }
    selectorElements[j].value = "";
  }
}

async function loadChildSelector(parentSelector) {
  async function loadSelectorOptions(parentValues, childKey) {
    var options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parentValues,
        childKey,
      }),
    };
    var response = await fetch("/cropclassifier/scope", options);
    var responseJson = await response.json();
    var childValues = responseJson.childValues;
    for (i = 0, len = childValues.length; i < len; i++) {
      document
        .getElementById(childKey)
        .options.add(new Option(childValues[i], childValues[i]));
    }
  }

  switch (parentSelector.id) {
    case "countries":
      resetSelector([
        divisionSelector,
        zilaSelector,
        upazilaSelector,
        unionSelector,
      ]);
      divisionSelector.classList.remove("d-none");
      zilaSelector.classList.add("d-none");
      upazilaSelector.classList.add("d-none");
      unionSelector.classList.add("d-none");

      resetChildLayers("country");
      load_polygon(
        parentSelector.id,
        [countrySelector.value],
        overlays.Country,
        overlays.Division
      );
      loadSelectorOptions([countrySelector.value], "divisions");

      break;
    case "divisions":
      resetSelector([zilaSelector, upazilaSelector, unionSelector]);
      zilaSelector.classList.remove("d-none");
      upazilaSelector.classList.add("d-none");
      unionSelector.classList.add("d-none");

      resetChildLayers("Division");

      load_polygon(
        parentSelector.id,
        [countrySelector.value, divisionSelector.value],
        overlays.Division,
        overlays.Zila
      );
      loadSelectorOptions(
        [countrySelector.value, divisionSelector.value],
        "zilas"
      );

      break;
    case "zilas":
      resetSelector([upazilaSelector, unionSelector]);
      upazilaSelector.classList.remove("d-none");
      unionSelector.classList.add("d-none");

      resetChildLayers("Zila");

      load_polygon(
        parentSelector.id,
        [countrySelector.value, divisionSelector.value, zilaSelector.value],
        overlays.Zila,
        overlays.Upazila
      );
      loadSelectorOptions(
        [countrySelector.value, divisionSelector.value, zilaSelector.value],
        "upazilas"
      );

      break;
    case "upazilas":
      resetSelector([unionSelector]);
      unionSelector.classList.remove("d-none");

      resetChildLayers("Upazila");
      load_polygon(
        parentSelector.id,
        [
          countrySelector.value,
          divisionSelector.value,
          zilaSelector.value,
          upazilaSelector.value,
        ],
        overlays.Upazila,
        overlays.Union
      );
      loadSelectorOptions(
        [
          countrySelector.value,
          divisionSelector.value,
          zilaSelector.value,
          upazilaSelector.value,
        ],
        "unions"
      );

      break;

    case "unions":
      resetChildLayers("Unions");
      load_polygon(
        parentSelector.id,
        [
          countrySelector.value,
          divisionSelector.value,
          zilaSelector.value,
          upazilaSelector.value,
          unionSelector.value,
        ],
        overlays.Union
      );
      // loadSelectorOptions(
      //   [
      //     countrySelector.value,
      //     divisionSelector.value,
      //     zilaSelector.value,
      //     upazilaSelector.value,
      //   ],
      //   "unions"
      // );

      break;
  }
}
