//Set ext scope variables
var hiddenTracks = localStorage.hiddenTracks ? JSON.parse(localStorage.hiddenTracks) : {};

// details about the current track
var trackInfo = {
	element: {},
	title: "",
	href: ""
};

var stream = [];

var songList = document.createElement('ul');

if (jQuery) {

	$(document).ready(function(){
		$(songList).addClass('hidden-songs');
		$('body').append(songList);
		showBtn();

		var unhideAllBtn = document.createElement('a');
		$(unhideAllBtn).addClass("unhide-all");
		$('body').append(unhideAllBtn);

		$(unhideAllBtn).on('open', function() { $(this).show() });
		$(unhideAllBtn).on('close', function() { $(this).hide() });
		$(unhideAllBtn).on('click', unhideAllTracks);

		//On click of hide track button, execute hide track function
		$('body').on('click', 'a.hide-track', function() {
			hideTrack($(this));
		});
		
		$('body').on('click', 'a.unhide-track', function() {
			unhideTrack($(this).data('href'), $(this).data('track'));
		});

		$('.playControls .skipControl__previous').on('click', function() { trackInfo.skipBack = true; });


		$(document).on('lazyLoad', function(e) {
			$(".soundList__item")
				.toArray()
				.filter(function(node) { return stream.indexOf(node) === -1; })
				.forEach(function(node) { processTrack(node); });
		});

		if (Object.keys(hiddenTracks).length > 0) {			
			$('.show-hidden').fadeIn();
			populateHiddenList();
		}

		setTimeout(function() { $(document).trigger("lazyLoad"); }, 2500); // Just in case
	});

	// Either add a hide button to the track, or hide the track if localStorage deems it hidden
	function processTrack(trackNode) {
		var trackDetails = $(trackNode).find("div.sc-media-content").last().children().first(),
			buttonGroup = $(trackNode).find('div.sc-button-group').first(),
			trackHref = $(trackDetails).attr("href"),
			songName = $(trackDetails).find("span").text();


		if(isTrackHidden(trackHref)) {
			$(trackNode).hide();
		} else if ($(buttonGroup).find('.hide-track').length == 0) {
			$(buttonGroup).append("<a class='sc-button hide-track sc-button-small sc-button-responsive' data-track='"+ songName +"' data-href='" + trackHref + "' title='Hide This Track'>HIDE</a>");
			stream.push(trackNode);
		}
	}

	function countVisibleTracks() {
		return $('.soundList__item:visible').length;
	}
	
	function showBtn() {
		if ($('.show-hidden') != '') { 
			var showHiddenBtn = document.createElement('a');
			showHiddenBtn.href = "#";
			$(showHiddenBtn).addClass('show-hidden');			
			showHiddenBtn.text = "You have hidden tracks! Click to see them";
			
			$('body').append(showHiddenBtn);
		}
	}

	$('body').on('click', '.show-hidden', function() {
		$(this).text() === 'You have hidden tracks! Click to see them' ? showSongList() : hideSongList();
	});

	function showSongList() {
		$('.hidden-songs').slideDown();
		$('.show-hidden').text('Hide this list!');
		$('a.unhide-all').trigger('open');
	}
	
	function hideSongList() {
		$('.hidden-songs').slideUp();
		$('.show-hidden').text('You have hidden tracks! Click to see them');
		$('a.unhide-all').trigger('close');
	}

	function unhideAllTracks() {
		for(href in hiddenTracks) {
			unhideTrack(href, hiddenTracks[href]);
		}
	}

	//Hides the track and adds the track name to the localStorage object
	function hideTrack(e) {
		var href, listItem, songName;
		href = e.attr('data-href');

		songName = e.attr('data-track');
		listItem = e.closest('li.soundList__item');

		hiddenTracks[href] = songName;
		stream = stream.filter(function(node) { return node !== listItem });

		listItem.slideUp();
		localStorage.hiddenTracks = JSON.stringify(hiddenTracks);
		populateHiddenList();

		$('a.show-hidden').slideDown();

		if (trackInfo.href == href) {
			nextSong();
		}

		// If there is only 5 visible tracks left, try loading more
		countVisibleTracks() <= 5 ? loadMoreTracks() : 0;
	}
	
	function unhideTrack(href, songName) {
		var track = $('[aria-label="'+songName+'"]');
		track.closest('.soundList__item').slideDown();
		delete hiddenTracks[href];

		localStorage.hiddenTracks = JSON.stringify(hiddenTracks);
		populateHiddenList();
	
		if (Object.keys(hiddenTracks).length == 0) {
			hideSongList();
			$('a.show-hidden').slideUp();
		}
	}
	
	function populateHiddenList() {
		$(songList).html('');
	
		for (var href in hiddenTracks) {
			var songName = hiddenTracks[href];
			var li = document.createElement('li');
			var unhideBtn = document.createElement('a');
			
			$(li).text(songName);
			$(unhideBtn).text("UNHIDE").addClass('unhide-track').attr('style', 'color: red; float: right;').attr('href', '#').attr('data-href', href).attr('data-track', songName);
			$(li).append(unhideBtn);

			$(songList).append(li);				
		}
	}

	// Fires off a tiny scroll animation to trigger the stream lazy load
	function loadMoreTracks() {
		$('html, body').animate({scrollTop: $(window).scrollTop() + 10}, 10);
	}
	
	function isTrackHidden(trackUrl) {
		return (trackUrl && parsePlaylistHref(trackUrl) in hiddenTracks)
	}

	function parsePlaylistHref(href) {
		return href.indexOf("?in=") > -1 ? (href.split("?in=")[1][0] !== '/') ? '/' + href.split("?in=")[1] : href.split("?in=")[1] : href;
	}

	function skipControl() {
		return trackInfo.skipBack ? $('.playControls .skipControl__previous') : $('.playControls .skipControl__next');
	}
	
	function nextSong() {
		$('.skipControl__next').click();
	}

	
	var playingObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {

			trackInfo.element = document.querySelector('.playbackSoundBadge__title');

			// Only check hidden tracks if songTitle is a descendant
			// of the mutation target element.
			if($.contains(mutation.target, trackInfo.element)) {
				trackInfo.href = $(trackInfo.element).attr('href');

				if(isTrackHidden(trackInfo.href)) {
					skipControl().trigger("click");
				} else {
					trackInfo.skipBack = false;
				}
			}
		});
	});

	// Watches for node additions to the lazyLoad list
	var lazyLoadObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if(mutation.type === "childList" && mutation.addedNodes.length) {
				$(document).trigger("lazyLoad");
			}
		});
	});

	var lazyLoadList = document.querySelector('div.lazyLoadingList');
	var currentPlaying = document.querySelector('.playControls');

	playingObserver.observe(currentPlaying , { childList: true, characterData: true, subtree : true });
	lazyLoadObserver.observe(lazyLoadList, { childList: true, subtree: true });


} else {
	console.log('Hidecloud is not active');
}

