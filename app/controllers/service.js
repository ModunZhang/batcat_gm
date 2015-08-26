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

router.all('*', auth.requiresUserRight.bind(auth, consts.UserRoles.CustomerService), function(req, res, next){
  Game.find().then(function(games){
    req.games = games;
    next();
  }, function(e){
    next(e);
  })
});

router.get('/', function(req, res){
  res.render('service/index');
});

router.get('/notice-and-mail', function(req, res){
  res.render('service/notice-and-mail', {games:req.games, types:consts.NoticeType});
});

router.post('/send-global-notice', function(req, res){
  var games = req.games;
  var notice = req.body;
  var gameId = notice.gameId;
  var servers = notice.servers;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game) return res.json({code:500, data:['Game not selected.']});
  if(!_.isArray(servers) || servers.length == 0) return res.json({code:500, data:['Server not selected.']});
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server)) return res.json({code:500, data:['Server not selected.']});
  }
  if(!_.contains(_.values(consts.NoticeType), notice.type)) return res.json({code:500, data:['Type not selected.']});
  if(!_.isString(notice.content) || notice.content.trim().length == 0) return res.json({
    code:500,
    data:['Content cannot be blank.']
  });

  var postData = {
    servers:notice.servers,
    type:notice.type,
    content:notice.content
  };
  utils.post(game.ip, game.port, 'send-global-notice', postData, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.post('/send-global-mail', function(req, res){
  var games = req.games;
  var mail = req.body;
  var gameId = mail.gameId;
  var servers = mail.servers;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game) return res.json({code:500, data:['Game not selected.']});
  if(!_.isArray(servers) || servers.length == 0) return res.json({code:500, data:['Server not selected.']});
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server))  return res.json({code:500, data:['Server not selected.']});
  }
  if(!_.isString(mail.title) || mail.title.trim().length == 0) return res.json({
    code:500,
    data:['Title cannot be blank.']
  });
  if(!_.isString(mail.content) || mail.content.trim().length == 0) return res.json({
    code:500,
    data:['Content cannot be blank.']
  });

  var postData = {
    servers:mail.servers,
    title:mail.title,
    content:mail.content
  };
  utils.post(game.ip, game.port, 'send-global-mail', postData, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.post('/send-mail-to-players', function(req, res){
  var games = req.games;
  var mail = req.body;
  var gameId = mail.gameId;
  var players = _.isString(mail.players) ? mail.players.trim().split(',') : [];
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game) return res.json({code:500, data:['Game not selected.']});
  if(players.length === 0) return res.json({code:500, data:['Players cannot be empty.']});
  if(!_.isString(mail.title) || mail.title.trim().length == 0) return res.json({
    code:500,
    data:['Title cannot be blank.']
  });
  if(!_.isString(mail.content) || mail.content.trim().length == 0) return res.json({
    code:500,
    data:['Content cannot be blank.']
  });

  var postData = {
    players:players,
    title:mail.title,
    content:mail.content
  };
  utils.post(game.ip, game.port, 'send-mail-to-players', postData, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.get('/chat', function(req, res){
  res.render('service/chat', {games:req.games});
});

router.get('/get-global-chats', function(req, res){
  var games = req.games;
  var gameId = req.query.gameId;
  var time = req.query.time;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game) return res.json({code:500, data:['Game not selected.']});
  if(!_.isString(time) || time.trim().length == 0 || Number(time) < 0) return res.json({
    code:500,
    data:['Time cannot be blank.']
  });

  utils.get(game.ip, game.port, 'get-global-chats', {time:time}, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.post('/send-system-chat', function(req, res){
  var games = req.games;
  var chat = req.body;
  var gameId = chat.gameId;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game) return res.json({code:500, data:['Game not selected.']});

  if(!_.isString(chat.content) || chat.content.trim().length == 0) return res.json({
    code:500,
    data:['Content cannot be blank.']
  });

  var postData = {
    content:chat.content
  };
  utils.post(game.ip, game.port, 'send-system-chat', postData, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});