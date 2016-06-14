/**
 * Created by modun on 15/8/18.
 */

var express = require('express');
var _ = require('underscore');
var mongoose = require('mongoose');
var P = require('bluebird');

var auth = require('../../middlewares/authorization');
var consts = require('../../config/consts');
var utils = require('../../config/utils');

var Game = mongoose.model('Game');

var router = express.Router();
module.exports = router;

router.all('*', auth.requiresLogin, auth.requiresUserRight.bind(auth, consts.UserRoles.CustomerService), auth.requireDefaultGameSelected, function(req, res, next){
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

router.all('*', function(req, res, next){
  Game.findById(req.user.defaultGame).then(function(game){
    if(!game) return next(new Error('游戏不存在'));
    req.game = game;
    next();
  }, function(e){
    next(e);
  })
});

router.get('/notice-and-mail', function(req, res){
  res.render('service/notice-and-mail', {games:req.games, types:consts.NoticeType});
});

router.post('/send-global-notice', function(req, res){
  var notice = req.body;
  var servers = notice.servers;
  var game = req.game;

  if(!_.isArray(servers) || servers.length == 0) return res.json({code:500, data:['服务器未选择']});
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server)) return res.json({code:500, data:['服务器未选择']});
  }
  if(!_.contains(_.values(consts.NoticeType), notice.type)) return res.json({code:500, data:['类型未选择.']});
  if(!_.isString(notice.content) || notice.content.trim().length == 0) return res.json({
    code:500,
    data:['内容不能为空']
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
  var mail = req.body;
  var servers = mail.servers;
  var rewards = mail.rewards;
  var game = req.game;

  if(!_.isArray(servers) || servers.length == 0) return res.json({code:500, data:['服务器未选择']});
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server))  return res.json({code:500, data:['服务器未选择']});
  }
  if(!_.isString(mail.title) || mail.title.trim().length == 0) return res.json({
    code:500,
    data:['标题不能为空']
  });
  if(!_.isString(mail.content) || mail.content.trim().length == 0) return res.json({
    code:500,
    data:['内容不能为空']
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
  var mail = req.body;
  var rewards = mail.rewards;
  var players = _.isString(mail.players) ? mail.players.trim().split(',') : [];
  var game = req.game;

  if(players.length === 0) return res.json({code:500, data:['玩家ID列表不能为空']});
  if(!_.isString(mail.title) || mail.title.trim().length == 0) return res.json({
    code:500,
    data:['标题不能为空']
  });
  if(!_.isString(mail.content) || mail.content.trim().length == 0) return res.json({
    code:500,
    data:['内容不能为空']
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
  var time = Number(req.query.time);
  var game = req.game;

  if(_.isNaN(time)) return res.json({
    code:500,
    data:['时间戳不合法']
  });

  utils.get(game.ip, game.port, 'get-global-chats', {time:Number(time)}, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.post('/send-system-chat', function(req, res){
  var chat = req.body;
  var game = req.game;

  if(!_.isString(chat.content) || chat.content.trim().length == 0) return res.json({
    code:500,
    data:['聊天内容不能为空']
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
  var time = Number(req.query.time);
  var allianceId = req.query.allianceId;
  var game = req.game;

  if(_.isNaN(time)) return res.json({
    code:500,
    data:['时间戳不合法']
  });
  if(!allianceId) return res.json({
    code:500,
    data:['联盟ID不合法']
  });

  utils.get(game.ip, game.port, 'get-alliance-chats', {allianceId:allianceId, time:Number(time)}, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.get('/get-mail-reward-types', function(req, res){
  var game = req.game;

  utils.get(game.ip, game.port, 'get-mail-reward-types', null, function(e, data){
    if(!!e) return res.render('service/get-mail-reward-types', {data:{}});
    return res.render('service/get-mail-reward-types', {data:JSON.stringify(data)});
  });
});

router.get('/alliance/search', function(req, res){
  var type = req.query.type;
  var value = req.query.value;
  var game = req.game;

  if(_.isUndefined(type) && _.isUndefined(value)){
    return res.render('service/alliance/search', {action:'/service/alliance/search'})
  }

  if(type !== 'id' && type !== 'tag'){
    return res.render('service/alliance/search', {
      action:'/service/alliance/search',
      errors:['查询类型不合法'],
      type:type,
      value:value
    });
  }

  if(!_.isString(value) || value.trim().length == 0){
    return res.render('service/alliance/search', {
      action:'/service/alliance/search',
      errors:['关键字不能为空'],
      type:type,
      value:value
    });
  }

  var url = type === 'id' ? 'alliance/find-by-id' : 'alliance/find-by-tag';
  var params = type === 'id' ? {allianceId:value} : {allianceTag:value};
  utils.get(game.ip, game.port, url, params, function(e, data){
    if(!!e){
      return res.render('service/alliance/search', {
        action:'/service/alliance/search',
        errors:[e.message],
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

router.get('/player/search', function(req, res){
  var type = req.query.type;
  var value = req.query.value;
  var game = req.game;
  if(_.isUndefined(type) && _.isUndefined(value)){
    return res.render('service/player/search', {action:'/service/player/search'})
  }

  if(type !== 'id' && type !== 'name' && type !== 'device'){
    return res.render('service/player/search', {
      action:'/service/player/search',
      errors:['查询类型不合法'],
      type:type,
      value:value
    });
  }

  if(!_.isString(value) || value.trim().length == 0){
    return res.render('service/player/search', {
      action:'/service/player/search',
      errors:['关键字不能为空'],
      type:type,
      value:value
    });
  }

  var url = type === 'id' ? 'player/find-by-id' : type === 'name' ? 'player/find-by-name' : 'player/find-by-device-id';
  var params = type === 'id' ? {playerId:value} : type === 'name' ? {playerName:value} : {deviceId:value};
  utils.get(game.ip, game.port, url, params, function(e, data){
    if(!!e){
      return res.render('service/player/search', {
        action:'/service/player/search',
        errors:[e.message],
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

router.get('/ban/list', function(req, res, next){
  var game = req.game;
  P.fromCallback(function(callback){
    utils.get(game.ip, game.port, 'player/get-baned-list', {}, callback);
  }).then(function(data){
    res.render('service/ban/list', {data:data});
  }).catch(function(e){
    next(e);
  })
});

router.get('/ban/create', function(req, res){
  res.render('service/ban/create');
});

router.post('/ban/create', function(req, res){
  var game = req.game;
  var baned = {
    playerId:req.body.playerId,
    minutes:Number(req.body.minutes),
    reason:req.body.reason
  };
  if(!_.isString(baned.playerId) || baned.playerId.trim().length === 0){
    return res.render('service/ban/create', {
      errors:['玩家ID不合法'],
      baned:baned
    });
  }
  if(!_.isString(baned.reason) || baned.reason.trim().length === 0){
    return res.render('service/ban/create', {
      errors:['禁止登陆理由不能为空'],
      baned:baned
    });
  }
  if(baned.minutes <= 0){
    return res.render('service/ban/create', {
      errors:['请选择禁止登陆时间'],
      baned:baned
    });
  }
  P.fromCallback(function(callback){
    utils.post(game.ip, game.port, 'player/ban', baned, callback);
  }).then(function(){
    res.redirect('/service/ban/list');
  }).catch(function(e){
    return res.render('service/ban/create', {
      errors:[e.message],
      baned:baned
    });
  });
});

router.delete('/ban/delete/:playerId', function(req, res, next){
  var game = req.game;
  var postData = {
    playerId:req.params.playerId
  };
  utils.post(game.ip, game.port, 'player/unBan', postData, function(e){
    if(!!e) return next(e);
    req.flash('success', '操作成功');
    return res.redirect('/service/ban/list');
  });
});

router.get('/mute/list', function(req, res, next){
  var game = req.game;
  P.fromCallback(function(callback){
    utils.get(game.ip, game.port, 'player/get-muted-list', {}, callback);
  }).then(function(data){
    res.render('service/mute/list', {data:data});
  }).catch(function(e){
    next(e);
  })
});

router.get('/mute/create', function(req, res){
  res.render('service/mute/create');
});

router.post('/mute/create', function(req, res){
  var game = req.game;
  var muted = {
    playerId:req.body.playerId,
    minutes:Number(req.body.minutes),
    reason:req.body.reason
  };
  if(!_.isString(muted.playerId) || muted.playerId.trim().length === 0){
    return res.render('service/mute/create', {
      errors:['玩家ID不合法'],
      muted:muted
    });
  }
  if(!_.isString(muted.reason) || muted.reason.trim().length === 0){
    return res.render('service/mute/create', {
      errors:['禁言理由不能为空'],
      muted:muted
    });
  }
  if(muted.minutes <= 0){
    return res.render('service/mute/create', {
      errors:['请选择禁言时间'],
      muted:muted
    });
  }
  P.fromCallback(function(callback){
    utils.post(game.ip, game.port, 'player/mute', muted, callback);
  }).then(function(){
    res.redirect('/service/mute/list');
  }).catch(function(e){
    return res.render('service/mute/create', {
      errors:[e.message],
      muted:muted
    });
  });
});

router.delete('/mute/delete/:playerId', function(req, res, next){
  var game = req.game;
  var postData = {
    playerId:req.params.playerId
  };
  utils.post(game.ip, game.port, 'player/unMute', postData, function(e){
    if(!!e) return next(e);
    req.flash('success', '操作成功');
    return res.redirect('/service/mute/list');
  });
});

router.get('/player/get-gm-chats', function(req, res){
  var type = req.query.type;
  var value = req.query.value;
  var game = req.game;

  if(_.isUndefined(type) && _.isUndefined(value)){
    return res.render('service/player/search', {action:'/service/player/get-gm-chats'})
  }

  if(type !== 'id' && type !== 'name'){
    return res.render('service/player/search', {
      action:'/service/player/get-gm-chats',
      errors:['查询类型不合法'],
      type:type,
      value:value
    });
  }

  if(!_.isString(value) || value.trim().length == 0){
    return res.render('service/player/search', {
      action:'/service/player/get-gm-chats',
      errors:['关键字不能为空'],
      type:type,
      value:value
    });
  }

  var url = type === 'id' ? 'player/find-by-id' : 'player/find-by-name';
  var params = type === 'id' ? {playerId:value} : {playerName:value};
  utils.get(game.ip, game.port, url, params, function(e, data){
    if(!!e){
      return res.render('service/player/search', {
        action:'/service/player/get-gm-chats',
        errors:[e.message],
        type:type,
        value:value
      });
    }
    if(!data.logicServerId){
      return res.render('service/player/search', {
        action:'/service/player/get-gm-chats',
        errors:['玩家不在线'],
        type:type,
        value:value
      });
    }
    return res.render('service/player/gmChat', {
      player:data
    });
  });
});

router.get('/player/get-gm-chats-ajax', function(req, res){
  var time = Number(req.query.time);
  var game = req.game;
  var playerId = req.query.playerId;
  var logicServerId = req.query.logicServerId;

  if(_.isNaN(time)) return res.json({
    code:500,
    data:['时间戳不合法']
  });

  utils.get(game.ip, game.port, 'get-gm-chats', {
    time:Number(time),
    playerId:playerId,
    logicServerId:logicServerId
  }, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.post('/player/send-gm-chat', function(req, res){
  var game = req.game;

  if(!_.isString(req.body.content) || req.body.content.trim().length == 0) return res.json({
    code:500,
    data:['聊天内容不能为空']
  });

  var postData = {
    playerId:req.body.playerId,
    logicServerId:req.body.logicServerId,
    content:req.body.content
  };
  utils.post(game.ip, game.port, 'send-gm-chat', postData, function(e, data){
    if(!!e) return res.json({code:500, data:e.message});
    return res.json({code:200, data:data});
  });
});

router.get('/get-gemchange-data', function(req, res, next){
  var game = req.game;
  var playerId = req.query.playerId;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-gemchange-data', {
    playerId:playerId,
    dateFrom:dateFrom,
    dateTo:dateTo,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('service/get-gemchange-data', {game:game, data:data});
  });
});

router.get('/get-gemadd-data', function(req, res, next){
  var game = req.game;
  var playerId = req.query.playerId;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-gemadd-data', {
    playerId:playerId,
    dateFrom:dateFrom,
    dateTo:dateTo,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('service/get-gemadd-data', {game:game, data:data});
  });
});

router.param('cacheServerId', function(req, res, next, cacheServerId){
  var game = req.game;
  if(!_.contains(game.servers, cacheServerId)) return next(new Error('Server not exist'));
  next();
});

router.get('/server-notice/create', function(req, res){
  res.render('service/server-notice/notice-create')
});

router.post('/server-notice/create', function(req, res){
  var notice = req.body;
  var servers = notice.servers;
  var game = req.game;
  if(!_.isArray(servers) || servers.length == 0){
    return res.render('service/server-notice/notice-create', {
      errors:['服务器未选择'],
      notice:notice
    });
  }
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server)){
      return res.render('service/server-notice/notice-create', {
        errors:['服务器不合法'],
        notice:notice
      });
    }
  }
  if(!_.isString(notice.title) || notice.title.trim().length == 0){
    return res.render('service/server-notice/notice-create', {
      errors:['标题不能为空'],
      notice:notice
    });
  }
  if(!_.isString(notice.content) || notice.content.trim().length == 0){
    return res.render('service/server-notice/notice-create', {
      errors:['内容不能为空'],
      notice:notice
    });
  }

  var postData = {
    servers:notice.servers,
    title:notice.title,
    content:notice.content
  };
  utils.post(game.ip, game.port, 'server-notice/create', postData, function(e, data){
    if(!!e){
      return res.render('service/server-notice/notice-create', {
        errors:[e.message],
        notice:notice
      });
    }
    _.each(data, function(status){
      if(status.code !== 200){
        req.flash('error', status.data);
      }
    });
    return res.redirect('/service/server-notice');
  });
});

router.get('/server-notice', function(req, res){
  res.render('service/server-notice/server-list');
});

router.get('/server-notice/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  utils.get(game.ip, game.port, 'server-notice/list', {
    serverId:cacheServerId
  }, function(e, data){
    if(!!e) return next(e);
    res.render('service/server-notice/notice-list', {data:data});
  });
});

router.delete('/server-notice/:cacheServerId/:noticeId', function(req, res){
  var game = req.game;
  var postData = {
    serverId:req.params.cacheServerId,
    noticeId:req.params.noticeId
  };
  utils.post(game.ip, game.port, 'server-notice/delete', postData, function(e){
    if(!!e){
      req.flash('error', e.message);
      return res.redirect('/service/server-notice/' + req.params.cacheServerId);
    }
    req.flash('success', '删除成功');
    return res.redirect('/service/server-notice/' + req.params.cacheServerId);
  });
});