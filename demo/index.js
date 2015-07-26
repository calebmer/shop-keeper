var setup = require('./migrate/setup');
var Server = require('./server');

var PORT = 3000;

// Setup the tables first
setup(function (error) {

  if (error) { throw error; }

  // Listen and then log to console
  Server.listen(PORT, function () {

    console.log('Server listening at port ' + PORT);
  });
});
