<template lang="pug">
div
    h1 Auto Grocery - Settings
    div(v-if='isLoggedIn')
        .form-group
            label Selected Board:
            span(v-if='selected.board') {{ selected.board.name }} 
            span(v-else) None selected 
            a(href='#') Change
        .form-group
            label Selected List:
            span(v-if='selected.list') {{ selected.list.name }} 
            span(v-else) None selected 
            a(href='#') Change
        button(v-on:click='logout') Logout
    div(v-if='!isLoggedIn')
        button(v-on:click='login') Login to Trello
</template>

<script>
'use strict'

import appStorage from 'services/app-storage';
import Trello from 'services/trello-client';
import config from 'configs/configs';

// set trello on the global window object
Trello();

export default {
    name: 'vue-options',
    data() {
        return {
            selected: {
                board: '',
                list: '',
                cards: ''
            }
        };
    },
    created,
    methods: {
        login,
        logout
    },
    computed: {
        trelloToken,
        isLoggedIn
    }
};

function created(settings) {
    // set token if we got it.
    if (window.location.hash.indexOf('token') > -1) {
        return new Promise((resolve, reject) => {
            let token = window.location.hash.split('token=')[1];
            window.Trello.authorize({
                expiration: 'never',
                scope: config.TRELLO_PERMS,
                interactive: false,
                type: 'redirect',
                name: config.APP_NAME,
                persist: true,
                success() {
                    window.Trello.setToken(token);
                    resolve(true);
                },
                error(err) {
                    alert(`Error logging in to window.Trello. ${err}`);
                    reject(err);
                }
            });
        })
    }

    // update settings
    appStorage.getSettings()
        .then(settings => {
            window.Trello.setKey(config.TRELLO_APP_KEY);

            // set default board
            if (settings && settings.defaultBoard && settings.defaultBoard.id) {
                this.selected.board = settings.defaultBoard;
            }

            // set default list
            if (settings && settings.defaultList && settings.defaultList.id) {
                this.selected.list = settings.defaultList;
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

// methods
function login() {
    return new Promise((resolve, reject) => {
        window.Trello.authorize({
            expiration: 'never',
            scope: config.TRELLO_PERMS,
            interactive: true,
            type: 'redirect',
            name: config.APP_NAME,
            persist: true,
            error(err) {
                alert(`Error logging in to window.Trello. ${err}`);
            },
            success(reply) {
                resolve(true);
            }
        });
    });
}

function logout() {
    window.Trello.deauthorize();
    window.location.reload();
}
</script>
