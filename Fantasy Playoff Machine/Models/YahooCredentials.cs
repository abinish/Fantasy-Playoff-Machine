using Amazon.DynamoDBv2.DataModel;

namespace Fantasy_Playoff_Machine.Models
{
	[DynamoDBTable("YahooLogins")]
	public class YahooCredentials
	{
		[DynamoDBHashKey]
		public string UserId { get; set; }
		
		public string AccessToken { get; set;}

		public string RefreshToken { get; set; }

		public string Expires { get; set; }

		[DynamoDBIgnore]
		public bool IsExpired => true;// Convert.ToDateTime(Expires) < DateTime.Now;

	}
}