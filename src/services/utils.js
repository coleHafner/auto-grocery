'use strict';

export default {
    showError(err, message = 'There was an error') {
        console.log(message, err);
        window.alert(message);
    },
    showMessage(message, target = '#message') {
        // @TODO, this should be more centralized
    }
};
