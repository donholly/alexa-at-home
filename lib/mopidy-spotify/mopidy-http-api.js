var requireFu = require('require-fu');

function HttpAPI(settings) {

	// Spotify
	var Mopidy = require('mopidy');

	var mopidy = new Mopidy({
		webSocketUrl: "ws://192.168.1.230:6680/mopidy/ws/"
	});
    mopidy.on(console.log.bind(console));  // Log all events

    this.requestHandler = function (req, res) {

    	var url = req.url.toLowerCase();

    	if (url.indexOf("state") > -1) {

    	} else if (url.indexOf("power") > -1) {

    	} else {

    	}

    	handlePlayRequest(url, res);
    };

    function handlePlayRequest(url, res){

    	var trackDesc = function (track) {
    		return track.name + " by " + track.artists[0].name + " from " + track.album.name;
    	};

    	var queueAndPlay = function (playlistNum, trackNum) {

    		playlistNum = playlistNum || 0;
    		trackNum = trackNum || 0;

    		console.log("Playlist Number: " + playlistNum + "   Track Number: " + trackNum);

    		mopidy.playlists.getPlaylists().then(function (playlists) {
    			var playlist = playlists[playlistNum];
    			console.log("Loading playlist:", playlist.name);
    			return mopidy.tracklist.add(playlist.tracks).then(function (tlTracks) {
    				// Choose random track
    				trackNum = Math.floor(Math.random() * (mopidy.tracklist.length - 1));
    				console.log("Random track selected: " + trackNum);

    				return mopidy.playback.play(tlTracks[trackNum]).then(function () {
    					return mopidy.playback.getCurrentTrack().then(function (track) {
    						console.log("Now playing:", trackDesc(track));
    					});
    				});
    			});
    			finishResponseWithJSONResult(null, res);
    		})
            .catch(console.error.bind(console)) // Handle errors here
            .done();                            // ...or they'll be thrown here
            finishResponseWithJSONResult(null, res);
        };

        //mopidy.on("state:online", queueAndPlay);

        queueAndPlay();
    };

    function finishResponseWithJSONResult(value, res) {
    	if (res) {
    		if (value) {
    			var jsonResponse = JSON.stringify(value);
    			res.setHeader('Content-Length', Buffer.byteLength(jsonResponse));
    			res.setHeader('Content-Type', 'application/json;charset=utf8');
    			res.write(new Buffer(jsonResponse));
    		}
    		res.end();
    	} else {
    		console.warn("No response object to close...");
    	}
    };
};

module.exports = HttpAPI;