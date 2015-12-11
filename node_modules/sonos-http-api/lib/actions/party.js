var winston = require('winston');

function party(player, values) {

	player.coordinator.replaceWithFavorite("House Party", function (success) {
		if (success) {
			winston.info("Sonos Party!");
			player.coordinator.play();
		} else {
			winston.error("Error Invoking Sonos Party :(");
		}
	});

	// Bump up the volume :)
	player.coordinator.groupSetVolume(80);
}

module.exports = function (api) {
	api.registerAction('party', party);
}