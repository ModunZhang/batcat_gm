/**
 * Created by modun on 15/6/29.
 */

var request = require('request');
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
};

Utils.getUrl = function(ip, port, path){
  return 'http://' + ip + ':' + port + '/' + path;
};

Utils.post = function(ip, port, path, postData, callback){
  request.post({url:'http://' + ip + ':' + port + '/' + path, form:postData}, function(e, resp, body){
    if(!!e) return callback(e);
    if(resp.statusCode !== 200) return callback(new Error('Game server response status code:' + resp.statusCode));
    var jsonObj = null;
    try{
      jsonObj = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    if(jsonObj.code !== 200) return callback(new Error('Game server response error message:[' + jsonObj.code + ']' + jsonObj.data));
    callback(null, jsonObj.data);
  });
};

Utils.get = function(ip, port, path, params, callback){
  request.get({url:'http://' + ip + ':' + port + '/' + path, qs:params}, function(e, resp, body){
    if(!!e) return callback(e);
    if(resp.statusCode !== 200) return callback(new Error('Game server response status code:' + resp.statusCode));
    var jsonObj = null;
    try{
      jsonObj = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    if(jsonObj.code !== 200) return callback(new Error('Game server response error message:[' + jsonObj.code + ']' + jsonObj.data));
    callback(null, jsonObj.data);
  });
};