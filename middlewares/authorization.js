/**
 * Created by modun on 15/6/24.
 */

var _ = require('underscore');
var mongoose = require('mongoose');

var User = mongoose.model('User');

exports.requiresLogin = function(req, res, next){
  if(req.isAuthenticated()) return next();
  if(req.method == 'GET') req.session.returnTo = req.originalUrl;
  res.redirect('/user/login')
};

exports.requiresNotLogin = function(req, res, next){
  if(req.isUnauthenticated()) return next();
  next(new Error('Must be a guest'));
};

exports.requiresUserRight = function(right, req, res, next){
  if(req.isUnauthenticated()) return next(new Error('Login required'));
  if(_.contains(req.user.roles, right)) return next();
  next(new Error('No authority'));
};

exports.requireEmptyUsers = function(req, res, next){
  User.count().then(function(count){
    if(count == 0) next();
    else next(new Error('Already has users'));
  }, function(e){
    next(e)
  });
};

exports.requireDefaultGameSelected = function(req, res, next){
  if(req.user.defaultGame === 'none'){
    var backURL=req.header('Referer') || '/';
    req.flash('error', 'Please select a game first');
    return res.redirect(backURL);
  }
  next();
};