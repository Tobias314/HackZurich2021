require(["esri/config",
"esri/Map",
 "esri/views/MapView",
  "esri/Basemap",
   "esri/layers/VectorTileLayer",
   "esri/layers/TileLayer",
   "esri/rest/serviceArea",
   "esri/rest/support/ServiceAreaParameters",
   "esri/rest/support/FeatureSet",
   "esri/Graphic",
   "esri/rest/networkService",
   "esri/layers/GraphicsLayer"
  ],
 function (esriConfig,Map, MapView, Basemap, VectorTileLayer, TileLayer, serviceArea, ServiceAreaParams, FeatureSet, Graphic, networkService, GraphicsLayer) {
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
    
      const map = new Map({
        basemap: basemap,
      });

    const view = new MapView({
      map: map,
      
      center: [7.1110511, 50.5446766], // Longitude, latitude
      zoom: 13, // Zoom level
      container: "viewDiv" // Div element
    });
	

	
	
	
    const serviceAreaUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";

    var alarmButton = document.getElementById("Alarm");
    alarmButton.addEventListener("click", async function() {
		
		// trying to pull JSON file
		const response = await fetch('http://localhost:8000/floodarea');
	  const myJson = await response.json(); //extract JSON from the http response
	  // do something with myJson
	  mydata = JSON.parse(data);
		alert(mydata[0].x);
		alert(mydata[0].y);
		alert(mydata[1].x);
		alert(mydata[1].y);
		
      const graphicsLayer = new GraphicsLayer();
      map.add(graphicsLayer);
      // Create a polygon geometry
      const polygon = {
          type: "polygon",
          rings: [[
              [7.1110511, 50.5446766], //Longitude, latitude
              [7.1280511, 50.5446766], //Longitude, latitude
              [7.1280511, 50.5499766], //Longitude, latitude
              [7.1110511, 50.5499766], //Longitude, latitude
              [7.1110511, 50.5446766]  //Longitude, latitude
          ]]
      };
      const simpleFillSymbol = {
          type: "simple-fill",
          color: [227, 139, 79, 0.8],  // Orange, opacity 80%
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
        const timeCutoffs = [5]; // Minutes
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