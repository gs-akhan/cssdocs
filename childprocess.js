
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



initLoop('./'+process.argv[2]);

function initLoop(fileName) {
	
	fileName = fileName;
	fs.stat(fileName, function(err, stats) {

		if(stats && stats.isDirectory()) {
			fs.readdir(fileName, function(err, files) {
				
				Promise.all(files.map(function(file) {
					return readFilesInFolder(fileName+'/'+file);
				})).then(function(data) {
					var filesArray = data.filter(function(item) {
						return item.type === 'file';
					});
					
					var foldersArray = data.filter(function(item) {
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
		var readstream = fs.createReadStream(fileName);
		
			readstream.on('data', function(data) {
				destFile.write(data.toString());				
			});
			readstream.on('end', function() {
				resolve();
			})
	});
};


function matchImagesInCSS(file, content) {
	
	allImages.forEach(function(img) {
		var imgName = img.path.split('/');
		imgName = imgName[imgName.length -1];
		var imageRegex = new RegExp('.*{.*'+imgName+'.*}');
		var matchedContent = content.match(imageRegex);
		if(matchedContent) {
			//console.log(imgName + "=======>"+ fileName);
			imageToFile.push({
				imgPath : img.path.replace("./"+process.argv[2], ""),
				imgName :  imgName,
				fileName : file.path,
				fileSize : file.size,
				matchedContent : matchedContent
			});	
		}	
	});
};



function composedReaders() {
	var toExcecArr =[];
	allCSSFiles.forEach(function(file, iter) {
		toExcecArr.push(function(callback) {
			 var reg = /.*emailbuilder\.min\.css/
			 if(file.path.match(reg)) return callback();
			 	

			 setImmediate(function() {
			 	var _rstream = fs.createReadStream(file.path);
			 		_rstream.on('data', function(chunk) {
			 			console.log("<Processing : "+file.path + " >");
						matchImagesInCSS(file, chunk.toString('utf8'));
			 			callback();
			 		});
			 		_rstream.on('end', function() {
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
			resolve();
		});
	});
}

process.on('beforeExit', function() {
		

	console.log("*******GENERATING DOCS*********");
	createDocs().then(function() {
		try {
			console.log("*******DOCS GENERATED*********");
			fs.writeFileSync(path.join(__dirname, "./temp.json"), JSON.stringify({
					allImages : allImages,
					allCSSFiles : allCSSFiles,
					imageToFile : imageToFile
				}));

			process.exit();	
		}
		catch(e) {
			console.log(e.message);
			process.exit();
		}
		
	});
});