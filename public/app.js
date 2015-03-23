(function (argument) {

	var App = angular.module("cssDocs", []);
	App.controller('MainCtrl', ['$scope', '$http', function($scope, $http){
		alert('here we are');
		$scope.name = "azhar"
		$http.get('/getFiles').success(function(data){
			console.log(data);	
			$scope.imageToFile = data.imageToFile 
		});
	}]);
})();