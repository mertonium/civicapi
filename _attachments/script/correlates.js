var map, po, currentData, geoJson;

// Should probably abstract out the couch url and the db prefix and the version and the starting map center.
var config = {
	'couchUrl':'http://phlapi.com:5984',
	'dbPrefix':'phl_',
	'version':'v1',
	'rewrite':'/api/_design/civicapi/_rewrite',
	'mapCenterLat':39.9522783,
	'mapCenterLng':-75.1636505,
	'mapStartZoom':14
};

$(function(){  
  po = org.polymaps;
  geoJson = po.geoJson();
  
  var featuresCache = {};

  map = po.map()
      .container($('.map_container')[0].appendChild(po.svg("svg")))
      .center({lat: config.mapCenterLat, lon: config.mapCenterLng})
      .zoom(config.mapStartZoom)
      .add(po.interact())
      .add(po.hash());

  map.add(po.image()
      .url(po.url("http://{S}tile.cloudmade.com"
      + "/d3394c6c242a4f26bb7dd4f7e132e5ff" // http://cloudmade.com/register
      + "/998/256/{Z}/{X}/{Y}.png")
      .repeat(false)
      .hosts(["a.", "b.", "c.", ""])));

  map.add(po.compass()
      .pan("none"));
      
  
  function randomColor(colors) {
    var sick_neon_colors = ["#CB3301", "#FF0066", "#FF6666", "#FEFF99", "#FFFF67", "#CCFF66", "#99FE00", "#EC8EED", "#FF99CB", "#FE349A", "#CC99FE", "#6599FF", "#03CDFF"];
    return sick_neon_colors[Math.floor(Math.random()*sick_neon_colors.length)];
  };
  
  function load(e){
    var cssObj = randColor = randomColor();
    
    for (var i = 0; i < e.features.length; i++) {
      
      var feature = e.features[i];
      
      //console.log(feature.data.geometry.type == 'LineString' ? 'none' : randColor)
      
      if( feature.data.geometry.type == 'LineString' || feature.data.geometry.type == 'MultiLineString' ) {
        cssObj = {
          fill: 'none',
          stroke: randColor,
          strokeWidth:2,
          opacity: .8 
        }
      } else {
        cssObj = {
          fill: randColor,
          opacity: .2 
        }
      }

      $( feature.element )
        .css( cssObj )
    }
  }

  function fetchFeatures(bbox, dataset, callback) {

    $.ajax({
      url: config.couchUrl + config.rewrite + "/" + config.version + "/" + dataset,
      dataType: 'jsonp',
      data: {
        "bbox": bbox
      },
      success: callback
    });

  }

  var showDataset = function( dataset ) {
    var bbox = getBB();

	$('.map_header').first().toggleClass('loading');
    fetchFeatures( bbox, dataset, function( data ){

      var feature = po.geoJson()
            .features( data.features )
            .on( "show", load );

      featuresCache[dataset] = feature;

      map.add( feature );
	  $('.map_header').first().toggleClass('loading');

    })
  }

  var removeDataset = function( dataset ) {
    map.remove( featuresCache[dataset] );
  }

  var getBB = function(){
    return map.extent()[0].lon + "," + map.extent()[0].lat + "," + map.extent()[1].lon + "," + map.extent()[1].lat;
  }

  // Get all sets
  $.ajax({ 
    url: config.couchUrl + config.rewrite + "/datasets",
    dataType: 'jsonp', 
    success: function(data){ 
      $.each(data.datasets, function( i, item ){
        $('<li>', {
          class: item.name,
          html: '<input type="checkbox"/>' + item.name.replace('_', ' ')
        })
        .appendTo('.sidebar')
      })
    } 
  }); 
  
  // Interaction/event binding
  $('[type=checkbox]').live('click', function(){
    if($(this).parents('li').hasClass('live_trains')) {
      $.ajax({                                                                                      
        url: "http://jsonpify.heroku.com?resource=http://openmbta.org/ocd/train_trajectories.json",
        dataType: 'jsonp',                                                                          
        success: function(data){                                                                    
          t = JSON.parse(data);
          $.each(["Red", "Blue", "Orange"], function(i, color){
            var r = t[color].map(function(col){ 
              var l = col.arriving.geo;
              return { "type": "Feature",
                "geometry": {'type': 'Point', 'coordinates': [l[0], l[1]]}
              };
            })

            map.add( po.geoJson().features( r ).on('load', load));
          })
          
        }
      });
    } else {
      var input = $(this)
          dataSet = config.dbPrefix + input.parent().attr('class');

      if( $(this).attr('checked') ) {
        showDataset( dataSet );
      } else {
        removeDataset( dataSet );
      }      
    }
  });

  


  //Slider
  $( ".slider" ).slider({
    range: true,
    min: 1900,
    max: 2011,
    values: [ 2003, 2008 ],
    slide: function( event, ui ) {
      $( ".date" ).html( ui.values[ 0 ] + " - "+ ui.values[ 1 ] );
    }
  });
  $( ".date" ).html( $( ".slider" ).slider('values')[ 0 ] + " - "+ $( ".slider" ).slider('values')[ 1 ] );

  $(".gencalls").click(function(){
    $('#dialog ul').html("");
    $('[type=checkbox]').each(function(i, item){
      var input = $(this),
          dataSet = config.dbPrefix + input.parent().attr('class');

      if( $(this).attr('checked') ) {
        $('#dialog ul').append( "<li><a href='"+config.couchUrl + config.rewrite + "/"+config.version+"/" + dataSet + "?" + $.param({"bbox": getBB()}) + "'>" + dataSet + "</a></li>" );
      }
    });
    
    $('#dialog').dialog({
      modal: true,
      title: 'API Calls',
      width: 400
    })
  })
  
});