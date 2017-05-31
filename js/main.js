var map ;
var mapcenter = {lat: 20.593684, lng: 78.96288};
var initMap = function(){
    mapElement = document.getElementById('map');

    map = new google.maps.Map(mapElement, {
        center: mapcenter,
        zoom: 5,
        mapTypeControl: false
    });
              
    // Style the markers a bit. This will be our listing marker icon.
    defaultIcon = makeMarkerIcon('0091ff');
    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    highlightedIcon = makeMarkerIcon('FFFF24');
    
    smallInfowindow = new google.maps.InfoWindow();

    for(var i=0; i<self.places().length; i++){
        AddMarker(self.places()[i]);
    };

    // This function takes in a COLOR, and then creates a new marker
    // icon of that color. The icon will be 21 px wide by 34 high, have an origin
    // of 0, 0 and be anchored at 10, 34).
    function makeMarkerIcon(markerColor) {
      var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
      return markerImage;
    }
    // bounds = new google.maps.LatLngBounds();
};

var AddMarker = function(place){
    this.pos = { 
        lat:place.location().lat,
        lng:place.location().lng 
    };

    place.marker = new google.maps.Marker({
        map: map,
        position: this.pos,
        title: place.name(),
        icon:defaultIcon,
        animation: google.maps.Animation.DROP
    });

    if(place.marker){                  
        google.maps.event.addListener(place.marker, 'click', function() {
            highlightMarker(place.marker);
            // zomatoData(place);
            populateInfoWindow(place.marker, smallInfowindow);
            $('#zomato').modal('open');
        });

       google.maps.event.addListener(place.marker, 'mouseover', function() {
          place.marker.setIcon(highlightedIcon);
        });

       google.maps.event.addListener(place.marker, 'mouseout', function() {
          place.marker.setIcon(defaultIcon);
        });
    }
};

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
          resetMarkerHighlight(marker);
        });
   }
}

var highlightMarker = function(marker){
    // marker.setIcon(highlightedIcon);
    map.setZoom(8);
    map.setCenter(marker.getPosition());
}

var resetMarkerHighlight = function(marker){
    map.setZoom(5);
    map.setCenter(mapcenter);
}

var zomatoData = function(place){
    var restaurant_id = place.res_id()
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'https://developers.zomato.com/api/v2.1/restaurant?res_id=' +  restaurant_id,
        headers: {Accept: 'application/json',
                  'user-Key':'294c4fb7f546e452818b1dce49a06d58'}

    // If call was successful store restaurants in global locations[] array
    }).done( function(zomatoResponse) {
        self.zomatoSuccess(true);
        place.rating(zomatoResponse.user_rating.aggregate_rating + "/5");
        place.image(zomatoResponse.featured_image);
        place.address(zomatoResponse.location.locality + ", " + zomatoResponse.location.city);
        place.url(zomatoResponse.url);
        place.menu(zomatoResponse.menu_url);
        place.cuisines(zomatoResponse.cuisines);
        var location = {
            lat:place.location().lat,
            lng:place.location().lng
        };
    }).fail( function() {
        self.zomatoSuccess(false);
    })
};

var Place = function(place){
    var self = this;
    self.name = ko.observable(place.name);
    self.city = ko.observable(place.city);
    self.place_id = ko.observable(place.place_id);
    self.res_id = ko.observable(place.res_id);
    self.location = ko.observable(place.location);
    self.facebook = ko.observable(place.facebook);
    self.image = ko.observable();
    self.rating = ko.observable();
    self.address = ko.observable();
    self.menu = ko.observable();
    self.cuisines = ko.observable();
    self.url = ko.observable();
    self.marker;
};

var viewModel = function(){
    var self = this;
    this.places = ko.observableArray([]);
    this.zomatoSuccess = ko.observable(false);
    veganPlaces.forEach(function(p){
        self.places.push(new Place(p));
    });

    for(var i=0; i<self.places().length; i++){
        zomatoData(places()[i]);
    }

    this.currentPlace = ko.observable(this.places()[0]);

    this.viewPlace = function(place){
        self.currentPlace(place);
        var location = {
            lat:place.location().lat,
            lng:place.location().lng
        };
        populateInfoWindow(place.marker, smallInfowindow);
        highlightMarker(place.marker);
        $('#zomato').modal('open'); 
    };   
}

ko.applyBindings(viewModel);