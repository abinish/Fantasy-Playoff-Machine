var app = angular.module("fantasyPlayoffMachine").controller("PlayoffMachineController",
	["$scope", "PreloadService",
		function ($scope, preloadService) {
			$scope.league = angular.copy(preloadService.GetPreloadedData("League"));
			$scope.teams = [];
			$scope.totalSchedule = [];


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
				var unrankedTeams = [];
				var divisionWinners = [];
				var ranksRemaining = [];

				for (var i = 0; i < $scope.teams.length; i++) {
					ranksRemaining.push(i+1);
				}
				_.each($scope.teams, function (team) {
					team.WinPercentage = (team.Wins + (0.5) * team.Ties) / (team.Wins + team.Ties + team.Losses);
					team.Tiebreakers = [];
					unrankedTeams.push(team);
				});
				
				
				//Find division winners
				for (var i = 0; i < $scope.league.LeagueSettings.Divisions.length; i++) {
					var divisionWinner = $scope.determineDivisionWinner(_.sortBy($scope.league.LeagueSettings.Divisions[i].Teams, function (team) {
						return team.WinPercentage;
					}).reverse());
					divisionWinners.push(divisionWinner);
				}

				//Remove division winners from overall ranks
				unrankedTeams = unrankedTeams.filter(function (team) {
					return divisionWinners.indexOf(team) < 0;
				})

				//Sort division winners
				var sortedDivisionWinners = $scope.sortTeams(divisionWinners);
				
				//Apply ranking
				$scope.setTeamRanking(ranksRemaining, sortedDivisionWinners)

				//Sort all the rest
				var sortedTeams = $scope.sortTeams(unrankedTeams);

				//Apply rankings
				$scope.setTeamRanking(ranksRemaining, sortedTeams);
			}

			$scope.sortTeams = function (teams) {
				//The array of teams sorted in actual order
				var orderedTeams = [];

				//Presort the teams for easier access
				var sortedTeams = _.sortBy(teams, function (team) {
					return team.WinPercentage;
				}).reverse();
				
				while (sortedTeams.length > 0) {
					var topTeams = sortedTeams.filter(function (team) {
						return team.WinPercentage === sortedTeams[0].WinPercentage;
					});

					//If only one team has the top record then we found it
					if (topTeams.length === 1) {
						var topTeam = sortedTeams.shift();
						orderedTeams.push(topTeam);
					} else {

						//Otherwise find the tiebreaker winner
						var topTeam = $scope.determineTieBreakersWinner(topTeams);

						var index = sortedTeams.indexOf(topTeam);
						if (index > -1)
							sortedTeams.splice(index, 1);

						orderedTeams.push(topTeam);
					}
				}
				return orderedTeams;
			};

			$scope.setTeamRanking = function (remainingRankings, sortedTeams) {
				while (sortedTeams.length > 0) {
					var team = sortedTeams.shift()
					team.OverallRank = remainingRankings.shift();
				}
			}

			$scope.determineDivisionWinner = function (sortedTeams) {
				var topTeams = sortedTeams.filter(function (team) {
					return team.WinPercentage === sortedTeams[0].WinPercentage;
				});

				//If only one team has the top record then we found it
				if (topTeams.length === 1) {
					return topTeams[0];
				}

				//Otherwise time to start doing the tiebreakers
				return $scope.determineTieBreakersWinner(topTeams);
			}

			$scope.determineTieBreakersWinner = function (teams) {
				var losersTieBreaker = {
					Teams: teams.map(_ => _.TeamName),
					Messages: []
				};
				var winnersTieBreaker = {
					Teams: teams.map(_ => _.TeamName),
					Messages: []
				};

				if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 0) { //Head to head
					var winner = $scope.headToHeadTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.pointsForTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.intraDivisionRecord(teams);
					if (winner)
						return winner;

					winner = $scope.pointsAgainstTiebreaker(teams);
					if (winner)
						return winner;
					//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
					return teams.shift();

				} else if ($scope.league.LeagueSettings.TieRule == 1) { //Total points for
					var winner = $scope.pointsForTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.headToHeadTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.intraDivisionRecord(teams);
					if (winner)
						return winner;

					winner = $scope.pointsAgainstTiebreaker(teams);
					if (winner)
						return winner;
					//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
					return teams.shift();
					
				} else if ($scope.league.LeagueSettings.TieRule == 2) { //Intra division
					var winner = $scope.intraDivisionRecord(teams);
					if (winner)
						return winner;

					winner = $scope.headToHeadTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.pointsForTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.pointsAgainstTiebreaker(teams);
					if (winner)
						return winner;
					//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
					return teams.shift();

				} else if ($scope.league.LeagueSettings.TieRule == 3) { //Total points against
					var winner = $scope.pointsAgainstTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.headToHeadTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.pointsForTiebreaker(teams);
					if (winner)
						return winner;

					winner = $scope.intraDivisionRecord(teams);
					if (winner)
						return winner;
					//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
					return teams.shift();
				}
				//Why are we here?
				return teams.shift();
			};

			$scope.headToHeadTiebreaker = function (teams, winnersTiebreaker, losersTiebreaker) {
				var headToHeadTeams = [];

				for (var i = 0; i < teams.length; i++) {
					var selectedTeam = teams[i];
					var otherTeams = teams.filter(function (team) {
						return team.TeamName !== selectedTeam.TeamName;
					});
					var teamWins = 0;
					var teamLosses = 0;
					var teamTies = 0;

					for (var j = 0; j < $scope.totalSchedule.length; j++) {
						var matchup = $scope.totalSchedule[j];

						if (matchup.AwayTeamName == selectedTeam.TeamName && _.findWhere(otherTeams, { TeamName: matchup.HomeTeamName })) {
							if (matchup.AwayTeamWon) {
								teamWins++;
							} else if (matchup.HomeTeamWon){
								teamLosses++;
							} else if (matchup.Tie) {
								teamTies++;
							}
						} else if (matchup.HomeTeamName == selectedTeam.TeamName && _.findWhere(otherTeams, { TeamName: matchup.AwayTeamName })){
							if (matchup.HomeTeamWon) {
								teamWins++;
							} else if (matchup.AwayTeamWon) {
								teamLosses++;
							} else if (matchup.Tie) {
								teamTies++;
							}
						}
					}
					headToHeadTeams.push({
						Team: selectedTeam,
						TotalGames: teamWins + teamLosses + teamTies,
						WinPercentage: (teamWins + (0.5)*teamTies)/(teamWins+teamLosses+teamTies)
					});
				}

				var teamsWithMatchingGames = _.filter(headToHeadTeams, function (team) {
					return team.TotalGames === headToHeadTeams[0].TotalGames;
				});

				//If all teams don't have the same number of games then we can't use head to head
				if (teamsWithMatchingGames.length !== headToHeadTeams.length)
					return undefined;

				var bestRecordTeam = _.max(headToHeadTeams, function (team) {
					return team.WinPercentage;
				});

				var teamsWithMatchingWinPercentage = _.filter(headToHeadTeams, function (team) {
					return team.WinPercentage === bestRecordTeam.WinPercentage;
				});

				//If more than one team has the same winning percentage then we can't use head to head
				if (teamsWithMatchingWinPercentage > 1)
					return undefined;

				return bestRecordTeam.Team;
			};

			$scope.pointsForTiebreaker = function (teams, winnersTiebreaker, losersTiebreaker) {
				var maxTeamPoint = _.max(teams, function (team) {
					return team.PointsFor;
				});

				var teamsWithPointValue = _.filter(teams, function (team) {
					return team.PointsFor == maxTeamPoint.PointsFor;
				});

				if(teamsWithPointValue.length === 1)
					return maxTeamPoint;

				return undefined;
			};

			$scope.pointsAgainstTiebreaker = function (teams, winnersTiebreaker, losersTiebreaker) {
				var maxTeamPoint = _.max(teams, function (team) {
					return team.PointsAgainst;
				});

				var teamsWithPointValue = _.filter(teams, function (team) {
					return team.PointsAgainst == maxTeamPoint.PointsAgainst;
				});

				if (teamsWithPointValue.length === 1)
					return maxTeamPoint;

				return undefined;
			};

			$scope.intraDivisionRecord = function (teams, winnersTiebreaker, losersTiebreaker) {
				return teams.shift();
				//Return team that won, if tie then undefined
			};


			$scope.dynamicStandings = function (team) {
				return team.OverallRank;
			}

			$scope.setMatchup = function (matchup, awayTeamWon, tie, homeTeamWon) {
				if (matchup.AwayTeamWon && awayTeamWon || matchup.Tie && tie || matchup.HomeTeamWon && homeTeamWon)
					return;

				//Get Teams
				var homeTeam = _.find($scope.teams, function (team) {
					return team.TeamName === matchup.HomeTeamName;
				});

				var awayTeam = _.find($scope.teams, function (team) {
					return team.TeamName === matchup.AwayTeamName;
				});

				//Remove previous win/loss/tie from teams
				if (matchup.Tie) {
					//remove ties from both
					homeTeam.Ties--;
					awayTeam.Ties--;
					
				} else if (matchup.AwayTeamWon) {
					//remove away team win and remove home team loss
					awayTeam.Wins--;
					homeTeam.Losses--;

				} else if (matchup.HomeTeamWon) {
					//remove home team win and remove away team loss
					awayTeam.Losses--;
					homeTeam.Wins--;
				}

				if (tie) {
					//add tie to both teams
					homeTeam.Ties++;
					awayTeam.Ties++;

				} else if (awayTeamWon) {
					//add win to awawy team and loss to home team
					awayTeam.Wins++;
					homeTeam.Losses++;
				} else if (homeTeamWon) {
					//add win to home team and loss to away team
					awayTeam.Losses++;
					homeTeam.Wins++;
				}

				matchup.AwayTeamWon = awayTeamWon;
				matchup.Tie = tie;
				matchup.HomeTeamWon = homeTeamWon;

				$scope.orderStandings();

			}

			for (var i = 0; i < $scope.league.LeagueSettings.Divisions.length; i++){
				var x = $scope.league.LeagueSettings.Divisions[i];
				for (var j = 0; j < x.Teams.length; j++) {
					$scope.teams.push($scope.league.LeagueSettings.Divisions[i].Teams[j]);
				}
			}

			for (var i = 0; i < $scope.league.RemainingSchedule.length; i++) {
				$scope.totalSchedule = $scope.totalSchedule.concat($scope.league.RemainingSchedule[i].Matchups);
			}
			for (var i = 0; i < $scope.league.CompletedSchedule.length; i++) {
				$scope.totalSchedule = $scope.totalSchedule.concat($scope.league.CompletedSchedule[i].Matchups);
			}
			
			$scope.orderStandings();
		}
	]
);