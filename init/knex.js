var Knex = require('knex');

var knex = Knex.initialize({
	client: 'mysql',
	connection: {
		host     : '127.0.0.1',
	    user     : 'root',
	    password : 'scooter2',
	    database : 'mvideos',
	    charset  : 'utf8'
	}
});

module.exports = knex;