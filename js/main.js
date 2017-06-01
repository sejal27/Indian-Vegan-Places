// when google maps api gets failed
var googleError = function(){
    self.error_message('Failed to load GoogleMaps Api');
    self.apiError(true);
};
// when google maps api gets failed
var FourSquareError = function(){
    self.error_message('Failed to load Foursquare Api');
    self.apiError(true);
};

var map ;
this.marker;
var initMap = function(){
    var pyrmont = {lat: 17.3850, lng: 78.4867};
    // displays the requested map content in map div 
    map = new google.maps.Map(document.getElementById('map'), {
        center: pyrmont,
        zoom: 12
    });
    // displays location information in window when marker clicked
    infowindow = new google.maps.InfoWindow();
              
    for(var i=0; i<places.length; i++){
        AddMarker(places[i]);
    };
  
};


// Adds the marker by getting place location details
var AddMarker = function(place){
        var myLatLng = { lat:place.location.lat,
                         lng:place.location.lng };
        self.marker = new google.maps.Marker({
            map:map,
            animation: google.maps.Animation.DROP,
            position: myLatLng
        });
        if(self.marker){
            self.markersArray().push([myLatLng,
                                     self.marker]);                    
            google.maps.event.addListener(marker, 'click', function() {
                stopAnimation();
                startAnimation(myLatLng)
                FoursquareData(place);
            });
        }
};

// removes all the markers
var removeMarkers = function(){
    for(var x=0; x<self.markersArray().length; x++ ){
        self.markersArray()[x][1].setMap(null);
    }
};
// shows all the markers    
var showMarkers = function(){
    for(var i=0; i<self.markersArray().length; i++ ){
        self.markersArray()[i][1].setMap(map);
    }
}; 

// starts the marker bounce animation
var startAnimation = function(myLatLng){
    ko.computed(function(){
            ko.utils.arrayForEach(self.markersArray(), function(m){
                if(myLatLng.lat === m[0].lat && myLatLng.lng ===m[0].lng){
                    m[1].setAnimation(google.maps.Animation.BOUNCE);
                }
            });
        });
}

// stops the marker bounce animation
var stopAnimation = function(){
    for(var i=0; i<self.markersArray().length; i++ ){
        self.markersArray()[i][1].setAnimation(null);
    }
}

// Gets the location data from Foursquare
var FoursquareData = function(place){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; 
    var yyyy = today.getFullYear();
    
    if(dd<10){
        dd='0'+dd
    } 
    if(mm<10){
        mm='0'+mm
    } 
    var today = ""+yyyy+mm+dd+"";

    var venue_id = place.venue_id;
    var client_id = "BWUSFIWLOPWY0F3RPSBEER3Y5AVNORL4SJ5UUH2LG2RLUSIH";
    var client_secret = "0DFTYZIDWMTDRMGHMSXZ1RZL12IEMDBGWVSAA0XNJ0K1R3AV";
    var FoursquareUrl = "https://api.foursquare.com/v2/venues/"+venue_id+"?client_id="+client_id+"&client_secret="+client_secret+"&v="+today+"" ;
    
    $.ajax({
        url:FoursquareUrl,
        dataType:"json",
        async:true        
    }).success(function(data){
            self.des_name(data.response.venue.name);
            self.rating(data.response.venue.rating);
            var image_prefix = data.response.venue.bestPhoto.prefix;
            var image_suffix = data.response.venue.bestPhoto.suffix;
            self.location_image(image_prefix +"320x200"+ image_suffix);
            if(data.response.venue.tips.groups[0].items[0].text){
                self.review(data.response.venue.tips.groups[0].items[0].text);
            }   
    }).error(function(data){
        FourSquareError();
    })
    
};





var viewModel = function(){
    var self = this;
    this.markersArray = ko.observableArray([]);
    this.query = ko.observable();
    this.location_image = ko.observable();
    this.des_name = ko.observable();
    this.rating = ko.observable();
    this.review = ko.observable();
    this.apiError = ko.observable(false);
    this.error_message = ko.observable();
    // filters the places array when searched in a query input
    this.searchResults = ko.computed(function() {
        q = self.query();
        if(!q){
            showMarkers();
            return places;
        }
        else{
            removeMarkers();
            return ko.utils.arrayFilter(places, function(place) {
                if(place.name.toLowerCase().indexOf(q) >= 0) {
                    AddMarker(place);
                    return place;
                }    
            });
        }
    });

    // when name of the location clicked displays infowindow
    this.viewPlace = function(place){
        var check_myLatLng = {lat:place.location.lat,
                               lng:place.location.lng};
        stopAnimation();
        startAnimation(check_myLatLng);
        FoursquareData(place);       
    };  
    this.closeDesc = function(){
        self.des_name(null);
    };
     
};     

  
    
ko.applyBindings(viewModel);  
