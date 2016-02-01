/**
 * Created by modun on 15/6/26.
 */
var _ = require('underscore');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = mongoose.model('User');

passport.serializeUser(function(user, done){
  if(user.defaultGame !== 'none' && !_.contains(user.games, user.defaultGame)){
    user.defaultGame = 'none';
  }
  done(null, {_id:user._id, email:user.email, roles:user.roles, games:user.games, defaultGame:user.defaultGame});
});

passport.deserializeUser(function(user, done){
  if(user.defaultGame !== 'none' && !_.contains(user.games, user.defaultGame)){
    user.defaultGame = 'none';
  }
  return done(null, user);
});

passport.use(new LocalStrategy({
  usernameField:'email',
  passwordField:'password'
}, function(email, password, done){
  User.findOne({email:email}, function(err, user){
    if(err){
      return done(err);
    }
    if(!user){
      return done(null, false, {message:'Unknown user ' + email});
    }
    user.comparePassword(password, function(err, isMatch){
      if(err) return done(err);
      if(isMatch){
        return done(null, user);
      }else{
        return done(null, false, {message:'Invalid password'});
      }
    });
  });
}));

module.exports = passport;