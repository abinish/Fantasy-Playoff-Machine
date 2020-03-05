using PdfSharp.Pdf;
using PdfSharp.Pdf.Content;
using PdfSharp.Pdf.Content.Objects;
using RestSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using Amazon.DynamoDBv2.Model;
using Ical.Net;
using Ical.Net.DataTypes;
using Ical.Net.Serialization.iCalendar.Serializers;
using Microsoft.Ajax.Utilities;
using Newtonsoft.Json;
using PdfSharp.Pdf.IO;
using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;

namespace Fantasy_Playoff_Machine.Controllers
{
	public class CurlingController : Controller
	{
		// GET: Curling
		[HttpGet]
		public ActionResult GenerateICS(string cookie, int pregameBuffer, int postgameBuffer)
		{
			var client = new RestClient("https://milwaukeecurlingclub.com");
			var request = new RestRequest("printMySchedule.php", Method.GET);
			request.AddParameter("scm_milwaukeecurlingclubcom", cookie, ParameterType.Cookie);

			var zz = client.BuildUri(request);
			var result = client.Execute(request);

			var stream = new MemoryStream(result.RawBytes);
			var x = PdfReader.Open(stream);
			var games = new List<Game>();
			foreach (var page in x.Pages)
			{
				var text = page.ExtractText();

				for (int i = 0; i < text.Count(); i++)
				{
					//Skip past each pages header
					if (i < 9 || text.ElementAt(i).IsNullOrWhiteSpace())
						continue;

					if (text.ElementAt(i).StartsWith("Printed from Milwaukee") || text.ElementAt(i).StartsWith("Legend:"))
					{
						break;
					}

					var leagueName = text.ElementAt(i++);
					var round = text.ElementAt(i++);

					//Some league names go onto second lines so it messes things up
					var counter = 0;
					while (!Int32Util.TryParse(round))
					{
						counter++;
						if(counter > 10)
							throw new InternalServerErrorException("failed to parse");
						round = text.ElementAt(i++);
					}


					var date = text.ElementAt(i++);
					var gameTime = text.ElementAt(i++);
					var flight = text.ElementAt(i++);
					var sheet = text.ElementAt(i++);
					var opponent = text.ElementAt(i);

					var startTime = DateTime.Parse(date + " " + gameTime);
					if (startTime < DateTime.Now)
						continue;

					// JK we can't do byes because it isn't consistent
					//if(opponent == "BYE")

					var endTime = startTime.AddHours(2);
					var subject = leagueName;
					var data = sheet + " vs " + opponent;

					var game = new Game
					{
						StartTime = startTime.AddHours(-pregameBuffer),
						EndTime = endTime.AddHours(postgameBuffer),
						Subject = subject,
						Data = data
					};
					games.Add(game);
				}
			}

			var calendar = new Calendar();
			foreach (var game in games)
			{
				var calendarEvent = calendar.Create<Event>();
				calendarEvent.Summary = game.Subject;
				calendarEvent.Description = game.Data;
				calendarEvent.Start = new CalDateTime(game.StartTime);
				calendarEvent.End = new CalDateTime(game.EndTime);
			}

			var serializer = new CalendarSerializer();
			var serializedCalender = serializer.SerializeToString(calendar);

			//var contentType = "text/calendar";
			//var bytes = Encoding.UTF8.GetBytes(output);

			//return File(bytes, contentType, DownloadFileName);


			var bytes = Encoding.ASCII.GetBytes(serializedCalender);

			var cd = new ContentDispositionHeaderValue("attachment")
			{
				FileNameStar = "calendar.ics"
			};
			Response.Headers.Add("Content-Disposition", cd.ToString());


			return File(bytes, "text/calendar");
		}
	}

	class Int32Util
	{
		public static bool TryParse(string value)
		{
			try
			{
				Int32.Parse(value);
				return true;
			}
			catch (FormatException)
			{
				return false;
			}

			catch (OverflowException)
			{
				return false;
			}
		}
	}
	public class Game
	{
		public DateTime StartTime { get; set; }
		public DateTime EndTime { get; set; }
		public string Subject { get; set; }
		public string Data { get; set; }

	}

	public static class PdfSharpExtensions
	{
		public static IEnumerable<string> ExtractText(this PdfPage page)
		{
			var content = ContentReader.ReadContent(page);
			var text = content.ExtractText();
			return text;
		}

		public static IEnumerable<string> ExtractText(this CObject cObject)
		{
			if (cObject is COperator)
			{
				var cOperator = cObject as COperator;
				if (cOperator.OpCode.Name == OpCodeName.Tj.ToString() ||
					cOperator.OpCode.Name == OpCodeName.TJ.ToString())
				{
					foreach (var cOperand in cOperator.Operands)
						foreach (var txt in ExtractText(cOperand))
							yield return txt;
				}
			}
			else if (cObject is CSequence)
			{
				var cSequence = cObject as CSequence;
				foreach (var element in cSequence)
					foreach (var txt in ExtractText(element))
						yield return txt;
			}
			else if (cObject is CString)
			{
				var cString = cObject as CString;
				yield return cString.Value;
			}
		}
	}
}