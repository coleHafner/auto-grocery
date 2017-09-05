#!/bin/bash
echo "------------------------------"
echo "COPYING HTML/ASSETS"
echo "------------------------------"
cp src/pages/options/options.html dist/
cp src/pages/popup/popup.html dist/
cp src/manifest.json dist/
cp src/icon.png dist/
echo "done"
echo ""

echo "------------------------------"
echo "BUNDLING JS"
echo "------------------------------"
webpack --config webpack.config.js