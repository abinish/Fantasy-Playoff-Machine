using Fantasy_Playoff_Machine.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Fantasy_Playoff_Machine.Logic
{
	public static class EspnLeagueLogic
	{
		public static int GetEspnSeasonId()
		{
			var currentDateTime = DateTime.Today;

			//If it is the second half of the year return this year
			//Otherwise it is early in the next year and espn uses the start of the season as the seasonID
			if (currentDateTime.Month > 6)
				return currentDateTime.Year;

			return currentDateTime.Year - 1;
		}

		public static EspnLeague CreateLeagueObject(dynamic result)
		{
			var leagueSettings = result.leaguesettings;
			var finalSettings = new EspnLeagueSettings();

			finalSettings.LeagueName = leagueSettings.name;
			finalSettings.Divisions = new List<EspnDivision>();
			finalSettings.LeagueFormatTypeId = leagueSettings.leagueFormatTypeId;
			finalSettings.LeagueStatusTypeId = leagueSettings.leagueStatusTypeId;
			finalSettings.PlayoffTeams = leagueSettings.playoffTeamCount;
			finalSettings.PlayoffTiebreakerID = leagueSettings.playoffTieRule;
			finalSettings.RegularSeasonWeeks = leagueSettings.regularSeasonMatchupPeriodCount;
			finalSettings.RegularTiebreakerID = leagueSettings.playoffSeedingTieRuleRawStatId;
			finalSettings.TieRule = leagueSettings.tieRule;

			//Create divisions
			foreach (var division in leagueSettings.divisions)
				finalSettings.Divisions.Add(new EspnDivision { Name = division.name, Teams = new List<EspnTeam>() });

			//Create teams and remaining schedule
			var remainingSchedule = new List<EspnWeek>();
			var completedSchedule = new List<EspnWeek>();

			foreach (var teamProperty in GetPropertyKeysForDynamic(leagueSettings.teams))
			{
				var team = leagueSettings.teams[teamProperty];

				var espnTeam = new EspnTeam
				{
					Division = team.division.divisionName,
					TeamName = team.teamLocation + " " + team.teamNickname,
					Wins = team.record.overallWins,
					Losses = team.record.overallLosses,
					Ties = team.record.overallTies,
					DivisionRank = team.divisionStanding,
					OverallRank = team.overallStanding
				};
				var division = finalSettings.Divisions.First(_ => _.Name.Equals(espnTeam.Division));
				division.Teams.Add(espnTeam);

				foreach (var matchup in team.scheduleItems)
				{
					//The week hasn't happened yet
					if (matchup.matchups[0].outcome == 0)
					{
						var week = matchup.matchupPeriodId;
						//Check if the schedule knows about this week yet, if not add it
						if (!remainingSchedule.Any(_ => _.Week == week.Value))
						{
							remainingSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>() });
						}

						var scheduledWeek = remainingSchedule.First(_ => _.Week == week.Value);
						if (matchup.matchups[0].isBye.Value)
						{
							continue;
						}

						var awayTeam = matchup.matchups[0].awayTeam.teamLocation + " " + matchup.matchups[0].awayTeam.teamNickname;
						var homeTeam = matchup.matchups[0].homeTeam.teamLocation + " " + matchup.matchups[0].homeTeam.teamNickname;

						//Check if the week knows about this matchup already, if not add it
						if (!scheduledWeek.Matchups.Any(_ => _.AwayTeamName == awayTeam.Value && _.HomeTeamName == homeTeam.Value))
						{
							scheduledWeek.Matchups.Add(new EspnMatchupItem
							{
								AwayTeamName = awayTeam.Value,
								HomeTeamName = homeTeam.Value,
								NoWinnerSelected = true,
								AwayTeamWon = false,
								HomeTeamWon = false
							});
						}
					}
					else //The week is completed 
					{
						var week = matchup.matchupPeriodId;

						//Check if the schedule knows about this week yet, if not add it
						if (!completedSchedule.Any(_ => _.Week == week.Value))
						{
							completedSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>() });
						}

						var scheduledWeek = completedSchedule.First(_ => _.Week == week.Value);

						if (matchup.matchups[0].isBye.Value)
						{
							//If its a bye skip it all
							continue;
						}

						var awayTeam = matchup.matchups[0].awayTeam.teamLocation + " " + matchup.matchups[0].awayTeam.teamNickname;
						var homeTeam = matchup.matchups[0].homeTeam.teamLocation + " " + matchup.matchups[0].homeTeam.teamNickname;

						var homeTeamWin = matchup.matchups[0].outcome == 1;
						var awayTeamWin = matchup.matchups[0].outcome == 2;
						var tie = matchup.matchups[0].outcome == 0;

						//Add the score for the game to the current team
						if (espnTeam.TeamName == awayTeam.Value)
						{
							//Away team
							espnTeam.PointsFor += (decimal)matchup.matchups[0].awayTeamScores[0];
							espnTeam.PointsAgainst += (decimal)matchup.matchups[0].homeTeamScores[0];

							//Check if division matchup
							if (finalSettings.Divisions.Any(_ => _.Teams.Any(x => x.TeamName == awayTeam.Value) && _.Teams.Any(y => y.TeamName == homeTeam.Value)))
							{

								if (awayTeamWin)
								{
									espnTeam.DivisionWins++;
								}
								else if (homeTeamWin)
								{
									espnTeam.DivisionLosses++;
								}
								else if (tie)
								{
									espnTeam.DivisionTies++;
								}
							}

						}
						else
						{
							//Home team
							espnTeam.PointsFor += (decimal)matchup.matchups[0].homeTeamScores[0];
							espnTeam.PointsAgainst += (decimal)matchup.matchups[0].awayTeamScores[0];

							//Check if division matchup
							if (finalSettings.Divisions.Any(_ => _.Teams.Any(x => x.TeamName == awayTeam.Value) && _.Teams.Any(y => y.TeamName == homeTeam.Value)))
							{

								if (awayTeamWin)
								{
									espnTeam.DivisionLosses++;
								}
								else if (homeTeamWin)
								{
									espnTeam.DivisionWins++;
								}
								else if (tie)
								{
									espnTeam.DivisionTies++;
								}
							}
						}


						//Check if the week knows about this matchup already, if not add it
						if (!scheduledWeek.Matchups.Any(_ => _.AwayTeamName == awayTeam.Value && _.HomeTeamName == homeTeam.Value))
						{
							scheduledWeek.Matchups.Add(new EspnMatchupItem
							{
								AwayTeamName = awayTeam.Value,
								AwayTeamScore = matchup.matchups[0].awayTeamScores[0],
								HomeTeamName = homeTeam.Value,
								HomeTeamScore = matchup.matchups[0].homeTeamScores[0],
								NoWinnerSelected = false,
								AwayTeamWon = awayTeamWin,
								HomeTeamWon = homeTeamWin,
								Tie = tie
							});
						}
					}
				}
			}

			return new EspnLeague { LeagueSettings = finalSettings, RemainingSchedule = remainingSchedule, CompletedSchedule = completedSchedule, Site = "espn" };
		}

		private static List<string> GetPropertyKeysForDynamic(dynamic dynamicToGetPropertiesFor)
		{
			JObject attributesAsJObject = dynamicToGetPropertiesFor;
			Dictionary<string, object> values = attributesAsJObject.ToObject<Dictionary<string, object>>();
			List<string> toReturn = new List<string>();
			foreach (string key in values.Keys)
			{
				toReturn.Add(key);
			}
			return toReturn;
		}
	}
}