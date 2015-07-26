var Async = require('async');
var ShopKeeper = require('../../lib');
var Models = require('../models');

// Drops all of the tables
module.exports = function (callback) {

  Async.each(Object.keys(Models), function (name, next) {

    var model = Models[name];

    // The `sql` module table can be found at `#table`
    ShopKeeper.Database.exec(model.table.drop(), next);
  }, callback);
};
