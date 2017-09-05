<template lang="pug">
div
    a(href='#', v-on:click='showAppSettings') settings
    div(v-if='shouldShowStatus', v-bind:class='statusClasses')
        | {{ form.message }}
    div(v-if='computedRecipe')
        h1 {{ computedRecipe.title }}
        h5 {{ computedRecipe.subtitle }}
        ul
            li(v-for='ingr in computedRecipe.ingredients') {{ ingr.qty }} {{ ingr.qtyUnit }} {{ ingr.name }}
    button.trello-cta(v-if='!isLoggedIn', v-on:click='showAppSettings') Login to Trello
    button.cta(v-if='isLoggedIn', v-on:click='save') Add To Grocery List
    .modal-content(v-if='modal.show')
        .modal-inner
            h3 {{ modal.title }}
            .modal-status.error(v-if='modal.message') {{ modal.message }}
            div(v-if="modal.action === 'pickBoard'")
                select(v-model='selected.board', v-show='form.boards.length')
                    option(value='') Select board
                    option(v-for='board in form.boards' v-bind:value='board') {{ board.name }}
                br
                select(v-model='selected.list', v-show='form.lists.length')
                    option(value='') Select list
                    option(v-for='list in form.lists', v-bind:value='list') {{ list.name }}
                br
                div
                    button.cta(v-on:click='saveRecipe') Save
                    button(v-on:click='hideModal') Cancel
    .modal-overlay(v-if='modal.show')  
</template>

<script>
'use strict';

console.log('IN VUE POPUP COMPONENT FILE.');

import _ from 'lodash';
import config from 'configs/configs';
import Trello from 'services/trello-client';
import appStorage from 'services/app-storage';
import recipeParser from 'services/recipe-parser';

//set trello on global window object
Trello();

export default {
    name: 'vue-popup',
    created,
    data() {
        return {
            recipe: null,
            modal: {
                show: false,
                message: '',
                action: '',
                title: ''
            },
            form: {
                lists: [],
                boards: [],
                status: '',
                message: ''
            },
            selected: {
                list: '',
                board: '',
                cards: ''
            }
        };
    },
    watch: {
        'selected.board': function (newVal, oldVal) {
            this.showLists();
        }
    },
    computed: {
        shouldShowStatus,
        statusClasses,
        trelloToken,
        isLoggedIn,
        computedRecipe
    },
    methods: {
        showAppSettings,
        showLoader,
        showError,
        hideStatus,
        showModal,
        hideModal,
        saveRecipe,
        showLists,
        save
    }
};

function created() {
    console.log('POPUP CREATED...');
    let recipe;

    appStorage.getRecipe()
        .then(cachedRecipe => {
            recipe = cachedRecipe;
            return appStorage.getSettings();
        })
        .then(settings => {
            console.log('settings onCreated', settings);
            // set default board
            if (settings && settings.defaultBoard && settings.defaultBoard.id) {
                this.selected.board = settings.defaultBoard;
            }

            // set default list
            if (settings && settings.defaultList && settings.defaultList.id) {
                this.selected.list = settings.defaultList;
            }

            console.log('this.selected', this.selected);

            // set recipe
            this.recipe = recipe;

            if (!this.recipe) {
                this.form.status = 'error';
                this.form.message = 'Could not find recipe';
            }

            // set trello app key
            window.Trello.setKey(config.TRELLO_APP_KEY);

            // authorize with Trello if we already have a token
            let trelloToken = this.trelloToken;

            if (trelloToken) {
                window.Trello.authorize({
                    expiration: 'never',
                    scope: config.TRELLO_PERMS,
                    interactive: false,
                    type: 'redirect',
                    name: config.APP_NAME,
                    persist: true,
                    success() {
                        console.log('POPUP - TRELLO LOGIN SUCCESS');
                        console.log('TRELLO TOKEN IS', trelloToken);
                        window.Trello.setToken(trelloToken);
                    },
                    error(err) {
                        alert(`Error logging in to Trello. ${err}`);
                    }
                });
            }
        });
}

// computed
function trelloToken() {
    return window.localStorage.trello_token;
}

function isLoggedIn() {
    return this.trelloToken !== undefined;
}

function shouldShowStatus() {
    return ['loading', 'error', 'success'].indexOf(this.form.status) > -1;
}

function statusClasses() {
    return {
        success: this.form.status === 'success',
        loading: this.form.status === 'loading',
        error: this.form.status === 'error',
        status: true
    };
}

