using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fantasy_Playoff_Machine.Models
{
	public class EspnMatchupItem
	{
		public string AwayTeamName { get; set; }

		public double AwayTeamScore { get; set; }
		
		public string HomeTeamName { get; set; }

		public double HomeTeamScore { get; set; }

		public bool AwayTeamWon { get; set; }

		public bool HomeTeamWon { get; set; }

		public bool Tie { get; set; }

		public bool NoWinnerSelected { get; set; }
	}
}