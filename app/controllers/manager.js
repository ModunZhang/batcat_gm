/**
 * Created by modun on 15/8/18.
 */

var express = require('express');
var _ = require('underscore');

var auth = require('../../middlewares/authorization');
var consts = require('../../config/consts');

var router = express.Router();
module.exports = router;

router.get('/', auth.requiresUserRight.bind(auth, consts.UserRoles.Manager), function(req, res){
  res.render('manager/index');
});