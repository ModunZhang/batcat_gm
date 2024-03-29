/**
 * Created by modun on 15/8/18.
 */

var express = require('express');
var _ = require('underscore');
var mongoose = require('mongoose');
var P = require('bluebird');
var csv = require("fast-csv");

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

router.get('/revenue/:cacheServerId/csv', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  var playerId = req.query.playerId;
  var transactionId = req.query.transactionId;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;

  utils.get(game.ip, game.port, 'get-revenue-data-csv', {
    serverId:cacheServerId,
    playerId:playerId,
    transactionId:transactionId,
    dateFrom:dateFrom,
    dateTo:dateTo
  }, function(e, data){
    if(!!e) return next(e);
    (function(){
      var filename = encodeURIComponent('收入(' + req.params.cacheServerId + ').csv');
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('content-type', 'text/csv; charset=utf-8');
      var csvStream = csv
        .createWriteStream({headers:true})
        .transform(function(data, next){
          setImmediate(function(){
            var date = new Date(data.time);
            next(null, {
              '玩家ID':data.playerId,
              '玩家名称':data.playerName,
              '流水号':data.transactionId,
              '产品ID':data.productId,
              '收入':'$' + data.price * data.quantity,
              '时间':date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + " " + date.getUTCHours() + ":" + date.getUTCMinutes() + ":" + date.getUTCSeconds()
            });
          });
        });
      csvStream.pipe(res);
      _.each(data.datas, function(data){
        csvStream.write(data);
      });
      csvStream.end();
    })();
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

router.get('/analyse/:cacheServerId/csv', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;

  utils.get(game.ip, game.port, 'get-analyse-data-csv', {
    serverId:cacheServerId,
    dateFrom:dateFrom,
    dateTo:dateTo
  }, function(e, data){
    if(!!e) return next(e);
    (function(){
      var filename = encodeURIComponent('数据统计(' + req.params.cacheServerId + ').csv');
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('content-type', 'text/csv; charset=utf-8');
      var csvStream = csv
        .createWriteStream({headers:true})
        .transform(function(data, next){
          setImmediate(function(){
            var date = new Date(data.dateTime);
            next(null, {
              '日期':date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate(),
              'DAU':data.dau,
              'DNU':data.dnu,
              'EDAU':data.dau - data.dnu,
              '次日留存':(function(){
                if(data.day1 === -1){
                  return '暂无';
                }else if(data.day1 === 0 || data.dnu === 0){
                  return '0%';
                }else{
                  return Number(data.day1 / data.dnu * 100).toFixed(2) + '%';
                }
              })(),
              '3日留存':(function(){
                if(data.day3 === -1){
                  return '暂无';
                }else if(data.day3 === 0 || data.dnu === 0){
                  return '0%';
                }else{
                  return Number(data.day3 / data.dnu * 100).toFixed(2) + '%';
                }
              })(),
              '7日留存':(function(){
                if(data.day7 === -1){
                  return '暂无';
                }else if(data.day7 === 0 || data.dnu === 0){
                  return '0%';
                }else{
                  return Number(data.day7 / data.dnu * 100).toFixed(2) + '%';
                }
              })(),
              '15日留存':(function(){
                if(data.day15 === -1){
                  return '暂无';
                }else if(data.day15 === 0 || data.dnu === 0){
                  return '0%';
                }else{
                  return Number(data.day15 / data.dnu * 100).toFixed(2) + '%';
                }
              })(),
              '30日留存':(function(){
                if(data.day15 === -1){
                  return '暂无';
                }else if(data.day15 === 0 || data.dnu === 0){
                  return '0%';
                }else{
                  return Number(data.day15 / data.dnu * 100).toFixed(2) + '%';
                }
              })(),
              '收入':(function(){
                if(data.revenue > 0){
                  return '$' + Number(data.revenue).toFixed(2);
                }else{
                  return '$0';
                }
              })(),
              'ARPU':(function(){
                if(data.revenue > 0){
                  return '$' + Number(data.revenue).toFixed(2);
                }else{
                  return '$0';
                }
              })(),
              'ARPPU':(function(){
                if(data.dau > 0 && data.revenue > 0){
                  return '$' + Number(data.revenue / data.dau).toFixed(3);
                }else{
                  return '$0';
                }
              })(),
              '付费人数':data.payCount,
              '付费次数':data.payTimes,
              '付费率':(function(){
                if(data.payCount > 0){
                  return Number(data.payCount / data.dau * 100).toFixed(2);
                }else{
                  return '0'
                }
              })()
            })
          });
        });
      csvStream.pipe(res);
      _.each(data.datas, function(data){
        csvStream.write(data);
      });
      csvStream.end();
    })();
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

router.get('/allianceActivities', function(req, res){
  res.render('manager/allianceActivities/server-list');
});

router.get('/allianceActivities/create', function(req, res, next){
  var game = req.game;
  if(!req.app.allianceActivityTypes){
    utils.get(game.ip, game.port, 'get-alliance-activity-types', {}, function(e, data){
      if(!!e) return next(e);
      req.app.allianceActivityTypes = data;
      res.render('manager/allianceActivities/activity-create');
    });
  }else{
    res.render('manager/allianceActivities/activity-create');
  }
});

router.post('/allianceActivities/create', function(req, res){
  var activity = req.body;
  var servers = activity.servers;
  var game = req.game;
  if(!_.isArray(servers) || servers.length == 0){
    return res.render('manager/allianceActivities/activity-create', {
      errors:['服务器未选择'],
      activity:activity
    });
  }
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];
    if(!_.contains(game.servers, server)){
      return res.render('manager/allianceActivities/activity-create', {
        errors:['服务器不合法'],
        activity:activity
      });
    }
  }
  if(!activity.type){
    return res.render('manager/allianceActivities/activity-create', {
      errors:['请选择活动类型'],
      activity:activity
    });
  }
  if(!activity.dateStart){
    return res.render('manager/allianceActivities/activity-create', {
      errors:['请选择开始日期'],
      activity:activity
    });
  }

  var postData = {
    servers:activity.servers,
    type:activity.type,
    dateStart:activity.dateStart
  };
  utils.post(game.ip, game.port, 'create-alliance-activity', postData, function(e, data){
    if(!!e){
      return res.render('manager/allianceActivities/activity-create', {
        errors:[e.message],
        activity:activity
      });
    }
    _.each(data, function(status){
      if(status.code !== 200){
        req.flash('error', status.data);
      }
    });
    return res.redirect('/manager/allianceActivities/');
  });
});

router.get('/allianceActivities/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  P.fromCallback(function(callback){
    if(!req.app.allianceActivityTypes){
      utils.get(game.ip, game.port, 'get-alliance-activity-types', {}, function(e, data){
        if(!!e) return callback(e);
        req.app.allianceActivityTypes = data;
        callback();
      });
    }else{
      callback();
    }
  }).then(function(){
    return P.fromCallback(function(callback){
      utils.get(game.ip, game.port, 'get-alliance-activities', {
        cacheServerId:cacheServerId
      }, function(e, data){
        if(!!e) return callback(e);
        callback(null, data);
      });
    });
  }).then(function(data){
    res.render('manager/allianceActivities/activity-list', {data:data});
  }).catch(function(e){
    next(e);
  })
});

router.delete('/allianceActivities/delete/:cacheServerId/:activityType', function(req, res){
  var game = req.game;
  var postData = {
    cacheServerId:req.params.cacheServerId,
    type:req.params.activityType
  };
  utils.post(game.ip, game.port, 'delete-alliance-activity', postData, function(e){
    if(!!e){
      req.flash('error', e.message);
      return res.redirect('/manager/allianceActivities/' + req.params.cacheServerId);
    }
    req.flash('success', '删除成功');
    return res.redirect('/manager/allianceActivities/' + req.params.cacheServerId);
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


router.get('/game-info', function(req, res){
  res.render('manager/game-info/server-list');
});

router.get('/game-info/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  P.fromCallback(function(callback){
    utils.get(game.ip, game.port, 'game-info', {
      serverId:cacheServerId
    }, function(e, data){
      if(!!e) return callback(e);
      callback(null, data);
    });
  }).then(function(data){
    res.render('manager/game-info/game-info', {data:data});
  }).catch(function(e){
    next(e);
  })
});

router.put('/game-info/:cacheServerId', function(req, res){
  var game = req.game;
  var serverId = req.params.cacheServerId;
  var promotionProductEnabled = req.body.promotionProductEnabled;
  var modApplyEnabled = req.body.modApplyEnabled;
  var iapGemEventEnabled = req.body.iapGemEventEnabled;

  var postData = {
    serverId:serverId,
    gameInfo:{
      promotionProductEnabled:promotionProductEnabled,
      modApplyEnabled:modApplyEnabled,
      iapGemEventEnabled:iapGemEventEnabled
    }
  };
  utils.post(game.ip, game.port, 'game-info', postData, function(e){
    if(!!e){
      req.flash('error', e.message);
      return res.redirect('/manager/game-info/' + postData.serverId)
    }
    req.flash('success', '编辑成功');
    return res.redirect('/manager/game-info/' + postData.serverId)
  });
});

router.get('/get-loginlog-data', function(req, res, next){
  var game = req.game;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-loginlog-data', {
    dateFrom:dateFrom,
    dateTo:dateTo,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('manager/get-loginlog-data', {game:game, data:data});
  });
});

