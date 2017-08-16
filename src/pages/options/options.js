grabSettings()
    .then(settings => {
        new Vue({
            el: '#options',
            data() {
                return {
                    selected: {
                        board: '',
                        list: '',
                        cards: ''
                    }
                };
            },
            created() {
                onCreated.apply(this, [settings]);
            },
            methods: {
                login,
                logout
            },
            computed: {
                trelloToken,
                isLoggedIn
            }
        });
    });

function grabSettings() {
    return new Promise((resolve, reject) => {
        window.chrome.storage.sync.get(APP_STORAGE_KEY, function (results) {
            let settings = results[APP_STORAGE_KEY].settings;
            console.log('GOT SETTINGS', settings);
            resolve(settings);
        })
    });
}

function onCreated(settings) {
    window.Trello.setKey(TRELLO_APP_KEY);

     // set default board
    if (settings && settings.defaultBoard && settings.defaultBoard.id) {
        this.selected.board = settings.defaultBoard;
    }

    // set default list
    if (settings && settings.defaultList && settings.defaultList.id) {
        this.selected.list = settings.defaultList;
    }

    if (window.location.hash.indexOf('token') > -1) {
        return new Promise((resolve, reject) => {
            let token = window.location.hash.split('token=')[1];
            window.Trello.authorize({
                expiration: 'never',
                scope: TRELLO_PERMS,
                interactive: false,
                type: 'redirect',
                name: APP_NAME,
                persist: true,
                success() {
                    window.Trello.setToken(token);
                    resolve(true);
                },
                error(err) {
                    alert(`Error logging in to Trello. ${err}`);
                    reject(err);
                }
            });
        })
    }
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
            scope: TRELLO_PERMS,
            interactive: true,
            type: 'redirect',
            name: APP_NAME,
            persist: true,
            error(err) {
                alert(`Error logging in to Trello. ${err}`);
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