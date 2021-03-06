#!/usr/bin/env node
'use strict';

var counter = 0;
var http = require("http");
var express = require('express');
var path = require('path');
var fs = require('fs');

var updateNotifier = require('update-notifier');
var pkg = require('../package.json');

updateNotifier({pkg: pkg}).notify();

//initLoop('./GSAppCSS');

if(!process.argv[2]) {
	throw new Error("Please provide folder name");
}

var spawn = require('child_process').spawn;
var child = spawn("node" , [path.join(__dirname,"../childprocess.js"), process.argv[2]]);

child.stdout.on('data', function(data) {
	var data = data.toString('utf8');
	console.log(data);
});
child.stderr.on('data', function(data) {
	console.log(data.toString("utf8"))
});


child.on('exit', function() {
	var app = express();
	app.set('views', path.join(__dirname, './../views'));
	app.set('view engine', 'ejs');
	app.use(express.static(path.join(__dirname, './../public')));
	app.use(express.static(path.join(__dirname, './../'+process.argv[2])));
		
	app.get('/', function(req, res) {
		res.render("index");
	});

	app.get('/getFiles', function(req, res) {
		var rStream = fs.createReadStream(path.join(__dirname, "./../temp.json"));
		rStream.pipe(res);
	});
	
	app.listen('8090', function() {
		console.log("SERVER STARTED");
		console.log("Browse http://localhost:8090 to view the docs.");
	});
});