function computedRecipe() {
    return this.recipe;
}

// methods
function showLoader() {
    this.form.status = 'loading';
    this.form.message = 'Loading...';
}

function showError(err) {
    this.form.status = 'error';
    this.form.message = err;
}

function hideStatus() {
    this.form.status = '';
    this.form.message = '';
}

function showModal() {
    this.modal.show = true;
}

function hideModal() {
    this.modal.show = false;
}

function showAppSettings() {
    window.chrome.runtime.openOptionsPage();
}

function saveRecipe() {
    // validate
    // @TODO make sure this always applies to the modal
    if (!this.selected.board.id || !this.selected.list.id) {
        this.modal.message = 'You must select a board and a list.';
        return;
    }

    this.showLoader();

    let promise = new Promise((resolve, reject) => {
        resolve(this.selected.board);
    });

    // set selected board/list into app settings
    appStorage.updateSettings({
        boardId: this.selected.board.id,
        boardName: this.selected.board.name,
        listId: this.selected.list.id,
        listName: this.selected.list.name
    })
        .then(() => {
            // get all cards for current list
            return new Promise((resolve, reject) => {
                // if we already have cards, do it
                if (this.selected.list.cards && this.selected.list.cards.length) {
                    resolve(this.selected.list.cards);
                    return;
                }

                window.Trello.get(`lists/${this.selected.list.id}/cards`, {}, function (cards) {
                    resolve(cards);
                });
            });
        })
        .then(cards => {
            let promises = [],
                delim = '-';

            this.recipe.ingredients.forEach(ingr => {
                let cardName = recipeParser.formatCardName({
                    qty: recipeParser.getTotalQty(ingr.qty, 0),
                    qtyUnit: ingr.qtyUnit,
                    name: ingr.name
                }),
                    partialCardName = recipeParser.formatCardName(ingr, true),
                    matchedCard = _.find(cards, (card) => {
                        return card.name.indexOf(partialCardName) > -1;
                    });

                // match to a card
                if (matchedCard !== undefined) {
                    let curQty = Number(matchedCard.name.split(delim)[1].trim().split(' ')[0]);

                    if (isNaN(curQty)) {
                        curQty = 0;
                    }

                    cardName = recipeParser.formatCardName({
                        qty: recipeParser.getTotalQty(ingr.qty, curQty),
                        qtyUnit: ingr.qtyUnit,
                        name: ingr.name
                    });

                    matchedCard.name = cardName;

                    // update existing card with new qty
                    promises.push(
                        new Promise((resolve, reject) => {
                            window.Trello.put(`cards/${matchedCard.id}/name?value=${encodeURIComponent(cardName)}`, {}, function (updatedCard) {
                                resolve(updatedCard);
                            })
                        })
                    );

                } else {
                    // create new card
                    promises.push(
                        new Promise((resolve, reject) => {
                            window.Trello.post(`cards?idList=${this.selected.list.id}&name=${encodeURIComponent(cardName)}`, {}, function (newCard) {
                                resolve(newCard);
                            });
                        })
                    );
                }
            });

            return Promise.all(promises);
        })
        .then(() => {
            this.hideModal();
            this.form.status = 'success';
            this.form.message = 'Recipe saved successfully!';
        });
}

function showLists() {
    if (!this.selected.board) {
        this.showError('Cannot find selected board. Cannot continue.');
        return;
    }

    // if we have both a selected list and a selected board, bail
    if (this.selected.board && this.selected.list) {
        console.log('both already selected. bailing.');
        return;
    }

    // find lists for selected board
    return new Promise((resolve, reject) => {
        window.Trello.get(`boards/${this.selected.board.id}/lists`, { cards: 'all' }, function (lists) {
            resolve(lists);
        });
    })
        .then(lists => {
            this.form.lists = lists;
        });
}

function save() {
    if (this.selected.board && this.selected.list) {
        this.saveRecipe();
        return;
    }

    this.showLoader();

    // get all boards
    new Promise((resolve, reject) => {
        if (this.form.boards && this.form.boards.length) {
            resolve(this.form.boards);
            return;
        }

        window.Trello.get('members/me/boards', {}, function (boards) {
            resolve(boards);
        });
    })
        .then(boards => {
            this.hideStatus();
            this.modal.title = 'Select Board and List';
            this.modal.action = 'pickBoard';
            this.form.boards = boards;
            this.showModal();
        })
        .catch(err => {
            this.showError(err);
        });
}
</script>
