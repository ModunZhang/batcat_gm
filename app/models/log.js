/**
 * Created by modun on 15/6/26.
 */

var shortid = require('shortid');
var mongoose = require('mongoose');
var _ = require('underscore');

var Schema = mongoose.Schema;

/**
 * User Schema
 */
var LogSchema = new Schema({
  _id:{type:String, required:true, default:shortid.generate},
  api:{type:String, required:true},
  params:{type:Schema.Types.Mixed},
  method:{type:String, required:true},
  userEmail:{type:String, required:true},
  game:{type:String, required:true},
  createdAt:{type:Number, required:true, default:Date.now},
  expires:{type:Date, required:true, default:Date.now, expires:60 * 60 * 24 * 7}
});


/**
 * Virtuals
 */


/**
 * Validations
 */


/**
 * Middleware
 */


/**
 * Instance Methods
 */
LogSchema.methods = {};


/**
 * Static Methods
 */
LogSchema.statics = {};

mongoose.model('Log', LogSchema);
