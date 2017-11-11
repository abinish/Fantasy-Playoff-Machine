using Amazon;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Fantasy_Playoff_Machine.Models;
using System.Configuration;

namespace Fantasy_Playoff_Machine.Logic
{
	public static class DatabaseLogic
	{
		public static YahooCredentials GetYahooCredentials(string userID)
		{
			var client = new AmazonDynamoDBClient(ConfigurationManager.AppSettings["awsAccessKeyID"], ConfigurationManager.AppSettings["awsSecretAccessKey"], RegionEndpoint.USEast1);
			
			var context = new DynamoDBContext(client);
			return context.Load<YahooCredentials>(userID);
		}

		public static void SaveYahooCredentials(YahooCredentials credentials)
		{
			var client = new AmazonDynamoDBClient(ConfigurationManager.AppSettings["awsAccessKeyID"], ConfigurationManager.AppSettings["awsSecretAccessKey"], RegionEndpoint.USEast1);
			var context = new DynamoDBContext(client);
			context.Save(credentials);
		}

	}
}