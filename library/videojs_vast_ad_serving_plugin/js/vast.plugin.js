// <author>Sven Kroll</author>
// <email>kroll.sven@gmail.com</email>
// <date>2013-11-11</date>
// <summary>video.js Vast plugin supporting pre-, and post-rolls</summary>

function vastPlugin(options) {
	var player = this,
	maxWrapperRedirects = 5,
	maxPreRolls = 1,
	maxPostRolls = 1,
	_v = {};

	initAds(options); //only create AdSlots and dont request right now
	initListener();

	function initListener() {
		player.on('ended', function(e) {
			//if maintrack has ended
			if (_v.currentSlot === null) {
				if (_v.postrolls < maxPostRolls) {
					//check if post-roll exists
					for (var i = 0; i < _v.adList.length; i++) {
						if (_v.adList[i].getAdType() === "post-roll" && !_v.adList[i].isSeen()) {
							playAd(_v.adList[i]);
						}
					}
				}
			} else { //Ad ended
				stopAd(_v.currentSlot);
			}
		});

		player.on('error', function(e) {
			console.log('VastPlugin::error: ' + e);
		});

		player.on('volumechange', function(e) {
			if (_v.currentSlot) {
				if (player.muted() && !_v.muted) {
					console.log('player is muted');
					//user has muted
					_v.muted = true;
					var trackingEvents = _v.currentSlot.getTrackingEventUrls('mute');
					trackingEvents.forEach(function(element) {
						loadTrackingPixel(element['eventUrl']);
					});
				} else if (!player.muted() && _v.muted) {
					//user has unmuted
					console.log('User has unmuted.');
					_v.muted = false;
					//call tracking events
					var trackingEvents = _v.currentSlot.getTrackingEventUrls('unmute');
					trackingEvents.forEach(function(element) {
						loadTrackingPixel(element['eventUrl']);
					});
				}
			};
		});

		player.on('play', function(e) {
			if (player.muted()) {

				//user has muted
				//_v.muted = true;
			}
			//if maintrack is starting
			if (_v.prerolls < maxPreRolls && _v.currentSlot === null) {
				//check if pre-roll exists
				for (var i = 0; i < _v.adList.length; i++) {
					if (_v.adList[i].getAdType() === "pre-roll" && !_v.adList[i].isSeen()) {
						playAd(_v.adList[i]);
						break;
					}
				}
			};
		});

		player.on('fullscreenchange', function(e) {
			if (_v.currentSlot) {
				if (!_v.fullScreen) {
					//user has switched to fullscreen
					_v.fullscreen = true;
					var trackingEvents = _v.currentSlot.getTrackingEventUrls('fullscreen');
					trackingEvents.forEach(function(element) {
						loadTrackingPixel(element['eventUrl']);
					});
				} else {
					//user has canceled fullscreen
					_v.fullscreen = false;
				}
			};
		});

		player.on('pause', function(e) {
			if (_v.currentSlot) {
				if (player.paused() && player.currentTime() < player.duration()) {
					//user has paused
					var trackingEvents = _v.currentSlot.getTrackingEventUrls('pause');
					trackingEvents.forEach(function(element) {
						loadTrackingPixel(element['eventUrl']);
					});
				}
			};
		});
	};

	function adError() {
		var errorTrackingUrls = _v.currentSlot.getErrorTrackingUrls();
		errorTrackingUrls.forEach(function(element) {
			loadTrackingPixel(element);
		});

		console.log("VastParser::no compatible ad source");

		player.controlBar.progressControl.show();
		player.controlBar.currentTimeDisplay.show();
		player.controlBar.timeDivider.show();
		player.controlBar.durationDisplay.show();

		//enable fade out
		removeClass(player.controlBar.el(), 'vjs-manual-lock-showing');

		//remove overlay
		//TODO: Document isn't good if multiple player available
		player.el()
			.removeChild(document.getElementById('stage-overlay'));

		//stop interval and remove advertiser info
		clearInterval(_v.adPlayInterval)
		player.controlBar.el()
			.removeChild(document.getElementById('info-ad-time'));

		_v.currentSlot = null;

	};

	function hasClass(ele, cls) {
		return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
	};

	function addClass(ele, cls) {
		if (!hasClass(ele, cls)) ele.className += " " + cls;
	};

	function removeClass(ele, cls) {
		if (hasClass(ele, cls)) {
			var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
			ele.className = ele.className.replace(reg, ' ');
		}
	};

	function stopAd(adslot) {
		//call tracking events
		var trackingEvents = _v.currentSlot.getTrackingEventUrls('complete');
		trackingEvents.forEach(function(element) {
			loadTrackingPixel(element['eventUrl']);
		});

		player.controlBar.progressControl.show();
		player.controlBar.currentTimeDisplay.show();
		player.controlBar.timeDivider.show();
		player.controlBar.durationDisplay.show();

		//enable fade out
		removeClass(player.controlBar.el(), 'vjs-manual-lock-showing');

		//remove overlay
		//TODO: Document isn't good if multiple player available
		player.el()
			.removeChild(document.getElementById('stage-overlay'));

		//stop interval and remove advertiser info
		clearInterval(_v.adPlayInterval)
		player.controlBar.el()
			.removeChild(document.getElementById('info-ad-time'));

		console.log(_v.mainTrack);
		player.src(_v);
		if (adslot.getAdType() !== "post-roll") {
			console.log('Now play mainTrack');
			player.options.techOrder = ["youtube", "html5"];
			//console.log(player);
			var vid1 = videojs(player.id(),
				{
					"techOrder": ["youtube", "html5"],
					"src": _v.mainTrack,
					"type": 'video/youtube'
				}).ready(
					function(){
						var thisPlayer = this;
				    thisPlayer.src({ src: _v.mainTrack, type: 'video/youtube' });
						console.log(_v.muted);
						thisPlayer.muted(_v.muted);
						if (!_v.muted){
							thisPlayer.volume(0.5);
							thisPlayer.on('play', function(){ this.volume(0.5); });
						}
					}
				);
			vid1.on('play', function(){ this.muted(_v.muted); });
			vid1.play();
			console.log(player.id());

		}
		_v.currentSlot = null;
	};

	function playAd(adslot) {
		adslot.requestAd();
		if (adslot.isValid()){
			//call impression urls
			var impressionUrls = adslot.getImpressionUrls();
			impressionUrls.forEach(function(element) {
				loadTrackingPixel(element);
			});

			adslot.seen();

			//Count seen ads, not the fallback
			if (adslot.getAdType() === 'pre-roll') {
				_v.prerolls++;
			} else {
				_v.postrolls++;
			};

			if (!adslot.isFallbackAd()) {
				_v.currentSlot = adslot;

				//if maintrack was muted ad will also be muted, dont call tracking events for mute
				_v.muted = player.muted();
				console.log('Player mute state is')
				console.log(player.muted());

				//hide controls
				player.controlBar.progressControl.hide();
				player.controlBar.currentTimeDisplay.hide();
				player.controlBar.timeDivider.hide();
				player.controlBar.durationDisplay.hide();
				if (player.muted()){
					player.ready(function(){
						var thePlayer = this;
						console.log('ready');
						thePlayer.muted(true);
					});

					player.on('play', function(){ this.muted(true); });
				}
				//player.muted = _v.muted;

				//TODO declare ad info string more central

				//TODO check if control bar is fadeout and fadein if needed

				//disable fade out
				addClass(player.controlBar.el(), 'vjs-manual-lock-showing');

				//overlay to deny show default controls by right click and to catch clicks
				var stageOverlay = document.createElement('a');
				player.el().appendChild(stageOverlay);
				stageOverlay.className = 'vjs-stage-overlay';
				stageOverlay.id = 'stage-overlay';
				console.log(stageOverlay);
				player.on('click', function() {
					console.log('adclicked');
					adClick();
				});

				var advertiser = document.createElement('div');
				playerControl = player.controlBar;
				playerControl.el()
					.appendChild(advertiser);
				advertiser.innerHTML = "AD: " + adslot.getDuration() + " seconds remaining.";
				advertiser.className = 'vjs-info-ad-time';
				advertiser.id = 'info-ad-time';

				_v.mainTrack = player.currentSrc();
				console.log(_v.mainTrack);
				player.src(adslot.getMediaFiles());

				//TODO: Coul be better
				//check if source is compatible
				var cnodes = player.el()
					.childNodes;
				for (var i in cnodes) {
					if (cnodes[i].innerHTML && cnodes[i].innerHTML.search("no compatible source and playback technology were found") != -1) {
						player.el()
							.removeChild(cnodes[i]);
						//call error event
						adError();
						return;
					}
				};

				//don't use timerupdate event from videojs because check every 15ms is too much
				_v.adPlayInterval = setInterval(function() {
					adTimer();
				},
				500);

				//call tracking event start
				var trackingEvents = _v.currentSlot.getTrackingEventUrls('start');
				trackingEvents.forEach(function(element) {
					loadTrackingPixel(element['eventUrl']);
				});
				player.play();
			}
		}else{
			console.log('DEBUG: No valid Ad found.');
		};
	};

	function adTimer() {
		//update duration string every second,
		document.getElementById('info-ad-time')
			.innerHTML = "AD: " + (_v.currentSlot.getDuration() - Math.ceil(player.currentTime())) + " seconds remaining.";

		//check ad position to call Tracking events
		var curTime = player.currentTime();
		var duration = _v.currentSlot.getDuration()
		//check if video is loaded and duration is known
		if (duration && duration > 0) {
			if (curTime > duration / 4 && !_v.currentSlot.isTrackingEventFired('firstQuartile')) {
				var trackingEvents = _v.currentSlot.getTrackingEventUrls('firstQuartile');
				trackingEvents.forEach(function(element) {
					loadTrackingPixel(element['eventUrl']);
				});
				_v.currentSlot.trackingEventFired('firstQuartile');
			} else if (curTime > duration / 2 && !_v.currentSlot.isTrackingEventFired('midpoint')) {
				var trackingEvents = _v.currentSlot.getTrackingEventUrls('midpoint');
				trackingEvents.forEach(function(element) {
					loadTrackingPixel(element['eventUrl']);
				});
				_v.currentSlot.trackingEventFired('midpoint');
			} else if (curTime > duration / 1.5 && !_v.currentSlot.isTrackingEventFired('thirdQuartile')) {
				var trackingEvents = _v.currentSlot.getTrackingEventUrls('thirdQuartile');
				trackingEvents.forEach(function(element) {
					loadTrackingPixel(element['eventUrl']);
				});
				_v.currentSlot.trackingEventFired('thirdQuartile');
			};
		}
	};

	//pause player and open clickThrough url if possible

	function adClick() {
		//call tracking urls
		console.log('DEBUG: Ad clicked, call tracking urls');
		var clickTrackingUrls = _v.currentSlot.getClickTrackingUrls();
		console.log(clickTrackingUrls);
		jQuery.each(clickTrackingUrls, function(i, element) {
			console.log('DEBUG: call: '+element);
			loadTrackingPixel(element);
		});

		//open new tab
		console.log('DEBUG: open target link');
		var url = _v.currentSlot.getClickThroughUrl();
		console.log('DEBUG: url: ' + url);
		var isPlaying = player.paused();
		if (isPlaying){
			if (isUrl(url)) {
				player.pause();
				console.log('DEBUG: player paused');
				var newTab = window.open(url, '_blank');
				console.log('DEBUG: window opened');
				newTab.focus();
				console.log('DEBUG: window focus');
			}
		} else {
			player.play();
		}
	};

	function loadTrackingPixel(url) {
		if (isUrl(url)) {
			trackingPixel = document.createElement('img');
			trackingPixel.style.visibility = "hidden";
			trackingPixel.style.position = "absolute";
			trackingPixel.style.width = "0px";
			trackingPixel.style.height = "0px";
			trackingPixel.src = url;
		}
	};

	function initAds(adObj) {
		_v.tempTime = 0;
		_v.adList = [];
		_v.mainTrack = player.currentSrc();
		_v.currentSlot = null;
		_v.api = '';
		_v.adPlayInterval = null;
		_v.muted = true;
		_v.fullScreen = false;
		_v.prerolls = 0;
		_v.postrolls = 0;

		try {
			//constructing list for further populating and sorting
			for (v in adObj.ads) {
				switch (adObj.ads[v].position) {

				case "pre-roll":
					_v.adList.push(new adSlot(adObj.ads[v].vastTagUrl, "pre-roll", 0));
					break;

				case "post-roll":
					_v.adList.push(new adSlot(adObj.ads[v].vastTagUrl, "post-roll", - 1));
					break;

				default:
					break;
				}
			}
		} catch (e) {
			console.log('VastInitAds::failed to create adslots: ' + e);
		}
	};

	function isUrl(s) {
		var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
		return regexp.test(s);
	}

	function adSlot(_url, _type, _time) {
		var vastTagUrl = _url,
		 fallbackAd = false,
		 valid = false,
		 wrapperRedirects = 0,
		 type = _type,
		 time = _time,
		 source = "",
		 mime = "",
		 seen = false,
		 playOnce = true,
		 impressions = [],
		 trackingEvents = [],
		 link = "",
		 clickEvents = [],
		 errorEvents = [],
		 adId = "",
		 duration = "",
		 skipoffset = "",
		 mediaFiles = [],
		 clickThrough = "",
		 seen = false;
		var trackingEventsFired = {
			thirdQuartile: false,
			firstQuartile: false,
			midpoint: false
		};

		//requestAd(vastTagUrl);

		this.isFallbackAd = function() {
			return fallbackAd;
		};

		this.getAdId = function() {
			return adId;
		};

		this.isValid = function() {
			return valid;
		};

		this.isTrackingEventFired = function(eventName) {
			return trackingEventsFired[eventName];
		};

		this.trackingEventFired = function(eventName) {
			trackingEventsFired[eventName] = true;
		};

		this.getTrackingEventUrls = function(eventName) {
			var _events = [];
			for (var i = 0; i < trackingEvents.length; ++i) {
				if (trackingEvents[i].eventName == eventName){
					console.log('Pushing tracking event: '+eventName);
					console.log(trackingEvents[i]);
					_events.push(trackingEvents[i]);
				}
			};
			return _events;
		};

		this.getClickThroughUrl = function() {
			return clickThrough;
		};

		this.getDuration = function() {
			return stringToSeconds(duration);
		};

		this.seen = function() {
			seen = true;
		};

		this.isSeen = function() {
			return seen;
		};

		this.getAdType = function() {
			return type;
		};

		this.getImpressionUrls = function() {
			var urls = [];
			impressions.forEach(function(element) {
				urls.push(replaceCacheBuster(element));
			});
			return urls;
		};

		this.getClickTrackingUrls = function() {
			var urls = [];
			clickEvents.forEach(function(element) {
				urls.push(replaceCacheBuster(element));
			});
			return urls;
		};

		this.getErrorTrackingUrls = function() {
			var urls = [];
			errorEvents.forEach(function(element) {
				urls.push(replaceCacheBuster(element));
			});
			return urls;
		};

		this.getMediaFiles = function() {
			var files = [];
			mediaFiles.forEach(function(element, index, array) {
				files.push({
					type: element.type,
					src: element.src
				});
			});
			return files;
		};

		this.requestAd = function() {
			_requestAd(vastTagUrl);
		};

		function _requestAd(_url, redirect) {
			url = replaceCacheBuster(_url);
			if (redirect){
				var new_request = jQuery.post(MyAjax.ajaxurl, {
					action: 'go_get_that_vast',
					//We'll feed it the ID so it can cache in a transient with the ID and find to retrieve later.
					vast_url: url,
					security: MyAjax.security
				}, function(response){
					console.log('Next VAST Found');
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
					if (new_request.responseText != null) {
						handleResult(new_request.responseText);
					} else{
						console.log("Attempt to load next VAST resulted in an error.");
					}
				});
			} else {
				var xhrText = '';
				if (window.XMLHttpRequest) {
						var xhr = window.VASTXhr;
							if (xhr.responseText != null) {
								handleResult(xhr.responseText);
							} else{
								console.log("XHR error.");
							}

						//jQuery(xhr).on('ready', function(){console.log(xhr.responseText);})

				} else {
					console.log('XHR not exist!');
				}
			}
		};

		function handleResult(data) {
			// If our data is a string we need to parse it as XML
			if (typeof data === 'string') {
				console.log('It is an XML string.');
				// Clean everything before <?xml?> tag
				var xmlPosition = data.indexOf("<?xml");
				if (xmlPosition > 0) {
					var junk = data.substr(0, xmlPosition);
					data = data.replace(junk, '');
				}
				try {
					console.log('Not yet a String');
					data = jQuery.parseXML(data);
					//console.log(data);
					//data = string2XML(data);
				} catch (error) {
					// error in parsing xml
					console.log("error in parsing xml");
				}
			}
			parseVast(data);
		};

		function string2XML(string) {
			if (!string) return false;

			var message = "";
			if (window.jQuery) { // all browsers, except IE before version 9
				try {
					xmlDoc = jQuery.parseXML(string);
				} catch (e) {
					console.log("XML parsing error.");
					return false;
				};
			} else { // Internet Explorer before version 9
				if (typeof(ActiveXObject) == "undefined") {
					console.log("Cannot create XMLDocument object");
					return false;
				}
				ids = ["Msxml2.DOMDocument.6.0", "Msxml2.DOMDocument.5.0", "Msxml2.DOMDocument.4.0", "Msxml2.DOMDocument.3.0", "MSXML2.DOMDocument", "MSXML.DOMDocument"];
				for (var i = 0, il = ids.length; i < il; ++i) {
					try {
						xmlDoc = new ActiveXObject(ids[i]);
						break;
					} catch (e) {}
				}
				if (!xmlDoc) {
					console.log("Cannot create XMLDocument object");
					return false;
				}
//				xmlDoc.loadXML(string);

				if (xmlDoc.parseError && xmlDoc.parseError.errorCode != 0) {
					console.log("XML Parsing Error: " + xmlDoc.parseError.reason + " at line " + xmlDoc.parseError.line + " at position " + xmlDoc.parseError.linepos);
					return false;
				} else {
					if (xmlDoc.documentElement) {
						if (xmlDoc.documentElement.nodeName == "parsererror") {
							console.log(xmlDoc.documentElement.childNodes[0].nodeValue);
						}
					} else {
						console.log("XML Parsing Error!");
					}
				}
			}
			return xmlDoc;
		};

		function foreach(arr, callback) {
			for (var k = 0; k < arr.length; k++) {
				callback(arr[k]);
			};
		};

		function trim(text) {
			return (text || "")
				.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, "");
		};

		function parseVast(data) {
			console.log('Now entering: parseVast');
			console.log(data);
			var vastAds = jQuery(data).find('Ad');
			console.log('Found vastAds:')
			console.log(vastAds);
			for (var i = 0; i < vastAds.length; i++) {
				try {
					var vastAd = vastAds[i];

					//get AddId
					adId = vastAd.getAttribute('id');

					//get duration
					var vastDuration = vastAd.querySelector('duration,Duration');
					if (vastDuration) {
						duration = vastDuration.childNodes[0].nodeValue;
					};

					//get impression urls
					var vastImpressions = jQuery(vastAd).find('Impression');
					if (vastImpressions && vastImpressions.text().length > 0) {
						console.log('We have found an impressions link');
						jQuery.each(vastImpressions, function(i_imp,v) {
							var currentValue = jQuery(vastImpressions[i_imp]);
							var vastImpressionUrls = currentValue.children('URL');
							if (vastImpressionUrls && jQuery(vastImpressionUrls).text().length > 0) {
								foreach(vastImpressionUrls, function(urlNode) {
									impressions.push(trim(decodeURIComponent(urlNode.childNodes[0].nodeValue))
										.replace(/^\<\!\-?\-?\[CDATA\[/, '')
										.replace(/\]\]\-?\-?\>/, ''));
								});
							} else {
								console.log(trim(decodeURIComponent(currentValue.text()).replace(/\]\]\-?\-?\>/, '').replace(/(.*)\<\!\-?\-?\[CDATA\[/, '').replace(/ /g,'')));
								impressions.push(trim(decodeURIComponent(currentValue.text()).replace(/\]\]\-?\-?\>/, '').replace(/(.*)\<\!\-?\-?\[CDATA\[/, '').replace(/ /g,'')));
							};
						});
					};

					//get tracking events
					var vastTrackingEvents = jQuery(vastAd).find("Tracking");
					//console.log(vastTrackingEvents);
					//var vastTrackingEventsTwo = jQuery(vastAd).find("InLine > TrackingEvents > Tracking");
					//var vastTrackingEventsThree = jQuery(vastAd).find("Wrapper > TrackingEvents > Tracking");
					//jQuery.extend(vastTrackingEvents, vastTrackingEventsTwo);
					//jQuery.extend(vastTrackingEvents, vastTrackingEventsThree);
					if (vastTrackingEvents && vastTrackingEvents.text().length > 0) {
						console.log('We found tracking events.');
						console.log(vastTrackingEvents);
						jQuery.each(vastTrackingEvents, function(i_te, v) {
							//console.log('Walk tracking events.');
							//console.log(this);
							//console.log(v);
							var currentValue = jQuery(vastTrackingEvents[i_te]);
							var vastTrackingEventUrls = currentValue.children('URL');
							if (vastTrackingEventUrls && jQuery(vastTrackingEventUrls).text().length > 0) {
								console.log('Getting by URL element');
								jQuery.each(vastTrackingEventUrls, function(i,urlNode) {
									trackingEvents.push({
										'eventName': urlNode.parent().get(0).attr('event'),
										'eventUrl': trim(decodeURIComponent(urlNode.text())
											.replace(/^\<\!\-?\-?\[CDATA\[/, '')
											.replace(/\]\]\-?\-?\>/, '').replace(/ /g,''))
									});
								});
							} else {
								//console.log('Getting by event attribute.');
								//console.log(currentValue.attr('event'));
								//console.log(trim(decodeURIComponent(currentValue.text())
								//	.replace(/^\<\!\-?\-?\[CDATA\[/, '')
								//	.replace(/\]\]\-?\-?\>/, '').replace(/ /g,'')));
								trackingEvents.push({
									'eventName': currentValue.attr('event'),
									'eventUrl': trim(decodeURIComponent(currentValue.text())
										.replace(/^\<\!\-?\-?\[CDATA\[/, '')
										.replace(/\]\]\-?\-?\>/, '').replace(/ /g,''))
								});
							};
						});
					} else {
						console.log('We found no tracking.');
					};

					//get clicktracking urls
					var vastClickTrackings = jQuery(vastAd).find('ClickTracking');
					if (vastClickTrackings && vastClickTrackings.text().length > 0) {
						console.log('We found some clicktracking.');
						//console.log(vastClickTrackings[0]);

						jQuery.each(vastClickTrackings, function(i_ct, v){
							console.log('Walk through the URL list.');
							console.log(this);
							var vastClickTrackingUrls = jQuery(this).children('URL');
							console.log(vastClickTrackingUrls);
							if (vastClickTrackingUrls && vastClickTrackingUrls.length > 0) {
								jQuery.each(vastClickTrackingUrls, function(i, urlNode) {
									console.log('Hit all the click URLs');
									clickEvents.push(trim(decodeURIComponent(urlNode.parent().get(0).text())
										.replace(/^\<\!\-?\-?\[CDATA\[/, '')
										.replace(/\]\]\-?\-?\>/, '').replace(/ /g,'')));
								});
								console.log(clickEvents);
							} else {
								console.log('Only one click URL');
								clickEvents.push(trim(decodeURIComponent(jQuery(this).text())
										.replace(/^\<\!\-?\-?\[CDATA\[/, '')
										.replace(/\]\]\-?\-?\>/, '').replace(/ /g,'')));

								console.log(clickEvents);
							};
						});
					} else {
						console.log('We found no clicktracking.');
					}

					console.log('Try and find error URLs');
					//get error urls
					var vastError = jQuery(vastAd).find('Error');
					console.log(vastError);
					if (vastError && vastError.text().length > 0) {
						jQuery.each(vastError, function(i_err, v) {
							var vastErrorUrls = vastError[i_err].getElementsByTagName('URL');
							if (vastErrorUrls && vastErrorUrls.length > 0) {
								foreach(vastErrorUrls, function(urlNode) {
									errorEvents.push(trim(decodeURIComponent(urlNode.childNodes[0].nodeValue))
										.replace(/^\<\!\-?\-?\[CDATA\[/, '')
										.replace(/\]\]\-?\-?\>/, ''));
								});
							} else {
								errorEvents.push(trim(decodeURIComponent(vastError[i_err].childNodes[0].nodeValue))
									.replace(/^\<\!\-?\-?\[CDATA\[/, '')
									.replace(/\]\]\-?\-?\>/, ''));
							};
						});
					};

					//get media files
					console.log('Try and find media files.');
					var vastMediaFiles = jQuery(vastAd).find('Linear > MediaFiles > MediaFile');
					var vastMediaFilesTwo = jQuery(vastAd).find('Video > MediaFiles > MediaFile');
					jQuery.extend(vastMediaFiles, vastMediaFilesTwo);
					console.log(vastMediaFiles);
					if (vastMediaFiles && vastMediaFiles.text().length > 0) {
						console.log('We have found media files.');
						if (vastMediaFiles.length == 0){
							vastMediaFiles = new Array(vastMediaFiles[0]);
						}
						var i_mf = 0;
						console.log(vastMediaFiles[0]);
						jQuery.each(vastMediaFiles, function(k, v){
							console.log('Walking through media files.');
							console.log('At: ' +k);
							var mediaFile = vastMediaFiles[k];
							console.log('With: ' +mediaFile);
							var type = jQuery(mediaFile).attr('type');
							// Normalize mp4 format:
							if (type == 'video/x-mp4' || type == 'video/h264') {
								type = 'video/mp4';
							}
							if (type == 'video/mp4' || type == 'video/ogg' || type == 'video/webm') {
								var mediaFileUrls = mediaFile.getElementsByTagName('URL');
								if (mediaFileUrls && mediaFileUrls.length > 0) {
									var srcFile = trim(decodeURIComponent(mediaFile.childNodes[0].nodeValue))
										.replace(/^\<\!\-?\-?\[CDATA\[/, '')
										.replace(/\]\]\-?\-?\>/, '');
								} else {
									console.log('Looking for ad by jQuery');
									console.log(mediaFile);
									console.log(jQuery(mediaFile).text().replace(/\]\]\-?\-?\>/, '').replace(/(.*)\<\!\-?\-?\[CDATA\[/, '').replace(/ /g,''));
									var srcFile = trim(decodeURIComponent(jQuery(mediaFile).text().replace(/\]\]\-?\-?\>/, '').replace(/(.*)\<\!\-?\-?\[CDATA\[/, '').replace(/ /g,'')));
								}
								var source = {
									'src': srcFile,
									'type': type
								};
								if (mediaFile.getAttribute('bitrate')) {
									source['data-bandwith'] = mediaFile.getAttribute('bitrate') * 1024;
								};
								if (mediaFile.getAttribute('width')) {
									source['data-width'] = mediaFile.getAttribute('width');
								};
								if (mediaFile.getAttribute('height')) {
									source['data-height'] = mediaFile.getAttribute('height');
								};
								// Add the source object:
								mediaFiles.push(source);
							}
						});
					}

					// Look for video click through
					var vastClickThrough = vastAd.querySelector('VideoClicks > ClickThrough');
					if (vastClickThrough) {
						var vastClickThroughUrls = vastClickThrough.getElementsByTagName('URL');
						if (vastClickThroughUrls && vastClickThroughUrls.length > 0) {
							clickThrough = trim(decodeURIComponent(vastClickThroughUrls[0].childNodes[0].nodeValue))
								.replace(/^\<\!\-?\-?\[CDATA\[/, '')
								.replace(/\]\]\-?\-?\>/, '');
						} else {
							clickThrough = trim(decodeURIComponent(vastClickThrough.childNodes[0].nodeValue))
								.replace(/^\<\!\-?\-?\[CDATA\[/, '')
								.replace(/\]\]\-?\-?\>/, '');
						}
						if ('' == clickThrough){
							console.log('No Clickthrough Found');
							var theClickBank = jQuery(vastAd).find('VideoClicks > ClickThrough');
							console.log(jQuery(theClickBank[0]).text().replace(/ /g,''));
							clickThrough = trim(decodeURIComponent(jQuery(theClickBank[0]).text().replace(/\]\]\-?\-?\>/, '').replace(/(.*)\<\!\-?\-?\[CDATA\[/, '').replace(/ /g,'')));

						}
					};

					//check if ad is fallback (advertiser special)
					var vastFallback = vastAd.querySelector('Extension > Fallback');
					if (vastFallback && vastFallback.childNodes[0].nodeValue === 'true') {
						fallbackAd = true;
					};

					// Check for Wrapper response
					var vastWrapper = jQuery(vastAd).find('Wrapper');
					console.log('Do we have a wrapper?');
					if (vastWrapper) {
						//var vastWrapperAdTagUrl = vastAd.querySelector('VASTAdTagURL,VASTAdTagURI');
						console.log('Try and find redirects.');
						var vastWrapperAdTagUrl = jQuery(vastAd).find('VASTAdTagURL');
						var vastWrapperAdTagUrlTwo = jQuery(vastAd).find('VASTAdTagURI');
						jQuery.extend(vastWrapperAdTagUrl, vastWrapperAdTagUrlTwo);
						console.log(vastWrapperAdTagUrl);
						if (vastWrapperAdTagUrl.length > 0) {
							if (wrapperRedirects < maxWrapperRedirects) {
								console.log('We can still do more redirects!');
								var vastWrapperAdTagUrls = vastWrapperAdTagUrl.children('URL');
								if (vastWrapperAdTagUrls && vastWrapperAdTagUrls.length > 0) {
									console.log('There are multiple URLs');
									_url = trim(decodeURIComponent(vastWrapperAdTagUrls[0].childNodes[0].nodeValue))
										.replace(/^\<\!\-?\-?\[CDATA\[/, '')
										.replace(/\]\]\-?\-?\>/, '');
								} else {
									console.log('There is only one URL.');
									console.log(vastWrapperAdTagUrl);
									_url = trim(decodeURIComponent(jQuery(vastWrapperAdTagUrl[0]).text().replace(/\]\]\-?\-?\>/, '').replace(/(.*)\<\!\-?\-?\[CDATA\[/, '').replace(/ /g,'')));
								}
								console.log('VastAdParser:: Found vast wrapper, load ad: ' + _url);
								wrapperRedirects++;
								_requestAd(_url, true);
							} else {
								console.log('VastAdParser::maxWrapperRedirects reached. Skip ad.');
								valid = false;
							}
						}
					} else {
						if (mediaFiles.length > 0 || fallbackAd) {
							valid = true;
						} else {
							console.log('VastAdParser::no mediafiles available. Skip ad.');
						}
					};
				} catch (e) {
					console.log('Vastplugin::Error::ParsingXML:: ' + e);
				}
			};
		};

		function replaceCacheBuster(adUrl) {
			var cacheBusters = ['[timestamp]', '[cachebuster]', '[random]', '[randnum]'];
			var timestamp = Math.round(+new Date() / 1000) + Math.ceil(Math.random() * 1000);
			for (var i = 0; i < cacheBusters.length; i++) {
				adUrl = adUrl.replace(cacheBusters[i], timestamp);
			}
			return adUrl;
		};

		function stringToSeconds(timeString) {
			var seconds = timeString.substr(0, 1) * 3600 + timeString.substr(3, 2) * 60 + timeString.substr(6, 2) * 1;
			return seconds;
		};

	};
};

videojs.plugin('vastPlugin', vastPlugin);
