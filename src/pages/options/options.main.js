'use strict';

import Vue from 'vue';
import optionsComponent from './options.component.vue';

new Vue({
    el: '#options',
    render: c => c(optionsComponent)
});