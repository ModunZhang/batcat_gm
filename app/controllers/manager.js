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
  utils.get(game.ip, game.port, 'get-servers-info', {servers:game.servers.toObject()}, function(e, data){
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
  var transactionId = req.query.transactionId;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-revenue-data', {
    serverId:cacheServerId,
    playerId:playerId,
    transactionId:transactionId,
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
  P.fromCallback(function(callback){
    Log.count(sql, callback);
  }).then(function(count){
    result.totalCount = count;
    return P.fromCallback(function(callback){
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

router.get('/dailyReports', function(req, res){
  res.render('manager/dailyReports/server-list');
});

router.get('/dailyReports/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-daily-reports', {
    serverId:cacheServerId,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('manager/dailyReports/report-list', {data:data});
  });
});

router.get('/activities', function(req, res){
  res.render('manager/activities/server-list');
});

router.get('/activities/create', function(req, res, next){
  var game = req.game;
  if(!req.app.activityTypes){
    utils.get(game.ip, game.port, 'get-activity-types', {}, function(e, data){
      if(!!e) return next(e);
      req.app.activityTypes = data;
      res.render('manager/activities/activity-create');
    });
  }else{
    res.render('manager/activities/activity-create');
  }
});

router.post('/activities/create', function(req, res){
  var activity = req.body;
  var servers = activity.servers;
  var game = req.game;
  if(!_.isArray(servers) || servers.length == 0){
    return res.render('manager/activities/activity-create', {
      errors:['服务器未选择'],
      activity:activity
    });
  }
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server)){
      return res.render('manager/activities/activity-create', {
        errors:['服务器不合法'],
        activity:activity
      });
    }
  }
  if(!activity.type){
    return res.render('manager/activities/activity-create', {
      errors:['请选择活动类型'],
      activity:activity
    });
  }
  if(!activity.dateStart){
    return res.render('manager/activities/activity-create', {
      errors:['请选择开始日期'],
      activity:activity
    });
  }

  var postData = {
    servers:activity.servers,
    type:activity.type,
    dateStart:activity.dateStart
  };
  utils.post(game.ip, game.port, 'create-activity', postData, function(e, data){
    if(!!e){
      return res.render('manager/activities/activity-create', {
        errors:[e.message],
        activity:activity
      });
    }
    _.each(data, function(status){
      if(status.code !== 200){
        req.flash('error', status.data);
      }
    });
    return res.redirect('/manager/activities/');
  });
});

router.get('/activities/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  P.fromCallback(function(callback){
    if(!req.app.activityTypes){
      utils.get(game.ip, game.port, 'get-activity-types', {}, function(e, data){
        if(!!e) return callback(e);
        req.app.activityTypes = data;
        callback();
      });
    }else{
      callback();
    }
  }).then(function(){
    return P.fromCallback(function(callback){
      utils.get(game.ip, game.port, 'get-activities', {
        cacheServerId:cacheServerId
      }, function(e, data){
        if(!!e) return callback(e);
        callback(null, data);
      });
    });
  }).then(function(data){
    res.render('manager/activities/activity-list', {data:data});
  }).catch(function(e){
    next(e);
  })
});

router.delete('/activities/delete/:cacheServerId/:activityType', function(req, res){
  var game = req.game;
  var postData = {
    cacheServerId:req.params.cacheServerId,
    type:req.params.activityType
  };
  utils.post(game.ip, game.port, 'delete-activity', postData, function(e){
    if(!!e){
      req.flash('error', e.message);
      return res.redirect('/manager/activities/' + req.params.cacheServerId);
    }
    req.flash('success', '删除成功');
    return res.redirect('/manager/activities/' + req.params.cacheServerId);
  });
});


router.get('/mods/list', function(req, res, next){
  var game = req.game;
  P.fromCallback(function(callback){
    utils.get(game.ip, game.port, 'mod/list', {}, callback);
  }).then(function(data){
    res.render('manager/mods/list', {data:data});
  }).catch(function(e){
    next(e);
  })
});

router.get('/mods/create', function(req, res){
  res.render('manager/mods/create');
});

router.post('/mods/create', function(req, res){
  var game = req.game;
  var mod = {
    id:req.body.id,
    name:req.body.name
  };

  if(!_.isString(mod.id) || mod.id.trim().length === 0){
    return res.render('manager/mods/create', {
      errors:['墨子ID不合法'],
      mod:mod
    });
  }
  if(!_.isString(mod.name) || mod.name.trim().length === 0){
    return res.render('manager/mods/create', {
      errors:['墨子名称不合法'],
      mod:mod
    });
  }
  P.fromCallback(function(callback){
    utils.post(game.ip, game.port, 'mod/create', mod, callback)
  }).then(function(){
    res.redirect('/manager/mods/list');
  }).catch(function(e){
    return res.render('manager/mods/create', {
      errors:[e.message],
      mod:mod
    });
  });
});

router.delete('/mods/delete/:modId', function(req, res, next){
  var game = req.game;
  P.fromCallback(function(callback){
    utils.post(game.ip, game.port, 'mod/delete', {id:req.params.modId}, callback)
  }).then(function(){
    res.redirect('/manager/mods/list');
  }).catch(function(e){
    next(e);
  });
});

router.get('/modLogs', function(req, res, next){
  var game = req.game;
  P.fromCallback(function(callback){
    utils.get(game.ip, game.port, 'get-mod-logs', req.query, callback);
  }).then(function(data){
    res.render('manager/modLogs', {data:data});
  }).catch(function(e){
    next(e);
  })
});

