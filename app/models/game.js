/**
 * Created by modun on 15/6/26.
 */

var shortid = require('shortid');
var mongoose = require('mongoose');
var _ = require('underscore');

var consts = require('../../config/consts');

var Schema = mongoose.Schema;


/**
 * Setters
 */

var setServers = function(servers){
  if(!servers || servers.trim().length == 0) return [];
  return servers.split(',');
};

/**
 * User Schema
 */
var GameSchema = new Schema({
  _id:{type:String, required:true, default:shortid.generate},
  name:{type:String, required:'名称不能为空', unique:true},
  ip:{type:String, required:'Ip地址不能为空'},
  port:{type:Number, required:'端口号不能为空'},
  languages:[String],
  servers:{type:[String], set:setServers},
  createdAt:{type:Number, default:Date.now}
});


/**
 * Virtuals
 */


/**
 * Validations
 */
GameSchema.path('name').validate(function(name, fn){
  var Game = mongoose.model('Game');
  if(this.isNew || this.isModified('name')){
    Game.find({name:name}).exec(function(err, games){
      fn(!err && games.length === 0);
    });
  }else fn(true);
}, '名称已存在');

GameSchema.path('servers').validate(function(servers){
  return servers.length > 0;
}, '服务器组不能为空');

GameSchema.path('languages').validate(function(languages){
  return languages.length > 0;
}, '语言不能为空');

GameSchema.path('languages').validate(function(languages){
  return !_.some(languages, function(language){
    return !_.contains(consts.PlayerLanguage, language)
  })
}, '语言不合法');

/**
 * Middleware
 */
GameSchema.pre('save', function(next){
  next();
});


/**
 * Instance Methods
 */


/**
 * Static Methods
 */
GameSchema.statics = {};

mongoose.model('Game', GameSchema);
