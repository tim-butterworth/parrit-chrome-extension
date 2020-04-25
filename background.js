chrome.runtime.onInstalled.addListener(function() {

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {

	chrome.declarativeContent.onPageChanged.addRules([
	    {

		conditions: [
		    new chrome.declarativeContent.PageStateMatcher({
			pageUrl: { hostEquals: 'parrit.cfapps.io', schemes: ['https'] },
		    })
		],
		actions: [ new chrome.declarativeContent.ShowPageAction() ]
	    }
	]);
    });
});
