using Newtonsoft.Json;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Remoting.Channels;
using System.Web;
using System.Web.Mvc;
using Fantasy_Playoff_Machine.Models;
using Newtonsoft.Json.Linq;

namespace Fantasy_Playoff_Machine.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
	        return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

		public ActionResult Multicast()
		{
			return View();
		}

		public ActionResult PlayoffMachine(int leagueId)
        {
			return View(GetLeagueData(leagueId));
        }

	    public ActionResult PowerRankings(int leagueId)
	    {
		    return View(GetLeagueData(leagueId));
	    }

	    public EspnLeague GetLeagueData(int leagueId)
	    {
			var client = new RestClient("http://games.espn.com");
		    var request = new RestRequest("ffl/api/v2/leagueSettings", Method.GET);
		    request.AddParameter("leagueId", leagueId);
		    request.AddParameter("seasonId", GetEspnSeasonId());

		    var queryResult = client.Execute(request).Content;

		    var result = JsonConvert.DeserializeObject<dynamic>(queryResult);

		    var league = CreateLeagueObject(result);
		    return league;
	    }

		public EspnLeague CreateLeagueObject(dynamic result) {
			var leagueSettings = result.leaguesettings;
			var finalSettings = new EspnLeagueSettings();

			finalSettings.LeagueName = leagueSettings.name;
			finalSettings.Divisions = new List<EspnDivision>();
			finalSettings.LeagueFormatTypeId = leagueSettings.leagueFormatTypeId;
			finalSettings.LeagueStatusTypeId = leagueSettings.leagueStatusTypeId;
			finalSettings.PlayoffTeams = leagueSettings.playoffTeamCount;
			finalSettings.PlayoffTiebreakerID = leagueSettings.playoffTieRuleRawStatId;
			finalSettings.RegularSeasonWeeks = leagueSettings.regularSeasonMatchupPeriodCount;
			finalSettings.RegularTiebreakerID = leagueSettings.playoffSeedingTieRuleRawStatId;
			finalSettings.TieRule = leagueSettings.tieRule;

			//Create divisions
			foreach (var division in leagueSettings.divisions)
				finalSettings.Divisions.Add(new EspnDivision { Name = division.name, Teams = new List<EspnTeam>() });

			//Create teams and remaining schedule
			var remainingSchedule = new List<EspnWeek>();
			var completedSchedule = new List<EspnWeek>();
			var rank = 0;

			foreach (var teamProperty in GetPropertyKeysForDynamic(leagueSettings.teams))
			{
				var team = leagueSettings.teams[teamProperty];

				var espnTeam = new EspnTeam();
				espnTeam.Division = team.division.divisionName;
				espnTeam.TeamName = team.teamLocation + " " + team.teamNickname;
				espnTeam.Wins = team.record.overallWins;
				espnTeam.Losses = team.record.overallLosses;
				espnTeam.Ties = team.record.overallTies;
				espnTeam.DivisionRank = team.divisionStanding;
				espnTeam.OverallRank = team.overallStanding;
				var division = finalSettings.Divisions.First(_ => _.Name.Equals(espnTeam.Division));
				division.Teams.Add(espnTeam);

				foreach(var matchup in team.scheduleItems)
				{
					//The week hasn't happened yet
					if (matchup.matchups[0].outcome == 0)
					{
						var week = matchup.matchupPeriodId;
						//Check if the schedule knows about this week yet, if not add it
						if (!remainingSchedule.Any(_ => _.Week == week.Value))
						{
							remainingSchedule.Add(new EspnWeek {Week = week, Matchups = new List<EspnMatchupItem>()});
						}

						var scheduledWeek = remainingSchedule.First(_ => _.Week == week.Value);

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

						var awayTeam = matchup.matchups[0].awayTeam.teamLocation + " " + matchup.matchups[0].awayTeam.teamNickname;
						var homeTeam = matchup.matchups[0].homeTeam.teamLocation + " " + matchup.matchups[0].homeTeam.teamNickname;

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
								AwayTeamWon = matchup.matchups[0].outcome == 2,
								HomeTeamWon = matchup.matchups[0].outcome == 1
							});
						}
					}
				}
			}

			return new EspnLeague { LeagueSettings = finalSettings, RemainingSchedule = remainingSchedule, CompletedSchedule = completedSchedule};
		}

		public List<string> GetPropertyKeysForDynamic(dynamic dynamicToGetPropertiesFor)
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

	    public int GetEspnSeasonId()
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