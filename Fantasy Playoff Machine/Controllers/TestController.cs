using System.Web.Mvc;
using Fantasy_Playoff_Machine.Logic;
using Fantasy_Playoff_Machine.Models;
using Newtonsoft.Json;
using RestSharp;

namespace Fantasy_Playoff_Machine.Controllers
{
	public class TestController : Controller
	{
		// GET
		public ActionResult Index()
		{
			return View();
		}

		// GET
		[HttpGet]
		public ActionResult Test(int leagueId, string s2, string swid)
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

		public EspnLeague GetLeagueData(string queryResult)
		{
			var result = JsonConvert.DeserializeObject<dynamic>(queryResult);

			var league = EspnLeagueLogic.CreateLeagueObject(result);
			return league;
		}
	}
}