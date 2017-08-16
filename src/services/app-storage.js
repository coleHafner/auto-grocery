'use strict';

import config from 'configs/configs';

export default {
    getSettings() {
        return new Promise((resolve, reject) => {
            window.chrome.storage.sync.get(config.APP_STORAGE_KEY, function (results) {
                let settings = results[config.APP_STORAGE_KEY].settings;
                console.log('GOT SETTINGS', settings);
                resolve(settings);
            })
        });
    },

    getRecipe() {
        return new Promise((resolve, reject) => {
            window.chrome.storage.local.get(config.APP_STORAGE_KEY, function (results) {
                console.log('GOT RECIPE', results);
                let recipe = results[config.APP_STORAGE_KEY] ? results[config.APP_STORAGE_KEY].recipe : null;
                resolve(recipe);
            })
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