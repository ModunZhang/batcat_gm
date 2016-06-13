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

var ClientError = mongoose.model('Error');

var router = express.Router();
module.exports = router;


router.get('/create', function(req, res){
  res.json({token:res.locals.csrf_token})
});

router.post('/create', function(req, res){
  var clientError = new ClientError(req.body);
  clientError.save().then(function(){
    res.json({code:200, data:null});
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
  var keyword = req.query.keyword;
  var query = {
    skip:skip,
    limit:20,
    keyword:keyword
  };
  var sql = {};
  if(!!keyword){
    sql['stack'] = {$regex:keyword, $options:"i"};
  }

  ClientError.count(sql).then(function(count){
    query.totalCount = count;
    return ClientError.find(sql, {}, {
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

router.delete('/list', function(req, res, next){
  var keyword = req.query.keyword;
  if(!keyword){
    var e = new Error('keyword 不能为空');
    return next(e);
  }

  var sql = {
    stack:{$regex:keyword, $options:"i"}
  };
  ClientError.remove(sql).then(function(){
    res.redirect('/errors/list');
  }).catch(function(e){
    next(e);
  })
});