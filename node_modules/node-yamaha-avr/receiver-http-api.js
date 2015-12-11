var winston = require('winston');
var requireFu = require('require-fu');

function HttpAPI(settings) {

	// Reciever Control
	var Yamaha = require('./yamaha.js');

	// TODO get this from the 'settings' object!
	var ip = "192.168.1.31"

	winston.info("Connecting to: " + ip);

	var yamaha = new Yamaha(ip);

	this.requestHandler = function(req, res) {

		var url = req.url.toLowerCase();

		if (url.indexOf("state") > -1) {

			GetState();
			GetSystemConfig(res);

		} else if (url.indexOf("power") > -1) {

			if (url.indexOf("on") > -1) {
				winston.info("Powering On Receiver");
				this.setPowerState(true, res);
			} else if (url.indexOf("off") > -1) {
				winston.info("Powering Off Receiver");
				this.setPowerState(false, res);
			} else {
				winston.info("Unknown route: " + url);
				finishResponseWithJSONResult(null, res);
			}

		} else if (url.indexOf("volume") > -1) {
			
			if (url.indexOf("up") > -1) {
				winston.info("Increasing Receiver Volume");
				this.increaseVolume(res);
			} else if (url.indexOf("down") > -1) {
				winston.info("Decreasing Receiver Volume");
				this.decreaseVolume(res);
			} else {
				winston.info("Getting Current Volume");
				yamaha.getVolume(res).then(function(result){
					finishResponseWithJSONResult(result, res);
				});
			}

		} else if (url.indexOf("mute") > -1) {

			if (url.indexOf("on") > -1) {
				winston.info("Muting Receiver Volume");
				this.mute(true, res);
			} else if (url.indexOf("off") > -1) {
				winston.info("Unmuting Receiver Volume");
				this.mute(false, res);
			} else {
				winston.info("Unknown route: " + url);
				finishResponseWithJSONResult(null, res);
			}

		} else if (url.indexOf("input") > -1) {

			var inputName = url.split('input/')[1].toUpperCase();
			this.selectInput(inputName, res);

		} else {

			winston.info("Unknown route: " + url);
			finishResponseWithJSONResult(null, res);

		}
	};

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

	function GetSystemConfig(res){
		yamaha.getSystemConfig().then(function(result){
			finishResponseWithJSONResult(result, res);
		});
	};

	this.setPowerState = function(state, res){
		if (state) {
			yamaha.setPower("on").then(function(result) {
				finishResponseWithJSONResult(result, res);
			});
		} else {
			yamaha.setPower("off").then(function(result) {
				finishResponseWithJSONResult(result, res);
			});
		}
	};

	this.setVolume = function(value, res){
		winston.info("Setting volume to: ", value);
		yamaha.setVolume(value).then(function(result) {
			winston.info("Volume set to: ", result);
			finishResponseWithJSONResult({"volume" :result}, res);
		});
	};

	this.increaseVolume = function(res){
		var parent = this;
		yamaha.getVolume().then(function(result){
			var newVolume = parseInt(result)+50;
			winston.info("Increasing volume to " + newVolume);
			parent.setVolume(newVolume, res);
		});
	};

	this.decreaseVolume = function(res){
		var parent = this;
		yamaha.getVolume().then(function(result){
			var newVolume = parseInt(result)-50;
			winston.info("Decreasing volume to " + newVolume);
			parent.setVolume(newVolume, res);
		});
	};

	this.mute = function(value, res){
		yamaha.setMute(value ? "on" : "off").then(function(result){
			finishResponseWithJSONResult(result, res);
		});
	};

	this.selectInput = function(value, res){
		yamaha.setInput(value).then(function(result){
			finishResponseWithJSONResult(result, res);
		});
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
}

module.exports = HttpAPI;
