(function (argument) {

	var App = angular.module("cssDocs", []);
	App.controller('MainCtrl', ['$scope', '$http', function($scope, $http){
		$http.get('/getFiles').success(function(data){
			console.log(data);	
			$scope.allImages = data.allImages;
			$scope.allCSSFiles = data.allCSSFiles;
 			$scope.imageToFile = data.imageToFile 
		});
	}]);
})();