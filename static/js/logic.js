// Store our API endpoint inside queryEqUrl, queryTpUrl
var queryEqUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
var queryTpURL = "./static/data/PB2002_plates.json";


// Perform a GET request to the query URL
d3.json(queryEqUrl, function(eqData) {
  d3.json(queryTpURL, function(tpData) {
    // Once we get a response, send the data.features object to the createFeatures function
    createFeatures(eqData.features, tpData.features);
  });
});


// Function to determine marker size based on population
function markerSize(mag) {
  return mag * 5;
}

// Function to get color scale
function getColor(d) {
  return d > 5 ? '#ff0000' :
         d > 4 ? '#ffbf00' :
         d > 3 ? '#ffff00' :
         d > 2 ? '#00ff00' :
         d > 1 ? '#0080ff' :
                 '#8000ff';
}


function createFeatures(earthquakeData, tectonicplatesData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, latlng) {
    // style
    var geojsonMarkerOptions = {
      radius: markerSize(feature.properties.mag),
      fillColor: getColor(feature.properties.mag),
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
    // Setting the marker radius for the earthquake by passing population into the markerSize function
    // Popup on click displaying earthquakeData 
    return L.circleMarker(latlng, geojsonMarkerOptions).bindPopup("<h5>" + feature.properties.title + "</h5><hr><p>" + new Date(feature.properties.time) + "</p>");
    // );
  };

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: onEachFeature
  });

  var faultlines = L.geoJSON(tectonicplatesData);

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes, faultlines);
}

function createMap(earthquakes, faultlines) {

  // Define streetsmap layer
  var streetsmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: API_KEY
  });

  // Define outdoorsmap layer
  var outdoorsmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",{
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoors",
    accessToken: API_KEY
  });

  // Define satellite layer
  var streets_satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets-satellite",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Outdoors Map": outdoorsmap,
    "Streets-Satellite Map": streets_satellitemap,
    "Streets Map": streetsmap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    "Earthquakes": earthquakes,
    "Fault Lines": faultlines
  };


  // Create our map, giving it the satellitemap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.7749, -122.4194
    ],
    zoom: 6,
    layers: [streets_satellitemap, faultlines, earthquakes]
  });

  // Create Legend
  var legend = L.control({position: 'bottomleft'});
  legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend'),
          grades = [0, 1, 2, 3, 4, 5];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
              grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>F' : '+');
      }
      return div;
  };
  legend.addTo(myMap);

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Event Handler to keep popup layer on top
  myMap.on("overlayadd", function (event) {
    console.log("event");
    earthquakes.bringToFront();
  });
}
