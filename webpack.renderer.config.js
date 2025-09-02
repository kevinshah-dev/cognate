// webpack.renderer.config.js
const rules = require('./webpack.rules');
const path = require('path');

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    { loader: 'postcss-loader' } // Add this loader
  ],
});

module.exports = {
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};