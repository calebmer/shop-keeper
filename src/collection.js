import _ from 'lodash';
import Async from 'async';
import Pluralize from 'pluralize';
import {Validator} from 'data-guard';
import Sql from 'sql';
import Access from './access';

class Collection {
  constructor({ name, table, joins, validate, access, ...options }) {

    _.defaults(options, {
      id: true,
      timestamps: true
    });

    this.name = name;
    this.hooks = {};
    this.validator = new Validator(validate);
    this.joins = [];
    (joins || []).forEach(::this.addJoin);
    access.terse.unshift('id');
    this.access = new Access(access);

    if (options.id) {
      table.columns.unshift({
        name: 'id',
        dataType: 'integer',
        type: 'serial',
        notNull: true,
        primaryKey: true
      });
    }

    if (options.timestamps) {
      table.columns.push({
        name: 'createdAt',
        dataType: 'timestamp'
      });

      table.columns.push({
        name: 'updatedAt',
        dataType: 'timestamp'
      });

      this.onCreate((record, next) => {

        record.createdAt = (new Date()).toISOString();
        record.updatedAt = (new Date()).toISOString();
        next();
      });

      this.onUpdate((record, next) => {

        record.updatedAt = (new Date()).toISOString();
        next();
      });
    }

    this.table = Sql.define(_.defaults(table, {name}));
  }
  addJoin(join) {
    // TODO: test this
    if (join.collection === 'self') { join.collection = this; }
    if (!(join.collection instanceof Collection)) { throw new Error('Must join property to a collection'); }

    _.defaults(join, {
      name: this.name,
      reverse: Pluralize(this.name)
    });

    if (_.find(this.joins, otherJoin => otherJoin.name === join.name)) {
      throw new Error('Cannot have two joins with the same name');
    }

    this.joins.push(join);
  }
  onHook(hook, callback) {

    if (!this.hooks[hook]) { this.hooks[hook] = []; }
    this.hooks[hook].push(callback);
  }
  executeHook(hook, record, done) {

    Async.each(this.hooks[hook] || [], (callback, next) => {

      if (callback.length > 1) { return callback(record, next); }
      callback(record);
      next();
    }, done);
  }
}

['create', 'read', 'update', 'delete'].forEach(hook =>
  Collection.prototype[_.camelCase(`on ${hook}`)] = function (callback) {

    this.onHook(hook, callback);
  });

export default Collection;
