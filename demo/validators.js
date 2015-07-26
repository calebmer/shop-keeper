// The following are custom validators which will work nicely with `data-guard`

exports.uniqueEmail = function (email, callback) {

  if (this.isPatch) { return callback(null, true); }

  // Watch out for circular dependencies!
  var Person = require('./models/person');

  Person.table
  .select(Person.table.id)
  .where(Person.table.email.equals(email))
  .limit(1)
  .exec(function (error, records) {

    if (error) { return callback(error); }
    var record = records[0];
    callback(null, record ? (false) : true);
  });
};

// Add properties to the validator for a custom message
exports.uniqueEmail.properties = { name: 'unique' };
