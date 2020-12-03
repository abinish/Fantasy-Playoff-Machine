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
				if (team.OverallRank <= $scope.league.LeagueSettings.PlayoffTeams)
					return "success"

				return "";
			}

			$scope.generateTiebreakerObject = function (teams) {
				var tiebreaker = {
					Messages: []
				};
				tiebreaker.Messages.push("Tiebreaker between " + teams.map(function (team) { return team.TeamName }).join(', '));
				return tiebreaker
			};

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
					team.Tiebreakers = [];
					unrankedTeams.push(team);
				});


				//Find division winners
				for (var i = 0; i < $scope.league.LeagueSettings.Divisions.length; i++) {
					var divisionWinner = $scope.determineDivisionWinner(_.sortBy($scope.league.LeagueSettings.Divisions[i].Teams, function (team) {
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
						var tiebreakerObject = $scope.generateTiebreakerObject(topTeams);

						var topTeam = $scope.determineTieBreakersWinner(topTeams, $scope.league.Site, tiebreakerObject);

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
					if (topTeams.length > 0) {
						var temp = topTeams.shift();


						////Remove from teams
						var index = sortedTeams.indexOf(temp);
						if (index > -1)
							sortedTeams.splice(index, 1);

						orderedTeams.push(temp);
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

			$scope.determineDivisionWinner = function (sortedTeams, site) {
				var topTeams = sortedTeams.filter(function (team) {
					return team.WinPercentage === sortedTeams[0].WinPercentage;
				});

				//If only one team has the top record then we found it
				if (topTeams.length === 1) {
					return topTeams[0];
				}

				var tiebreakerObject = $scope.generateTiebreakerObject(topTeams);

				//Yahoo does intra division for divsion winner first, and then normal tiebreaker
				if (site === "yahoo") {
					var winner = $scope.intraDivisionRecord(topTeams, tiebreakerObject);
					if (winner)
						return winner;
				}

				//Otherwise time to start doing the tiebreakers
				return $scope.determineTieBreakersWinner(topTeams, site, tiebreakerObject);
			}

			$scope.determineTieBreakersWinner = function (teams, site, tiebreaker) {
				if (site === "yahoo") {
					var winner = $scope.pointsForTiebreaker(teams, tiebreaker);
					if (winner)
						return winner;
					//Fuck the other tiebreaker, i don't want to calculate it

				} else {
					if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 0) { //Head to head
						var winner = $scope.headToHeadTiebreaker(teams, tiebreaker, site);
						if (winner)
							return winner;

						winner = $scope.pointsForTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.intraDivisionRecord(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.pointsAgainstTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;

						//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
						return $scope.coinFlipTiebreaker(teams, tiebreaker);

					} else if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 1) { //Total points for
						var winner = $scope.pointsForTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.headToHeadTiebreaker(teams, tiebreaker, site);
						if (winner)
							return winner;

						winner = $scope.intraDivisionRecord(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.pointsAgainstTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;
						//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
						return $scope.coinFlipTiebreaker(teams, tiebreaker);

					} else if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 2) { //Intra division
						var winner = $scope.intraDivisionRecord(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.headToHeadTiebreaker(teams, tiebreaker, site);
						if (winner)
							return winner;

						winner = $scope.pointsForTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.pointsAgainstTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;
						//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
						return $scope.coinFlipTiebreaker(teams, tiebreaker);

					} else if ($scope.league.LeagueSettings.PlayoffTiebreakerID == 3) { //Total points against
						var winner = $scope.pointsAgainstTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.headToHeadTiebreaker(teams, tiebreaker, site);
						if (winner)
							return winner;

						winner = $scope.pointsForTiebreaker(teams, tiebreaker);
						if (winner)
							return winner;

						winner = $scope.intraDivisionRecord(teams, tiebreaker);
						if (winner)
							return winner;
						//Nobody wins the tiebreaker, just fall back to whoever is listed first...cuz random
						return $scope.coinFlipTiebreaker(teams, tiebreaker);
					}
				}
				//Why are we here?
				return $scope.coinFlipTiebreaker(teams, tiebreaker);
			};

			$scope.coinFlipTiebreaker = function (teams, tiebreaker) {
				var winningTeam = teams.shift();

				//Set losers tiebreaker
				_.each(teams, function (team) {
					var currentTiebreaker = angular.copy(tiebreaker);
					currentTiebreaker.Messages.push("Lost coin flip tiebreaker to " + winningTeam.TeamName);
					team.Tiebreakers.push(currentTiebreaker);
				});

				//Set winners tiebreaker
				var currentTiebreaker = angular.copy(tiebreaker);
				currentTiebreaker.Messages.push("Won coin flip tiebreaker");
				winningTeam.Tiebreakers.push(currentTiebreaker);

				return winningTeam;
			};

			$scope.headToHeadTiebreaker = function (teams, tiebreaker, site) {
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
					tiebreaker.Messages.push("Head to head tiebreaker cannot be used as all teams don't have the same amount of games against eachother")
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
						var currentTiebreaker = angular.copy(tiebreaker);
						currentTiebreaker.Messages.push("Lost head to head tiebreaker due to multiple teams being " + bestRecordTeam.Wins + "-" + bestRecordTeam.Losses + "-" + bestRecordTeam.Ties + " compared to " + team.Wins + "-" + team.Losses + "-" + team.Ties);
						team.Team.Tiebreakers.push(currentTiebreaker);

						var index = _.findIndex(teams, function (eachTeam) {
							return eachTeam.TeamName == team.Team.TeamName;
						});
						if (index > -1)
							teams.splice(index, 1);

					});


					remainingTeams = _.filter(teams, function (remainingTeam) {
						return _.some(teamsWithMatchingWinPercentage, function (matchingWinPercentageTeam) {
							return matchingWinPercentageTeam.Team.TeamName === remainingTeam.TeamName;
						});
					});

					var remainingTeamNames = _.map(teams, function (team) {
						return team.TeamName;
					})

					var remainingText = "";
					//If there are multiple teams remaining and not all are moving on we have to move onto the next tiebreaker with the remaining teams.  This is almost always points for (since 99% of rules are points for first or H2H first and we almost never get here with points for first)
					if (totalTeams > 2 && totalTeams !== remainingTeams.length) {
						remainingText = " Teams remaining: " + remainingTeamNames.join(', ') + ". Remaining teams will move to next tiebreaker";
						tiebreaker.Messages.push("Head to head tiebreaker could not break the tie because multiple teams have the same head to head record." + remainingText);

						var winningTeam = $scope.pointsForTiebreaker(teams, tiebreaker);
						if (winningTeam) {
							var teamsThatLost = _.filter(teams,
								function(team) {
									return team.TeamName !== winningTeam.TeamName;
								});

							_.each(teamsThatLost, function (team) {
								var index = _.findIndex(teams, function (eachTeam) {
									return eachTeam.TeamName == team.TeamName;
								});
								if (index > -1)
									teams.splice(index, 1);

							});
						}
						return winningTeam;
					}


					tiebreaker.Messages.push("Head to head tiebreaker could not break the tie because multiple teams have the same head to head record." + remainingText);
					return undefined;
				}

				//Setup tiebreaker text
				var losers = _.filter(headToHeadTeams, function (team) {
					return team.Team.TeamName !== bestRecordTeam.Team.TeamName;
				});
				var loserStrings = _.map(losers, function (team) {
					return team.Team.TeamName + ": " + team.Wins + "-" + team.Losses + "-" + team.Ties;
				});

				//Set losers tiebreaker
				_.each(losers, function (team) {
					var currentTiebreaker = angular.copy(tiebreaker);
					currentTiebreaker.Messages.push("Lost head to head tiebreaker to " + bestRecordTeam.Team.TeamName + " with " + bestRecordTeam.Wins + "-" + bestRecordTeam.Losses + "-" + bestRecordTeam.Ties + " record compared to " + team.Wins + "-" + team.Losses + "-" + team.Ties);
					team.Team.Tiebreakers.push(currentTiebreaker);
				});

				//Set winners tiebreaker
				var currentTiebreaker = angular.copy(tiebreaker);
				currentTiebreaker.Messages.push("Won head to head tiebreaker by having a " + bestRecordTeam.Wins + "-" + bestRecordTeam.Losses + "-" + bestRecordTeam.Ties + " record compared to " + loserStrings.join(', '));
				bestRecordTeam.Team.Tiebreakers.push(currentTiebreaker);

				return bestRecordTeam.Team;
			};

			$scope.pointsForTiebreaker = function (teams, tiebreaker) {
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

					//Set losers tiebreaker
					_.each(losers, function (team) {
						var currentTiebreaker = angular.copy(tiebreaker);
						var pointsForDiff = (maxTeamPoint.PointsFor - team.PointsFor).toFixed(2);
						currentTiebreaker.Messages.push("Lost points for tiebreaker to " + maxTeamPoint.TeamName + " by " + pointsForDiff + " points");
						team.Tiebreakers.push(currentTiebreaker);
					});

					//Set winners tiebreaker
					var currentTiebreaker = angular.copy(tiebreaker);
					currentTiebreaker.Messages.push("Won points for tiebreaker by having more points than the specified team(s) and their point differential: " + loserStrings.join(', '));
					maxTeamPoint.Tiebreakers.push(currentTiebreaker);

					return maxTeamPoint;
				}

				tiebreaker.Messages.push("Points for tiebreaker could not break the tie because multiple teams have the same points for.");
				return undefined;
			};

			$scope.pointsAgainstTiebreaker = function (teams, tiebreaker) {
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

					//Set losers tiebreaker
					_.each(losers, function (team) {
						var currentTiebreaker = angular.copy(tiebreaker);
						var pointsAgainstDiff = (maxTeamPoint.PointsAgainst - team.PointsAgainst).toFixed(2);
						currentTiebreaker.Messages.push("Lost points against tiebreaker to " + maxTeamPoint.TeamName + " by " + pointsAgainstDiff + " points against");
						team.Tiebreakers.push(currentTiebreaker);
					});

					//Set winners tiebreaker
					var currentTiebreaker = angular.copy(tiebreaker);
					currentTiebreaker.Messages.push("Won points against by having more points against than the specified team(s): " + loserStrings.join(', '));
					maxTeamPoint.Tiebreakers.push(currentTiebreaker);

					return maxTeamPoint;
				}

				tiebreaker.Messages.push("Points against tiebreaker could not break the tie because multiple teams have the same points against.");
				return undefined;
			};

			$scope.intraDivisionRecord = function (teams, tiebreaker) {
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

					//Set losers tiebreaker
					_.each(losers, function (team) {
						var currentTiebreaker = angular.copy(tiebreaker);
						currentTiebreaker.Messages.push("Lost intradivision tiebreaker to " + topTeams[0].TeamName + " " + topTeams[0].DivisionWins + "-" + topTeams[0].DivisionLosses + "-" + topTeams[0].DivisionTies + " record compared to " + team.DivisionWins + "-" + team.DivisionLosses + "-" + team.DivisionTies);
						team.Tiebreakers.push(currentTiebreaker);
					});

					//Set winners tiebreaker
					var currentTiebreaker = angular.copy(tiebreaker);
					currentTiebreaker.Messages.push("Won intradivision tiebreaker by having a " + topTeams[0].DivisionWins + "-" + topTeams[0].DivisionLosses + "-" + topTeams[0].DivisionTies + " record compared to " + loserStrings.join(', '));
					topTeams[0].Tiebreakers.push(currentTiebreaker);

					return topTeams[0];
				}

				//Otherwise time to start doing the tiebreakers
				//Add notes to tiebreaker
				tiebreaker.Messages.push("Intra division record could not break the tie because multiple teams have the same record.");
				return undefined;
			};


			$scope.dynamicStandings = function (team) {
				return team.OverallRank;
			}

			$scope.generateTiebreakerHtml = function (tiebreakers) {
				var tiebreakerText = "";
				_.each(tiebreakers, function (tiebreaker) {
					_.each(tiebreaker.Messages, function (message) {
						tiebreakerText += message + "\r\n";
					});
					tiebreakerText += "\r\n"
				});
				return tiebreakerText;
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

				$scope.orderStandings();

			}

			for (var i = 0; i < $scope.league.LeagueSettings.Divisions.length; i++) {
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