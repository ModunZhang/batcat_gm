/**
 * Created by modun on 15/6/24.
 */


var express = require('express');
var router = express.Router();
var auth = require('../../middlewares/authorization');

router.get('/', auth.requiresLogin, function(req, res) {
  res.render('index');
});

module.exports = router;
