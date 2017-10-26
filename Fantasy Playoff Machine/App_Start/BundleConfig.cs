using System.Web;
using System.Web.Optimization;

namespace Fantasy_Playoff_Machine
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/FFHub.css").Include("~/Content/site.css"));

            bundles.Add(new ScriptBundle("~/bundles/jquery")
                    .Include("~/Scripts/bootstrap.js")
                );

            bundles.Add(new ScriptBundle("~/bundles/scripts")
                .IncludeDirectory("~/Scripts/", "app.js")
                .IncludeDirectory("~/Scripts/Controllers", "*.js")
                //.IncludeDirectory("~/Scripts/Directives", "*.js", true)
                .IncludeDirectory("~/Scripts/Services", "*.js"));
            BundleTable.EnableOptimizations = false;
        }
    }
}
