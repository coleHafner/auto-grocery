// grab recipe from local storage and send to dom
window.chrome.storage.local.get(APP_STORAGE_KEY, function(results) {
    console.log('GOT RESULTS', results);
    let recipe = results[APP_STORAGE_KEY] ? results[APP_STORAGE_KEY].recipe : null;
    init(recipe);
});

function init(recipe) {
    new Vue({
        el: '#popup',
        data() {
            return {
                recipe: null,
                modal: {
                    pickBoard: false,
                    show: false,
                    title: ''
                },
                form: {
                    status: '',
                    message: ''
                },
                selected: {
                    board: '',
                    setBoardAsDefault: false
                }
            };
        },
        created() {
            // set recipe
            this.recipe = recipe;

            if (!this.recipe) {
                this.form.status = 'error';
                this.form.message = 'Could not find recipe';
            }

            // set trello app key
            Trello.setKey(TRELLO_APP_KEY);

            // authorize with Trello if we already have a token
            let trelloToken = this.trelloToken;

            if (trelloToken) {
                window.Trello.authorize({
                    expiration: 'never',
                    scope: TRELLO_PERMS,
                    interactive: false,
                    type: 'redirect',
                    name: APP_NAME,
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
        },
        computed: {
            trelloToken() {
                return window.localStorage.trello_token;
            },
            isLoggedIn() {
                return this.trelloToken !== undefined;
            },
            shouldShowStatus() {
                return ['loading', 'error'].indexOf(this.form.status) > -1;
            },
            statusClasses() {
                return {
                    status: true,
                    loading: this.form.status === 'loading',
                    error: this.form.status === 'error'
                };
            }
        },
        methods: {
            showLoader() {
                this.form.status = 'loading';
                this.form.message = 'Loading...';
            },
            showError(err) {
                this.form.status = 'error';
                this.form.message = err;
            },
            resetStatus() {
                this.form.status = '';
                this.form.message = '';
            },
            showModal() {
                this.modal.show = true;
            },
            hideModal() {
                this.modal.show = false;
            },
            saveBoard() {
                this.showLoader();

                let promise = new Promise((resolve, reject) => {
                    resolve(this.selected.board);
                });

                if (this.selected.setBoardAsDefault) {
                    // set into local storage
                    promise = new Promise((resolve, reject) => {
                        window.chrome.storage.sync.set({
                            [APP_STORAGE_KEY]: {
                                settings: {
                                    defaultBoard: {
                                        id: this.selected.board.id, 
                                        name: this.selected.board.name
                                    }
                                }
                            }
                        }, function() {
                            resolve(this.selected.board);
                        });
                    });
                }

                return promise
                    .then(selectedBoard => {
                        this.resetStatus();
                        return this.saveRecipeToBoard(selectedBoard);
                    });
            },
            saveRecipeToBoard(selectedBoard) {
                // find first list on board
                return new Promise((resolve, reject) => { 
                    window.Trello.get(`boards/${selectedBoard.id}/lists`, {cards: 'all'}, function(listsForBoard) {
                        resolve(listsForBoard);
                    });
                })
                    .then(listsForBoard => {
                        console.log('LISTS FOR BOARD', listsForBoard);
                        // get all cards for board
                        // return new Promise((resolve, reject) => {
                        //     window.Trello.get('', {}, function(reply) {
                        //         resolve(reply);
                        //     });
                        // });
                    });
            },
            save() {
                this.showLoader();

                // get all boards
                new Promise((resolve, reject) => {
                    if (this.boards) {
                        resolve(this.boards);
                        return;
                    }

                    window.Trello.get('members/me/boards', {}, function(boards) {
                        resolve(boards);
                    });
                })
                    .then(boards => {
                        this.resetStatus();
                        this.modal.title = 'Select Board';
                        this.modal.pickBoard = true;
                        this.boards = boards;
                        this.showModal();
                        // console.log('ALL BOARDS', boards);
                        // let groceryListBoard = _.find(boards, {name: 'Grocery Lists'});
                        // console.log('groceryListBoard', groceryListBoard);
                    })
                    .catch(err => {
                        this.showError(err);
                    })


            },
            showAppSettings() {
                window.chrome.runtime.openOptionsPage();
            }
        }
    });
}