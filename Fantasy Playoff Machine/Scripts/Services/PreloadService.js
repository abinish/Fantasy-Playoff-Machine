angular.module('fantasyPlayoffMachine').factory("PreloadService", [function () {
	return {
		// Gets data that has been preloaded from the server an embedded into the markup
		// @param preloadKey -- the key the data was stored into the view with on the server side
		// @returns the data with the specified key, undefined if the key was not set
		GetPreloadedData: function (preloadKey) {
			var result = window.__preloadedData[preloadKey];
			if (result === undefined && window.console && window.console.log)
				console.log("Could not find preload data with key:" + preloadKey);

			return result;
		}
	};
}]);
