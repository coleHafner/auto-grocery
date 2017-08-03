chrome.runtime.onInstalled.addListener(function () {

    // activate/deactivate the extension
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([
            {
                // That fires when a page's URL contains a 'g' ...
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlContains: 'blueapron.com/recipe' },
                    })
                ],
                // And shows the extension's page action.
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });

    // capture button click
    chrome.pageAction.onClicked.addListener(function() {
        console.log('BUTTON WAS CLICKED');
        alert('cliiiiicked');
    });
});