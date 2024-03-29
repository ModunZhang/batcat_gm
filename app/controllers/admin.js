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

var User = mongoose.model('User');
var Game = mongoose.model('Game');
var Error = mongoose.model('Error');

var router = express.Router();
module.exports = router;

router.get('/init', auth.requireEmptyUsers, function(req, res){
  res.render('admin/init');
});

router.put('/init', auth.requireEmptyUsers, function(req, res){
  var user = new User(req.body);
  user.roles = [consts.UserRoles.Admin, consts.UserRoles.Manager, consts.UserRoles.CustomerService];
  user.save().then(function(){
    res.redirect('/user/login');
  }, function(e){
    res.render('admin/init', {errors:utils.mongooseError(e), user:user.toObject()});
  });
});

router.all('*', auth.requiresLogin, auth.requiresUserRight.bind(auth, consts.UserRoles.Admin));

router.get('/', function(req, res){
  res.render('admin/index');
});

router.all('/users/*', function(req, res, next){
  Game.find().then(function(games){
    req.games = games;
    next();
  }, function(e){
    next(e);
  })
});

router.param('userId', function(req, res, next, userId){
  User.findById(userId).then(function(user){
    if(!user) return next(new Error('用户不存在'));
    req.member = user;
    next();
  }, function(e){
    next(e);
  })
});

router.get('/users/list', function(req, res, next){
  res.locals.showGameNames = function(gameIds){
    var gameNames = [];
    for(var i = 0; i < gameIds.length; i++){
      (function(){
        var gameId = gameIds[i];
        var game = _.find(req.games, function(game){
          return game._id === gameId;
        });
        if(!!game) gameNames.push(game.name);
      })();
    }
    return gameNames.length > 0 ? gameNames.join(',') : 'None';
  };
  User.find({}, 'email roles games').then(function(users){
    res.render('admin/users/list', {
      users:users
    });
  }, function(e){
    next(e);
  });
});

router.get('/users/create', function(req, res){
  res.render('admin/users/create', {roles:_.values(consts.UserRoles), games:req.games});
});

router.post('/users/create', function(req, res){
  var user = new User(req.body);
  user.save().then(function(){
    res.redirect('/admin/users/list');
  }, function(e){
    res.render('admin/users/create', {
      errors:utils.mongooseError(e),
      user:user,
      roles:_.values(consts.UserRoles),
      games:req.games
    });
  });
});

router.get('/users/edit/:userId', function(req, res){
  res.locals.checkRight = function(right){
    return _.contains(req.member.roles, right) ? 'checked' : ''
  };
  res.render('admin/users/edit', {user:req.member, roles:_.values(consts.UserRoles), games:req.games});
});

router.put('/users/edit/:userId', function(req, res){
  var member = req.member;
  member.email = req.body.email;
  member.roles = !!req.body.roles ? req.body.roles : [];
  member.games = !!req.body.games ? req.body.games : [];
  member.save().then(function(){
    mongoose.connection.collection('sessions').deleteMany({session:{$regex:member._id}}, function(){
      req.flash('success', '编辑成功');
      if(member._id === req.user._id){
        req.logout();
        res.redirect('/user/login');
      }else
        res.redirect('/admin/users/list');
    });
  }, function(e){
    res.render('admin/users/edit', {
      errors:utils.mongooseError(e),
      user:member,
      roles:_.values(consts.UserRoles),
      games:req.games
    });
  });
});

router.delete('/users/delete/:userId', function(req, res, next){
  var member = req.member;
  if(member._id === req.user._id){
    req.flash('error', '不能删除自己');
    return res.redirect('/admin/users/list');
  }
  member.remove().then(function(){
    mongoose.connection.collection('sessions').deleteMany({session:{$regex:member._id}}, function(){
      req.flash('success', '删除成功');
      res.redirect('/admin/users/list');
    });
  }, function(e){
    next(e);
  });
});


router.param('gameId', function(req, res, next, gameId){
  Game.findById(gameId).then(function(game){
    if(!game) return next(new Error('游戏不存在'));
    req.game = game;
    next();
  }, function(e){
    next(e);
  })
});

router.get('/games/list', function(req, res, next){
  Game.find({}).then(function(games){
    res.render('admin/games/list', {games:games});
  }, function(e){
    next(e);
  });
});

router.get('/games/create', function(req, res){
  res.render('admin/games/create', {languages:consts.PlayerLanguage});
});

router.post('/games/create', function(req, res){
  var game = new Game(req.body);
  game.save().then(function(){
    res.redirect('/admin/games/list');
  }, function(e){
    res.render('admin/games/create', {
      errors:utils.mongooseError(e),
      game:game,
      languages:consts.PlayerLanguage
    });
  });
});

router.get('/games/edit/:gameId', function(req, res){
  res.render('admin/games/edit', {game:req.game, languages:consts.PlayerLanguage});
});

router.put('/games/edit/:gameId', function(req, res){
  var game = req.game;
  game = extend(game, req.body);
  game.save().then(function(){
    req.flash('success', '编辑成功');
    res.redirect('/admin/games/list');
  }, function(e){
    res.render('admin/games/edit', {
      errors:utils.mongooseError(e),
      game:game,
      languages:consts.PlayerLanguage
    });
  });
});

router.delete('/games/delete/:gameId', function(req, res, next){
  var game = req.game;
  game.remove().then(function(){
    req.flash('success', '删除成功');
    res.redirect('/admin/games/list');
  }, function(e){
    next(e);
  })
});