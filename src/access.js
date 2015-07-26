import _ from 'lodash';
import Database from './database';
import { sendToTop, sendToBottom } from './utils';

const LEVELS = ['terse', 'public', 'private'];

class Access {
  constructor(rules = {}) {

    _.defaults(rules, {
      accountable: [],
      terse: [],
      public: [],
      private: []
    });

    if (!_.isArray(rules.accountable)) {
      rules.accountable = [rules.accountable];
    }

    _.extend(this, rules);
  }
  getProperties(level) {

    if (!_.contains(LEVELS, level)) { throw new Error(`'${level}' is not a valid level`); }

    let properties = this.terse;

    if (level !== 'terse') { properties = properties.concat(this.public); }
    if (level === 'private') { properties = properties.concat(this.private); }

    // Some output asthetics thinking
    sendToTop(properties, 'id');
    sendToBottom(properties, 'createdAt');
    sendToBottom(properties, 'updatedAt');

    return properties;
  }
  isAccountable(accountableId, recordId, table, callback) {

    if (this.accountable.length === 0) { return callback(null, false); }

    let query = table.select(table.id);

    query.where(table.id.equals(recordId).and((() => {

      let where;

      this.accountable
      .map(accountable =>
        table[accountable].equals(accountableId))
      .forEach(check =>
        where ? where = where.or(check) : where = check);

      return where;
    })()));

    Database.exec(
      query
      .limit(1),
      (error, [record]) => {

        if (error) { return callback(error); }
        callback(null, record ? (true) : false);
      }
    );
  }
}

export default Access;
