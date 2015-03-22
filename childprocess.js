
"use strict"

var async = require('async');
var fs = require('fs');
var path = require('path');
var regexForImage = /^.*\/.*\.(png|jpeg|jpg|gif)$/;
var regexForCSS  = /^.*\/.*\.css$/;
var allImages = [];
var allCSSFiles = [];
var imageToFile = [];
var stream = require('stream');
var counter = 0;
var http = require("http");



initLoop('./GSAppCSS');

function initLoop(fileName) {
	
	fileName = fileName;
	fs.stat(fileName, function(err, stats) {

		if(stats && stats.isDirectory()) {
			fs.readdir(fileName, function(err, files) {
				
				Promise.all(files.map(function(file) {
					return readFilesInFolder(fileName+'/'+file);
				})).then(function(data) {
					let filesArray = data.filter(function(item) {
						return item.type === 'file';
					});
					
					let foldersArray = data.filter(function(item) {
						return item.type === 'folder';
					});

					foldersArray.forEach(function(item) {
						initLoop(item.path);
					});
					
					

					filesArray.forEach(function(item) {
						testAndAddIntoImages(item);
					});
				})
				
			});	
		}
	});

}

/**
Check a filename and adds it into allImages Array
**/

function testAndAddIntoImages(fileStats) {
	if(fileStats.path.match(regexForImage)) {
		allImages.push({
			path : fileStats.path,
			size : fileStats.size
		});
	}
	else if(fileStats.path.match(regexForCSS)) {
		allCSSFiles.push({
			path : fileStats.path,
			size : fileStats.size
		});
	}

}


function readFilesInFolder(file) {
	return new Promise(function(resolve, reject) {
		fs.stat(file, function(err, stats) {
			//console.log(stats.size)
			if(stats && stats.isDirectory()) {
				resolve({
					type : 'folder',
					path : file,
				});
			}
			else if(stats && stats.isFile()) {
				resolve({
					type : 'file',
					path : file,
					size : stats['size']
				});
			}
		});
	});
}

function promoiseStream(fileName) {
	return new Promise(function(resolve, reject) {
		let readstream = fs.createReadStream(fileName);
		
			readstream.on('data', function(data) {
				destFile.write(data.toString());				
			});
			readstream.on('end', function() {
				resolve();
			})
	});
};


function matchImagesInCSS(fileName, content) {
	
	allImages.forEach(function(img) {
		let imgName = img.path.split('/');
		imgName = imgName[imgName.length -1];
		let imageRegex = new RegExp('.*{.*'+imgName+'.*}');
		let matchedContent = content.match(imageRegex);
		if(matchedContent) {
			//console.log(imgName + "=======>"+ fileName);
			imageToFile.push({
				imgName :  imgName,
				fileName : fileName,
				matchedContent : matchedContent
			});	
		}	
	});
};



function composedReaders() {
	let toExcecArr =[];
	allCSSFiles.forEach(function(file, iter) {
		toExcecArr.push(function(callback) {
			 let reg = /.*emailbuilder\.min\.css/
			 if(file.path.match(reg)) return callback();
			 	

			 setImmediate(function() {
			 	let _rstream = fs.createReadStream(file.path);
			 		_rstream.on('data', function(chunk) {
			 			callback();
			 			matchImagesInCSS(file.path, chunk.toString('utf8'));
			 		});
			 		_rstream.on('end', function() {
			 			//console.log(counter++);
			 			callback();
			 		});
			 });

		});	
	});

	return toExcecArr;

}
function createDocs() {

	return new Promise(function(resolve, reject) {
		async.parallel(composedReaders(), function() {
			//console.log('We are all done');
			resolve();
		});
	});
}

process.on('beforeExit', function() {
	
	console.log("*******GENERATING DOCS*********");
	createDocs().then(function() {
		console.log("IMAGE REFERENCES : " + imageToFile.length);
		console.log("*******DOCS GENERATED*********");

		process.exit();
		
	});

});