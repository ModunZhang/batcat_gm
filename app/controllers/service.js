/**
 * Created by modun on 15/8/18.
 */

var express = require('express');
var _ = require('underscore');
var mongoose = require('mongoose');
var http = require("http");

var auth = require('../../middlewares/authorization');
var consts = require('../../config/consts');

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

router.post('/send-global-notice', function(req, res, next){
  var games = req.games;
  var notice = req.body;
  var gameId = notice.gameId;
  var servers = notice.servers;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game){
    return res.render('service/notice-and-mail', {
      errors:['Game not selected.'],
      games:games,
      types:consts.NoticeType,
      notice:notice
    });
  }
  if(!_.isArray(servers) || servers.length == 0){
    return res.render('service/notice-and-mail', {
      errors:['Server not selected.'],
      games:games,
      types:consts.NoticeType,
      notice:notice
    });
  }
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server)){
      return res.render('service/notice-and-mail', {
        errors:['Server not selected.'],
        games:games,
        types:consts.NoticeType,
        notice:notice
      });
    }
  }
  if(!_.contains(_.values(consts.NoticeType), notice.type)){
    return res.render('service/notice-and-mail', {
      errors:['Type not selected.'],
      games:games,
      types:consts.NoticeType,
      notice:notice
    });
  }
  if(!_.isString(notice.content) || notice.content.trim().length == 0){
    return res.render('service/notice-and-mail', {
      errors:['Content cannot be blank.'],
      games:games,
      types:consts.NoticeType,
      notice:notice
    });
  }

  var postData = JSON.stringify({
    servers:notice.servers,
    type:notice.type,
    content:notice.content
  });
  var httpOptions = {
    host:game.ip,
    port:game.port,
    path:'/send-global-notice',
    method:"post",
    headers:{
      'Content-Type':'application/json'
    }
  };

  var request = http.request(httpOptions, function(resp){
    if(resp.statusCode != 200)
      return next(new Error('Game server response status code:' + resp.statusCode));
    resp.on("data", function(data){
      var jsonObj = JSON.parse(data.toString());
      if(jsonObj.code !== 200)
        return next(new Error('Game server response error message:[' + jsonObj.code + ']' + jsonObj.data));
      req.flash('info', 'Send successfully');
      res.redirect('/service/notice-and-mail');
    })
  });
  request.on('error', function(e){
    return next(e);
  });
  request.write(postData);
  request.end();
});

router.post('/send-global-mail', function(req, res, next){
  var games = req.games;
  var mail = req.body;
  var gameId = mail.gameId;
  var servers = mail.servers;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game){
    return res.render('service/notice-and-mail', {
      errors:['Game not selected.'],
      games:games,
      mail:mail
    });
  }
  if(!_.isArray(servers) || servers.length == 0){
    return res.render('service/notice-and-mail', {
      errors:['Server not selected.'],
      games:games,
      mail:mail
    });
  }
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server)){
      return res.render('service/notice-and-mail', {
        errors:['Server not selected.'],
        games:games,
        mail:mail
      });
    }
  }
  if(!_.isString(mail.title) || mail.title.trim().length == 0){
    return res.render('service/notice-and-mail', {
      errors:['Title cannot be blank.'],
      games:games,
      mail:mail
    });
  }
  if(!_.isString(mail.content) || mail.content.trim().length == 0){
    return res.render('service/notice-and-mail', {
      errors:['Content cannot be blank.'],
      games:games,
      mail:mail
    });
  }

  var postData = JSON.stringify({
    servers:mail.servers,
    title:mail.title,
    content:mail.content
  });
  var httpOptions = {
    host:game.ip,
    port:game.port,
    path:'/send-global-mail',
    method:"post",
    headers:{
      'Content-Type':'application/json'
    }
  };

  var request = http.request(httpOptions, function(resp){
    if(resp.statusCode != 200)
      return next(new Error('Game server response status code:' + resp.statusCode));
    resp.on("data", function(data){
      var jsonObj = JSON.parse(data.toString());
      if(jsonObj.code !== 200)
        return next(new Error('Game server response error message:[' + jsonObj.code + ']' + jsonObj.data));
      req.flash('info', 'Send successfully');
      res.redirect('/service/notice-and-mail');
    })
  });
  request.on('error', function(e){
    return next(e);
  });
  request.write(postData);
  request.end();
});

router.post('/send-mail-to-players', function(req, res, next){
  var games = req.games;
  var mail = req.body;
  var gameId = mail.gameId;
  var players = _.isString(mail.players) ? mail.players.trim().split(',') : [];
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game){
    return res.render('service/notice-and-mail', {
      errors:['Game not selected.'],
      games:games,
      mail:mail
    });
  }
  if(players.length === 0){
    return res.render('service/notice-and-mail', {
      errors:['Players cannot be empty.'],
      games:games,
      mail:mail
    });
  }
  if(!_.isString(mail.title) || mail.title.trim().length == 0){
    return res.render('service/notice-and-mail', {
      errors:['Title cannot be blank.'],
      games:games,
      mail:mail
    });
  }
  if(!_.isString(mail.content) || mail.content.trim().length == 0){
    return res.render('service/notice-and-mail', {
      errors:['Content cannot be blank.'],
      games:games,
      mail:mail
    });
  }

  var postData = JSON.stringify({
    players:players,
    title:mail.title,
    content:mail.content
  });
  var httpOptions = {
    host:game.ip,
    port:game.port,
    path:'/send-mail-to-players',
    method:"post",
    headers:{
      'Content-Type':'application/json'
    }
  };

  var request = http.request(httpOptions, function(resp){
    if(resp.statusCode != 200)
      return next(new Error('Game server response status code:' + resp.statusCode));
    resp.on("data", function(data){
      var jsonObj = JSON.parse(data.toString());
      if(jsonObj.code !== 200)
        return next(new Error('Game server response error message:[' + jsonObj.code + ']' + jsonObj.data));
      req.flash('info', 'Send successfully');
      res.redirect('/service/notice-and-mail');
    })
  });
  request.on('error', function(e){
    return next(e);
  });
  request.write(postData);
  request.end();
});