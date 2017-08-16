'use strict';

const webpack = require('webpack');
const path = require('path');

module.exports = {
	entry: {
		popup: './src/pages/popup/popup.js'
	},
	output: {
		path: path.resolve(__dirname, 'dist', 'bundles'),
		filename: '[name].js'
	},
	resolve: {
		alias: {
			'services': path.resolve(__dirname, 'src', 'services'),
			'configs': path.resolve(__dirname, 'src', 'configs')
		}
	},
	rules: [{
		test: /\.vue$/,
		loader: 'vue-loader',
		options: {
			js: 'babel-loader'
		}
	}]
};
