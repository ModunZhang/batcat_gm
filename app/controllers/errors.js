/**
 * Created by modun on 15/6/24.
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
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
  res.json({token:res.locals.csrf_token})
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
  var skip = parseInt(req.query.skip);
  if(!_.isNumber(skip) || skip % 1 !== 0){
    skip = 0;
  }
  var query = {
    skip:skip,
    limit:50,
    totalCount:8
  };

  Error.count().then(function(count){
    query.totalCount = count;
    return Error.find({}, {}, {
      skip:query.skip,
      limit:query.limit,
      sort:{createdAt:-1}
    })
  }).then(function(docs){
    res.render('errors/list', {query:query, clientErrors:docs});
  }).catch(function(e){
    next(e);
  });
});