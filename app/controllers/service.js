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

router.all('*', auth.requiresLogin, auth.requiresUserRight.bind(auth, consts.UserRoles.CustomerService), function(req, res, next){
  Game.find().then(function(games){
    games = _.filter(games, function(game){
      return _.contains(req.user.games, game._id);
    });
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
  var rewards = mail.rewards;
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
    content:mail.content,
    rewards:rewards
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
  var rewards = mail.rewards;
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
    content:mail.content,
    rewards:rewards
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
  var time = Number(req.query.time);
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game) return res.json({code:500, data:['Game not selected.']});
  if(_.isNaN(time)) return res.json({
    code:500,
    data:['Time not legal.']
  });

  utils.get(game.ip, game.port, 'get-global-chats', {time:Number(time)}, function(e, data){
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

router.get('/get-alliance-chats', function(req, res){
  var games = req.games;
  var gameId = req.query.gameId;
  var time = Number(req.query.time);
  var allianceId = req.query.allianceId;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });
  if(!game) return res.json({code:500, data:['Game not selected.']});
  if(_.isNaN(time)) return res.json({
    code:500,
    data:['Time not legal.']
  });

  utils.get(game.ip, game.port, 'get-alliance-chats', {allianceId:allianceId, time:Number(time)}, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});


router.get('/alliance/data', function(req, res){
  res.render('service/alliance/search', {action:'/service/alliance/data'})
});

router.post('/alliance/data', function(req, res){
  var gameId = req.body.gameId;
  var type = req.body.type;
  var value = req.body.value;
  var game = _.find(req.games, function(game){
    return game._id === gameId;
  });
  if(!game){
    return res.render('service/alliance/search', {
      action:'/service/alliance/data',
      errors:['Game not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }
  if(type !== 'id' && type !== 'tag'){
    return res.render('service/alliance/search', {
      action:'/service/alliance/data',
      errors:['Type not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  if(!_.isString(value) || value.trim().length == 0){
    return res.render('service/alliance/search', {
      action:'/service/alliance/data',
      errors:['Value cannot be blank.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  var url = type === 'id' ? 'alliance/find-by-id' : 'alliance/find-by-tag';
  var params = type === 'id' ? {allianceId:value} : {allianceTag:value};
  utils.get(game.ip, game.port, url, params, function(e, data){
    if(!!e){
      return res.render('service/alliance/search', {
        action:'/service/alliance/data',
        errors:[e.message],
        gameId:gameId,
        type:type,
        value:value
      });
    }
    return res.render('service/alliance/data', {
      alliance:data,
      allianceString:JSON.stringify(data)
    });
  });
});

router.get('/get-mail-reward-types', function(req, res){
  var games = req.games;
  var gameId = req.query.gameId;
  var game = _.find(games, function(game){
    return game._id === gameId;
  });

  utils.get(game.ip, game.port, 'get-mail-reward-types', null, function(e, data){
    if(!!e) return res.render('service/get-mail-reward-types', {data:{}});
    return res.render('service/get-mail-reward-types', {data:JSON.stringify(data)});
  });
});

router.get('/player/data', function(req, res){
  res.render('service/player/search', {action:'/service/player/data'})
});

router.post('/player/data', function(req, res){
  var gameId = req.body.gameId;
  var type = req.body.type;
  var value = req.body.value;
  var game = _.find(req.games, function(game){
    return game._id === gameId;
  });

  if(!game){
    return res.render('service/player/search', {
      action:'/service/player/data',
      errors:['Game not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }
  if(type !== 'id' && type !== 'name'){
    return res.render('service/player/search', {
      action:'/service/player/data',
      errors:['Type not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  if(!_.isString(value) || value.trim().length == 0){
    return res.render('service/player/search', {
      action:'/service/player/data',
      errors:['Value cannot be blank.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  var url = type === 'id' ? 'player/find-by-id' : 'player/find-by-name';
  var params = type === 'id' ? {playerId:value} : {playerName:value};
  utils.get(game.ip, game.port, url, params, function(e, data){
    if(!!e){
      return res.render('service/player/search', {
        action:'/service/player/data',
        errors:[e.message],
        gameId:gameId,
        type:type,
        value:value
      });
    }
    return res.render('service/player/data', {
      player:data,
      playerString:JSON.stringify(data)
    });
  });
});


router.get('/player/ban-and-unban', function(req, res){
  res.render('service/player/search', {action:'/service/player/ban-and-unban'})
});

router.post('/player/ban-and-unban', function(req, res){
  var gameId = req.body.gameId;
  var type = req.body.type;
  var value = req.body.value;
  var game = _.find(req.games, function(game){
    return game._id === gameId;
  });

  if(!game){
    return res.render('service/player/search', {
      action:'/service/player/ban-and-unban',
      errors:['Game not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }
  if(type !== 'id' && type !== 'name'){
    return res.render('service/player/search', {
      action:'/service/player/ban-and-unban',
      errors:['Type not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  if(!_.isString(value) || value.trim().length == 0){
    return res.render('service/player/search', {
      action:'/service/player/ban-and-unban',
      errors:['Value cannot be blank.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  var url = type === 'id' ? 'player/find-by-id' : 'player/find-by-name';
  var params = type === 'id' ? {playerId:value} : {playerName:value};
  utils.get(game.ip, game.port, url, params, function(e, data){
    if(!!e){
      return res.render('service/player/search', {
        action:'/service/player/ban-and-unban',
        errors:[e.message],
        gameId:gameId,
        type:type,
        value:value
      });
    }
    return res.render('service/player/ban-and-unban', {
      gameId:gameId,
      player:data,
      playerString:JSON.stringify(data)
    });
  });
});

router.get('/player/mute-and-unmute', function(req, res){
  res.render('service/player/search', {action:'/service/player/mute-and-unmute'})
});

router.post('/player/ban', function(req, res, next){
  var gameId = req.body.gameId;
  var game = _.find(req.games, function(game){
    return game._id === gameId;
  });
  var playerId = req.body.playerId;
  var serverId = req.body.serverId;
  var time = Number(req.body.time);

  if(!game) return next(new Error('gameId 不合法'));
  if(!_.isString(playerId) || playerId.trim().length == 0) return next(new Error('playerId 不合法'));
  if(!_.isString(serverId) || serverId.trim().length == 0) return next(new Error('serverId 不合法'));
  if(_.isNaN(time) || time < 0) return next(new Error('time 不合法'));
  time = time * 60 * 1000;

  var postData = {
    serverId:serverId,
    playerId:playerId,
    time:time
  };
  utils.post(game.ip, game.port, 'player/ban', postData, function(e){
    if(!!e) return next(e);
    req.flash('success', 'Edit successfully');
    return res.redirect('/service/player/ban-and-unban');
  });
});

router.post('/player/mute-and-unmute', function(req, res){
  var gameId = req.body.gameId;
  var type = req.body.type;
  var value = req.body.value;
  var game = _.find(req.games, function(game){
    return game._id === gameId;
  });

  if(!game){
    return res.render('service/player/search', {
      action:'/service/player/mute-and-unmute',
      errors:['Game not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }
  if(type !== 'id' && type !== 'name'){
    return res.render('service/player/search', {
      action:'/service/player/mute-and-unmute',
      errors:['Type not selected.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  if(!_.isString(value) || value.trim().length == 0){
    return res.render('service/player/search', {
      action:'/service/player/mute-and-unmute',
      errors:['Value cannot be blank.'],
      gameId:gameId,
      type:type,
      value:value
    });
  }

  var url = type === 'id' ? 'player/find-by-id' : 'player/find-by-name';
  var params = type === 'id' ? {playerId:value} : {playerName:value};
  utils.get(game.ip, game.port, url, params, function(e, data){
    if(!!e){
      return res.render('service/player/search', {
        action:'/service/player/mute-and-unmute',
        errors:[e.message],
        gameId:gameId,
        type:type,
        value:value
      });
    }
    return res.render('service/player/mute-and-unmute', {
      gameId:gameId,
      player:data,
      playerString:JSON.stringify(data)
    });
  });
});

router.post('/player/mute', function(req, res, next){
  var gameId = req.body.gameId;
  var game = _.find(req.games, function(game){
    return game._id === gameId;
  });
  var playerId = req.body.playerId;
  var serverId = req.body.serverId;
  var time = Number(req.body.time);

  if(!game) return next(new Error('gameId 不合法'));
  if(!_.isString(playerId) || playerId.trim().length == 0) return next(new Error('playerId 不合法'));
  if(!_.isString(serverId) || serverId.trim().length == 0) return next(new Error('serverId 不合法'));
  if(_.isNaN(time) || time < 0) return next(new Error('time 不合法'));
  time = time * 60 * 1000;

  var postData = {
    serverId:serverId,
    playerId:playerId,
    time:time
  };
  utils.post(game.ip, game.port, 'player/mute', postData, function(e){
    if(!!e) return next(e);
    req.flash('success', 'Edit successfully');
    return res.redirect('/service/player/mute-and-unmute');
  });
});