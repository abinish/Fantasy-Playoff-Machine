var app = angular.module("fantasyPlayoffMachine", ['ngCookies']).controller("TestController",
	["$scope", "PreloadService", "$window", "$sce", "OverlayService", "$cookies", "$http", "$location", "$timeout",
		function ($scope, preloadService, $window, $sce, overlayService, $cookies, $http, $location, $timeout) {
			$scope.leagueIDToAdd;
			$scope.leagueName;
			$scope.leagueNameSucceeded = false;
			$scope.leagueNameFailed = false;
			$scope.swid;
			$scope.s2;
			$scope.counter = 0;
			
			$scope.addDisabled = function () {
				return !$scope.leagueIDToAdd && !$scope.leagueNameToAdd;
			};


			$scope.getImageUrl = function (selectedSite) {
				if (selectedSite === "ESPN")
					return "../Content/espnurl.PNG";
				else if(selectedSite === "Yahoo")
					return "../Content/yahoourl.PNG";
				return "";
			}

			$scope.showLeagueBox = function()
			{
				return $scope.swid && $scope.s2;
			}

			$scope.addLeague = function () {
				//Make call to service to check if it works
				$http.get("/Test/Test?leagueId=" + $scope.leagueIDToAdd + "&s2=" + $scope.s2 + "&swid=" + $scope.swid)
					.then(function (data) {

						if (data.data === "FAILED") {
							$scope.leagueNameFailed = true;
							$scope.leagueNameSucceeded = false;
						}
						else {
							$scope.leagueName = data.data;
							$scope.leagueNameSucceeded = true;
							$scope.leagueNameFailed = false;
						}
					});
			};

			var getSeasonId = function () {
				var now = new Date();

				//If it is the second half of the year return this year
				//Otherwise it is early in the next year and espn uses the start of the season as the seasonID
				if (now.getMonth() > 6)
					return now.getFullYear();


				return now.getFullYear() -1;
			}

			var setupHelpImages = function () {
				var contentPath = "~/Content/";
				var helpImageHtmlStartTemplate = "<img src='" + contentPath + "/";
				$scope.fullUrlHelpImage = $sce.trustAsHtml(helpImageHtmlStartTemplate + "FullUrl.png' alt='FullUrl' style='width: 100%; height: auto;'/>");
				$scope.leagueIDHelpImage = $sce.trustAsHtml(helpImageHtmlStartTemplate + "LeagueID.png' alt='League ID' style='width: 100%; height: auto;'/>");
			};

			setupHelpImages();
			$timeout(function() {
					var swid = preloadService.GetPreloadedData("swid")
					var s2 = preloadService.GetPreloadedData("s2");
					if (swid && s2) {
						$scope.swid = swid;
						$scope.s2 = s2;
						console.log($scope.swid);
						console.log("got here" + $scope.s2);

					} else {
						$scope.counter++;
						if ($scope.counter < 20)
							$timeout(setupTimer(), 5000);
					}
				},
				2000);
		}
	]
);