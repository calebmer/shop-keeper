import _ from 'lodash';
import Async from 'async';
import {exec} from '../database';
import { selectJoins, denormalizeExec } from '../query';
import Endpoint from './endpoint';

class RecordEndpoint extends Endpoint {
  constructor(collection) { super(collection); }
  getRecordId({recordId}, callback) { return callback(null, recordId); }
  before(req, res, next) {

    let {table} = this.collection;
    let recordId;

    Async.waterfall([
      done => this.getRecordId(req, done),
      (theRecordId, done) => {

        recordId = theRecordId;
        req.recordId = recordId;
        done();
      },

      done =>
        table
        .select(table.id)
        .where(table.id.equals(recordId))
        .limit(1)
        ::exec(done),
      ([record], done) => {

        if (!record) { return done(_.extend(new Error('Record not found'), { statusCode: 404 })); }
        res.setHeader('Record-Id', recordId);
        done();
      }
    ], next);
  }
  ensureAccountability(req, next) {

    let { access, table } = this.collection;
    let { body, recordId, accountableId } = req;

    Async.waterfall([
      done => access.isAccountable(accountableId || -1, recordId, table, done),
      (isAccountable, done) => {

        if (!isAccountable) {
          return done(_.extend(new Error('Not authorized to make request'), { statusCode: 401 }));
        }

        done();
      },
    ], next);
  }
  get(req, res, next) {

    let { access, table } = this.collection;
    let { accountableId, recordId } = req;
    let level = 'public';
    let record;

    Async.waterfall([
      done => access.isAccountable(accountableId || -1, recordId, table, done),
      (isAccountable, done) => {

        level = isAccountable ? 'private' : 'public';
        res.setHeader('Record-Accountable', isAccountable ? 1 : 0);
        done();
      },

      done =>
        table
        .select(access.getProperties(level).map(property => table[property]))
        ::selectJoins(this.collection, level)
        .where(table.id.equals(recordId))
        .limit(1)
        ::denormalizeExec(done),
      ([foundRecord], done) => { record = foundRecord; done(); },

      done => this.collection.executeHook('read', record, done),

      done => {

        let response = JSON.stringify(record);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': response.length
        });
        done(null, response);
      }
    ], next);
  }
  patch(req, res, next) {

    let { body, recordId } = req;
    let patch = body;

    Async.waterfall([
      done => this.ensureAccountability(req, done),

      done => this.collection.validator.checkObject(patch, {
        collection: this.collection,
        isPatch: true
      }, done),
      (errors, done) => {

        if (errors.length > 0) {
          let error = new Error('Patch failed validation');
          error.statusCode = 400;
          error.validationErrors = errors;
          return done(error);
        }

        done();
      },

      done => this.collection.executeHook('update', patch, done),

      done =>
        this.collection.table
        .update(patch)
        .where(this.collection.table.id.equals(recordId))
        ::exec(done),
      (results, done) => {

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': 0
        });
        done();
      }
    ], next);
  }
  delete(req, res, next) {

    let {table} = this.collection;
    let {recordId} = req;

    Async.waterfall([
      done => this.ensureAccountability(req, done),

      done => this.collection.executeHook('delete', { id: recordId }, done),

      done =>
        table
        .select(table.star())
        .where(table.id.equals(recordId))
        .limit(1)
        ::exec(done),
        // TODO: consider not selecting this document and only sending
        // { id: recordId } to the hook
      ([record], done) => this.collection.executeHook('delete', record, done),

      done =>
        table
        .delete()
        .where(table.id.equals(recordId))
        ::exec(done),
      (results, done) => {

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': 0
        });
        done();
      }
    ], next);
  }
}

export default RecordEndpoint;
