'use strict';

const recipeParser = require('../src/services/recipe-parser');
const chai = require('chai');

let should = chai.should(),
    expect = chai.expect,
    assert = chai.assert;

describe('Recipe Parser', () => {
    it ('getTotalQty - it should detect and convert multi-character fractions', () => {
        let cases = [
            ['1/4', .25]
        ];

        cases.forEach(curCase => {
            let actual = recipeParser.getTotalQty(curCase[0]);
            assert.equal(actual, curCase[1])
        });
        
    });
});