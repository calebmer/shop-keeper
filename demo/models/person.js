var v = require('data-guard').v;
var Api = require('../api');
var v2 = require('../validators');

var Person = module.exports = Api.define({
  // This will be the name of the route and the table unless otherwise specified
  name: 'person',

  access: {
    // The accountable fields give the id access to private properties
    accountable: 'id',

    // Used for denormalized data and lists
    terse: ['givenName', 'createdAt'],

    // Everyone can see these at the record endpoint
    public: ['familyName'],

    // Only accountable users can see this
    private: ['email']
  },

  // The data validator @see `data-guard` module
  validate: {
    givenName: [v.isType('string'), v.required(), v.minLength(2), v.maxLength(64), v.match(/^[^\s][^\n]+[^\s]$/)],
    familyName: [v.isType('string'), v.minLength(2), v.maxLength(64), v.match(/^[^\s][^\n]+[^\s]$/)],
    email: [v.isType('string'), v.required(), v.minLength(4), v.maxLength(256), v.format('email'), v2.uniqueEmail],
    password: [v.isType('string'), v.minLength(6), v.maxLength(512), v.match(/[^a-z0-9]/i)]
  },

  // The table defintion @see `sql` module
  table: {
    columns: [{
      name: 'givenName',
      dataType: 'varchar(64)',
      notNull: true
    }, {
      name: 'familyName',
      dataType: 'varchar(64)'
    }, {
      name: 'email',
      dataType: 'varchar(64)',
      notNull: true
    }, {
      name: 'password',
      dataType: 'binary(60)'
    }]
  }
});

// Hooks into the create process. Normally you would want to encrypt the password,
// here we will just convert it to upper case
Person.onCreate(function (record, next) {

  if (!record.password) { return next(); }
  record.password = record.password.toUpperCase();
  next();
});
