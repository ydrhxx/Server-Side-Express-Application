// Set the current environment; default to 'development' if not specified
const environment = process.env.NODE_ENV || 'development';

// Load the corresponding configuration from knexfile.js
const config = require('../../knexfile.js')[environment];

// Export a Knex instance configured for the current environment
module.exports = require('knex')(config);