using Newtonsoft.Json;
using RestSharp;
using System;
using System.Web;
using System.Web.Mvc;
using Fantasy_Playoff_Machine.Models;
using System.Configuration;
using Fantasy_Playoff_Machine.Logic;

namespace Fantasy_Playoff_Machine.Controllers
{
	[RequireHttps]
	public class AuthController : Controller
	{
		public ActionResult YahooLogin()
		{
			var clientId = ConfigurationManager.AppSettings["yahooConsumerKey"];
			var hostName = ConfigurationManager.AppSettings["hostName"].ToLower();
			//var state = new OAuthState { Site = "yahoo" };
			//var serializedState = JsonConvert.SerializeObject(state);
			//var urlEncodedState = HttpUtility.UrlEncode(serializedState);
			//var urlEncodedFix = urlEncodedState.Replace("%", "!");

			var uri = "https://api.login.yahoo.com/oauth2/request_auth?client_id=" + clientId + "&response_type=code&redirect_uri=" + hostName + "/Auth/OAuthCallback";

			return Redirect(uri);
		}

		public ActionResult OAuthCallback(string code, string state)
		{
			var clientId = ConfigurationManager.AppSettings["yahooConsumerKey"];
			var secret = ConfigurationManager.AppSettings["yahooClientSecret"];
			var hostName = ConfigurationManager.AppSettings["hostName"].ToLower();

			var client = new RestClient("https://api.login.yahoo.com");
			var request = new RestRequest("/oauth2/get_token", Method.POST);
			request.AddParameter("client_id", clientId);
			request.AddParameter("client_secret", secret);
			request.AddParameter("redirect_uri", "oob");
			request.AddParameter("code", code);
			request.AddParameter("grant_type", "authorization_code");
			request.AddHeader("Authorization", "Basic " + Base64Encode(clientId + ":" + secret));
			request.JsonSerializer.ContentType = "application/x-www-form-urlencoded";

			var result = client.Execute(request).Content;
			var dynamicResult = JsonConvert.DeserializeObject<dynamic>(result);

			if (dynamicResult == null)
				return View("Index", new OAuthLeagueAddition { WasSuccessful = false });

			int secondsUntilExpiration = Convert.ToInt32(dynamicResult.expires_in.Value);

			DatabaseLogic.SaveYahooCredentials(new YahooCredentials
			{
				UserId = dynamicResult.xoauth_yahoo_guid,
				AccessToken = dynamicResult.access_token,
				RefreshToken = dynamicResult.refresh_token,
				Expires = DateTime.Now.AddSeconds(secondsUntilExpiration).ToString()
			});
			
			return Redirect(hostName + "/Home/Index?userID=" + dynamicResult.xoauth_yahoo_guid + "&site=yahoo");
		}

		public static string Base64Encode(string plainText)
		{
			var plainTextBytes = System.Text.Encoding.UTF8.GetBytes(plainText);
			return Convert.ToBase64String(plainTextBytes);
		}

		internal static YahooCredentials GetAccessTokenFromRefreshToken(YahooCredentials creds)
		{
			var clientId = ConfigurationManager.AppSettings["yahooConsumerKey"];
			var secret = ConfigurationManager.AppSettings["yahooClientSecret"];

			var client = new RestClient("https://api.login.yahoo.com");
			var request = new RestRequest("/oauth2/get_token", Method.POST);
			request.AddParameter("client_id", clientId);
			request.AddParameter("client_secret", secret);
			request.AddParameter("redirect_uri", "oob");
			request.AddParameter("refresh_token", creds.RefreshToken);
			request.AddParameter("grant_type", "refresh_token");
			request.AddHeader("Authorization", "Basic " + Base64Encode(clientId + ":" + secret));
			request.JsonSerializer.ContentType = "application/x-www-form-urlencoded";

			var result = client.Execute(request).Content;
			var dynamicResult = JsonConvert.DeserializeObject<dynamic>(result);

			if (dynamicResult == null)
				return null;

			int secondsUntilExpiration = Convert.ToInt32(dynamicResult.expires_in.Value);

			var newCreds = new YahooCredentials
			{
				UserId = creds.UserId,
				AccessToken = dynamicResult.access_token,
				RefreshToken = dynamicResult.refresh_token,
				Expires = DateTime.Now.AddSeconds(secondsUntilExpiration).ToString()
			};

			DatabaseLogic.SaveYahooCredentials(newCreds);
			return newCreds;
		}
	}
}