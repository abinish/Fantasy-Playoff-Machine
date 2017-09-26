using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fantasy_Playoff_Machine.Models
{
	public class EspnLeague
	{
		public EspnLeagueSettings LeagueSettings { get; set; }

		public List<EspnWeek> RemainingSchedule { get; set; }

		public List<EspnWeek> CompletedSchedule { get; set; }
	
	}
}