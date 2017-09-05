<template lang="pug">
div
    h1 Auto Grocery - Settings
    div(v-if='isLoggedIn')
        .form-group
            label Selected Board:
            div(v-if="!selecting.board")
                span(v-if='selected.board') {{ selected.board.name }} 
                span(v-else) None selected 
                a(href='#' v-on:click="showBoards") Change
            div(v-if="selecting.board")
                select(v-model="selected.board")
                    option(value="") Select Board
                    option(v-for="board in form.boards" v-bind:value='board') {{ board.name }}
            
        .form-group
            label Selected List:
            div(v-if="!selecting.list")
                span(v-if='selected.list') {{ selected.list.name }} 
                span(v-else) None selected 
                a(href='#' v-on:click="showLists") Change
            div(v-if="selecting.list")
                select(v-model="selected.list")
                    option(value="") Select List
                    option(v-for="list in form.lists" v-bind:value='list') {{ list.name }}
        div(v-if="selecting.board || selecting.list" )
            button(v-on:click='saveSettings') Save
            button(v-on:click='cancel') Cancel
        a(href="#" v-on:click='logout') Logout of Trello
    div(v-if='!isLoggedIn')
        button(v-on:click='login') Login to Trello
</template>

<script>
'use strict'

import appStorage from 'services/app-storage';
import Trello from 'services/trello-client';
import config from 'configs/configs';
import utils from 'services/utils';

// set trello on the global window object
Trello();

export default {
    name: 'vue-options',
    data() {
        return {
            initialized: false,
            form: {
                boards: [],
                lists: []
            },
            selecting: {
                board: false,
                list: false,
            },
            selected: {
                board: '',
                list: ''
            }
        };
    },
    created,
    watch: {
        'selected.board': {
            deep: true,
            handler(newVal, oldVal) {
                if (!this.initialized) {
                    this.initialized = true;
                    return;
                }

                this.selected.list = '';
                this.showLists();
            }
        }
    },
    methods: {
        login,
        logout,
        cancel,
        showLists,
        showBoards,
        saveSettings
    },
    computed: {
        trelloToken,
        isLoggedIn
    }
};

function created() {
    // set token if we got it.
    let token = window.location.hash.indexOf('token') > -1
        ? window.location.hash.split('token=')[1] 
        : this.trelloToken;

    if (!token) {
        return;
    }

    return new Promise((resolve, reject) => {
        window.Trello.authorize({
            expiration: 'never',
            scope: config.TRELLO_PERMS,
            interactive: false,
            type: 'redirect',
            name: config.APP_NAME,
            persist: true,
            success() {
                // this is a fresh page load, so we have to set the app key again
                window.Trello.setKey(config.TRELLO_APP_KEY);
                window.Trello.setToken(token);
                resolve(true);
            },
            error(err) {
                utils.showError(`Error logging in to window.Trello. ${err}`);
                reject(err);
            }
        });
    })
        .then(reply => {
                // update settings
            return appStorage.getSettings();
        })
        .then(settings => {
            if (!settings || (!settings.defaultBoard || !settings.defaultList)) {
                return;
            }

            // set default board
            if (settings.defaultBoard && settings.defaultBoard.id) {
                this.selected.board = settings.defaultBoard;
            }

            // set default list
            if (settings.defaultList && settings.defaultList.id) {
                this.selected.list = settings.defaultList;
            }
        })
        .catch(err => {
            utils.showError(err, 'Could not get settings');
        });
}

// computed
function trelloToken() {
    return window.localStorage.trello_token;
}

function isLoggedIn() {
    return this.trelloToken !== undefined;
}

// methods
function login() {
    // set the app key
    window.Trello.setKey(config.TRELLO_APP_KEY);
    
    return new Promise((resolve, reject) => {
        window.Trello.authorize({
            expiration: 'never',
            scope: config.TRELLO_PERMS,
            interactive: true,
            type: 'redirect',
            name: config.APP_NAME,
            persist: true,
            error(err) {
                utils.showError(`Error logging in to window.Trello. ${err}`);
            },
            success(reply) {
                resolve(true);
            }
        });
    });
}

function logout() {
    // torch the settings
    appStorage.resetSettings()
        .then(() => {
            window.Trello.deauthorize();
            window.location.reload();
        })
        .catch(() => {
            window.Trello.deauthorize();
            window.location.reload();
        });
}

function showBoards() {
    new Promise((resolve, reject) => {
        window.Trello.get('members/me/boards', {}, function (boards) {
            resolve(boards);
        });
    })
        .then(boards => {
            this.form.boards = boards;
            this.selecting.board = true;
        });
}

function showLists() {
    if (!this.selected.board.id) {
        utils.showError('No board is selected. Cannot continue.');
        return;
    }

    new Promise((resolve, reject) => {
        window.Trello.get(`boards/${this.selected.board.id}/lists`, {}, function (lists) {
            resolve(lists);
        })
            .then(lists => {
                this.form.lists = lists;
                this.selecting.list = true;
            });
    });
}

function cancel() {
    this.selecting.board = false;
    this.selecting.list = false;
}

function saveSettings() {
    if (!this.selected.board.id || !this.selected.list.id) {
        utils.showError('You must select a board and a list.');
        return;
    }

     appStorage.updateSettings({
        boardId: this.selected.board.id,
        boardName: this.selected.board.name,
        listId: this.selected.list.id,
        listName: this.selected.list.name
    })
        .then(reply => {
            this.cancel();
        })
        .catch(err => {
            utils.showError(err, 'Error savings settings.');
            this.cancel();
        });
}
</script>
