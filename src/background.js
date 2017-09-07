chrome.runtime.onInstalled.addListener(function () {

    // activate/deactivate the extension
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlContains: 'blueapron.com/recipe' }
                    })
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            },  
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlContains: 'allrecipes.com/recipe' }
                    })
                ],
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