angular.module("fantasyPlayoffMachine").factory("OverlayService", ["$window", function ($window) {
	return {
		show: function (message) {
			var windowHeight = Math.max($window.innerHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight);
			var windowWidth = Math.max($window.innerWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth);
			var minimumMessageWidth = 300;
			var iconWidth = 16;
			var overlay = document.getElementById("overlay");
			var overlayContent = document.getElementById("overlay-content");
			var overlayMessage = document.getElementById("overlay-message");

			if ((!overlay || !overlayMessage || !overlayContent) && $window.console) {
				$window.console.log("Must define overlay html");
				return;
			}

			overlay.style.height = windowHeight + "px";
			overlay.style.display = "block";
			overlayMessage.innerHTML = message;
			var overlayContentWidth = (windowWidth * .25 < minimumMessageWidth ? minimumMessageWidth : (windowWidth * .25)) + iconWidth;
			overlayContent.style.width = overlayContentWidth + "px";
		},

		hide: function () {
			var overlay = document.getElementById("overlay");

			if ((!overlay) && $window.console) {
				console.log("Must define overlay html");
				return;
			}

			overlay.style.display = "none";
		}
	};
}]);
