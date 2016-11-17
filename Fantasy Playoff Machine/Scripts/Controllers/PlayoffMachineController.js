var app = angular.module("fantasyPlayoffMachine").controller("PlayoffMachineController",
	["$scope", "PreloadService",
		function ($scope, preloadService) {
			$scope.league = angular.copy(preloadService.GetPreloadedData("League"));

			$scope.getAwayTeamClass = function (matchup) {
				if (matchup.AwayTeamWon)
					return "btn-success";
				if (matchup.HomeTeamWon)
					return "btn-danger";

				return "btn-default";
			}

			$scope.getAwayTeamClass = function (matchup) {
				if (matchup.AwayTeamWon)
					return "btn-success";
				if (matchup.HomeTeamWon)
					return "btn-danger";

				return "btn-default";
			}

			$scope.getHomeTeamClass = function (matchup) {
				if (matchup.AwayTeamWon)
					return "btn-danger";
				if (matchup.HomeTeamWon)
					return "btn-success";

				return "btn-default";
			}

			$scope.getTieClass = function (matchup) {
				if (matchup.Tie)
					return "btn-warning";

				return "btn-default";
			}

			$scope.getTeamClass = function (team) {
				if(team.OverallRank <= $scope.league.LeagueSettings.PlayoffTeams)
					return "success"

				return "";
			}

			$scope.orderStandings = function () {
				//Set overall rank on each team

			}

			$scope.dynamicStandings = function (team) {
				return team.OverallRank;
			}

			$scope.setMatchup = function (matchup, awayTeamWon, tie, homeTeamWon) {
				if (matchup.AwayTeamWon && awayTeamWon || matchup.Tie && tie || matchup.HomeTeamWon && homeTeamWon)
					return;

				//Get Teams

				//Remove previous win/loss/tie from teams
				if (matchup.Tie) {
					//remove ties from both
				} else if (matchup.AwayTeamWon) {
					//remove away team win and remove home team loss
				} else if (matchup.HomeTeamWon) {
					//remove home team win and remove away team loss
				}

				if (tie) {
					//add tie to both teams
				} else if (awayTeamWon) {
					//add win to awawy team and loss to home team
				} else if (homeTeamWon) {
					//add win to home team and loss to away team
				}


				$scope.orderStandings();

			}


			$scope.orderStandings();
		}
	]
);