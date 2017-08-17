'use strict';

import popupComponent from './popup.component.vue';
import Vue from 'vue';
console.log('initializing popup MAIN');
console.log('popupComponent');
let vueConfig = {
    el: '#popup',
    components: {
        [popupComponent.name]: popupComponent
    }
};

console.log('vueConfig', vueConfig);

new Vue(vueConfig);