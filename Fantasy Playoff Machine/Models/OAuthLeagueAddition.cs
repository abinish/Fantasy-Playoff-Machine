namespace Fantasy_Playoff_Machine.Models
{
	public class OAuthLeagueAddition
	{
		public int LeagueID { get; set; }

		public string LeagueName { get; set; }

		public bool WasSuccessful { get; set; }

		public string UserGuid { get; set; }

		public string Site { get; set; }
	}
}