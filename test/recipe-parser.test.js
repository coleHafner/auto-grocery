'use strict';

const recipeParser = require('../src/services/recipe-parser');
const chai = require('chai');

let should = chai.should(),
    expect = chai.expect,
    assert = chai.assert;

describe('Recipe Parser', () => {
    it ('getTotalQty - it should detect and convert multi-character fractions', () => {
        let cases = [
            ['1/4', .25],
            ['1 1/4', 1.25]
        ];

        cases.forEach(curCase => {
            let actual = recipeParser.default.getTotalQty(curCase[0]);
            assert.equal(actual, curCase[1])
        });
    });

    it ('getTotalQty - it should detect and convert unicode fractions', () => {
        let cases = [
            ['¼', .25],
            ['½', .5],
            ['⅓', .33],
            ['⅔', .66],
            ['¼', .25],
            ['¾', .75],
            // ['⅕', .2],
            // ['⅖', .4],
            // ['⅗', .6],
            // ['⅘', .8],
            // ['⅙', .125],
            // ['⅚', .5],
            // ['⅐', .5],
            // ['⅛', .5],
            // ['⅜', .5],
            // ['⅝', .5],
            // ['⅞', .5],
            // ['⅑', .5],
            // ['⅒', .5]
        ];

        cases.forEach(curCase => {
            let actual = recipeParser.default.getTotalQty(curCase[0]);
            assert.equal(actual, curCase[1])
        });
    });
});