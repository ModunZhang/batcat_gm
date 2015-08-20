/**
 * Created by modun on 15/6/26.
 */

var shortid = require('shortid');
var mongoose = require('mongoose');
var _ = require('underscore');

var Schema = mongoose.Schema;


/**
 * Setters
 */

var setServers = function (servers) {
  if(!servers || servers.trim().length == 0) return [];
  return servers.split(',');
};

/**
 * User Schema
 */
var GameSchema = new Schema({
  _id:{type:String, required:true, default:shortid.generate},
  name:{type:String, required:'Name cannot be blank', unique:true},
  ip:{type:String, required:'Ip cannot be blank'},
  port:{type:Number, required:'Port cannot be blank'},
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
}, 'Name already exists');

GameSchema.path('servers').validate(function(servers, fn){
  fn(servers.length > 0);
}, 'Servers cannot be empty');

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
