/**
 * Created by modun on 15/6/24.
 */

var promise = require('bluebird');
var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport');
var _ = require('underscore');

var auth = require('../../middlewares/authorization');
var utils = require('../../config/utils');
var consts = require('../../config/consts');

var router = express.Router();
var User = mongoose.model('User');

router.get('/', auth.requiresUserRights.bind(auth, [consts.UserRights.Admin]), function(req, res){
  res.render('admin/index');
});

router.get('/init', auth.requireEmptyUsers, function(req, res){
  res.render('admin/init');
});

router.post('/init', auth.requireEmptyUsers, function(req, res){
  var user = new User(req.body);
  user.rights = [consts.UserRights.Admin];
  user.save().then(function(){
    res.redirect('/user/login');
  }, function(e){
    res.render('admin/init', {errors:utils.mongooseError(e), user:user.toObject()});
  });
});

router.get('/list-user', auth.requiresUserRights.bind(auth, [consts.UserRights.Admin]), function(req, res){

});

router.get('/create-user', auth.requiresUserRights.bind(auth, [consts.UserRights.Admin]), function(req, res){

});

router.post('/edit-user', auth.requiresUserRights.bind(auth, [consts.UserRights.Admin]), function(req, res){

});

router.post('/delete-user', auth.requiresUserRights.bind(auth, [consts.UserRights.Admin]), function(req, res){

});

module.exports = router;
