'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var nodeStatic = require('node-static');

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
  console.log('No settings file found, will only use default settings');
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
var sonosAPI = new SonosHttpAPI(sonosDiscovery, settings);

// Receiver
var YamahaReceiverAPI = require('./lib/node-yamaha-avr/receiver-http-api.js');
var receiverAPI = new YamahaReceiverAPI(settings);

var server = http.createServer(function (req, res) {
  req.addListener('end', function () {
    fileServer.serve(req, res, function (err) {
      // If error, route it.
      if (!err) {
        return;
      }

      console.log("Serving: " + req.url);

      if (req.url.toLowerCase().indexOf("sonos") > -1) {
        if (req.method === 'GET') {
          // cleanse the URL of sonos/ for the Sonos API
          req.url = req.url.toLowerCase().replace('sonos/', '');
          // Handle with node-sonos-http-api
          sonosAPI.requestHandler(req, res);
        } else {
          console.log("Sonos endpoint only accepts GET requests. This was a " + req.method + " request.");
        }
      } else if (req.url.toLowerCase().indexOf("receiver") > -1) { 
        if (req.method === 'GET') {
          // cleanse the URL of receiver/ for the Receiver API
          req.url = req.url.toLowerCase().replace('receiver/', '');
          // Handle with receiver-http-api
          receiverAPI.requestHandler(req, res);
        } else {
          console.log("Receiver endpoint only accepts GET requests. This was a " + req.method + " request.");
        }
      } else {
        console.log("Unknown URL: " + req.url);
      }

    });
}).resume();
});

server.listen(settings.port, function () {
  console.log('Alexa@Home HTTP server listening on port', settings.port);
});