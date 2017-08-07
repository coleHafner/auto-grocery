// grab recipe from local storage and send to dom
window.chrome.storage.local.get(APP_STORAGE_KEY, function(results) {
    console.log('GOT RESULTS', results);
    init(results[APP_STORAGE_KEY].recipe);
});

function init(recipe) {
    new Vue({
        el: '#app',
        data() {
            return {
                recipe: null
            };
        },
        created() {
            // set recipe
            this.recipe = recipe;

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
            }
        },
        methods: {
            save() {
                // get all boards
                new Promise((resolve, reject) => {
                    window.Trello.rest('GET', 'members/me/boards', {}, function(boards) {
                        resolve(boards);
                    });
                })
                    .then(boards => {
                        console.log('ALL BOARDS', boards);
                        let groceryListBoard = _.find(boards, {name: 'Grocery Lists'});
                        console.log('groceryListBoard', groceryListBoard);
                    });


            },
            showAppSettings() {
                window.chrome.runtime.openOptionsPage();
            }
        }
    });
}