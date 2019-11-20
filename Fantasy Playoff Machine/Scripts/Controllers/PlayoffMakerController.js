var app = angular.module("fantasyPlayoffMachine").controller("PlayoffMakerController",
	["$scope", "PreloadService",
		function ($scope, preloadService) {
			$scope.league = angular.copy(preloadService.GetPreloadedData("League"));
			$scope.teams = [];
			$scope.totalSchedule = [];
			$scope.results = {};
			$scope.iterations = 10000;

			$scope.placeFormatter = function (i) {
				var j = i % 10,
					k = i % 100;
				if (j == 1 && k != 11) {
					return i + "st";
				}
				if (j == 2 && k != 12) {
					return i + "nd";
				}
				if (j == 3 && k != 13) {
					return i + "rd";
				}
				return i + "th";
			}

			$scope.getOddsColumnClass = function (place) {
				if (place <= $scope.league.LeagueSettings.PlayoffTeams - 1)
					return "success";

				return "";
			}

			$scope.getOddsValue = function (team, place) {
				return Math.round($scope.results[team.TeamName][place] * 100) / 100;
			}

			$scope.getTotalOddsValue = function (team) {
				var playoffOdds = 0;

				for (var i = 0; i <= $scope.league.LeagueSettings.PlayoffTeams - 1; i++){
					playoffOdds += $scope.results[team.TeamName][i];
				}

				return Math.round(playoffOdds * 100) / 100;
			}

			$scope.getTotalOddsSortValue = function (team) {
				var playoffOdds = 0;
				var positionalOdds = 0;

				for (var i = 0; i <= $scope.results[team.TeamName].length - 1; i++) {

					if (i <=  $scope.league.LeagueSettings.PlayoffTeams - 1)
						playoffOdds += $scope.results[team.TeamName][i];

					positionalOdds += ($scope.results[team.TeamName][i] / (i + 1));
				}
				
				return (playoffOdds * 100) + positionalOdds;
			}

			$scope.orderStandings = function () {
				//Set overall rank on each team
				var unrankedTeams = [];
				var divisionWinners = [];
				var ranksRemaining = [];

				for (var i = 0; i < $scope.teams.length; i++) {
					ranksRemaining.push(i + 1);
				}
				_.each($scope.teams, function (team) {
					team.WinPercentage = (team.Wins + (0.5) * team.Ties) / Math.max((team.Wins + team.Ties + team.Losses), 1);
					team.DivisionWinPercentage = (team.DivisionWins + (0.5) * team.DivisionTies) / Math.max((team.DivisionWins + team.DivisionTies + team.DivisionLosses), 1);
					unrankedTeams.push(team);
				});


				//Find division winners
				for (var i = 0; i < $scope.league.LeagueSettings.Divisions.length; i++) {
					var divisionTeams = _.filter($scope.teams, function (team) {
						return team.Division === $scope.league.LeagueSettings.Divisions[i].Name;
					});

					var divisionWinner = $scope.determineDivisionWinner(_.sortBy(divisionTeams, function (team) {
						return team.WinPercentage;
					}).reverse(), $scope.league.Site, ranksRemaining[0]);
					divisionWinners.push(divisionWinner);
				}

				//Remove division winners from overall ranks
				unrankedTeams = unrankedTeams.filter(function (team) {
					return _.findIndex(divisionWinners, function (eachTeam) {
						return eachTeam.TeamName == team.TeamName;
					}) < 0;
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

					//Loop through until all of these tiebreakers are resolved
					while (topTeams.length > 1) {
						//Otherwise find the tiebreaker winner
						var topTeam = $scope.determineTieBreakersWinner(topTeams, $scope.league.Site);

						//Remove from all teams
						var index = sortedTeams.indexOf(topTeam);
						if (index > -1)
							sortedTeams.splice(index, 1);

						//Remove from tiebreaking teams
						index = topTeams.indexOf(topTeam);
						if (index > -1)
							topTeams.splice(index, 1);

						orderedTeams.push(topTeam);
					}

					var temp = topTeams.shift();

					////Remove from teams
					var index = sortedTeams.indexOf(temp);
					if (index > -1)
						sortedTeams.splice(index, 1);

					orderedTeams.push(temp);
				}
				return orderedTeams;
			};

			$scope.setTeamRanking = function (remainingRankings, sortedTeams) {
				while (sortedTeams.length > 0) {
					var team = sortedTeams.shift()
					team.OverallRank = remainingRankings.shift();
				}
			}

			$scope.determineDivisionWinner = function (sortedTeams, site) {
				var topTeams = sortedTeams.filter(function (team) {
					return team.WinPercentage === sortedTeams[0].WinPercentage;
				});

				//If only one team has the top record then we found it
				if (topTeams.length === 1) {
					return topTeams[0];
				}

				//Yahoo does intra division for divsion winner first, and then normal tiebreaker
				if (site === "yahoo") {
					var winner = $scope.intraDivisionRecord(topTeams);
					if (winner)
						return winner;
				}

				//Otherwise time to start doing the tiebreakers
				return $scope.determineTieBreakersWinner(topTeams, site);
			}

			$scope.determineTieBreakersWinner = function (teams, site) {
				if (site === "yahoo") {
					var winner = $scope.pointsForTiebreaker(teams);
					if (winner)
						return winner;
					//Fuck the other tiebreaker, i don't want to calculate it

				} else {
					if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 0) { //Head to head
						var winner = $scope.headToHeadTiebreaker(teams, site);
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
						return $scope.coinFlipTiebreaker(teams);

					} else if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 1) { //Total points for
						var winner = $scope.pointsForTiebreaker(teams);
						if (winner)
							return winner;

						winner = $scope.headToHeadTiebreaker(teams, site);
						if (winner)
							return winner;

						winner = $scope.intraDivisionRecord(teams);
						if (winner)
							return winner;

						winner = $scope.pointsAgainstTiebreaker(teams);
						if (winner)
							return winner;
						//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
						return $scope.coinFlipTiebreaker(teams);

					} else if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 2) { //Intra division
						var winner = $scope.intraDivisionRecord(teams);
						if (winner)
							return winner;

						winner = $scope.headToHeadTiebreaker(teams, site);
						if (winner)
							return winner;

						winner = $scope.pointsForTiebreaker(teams);
						if (winner)
							return winner;

						winner = $scope.pointsAgainstTiebreaker(teams);
						if (winner)
							return winner;
						//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
						return $scope.coinFlipTiebreaker(teams);

					} else if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 3) { //Total points against
						var winner = $scope.pointsAgainstTiebreaker(teams);
						if (winner)
							return winner;

						winner = $scope.headToHeadTiebreaker(teams, site);
						if (winner)
							return winner;

						winner = $scope.pointsForTiebreaker(teams);
						if (winner)
							return winner;

						winner = $scope.intraDivisionRecord(teams);
						if (winner)
							return winner;
						//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
						return $scope.coinFlipTiebreaker(teams);
					}
				}
				//Why are we here?
				return $scope.coinFlipTiebreaker(teams);
			};

			$scope.coinFlipTiebreaker = function (teams) {
				var winningTeam = teams.shift();
				return winningTeam;
			};

			$scope.headToHeadTiebreaker = function (teams, site) {
				var headToHeadTeams = [];
				var totalTeams = teams.length;

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
							} else if (matchup.HomeTeamWon) {
								teamLosses++;
							} else if (matchup.Tie) {
								teamTies++;
							}
						} else if (matchup.HomeTeamName == selectedTeam.TeamName && _.findWhere(otherTeams, { TeamName: matchup.AwayTeamName })) {
							if (matchup.HomeTeamWon) {
								teamWins++;
							} else if (matchup.AwayTeamWon) {
								teamLosses++;
							} else if (matchup.Tie) {
								teamTies++;
							}
						}
					}
					var totalGames = teamWins + teamLosses + teamTies;
					headToHeadTeams.push({
						Team: selectedTeam,
						TotalGames: totalGames,
						WinPercentage: (teamWins + (0.5) * teamTies) / Math.max((teamWins + teamLosses + teamTies), 1),
						Wins: teamWins,
						Losses: teamLosses,
						Ties: teamTies
					});
				}

				var teamsWithMatchingGames = _.filter(headToHeadTeams, function (team) {
					return team.TotalGames === headToHeadTeams[0].TotalGames;
				});

				//If all teams don't have the same number of games then we can't use head to head
				if (teamsWithMatchingGames.length !== headToHeadTeams.length) {
					return undefined;
				}

				var bestRecordTeam = _.max(headToHeadTeams, function (team) {
					return team.WinPercentage;
				});

				var teamsWithMatchingWinPercentage = _.filter(headToHeadTeams, function (team) {
					return team.WinPercentage === bestRecordTeam.WinPercentage;
				});

				var teamsWithoutMatchingWinPercentage = _.filter(headToHeadTeams, function (team) {
					return team.WinPercentage !== bestRecordTeam.WinPercentage;
				});

				//If more than one team has the same winning percentage then we can't use head to head
				if (teamsWithMatchingWinPercentage.length > 1) {
					_.each(teamsWithoutMatchingWinPercentage, function (team) {
						var index = _.findIndex(teams, function (eachTeam) {
							return eachTeam.TeamName == team.Team.TeamName;
						});
						if (index > -1)
							teams.splice(index, 1);

					});


					teams = _.filter(teams, function (remainingTeam) {
						return _.some(teamsWithMatchingWinPercentage, function (matchingWinPercentageTeam) {
							return matchingWinPercentageTeam.Team.TeamName === remainingTeam.TeamName;
						});
					});

					var remainingTeams = _.map(teams, function (team) {
						return team.TeamName;
					})

					var remainingText = "";
					//If there are multiple teams remaining and not all are moving on we have to restart the tiebreaking with the remaining teams
					if (totalTeams > 2 && totalTeams !== teams.length) {
						return $scope.determineTieBreakersWinner(teams, site);
					}

					return undefined;
				}

				//Setup tiebreaker text
				var losers = _.filter(headToHeadTeams, function (team) {
					return team.Team.TeamName !== bestRecordTeam.Team.TeamName;
				});
				var loserStrings = _.map(losers, function (team) {
					return team.Team.TeamName + ": " + team.Wins + "-" + team.Losses + "-" + team.Ties;
				});

				return bestRecordTeam.Team;
			};

			$scope.pointsForTiebreaker = function (teams) {
				var maxTeamPoint = _.max(teams, function (team) {
					return team.PointsFor;
				});

				var teamsWithPointValue = _.filter(teams, function (team) {
					return team.PointsFor == maxTeamPoint.PointsFor;
				});

				if (teamsWithPointValue.length === 1) {
					var losers = _.filter(teams, function (team) {
						return team.TeamName !== maxTeamPoint.TeamName;
					});
					var loserStrings = _.map(losers, function (team) {
						return team.TeamName + ": " + (maxTeamPoint.PointsFor - team.PointsFor).toFixed(2);
					})

					return maxTeamPoint;
				}

				return undefined;
			};

			$scope.pointsAgainstTiebreaker = function (teams) {
				var maxTeamPoint = _.max(teams, function (team) {
					return team.PointsAgainst;
				});

				var teamsWithPointValue = _.filter(teams, function (team) {
					return team.PointsAgainst == maxTeamPoint.PointsAgainst;
				});

				if (teamsWithPointValue.length === 1) {
					var losers = _.filter(teams, function (team) {
						return team.TeamName !== maxTeamPoint.TeamName;
					});
					var loserStrings = _.map(losers, function (team) {
						return team.TeamName + ": " + (maxTeamPoint.PointsAgainst - team.PointsAgainst).toFixed(2);
					})

					return maxTeamPoint;
				}

				return undefined;
			};

			$scope.intraDivisionRecord = function (teams) {
				//Sort the teams by intra division record
				var sortedTeams = _.sortBy(teams, function (team) {
					return team.DivisionWinPercentage;
				}).reverse();


				var topTeams = sortedTeams.filter(function (team) {
					return team.DivisionWinPercentage === sortedTeams[0].DivisionWinPercentage;
				});

				//If only one team has the top record then we found it
				if (topTeams.length === 1) {
					var losers = _.filter(teams, function (team) {
						return team.TeamName !== topTeams[0].TeamName;
					});
					var loserStrings = _.map(losers, function (team) {
						return team.TeamName + ": " + team.DivisionWins + "-" + team.DivisionLosses + "-" + team.DivisionTies;
					})

					return topTeams[0];
				}

				//Otherwise time to start doing the tiebreakers
				return undefined;
			};

			$scope.setMatchup = function (matchup, awayTeamWon, tie, homeTeamWon) {
				if (matchup.AwayTeamWon && awayTeamWon || matchup.Tie && tie || matchup.HomeTeamWon && homeTeamWon)
					return;

				var isDivisionalGame = _.some($scope.league.LeagueSettings.Divisions, function (division) {
					//If the division contains both home and away then it is a divisional game
					return _.some(division.Teams, function (team) {
						return team.TeamName == matchup.AwayTeamName;
					})
						&&
						_.some(division.Teams, function (team) {
							return team.TeamName == matchup.HomeTeamName;
						})
				});

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
					if (isDivisionalGame) {
						homeTeam.DivisionTies--;
						awayTeam.DivisionTies--;
					}

				} else if (matchup.AwayTeamWon) {
					//remove away team win and remove home team loss
					awayTeam.Wins--;
					homeTeam.Losses--;

					if (isDivisionalGame) {
						awayTeam.DivisionWins--;
						homeTeam.DivisionLosses--;
					}

				} else if (matchup.HomeTeamWon) {
					//remove home team win and remove away team loss
					awayTeam.Losses--;
					homeTeam.Wins--;

					if (isDivisionalGame) {
						awayTeam.DivisionLosses--;
						homeTeam.DivisionWins--;
					}
				}

				if (tie) {
					//add tie to both teams
					homeTeam.Ties++;
					awayTeam.Ties++;
					if (isDivisionalGame) {
						homeTeam.DivisionTies++;
						awayTeam.DivisionTies++;
					}

				} else if (awayTeamWon) {
					//add win to awawy team and loss to home team
					awayTeam.Wins++;
					homeTeam.Losses++;

					if (isDivisionalGame) {
						awayTeam.DivisionWins++;
						homeTeam.DivisionLosses++;
					}

				} else if (homeTeamWon) {
					//add win to home team and loss to away team
					awayTeam.Losses++;
					homeTeam.Wins++;

					if (isDivisionalGame) {
						awayTeam.DivisionLosses++;
						homeTeam.DivisionWins++;
					}
				}

				matchup.AwayTeamWon = awayTeamWon;
				matchup.Tie = tie;
				matchup.HomeTeamWon = homeTeamWon;
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
			var random = function() {
				var u = 0, v = 0;
				while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
				while (v === 0) v = Math.random();
				return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
			}

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

				//Call standings order
				$scope.orderStandings();
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

				for (var i = 0; i < $scope.iterations; i++) {

					$scope.simluateRestOfSeason();
					_.each($scope.teams, function (team) {
						$scope.results[team.TeamName][team.OverallRank - 1] += 1.0 / $scope.iterations*100
					});

					$scope.league = league;
					$scope.teams = teams;
					generateTotalSchedule();
				}
			}

			generateTotalSchedule();
			$scope.runPlayoffOddsCalculation();
		}
	]
);