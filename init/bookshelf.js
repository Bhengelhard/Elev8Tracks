var Bookshelf = require('bookshelf');

var bookshelf = Bookshelf.initialize(require('./knex'));

module.exports = bookshelf;