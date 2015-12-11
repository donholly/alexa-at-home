var winston = require('winston');

var lockVolumes = {};

function lockvolumes(player) {
  winston.info("locking volumes");
  // Locate all volumes
  var discovery = player.discovery;

  for (var i in discovery.players) {
    var player = discovery.players[i];
    lockVolumes[i] = player.state.volume;
  }
  // prevent duplicates, will ignore if no event listener is here
  discovery.removeListener("volume", restrictVolume);
  discovery.on("volume", restrictVolume);
}

function unlockvolumes(player) {
  winston.info("unlocking volumes");
  var discovery = player.discovery;
  discovery.removeListener("volume", restrictVolume);
}

function restrictVolume(info) {
  winston.info("should revert volume to", lockVolumes[info.uuid]);
  var player = this.getPlayerByUUID(info.uuid);
  // Only do this if volume differs
  if (player.state.volume != lockVolumes[info.uuid])
    player.setVolume(lockVolumes[info.uuid]);
}

module.exports = function (api) {
  api.registerAction('lockvolumes', lockvolumes);
  api.registerAction('unlockvolumes', unlockvolumes);
}