using RestSharp.Deserializers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fantasy_Playoff_Machine.Models
{
	public class EspnDivision
	{
		public string Name { get; set; }

		public int ID { get; set; }

		public List<EspnTeam> Teams { get; set; }
	}
}