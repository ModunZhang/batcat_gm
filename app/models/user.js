/**
 * Created by modun on 15/6/26.
 */

var shortid = require('shortid');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var _ = require('underscore');

var consts = require('../../config/consts');

var Schema = mongoose.Schema;

/**
 * User Schema
 */
var UserSchema = new Schema({
  _id:{type:String, required:true, default:shortid.generate},
  email:{type:String, required:'Email cannot be blank', unique:true},
  password:{type:String, required:'Password cannot be blank'},
  rights:{type:[Number]},
  createdAt:{type:Number, default:Date.now}
});


/**
 * Virtuals
 */


/**
 * Validations
 */

UserSchema.path('email').validate(function(email, fn){
  var User = mongoose.model('User');
  if(this.isNew || this.isModified('email')){
    User.find({email:email}).exec(function(err, users){
      fn(!err && users.length === 0);
    });
  }else fn(true);
}, 'Email already exists');

UserSchema.path('rights').validate(function(rights){
  return _.isArray(rights) && rights.length > 0
}, 'Rights can not be empty');

UserSchema.path('rights').validate(function(rights){
  return !_.some(rights, function(right){
    return !_.contains(consts.UserRights, right)
  })
}, 'Rights not legal');

/**
 * Middleware
 */
UserSchema.pre('save', function(next){
  var user = this;
  if(!user.isModified('password')) return next();
  bcrypt.genSalt(8, function(err, salt){
    if(err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash){
      if(err) return next(err);
      user.password = hash;
      next()
    })
  })
});


/**
 * Instance Methods
 */
UserSchema.methods = {
  comparePassword:function(candidatePassword, cb){
    var user = this;
    bcrypt.compare(candidatePassword, user.password, function(err, isMatch){
      if(err) return cb(err);
      else cb(null, isMatch)
    })
  }
};


/**
 * Static Methods
 */
UserSchema.statics = {

};

mongoose.model('User', UserSchema);
