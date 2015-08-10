/**
 * Created by modun on 15/6/24.
 */

var _ = require('underscore');

var devConfig = require('./development/config');
var prodConfig = require('./production/config');


var defaults = {};

module.exports = {
  development:_.extend(devConfig, defaults),
  production:_.extend(prodConfig, defaults)
}[process.env.NODE_ENV || 'development'];
