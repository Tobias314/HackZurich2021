require(["esri/config",
"esri/Map",
 "esri/views/SceneView",
  "esri/Basemap",
   "esri/layers/VectorTileLayer",
   "esri/layers/TileLayer",
   "esri/rest/serviceArea",
   "esri/rest/support/ServiceAreaParameters",
   "esri/rest/support/FeatureSet",
   "esri/Graphic",
   "esri/rest/networkService",
 "esri/widgets/CoordinateConversion"],
 function (esriConfig, Map, SceneView, Basemap, VectorTileLayer, TileLayer, serviceArea, ServiceAreaParams, FeatureSet, Graphic, networkService, CoordinateConversion) {
    esriConfig.apiKey = "AAPK172fad7fe111481a8da5008626ae12a7qj62qoE60E7f9U7R9jV7ZFl1VVr2EEeIuQ3yoJ04Zag7rctohS6J7qGbhA3ELnN_";

    const baseMapeVectorTileLayer = new VectorTileLayer({
        portalItem: {
          id: "d7cef8058bdb40b9ae2569f59a22abf8" // Forest and Parks Canvas
        }
    });

      const basemap = new Basemap({
        baseLayers: [
            baseMapeVectorTileLayer,
        ]
      });

      var map = new Map({
        ground: "world-elevation",
        basemap: "hybrid",
      });


    const view = new SceneView({
      map: map,

      center: [7.1110511, 50.5446766], // Longitude, latitude
      zoom: 16, // Zoom level
      container: "viewDiv2" // Div element
    });


    const ccWidget = new CoordinateConversion({
      view: view
    });
    view.ui.add(ccWidget, "bottom-left");


    view.on("click", function(event){
      createGraphic(event.mapPoint.latitude, event.mapPoint.longitude);
    });

    function createGraphic(lat, long){

      var formLongitude = document.getElementById("formLongitude")
      formLongitude.setAttribute("value", long)
      var formLatitude = document.getElementById("formLatitude")
      formLatitude.setAttribute("value", lat)

      // First create a point geometry
      var point = {
        type: "point", // autocasts as new Point()
        longitude: long,
        latitude: lat
      };

      // Create a symbol for drawing the point
      var markerSymbol = {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        color: [0, 255, 0]
      };

      // Create a graphic and add the geometry and symbol to it
      var pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
      });

      // Add the graphics to the view's graphics layer
      view.graphics.add(pointGraphic);
    }


    //view.on("double-click", function(event){
    //  createGraphic2(event.mapPoint.latitude, event.mapPoint.longitude);
    //});

    /*
    function createGraphic2(lat, long){
      // First create a point geometry
      var point = {
        type: "point", // autocasts as new Point()
        longitude: long,
        latitude: lat
      };

      // Create a symbol for drawing the point
      var markerSymbol = {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        color: [0, 0, 255]
      };

      // Create a graphic and add the geometry and symbol to it
      var pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
      });

      // Add the graphics to the view's graphics layer
      view.graphics.add(pointGraphic);
    }*/
});
