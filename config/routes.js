/**
 * Created by modun on 15/6/27.
 */

var index = require('../app/controllers/index');
var user = require('../app/controllers/user');
var admin = require('../app/controllers/admin');
var service = require('../app/controllers/service');
var manager = require('../app/controllers/manager');

module.exports = function(app){
  app.use('/', index);
  app.use('/user', user);
  app.use('/admin', admin);
  app.use('/service', service);
  app.use('/manager', manager);
}