require(["esri/config",
"esri/Map",
 "esri/views/MapView",
  "esri/Basemap",
   "esri/layers/VectorTileLayer",
   "esri/rest/serviceArea",
   "esri/rest/support/ServiceAreaParameters",
   "esri/rest/support/FeatureSet",
   "esri/rest/networkService",
   "esri/Graphic",
   "esri/layers/GraphicsLayer",
   "esri/widgets/Track",
   "esri/Graphic"

  ],
 function (esriConfig,Map, MapView,Basemap, VectorTileLayer, 
  serviceArea, ServiceAreaParams, FeatureSet, networkService, Graphic, GraphicsLayer, Track) {
    esriConfig.apiKey = "AAPK172fad7fe111481a8da5008626ae12a7qj62qoE60E7f9U7R9jV7ZFl1VVr2EEeIuQ3yoJ04Zag7rctohS6J7qGbhA3ELnN_";

    var currentLocation = null;
    var timeTillFlood = 5;

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

      const map = new Map({
        basemap: basemap,
      });

    const view = new MapView({
      map: map,

      center: [7.1110511, 50.5446766], // Longitude, latitude
      zoom: 13, // Zoom level
      container: "viewDiv" // Div element
    });

    const track = new Track({
      view: view,
      goToLocationEnabled: true,
      graphic: new Graphic({
        symbol: {
          type: "simple-marker",
          size: "12px",
          color: "green",
          outline: {
            color: "#efefef",
            width: "1.5px"
          }
        }
      }),
      useHeadingEnabled: false
    });
    view.when(() => {

      let prevLocation = view.center;

          track.on("track", () => {
            currentLocation = track.graphic.geometry;
            view.goTo({
              center: location,
              scale: 7000,
            }).catch((error) => {
              if (error.name != "AbortError"){
                console.error(error);
              }
            });
            const locationGraphic = createGraphic(currentLocation);
            solveServiceArea(serviceAreaUrl, locationGraphic, [timeTillFlood], view.spatialReference);
            //track.start()
          });

      track.start()
    })
    view.ui.add(track, "top-left");

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);
	
    const serviceAreaUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";

    var alarmButton = document.getElementById("Alarm");
    alarmButton.addEventListener("click", async function() {
		
      // trying to pull JSON file
      const response = await fetch('http://localhost:8000/floodarea');
      const polygonJson = await response.json(); //extract JSON from the http response
      // do something with myJson
      //mydata = JSON.parse(myJson);
      var rings = []
      polygonJson.polygons.forEach(polygon => {
        rings.push(polygon.shell);
        polygon.holes.forEach(hole => rings.push(hole));
      });
      console.log(rings);
       //Create a polygon geometry

      const polygon = {
        type: "polygon",
       rings: rings
     };
      const simpleFillSymbol = {
          type: "simple-fill",
          color: [211, 239, 253, 0.8],  // Orange, opacity 80%
          outline: {
              color: [255, 255, 255],
              width: 1
          }
      };
      const polygonGraphic = new Graphic({
        geometry: polygon,
        symbol: simpleFillSymbol,
      });
      graphicsLayer.add(polygonGraphic);
    })

    view.on("click", function(event){
        const locationGraphic = createGraphic(event.mapPoint);
        const timeCutoffs = [timeTillFlood]; // Minutes
        solveServiceArea(serviceAreaUrl, locationGraphic, timeCutoffs, view.spatialReference);
    });

    function createGraphic(point) {
        view.graphics.removeAll();
        const graphic = new Graphic({
          geometry: point,
          symbol: {
            type: "simple-marker",
            color: "white",
            size: 8
          }
        });

        view.graphics.add(graphic);
        return graphic;
      }


      async function solveServiceArea(url, locationGraphic, timeCutoffs, outSpatialReference) {
        // Create one or more locations (facilities) to solve for
        const featureSet = new FeatureSet({
            features: [locationGraphic]
          });
          const networkDescription = await networkService.fetchServiceDescription(url);
          // Travel mode should be walking
          travelMode = networkDescription.supportedTravelModes.find(
              (travelMode) => travelMode.name === "Walking Time"
          );
          // Set all of the input parameters for the service
          const taskParameters = new ServiceAreaParams({
            facilities: featureSet,
            defaultBreaks: timeCutoffs,
            travelMode,
            trimOuterPolygon: true,
            outSpatialReference: outSpatialReference
          });


        return serviceArea.solve(url, taskParameters)
          .then(function(result){
            if (result.serviceAreaPolygons.length) {
              // Draw each service area polygon
              result.serviceAreaPolygons.forEach(function(graphic){
                graphic.symbol = {
                  type: "simple-fill",
                  color: "rgba(255,50,50,.25)"
                }
                view.graphics.add(graphic,0);
              });
            }
          }, function(error){
            console.log(error);
          });

      }

});
