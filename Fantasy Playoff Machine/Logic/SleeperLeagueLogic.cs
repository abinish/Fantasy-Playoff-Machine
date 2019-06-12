﻿using Fantasy_Playoff_Machine.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace Fantasy_Playoff_Machine.Logic
{
	public static class SleeperLeagueLogic
	{
		public static dynamic GetSleeperEndpoint(int leagueId, string suffixRoute = "")
		{
			var client = new RestClient("https://api.sleeper.app/v1/");
			var request = new RestRequest("league/" + leagueId + suffixRoute, Method.GET);

			var zz = client.BuildUri(request);
			var queryResult = client.Execute(request).Content;
			var result = JsonConvert.DeserializeObject<dynamic>(queryResult);
			return result;
		}

		public static EspnLeague CreateLeagueObject(int leagueId)
		{
			var result = GetSleeperEndpoint(leagueId);
			var settings = result.settings;
			var finalSettings = new EspnLeagueSettings();
			var allTeams = new List<EspnTeam>();

			finalSettings.LeagueName = settings.name;
			finalSettings.Divisions = new List<EspnDivision>();
			
			finalSettings.PlayoffTeams = settings.playoff_teams;
			finalSettings.PlayoffTiebreakerID = 1; //Points for
			finalSettings.RegularSeasonWeeks = settings.playoff_week_start -1;

			//Create divisions
			if (result.metadata == null)
			{
				finalSettings.Divisions.Add(new EspnDivision { Name = finalSettings.LeagueName, ID = 1, Teams = new List<EspnTeam>() });
			}
			else
			{
				try
				{
					var divisionId = 1;
					foreach (var keys in GetPropertyKeysForDynamic(result.metadata))
					{
						var divisionPropName = "division_" + divisionId;
						var propertyInfo = result.metadata.GetType().GetProperty(divisionPropName);
						var value = propertyInfo.GetValue(result.metadata, null);

						finalSettings.Divisions.Add(new EspnDivision { ID = divisionId, Name = value, Teams = new List<EspnTeam>()});
						divisionId++;
					}
				}
				catch (Exception e)
				{
					//Do nothing
				}
			}

			//Create teams and remaining schedule
			var remainingSchedule = new List<EspnWeek>();
			var completedSchedule = new List<EspnWeek>();

			var users = GetSleeperEndpoint(leagueId, "/users");
			var userToNameDictionary = new Dictionary<int,string>();
			foreach (var user in users)
			{
				userToNameDictionary.Add(user.user_id, user.metadata.team_name ?? user.display_name);
			}


			var teamsResult = GetSleeperEndpoint(leagueId, "/rosters");

			foreach (var team in teamsResult)
			{
				var divisionId = 1;
				if (finalSettings.Divisions.Count() != 1)
				{
					divisionId = Convert.ToInt32(team.settings.division);
				}

				var division = finalSettings.Divisions.FirstOrDefault(_ => _.ID == team.divisionId.Value);

				var espnTeam = new EspnTeam
				{
					ID = team.roster_id,
					Division = division.Name,
					TeamName = userToNameDictionary[team.owner_id],
					Wins = team.settings.wins,
					Losses = team.settings.losses,
					Ties = team.settings.ties,
					DivisionWins = 0,
					DivisionLosses = 0,
					DivisionTies = 0,
					PointsFor = team.settings.ppts + (((decimal)team.settings.ppts_decimal)/100),
					PointsAgainst = team.settings.fpts_against + (((decimal)team.settings.fpts_against_decimal) / 100)
				};
				
				allTeams.Add(espnTeam);
				division.Teams.Add(espnTeam);
			}

			for (int i = 1; i <= finalSettings.RegularSeasonWeeks; i++)
			{
				var matchups = GetSleeperEndpoint(leagueId, "/matchups/" + i);


				foreach (var teamMatchup in matchups)
				{
					//TODO Not played yet
					//The week hasn't happened yet
					if (teamMatchup.points == null)
					{
						var week = i;

						//Check if the schedule knows about this week yet, if not add it
						if (!completedSchedule.Any(_ => _.Week == week))
						{
							completedSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>() });
						}
						var scheduledWeek = completedSchedule.First(_ => _.Week == week);

						var matchupDictionary = new Dictionary<int, EspnMatchupItem>();

						//If we already processed the other half
						if (matchupDictionary.ContainsKey(teamMatchup.matchup_id))
						{
							//Set away team (aka we got to this one second)
							var matchup = matchupDictionary[(int)teamMatchup.matchup_id];
							var awayTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id);

							matchup.AwayTeamName = awayTeam.TeamName;
							scheduledWeek.Matchups.Add(matchup);
						}
						else
						{
							//This is the first time we are processing this matchup
							var homeTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id);

							var matchup = new EspnMatchupItem
							{
								AwayTeamName = "",
								HomeTeamName = homeTeam.TeamName,
								NoWinnerSelected = true,
								AwayTeamWon = false,
								HomeTeamWon = false,
								Tie = false
							};
							matchupDictionary.Add(teamMatchup.matchup_id, matchup);
						}
					}
					else
					{
						var week = i;

						//Check if the schedule knows about this week yet, if not add it
						if (!completedSchedule.Any(_ => _.Week == week))
						{
							completedSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>() });
						}
						var scheduledWeek = completedSchedule.First(_ => _.Week == week);

						var matchupDictionary = new Dictionary<int, EspnMatchupItem>();

						//If we already processed the other half
						if (matchupDictionary.ContainsKey(teamMatchup.matchup_id))
						{
							//Set away team (aka we got to this one second)
							var matchup = matchupDictionary[(int)teamMatchup.matchup_id];
							var awayTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id);

							matchup.AwayTeamName = awayTeam.TeamName;
							matchup.AwayTeamScore = teamMatchup.points;

							matchup.AwayTeamWon = matchup.AwayTeamScore > matchup.HomeTeamScore;
							matchup.HomeTeamWon = matchup.HomeTeamScore > matchup.AwayTeamScore;
							matchup.Tie = matchup.HomeTeamScore == matchup.AwayTeamScore;


							scheduledWeek.Matchups.Add(matchup);
						}
						else
						{
							//This is the first time we are processing this matchup
							var homeTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id);

							var matchup = new EspnMatchupItem
							{
								AwayTeamName = "",
								AwayTeamScore = 0,
								HomeTeamName = homeTeam.TeamName,
								HomeTeamScore = teamMatchup.points,
								NoWinnerSelected = false,
								AwayTeamWon = false,
								HomeTeamWon = false,
								Tie = false
							};
							matchupDictionary.Add(teamMatchup.matchup_id, matchup);
						}
					}
				}
			}



			return new EspnLeague { LeagueSettings = finalSettings, RemainingSchedule = remainingSchedule, CompletedSchedule = completedSchedule, Site = "sleeper" };
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