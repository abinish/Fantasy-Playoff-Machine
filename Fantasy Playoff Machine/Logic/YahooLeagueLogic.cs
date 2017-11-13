using Fantasy_Playoff_Machine.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RestSharp;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Xml.Linq;

namespace Fantasy_Playoff_Machine.Logic
{
	public static class YahooLeagueLogic
	{
		private static string gameKey;

		public static string GetYahooLeagueKey(int leagueId, YahooCredentials creds)
		{
			if (!string.IsNullOrEmpty(gameKey))
				return gameKey + ".l." + leagueId;

			var client = new RestClient("https://fantasysports.yahooapis.com");
			var request = new RestRequest("/fantasy/v2/games;game_keys=nfl;seasons=" + GetYahooYear() + "", Method.GET);

			request.AddHeader("Authorization", "Bearer " + creds.AccessToken);

			var queryResult = client.Execute(request).Content;
			try
			{
				XDocument doc = XDocument.Parse(queryResult);
				string jsonText = JsonConvert.SerializeXNode(doc);

				var dynamicResult = JsonConvert.DeserializeObject<dynamic>(jsonText);
				if (dynamicResult.fantasy_content == null)
					return null;

				gameKey = dynamicResult.fantasy_content.games.game.game_key;

				return gameKey + ".l." + leagueId;
			}catch(XmlException)
			{
				return null;
			}
		}

