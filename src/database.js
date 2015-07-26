import Sql from 'sql';
import Node from 'sql/lib/node';

let Database = {};

Database.setDialect = ::Sql.setDialect;
Database.executeQuery = (query, callback) => callback(new Error('Not implemented'));

export default Database;

// FIXME: this currently only supports sqlite
Sql.lastId = () => 'last_insert_rowid() as lastId';

Node.prototype.exec = function (callback) {

  let query = this.toQuery();
  Database.executeQuery(query, callback);
};
