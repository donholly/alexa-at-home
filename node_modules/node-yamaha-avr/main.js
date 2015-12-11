var winston = require('winston');
var Yamaha = require('./yamaha');

var ip = process.argv[2];
var cmd = process.argv[3];
var params = process.argv[4];

winston.info("Connecting to: " + ip);

var yamaha = new Yamaha(ip);

yamaha.isOnline().then(function(isOnline){
  if (isOnline === false){
    winston.info("Device returned unknown response");
  }
  else{
    switch(cmd)
    {
      case 's':
        GetState();
        break;
      case 'c':
        GetSystemConfig();
        break;
      case 'm':
        winston.info("Mute to: " + params);
        yamaha.setMute(params);
        break;
      case 'p':
        winston.info("Power to: " + params);
        yamaha.setPower(params);
        break;
      case 'v':
        winston.info("Volume to: " + params);
        yamaha.setVolume(parseInt(params));
        break;
      case 'i':
          winston.info("Set intput to: " + params);
          yamaha.setInput(params);
          break;
      default:
        winston.info("Unknown command");
        break;
    }
  }
}, function(error){
  winston.info("Amplifier not online");
});

function GetState(){
  yamaha.isOn().then(function(result){
    winston.info("Power on: ", result);
  });

  yamaha.getVolume().then(function(result){
    winston.info("Volume: ", result);
  });

  yamaha.getStatus().then(function(result){
    winston.info("Status: %j", result);
  });
}

function GetSystemConfig(){
  yamaha.getSystemConfig().then(function(result){
    winston.info("System: %j", result);
  });
}
