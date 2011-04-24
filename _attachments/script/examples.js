$(function(){  
   $('#btn_sanitation').bind('click', function(ev) {
       var addr = $('#address').attr('value');
       var gmaps_url = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address='+encodeURI(addr);
       
       var geocoder = new google.maps.Geocoder();

       if (geocoder) {
            geocoder.geocode({ 'address': addr }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var point = results[0].geometry.location;
                    $.ajax({
                        url: 'http://phlapi.com:5984/api/_design/civicapi/_rewrite/v1/phl_sanitation_districts?bbox='+point.lng()+','+point.lat()+','+point.lng()+','+point.lat(),
                        crossDomain: true,
                        success: function(data, status, xhr) {
                            data = jQuery.parseJSON(data);
                            if(data.features.length != 0) {
                                $('#response').html('You live in sanitation district '+data.features[0].properties.properties.SANDIS);
                            } else {
                                $('#response').html('Sorry, we could not find your sanitation district');
                            }
                        },
                        failure: function(data, status, xhr) {
                            $('#response').html('There was an error talking to PHL API: '+ status);
                        }
                    })
                }
                else {
                   console.log("Geocoding failed: " + status);
                }
            });
        }
   }); 
});