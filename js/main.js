/**
 * @fileoverview Main javascript file that contains knockout ViewModel, Zomato AJAX callback function and Google Map related functions.
 * @author Sejal sejalrparikh@gmail.com
  */

var map ; 
var mapcenter = {lat: 22.593684, lng: 77.234482}; //Sets India as a center of the map

//Google maps error handler
function googleError(){
    alert('Failed to load Google map data.');
}

/**
 * Initiates google map and adds markers to the map.
 * @returns {object} returns the google map object
 */
var initMap = function(){
    mapElement = document.getElementById('map');

    map = new google.maps.Map(mapElement, {
        center: mapcenter,
        zoom: 5,
        mapTypeControl: false
    });
              
    // Default marker icon
    defaultIcon = makeMarkerIcon('0091ff');
    // Create a "highlighted location" marker color mouseover event
    highlightedIcon = makeMarkerIcon('FFFF24');
    
    //Declare InfoWindow
    smallInfowindow = new google.maps.InfoWindow();

    //Adds markers for all the places in the ViewModel
    for(var i=0; i<self.places().length; i++){
        addMarker(self.places()[i]);
    }

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
};

/**
 * Adds a marker for each place passed as a parameter and sets event listeners for the markers.
 * @param  {object} place Knockout observable object, a place for which the google map marker needs to be added.
 */
var addMarker = function(place){

    //Create a location object based on lat, lng of the place
    this.pos = { 
        lat:place.location.lat,
        lng:place.location.lng 
    };

    /** 
     * Creates a new instance of google maps marker
     */
    place.marker = new google.maps.Marker({
        map: map,
        position: this.pos,
        title: place.name(),
        icon:defaultIcon,
        animation: google.maps.Animation.DROP
    });

    if(place.marker){                  
        // If marker exists, add event listener
        google.maps.event.addListener(place.marker, 'click', function() {
            self.currentPlace(place); //Set the place as current place
            highlightMarker(place.marker); //Highlight the place marker
            if (!place.zomatoLoaded){
                zomatoData(place); //Load Zomato data, if not already loaded
            }
            populateInfoWindow(place.marker, smallInfowindow); //Populate InfoWindow for the marker
            $('#zomato').modal('open'); // Open Modal dialog with place details
        });

        //Highlight marker on mouseover
       google.maps.event.addListener(place.marker, 'mouseover', function() {
          place.marker.setIcon(highlightedIcon); 
        });

        //Return to default marker on mouseout
       google.maps.event.addListener(place.marker, 'mouseout', function() {
          place.marker.setIcon(defaultIcon);
        });
    }
};

/**
 * Populates the InfoWindow when the marker is clicked.
 * @param  {object} marker Google Maps Marker
 * @param  {object} infowindow Google Maps InfoWindw
 */
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

/**
 * Hightlights marker when clicked, increases zoom and centers the map on the marker.
 * @param {object} marker Google Maps Marker
 */
var highlightMarker = function(marker){
    marker.setAnimation(google.maps.Animation.BOUNCE);
    map.setZoom(8);
    map.setCenter(marker.getPosition());
};

/**
 * Removes marker highlights, resets the zoom lever and sets the map center back to original
 * @param  {object} marker Google Maps Marker
 */
var resetMarkerHighlight = function(marker){
    map.setZoom(5);
    map.setCenter(mapcenter);
    marker.setAnimation(null);
};
/**
 * AJAX call, made using Zomato API. To request for API key, visit : https://developers.zomato.com/api
 * Gets the following information from Zomato based on the restaurant ID:
 * Rating, Image, Address, Zomato URL, Menu URL, and Cuisines
 * @param  {object} place Place for which zomata data should be retrieved
 */
