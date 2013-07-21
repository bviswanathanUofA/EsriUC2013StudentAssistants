dojo.require("esri.map");
dojo.require("esri.tasks.locator");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.PopupMobile");
dojo.require("esri.tasks.QueryTask");
dojo.require("esri.tasks.query");

var geometryService;
var map;
var loadedInitParams = new Boolean();
loadedInitParams = false;
var tiledLayer;
var studentsLayer;

function init() {
	populateSearch();

	//Creating map object using Esri JS API
	 map= new esri.Map("map",{
	  basemap:"topo",
	  center:[-98, 39], //long, lat
	  zoom:4,
	  slider:true,
	  showAttribution:false,
	  logo:false,
	  
	});

	 
     //dojo.addClass(map.infoWindow.domNode, "myTheme");
	
	//geometryService=new esri.tasks.GeometryService("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
	
	

	studentsLayer=new esri.layers.FeatureLayer("http://services1.arcgis.com/Ezk9fcjSUkeadg6u/ArcGIS/rest/services/studentAssistants/FeatureServer/0",{
      
      outFields: ["*"]
      //infoTemplate:template
    });

    studentsLayer.setSelectionSymbol(new esri.symbol.PictureMarkerSymbol('images/pushpin_24x24.png',24,24));

    
	map.addLayer(studentsLayer);

	dojo.connect(map,"onClick",function(evt){
	  map.graphics.clear();
	  studentsLayer.clearSelection();
      var query = new esri.tasks.Query();
      query.geometry = pointToExtent(map,evt.mapPoint,10);
      studentsLayer.selectFeatures(query,esri.layers.FeatureLayer.SELECTION_NEW,function(features){
      	populatePopupContent(features[0]);
      });
      
    });
	
	//Call functions - Geocode or Search depending on radio button when ENTER is pressed in Searchbox. KeyCode for Enter == 13
	$("#searchBox").keydown(function(e){
		if(e.keyCode==13){
			search($(this).val());
		}
				
	});

	
	
	
	
  
}

function pointToExtent(map, point, toleranceInPixel) {
   var pixelWidth = map.extent.getWidth() / map.width;
   var toleraceInMapCoords = toleranceInPixel * pixelWidth;
   return new esri.geometry.Extent( point.x - toleraceInMapCoords,
                point.y - toleraceInMapCoords,
                point.x + toleraceInMapCoords,
                point.y + toleraceInMapCoords,
                map.spatialReference );                           
}



function search(text){
	//Clear all map graphics
	map.graphics.clear();
	
	//Perform a query on Student feature layer
	var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/Ezk9fcjSUkeadg6u/ArcGIS/rest/services/studentAssistants/FeatureServer/0");
	var query = new esri.tasks.Query();
	
	//Query will be performed by Student name
	query.where = "Student LIKE '%"+text+"%'";
	query.outSpatialReference = {wkid:102100}; 
	query.returnGeometry = true;
	query.outFields = ["*"];
	
	//Function to be called when Query executes without any error
	queryTask.execute(query,function(featureSet){
		for (var i=0;i<featureSet.features.length;i++){
			var sms = new esri.symbol.PictureMarkerSymbol('images/pushpin_24x24.png',24,24);
			map.graphics.add(new esri.Graphic(featureSet.features[i].geometry,sms));
		}
		//If more than 1 feature is returned, the map will set its extent to the featureSet
		if(featureSet.features.length>1){
			map.setExtent(new esri.graphicsExtent(featureSet.features));
		}else {
			map.centerAndZoom(featureSet.features[0].geometry,16);

			populatePopupContent(featureSet.features[0]);
			
		}
		
			
	});

	
	
	//Function when Query task fails
	dojo.connect(queryTask,"onError",function(error){
		//$('#results').html("No features found");
	});

	//http://www.arcgis.com/sharing/rest/content/items/6e03e8c26aad4b9c92a87c1063ddb0e3/info/thumbnail/topo_map_2.jpg
}

function populatePopupContent(feature){

	$("#popup-content").html("<h5 id='popup-header'>"+feature.attributes["Student"]+"</h5>");
	$("#popup-content").append("<p id='popup-para'>University: "+feature.attributes["University"]+
		"<br/>Hometown: "+feature.attributes["Hometown"]+"</p>");

	studentsLayer.queryAttachmentInfos(feature.attributes[studentsLayer.objectIdField],function(infos){
		if (infos.length==0){
			$("#popupCloseRight").popup("open");
		}else if (!!infos[0].url){
			$("#popup-content").append("<img id='popup-image' src='"+infos[0].url+"'/>");
			$("#popupCloseRight").popup("open");
		}else {
			$("#popupCloseRight").popup("open");
		}
		
	});

}
function changeBasemap(){
	var currentUrl=$('#basemap').css('background-image').replace('url(','').replace(')','').replace('"','').replace('"','');
	
	//Function to toggle between Aerial imagery and topo map
	if (currentUrl=='http://www.arcgis.com/sharing/rest/content/items/86de95d4e0244cba80f0fa2c9403a7b2/info/thumbnail/tempimagery.jpg'){
		$('#basemap').css("background-image", "url(http://www.arcgis.com/sharing/rest/content/items/6e03e8c26aad4b9c92a87c1063ddb0e3/info/thumbnail/topo_map_2.jpg)");
		map.setBasemap("hybrid");
		map.removeLayer(tiledLayer);
		
		
	}else {
		$('#basemap').css("background-image", "url(http://www.arcgis.com/sharing/rest/content/items/86de95d4e0244cba80f0fa2c9403a7b2/info/thumbnail/tempimagery.jpg)");
		map.setBasemap("topo");
		map.addLayer(tiledLayer);
		
	}
	
}

function populateSearch(){
	var searchValues=[];
	var qt = new esri.tasks.QueryTask("http://services1.arcgis.com/Ezk9fcjSUkeadg6u/ArcGIS/rest/services/studentAssistants/FeatureServer/0");
    var query = new esri.tasks.Query();
    query.where = "1=1";
    query.returnGeometry = false;
    query.outFields = ["*"];
    qt.execute(query,function(featureSet){
    	for(var i=0;i<featureSet.features.length;i++){
    		searchValues.push(featureSet.features[i].attributes["Student"]);
    	}
    	$("#searchBox").autocomplete({source:searchValues});
    });
}

dojo.ready(init);