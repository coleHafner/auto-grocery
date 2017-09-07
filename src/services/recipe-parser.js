'use strict';

export default {
    formatCardName(ingr, omitQty = false, delim = '-') {
        let qtyStr = ingr.qtyUnit ? `${ingr.qty} ${ingr.qtyUnit}` : ingr.qty;
        return omitQty === true
            ? `${ingr.name} ${delim}`
            : `${ingr.name} ${delim} ${qtyStr}`
    },
    getTotalQty(qty, curQty) {
        let ingrQtyCopy = qty;

        if (qty.indexOf('/') > -1) {
            let qtySplit = qty.split('/'),
                numerator = parseInt(qtySplit[0]),
                denominator = parseInt(qtySplit[1]);

            ingrQtyCopy = numerator/denominator;
        }else {
            // add up quantity
            for (var i = 0, len = qty.length; i < len; ++i) {
                let char = qty.charAt(i),
                    charCode = qty.charCodeAt(i),
                    foundFraction = [188, 189, 190, 8539].indexOf(charCode) > -1;

                if (foundFraction) {
                    if (charCode === 8539) {
                        curQty += .125;

                    } else if (charCode === 188) {
                        curQty += .25;

                    } else if (charCode === 189) {
                        curQty += .5;

                    } else if (charCode === 190) {
                        curQty += .75;
                    }
                    ingrQtyCopy = ingrQtyCopy.replace(char, '');
                }
            }
        }

        curQty += Number(ingrQtyCopy);
        return curQty;
    }
}
