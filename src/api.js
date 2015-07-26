import Database from './database';
import Router from './router';
import Collection from './collection';
import {middleware} from './middleware';

class Api {
  static database({ dialect, executeQuery }) {

    Database.setDialect(dialect);
    Database.executeQuery = executeQuery;
  }
  constructor() {

    this.collections = new Map();
    this.router = new Router();

    // Should be overriden
    this.getAccountable = (req, done) => done(null, -1);
  }
  register(collection) {

    this.collections.set(collection.name, collection);
  }
  define(collection) {

    collection = new Collection(collection);
    this.register(collection);
    return collection;
  }
  // `connect`/`express` support
  middleware(httpMode = false) {

    this.router.buildTable(this.collections);
    return (this)::(middleware(httpMode));
  }
  // `http` support
  requestListener() {

    return (req, res) => {

      this.middleware(true)(req, res, error => {

        if (!error) {
          error = new Error('Not found');
          error.statusCode = 404;
        }

        let statusCode = error.statusCode || 500;
        if (statusCode === 500) { console.error(error.stack); }
        let response = JSON.stringify({
          name: error.name,
          message: error.message,
          validationErrors: error.validationErrors
        });

        res.writeHead(statusCode, {
          'Content-Type': 'application/json',
          'Content-Length': response.length
        });
        res.end(response);
      });
    };
  }
  // TODO: `express`/`restify` support
  // inject(server) {}
}

export default Api;
