var requireFu = require('require-fu');
var _ = require('underscore-node');
var fuzzy = require('fuzzy');

var winston = require('winston');

function HttpAPI(settings) {

	// Spotify
	var Mopidy = require('mopidy');

	var mopidy = new Mopidy({
		webSocketUrl: "ws://192.168.1.230:6680/mopidy/ws/"
	});
   	// mopidy.on(console.log.bind(console));  // Log all events (very verbose)

    this.requestHandler = function (req, res) {

    	var url = req.url.toLowerCase();

    	if (url.indexOf("party") > -1) {
    		
    		this.playPlaylist("House Party", res);

    	} else if (url.indexOf("playlist") > -1) {

    		var playlistName = url.replace('playlist/', '');

			this.playPlaylist(playlistName, res);    		

    	} else {
    		// Default
    		this.playPlaylist("Chillin'", res);
    	}
    };

    this.playPlaylist = function(playlistName, res){

    	var trackDesc = function (track) {
    		return track.name + " by " + track.artists[0].name + " from " + track.album.name;
    	};

    	var queueAndPlay = function (playlistNum, trackNum) {

    		playlistNum = playlistNum || 0;
    		trackNum = trackNum || 0;

    		winston.info("Playlist Number: " + playlistNum + "   Track Number: " + trackNum);

    		mopidy.playlists.getPlaylists().then(function (playlists) {

    			var playlistNames = _.pluck(playlists, "name");
    			winston.info("Playlists: " + JSON.stringify(playlistNames));

    			var playlist;

    			if (playlistName != null) {
    				winston.info("Attempting to match on playlist name '" + playlistName + "'")
    				var found = false;
    				for (var index in playlists) {
    					var pl = playlists[index];

    					// todo - do fuzzy matching on playlist name
    					var options = { pre: '<', post: '>' };
    					var results = fuzzy.filter(playlistName, playlistNames, options);
    					winston.info(results);

    					if (pl["name"].toLowerCase() == playlistName.toLowerCase()) {
    						playlist = pl;
    						winston.info("MATCH FOUND ("+playlistName+") == ", playlist.name);
    						found = true;
    					}
    				}
    			}

    			if (!playlist) {
    				playlist = playlists[playlistNum];
    				winston.info("Loading playlist:", playlist.name);
    			}

    			return mopidy.tracklist.add(playlist.tracks).then(function (tlTracks) {
    			
    				// Choose random track
    				trackNum = Math.floor(Math.random() * (tlTracks.length - 1));
    				winston.info("Random track selected: " + trackNum);

    				return mopidy.playback.play(tlTracks[trackNum]).then(function () {
    					return mopidy.playback.getCurrentTrack().then(function (track) {
    						winston.info("Now playing:", trackDesc(track));
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