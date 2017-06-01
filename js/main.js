var map ;
var mapcenter = {lat: 22.593684, lng: 77.234482};
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
            self.currentPlace(place);
            highlightMarker(place.marker);
            if (place.zomatoLoaded === false){
                // zomatoData(place);
            }
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
                  'user-Key':'e48b55bccf7a24fa18416d63b8443ff7'}

    // If call was successful store restaurants in global locations[] array
    }).done( function(zomatoResponse) {
        // self.zomatoError(false);
        place.rating(zomatoResponse.user_rating.aggregate_rating + "/5");
        place.image(zomatoResponse.featured_image);
        place.address(zomatoResponse.location.locality + ", " + zomatoResponse.location.city);
        place.url(zomatoResponse.url);
        place.menu(zomatoResponse.menu_url);
        place.cuisines(zomatoResponse.cuisines);
        if (place.rating()){place.zomatoLoaded(true);}
        var location = {
            lat:place.location().lat,
            lng:place.location().lng
        };
    }).fail( function() {
        // self.zomatoError(true);
        alert("Failed to load Data from Zomato, please try again later.")
        place.zomatoLoaded(true)
    })
    console.log(self.zomatoError())
};

var showAllMarkers = function(){
    ko.utils.arrayForEach(self.places(), function(place){
        place.marker.setVisible(true);
    })         
}

var removeAllMarkers = function(){
    ko.utils.arrayForEach(self.places(), function(place){
        place.marker.setVisible(false);
    })
}

var showSelectedMarker = function(selectedPlace){
    ko.utils.arrayForEach(self.places(), function(place){
        if (place.name() == selectedPlace.name()){
            place.marker.setVisible(true);
        }
    })
}

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
    self.zomatoLoaded= ko.observable(false);
};

var viewModel = function(){
    var self = this;
    this.places = ko.observableArray([]);
    this.cities = ko.observableArray(["All", "Bangalore", "Hyderabad", "Ahmedabad", "Pune", "Chennai", "Goa", "Auroville", "Ludhiana"]);
    this.selectedCity = ko.observable('All');
    // this.zomatoError = ko.observable(false);
    veganPlaces.forEach(function(p){
        self.places.push(new Place(p));
    });

    this.filteredPlaces = ko.computed(function(){
        if (self.selectedCity() == "All"){
            // console.log(places())
            return self.places();
        }
        return ko.utils.arrayFilter(self.places(), function(place) {
            if(place.city() == self.selectedCity()){
                // console.log(place)
                return place;
            }
        })
    })

    // console.log(this.filteredPlaces())

    this.setFilter = function(city){
        self.selectedCity(city)
        for (var i=0; i<self.places().length; i++){
            if ((places()[i].city() == self.selectedCity()) || (self.selectedCity() == 'All')){
                map.setZoom(5);
                map.setCenter(mapcenter);
                places()[i].marker.setVisible(true);
                console.log(self.selectedCity())
                console.log(self.places()[i].marker)
            }
            else{
                places()[i].marker.setVisible(false);
            }
        }
    }

    // console.log(self.filteredPlaces())

    this.currentPlace = ko.observable(this.places()[0]);

    this.viewPlace = function(place){
        self.currentPlace(place);
        var location = {
            lat:place.location().lat,
            lng:place.location().lng
        };
        if (place.zomatoLoaded === false){
            // zomatoData(place);
        }
        populateInfoWindow(place.marker, smallInfowindow);
        highlightMarker(place.marker);
        $('#zomato').modal('open'); 
    };   
}

ko.applyBindings(viewModel);