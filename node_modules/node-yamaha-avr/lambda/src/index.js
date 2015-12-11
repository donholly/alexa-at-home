'use strict';

var http = require('http');

var options = require('./options');

var AlexaSkill = require('./AlexaSkill');
var EchoYamaha = function () {
    AlexaSkill.call(this, options.appid);
};

EchoYamaha.prototype = Object.create(AlexaSkill.prototype);
EchoYamaha.prototype.constructor = EchoYamaha;

EchoYamaha.prototype.intentHandlers = {
    // register custom intent handlers
    PowerOnIntent: function (intent, session, response) {
        console.log("PowerOnIntent received");
        options.path = '/receiver/power/on';
        httpreq(options, response, "Turning receiver on");
    },
    PowerOffIntent: function (intent, session, response) {
        console.log("PowerOffIntent received");
        options.path = '/receiver/power/off';
        httpreq(options, response, "Turning receiver off");
    },
    VolumeDownIntent: function (intent, session, response) {
        console.log("VolumeDownIntent received");
        options.path = '/receiver/volume/down';
        httpreq(options, response, "OK");
    },
    VolumeUpIntent: function (intent, session, response) {
        console.log("VolumeUpIntent received");
        options.path = '/receiver/volume/up';
        httpreq(options, response, "OK");
    },
    PlayIntent: function (intent, session, response) {
        console.log("PlayIntent received");
        options.path = '/spotify/playlist/' + encodeURIComponent(intent.slots.Playlist.value);
        httpreq(options, response, "Playing " + intent.slots.Playlist.value + " playlist");
    },
    PartyIntent: function (intent, session, response) {
        console.log("PlayIntent received");
        options.path = '/spotify/party';
        httpreq(options, response, "Let's party!");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the EchoYamaha skill.
    var echoYamaha = new EchoYamaha();
    echoYamaha.execute(event, context);
};

function httpreq(options, alexaResponse, responseText) {
  console.log("Trying http request with responseText " + responseText);
  http.request(options, function(httpResponse) {
    console.log(httpResponse.body);
    if (responseText)
        alexaResponse.tell(responseText);
  }).end();
}
