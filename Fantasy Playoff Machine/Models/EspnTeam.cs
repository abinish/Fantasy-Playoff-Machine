﻿using RestSharp.Deserializers;
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

		public int DivisionRank { get; set; }

		public int OverallRank { get; set; }

	}
}