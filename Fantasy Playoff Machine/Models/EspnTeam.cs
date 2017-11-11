using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fantasy_Playoff_Machine.Models
{
	public class EspnTeam
	{
		public string TeamName { get; set; }
		
		public string Division { get; set; }
		
		public int Wins { get; set; }

		public int Losses { get; set; }

		public int Ties { get; set; }

		public int DivisionWins { get; set; }

		public int DivisionLosses { get; set; }

		public int DivisionTies { get; set; }

		public decimal PointsFor { get; set; }

		public decimal PointsAgainst { get; set; }

		public int DivisionRank { get; set; }

		public int OverallRank { get; set; }

	}
}