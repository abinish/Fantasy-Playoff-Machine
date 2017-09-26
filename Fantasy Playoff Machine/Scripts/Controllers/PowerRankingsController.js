var app = angular.module("fantasyPlayoffMachine").controller("PowerRankingsController",
	["$scope", "PreloadService",
		function ($scope, preloadService) {
			$scope.league = angular.copy(preloadService.GetPreloadedData("League"));
			$scope.teams = [];


			$scope.orderStandings = function () {
				//Set overall rank on each team
				_.each($scope.teams,
					function(team) {
						var espnScore = team.PointsFor + (team.PointsFor * (team.Wins / (team.Wins + team.Losses)));
						var expectedScore = team.PointsFor + (team.PointsFor * (team.ExpectedWins / (team.ExpectedWins + team.ExpectedLosses)));
						team.PowerRankingsScore = Number((espnScore + expectedScore).toFixed(2));
					});
			}

			$scope.dynamicStandings = function (team) {
				return team.PowerRankingsScore;
			}

			var getTeam = function(teamName) {
				var team = _.findWhere($scope.teams, { Name: teamName });
				if (team === undefined) {

					var team = {
						Name: teamName,
						PowerRankingsScore: 0,
						PointsFor: 0,
						PointsAgainst: 0,
						Wins: 0,
						Losses: 0,
						Ties: 0,
						ExpectedWins: 0,
						ExpectedLosses: 0
					}
					$scope.teams.push(team);
				}

				return team;
			}

			_.each($scope.league.CompletedSchedule,
				function(week) {
					_.each(week.Matchups,
						function(matchup) {

							var awayTeam = getTeam(matchup.AwayTeamName);
							awayTeam.PointsFor += matchup.AwayTeamScore;
							awayTeam.PointsAgainst += matchup.HomeTeamScore;
							if (matchup.AwayTeamScore > 93)
								awayTeam.ExpectedWins += 1;
							else
								awayTeam.ExpectedLosses += 1;


							var homeTeam = getTeam(matchup.HomeTeamName);
							homeTeam.PointsFor += matchup.HomeTeamScore;
							homeTeam.PointsAgainst += matchup.AwayTeamScore;
							if (matchup.HomeTeamScore > 93)
								homeTeam.ExpectedWins += 1;
							else
								homeTeam.ExpectedLosses += 1;

							if (matchup.AwayTeamWon) {
								awayTeam.Wins += 1;
								homeTeam.Losses += 1;
							} else if (matchup.HomeTeamWon) {
								awayTeam.Losses += 1;
								homeTeam.Wins += 1;
							} else if (matchup.Tie) {
								awayTeam.Ties += 1;
								homeTeam.Ties += 1;
							}
						});
				});



			$scope.orderStandings();
		}
	]
);