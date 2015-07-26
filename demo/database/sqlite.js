var Path = require('path');
var Sqlite3 = require('sqlite3').verbose();

var db = new Sqlite3.Database(process.env.NODE_ENV === 'test' ?
  ':memory:' :
  'db.sqlite'
);

// Make sure to export the dialect
exports.dialect = 'sqlite';

// Execute the `sql` module query in the database
exports.executeQuery = function (query, callback) {

  db.all(query.text, query.values, callback);
};
