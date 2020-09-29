using Fantasy_Playoff_Machine.Models;
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
		public static dynamic GetSleeperEndpoint(long leagueId, string suffixRoute = "")
		{
			var client = new RestClient("https://api.sleeper.app/v1/");
			var request = new RestRequest("league/" + leagueId + suffixRoute, Method.GET);

			var zz = client.BuildUri(request);
			var queryResult = client.Execute(request).Content;
			var result = JsonConvert.DeserializeObject<dynamic>(queryResult);
			return result;
		}

		public static EspnLeague CreateLeagueObject(long leagueId)
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
						var value = result.metadata[divisionPropName];
						if (value == null)
							continue;

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
			var userToNameDictionary = new Dictionary<string,string>();
			foreach (var user in users)
			{
				userToNameDictionary.Add(user.user_id.Value, user.metadata.team_name?.Value ?? user.display_name.Value);
			}


			var teamsResult = GetSleeperEndpoint(leagueId, "/rosters");

			foreach (var team in teamsResult)
			{
				//For some reason it can come back with a null roster?
				if (team.owner_id.Value == null)
					continue;

				var divisionId = 1;
				if (finalSettings.Divisions.Count() != 1)
				{
					divisionId = Convert.ToInt32(team.settings.division);
				}

				var division = finalSettings.Divisions.FirstOrDefault(_ => _.ID == divisionId);

				var espnTeam = new EspnTeam
				{
					ID = team.roster_id,
					Division = division.Name,
					TeamName = userToNameDictionary[team.owner_id.Value],
					Wins = team.settings.wins,
					Losses = team.settings.losses,
					Ties = team.settings.ties,
					DivisionWins = 0,
					DivisionLosses = 0,
					DivisionTies = 0,
					PointsFor = team.settings.fpts ?? 0 + (((decimal)(team.settings.fpts_decimal ?? 0))/100),
					PointsAgainst = team.settings.fpts_against ?? 0 + (((decimal)(team.settings.fpts_against_decimal ?? 0)) / 100)
				};
				
				allTeams.Add(espnTeam);
				division.Teams.Add(espnTeam);
			}

			for (int i = 1; i <= finalSettings.RegularSeasonWeeks; i++)
			{
				var matchups = GetSleeperEndpoint(leagueId, "/matchups/" + i);
				var matchupDictionary = new Dictionary<long, EspnMatchupItem>();
				var weekCompleted = false;
				foreach (var matchup in matchups)
				{
					if (matchup.points.Value != 0.0)
						weekCompleted = true;
				}

				foreach (var teamMatchup in matchups)
				{
					//Apparently sleeper allows for teams to be returned that aren't real teams.
					var matchupMatchesTeam = allTeams.FirstOrDefault(_ => _.ID == teamMatchup.roster_id.Value);
					if (matchupMatchesTeam == null)
						continue;
					//TODO Not played yet
					//The week hasn't happened yet
					var x = teamMatchup.points.Value;
					if (teamMatchup.points.Value == null || !weekCompleted)
					{
						var week = i;

						//Check if the schedule knows about this week yet, if not add it
						if (!remainingSchedule.Any(_ => _.Week == week))
						{
							remainingSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>() });
						}
						var scheduledWeek = remainingSchedule.First(_ => _.Week == week);

						
						//If we already processed the other half
						if (matchupDictionary.ContainsKey((long)teamMatchup.matchup_id.Value))
						{
							//Set away team (aka we got to this one second)
							var matchup = matchupDictionary[(long)teamMatchup.matchup_id.Value];
							var awayTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id.Value);

							matchup.AwayTeamName = awayTeam.TeamName;
							scheduledWeek.Matchups.Add(matchup);
						}
						else
						{
							//This is the first time we are processing this matchup
							var homeTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id.Value);

							var matchup = new EspnMatchupItem
							{
								AwayTeamName = "",
								HomeTeamName = homeTeam.TeamName,
								NoWinnerSelected = true,
								AwayTeamWon = false,
								HomeTeamWon = false,
								Tie = false
							};
							long matchupId = teamMatchup.matchup_id.Value;
							matchupDictionary.Add(matchupId, matchup);
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


						//If we already processed the other half
						if (matchupDictionary.ContainsKey(teamMatchup.matchup_id.Value))
						{
							//Set away team (aka we got to this one second)
							var matchup = matchupDictionary[teamMatchup.matchup_id.Value];
							var awayTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id.Value);

							matchup.AwayTeamName = awayTeam.TeamName;
							matchup.AwayTeamScore = teamMatchup.points.Value;

							matchup.AwayTeamWon = matchup.AwayTeamScore > matchup.HomeTeamScore;
							matchup.HomeTeamWon = matchup.HomeTeamScore > matchup.AwayTeamScore;
							matchup.Tie = matchup.HomeTeamScore == matchup.AwayTeamScore;


							scheduledWeek.Matchups.Add(matchup);
						}
						else
						{
							//This is the first time we are processing this matchup
							var homeTeam = allTeams.First(_ => _.ID == teamMatchup.roster_id.Value);

							var matchup = new EspnMatchupItem
							{
								AwayTeamName = "",
								AwayTeamScore = 0,
								HomeTeamName = homeTeam.TeamName,
								HomeTeamScore = teamMatchup.points.Value,
								NoWinnerSelected = false,
								AwayTeamWon = false,
								HomeTeamWon = false,
								Tie = false
							};
							matchupDictionary.Add(teamMatchup.matchup_id.Value, matchup);
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