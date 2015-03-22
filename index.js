"use strict"

var counter = 0;
var http = require("http");
var express = require('express');
var path = require('path');

//initLoop('./GSAppCSS');
var spawn = require('child_process').spawn;
var child = spawn("node" , ["childprocess.js"]);

child.stdout.on('data', function(data) {
	var data = data.toString('utf8');

	console.log(data);
});
child.stderr.on('data', function(data) {
	console.log(data.toString("utf8"))
});



child.on('exit', function() {
	let app = express();
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'ejs');
	app.use(express.static(path.join(__dirname, 'public')));
	
	app.get('*', function(req, res) {
		res.render("index");
	});
	
	app.listen('8080', function() {
		console.log("SERVER STARTED");
	});
});
