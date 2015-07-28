import _ from 'lodash';
import Async from 'async';
import Sql from 'sql';
import { LAST_ID, exec } from '../database';
import { selectJoins, denormalizeExec } from '../query';
import Endpoint from './endpoint';

class CollectionEndpoint extends Endpoint {
  constructor(collection, where = {}) {

    super(collection);
    this.where = where;
    this.getConstraint = (req, callback) => callback();
  }
  before(req, res, next) {

    this.getConstraint(req, (error, constraint) => {

      if (error) { return next(error); }
      req.constraint = constraint;
      next();
    });
  }
  post(req, res, next) {

    let { body, accountableId } = req;
    let record = body;
    _.extend(record, req.constraint);
    let accountables = this.collection.access.accountable;

    if (accountableId && accountables.length === 1) {
      let [accountable] = accountables;
      record[accountable] = accountableId;
    }

    Async.waterfall([
      done => this.collection.validator.checkObject(record, {
        collection: this.collection }, done),
      (errors, done) => {

        if (errors.length > 0) {
          let error = new Error('Document failed validation');
          error.statusCode = 400;
          error.validationErrors = errors;
          return done(error);
        }

        done();
      },

      done => this.collection.executeHook('create', record, done),

      done =>
        this.collection.table
        .insert(record)
        ::exec(done),
      (results, done) => done(),

      done =>
        this.collection.table
        .select(LAST_ID)
        .limit(1)
        ::exec(done),
      ([{lastId}], done) => {

        res.writeHead(201, {
          'Content-Type': 'application/json',
          'Content-Length': 0,
          'Accepts': 'application/json',
          'Record-Id': lastId
        });

        done();
      }
    ], next);
  }
  get(req, res, next) {

    let { table, access } = this.collection;
    let { limit, page, order } = req.query;

    limit = parseInt(limit) || 16;

    if (page === 'first') { page = 0; }
    if (page === 'last')  { page = -1; }

    page = parseInt(page) || 0;

    order = order || (table.createdAt ? '-createdAt,-id' : '');
    order = _.compact(order.split(','));
    order = order.map(orderItem => {

      let direction = 'asc';
      if (_.startsWith(orderItem, '-')) {
        orderItem = orderItem.substr(1);
        direction = 'desc';
      }
      // TODO: find a different limiter?
      // if (!_.contains(access.getProperties('terse'), orderItem)) {
      //   throw new Error(`Cannot sort by '${orderItem}' property`);
      // }
      return table[orderItem][direction];
    });

    Async.waterfall([
      done =>
        table
        .select('COUNT(*) as count')
        .where(req.constraint || '1 = 1')
        ::exec(done),
      ([{count}], done) => {

        let lastPage = count === 0 ? 0 : Math.ceil(count / limit) - 1;
        if (page < 0) { page += lastPage + 1; }
        if (page < 0 || page > lastPage) {
          return done(_.extend(new Error('Page out of range'), { statusCode: 400 }));
        }

        done();
      },

      done =>
        table
        .select(access.getProperties('terse').map(property => table[property]))
        .where(req.constraint || '1 = 1')
        ::selectJoins(this.collection, 'terse')
        .order(order)
        .limit(limit)
        .offset(limit * page)
        ::denormalizeExec(done),
      (records, done) => {

        let response = JSON.stringify(records);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': response.length
        });

        done(null, response);
      }
    ], next);
  }
}

export default CollectionEndpoint;
