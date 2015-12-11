'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var nodeStatic = require('node-static');

var winston = require('winston');
winston.add(winston.transports.File, {
  filename: __dirname + '/log.log',
  handleExceptions: true,
  formatter: function(options) {
    // Return string will be passed to logger.
    var now = new Date();
    return now.toISOString() +' '+ options.level.toUpperCase() +' '+ (undefined !== options.message ? options.message : '') +
    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
  },
  json: false
});

var settings = {
  port: 5005,
  cacheDir: './cache',
  webroot: webroot
};

// Create webroot + tts if not exist
if (!fs.existsSync(webroot)) {
  fs.mkdirSync(webroot);
}
if (!fs.existsSync(webroot + '/tts/')) {
  fs.mkdirSync(webroot + '/tts/');
}

// load user settings
try {
  var userSettings = require(path.resolve(__dirname, 'settings.json'));
} catch (e) {
  winston.info('No settings file found, will only use default settings');
}

if (userSettings) {
  for (var i in userSettings) {
    settings[i] = userSettings[i];
  }
}

var fileServer = new nodeStatic.Server(webroot);

// Sonos
var SonosDiscovery = require('sonos-discovery');
var sonosDiscovery = new SonosDiscovery(settings);
var SonosHttpAPI = require('./lib/node-sonos-http-api/lib/sonos-http-api.js');
// var sonosAPI = new SonosHttpAPI(sonosDiscovery, settings);

// Receiver
var YamahaReceiverAPI = require('./lib/node-yamaha-avr/receiver-http-api.js');
var receiverAPI = new YamahaReceiverAPI(settings);

// Mopidy (Spotify)
var MopidyAPI = require('./lib/mopidy-spotify/mopidy-http-api.js');
var modpidyAPI = new MopidyAPI(settings);

var server = http.createServer(function (req, res) {
  req.addListener('end', function () {
    fileServer.serve(req, res, function (err) {
      // If error, route it.
      if (!err) {
        return;
      }

      if (req.url.indexOf('/favicon.ico') > -1) {
        res.end();
        return;
      }

      winston.info("Serving: " + req.url);

      if (req.url.toLowerCase().indexOf("sonos") > -1) {
        if (req.method === 'GET') {
          // cleanse the URL of sonos/ for the Sonos API
          req.url = req.url.toLowerCase().replace('/sonos/', '');
          // Handle with node-sonos-http-api
          sonosAPI.requestHandler(req, res);
        } else {
          winston.info("Sonos endpoint only accepts GET requests. This was a " + req.method + " request.");
        }
      } else if (req.url.toLowerCase().indexOf("receiver") > -1) {
        if (req.method === 'GET') {
          // cleanse the URL of receiver/ for the Receiver API
          req.url = req.url.toLowerCase().replace('/receiver/', '');

          // Handle with receiver-http-api
          receiverAPI.requestHandler(req, res);
        } else {
          winston.info("Receiver endpoint only accepts GET requests. This was a " + req.method + " request.");
        }
      } else if (req.url.toLowerCase().indexOf("spotify") > -1) {

        if (req.method === 'GET') {
          // TODO use options for the input here
          receiverAPI.setPowerState(true, null);
          receiverAPI.selectInput("HDMI2", null);
          receiverAPI.setVolume(-300, null);

          // cleanse the URL of spotify/ for the Mopidy API
          req.url = req.url.toLowerCase().replace('/spotify/', '');

          modpidyAPI.requestHandler(req, res);
        } else {
          winston.info("Spotify endpoint only accepts GET requests. This was a " + req.method + " request.");
        }

      } else {
        winston.info("Unknown URL: " + req.url);
      }

    });
}).resume();
});

server.listen(settings.port, function () {
  winston.info('Alexa@Home HTTP server listening on port', settings.port);
});
