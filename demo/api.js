var Database = require('./database');
var ShopKeeper = require('../lib');
var Api = ShopKeeper.Api;

// Configure the database
ShopKeeper.database(Database.Sqlite);

// Create a new api instance
var api = module.exports = new Api();

// Override `api`'s default `getAccountable` method
api.getAccountable = function (req, done) {

  done(null, req.query.accountable);
};
