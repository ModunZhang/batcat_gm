/**
 * Created by modun on 15/6/24.
 */

var _ = require('underscore');
var mongoose = require('mongoose');

var consts = require('../config/consts');

var User = mongoose.model('User');

exports.requiresLogin = function(req, res, next){
  if(req.isAuthenticated()) return next();
  if(req.method == 'GET') req.session.returnTo = req.originalUrl;
  res.redirect('/user/login')
};

exports.requiresNotLogin = function(req, res, next){
  if(req.isUnauthenticated()) return next();
  res.sendStatus(403);
};

exports.requiresUserRights = function(rights, req, res, next){
  if(req.isUnauthenticated()) return res.sendStatus(403);
  for(var i = 0; i < rights.length; i++){
    var right = rights[i];
    if(req.user.rights[0] !== consts.UserRights.Admin && !_.contains(req.user.rights, right)) return res.sendStatus(403);
  }
  next();
};

exports.requireEmptyUsers = function(req, res, next){
  User.count({}, function(e, count){
    if(!!e) next(e);
    else if(count == 0)next();
    else res.sendStatus(403);
  })
};