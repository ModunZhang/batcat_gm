/**
 * Created by modun on 15/8/18.
 */

var express = require('express');
var _ = require('underscore');
var mongoose = require('mongoose');
var Promise = require('bluebird');

var auth = require('../../middlewares/authorization');
var consts = require('../../config/consts');
var utils = require('../../config/utils');

var Game = mongoose.model('Game');
var Log = mongoose.model('Log');

var router = express.Router();
module.exports = router;

router.all('*', auth.requiresLogin, auth.requiresUserRight.bind(auth, consts.UserRoles.Manager), auth.requireDefaultGameSelected);

router.get('/', function(req, res){
  res.render('manager/index');
});

router.all('*', function(req, res, next){
  Game.findById(req.user.defaultGame).then(function(game){
    if(!game) return next(new Error('游戏不存在'));
    req.game = game;
    next();
  }, function(e){
    next(e);
  })
});

router.get('/games/get-server-info', function(req, res, next){
  var game = req.game;
  utils.get(game.ip, game.port, 'get-servers-info', {}, function(e, data){
    if(!!e) return next(e);
    var serverNames = _.sortBy(_.keys(data), function(serverName){
      return serverName;
    });
    var servers = [];
    _.each(serverNames, function(serverName){
      var server = data[serverName];
      server.name = serverName;
      servers.push(server);
    });
    res.render('manager/games/get-server-info', {game:game, servers:servers});
  });
});

router.param('cacheServerId', function(req, res, next, cacheServerId){
  var game = req.game;
  if(!_.contains(game.servers, cacheServerId)) return next(new Error('服务器不存在'));
  next();
});

router.get('/revenue', function(req, res){
  res.render('manager/revenue/server-list');
});

router.get('/revenue/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  var playerId = req.query.playerId;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-revenue-data', {
    serverId:cacheServerId,
    playerId:playerId,
    dateFrom:dateFrom,
    dateTo:dateTo,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('manager/revenue/revenue-list', {data:data});
  });
});

router.get('/analyse', function(req, res){
  res.render('manager/analyse/server-list');
});

router.get('/analyse/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-analyse-data', {
    serverId:cacheServerId,
    dateFrom:dateFrom,
    dateTo:dateTo,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('manager/analyse/analyse-list', {data:data});
  });
});

router.get('/logs', function(req, res, next){
  var game = req.game;
  var skip = parseInt(req.query.skip);
  if(!_.isNumber(skip) || skip % 1 !== 0){
    skip = 0;
  }
  var userEmail = !!req.query.userEmail ? req.query.userEmail : null;
  var limit = 15;
  var result = {};
  result.query = {
    userEmail:userEmail,
    skip:skip,
    limit:limit
  };
  var sql = {
    userEmail:!!userEmail ? userEmail : {$exists:true},
    game:game._id
  };
  Promise.fromCallback(function(callback){
    Log.count(sql, callback);
  }).then(function(count){
    result.totalCount = count;
    return Promise.fromCallback(function(callback){
      Log.find(sql, null, {
        skip:skip,
        limit:limit,
        sort:{createdAt:-1}
      }, callback)
    });
  }).then(function(datas){
    result.datas = datas;
    res.render('manager/logs', {data:result});
  }).catch(function(e){
    next(e);
  })
});