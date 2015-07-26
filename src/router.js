import _ from 'lodash';
import Database from './database';
import { CollectionEndpoint, RecordEndpoint } from './endpoint';

export const RECORD_ID = Symbol('recordId');

class Router {
  constructor() {

    this.table = [];
  }
  buildTable(collections) {

    collections.forEach(collection => {

      this.table.push({
        route: [collection.name],
        endpoint: new CollectionEndpoint(collection)
      });

      this.table.push({
        route: [collection.name, RECORD_ID],
        endpoint: new RecordEndpoint(collection)
      });

      collection.joins.forEach(join => {

        {
          let endpoint = new RecordEndpoint(join.collection);

          endpoint.getRecordId = function (req, callback) {

            Database.exec(
              collection.table
              .select(collection.table[join.property])
              .where(collection.table.id.equals(req.recordId))
              .limit(1),
              (error, [record]) => {

                if (error) { return callback(error); }
                if (!record) { return callback(_.extend(new Error('Base record could not be found'), { statusCode: 404 })); }
                callback(null, record[join.property]);
              }
            );
          };

          endpoint.delete = (req, res, next) =>
            next(_.extend(new Error('Cannot delete from a forward join endpoint'), { statusCode: 403 }));

          this.table.push({
            route: [collection.name, RECORD_ID, join.name],
            endpoint
          });
        }

        if (join.reverse) {
          let endpoint = new CollectionEndpoint(collection);

          endpoint.getConstraint = (req, callback) =>
            callback(null, { [join.property]: req.recordId });

          this.table.push({
            route: [join.collection.name, RECORD_ID, join.reverse],
            endpoint
          });
        }
      });
    });
  }
  findEndpoint(req) {

    return (_.find(this.table, tableItem => {

      let route = [];
      let recordIdFragment = false;

      tableItem.route.forEach(fragment => {

        if (fragment === RECORD_ID) {
          if (recordIdFragment) { throw new Error('There can only be one record id fragment'); }
          recordIdFragment = true;
          route.push('([^/]+)');
          return;
        }

        route.push(_.escapeRegExp(fragment));
      });

      route = new RegExp(`^\\/${route.join('\\/')}\\/?$`);

      let match = route.exec(req.pathname);
      if (match) {
        let [, recordId] = match;
        req.recordId = parseInt(recordId);
        return true;
      }

      return false;
    }) || {}).endpoint;
  }
}

export default Router;
