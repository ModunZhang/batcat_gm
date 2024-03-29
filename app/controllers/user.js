/**
 * Created by modun on 15/6/24.
 */

var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport');
var _ = require('underscore');

var auth = require('../../middlewares/authorization');

var User = mongoose.model('User');

var router = express.Router();
module.exports = router;

router.get('/login', auth.requiresNotLogin, function(req, res){
  res.render('user/login');
});

router.post('/login', auth.requiresNotLogin, function(req, res, next){
  var data = req.body;
  passport.authenticate('local', function(e, user){
    if(!!e) return next(e);
    if(!user){
      return res.render('user/login', {
        errors:['Invalid email or password.'],
        user:data
      })
    }
    req.login(user, function(e){
      if(!!e) return next(e);
      if(req.body.rememberme){
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;//7days
      }else req.session.cookie.maxAge = false;
      return res.redirect('/');
    })
  })(req, res, next)
});

router.all('*', auth.requiresLogin);

router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'Logout successfully');
  res.redirect('/user/login');
});

router.get('/edit-my-password', function(req, res){
  res.render('user/edit-my-password');
});

router.put('/edit-my-password', function(req, res, next){
  if(!req.body.password) return res.render('user/edit-my-password', {errors:['Original Password cannot be empty']});
  if(!req.body.newpassword) return res.render('user/edit-my-password', {errors:['New password cannot be empty']});
  User.findById(req.user._id).then(function(user){
    user.comparePassword(req.body.password, function(e, isMatch){
      if(!!e) return next(e);
      if(!isMatch) return res.render('user/edit-my-password', {errors:['Original Password not correct']});
      user.password = req.body.newpassword;
      user.save(function(e){
        if(!!e) return next(e);
        req.logout();
        req.flash('success', 'Edit successfully');
        res.redirect('/user/login');
      })
    })
  }, function(e){
    next(e);
  });
});

router.get('/set-default-game', function(req, res){
  res.json({token:res.locals.csrf_token})
});

router.put('/set-default-game', function(req, res){
  var gameId = req.body.gameId;
  if(!gameId || !_.contains(req.user.games, gameId)) return res.json({code:500, data:['Game not selected.']});
  User.findById(req.user._id).then(function(user){
    user.defaultGame = gameId;
    user.save(function(e){
      if(!!e)return res.json({code:500, data:[e.message]});
      req.session.passport.user.defaultGame = gameId;
      res.json({code:200});
    })
  }, function(e){
    res.json({code:500, data:[e.message]});
  });
});