var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var csrf = require('csurf');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var swig = require('swig');
var _ = require('underscore');

var flash = require('connect-flash');
var helpers = require('view-helpers');

var passport = require('./config/passport');
var config = require('./config/config');
var pkg = require('./package.json');
var env = process.env.NODE_ENV || 'development';

var app = express();
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'app/views'));
app.set('view cache', false);
if(env === 'development'){
  swig.setDefaults({cache:false});
}
app.use(favicon(__dirname + '/public/images/batcat_icon.ico'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride(function(req){
  if(req.body && typeof req.body === 'object' && '_method' in req.body){
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(cookieParser());
app.use(session({
  saveUninitialized:true,
  resave:false,
  secret:config.sessionSecret,
  store:new mongoStore({
    url:config.mongoHost,
    collection:'sessions'
  }),
  cookie:{httpOnly:true, maxAge:2419200000}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(helpers(pkg.name));
app.use(csrf());
app.use(function(req, res, next){
  res.locals.csrf_token = req.csrfToken();
  next();
});
app.use(function(req, res, next){
  res.locals.isActive = function (link) {
    if (link === '/' ) {
      return req.originalUrl === '/' ? 'active' : ''
    } else {
      return req.originalUrl.indexOf(link) !== -1 ? 'active' : ''
    }
  };
  res.locals.hasRole = function(role){
    return _.contains(req.user.roles, role);
  };
  res.locals.contains = function(objects, object){
    return _.contains(objects, object);
  };
  next();
});

require('./config/routes')(app);


module.exports = app;
