/**
 * Created by modun on 15/6/24.
 */

var mongoose = require('mongoose');
var express = require('express');
var _ = require('underscore');
var extend = require('util')._extend;

var auth = require('../../middlewares/authorization');
var utils = require('../../config/utils');
var consts = require('../../config/consts');

var Error = mongoose.model('Error');

var router = express.Router();
module.exports = router;


router.get('/create', function(req, res){
  res.render('errors/create');
});

router.post('/create', function(req, res){
  var error = new Error(req.body);
  error.save().then(function(){
    //res.json({code:200, data:null});
    res.redirect('/errors/create');
  }, function(e){
    res.json({code:500, data:e.message});
  });
});

router.all('*', auth.requiresLogin, auth.requiresUserRight.bind(auth, consts.UserRoles.Errors));

router.get('/', function(req, res){
  res.render('errors/index');
});

router.get('/list', function(req, res, next){
  Error.find({}).sort({createdAt:-1}).limit(50).then(function(docs){
    res.render('errors/list', {clientErrors:docs});
  }, function(e){
    next(e);
  });

});