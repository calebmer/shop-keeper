// @see `demo/models/person.js` for a more detailed overview

var v = require('data-guard').v;
var Api = require('../api');
var Person = require('./person');

var Post = module.exports = Api.define({
  name: 'post',
  access: {
    accountable: 'authorId',
    terse: ['headline', 'authorId', 'createdAt'],
    public: ['updatedAt']
  },
  validate: {
    headline: [v.isType('string'), v.required(), v.minLength(4), v.maxLength(256)],
    authorId: [v.isType('number'), v.required()] // TODO: exists
  },

  // Specifies what tables are joined to each other
  joins: [{
    // The `authorId` is joined at the author name, it is a `Person`
    name: 'author',
    property: 'authorId',
    collection: Person
  }],

  table: {
    columns: [{
      name: 'headline',
      dataType: 'varchar(256)',
      notNull: true
    }, {
      name: 'authorId',
      dataType: 'integer',
      notNull: true,
      references: {
        table: 'person',
        column: 'id',
        onDelete: 'cascade'
      }
    }]
  }
});

module.exports = Post;
