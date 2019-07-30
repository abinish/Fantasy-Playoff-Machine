using System.IO;
using System.Web.Hosting;
using Newtonsoft.Json;

namespace Fantasy_Playoff_Machine
{
	public static class ClientAssets
	{
		public static dynamic Assets;

		public static void Initialize()
		{
			Assets = JsonConvert.DeserializeObject(File.ReadAllText(HostingEnvironment.MapPath("~/build/webpack-assets.json")));
		}
	}
}