using Newtonsoft.Json;
using RestSharp;
using System.Web.Mvc;
using Fantasy_Playoff_Machine.Models;
using Fantasy_Playoff_Machine.Logic;
using System.Xml.Linq;

namespace Fantasy_Playoff_Machine.Controllers
{
	[RequireHttps]
	public class HomeController : Controller
	{
		public ActionResult Index(string userID, string site)
		{
			if (string.IsNullOrEmpty(userID) || string.IsNullOrEmpty(site) || site != "yahoo")
				return View();

			ViewBag.YahooUserGuid = userID;
			return View();
		}

		public ActionResult About()
		{
			ViewBag.Message = "Your application description page.";

			return View();
		}

		public ActionResult Demo()
		{
			return View();
		}

		public ActionResult Multicast()
		{
			return View();
		}

		public ActionResult PlayoffMachine(string site, int leagueId, string userId)
		{
			if (site.ToLowerInvariant().Equals("yahoo"))
			{
				var creds = DatabaseLogic.GetYahooCredentials(userId);
				if (creds.IsExpired)
					creds = AuthController.GetAccessTokenFromRefreshToken(creds);

				return View(YahooLeagueLogic.CreateLeagueObject(leagueId, creds));
			}
			else if (site.ToLowerInvariant().Equals("sleeper"))
			{
				return View(SleeperLeagueLogic.CreateLeagueObject(leagueId));
			}

			// If not yahoo then assume espn
			return View(GetLeagueData(ExecuteESPNRequest(leagueId)));
		}

		[HttpPost]
		public ActionResult PlayoffMachine(string data)
		{
			//This can only be ESPN Leagues
			return View(GetLeagueData(data));
		}

		public ActionResult PlayoffOdds(string site, int leagueId, string userId)
		{
			if (site.ToLowerInvariant().Equals("yahoo"))
			{
				var creds = DatabaseLogic.GetYahooCredentials(userId);
				if (creds.IsExpired)
					creds = AuthController.GetAccessTokenFromRefreshToken(creds);

				return View(YahooLeagueLogic.CreateLeagueObject(leagueId, creds));
			}
			else if (site.ToLowerInvariant().Equals("sleeper"))
			{
				return View(SleeperLeagueLogic.CreateLeagueObject(leagueId));
			}

			// If not yahoo then assume espn
			return View(GetLeagueData(ExecuteESPNRequest(leagueId)));
		}

		[HttpPost]
		public ActionResult PlayoffOdds(string data)
		{
			//This can only be ESPN Leagues
			return View(GetLeagueData(data));
		}

		public ActionResult PowerRankings(string site, int leagueId, string userId)
		{
			if (site.ToLowerInvariant().Equals("yahoo"))
			{
				var creds = DatabaseLogic.GetYahooCredentials(userId);
				if (creds.IsExpired)
					creds = AuthController.GetAccessTokenFromRefreshToken(creds);

				return View(YahooLeagueLogic.CreateLeagueObject(leagueId, creds));
			}
			else if (site.ToLowerInvariant().Equals("sleeper"))
			{
				return View(SleeperLeagueLogic.CreateLeagueObject(leagueId));
			}
			
			// If not yahoo then assume espn
			return View(GetLeagueData(ExecuteESPNRequest(leagueId)));
		}

		[HttpPost]
		public ActionResult PowerRankings(string data)
		{
			//This can only be ESPN Leagues
			return View(GetLeagueData(data));
		}
		
		public ActionResult VerifyLeagueExists(string site, int leagueId, string userId)
		{
			if (site.ToLowerInvariant().Equals("yahoo"))
			{
				var queryResult = ExecuteYahooRequest(leagueId, userId);
				XDocument doc = XDocument.Parse(queryResult);
				string jsonText = JsonConvert.SerializeXNode(doc);

				var dynamicResult = JsonConvert.DeserializeObject<dynamic>(jsonText);
				if (dynamicResult.fantasy_content != null)
					return Json(true, JsonRequestBehavior.AllowGet);

			}
			else if (site.ToLowerInvariant().Equals("espn"))
			{
				var result = ExecuteESPNRequest(leagueId);
				var dynamicResult = JsonConvert.DeserializeObject<dynamic>(result);
				if (dynamicResult.id != null)
					return Json(true, JsonRequestBehavior.AllowGet);
			}
			else if(site.ToLowerInvariant().Equals("sleeper"))
			{
				var result = SleeperLeagueLogic.GetSleeperEndpoint(leagueId);
				if (result.total_rosters != null)
				{
					return Json(true, JsonRequestBehavior.AllowGet);
				}
			}

			return Json(false, JsonRequestBehavior.AllowGet);
		}

		private string ExecuteYahooRequest(int leagueId, string userId)
		{
			//Get access token and refresh token from DB
			var creds = DatabaseLogic.GetYahooCredentials(userId);
			if (creds.IsExpired)
				creds = AuthController.GetAccessTokenFromRefreshToken(creds);

			var leagueKey = YahooLeagueLogic.GetYahooLeagueKey(leagueId, creds);
			var client = new RestClient("https://fantasysports.yahooapis.com");
			var request = new RestRequest("/fantasy/v2/league/" + leagueKey, Method.GET);
			request.AddHeader("Authorization", "Bearer " + creds.AccessToken);

			var result = client.Execute(request).Content;
			return result;
		}

		private string ExecuteESPNRequest(int leagueId)
		{
			var client = new RestClient("http://fantasy.espn.com/");
			var request = new RestRequest("apis/v3/games/ffl/seasons/" + EspnLeagueLogic.GetEspnSeasonId() + "/segments/0/leagues/" + leagueId, Method.GET);
			request.AddParameter("view", "mMatchupScore");
			request.AddParameter("view", "mTeam");
			request.AddParameter("view", "mSettings");

			var zz = client.BuildUri(request);
			var result = client.Execute(request).Content;
			
			return result;
		}

		public EspnLeague GetLeagueData(string queryResult)
		{
			var result = JsonConvert.DeserializeObject<dynamic>(queryResult);

			var league = EspnLeagueLogic.CreateLeagueObject(result);
			return league;
		}

		[HttpGet]
		public ActionResult Test()
		{
			return View();
		}


		[HttpGet]
		public ActionResult TestLeague(int leagueId, string s2, string swid)
		{
			var result = ExecuteESPNRequest(leagueId, s2, swid);
			var dynamicResult = JsonConvert.DeserializeObject<dynamic>(result);
			if (dynamicResult.id == null)
				return Json("FAILED", JsonRequestBehavior.AllowGet);

			var league = GetLeagueData(result);
			return Json(league.LeagueSettings.LeagueName, JsonRequestBehavior.AllowGet);
		}

		private string ExecuteESPNRequest(int leagueId, string s2, string swid)
		{
			var client = new RestClient("http://fantasy.espn.com/");
			var request = new RestRequest("apis/v3/games/ffl/seasons/" + EspnLeagueLogic.GetEspnSeasonId() + "/segments/0/leagues/" + leagueId, Method.GET);
			request.AddParameter("view", "mMatchupScore");
			request.AddParameter("view", "mTeam");
			request.AddParameter("view", "mSettings");
			request.AddParameter("espn_s2", s2, ParameterType.Cookie);
			request.AddParameter("SWID", swid, ParameterType.Cookie);

			var zz = client.BuildUri(request);
			var result = client.Execute(request).Content;

			return result;
		}
	}
}