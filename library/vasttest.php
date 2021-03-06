<html>
<head>
<link href="//vjs.zencdn.net/4.7/video-js.css" rel="stylesheet">
<link rel="stylesheet" href="videojs_vast_ad_serving_plugin/css/vast.plugin.css">
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
<script src="http://vjs.zencdn.net/4.7.3/video.js"></script>
<script src="videojs-youtube/src/youtube.js"></script>
<script src="videojs_vast_ad_serving_plugin/js/vast.plugin.js"></script>
<style>
div.video-js { height: 300px; }
</style>
<script>
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
  id = zsDefaultFalse(id);
  prerollXML = zsDefaultFalse(prerollXML);
  prerollTime = zsDefaultFalse(prerollTime);
  postrollXML = zsDefaultFalse(postrollXML);
  postrollTime = zsDefaultFalse(postrollTime);

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

  var vid1 = videojs(id,
    {
      "techOrder": ["youtube", "html5"],
      "src": theSrc,
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
//      setTimeout(function() {
        //thePlayer.src({ src: 'http://www.youtube.com/watch?v=u28dp_INmjk', type: 'video/youtube' });
        //thePlayer.play();
        //document.getElementById('info-ad-time').innerHTML = '';
//      }, 15000);
    });

  vid1.on('click', function(){
    if(!postrollTime){
      postPreRoll(id, prerollXML, prerollTime, postrollXML, postrollTime, theSrc, pageHeight)
    } else {
      prePostRoll(id, prerollXML, prerollTime, postrollXML, postrollTime, postRollPluginSettings, theSrc, pageHeight);
    }
  })
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
      vid1.on('ended', function(){
        setTimeout(function() {
          vid1 = videojs(id,{});
          vid1 = videojs(id,
            {
              "techOrder": ["youtube", "html5"],
              "src": theSrc,
              plugins: {
                vastPlugin:
                  {
                    'ads' :
                    [
                    {
                    }
                    ]
                  }
              }
            });
          vid1.src({ src: theSrc, type: 'video/youtube' });
          vid1.height(pageHeight);
          vid1.bigPlayButton.show();
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
        plugins:
            {
              vastPlugin:
              {
                'ads' :
                   [{}]
              }
            }
      });
      vid1.src({ src: theSrc, type: 'video/youtube' });
      vid1.height(pageHeight);
      console.log('Roll the post-preroll video');
      vid1.play();
    //document.getElementById('info-ad-time').innerHTML = '';
  }, prerollTime);

}
</script>


</head>
<body>
<?php
?>
<div class="entry entry-top-video" style="height:300;">

	<h5 class="entry-title">
		<a href="http://ww2.cfo.com/leadership/2014/07/pbs-cfo-finds-opportunities-manage-video/" title="PBS CFO Finds More Opportunities to Manage: Video">
			PBS CFO Finds More Opportunities to Manage: Video		</a>
	</h5>

	<div class="entry-image" style="height:300;">

		<div class="fluid-width-video-wrapper" style="padding-top: 56.25%;height:300px;"><iframe src="http://www.youtube.com/embed/VqqcxazwbIk?feature=oembed&amp;enablejsapi=1" frameborder="0" allowfullscreen="" id="fitvid421936"></iframe></div>	</div>

	<small>
		<p>CFO Barbara Landes shares what she's learned about managing and why she�</p>
	</small>

	<div class="entry-top-video-next-link">
		<a href="http://ww2.cfo.com/type/video/">More Videos</a>	</div>

</div>
</body>
</html>
