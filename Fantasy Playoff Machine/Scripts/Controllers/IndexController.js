var app = angular.module("fantasyPlayoffMachine", ['ngCookies']).controller("IndexController",
	["$scope", "PreloadService", "$window", "$sce", "OverlayService", "$cookies", "$http",
		function ($scope, preloadService, $window, $sce, overlayService, $cookies, $http) {
			$scope.leagueID = 0;
			$scope.leagues = [];
			$scope.supportedSites = ["ESPN", "Yahoo"];
			$scope.selectedSite;
			$scope.leagueIDToAdd;
			$scope.leagueNameToAdd;
			$scope.leagueUrlToAdd;
			$scope.leagueToAddPrivateLeague;
			$scope.showFullUrlHelpImage;
			$scope.fullUrlHelpImage;
			$scope.showLeagueIDHelpImage;
			$scope.leagueIDHelpImage;

			$scope.demo = function () {
				$window.open("/Home/Demo", "_self");
			};

			$scope.addDisabled = function () {
				return !$scope.leagueIDToAdd && !$scope.leagueNameToAdd;
			};

			$scope.addLeague = function () {
				//Make call to service to check if it works
				return $http.get("Home/VerifyLeagueExists?site=" + $scope.selectedSite + "&leagueId=" + $scope.leagueIDToAdd)
					.then(function (data) {

						if (data.data) { 
							$scope.addLeagueToCookieAndPage({
								Name: $scope.leagueNameToAdd,
								ID: $scope.leagueIDToAdd,
								PrivateLeague: false,
								PrivateLeagueData: "",
								FailedToLoad: false
							});

							$scope.leagueIDToAdd = undefined;
							$scope.leagueNameToAdd = undefined;
							$scope.leagueUrlToAdd = undefined;
							$scope.leagueToAddPrivateLeague = false;
						}
						else {
							$scope.tryAddPrivateLeague();
						}

						
					});
			};

			$scope.tryAddPrivateLeague = function () {

				var tryAddLeague = function (data) {
					if (!data.error) {
						$scope.addLeagueToCookieAndPage({
							Name: $scope.leagueNameToAdd,
							ID: $scope.leagueIDToAdd,
							PrivateLeague: true,
							PrivateLeagueData: data,
							FailedToLoad: false
						});
					}
				}

				//$scope.getPrivateLeagueData($scope.leagueIDToAdd, tryAddLeague);
			};

			$scope.getPrivateLeagueData = function (leagueID, callback) {
				var data = $http.get("http://games.espn.com/ffl/api/v2/leagueSettings?leagueId=" + leagueID + "&seasonId=" + getSeasonId())
					.then(function (data) {
						callback(data);
					});
			};

			$scope.removeLeague = function (league) {

				if (confirm("Are you sure you want to delete that league?")) {
					var index = $scope.leagues.indexOf(league);
					if (index >= 0)
						$scope.leagues.splice(index, 1);

					$scope.saveCookie($scope.leagues);
				}
			}

			$scope.saveCookie = function (leagues) {
				var now = new $window.Date();
				// this will set the expiration to 6 months
				var exp = new $window.Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

				$cookies.putObject("leagues", leagues, {
					expires: exp
				});
			}

			$scope.addLeagueToCookieAndPage = function (leagueToAdd) {
				var cookiesLeagues = $cookies.getObject("leagues");

				if (!cookiesLeagues)
					cookiesLeagues = [];

				cookiesLeagues.push(leagueToAdd);
				$scope.saveCookie(cookiesLeagues);

				$scope.leagues.push(leagueToAdd);
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

			var initializeLeaguesFromCookies = function () {
				var cookiesLeagues = $cookies.getObject("leagues");

				//Look through the leagues and update the data on any private ones
				cookiesLeagues.forEach(function (league) {
					if (league.PrivateLeague) {
						$scope.getPrivateLeagueData(league.ID, function (data) {
							if (data.error) {
								league.FailedToLoad = true;
							} else {
								league.FailedToLoad = false;
								league.PrivateLeagueData = data;
							}
						})
					}
				});
				
				if(cookiesLeagues)
					$scope.leagues = cookiesLeagues;
			};

			setupHelpImages();
			initializeLeaguesFromCookies();

			$http.get("http://games.espn.com/ffl/api/v2/leagueSettings?leagueId=2293930&seasonId=2017")
				.then(function (data) {
					console.log(data);
				});
		}
	]
);