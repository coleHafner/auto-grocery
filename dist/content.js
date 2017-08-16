console.log('in CONTENT.JS');

$(function() {
    var chromeExtensionId = 'cefkioilmpggmhflfcdcfbcocdddhgph',
        url = window.location.href,
        recipeFound = false,
        SRC_BLUEAPRON = 'blueapron',
        recipe = {
            src: '',
            url: '',
            title: '',
            ingredients: []
        },
        addIngredient = function(recipe, name, qty, qtyUnit) {
            var ingredient = {
                qtyUnit: qtyUnit,
                name: name,
                qty: qty
            };

            recipe.ingredients.push(ingredient);
            return ingredient;
        },
        cleanText = function(text) {
            return text ? text.replace(/(\r\n|\n|\r)/gm, ' ').trim().replace('  ', ' ') : '';
        };

    recipe.url = url;

    if (/blueapron.com\/recipes\/.+$/.test(url) === true) {
        recipe.src = SRC_BLUEAPRON;
        recipeFound = true;

        // set title
        recipe.title = cleanText($('.ba-recipe-title__main').text());

        // set ingredients
        $('.ba-info-list--stacked li').each(function() {
            var div = $(this).find('div.non-story'),
                name;

            //qty and unit
            var qtyStr = cleanText($(this).find('span').text()),
                split = qtyStr.split(' '),
                qtyUnit = split[1],
                qty = split[0];

            // ingredient name
            if(div.length) {
                name = cleanText(div.text()).replace(qty, '').replace(qtyUnit, '').trim();
            }else {
                name = $(this).find('a').attr('data-ingredient');
            }

            addIngredient(recipe, name, qty, qtyUnit);
        });
    }

    console.log('recipe', recipe);

    // send message to popup
    var payload = {
        [APP_STORAGE_KEY]: {
            recipeFound: recipeFound,
            recipe: recipe
        }
    };

    console.log('PAYLOAD', payload);

    // save recipe to local storage
    window.chrome.storage.local.set(payload, function() {
        console.log('RECIPE SAVED', payload);
    });

});