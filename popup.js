// chrome.runtime.onMessage.addListener(function (request, sender) {
//     console.log('LISTENER CALLBACK RUNNING...');
//     if (request.action == "recipeScanComplete") {
//         interpretRecipeScanResults(request);
//     }
// });

// function interpretRecipeScanResults(results) {
//     render(results);
// }

// grab recipe from local storage and send to dom
chrome.storage.local.get('recipeScanResults', function(results) {
    console.log('THIS IS THE RESULTS', results);
    render(results.recipeScanResults);
});

function render(results) {
    let recipe = results.recipe,
        $titleContainer = $('#title'),
        $subTitle = $('#subtitle'),
        $ingredientsList = $('#ingredients-list'),
        $saveButton = $('#save button');

    console.log('rendering...');

    if (results.recipeFound === false) {
        $titleContainer.text('No recipe was found on this page');
        return;
    }

    $titleContainer.text(recipe.title);
    $subTitle.text(`${recipe.ingredients.length} Ingredients`);

    recipe.ingredients.forEach(ingred => {
        let li = $('<li />')
            .text(`- ${ingred.qty}${ingred.qtyUnit ? ' ' + ingred.qtyUnit + ' ' : ' '}${ingred.name}`);

        $ingredientsList.append(li);
    });

    console.log('did list items...');

    $saveButton.click(function() {
        window.alert('Saving...');
    });
}