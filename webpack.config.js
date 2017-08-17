'use strict';

const webpack = require('webpack');
const path = require('path');

module.exports = {
	entry: {
		popup: './src/pages/popup/popup.main.js',
		options: './src/pages/options/options.main.js',
		'recipe-scraper': './src/services/recipe-scraper.js'
	},
	output: {
		path: path.resolve(__dirname, 'dist', 'bundles'),
		filename: '[name].bundle.js'
	},
	resolve: {
		alias: {
			'services': path.resolve(__dirname, 'src', 'services'),
			'configs': path.resolve(__dirname, 'src', 'configs'),
			'pages': path.resolve(__dirname, 'src', 'pages'),
			'libs': path.resolve(__dirname, 'src', 'libs')
		}
	},
	module: {
		rules: [{
			test: /\.vue$/,
			loader: 'vue-loader',
			options: {
				js: 'babel-loader'
			}
		}, {
			test: /\.js$/,
			loader: 'babel-loader',
			options: {
				presets: ['es2015']
			}
		}]
	}
};
