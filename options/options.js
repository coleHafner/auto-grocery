new Vue({
    el: '#app',
    created() {
        window.Trello.setKey(TRELLO_APP_KEY);

        if (window.location.hash.indexOf('token') > -1) {
            let token = window.location.hash.split('token=')[1];
            window.Trello.authorize({
                expiration: 'never',
                scope: TRELLO_PERMS,
                interactive: false,
                type: 'redirect',
                name: APP_NAME,
                persist: true,
                success() {
                    console.log('TRELLO LOGIN SUCCESS');
                    window.Trello.setToken(token);
                },
                error(err) {
                    alert(`Error logging in to Trello. ${err}`);
                }
            });
        }
    },
    methods: {
        login() {
            window.Trello.authorize({
                expiration: 'never',
                scope: TRELLO_PERMS,
                interactive: true,
                type: 'redirect',
                name: APP_NAME,
                persist: true,
                error(err) {
                    alert(`Error logging in to Trello. ${err}`);
                }
            });

        },
        logout() {
            window.Trello.deauthorize();
            window.location.reload();
        }
    },
    computed: {
        trelloToken() {
            return window.localStorage.trello_token;
        },
        isLoggedIn() {
            return this.trelloToken !== undefined;
        }
    }
});