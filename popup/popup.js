'use strict';

let app = {
    recipe: null,
    settings: {
        defaultBoard: '',
        defaultList: ''
    }
};

grabRecipe()
    .then(recipe => {
        app.recipe = recipe;
        return grabSettings();
    })
    .then(settings => {
        app.settings.defaultBoard = settings && settings.defaultBoard ? settings.defaultBoard : '';
        app.settings.defaultList = settings && settings.defaultList ? settings.defaultList : '';

        new Vue({
            el: '#popup',
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
            created() {
                onCreated.apply(this, [app.recipe, app.settings]);
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
        });
    });

function grabSettings() {
    return new Promise((resolve, reject) => {
        window.chrome.storage.local.get(APP_STORAGE_KEY, function (results) {
            resolve(results[APP_STORAGE_KEY].settings);
        })
    });
}

function grabRecipe() {
    return new Promise((resolve, reject) => {
        window.chrome.storage.local.get(APP_STORAGE_KEY, function (results) {
            console.log('GOT RESULTS', results);
            let recipe = results[APP_STORAGE_KEY] ? results[APP_STORAGE_KEY].recipe : null;
            resolve(recipe);
        })
    });
}

function onCreated(recipe, settings) {
    // set default board
    if (settings && settings.defaultBoard && settings.defaultBoard.id) {
        this.selected.board = settings.defaultBoard;
    }

    // set default list
    if (settings && settings.defaultList && settings.defaultList.id) {
        this.selected.list = settings.defaultList;
    }

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
    new Promise((resolve, reject) => {
        window.chrome.storage.sync.set({
            [APP_STORAGE_KEY]: {
                settings: {
                    defaultBoard: {
                        id: this.selected.board.id,
                        name: this.selected.board.name
                    },
                    defaultList: {
                        id: this.selected.list.id,
                        name: this.selected.list.name
                    }
                }
            }
        }, function () {
            resolve(true);
        });
    })
        .then(() => {
            // get all cards for current list
            return new Promise((resolve, reject) => {
                // if we already have cards, do it
                if (this.selected.list.cards) {
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
                delim = '-',
                formatCardName = function (ingr, omitQty = false) {
                    let qtyStr = ingr.qtyUnit ? `${ingr.qty} ${ingr.qtyUnit}` : ingr.qty;
                    return omitQty === true
                        ? `${ingr.name} ${delim}`
                        : `${ingr.name} ${delim} ${qtyStr}`
                };

            this.recipe.ingredients.forEach(ingr => {
                let cardName = formatCardName({
                        qty: getTotalQty(ingr.qty, 0),
                        qtyUnit: ingr.qtyUnit,
                        name: ingr.name
                    }),
                    partialCardName = formatCardName(ingr, true),
                    matchedCard = _.find(cards, (card) => {
                        return card.name.indexOf(partialCardName) > -1;
                    });

                // match to a card
                if (matchedCard !== undefined) {
                    // @TODO blue apron recipes have fractions like 3/4, convert those to decimals for easy addition
                    let curQty = Number(matchedCard.name.split(delim)[1].trim().split(' ')[0]);

                    if (isNaN(curQty)) {
                        curQty = 0;
                    }

                    cardName = formatCardName({
                        qty: getTotalQty(ingr.qty, curQty),
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

function getTotalQty(qty, curQty) {
    let ingrQtyCopy = qty;

    // add up quantity
    for (var i = 0, len = qty.length; i < len; ++i) {
        let char = qty.charAt(i),
            charCode = qty.charCodeAt(i),
            foundFraction = [188, 189, 190].indexOf(charCode) > -1;

        if (foundFraction) {
            if (charCode === 188) {
                curQty += .25;

            } else if (charCode === 189) {
                curQty += .5;

            } else if (charCode === 190) {
                curQty += .75;
            }
            ingrQtyCopy = ingrQtyCopy.replace(char, '');
        }
    }

    curQty += Number(ingrQtyCopy);
    return curQty;
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
            // console.log('ALL BOARDS', boards);
            // let groceryListBoard = _.find(boards, {name: 'Grocery Lists'});
            // console.log('groceryListBoard', groceryListBoard);
        })
        .catch(err => {
            this.showError(err);
        });
}
