var app = angular.module("fantasyPlayoffMachine", ['ngCookies']).controller("IndexController",
	["$scope", "PreloadService", "$window", "$sce", "OverlayService", "$cookies", "$http", "$location",
		function ($scope, preloadService, $window, $sce, overlayService, $cookies, $http, $location) {
			$scope.leagues = [];
			$scope.supportedSites = ["ESPN", "Yahoo", "Sleeper"];
			$scope.selectedSite;
			$scope.leagueIDToAdd;
			$scope.leagueNameToAdd;
			$scope.yahooUserId;
			$scope.showPrivateLeagueSettings = false;
			$scope.privateLeagueDataToAdd = "";

			$scope.demo = function () {
				$window.open("/Home/Demo", "_self");
			};
			$scope.addDisabled = function () {
				return !$scope.leagueIDToAdd && !$scope.leagueNameToAdd;
			};

			$scope.getImageUrl = function (selectedSite) {
				if (selectedSite === "ESPN")
					return "../Content/espnurl.PNG";
				else if(selectedSite === "Yahoo")
					return "../Content/yahoourl.PNG";
				else if (selectedSite === "Sleeper")
					return "../Content/sleeperUrl.png";
				return "";
			}

			$scope.showYahooAuthenticateButton = function () {
				return $scope.selectedSite === "Yahoo" && !$scope.yahooUserId;
			};

			var showPrivateLeagueSettings = function() {
				//Show tips for doing private leagues
				$scope.showPrivateLeagueSettings = true;
				$scope.privateLeagueUri = "http://fantasy.espn.com/apis/v3/games/ffl/seasons/" +
					getSeasonId() +
					"/segments/0/leagues/" +
					$scope.leagueIDToAdd +
					"?view=mMatchupScore&view=mTeam&view=mSettings";
				$scope.$apply();
			}

			var privateLeagueCallback = function() {

				var swid = preloadService.GetPreloadedData("swid")
				var s2 = preloadService.GetPreloadedData("s2");
				if (swid && s2) {
					$scope.swid = swid;
					$scope.s2 = s2;

				} else {
					showPrivateLeagueSettings();
				}
			};

			$scope.addLeague = function () {
				//Make call to service to check if it works
				$http.get("/Home/VerifyLeagueExists?site=" + $scope.selectedSite + "&leagueId=" + $scope.leagueIDToAdd + "&userId=" + $scope.yahooUserId)
					.then(function (data) {

						if (data.data) {
							$scope.addLeagueToCookieAndPage({
								Name: $scope.leagueNameToAdd,
								ID: $scope.leagueIDToAdd,
								Site: $scope.selectedSite
							});

							$scope.leagueIDToAdd = undefined;
							$scope.leagueNameToAdd = undefined;
							$scope.showPrivateLeagueSettings = false;
						}
						else if ($scope.selectedSite === "ESPN") {
							showPrivateLeagueSettings();
							//if (!$scope.swid && !$scope.s2) {
							//	tryGetEspnCreds(true, privateLeagueCallback);
							//} else {
							//	showPrivateLeagueSettings();
							//}

						} else {
							alert("We could not properly load the league.  If you have questions, email support@theffhub.com");
						}
					});
			};

			$scope.removeLeague = function (league) {

				if (confirm("Are you sure you want to delete that league?")) {
					var index = $scope.leagues.indexOf(league);
					if (index >= 0)
						$scope.leagues.splice(index, 1);

					$scope.saveCookie({
						yahooUserId: $scope.yahooUserId,
						leagues: $scope.leagues
					});
				}
			};

			$scope.saveCookie = function (data) {
				var now = new $window.Date();
				// this will set the expiration to 6 months
				var exp = new $window.Date(now.getFullYear(), now.getMonth() + 6, now.getDate());


				var getDomain = function () {
					if ($location.host().includes("dev-theffhub")){
						return ".dev-theffhub.azurewebsites.net/"
					}
					return ".theffhub.com";
				}
				$cookies.putObject("data", data, {
					expires: exp,
					path: '/',
					domain: getDomain()
				});
			};

			$scope.saveEspnCreds = function() {
				var data = $cookies.getObject("data");

				if (!data) {
					data = {
						yahooUserId: '',
						leagues: []
					};
				}
				data.s2 = $scope.s2;
				data.swid = $scope.swid;

				$scope.saveCookie(data);
			}

			$scope.addLeagueToCookieAndPage = function (leagueToAdd) {
				var data = $cookies.getObject("data");

				if (!data) {
					data = {
						yahooUserId: '',
						leagues: []
					};
				}
				
				data.leagues.push(leagueToAdd);
				
				$scope.saveCookie(data);

				$scope.leagues.push(leagueToAdd);
			};

			$scope.generateLeagueDataUrl = function (league) {
				return "http://fantasy.espn.com/apis/v3/games/ffl/seasons/" + getSeasonId() + "/segments/0/leagues/" + league.ID + "view=mMatchupScore&view=mTeam";
			}

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
				var data = $cookies.getObject("data");
				
				if (data) {
					$scope.leagues = data.leagues;
					$scope.yahooUserId = data.yahooUserId;
					$scope.s2 = data.s2;
					$scope.swid = data.swid;
				}
			};

			$scope.yahooLogin = function () {
				$window.location = "Auth/YahooLogin";
			};

			var initializeFromPreloadedData = function () {
				var yahooUserId = preloadService.GetPreloadedData("YahooUserGuid");
				if (yahooUserId) {
					$scope.yahooUserId = yahooUserId;
					$scope.saveCookie({
						yahooUserId: yahooUserId,
						leagues: $scope.leagues
					});
				}
			}

			setupHelpImages();
			initializeLeaguesFromCookies();
			initializeFromPreloadedData();
		}
	]
);