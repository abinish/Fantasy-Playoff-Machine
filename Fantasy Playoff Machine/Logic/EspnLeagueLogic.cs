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
			if (currentDateTime.Month > 1)
				return currentDateTime.Year;

			return currentDateTime.Year - 1;
		}

		public static int ConvertNewPlayoffTieBreakerToOld(string tiebreaker)
		{
			if (tiebreaker.Equals("H2H_RECORD"))
			{
				return 0;
			}
			else if (tiebreaker.Equals("TOTAL_POINTS_SCORED"))
			{
				return 1;
			}
			else if(tiebreaker.Equals("INTRA_DIVISION_RECORD"))
			{
				return 2;
			}
			else if (tiebreaker.Equals("TOTAL_POINTS_AGAINST"))
			{
				return 3;
			}

			//Should never get here
			return -1;
		}

		public static EspnLeague CreateLeagueObject(dynamic result)
		{
			var settings = result.settings;
			var finalSettings = new EspnLeagueSettings();
			var allTeams = new List<EspnTeam>();

			finalSettings.LeagueName = settings.name;
			finalSettings.Divisions = new List<EspnDivision>();

			//finalSettings.LeagueFormatTypeId = leagueSettings.leagueFormatTypeId; //Not sure if this is used
			//finalSettings.LeagueStatusTypeId = leagueSettings.leagueStatusTypeId; //Not sure if this is used
			finalSettings.PlayoffTeams = settings.scheduleSettings.playoffTeamCount;
			finalSettings.PlayoffTiebreakerID = ConvertNewPlayoffTieBreakerToOld(settings.scheduleSettings.playoffSeedingRule.Value);
			finalSettings.RegularSeasonWeeks = settings.scheduleSettings.matchupPeriodCount;
			//finalSettings.RegularTiebreakerID = settings.scoringSettings.matchupTieRule; //Not used
			//finalSettings.TieRule = leagueSettings.tieRule; //Not used

			//Create divisions
			foreach (var division in settings.scheduleSettings.divisions)
				finalSettings.Divisions.Add(new EspnDivision { Name = division.name, ID = division.id, Teams = new List<EspnTeam>() });

			//Create teams and remaining schedule
			var remainingSchedule = new List<EspnWeek>();
			var completedSchedule = new List<EspnWeek>();

			foreach (var team in result.teams)
			{
				var division = finalSettings.Divisions.FirstOrDefault(_ => _.ID == team.divisionId.Value);

				var espnTeam = new EspnTeam
				{
					ID = team.id,
					Division = division.Name,
					TeamName = team.location + " " + team.nickname,
					Wins = team.record.overall.wins,
					Losses = team.record.overall.losses,
					Ties = team.record.overall.ties,
					DivisionWins = team.record.division.wins,
					DivisionLosses = team.record.division.losses,
					DivisionTies = team.record.division.ties,
					PointsFor = team.record.overall.pointsFor,
					PointsAgainst = team.record.overall.pointsAgainst
				};
				
				allTeams.Add(espnTeam);
				division.Teams.Add(espnTeam);
			}

			foreach (var matchup in result.schedule)
			{
				//The week hasn't happened yet
				if (matchup.winner.Value.Equals("UNDECIDED"))
				{
					var away = matchup?.away;
					var home = matchup?.home;

					//If one of them is null, then its a bye week
					if (away == null || home == null)
						continue;

					var week = matchup.matchupPeriodId;
					//Check if the schedule knows about this week yet, if not add it
					if (!remainingSchedule.Any(_ => _.Week == week.Value))
					{
						remainingSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>() });
					}

					var scheduledWeek = remainingSchedule.First(_ => _.Week == week.Value);

					

					var awayTeam = allTeams.First(_ => _.ID == matchup.away.teamId.Value);
					var homeTeam = allTeams.First(_ => _.ID == matchup.home.teamId.Value);

					scheduledWeek.Matchups.Add(new EspnMatchupItem
					{
						AwayTeamName = awayTeam.TeamName,
						HomeTeamName = homeTeam.TeamName,
						NoWinnerSelected = true,
						AwayTeamWon = false,
						HomeTeamWon = false
					});
					
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

					var awayTeam = allTeams.First(_ => _.ID == matchup.away.teamId.Value);
					var homeTeam = allTeams.First(_ => _.ID == matchup.home.teamId.Value);

					var homeTeamWin = matchup.winner.Value.Equals("HOME");
					var awayTeamWin = matchup.winner.Value.Equals("AWAY");
					var tie = matchup.winner.Value.Equals("TIE");

					//Check if the week knows about this matchup already, if not add it
					if (!scheduledWeek.Matchups.Any(_ => _.AwayTeamName == awayTeam.TeamName && _.HomeTeamName == homeTeam.TeamName))
					{
						scheduledWeek.Matchups.Add(new EspnMatchupItem
						{
							AwayTeamName = awayTeam.TeamName,
							AwayTeamScore = matchup.away.totalPoints,
							HomeTeamName = homeTeam.TeamName,
							HomeTeamScore = matchup.home.totalPoints,
							NoWinnerSelected = false,
							AwayTeamWon = awayTeamWin,
							HomeTeamWon = homeTeamWin,
							Tie = tie
						});
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