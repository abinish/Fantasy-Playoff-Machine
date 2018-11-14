using Amazon.DynamoDBv2.DataModel;
using System;

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
		public bool IsExpired => Convert.ToDateTime(Expires) < DateTime.Now;

	}
}