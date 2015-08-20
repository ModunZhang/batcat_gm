/**
 * Created by modun on 15/6/24.
 */


var express = require('express');

var auth = require('../../middlewares/authorization');

var router = express.Router();
module.exports = router;

router.get('/', auth.requiresLogin, function(req, res) {
  res.render('index');
});
