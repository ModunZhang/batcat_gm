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
var ErrorSchema = new Schema({
  _id:{type:String, required:true, default:shortid.generate},
  deviceId:{type:String},
  stack:{type:String},
  createdAt:{type:Number, required:true, index:true, default:Date.now, expires:60 * 60 * 24 * 7}
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
ErrorSchema.methods = {};


/**
 * Static Methods
 */
ErrorSchema.statics = {};

mongoose.model('Error', ErrorSchema);
