import Sql from 'sql';
import Node from 'sql/lib/node';

// FIXME: this currently only supports sqlite
export const LAST_ID = 'last_insert_rowid() as lastId';

let Database = {};
Database.executeQuery = (query, callback) => callback(new Error('Not implemented'));
Database.exec = (node, callback) => Database.executeQuery(node.toQuery(), callback);

Database.setup = function ({ dialect, executeQuery }) {

  Sql.setDialect(dialect);
  Database.executeQuery = executeQuery;
};

export default Database;
