/**
 * This migration creates the 'Users' table in the database.
 * It defines columns such as email, password, firstName, lastName, dob, and address.
 * The 'email' field is set as the primary key, and 'password' is required.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  
};


exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.string('email').primary(); // Primary key: unique email for each user
    table.string('password').notNullable(); // Required password field
    table.string('firstName').nullable(); // Optional first name
    table.string('lastName').nullable();  // Optional last name
    table.date('dob').nullable();         // Optional date of birth
    table.string('address').nullable();   // Optional address
  });
};

/**
 * This migration reverses the above change.
 * It drops the 'users' table from the database if it exists.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
