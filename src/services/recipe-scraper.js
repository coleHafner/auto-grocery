console.log('in CONTENT.JS');

import $ from 'jQuery';
import appStorage from 'services/app-storage';

$(function() {
    var url = window.location.href,
        SRC_BLUEAPRON = 'blueapron',
        SRC_ALLRECIPES = 'allrecipes',
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
        },
        scrapeBlueApron = function(recipe) {
            // set src
            recipe.src = SRC_BLUEAPRON;

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
        },
        scrapeAllRecipes = function(recipe) {
            // set src
            recipe.src = SRC_ALLRECIPES;
            recipe.title = $('.recipe-summary__h1').text();
            console.log('recipe.title', recipe.title);

            let listExists = true,
                listNum = 1;

            while (listExists) {
                let listClass = `.list-ingredients-${listNum}`;
                $(`${listClass} li span.recipe-ingred_txt`).each(function(ingr) {
                    if ($(this).parent('label').attr('id') === 'btn-addtolist') {
                        return;
                    }
                    console.log('INGR', ingr);
                    let ingrText = $(this).text(),
                        ingrSplit = ingrText.split(' '),
                        qty = ingrSplit.shift(),
                        qtyUnit = ingrSplit[1].toLowerCase() === 'bunch' ? `${ingrSplit.shift()} ${ingrSplit.shift()}` : ingrSplit.shift(),
                        name = ingrSplit.join(' ');

                    addIngredient(recipe, name, qty, qtyUnit);
                });

                listNum++;

                console.log('listClass', listClass, $(listClass).length);
                if (!$(listClass).length) {
                    listExists = false;
                }
            }

            console.log('RECIPE', recipe);
        }

    recipe.url = url;

    if (/blueapron.com\/recipes\/.+$/.test(url) === true) {
        console.log('MATCHED: BlueApron');
        scrapeBlueApron(recipe);

    } else if (/allrecipes.com\/recipe\/.+$/.test(url) === true) {
        console.log('MATCHED: AllRecipes');
        scrapeAllRecipes(recipe);
    } else {
        console.log('NO MATCHES');
    }

    console.log('recipe', recipe);
    appStorage.setRecipe(recipe);
});
