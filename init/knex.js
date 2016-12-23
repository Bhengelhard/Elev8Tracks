var Knex = require('knex');
//test
var knex = Knex.initialize({
	client: 'postgresql',
	connection: {
		host     : 'ec2-54-243-218-37.compute-1.amazonaws.com',
	    user     : 'ktnkvwfvkbgwnb',
	    password : 'mmhtn8vNbOggjVcKsm8BJx2Q-A',
	    database : 'd4mo9hmb7qm1gd',
	    charset  : 'utf8'
	}
});

module.exports = knex;