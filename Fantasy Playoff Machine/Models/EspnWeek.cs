using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fantasy_Playoff_Machine.Models
{
	public class EspnWeek
	{
		public int Week { get; set; }

		public List<EspnMatchupItem> Matchups { get; set; }
	}
}