jQuery(window).load(function() {

});


function zsDefaultFalse(theVar){
  theVar = typeof theVar !== 'undefined' ? theVar : false;
  return theVar;
}

function findAndReplace(id){
  var wrapperObj = jQuery('.fluid-width-video-wrapper').first();
  // Do I need to set padding-top on the wrapper?
  var iframeObj = wrapperObj.find('iframe');
  var theSrc = iframeObj.attr('src');
  var pattern = '<video id="'+id+'" src="" class="video-js vjs-default-skin" width="100%" height="" style="padding:0;" controls preload="auto" data-setup="{}">';

  iframeObj.replaceWith(pattern);
  wrapperObj.css('padding-top', 0)
  var cleanSrc = theSrc.split("?")[0];
  var ytid = cleanSrc.split("/embed/")[1];
  var youtube = 'https://www.youtube.com/watch?v='+ytid;
  return youtube;

}

function makeItPreroll(id, prerollXML, prerollTime, postrollXML, postrollTime){
  var preRollPluginSettings;
  var postRollPluginSettings;
  var secondXhr;
  jQuery('.fluid-width-video-wrapper').first().css('visibility','hidden');
  id = zsDefaultFalse(id);
  prerollXML = zsDefaultFalse(prerollXML);
  prerollTime = zsDefaultFalse(prerollTime);
  postrollXML = zsDefaultFalse(postrollXML);
  postrollTime = zsDefaultFalse(postrollTime);
  console.log('Find a VAST');
  var topXhr = jQuery.post(MyAjax.ajaxurl, {
    action: 'go_get_that_vast',
    //We'll feed it the ID so it can cache in a transient with the ID and find to retrieve later.
    vast_url: prerollXML,
    security: MyAjax.security
  }, function(response){
    console.log('Vast Found');
    //console.log(response);
    /**
    secondXhr = jQuery.post(MyAjax.ajaxurl, {
      action: 'go_get_that_vast',
      //We'll feed it the ID so it can cache in a transient with the ID and find to retrieve later.
      vast_url: prerollXML,
      security: MyAjax.security
    });
    **/
  }).done(function(){
    var pageHeight;

    if (jQuery('body').hasClass('home')){
      pageHeight = 169;
    } else {
      pageHeight = 360;
    }


    if (!id){return false;}

    var theSrc = findAndReplace(id);
    console.log(theSrc);

    if(!postrollTime){

      preRollPluginSettings = [{
          'position' : 'pre-roll',
          'vastTagUrl' : prerollXML
      }];
      postRollPluginSettings = false;

    } else {

      preRollPluginSettings = [{
          'position' : 'pre-roll',
          'vastTagUrl' : prerollXML
        },
        {
          'position' : 'post-roll',
          'vastTagUrl' : postrollXML
      }];

      postRollPluginSettings = [{
          'position' : 'post-roll',
          'vastTagUrl' : postrollXML
      }];

    }

      window.VASTXhr = topXhr;
      var vid1 = videojs(id,
        {
          "techOrder": ["youtube", "html5"],
          "src": theSrc,
          "muted": true,
          plugins:
              {
                vastPlugin:
                {
                  'ads' :
                     preRollPluginSettings
                }
              }
        }).ready(function(){
          var thePlayer = this;
          console.log('ready');
          thePlayer.height(pageHeight);
          jQuery('.fluid-width-video-wrapper').first().css('visibility','visible');
    //      setTimeout(function() {
            //thePlayer.src({ src: 'http://www.youtube.com/watch?v=u28dp_INmjk', type: 'video/youtube' });
          thePlayer.muted(true);
          thePlayer.play();
            //document.getElementById('info-ad-time').innerHTML = '';
    //      }, 15000);
        });
  });

}


function prePostRoll(id, prerollXML, prerollTime, postrollXML, postrollTime, postRollPluginSettings, theSrc, pageHeight){

  setTimeout(function() {
    //thePlayer.src({ src: 'http://www.youtube.com/watch?v=u28dp_INmjk', type: 'video/youtube' });
    vid1 = videojs(id,
      {
        "techOrder": ["youtube", "html5"],
        "src": theSrc,
        plugins:
            {
              vastPlugin:
              {
                'ads' :
                   postRollPluginSettings
              }
            }
      });
      vid1.src({ src: theSrc, type: 'video/youtube' });
      console.log(theSrc);
      vid1.height(pageHeight);
      vid1.play();
//      jQuery('#'+id+' .vjs-info-ad-time').remove();
//      jQuery('#'+id+' .vjs-control').show();
      vid1.on('ended', function(){
        setTimeout(function() {
          vid1 = videojs(id,{});
          vid1 = videojs(id,
            {
              "techOrder": ["youtube", "html5"],
              "src": theSrc
            });
          vid1.src({ src: theSrc, type: 'video/youtube' });
          vid1.height(pageHeight);
          vid1.bigPlayButton.show();
//          jQuery('#'+id+' .vjs-info-ad-time').remove();
//          jQuery('#'+id+' .vjs-control').show();
      }, postrollTime);
    });
    //document.getElementById('info-ad-time').innerHTML = '';
  }, prerollTime);

}

function postPreRoll(id, prerollXML, prerollTime, postrollXML, postrollTime, theSrc, pageHeight){

  setTimeout(function() {
    //thePlayer.src({ src: 'http://www.youtube.com/watch?v=u28dp_INmjk', type: 'video/youtube' });
    vid1 = videojs(id,{});
    vid1 = videojs(id,
      {
        "techOrder": ["youtube", "html5"],
        "src": theSrc,
        plugins:{
          vastPlugin:
          {
            'ads' :
               []
          }
        }
      });
      vid1.src({ src: theSrc, type: 'video/youtube' });
      vid1.height(pageHeight);
      console.log('Roll the post-preroll video');
      vid1.play();
//      jQuery('#'+id+' .vjs-info-ad-time').remove();
//      jQuery('#'+id+' .vjs-control').show();
    //document.getElementById('info-ad-time').innerHTML = '';
    vid1.on('ended', function(){
        vid1 = videojs(id,{});
        vid1 = videojs(id,
          {
            "techOrder": ["youtube", "html5"],
            "src": theSrc
          });
        vid1.src({ src: theSrc, type: 'video/youtube' });
        vid1.height(pageHeight);
        vid1.bigPlayButton.show();
//          jQuery('#'+id+' .vjs-info-ad-time').remove();
//          jQuery('#'+id+' .vjs-control').show();
        });
  }, prerollTime);

}
