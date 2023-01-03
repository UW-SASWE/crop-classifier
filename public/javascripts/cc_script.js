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

async function postTrain() {
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
    body: JSON.stringify({ csvData, splitRatio }),
  };
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
async function loadTrainPoints() {}

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

window.onload = () => {
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
    L.geoJSON(startupVars).addTo(map);
  }

  // STARTUP: Load the initial polygons of Bangladesh
  // load_polygon("bg_boundary");
  load_polygon("bg_divisions");
  // load_polygon("bg_zilas");
  // load_polygon("bg_upazilas");
  // load_polygon("bg_unions");

  // update train-validate split
  updateTrainSplit(document.getElementById("trainSplit").value);
  // postTrain();
};
