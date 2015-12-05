var _ = require('lodash');
var Supertest = require('supertest');
var Server = require('../../demo/server');

var Request = module.exports = _.partial(Supertest, Server);
