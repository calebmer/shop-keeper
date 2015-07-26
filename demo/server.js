var Express = require('express');
var BodyParser = require('body-parser');
var Api = require('./api');

// Make sure the models have been created
require('./models');

var server = module.exports = Express();

// The api has its own body parser, but it is always good to include your own just in case
server.use(BodyParser.json());

// This is where the api is injected
server.use(Api.middleware());

// Not found error
server.use(function (req, res, next) {

  var error = new Error('Not found');
  error.statusCode = 404;
  next(error);
});

// Error handler
server.use(function (error, req, res, next) {

  var statusCode = error.statusCode || 500;

  if (statusCode === 500) { console.error(error.stack); }

  var result = JSON.stringify({
    name: error.name,
    message: error.message,

    // Since some api errors have a `validationErrors` property, let us expose it
    validationErrors: error.validationErrors
  });

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': result.length
  });

  res.end(result);
});
