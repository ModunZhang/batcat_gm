/**
 * Created by modun on 15/8/18.
 */

var express = require('express');
var _ = require('underscore');
var mongoose = require('mongoose');

var auth = require('../../middlewares/authorization');
var consts = require('../../config/consts');
var utils = require('../../config/utils');

var Game = mongoose.model('Game');

var router = express.Router();
module.exports = router;

router.all('*', auth.requiresLogin, auth.requiresUserRight.bind(auth, consts.UserRoles.Manager));

router.get('/', function(req, res){
  res.render('manager/index');
});

router.param('gameId', function(req, res, next, gameId){
  Game.findById(gameId).then(function(game){
    if(!game) return next(new Error('Game not exist'));
    req.game = game;
    next();
  }, function(e){
    next(e);
  })
});

router.get('/games/list', function(req, res, next){
  Game.find({}, 'name').then(function(games){
    res.render('manager/games/list', {games:games});
  }, function(e){
    next(e);
  });
});

router.get('/games/get-server-info/:gameId', function(req, res, next){
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

router.get('/revenue/list', function(req, res, next){
  Game.find({}, 'name').then(function(games){
    res.render('manager/revenue/list', {games:games});
  }, function(e){
    next(e);
  });
});

router.get('/revenue/get-revenue-data/:gameId', function(req, res, next){
  var game = req.game;
  var playerId = req.query.playerId;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-revenue-data', {
    playerId:playerId,
    dateFrom:dateFrom,
    dateTo:dateTo,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('manager/revenue/get-revenue-data', {game:game, data:data});
  });
});