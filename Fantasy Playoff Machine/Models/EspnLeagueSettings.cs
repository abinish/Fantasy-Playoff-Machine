using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fantasy_Playoff_Machine.Models
{
	public class EspnLeagueSettings
	{
		public string LeagueName { get; set; }

		public int LeagueStatusTypeId { get; set; }

		public int RegularSeasonWeeks { get; set; }

		public int PlayoffTiebreakerID { get; set; }

		public int LeagueFormatTypeId { get; set; }

		public int RegularTiebreakerID { get; set; }

		public int TieRule { get; set; }

		public int PlayoffTeams { get; set; }

		public List<EspnDivision> Divisions { get; set; }
	}
}