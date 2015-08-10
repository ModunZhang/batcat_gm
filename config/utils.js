/**
 * Created by modun on 15/6/29.
 */

var _ = require('underscore');

var Utils = module.exports;

Utils.mongooseError = function(error){
  var errors = [];
  if(_.isObject(error.errors)){
    _.each(error.errors, function(e){
      errors.push(e.message)
    });
  }else errors.push([error.message]);
  return errors;
}