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

function getSeason() {
  var seasonsRadios = document.getElementsByName("seasonRadios");

  for (i = 0; i < seasonsRadios.length; i++) {
    if (seasonsRadios[i].checked) {
      return seasonsRadios[i].value;
    } else {
      return;
    }
  }
}

async function postTrain() {
  var season = getSeason();
  var year = document.getElementById("year").value;
  const loadSpinner = document.getElementById("loadSpinner");
  loadSpinner.classList.remove("d-none");
  const file = document.getElementById("trainFile").files[0];
  var csvData = await readCSV(file);

  var splitRatio = document.getElementById("trainSplit").value;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ csvData, splitRatio, season, year }),
  };
  loadTrainPoints(options);
  var response = await fetch("/cropclassifier/train", options);
  var responseJson = await response.json();
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
  loadSpinner.classList.add("d-none");
  var accuracyResultsTable = document.getElementById("accuracyResultsTable");
  accuracyResultsTable.classList.remove("d-none");
  // readFile = await readCSV(file);
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

const trainButton = document.getElementById("trainButton");
trainButton.addEventListener("click", postTrain);

const trainSplitRange = document.getElementById("trainSplit"),
  trainPercentInput = document.getElementById("trainPercent"),
  validationPercentInput = document.getElementById("validationPercent");

trainSplitRange.addEventListener("change", () => {
  updateTrainSplit(trainSplitRange.value);
});
trainPercentInput.addEventListener("change", () => {
  updateTrainSplit(trainPercentInput.value);
});
validationPercentInput.addEventListener("change", () => {
  updateTrainSplit(validationPercentInput.value);
});

const trainFileInput = document.getElementById("trainFile");
trainFileInput.addEventListener("input", () => {
  document.getElementById("trainButton").disabled = false;
});

// function to load (Bangladesh) polygons
async function load_polygon(polygon_name) {
  var response = await fetch("/cropclassifier/" + polygon_name);
  var startupVars = await response.json();
  L.geoJSON(startupVars).addTo(map);
}

// initialize the map
var map = L.map("map", {
  center: [23.84574043942299, 90.28182335177792],
  zoom: 7.5,
});

const selectedYear = document.getElementById("year");
selectedYear.addEventListener("blur", () => {
  disableSeasons();
  disableSeasons();
});

function disableSeasons() {
  const currentDate = new Date();
  const selectedYear = document.getElementById("year"),
    amanRadio = document.getElementById("amanSeason"),
    ausRadio = document.getElementById("ausSeason"),
    boroRadio = document.getElementById("boroSeason");
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
}

window.onload = () => {
  // add basemap to the map
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 17,
    minZoom: 6,
  }).addTo(map);

  // STARTUP: Load the initial polygons of Bangladesh
  // load_polygon("bg_boundary");
  load_polygon("bg_divisions");
  // load_polygon("bg_zilas");
  // load_polygon("bg_upazilas");
  // load_polygon("bg_unions");

  // update train-validate split
  updateTrainSplit(document.getElementById("trainSplit").value);
  // postTrain();

  disableSeasons();
  disableSeasons();
};

// scope selection
const scopeSelector = document.getElementById("scope");
const countrySelector = document.getElementById("countries");
const divisionSelector = document.getElementById("divisions");
const zilaSelector = document.getElementById("zilas");
const upazilaSelector = document.getElementById("upazilas");
const unionSelector = document.getElementById("unions");

scopeSelector.addEventListener("change", () => {
  switch (scopeSelector.value) {
    case "heirachyScope":
      countrySelector.classList.remove("d-none");
      countrySelector.value = "Bangladesh";
      loadChildSelector(countrySelector);
      break;
    case "drawScope":
      countrySelector.classList.add("d-none");
      break;
  }
});

async function loadChildSelector(parentSelector) {
  function resetSelector(selectorElements) {
    for (j = 0, nSelectors = selectorElements.length; j < nSelectors; j++) {
      var options = selectorElements[j].options;
      for (i = options.length - 1; i >= 0; i--) {
        if (options[i].value) {
          selectorElements[j].remove(i);
        }
      }
    }
  }

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
    console.log(childValues);
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

      loadSelectorOptions([countrySelector.value], "divisions");

      break;
    case "divisions":
      resetSelector([zilaSelector, upazilaSelector, unionSelector]);
      zilaSelector.classList.remove("d-none");
      upazilaSelector.classList.add("d-none");
      unionSelector.classList.add("d-none");
      console.log(divisionSelector.value)

      loadSelectorOptions(
        [countrySelector.value, divisionSelector.value],
        "zilas"
      );

      break;
    case "zilas":
      resetSelector([upazilaSelector, unionSelector]);
      upazilaSelector.classList.remove("d-none");
      unionSelector.classList.add("d-none");

      loadSelectorOptions(
        [countrySelector.value, divisionSelector.value, zilaSelector.value],
        "upazilas"
      );

      break;
    case "upazilas":
      resetSelector([unionSelector]);
      unionSelector.classList.remove("d-none");

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
  }
}

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
// unionSelector.addEventListener("change",()=>{loadChildSelector(unionSelector)})
