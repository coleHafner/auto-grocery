'use strict';

import config from 'configs/configs';

export default {
    getSettings() {
        return new Promise((resolve, reject) => {
            window.chrome.storage.sync.get(config.APP_STORAGE_KEY, function (results) {
                let settings = results[config.APP_STORAGE_KEY] ? results[config.APP_STORAGE_KEY].settings : {};
                console.log('GOT SETTINGS', settings);
                resolve(settings);
            })
        });
    },

    getRecipe() {
        return new Promise((resolve, reject) => {
            window.chrome.storage.local.get(config.APP_STORAGE_KEY, function (results) {
                let recipe = results[config.APP_STORAGE_KEY] ? results[config.APP_STORAGE_KEY].recipe : null;
                console.log('GOT RECIPE', recipe);
                resolve(recipe);
            })
        });
    },
    setRecipe(recipe) {
        let recipeFound = recipe.ingredients.length > 0;

         // send message to popup
        var payload = {
            [config.APP_STORAGE_KEY]: {
                recipeFound: recipeFound,
                recipe: recipe
            }
        };

        // save recipe to local storage
        window.chrome.storage.local.set(payload, function() {
            console.log('RECIPE SAVED', payload);
        });
    },
    updateSettings({
        boardId,
        boardName,
        listId,
        listName
    }) {
        return new Promise((resolve, reject) => {
            window.chrome.storage.sync.set({
                [config.APP_STORAGE_KEY]: {
                    settings: {
                        defaultBoard: {
                            id: boardId,
                            name: boardName
                        },
                        defaultList: {
                            id: listId,
                            name: listName
                        }
                    }
                }
            }, function () {
                resolve(true);
            });
        })
    }
}