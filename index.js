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

initLoop('./GSAppCSS');

function initLoop(fileName) {
	
	fileName = fileName;
	fs.stat(fileName, function(err, stats) {

		if(stats && stats.isDirectory()) {
			fs.readdir(fileName, function(err, files) {
				
				Promise.all(files.map(function(file) {
					return readFilesInFolder(fileName+'/'+file);
				})).then(function(data) {
					data = data.filter(function(item) {return item;});

					let filesArray = data.filter(function(item) {
						return item.type === 'file';
					});
					
					let foldersArray = data.filter(function(item) {
						return item.type === 'folder';
					});

					filesArray = filesArray.map(function(item) {return item.path});
					foldersArray = foldersArray.map(function(item) {return item.path});

					foldersArray.forEach(function(item) {
						initLoop(item);
					});

					filesArray.forEach(function(path) {
						testAndAddIntoImages(path);
					});
				})
				
			});	
		}
	});

}

/**
Check a filename and adds it into allImages Array
**/

function testAndAddIntoImages(filePath) {
	if(filePath.match(regexForImage)) {
		allImages.push(filePath);
	}
	else if(filePath.match(regexForCSS)) {
		allCSSFiles.push(filePath);
	}

}


function readFilesInFolder(file) {
	return new Promise(function(resolve, reject) {
		fs.stat(file, function(err, stats) {
			if(stats && stats.isDirectory()) {
				resolve({
					type : 'folder',
					path : file
				});
			}
			else if(stats && stats.isFile()) {
				resolve({
					type : 'file',
					path : file
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
	console.log(counter++, fileName);
	allImages.forEach(function(img) {
		let imgName = img.split('/');
		imgName = imgName[imgName.length -1];
		let imageRegex = new RegExp('.*{.*'+imgName+'.*}');
		let matchedContent = content.match(imageRegex);
		if(matchedContent) {
			//console.log(imgName + "=======>"+ fileName);
			imageToFile.push(imgName + "=======>"+ fileName + "======>" +matchedContent);	
		}	
	});
};



function composedReaders() {
	let toExcecArr =[];
	allCSSFiles.forEach(function(file, iter) {
		toExcecArr.push(function(callback) {
			 
			 let reg = /.*emailbuilder\.min\.css/
			 if(file.match(reg)) callback();
			 	

			 setImmediate(function() {
			 	let stream = fs.createReadStream(file);
			 		stream.on('data', function(chunk) {
			 			matchImagesInCSS(file, chunk.toString('utf8'));
			 		});
			 		stream.on('end', function() {
			 			callback();
			 		});
			 });
		  	/*
		  	setImmediate(function() {
			 	
			 	fs.readFile(file, "utf8", function (err, data) {
			        if (err) throw err;
			        else {
			        	matchImagesInCSS(file, data.toString('utf8'));
			        	callback();
			        }
			     });
			 });
			**/
		});	
	});

	return toExcecArr;

}
function createDocs() {

	return new Promise(function(resolve, reject) {
		async.parallel(composedReaders(), function() {
			console.log('We are all done');
			resolve();
		});
	});
}

process.on('beforeExit', function() {
	//console.log(allImages);

	console.log(allCSSFiles);
	
	createDocs().then(function() {
		console.log(imageToFile);
		process.exit();	
	});

});
