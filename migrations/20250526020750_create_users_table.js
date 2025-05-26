/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.string('email').primary();
    table.string('password').notNullable();
    table.string('firstName').nullable();
    table.string('lastName').nullable();
    table.date('dob').nullable();
    table.string('address').nullable();
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
