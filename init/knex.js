
var Knex = require('knex');


//Localhost

// var knex = Knex.initialize({
// 	client: 'mysql',
// 	connection: {
// 		host     : '127.0.0.1',
// 	    user     : 'root',
// 	    password : 'scooter2',
// 	    database : 'mvideos',
// 	    charset  : 'utf8'
// 	}
// });

// module.exports = knex;


//ClearDB

var knex = Knex.initialize({
	client: 'mysql',
	connection: {
		host     : 'us-cdbr-iron-east-04.cleardb.net',
	    user     : 'ba1c3ac82c2e46',
	    password : '451d09c4',
	    database : 'heroku_2dd821b4ac58212',
	    charset  : 'utf8'
	}
});

module.exports = knex;




// Postgresql Crimson

// var knex = Knex.initialize({
// 	client: 'postgresql',
// 	connection: {
// 		host     : 'ec2-54-243-218-37.compute-1.amazonaws.com',
// 	    user     : 'ktnkvwfvkbgwnb',
// 	    password : 'mmhtn8vNbOggjVcKsm8BJx2Q-A',
// 	    database : 'd4mo9hmb7qm1gd',
// 	    charset  : 'utf8'
// 	}
// });

// module.exports = knex;