router.get('/get-loginlog-data-csv', function(req, res, next){
  var game = req.game;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;

  utils.get(game.ip, game.port, 'get-loginlog-data-csv', {
    dateFrom:dateFrom,
    dateTo:dateTo
  }, function(e, data){
    if(!!e) return next(e);
    (function(){
      var filename = encodeURIComponent('登录日志.csv');
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('content-type', 'text/csv; charset=utf-8');
      var csvStream = csv
        .createWriteStream({headers:true})
        .transform(function(data, next){
          setImmediate(function(){
            var date = new Date(data.loginTime);
            next(null, {
              '玩家ID':data.playerId,
              'IP':data.ip,
              'ServerId':data.serverId,
              '时间':date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + " " + date.getUTCHours() + ":" + date.getUTCMinutes() + ":" + date.getUTCSeconds()
            })
          });
        });
      csvStream.pipe(res);
      _.each(data.datas, function(data){
        csvStream.write(data);
      });
      csvStream.end();
    })();
  });
});

router.get('/player-snapshot', function(req, res){
  res.render('manager/player-snapshot/server-list');
});

router.get('/player-snapshot/:cacheServerId', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;
  var skip = req.query.skip;

  utils.get(game.ip, game.port, 'get-player-snapshot-data', {
    serverId:cacheServerId,
    skip:skip
  }, function(e, data){
    if(!!e) return next(e);
    res.render('manager/player-snapshot/player-list', {data:data});
  });
});

router.get('/player-snapshot/:cacheServerId/csv', function(req, res, next){
  var cacheServerId = req.params.cacheServerId;
  var game = req.game;

  utils.get(game.ip, game.port, 'get-player-snapshot-data-csv', {
    serverId:cacheServerId
  }, function(e, data){
    if(!!e) return next(e);
    (function(){
      var filename = encodeURIComponent('玩家快照(' + req.params.cacheServerId + ').csv');
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('content-type', 'text/csv; charset=utf-8');
      var csvStream = csv
        .createWriteStream({headers:true})
        .transform(function(data, next){
          setImmediate(function(){
            var date = new Date(data.countInfo.lastLogoutTime);
            next(null, {
              'ServerId':cacheServerId,
              '玩家ID':data._id,
              '宝石数':data.resources.gem,
              'Power':data.basicInfo.power,
              '最后登出时间':date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate()
            })
          });
        });
      csvStream.pipe(res);
      _.each(data.datas, function(data){
        csvStream.write(data);
      });
      csvStream.end();
    })();
  });
});