		public static EspnLeague CreateLeagueObject(int leagueId, YahooCredentials creds)
		{
			//This all pains me because yahoo returns lists instead of objects
			var leagueKey = GetYahooLeagueKey(leagueId, creds);
			var client = new RestClient("https://fantasysports.yahooapis.com");
			var request = new RestRequest("/fantasy/v2/league/" + leagueKey + ";out=metadata,settings,teams,standings", Method.GET);

			request.AddHeader("Authorization", "Bearer " + creds.AccessToken);
			var queryResult = client.Execute(request).Content;
			XDocument doc = XDocument.Parse(queryResult);
			string jsonText = JsonConvert.SerializeXNode(doc);

			var dynamicResult = JsonConvert.DeserializeObject<dynamic>(jsonText);
			if (dynamicResult.fantasy_content == null)
				return null;

			dynamicResult = dynamicResult.fantasy_content;
			
			var standings = ((IEnumerable)dynamicResult.league.standings.teams.team).Cast<dynamic>();

			var finalSettings = new EspnLeagueSettings();
			finalSettings.LeagueName = dynamicResult.league.name;
			finalSettings.Divisions = new List<EspnDivision>();
			finalSettings.PlayoffTeams = dynamicResult.league.settings.num_playoff_teams;
			finalSettings.RegularSeasonWeeks = Convert.ToInt32(dynamicResult.league.settings.playoff_start_week.Value) - Convert.ToInt32(dynamicResult.league.start_week.Value);
			
			//Create teams and remaining schedule
			var remainingSchedule = new List<EspnWeek>();
			var completedSchedule = new List<EspnWeek>();

			if (dynamicResult.league.settings.divisions == null)
			{
				finalSettings.Divisions.Add(new EspnDivision { Name = finalSettings.LeagueName, ID = 1, Teams = new List<EspnTeam>() });
			}
			else
			{
				foreach (var division in dynamicResult.league.settings.divisions.division)
				{
					finalSettings.Divisions.Add(new EspnDivision { Name = division.name, ID = division.division_id, Teams = new List<EspnTeam>() });
				}
			}

			request = new RestRequest("/fantasy/v2/league/" + leagueKey + "/teams;out=metadata,matchups", Method.GET);

			request.AddHeader("Authorization", "Bearer " + creds.AccessToken);
			queryResult = client.Execute(request).Content;

			doc = XDocument.Parse(queryResult);
			jsonText = JsonConvert.SerializeXNode(doc);

			var teams = JsonConvert.DeserializeObject<dynamic>(jsonText);
			teams = teams.fantasy_content.league;

			//Loop through teams and call for each and get metadata and matchups
			foreach (var dynamicTeam in teams.teams.team)
			{
				var espnTeam = new EspnTeam();
				var teamDivisionId = dynamicTeam.division_id == null ? 1 : Convert.ToInt32(dynamicTeam.division_id?.Value);
				var division = finalSettings.Divisions.First(_ => _.ID == teamDivisionId);

				espnTeam.Division = division.Name;
				division.Teams.Add(espnTeam);

				var teamStandings = standings.FirstOrDefault(_ => _.team_key == dynamicTeam.team_key);


				
				espnTeam.TeamName = dynamicTeam.name;
				espnTeam.Wins = teamStandings.team_standings.outcome_totals.wins;
				espnTeam.Losses = teamStandings.team_standings.outcome_totals.losses;
				espnTeam.Ties = teamStandings.team_standings.outcome_totals.ties;
				espnTeam.DivisionWins = (teamStandings.team_standings.division_outcome_totals?.wins ?? teamStandings.team_standings.outcome_totals.wins);
				espnTeam.DivisionLosses = (teamStandings.team_standings.division_outcome_totals?.losses ?? teamStandings.team_standings.outcome_totals.losses);
				espnTeam.DivisionTies = (teamStandings.team_standings.division_outcome_totals?.ties ?? teamStandings.team_standings.outcome_totals.ties);
				espnTeam.DivisionRank = teamStandings.team_standings.rank;
				espnTeam.OverallRank = teamStandings.team_standings.rank;
				//Points against will have to be set in matchups

				foreach(var matchup in dynamicTeam.matchups.matchup)
				{
					//The week hasn't happened yet
					if(matchup.status != "postevent")
					{
						var week = Convert.ToInt32(matchup.week);

						if (!remainingSchedule.Any(_ => _.Week == week))
						{
							remainingSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>()});
						}

						var scheduledWeek = remainingSchedule.First(_ => _.Week == week);

						if (matchup.teams.team.Count != 2)
							continue;

						var awayTeam = matchup.teams.team[0];
						var homeTeam = matchup.teams.team[1];

						if (!scheduledWeek.Matchups.Any(_ => _.AwayTeamName == awayTeam.name.Value && _.HomeTeamName == homeTeam.name.Value) && !scheduledWeek.Matchups.Any(_ => _.HomeTeamName == awayTeam.name.Value && _.AwayTeamName == homeTeam.name.Value))
						{
							scheduledWeek.Matchups.Add(new EspnMatchupItem
							{
								AwayTeamName = awayTeam.name,
								HomeTeamName = homeTeam.name,
								NoWinnerSelected = true,
								AwayTeamWon = false,
								HomeTeamWon = false
							});
						}
					}
					else //The week is completed
					{
						var week = Convert.ToInt32(matchup.week);

						//Check if the schedule knows about this week yet, if not add it
						if (!completedSchedule.Any(_ => _.Week == week))
						{
							completedSchedule.Add(new EspnWeek { Week = week, Matchups = new List<EspnMatchupItem>() });
						}

						var scheduledWeek = completedSchedule.First(_ => _.Week == week);

						if (matchup.teams.team.Count != 2)
							continue;

						var awayTeam = matchup.teams.team[0];
						var homeTeam = matchup.teams.team[1];

						//Add the score for the game to the current team
						if(awayTeam.name == dynamicTeam.name)
						{
							espnTeam.PointsFor += Convert.ToDecimal(awayTeam.team_points.total.Value);
							espnTeam.PointsAgainst += Convert.ToDecimal(homeTeam.team_points.total.Value);
						}
						else
						{
							espnTeam.PointsFor += Convert.ToDecimal(homeTeam.team_points.total.Value);
							espnTeam.PointsAgainst += Convert.ToDecimal(awayTeam.team_points.total.Value);
						}


						//Check if the week knows about this matchup already, if not add it
						if (!scheduledWeek.Matchups.Any(_ => _.AwayTeamName == awayTeam.name.Value && _.HomeTeamName == homeTeam.name.Value) && !scheduledWeek.Matchups.Any(_ => _.HomeTeamName == awayTeam.name.Value && _.AwayTeamName == homeTeam.name.Value))
						{
							scheduledWeek.Matchups.Add(new EspnMatchupItem
							{
								AwayTeamName = awayTeam.name,
								AwayTeamScore = Convert.ToDouble(awayTeam.team_points.total.Value),
								HomeTeamName = homeTeam.name,
								HomeTeamScore = Convert.ToDouble(homeTeam.team_points.total.Value),
								NoWinnerSelected = false,
								AwayTeamWon = matchup.winner_team_key == awayTeam.team_key,
								HomeTeamWon = matchup.winner_team_key == homeTeam.team_key,
								Tie = matchup.is_tied == "0"
							});
						}
					}
				}
			}
			return new EspnLeague { LeagueSettings = finalSettings, RemainingSchedule = remainingSchedule, CompletedSchedule = completedSchedule, Site = "yahoo" };
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

		private static int GetYahooYear()
		{
			var currentDateTime = DateTime.Today;

			//If it is the second half of the year return this year
			//Otherwise it is early in the next year and espn uses the start of the season as the seasonID
			if (currentDateTime.Month > 6)
				return currentDateTime.Year;

			return currentDateTime.Year - 1;
		}
	}
}