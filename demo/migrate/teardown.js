var Async = require('async');
var Database = require('../../lib/database');
var Models = require('../models');

// Drops all of the tables
module.exports = function (callback) {

  Async.each(Object.keys(Models), function (name, next) {

    var model = Models[name];

    // The `sql` module table can be found at `#table`
    model.table.drop().exec(next);
  }, callback);
};
