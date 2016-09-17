var Knex = require('knex');

var knex = Knex.initialize({
	client: 'postgresql',
	connection: {
		host     : 'ec2-174-129-1-179.compute-1.amazonaws.com',
	    user     : 'imggxboqaxmptt',
	    password : 'phNpSipbNZtb2MlmdGA_EbmSUM',
	    database : 'd6d185sef5pibr',
	    charset  : 'utf8'
	}
});

module.exports = knex;