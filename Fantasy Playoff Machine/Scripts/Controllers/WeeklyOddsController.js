var app = angular.module("fantasyPlayoffMachine").controller("WeeklyOddsController",
	["$scope", "PreloadService",
		function ($scope, preloadService) {
			$scope.league = angular.copy(preloadService.GetPreloadedData("League"));
			$scope.teams = [];
			$scope.totalSchedule = [];
			$scope.results = {};
			$scope.iterations = 4000;



			$scope.getAwayMatchupClass = function (matchup) {
				if ($scope.getAwayWinPercentage(matchup) > 50)
					return "success";

				return "";
			}

			$scope.getHomeMatchupClass = function (matchup) {
				if ($scope.getHomeWinPercentage(matchup) > 50)
					return "success";

				return "";
			}
			
			for (var i = 0; i < $scope.league.LeagueSettings.Divisions.length; i++) {
				var x = $scope.league.LeagueSettings.Divisions[i];
				for (var j = 0; j < x.Teams.length; j++) {
					$scope.teams.push($scope.league.LeagueSettings.Divisions[i].Teams[j]);
				}
			}

			var generateTotalSchedule = function () {
				$scope.totalSchedule = [];
				for (var i = 0; i < $scope.league.RemainingSchedule.length; i++) {
					$scope.totalSchedule = $scope.totalSchedule.concat($scope.league.RemainingSchedule[i].Matchups);
				}
				for (var i = 0; i < $scope.league.CompletedSchedule.length; i++) {
					$scope.totalSchedule = $scope.totalSchedule.concat($scope.league.CompletedSchedule[i].Matchups);
				}
			}
			// Standard Normal variate using Box-Muller transform.
			// Shamelessly stolen from stackoverflow
			var random = function () {
				var u = 0, v = 0;
				while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
				while (v === 0) v = Math.random();
				return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
			}

			$scope.simluateMatchup = function(matchup) {
				//Sim rest of matchups
				matchup.HomeWins = 0;
				matchup.AwayWins = 0;

				for (var i = 0; i < $scope.iterations; i++)
				{
					var homeTeam = _.find($scope.teams,
						function(team) {
							return team.TeamName === matchup.HomeTeamName;
						});

					var awayTeam = _.find($scope.teams,
						function(team) {
							return team.TeamName === matchup.AwayTeamName;
						});

					var homeTeamScore = homeTeam.averageScore + random() * homeTeam.standardDeviation;
					var awayTeamScore = awayTeam.averageScore + random() * awayTeam.standardDeviation;

					homeTeam.PointsFor += homeTeamScore;
					homeTeam.PointsAgainst += awayTeamScore;
					awayTeam.PointsFor += awayTeamScore;
					awayTeam.PointsAgainst += homeTeamScore;

					if (homeTeamScore > awayTeamScore) {
						matchup.HomeWins += 1;
					} else if (awayTeamScore > homeTeamScore) {
						matchup.AwayWins += 1;
					}
				}
			};

			$scope.simluateRestOfSeason = function () {
				//Sim rest of matchups
				_.each($scope.league.RemainingSchedule, function (week) {
					_.each(week.Matchups, function (matchup) {
						var homeTeam = _.find($scope.teams, function (team) {
							return team.TeamName === matchup.HomeTeamName;
						});

						var awayTeam = _.find($scope.teams, function (team) {
							return team.TeamName === matchup.AwayTeamName;
						});

						var homeTeamScore = homeTeam.averageScore + random() * homeTeam.standardDeviation;
						var awayTeamScore = awayTeam.averageScore + random() * awayTeam.standardDeviation;

						homeTeam.PointsFor += homeTeamScore;
						homeTeam.PointsAgainst += awayTeamScore;
						awayTeam.PointsFor += awayTeamScore;
						awayTeam.PointsAgainst += homeTeamScore;

						if (homeTeamScore > awayTeamScore) {
							$scope.setMatchup(matchup, false, false, true);
						} else if (awayTeamScore > homeTeamScore) {
							$scope.setMatchup(matchup, true, false, false);
						} else { //Tie
							$scope.setMatchup(matchup, false, true, false)
						}
					});
				});
			}

			$scope.runPlayoffOddsCalculation = function () {
				//Initialize additional team data
				_.each($scope.teams, function (team) {
					$scope.results[team.TeamName] = new Array($scope.teams.length).fill(0);

					//Remove outliers and get all scores
					team.filteredScores = _.map($scope.league.CompletedSchedule, function (week) {
						for (var i = 0; i < week.Matchups.length; i++) {
							if (week.Matchups[i].AwayTeamName === team.TeamName)
								return week.Matchups[i].AwayTeamScore;
							if (week.Matchups[i].HomeTeamName === team.TeamName)
								return week.Matchups[i].HomeTeamScore;
						}
					}).filter(n => n).sort();
					if (team.filteredScores.length !== 0) {
						team.averageScore = math.mean(team.filteredScores);
						team.standardDeviation = Math.round(math.std(team.filteredScores));
					} else {
						team.averageScore = 0;
						team.standardDeviation = 0;
					}
				});
				//Save existing data for reuse
				var league = angular.copy($scope.league);
				var teams = angular.copy($scope.teams);
				var totalSchedule = angular.copy($scope.totalSchedule);

				for (var i = 0; i < $scope.league.RemainingSchedule.length; i++) {
					for (var x = 0; x < $scope.league.RemainingSchedule[i].Matchups.length; x++) {
						$scope.simluateMatchup($scope.league.RemainingSchedule[i].Matchups[x]);
					}
				}
			}

			$scope.getAverageScore = function (teamName) {
				var team = _.find($scope.teams,
					function (team) {
						return team.TeamName === teamName;
					});
				
				return Math.round(team.averageScore *100) / 100;
			};

			$scope.getStandardDeviation = function (teamName) {
				var team = _.find($scope.teams,
					function (team) {
						return team.TeamName === teamName;
					});

				return Math.round(team.standardDeviation * 100) / 100;
			};

			$scope.getAwayWinPercentage = function (matchup) {
				return Math.round(matchup.AwayWins / (matchup.AwayWins + matchup.HomeWins) * 10000)/100;
			};

			$scope.getHomeWinPercentage = function (matchup) {
				return Math.round(matchup.HomeWins / (matchup.AwayWins + matchup.HomeWins) * 10000) / 100;
			};

			generateTotalSchedule();
			$scope.runPlayoffOddsCalculation();
		}
	]
);