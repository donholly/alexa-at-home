var winston = require('winston');
var fs = require('fs');
var presets = {};

function presetsAction(player, values, callback) {
  var value = decodeURIComponent(values[0]);
  if (value.startsWith('{'))
    var preset = JSON.parse(value);
  else
    var preset = presets[value];

  if (preset) {
    winston.info("Preset found: ", preset);
    player.discovery.applyPreset(preset, function (err, result) {
      if (err) {
        winston.error("Error loading preset: ", err);
      } else {
        winston.info("Playing ", preset);
      }
    });
  } else {
	winston.error("No preset found...");
    var simplePresets = [];
    for (var key in presets) {
      if (presets.hasOwnProperty(key)) {
        simplePresets.push(key);
      }
    }
    callback(simplePresets);
  }
}

function initPresets(api) {
  var presetsFilename = __dirname + '/../../presets.json';
  fs.exists(presetsFilename, function (exists) {
    if (exists) {
      presets = require(presetsFilename);
      winston.info('loaded presets', presets);
    } else {
      winston.info('no preset file, ignoring...');
    }
    api.registerAction('preset', presetsAction);
  });
}

module.exports = function (api) {
  initPresets(api);
}