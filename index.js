
var async = require('async');
var fs = require('fs');
var path = require('path');
var destFile = fs.createWriteStream('./stylesheet.css', {
	flag : 'a+',
	encoding : 'utf-8'
});
var regexForImage = /^.*\/.*\.(png|jpeg|jpg|gif)$/;
var regexForCSS  = /^.*\/.*\.css$/;
var allImages = [];
var allCSSFiles = [];
var imageToFile = [];
var stream = require('stream');
var liner = stream.Transform({objectMode : true});
var counter = 0;
require('events').EventEmitter.prototype._maxListeners = 100;


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

					var filesArray = data.filter(function(item) {
						return item.type === 'file';
					});
					
					var foldersArray = data.filter(function(item) {
						return item.type === 'folder';
					});

					filesArray = filesArray.map(function(item) {return item.path});
					foldersArray = foldersArray.map(function(item) {return item.path});

					foldersArray.forEach(function(item) {
						//destFile.write('Hello world \n');
						//console.log(item);
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
		var readstream = fs.createReadStream(fileName);
		
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
		var imgName = img.split('/');
		imgName = imgName[imgName.length -1];
		var imageRegex = new RegExp('.*{.*'+imgName+'.*}');

		if(content.match(imageRegex)) {
			//console.log(imgName + "=======>"+ fileName);
			imageToFile.push(imgName + "=======>"+ fileName);	
		}	
	});
};



function composedReaders() {
	var toExcecArr =[];
	allCSSFiles.forEach(function(file, iter) {
		toExcecArr.push(function(callback) {
			 
			 var reg = /.*emailbuilder\.min\.css/
			 if(file.match(reg)) callback();
			 setImmediate(function() {
			 	
			 	fs.readFile(file, "utf8", function (err, data) {
			        if (err) throw err;
			        else {
			        	matchImagesInCSS(file, data.toString('utf8'));
			        	callback();
			        }
			     });
			 });
		    

			// var rStream = fs.createReadStream(file);
			// var imageRegex = new RegExp('.*{.*'+file+'.*}');
			// rStream.on('data', function(chunk) {
			// 	var content = chunk.toString("utf-8");
			// 	if(content.match(imageRegex)) {
			// 		imageToFile.push('found');
			// 	}
			// });
			
			// rStream.on('end', function() {
			// 	console.log('we are ')
			// 	rStream.close();
			// 	//console.log('fone');
			// 	callback(null);
			// });
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