var zomatoData = function(place){
    var restaurant_id = place.res_id
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'https://developers.zomato.com/api/v2.1/restaurant?res_id=' +  restaurant_id,
        headers: {Accept: 'application/json',
            'user-Key':'294c4fb7f546e452818b1dce49a06d58'} //https://developers.zomato.com/api - Request API key here

    }).done( function(zomatoResponse){
        place.rating(zomatoResponse.user_rating.aggregate_rating || "No Zomato rating available");
        place.image(zomatoResponse.featured_image || "Image not available");
        locality = zomatoResponse.location.locality || '';
        city = zomatoResponse.location.city || place.city;
        place.address(locality + ", " + city);
        place.url(zomatoResponse.url || "#!");
        place.menu(zomatoResponse.menu_url || "#!");
        place.cuisines(zomatoResponse.cuisines || "No cuisines information available.");
        //Indicates that data has alredy been loaded.
        //Zomato API allows 1000 calls per day. Checking if the data has already been loaded, saves the 
        //number of API calls to be made per browser session.
        if (place.rating()){
            place.zomatoLoaded = true; 
        }
        // var location = {
        //     lat:place.location.lat,
        //     lng:place.location.lng
        // };
    }).fail( function() {
        alert("Failed to load Data from Zomato, please try again later.")
        place.zomatoLoaded = false;
    });
};

/**
 * @constructor Place
 * @param  {object} place creates a knockout observable object for the given place in the model data
 */
var Place = function(place){
    var self = this;
    self.name = ko.observable(place.name);
    self.facebook = ko.observable(place.facebook);
    self.image = ko.observable();
    self.rating = ko.observable();
    self.address = ko.observable();
    self.menu = ko.observable();
    self.cuisines = ko.observable();
    self.url = ko.observable();
    self.city = place.city;
    self.marker; //Google maps marker object, not knockout observable
    self.res_id = place.res_id;
    self.location = place.location;
    self.zomatoLoaded = false;
};
/**
 * Knowckout ViewModel function
 */
var ViewModel = function(){
    var self = this;
    this.places = ko.observableArray([]);
    // this.cities = ko.observableArray(["All","Bangalore", "Hyderabad", "Ahmedabad", "Pune", "Chennai", "Goa", "Auroville", "Ludhiana"]);
    this.selectedCity = ko.observable('All');

    // Add a new knockout Place object for each place in the model data.
    veganPlaces.forEach(function(p){
        self.places.push(new Place(p));
    });

    // Extract unique cities from the places array
    self.uniqueCities = ko.computed(function () {
        var cities = ko.utils.arrayMap(self.places(), function (place) {return place.city;})
        return ko.utils.arrayGetDistinctValues(cities).sort();
    });

    // Concatenate the unique cities list with cities array, to incorporate the option to select All cities
    this.cities = ko.observableArray(['All']);
    ko.utils.arrayForEach(self.uniqueCities(), function(city){
        self.cities.push(city);
    });

    // Computed observable, that contains list of places for a selected city
    this.filteredPlaces = ko.computed(function(){
        if (self.selectedCity() == "All"){
            return self.places();
        }
        return ko.utils.arrayFilter(self.places(), function(place) {
            if(place.city == self.selectedCity()){
                return place;
            }
        });
    });
    
    /**
     * Shows only markers that belong to the selected city
     * @param  {string} city city selected by the user
     */
    this.setFilter = function(city){
        self.selectedCity(city)
        for (var i=0; i<self.places().length; i++){
            if ((places()[i].city == self.selectedCity()) || (self.selectedCity() == 'All')){
                map.setZoom(5);
                map.setCenter(mapcenter);
                places()[i].marker.setVisible(true);
                places()[i].marker.setAnimation(null);
            }
            else{
                places()[i].marker.setVisible(false);
            }
        }
        smallInfowindow.close();
    };

    //By default sets the first place in the array as a current place.
    this.currentPlace = ko.observable(this.places()[0]);

    /**
     * Sets the selected place as a current place, loads data from Zomato if not already loaded,
     * Sets the selected places as a map center with increased zoom, populates the marker InfoWindow, 
     * and loads the modal dialog.
     * @param  {object} place Place clicked by the user
     */
    this.viewPlace = function(place){
        self.currentPlace(place);
        var location = {
            lat:place.location.lat,
            lng:place.location.lng
        };
        if (!place.zomatoLoaded){
            zomatoData(place);
        }
        populateInfoWindow(place.marker, smallInfowindow);
        highlightMarker(place.marker);
        $('#zomato').modal('open'); 
    };   
};

//Apply knockout bindings
ko.applyBindings(ViewModel);