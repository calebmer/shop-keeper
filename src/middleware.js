import _ from 'lodash';
import Url from 'url';
import Async from 'async';
import BodyParser from 'body-parser';

export const METHODS = ['post', 'get', 'head', 'patch', 'delete'];
export const WRITE_METHODS = ['post', 'patch'];
export let JsonParser = BodyParser.json();

export function middleware(req, res, next) {

  let method = req.method.toLowerCase();
  let bodyLess = method === 'head';
  if (method === 'head') { method = 'get'; }

  // TODO: code `405` requires an `Allow` header @see http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
  if (!_.contains(METHODS, method)) {
    return next(_.extend(new Error(`'${method.toUpperCase()}' method not allowed`), { statusCode: 405 }));
  }

  let { query, pathname } = Url.parse(req.url, true);
  let success = false;
  let endpoint;
  let handler;
  let before;

  req.query = query;
  req.pathname = pathname;

  endpoint = this.router.findEndpoint(req);
  if (endpoint) {
    before = endpoint.before;
    handler = endpoint[method];
  }

  Async.series([
    // Parse json if it has not been already
    done => {

      if (!_.contains(WRITE_METHODS, method)) { return done(); }

      if (req.headers['content-type'] !== 'application/json') {
        return next(_.extend(new Error('Invalid content type, request body must be json'), { statusCode: 406 }));
      }

      // If body is not parsed, parse it
      (!req.body ? JsonParser(req, res, done) : done());
    },
    // Get the accountable id
    done => this.getAccountable(req, (error, accountableId) => {

      if (error) { return done(error); }
      req.accountableId = accountableId;
      done();
    }),
    // Execute the before hook
    done => before ? endpoint::before(req, res, done) : done(),
    // Execute the endpoint handler
    done => {

      if (!handler) {
        if (!endpoint) { return done(); }
        return done(_.extend(new Error(`'${method.toUpperCase()}' not implemented`), { statusCode: 501 }));
      }

      // We ask for the response to be returned instead of doing `res.send` in
      // the endpoint, so that if the method is `head` we can catch the
      // response before it is sent. Also we can gzip/cache and many other
      // neat things this way.
      endpoint::handler(req, res, (error, response) => {

        if (error) { return done(error); }
        res.end(bodyLess ? (null) : response);
        success = true;
        done();
      });
    }
  ], error => success ? (null) : next(error));
}
