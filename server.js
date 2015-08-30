'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var nodeStatic = require('node-static');

// Sonos
var SonosDiscovery = require('sonos-discovery');
var SonosHttpAPI = require('./lib/node-sonos-http-api/lib/sonos-http-api.js');

// Receiver
var YamahaReceiverAPI = null;

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
var sonosDiscovery = new SonosDiscovery(settings);
var sonosAPI = new SonosHttpAPI(sonosDiscovery, settings);

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
          sonosAPI.requestHandler(req, res);
        } else {
          console.log("Sonos endpoint only accepts GET requests. This was a " + req.method + " request.");
        }
      } else if (req.url.toLowerCase().indexOf("receiver") > -1) { 
      	console.log("receiver");
      } else {
        console.log("Unknown URL: " + req.url);
      }
    
    });
  }).resume();
});

server.listen(settings.port, function () {
  console.log('Alexa@Home HTTP server listening on port', settings.port);
});