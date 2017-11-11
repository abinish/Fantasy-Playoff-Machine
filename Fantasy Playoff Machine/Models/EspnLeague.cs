using System.Collections.Generic;

namespace Fantasy_Playoff_Machine.Models
{
	public class EspnLeague
	{
		public EspnLeagueSettings LeagueSettings { get; set; }

		public List<EspnWeek> RemainingSchedule { get; set; }

		public List<EspnWeek> CompletedSchedule { get; set; }

		public string Site { get; set; }
	
	}
}