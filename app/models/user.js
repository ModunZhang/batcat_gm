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
  email:{type:String, required:'邮件地址不能为空', unique:true},
  password:{type:String, required:'密码不能为空'},
  defaultGame:{type:String, required:true, default:'none'},
  roles:[String],
  games:[String],
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
}, '邮件地址已存在');

UserSchema.path('roles').validate(function(roles){
  return _.isArray(roles) && roles.length > 0
}, '角色不能为空');

UserSchema.path('roles').validate(function(roles){
  return !_.some(roles, function(role){
    return !_.contains(consts.UserRoles, role)
  })
}, '角色不合法');

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
