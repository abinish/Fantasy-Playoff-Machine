var app = angular.module("fantasyPlayoffMachine").controller("IndexController",
	["$scope", "PreloadService", "$window",
		function ($scope, preloadService, $window) {
			$scope.leagueID = 0;

			$scope.submit = function () {
				$window.open("/Home/PowerRankings?leagueId=" + $scope.leagueID, "_self");
			}
		}
	]
);