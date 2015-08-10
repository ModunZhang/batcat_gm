/**
 * Created by modun on 15/6/27.
 */

var index = require('../app/controllers/index');
var user = require('../app/controllers/user');
var admin = require('../app/controllers/admin');

module.exports = function(app){
  app.use('/', index);
  app.use('/user', user);
  app.use('/admin', admin);
}