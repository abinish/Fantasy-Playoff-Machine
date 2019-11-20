var app = angular.module("fantasyPlayoffMachine").controller("SchedulerController",
	["$scope", "PreloadService",
		function ($scope, preloadService) {
			$scope.league = angular.copy(preloadService.GetPreloadedData("League"));
			$scope.teams = [];
			$scope.teamScheduleLookup = {};
			$scope.teamAggregateScore = {};
			$scope.totalSchedule = [];
			$scope.results = {};
			$scope.iterations = 4000;

			$scope.weekId = function (week) {
				return week.Week;
			}

			$scope.getRecordColumnClass = function(teamToUse, teamToCompareAgainst) {
				if (teamToUse === teamToCompareAgainst)
					return "secondary"
				return "";
			}

			$scope.getRecord = function (teamToUse, teamToCompareAgainst) {

				var scores = _.map($scope.league.CompletedSchedule,
					function (week) {
						for (var i = 0; i < week.Matchups.length; i++) {
							if (week.Matchups[i].AwayTeamName === teamToUse.TeamName)
								return week.Matchups[i].AwayTeamScore;

							if (week.Matchups[i].HomeTeamName === teamToUse.TeamName)
								return week.Matchups[i].HomeTeamScore;

						}
					});

				var scoresAgainst = _.map($scope.league.CompletedSchedule,
					function (week) {
						for (var i = 0; i < week.Matchups.length; i++) {

							if (week.Matchups[i].AwayTeamName === teamToCompareAgainst.TeamName) {
								//If the team we are using is the team the other one is facing, this matchup stays the same
								if (week.Matchups[i].HomeTeamName === teamToUse.TeamName)
									return week.Matchups[i].AwayTeamScore;

								return week.Matchups[i].HomeTeamScore;
							}

							if (week.Matchups[i].HomeTeamName === teamToCompareAgainst.TeamName) {
								//If the team we are using is the team the other one is facing, this matchup stays the same
								if (week.Matchups[i].AwayTeamName === teamToUse.TeamName)
									return week.Matchups[i].HomeTeamScore;

								return week.Matchups[i].AwayTeamScore;
							}
						}
					});

				var wins = 0;
				var losses = 0;
				var ties = 0;
				for (var i = 0; i < scores.length; i++) {
					if (scores[i] < scoresAgainst[i]) {
						losses++;
					} else if (scores[i] > scoresAgainst[i]) {
						wins++;
					} else {
						ties++;
					}
				}

				if (ties === 0)
					return wins + "-" + losses;

				return wins + "-" + losses + "-" + ties;
			}

			$scope.getWeeklyRecord = function (team, week) {
				return team.WeeklyRecord[week.Week];
			}

			$scope.getTotalWinPercentage = function (team) {
				var aggregateScores = $scope.teamAggregateScore[team.TeamName];
				return (aggregateScores.Wins + .5 * aggregateScores.Ties) / (aggregateScores.Wins + aggregateScores.Ties + aggregateScores.Losses);
			}

			$scope.getTotalRecord = function (team) {
				var aggregateScores = $scope.teamAggregateScore[team.TeamName];
				if (aggregateScores.Ties === 0)
					return aggregateScores.Wins + "-" + aggregateScores.Losses;

				return aggregateScores.Wins + "-" + aggregateScores.Losses + "-" + aggregateScores.Ties ;
			}

			for (var i = 0; i < $scope.league.LeagueSettings.Divisions.length; i++) {
				var x = $scope.league.LeagueSettings.Divisions[i];
				for (var j = 0; j < x.Teams.length; j++) {
					$scope.teams.push($scope.league.LeagueSettings.Divisions[i].Teams[j]);
					$scope.teamAggregateScore[$scope.league.LeagueSettings.Divisions[i].Teams[j].TeamName] = {
						Wins: 0,
						Losses: 0,
						Ties: 0
					};
				}
			}

			for (var i = 0; i < $scope.teams.length; i++) {
				var teamToUse = $scope.teams[i];

				var scores = _.map($scope.league.CompletedSchedule,
					function (week) {
						for (var i = 0; i < week.Matchups.length; i++) {
							if (week.Matchups[i].AwayTeamName === teamToUse.TeamName)
								return week.Matchups[i].AwayTeamScore;

							if (week.Matchups[i].HomeTeamName === teamToUse.TeamName)
								return week.Matchups[i].HomeTeamScore;

						}
					});
				teamToUse.WeeklyRecord = [];
				$scope.teamScheduleLookup[teamToUse.TeamName] = scores;
			}

			for (var teamIndex = 0; teamIndex < $scope.teams.length; teamIndex++) {
				for (var weekIndex = 0; weekIndex < $scope.league.CompletedSchedule.length; weekIndex++) {
					var team = $scope.teams[teamIndex];
					var week = $scope.league.CompletedSchedule[weekIndex];

					var wins = 0;
					var losses = 0;
					var ties = 0;

					var scoreToCompareAgainst = $scope.teamScheduleLookup[team.TeamName][week.Week - 1];

					for (var i = 0; i < $scope.teams.length; i++) {
						if ($scope.teams[i] == team)
							continue;

						var opponentScore = $scope.teamScheduleLookup[$scope.teams[i].TeamName][week.Week - 1];

						if (scoreToCompareAgainst < opponentScore) {
							losses++;
						} else if (scoreToCompareAgainst > opponentScore) {
							wins++;
						} else {
							ties++;
						}
					};

					$scope.teamAggregateScore[team.TeamName].Wins += wins;
					$scope.teamAggregateScore[team.TeamName].Losses += losses;
					$scope.teamAggregateScore[team.TeamName].Ties += ties;

					if (ties === 0) {
						team.WeeklyRecord[week.Week] = wins + "-" + losses;
					} else {
						team.WeeklyRecord[week.Week] = wins + "-" + losses + "-" + ties;
					}
				}
			}
		}
	]
);